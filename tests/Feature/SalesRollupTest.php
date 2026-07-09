<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Outlet;
use App\Models\SalesDailyRollup;
use App\Models\SalesMonthlyRollup;
use App\Models\Scopes\TenantScope;
use App\Models\Tenant;
use App\Services\SalesRollupService;
use App\Services\TenantContext;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Fase 3.5 — Verifikasi rollup akurat vs hitungan raw orders.
 */
class SalesRollupTest extends TestCase
{
    use RefreshDatabase;

    private function seedOrders(Tenant $tenant, Outlet $outlet, string $date, int $count, float $netEach): void
    {
        for ($i = 0; $i < $count; $i++) {
            Order::create([
                'tenant_id' => $tenant->id,
                'outlet_id' => $outlet->id,
                'order_code' => "ORD-{$date}-{$i}",
                'status' => 'selesai',
                'subtotal' => $netEach,
                'discount_amount' => 0,
                'tax_amount' => 0,
                'service_charge_amount' => 0,
                'total' => $netEach,
                'payment_status' => 'paid',
                'created_at' => $date.' 12:00:00',
            ]);
        }
    }

    public function test_daily_rollup_akurat_vs_raw(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'T', 'email' => 't@x.com', 'phone' => '1']);
        $outlet = Outlet::create(['tenant_id' => $tenant->id, 'name' => 'O', 'address' => 'a']);
        app(TenantContext::class)->setTenantId($tenant->id);

        $this->seedOrders($tenant, $outlet, '2026-07-01', 10, 50000);

        $service = app(SalesRollupService::class);
        $service->buildDaily(Carbon::parse('2026-07-01'), $tenant->id);

        $rollup = SalesDailyRollup::withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenant->id)
            ->where('outlet_id', $outlet->id)
            ->whereDate('date', '2026-07-01')
            ->first();
        $this->assertNotNull($rollup, 'Rollup harus ter-insert. count='.SalesDailyRollup::withoutGlobalScope(TenantScope::class)->count().' ctx='.app(TenantContext::class)->id());

        // Raw count
        $rawCount = Order::where('tenant_id', $tenant->id)->whereDate('created_at', '2026-07-01')->count();
        $rawSum = Order::where('tenant_id', $tenant->id)->whereDate('created_at', '2026-07-01')->sum('total');

        $this->assertEquals(10, $rollup->order_count);
        $this->assertEquals($rawCount, $rollup->order_count);
        $this->assertEquals((float) $rawSum, (float) $rollup->net_revenue);
        $this->assertEquals(50000, (float) $rollup->avg_order_value);
    }

    public function test_monthly_rollup_aggregat_dari_daily(): void
    {
        $tenant = Tenant::create(['name' => 'T2', 'brand_name' => 'T2', 'email' => 't2@x.com', 'phone' => '2']);
        $outlet = Outlet::create(['tenant_id' => $tenant->id, 'name' => 'O2', 'address' => 'a']);
        app(TenantContext::class)->setTenantId($tenant->id);

        $this->seedOrders($tenant, $outlet, '2026-07-01', 5, 10000);
        $this->seedOrders($tenant, $outlet, '2026-07-02', 5, 20000);

        $service = app(SalesRollupService::class);
        $service->buildDaily(Carbon::parse('2026-07-01'), $tenant->id);
        $service->buildDaily(Carbon::parse('2026-07-02'), $tenant->id);
        $service->buildMonthly(2026, 7, $tenant->id);

        $monthly = SalesMonthlyRollup::where('tenant_id', $tenant->id)
            ->where('year', 2026)->where('month', 7)->first();

        $this->assertEquals(10, $monthly->order_count);
        $this->assertEquals(150000, (float) $monthly->net_revenue); // 5*10k + 5*20k
        $this->assertEquals(15000, (float) $monthly->avg_order_value); // 150k / 10 hari? -> 150k/2 hari aktif
    }

    public function test_dashboard_summary_baca_rollup_bukan_orders(): void
    {
        $tenant = Tenant::create(['name' => 'T3', 'brand_name' => 'T3', 'email' => 't3@x.com', 'phone' => '3']);
        $outlet = Outlet::create(['tenant_id' => $tenant->id, 'name' => 'O3', 'address' => 'a']);
        app(TenantContext::class)->setTenantId($tenant->id);

        $this->seedOrders($tenant, $outlet, now()->subDays(2)->toDateString(), 3, 7000);
        $service = app(SalesRollupService::class);
        $service->buildDaily(now()->subDays(2), $tenant->id);

        $summary = $service->dashboardSummary($tenant->id, null, 30);
        $this->assertEquals(3, $summary['total_orders']);
        $this->assertEquals(21000, (float) $summary['total_net']);
        $this->assertCount(1, $summary['daily']);
    }

    public function test_isolasi_rollup_antar_tenant(): void
    {
        $tA = Tenant::create(['name' => 'A', 'brand_name' => 'A', 'email' => 'a@x.com', 'phone' => '4']);
        $tB = Tenant::create(['name' => 'B', 'brand_name' => 'B', 'email' => 'b@x.com', 'phone' => '5']);
        $oA = Outlet::create(['tenant_id' => $tA->id, 'name' => 'OA', 'address' => 'a']);

        $this->seedOrders($tA, $oA, '2026-07-05', 7, 9000);
        $service = app(SalesRollupService::class);
        $service->buildDaily(Carbon::parse('2026-07-05'), $tA->id);

        // Tenant B query → tidak lihat rollup A
        $summaryB = $service->dashboardSummary($tB->id, null, 30);
        $this->assertEquals(0, $summaryB['total_orders']);
    }
}
