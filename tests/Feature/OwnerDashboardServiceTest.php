<?php

namespace Tests\Feature;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Outlet;
use App\Models\Tenant;
use App\Services\OwnerDashboardService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OwnerDashboardServiceTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private Outlet $outlet;

    private OwnerDashboardService $service;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create([
            'name' => 'Resto Dashboard',
            'brand_name' => 'Dashboard',
            'email' => 'dashboard@test.com',
            'phone' => '081111',
        ]);

        $this->outlet = Outlet::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Outlet Dashboard',
            'address' => 'Jl. Dashboard',
        ]);

        $this->service = app(OwnerDashboardService::class);
    }

    public function test_get_aggregate_metrics_today(): void
    {
        Order::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'order_code' => 'DASH-001',
            'table_number' => 'Meja 1',
            'source' => 'pos',
            'status' => Order::STATUS_SELESAI,
            'total' => 50000,
        ]);

        $metrics = $this->service->getAggregateMetrics($this->tenant->id, 'today');

        $this->assertEquals(50000, $metrics['total_revenue']);
        $this->assertEquals(1, $metrics['total_transactions']);
        $this->assertEquals(50000, $metrics['average_order_value']);
    }

    public function test_get_aggregate_metrics_month(): void
    {
        Order::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'order_code' => 'DASH-010',
            'table_number' => 'Meja 1',
            'source' => 'pos',
            'status' => Order::STATUS_SELESAI,
            'total' => 100000,
        ]);

        $metrics = $this->service->getAggregateMetrics($this->tenant->id, 'month');

        $this->assertEquals(100000, $metrics['total_revenue']);
    }

    public function test_get_outlet_leaderboard(): void
    {
        Order::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
            'order_code' => 'DASH-020',
            'table_number' => 'Meja 1',
            'source' => 'pos',
            'status' => Order::STATUS_SELESAI,
            'total' => 75000,
        ]);

        $leaderboard = $this->service->getOutletLeaderboard($this->tenant->id, 'today');

        $this->assertIsArray($leaderboard);
        // Find our outlet in the leaderboard
        $found = collect($leaderboard)->firstWhere('id', $this->outlet->id);
        $this->assertNotNull($found);
        $this->assertEquals(75000, $found['revenue']);
        $this->assertTrue($found['is_estimate']);
    }

    public function test_get_financial_report_returns_estimates(): void
    {
        Order::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'order_code' => 'DASH-030',
            'table_number' => 'Meja 1',
            'source' => 'pos',
            'status' => Order::STATUS_SELESAI,
            'total' => 200000,
        ]);

        $report = $this->service->getFinancialReport($this->tenant->id, 'month');

        $this->assertEquals(200000, $report['gross_profit']);
        $this->assertEquals(70000, $report['cogs_estimate']); // 35%
        $this->assertEquals(40000, $report['operational_expenses_estimate']); // 20%
        $this->assertEquals(90000, $report['net_profit_estimate']); // 200k - 70k - 40k
        $this->assertTrue($report['is_estimate']);
    }

    public function test_get_menu_performance(): void
    {
        $menu = MenuItem::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Nasi Goreng',
            'price' => 30000,
        ]);

        $order = Order::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'order_code' => 'DASH-040',
            'table_number' => 'Meja 1',
            'source' => 'pos',
            'status' => Order::STATUS_SELESAI,
            'total' => 60000,
        ]);

        OrderItem::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'order_id' => $order->id,
            'menu_item_id' => $menu->id,
            'item_name' => 'Nasi Goreng',
            'quantity' => 2,
            'unit_price' => 30000,
            'subtotal' => 60000,
        ]);

        $performance = $this->service->getMenuPerformance($this->tenant->id, 'today');

        $this->assertArrayHasKey('top_performers', $performance);
        $this->assertArrayHasKey('slow_movers', $performance);
        $this->assertCount(1, $performance['top_performers']);
    }
}
