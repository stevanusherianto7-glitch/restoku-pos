<?php

namespace App\Services;

use App\Models\Order;
use App\Models\SalesDailyRollup;
use App\Models\SalesMonthlyRollup;
use App\Models\Scopes\TenantScope;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

/**
 * Fase 3.2 — SalesRollupService.
 *
 * Hitung agregat penjualan dari tabel orders dan simpan ke tabel rollup.
 * Dipanggil oleh command sales:rollup (harian via scheduler) + endpoint dashboard.
 *
 * Arsitektur: dashboard owner BACA rollup (O(1) per hari), BUKAN scan 25jt orders.
 */
class SalesRollupService
{
    /**
     * Bangun rollup harian untuk 1 hari (default kemarin).
     * Idempoten: upsert berdasarkan unique(tenant_id, outlet_id, date).
     */
    public function buildDaily(Carbon $date, ?int $tenantId = null, ?int $outletId = null): void
    {
        $query = Order::withoutGlobalScope(TenantScope::class)
            ->whereDate('created_at', $date);

        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }
        if ($outletId) {
            $query->where('outlet_id', $outletId);
        }

        // Agregat per (tenant, outlet)
        $rows = $query->select(
            'tenant_id',
            'outlet_id',
            DB::raw('COUNT(*) as order_count'),
            DB::raw('SUM(subtotal + tax_amount + service_charge_amount - discount_amount) as net'),
            DB::raw('SUM(subtotal + tax_amount + service_charge_amount) as gross'),
            DB::raw('SUM(discount_amount) as discount'),
            DB::raw('SUM(tax_amount) as tax'),
            DB::raw('SUM(service_charge_amount) as service'),
        )->groupBy('tenant_id', 'outlet_id')->get();

        foreach ($rows as $r) {
            $avg = $r->order_count > 0 ? $r->net / $r->order_count : 0;
            SalesDailyRollup::withoutGlobalScope(TenantScope::class)->updateOrCreate(
                [
                    'tenant_id' => $r->tenant_id,
                    'outlet_id' => $r->outlet_id,
                    'date' => $date->toDateString(),
                ],
                [
                    'order_count' => $r->order_count,
                    'gross_revenue' => $r->gross,
                    'discount_total' => $r->discount,
                    'tax_total' => $r->tax,
                    'service_total' => $r->service,
                    'net_revenue' => $r->net,
                    'avg_order_value' => $avg,
                ]
            );
        }
    }

    /**
     * Rollup dari daily → monthly untuk 1 bulan.
     */
    public function buildMonthly(int $year, int $month, ?int $tenantId = null): void
    {
        $query = SalesDailyRollup::withoutGlobalScope(TenantScope::class)
            ->whereYear('date', $year)
            ->whereMonth('date', $month);
        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        $rows = $query->select(
            'tenant_id',
            'outlet_id',
            DB::raw('SUM(order_count) as order_count'),
            DB::raw('SUM(gross_revenue) as gross'),
            DB::raw('SUM(discount_total) as discount'),
            DB::raw('SUM(tax_total) as tax'),
            DB::raw('SUM(service_total) as service'),
            DB::raw('SUM(net_revenue) as net'),
        )->groupBy('tenant_id', 'outlet_id')->get();

        foreach ($rows as $r) {
            $avg = $r->order_count > 0 ? $r->net / $r->order_count : 0;

            SalesMonthlyRollup::withoutGlobalScope(TenantScope::class)->updateOrCreate(
                [
                    'tenant_id' => $r->tenant_id,
                    'outlet_id' => $r->outlet_id,
                    'year' => $year,
                    'month' => $month,
                ],
                [
                    'order_count' => $r->order_count,
                    'gross_revenue' => $r->gross,
                    'discount_total' => $r->discount,
                    'tax_total' => $r->tax,
                    'service_total' => $r->service,
                    'net_revenue' => $r->net,
                    'avg_order_value' => $avg,
                ]
            );
        }
    }

    /**
     * Ambil ringkasan untuk dashboard owner (baca rollup, bukan orders).
     */
    public function dashboardSummary(int $tenantId, ?int $outletId = null, int $days = 30): array
    {
        $query = SalesDailyRollup::where('tenant_id', $tenantId)
            ->where('date', '>=', now()->subDays($days));
        if ($outletId) {
            $query->where('outlet_id', $outletId);
        }

        $agg = $query->select(
            DB::raw('SUM(order_count) as total_orders'),
            DB::raw('SUM(net_revenue) as total_net'),
            DB::raw('SUM(gross_revenue) as total_gross'),
        )->first();

        return [
            'period_days' => $days,
            'total_orders' => (int) ($agg->total_orders ?? 0),
            'total_gross' => (float) ($agg->total_gross ?? 0),
            'total_net' => (float) ($agg->total_net ?? 0),
            'daily' => $query->orderBy('date')->get(['date', 'order_count', 'net_revenue']),
        ];
    }
}
