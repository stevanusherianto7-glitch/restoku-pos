<?php

namespace App\Services;

use App\Models\Order;
use App\Models\OrderArchive;
use App\Models\Scopes\TenantScope;
use Carbon\Carbon;

/**
 * Fase 4.3 — OrderArchiveService.
 *
 * Pindahkan orders yang layak arsip (>6 bulan, selesai/batal) dari tabel orders
 * ke orders_archive. Cold storage → partisi aktif orders tetap kecil & cepat.
 *
 * Idempoten: insert ignore by unique(tenant_id, order_code). Setelah pindah,
 * hapus dari orders. Jalan dalam chunk untuk hindari memory/lock besar.
 */
class OrderArchiveService
{
    public function archive(int $months = 6, ?int $tenantId = null, ?string $before = null, bool $dry = false): array
    {
        $beforeDate = $before ? Carbon::parse($before) : now()->subMonths($months);

        $query = Order::withoutGlobalScope(TenantScope::class)
            ->where('created_at', '<', $beforeDate)
            ->whereIn('status', [Order::STATUS_SELESAI, Order::STATUS_DIBATALKAN]);

        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        $total = $query->count();

        if ($dry) {
            return ['dry' => true, 'count' => $total, 'before' => $beforeDate->toDateString()];
        }

        $archived = 0;
        $query->orderBy('id')->chunkById(500, function ($orders) use (&$archived) {
            $rows = $orders->map(function (Order $o) {
                return array_merge(
                    $o->only([
                        'tenant_id', 'outlet_id', 'created_by', 'order_code', 'table_number',
                        'source', 'status', 'subtotal', 'discount_amount', 'tax_amount',
                        'service_charge_amount', 'total', 'payment_status', 'payment_method',
                        'paid_at', 'notes', 'void_reason', 'cancelled_at', 'created_at', 'updated_at',
                    ]),
                    ['archived_at' => now()]
                );
            })->all();

            // Insert ignore (idempoten via unique tenant_id+order_code)
            OrderArchive::withoutGlobalScope(TenantScope::class)
                ->upsert($rows, ['tenant_id', 'order_code'], array_keys($rows[0] ?? []));

            // Hapus dari orders (sudah aman di archive)
            $ids = $orders->pluck('id')->all();
            Order::withoutGlobalScope(TenantScope::class)->whereIn('id', $ids)->delete();

            $archived += count($ids);
        });

        return ['dry' => false, 'archived' => $archived, 'before' => $beforeDate->toDateString()];
    }

    /**
     * Hitung jumlah orders yang akan diarsip (estimasi, sebelum jalan).
     */
    public function pendingCount(int $months = 6, ?int $tenantId = null): int
    {
        $query = Order::withoutGlobalScope(TenantScope::class)
            ->where('created_at', '<', now()->subMonths($months))
            ->whereIn('status', [Order::STATUS_SELESAI, Order::STATUS_DIBATALKAN]);
        if ($tenantId) {
            $query->where('tenant_id', $tenantId);
        }

        return $query->count();
    }
}
