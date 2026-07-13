<?php

namespace Tests\Unit;

use App\Ai\Tools\MonthlyProfitSummaryTool;
use App\Models\Order;
use App\Models\Outlet;
use App\Models\Tenant;
use App\Services\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Ai\Tools\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class MonthlyProfitSummaryToolTest extends TestCase
{
    use RefreshDatabase;

    private TenantContext $ctx;

    protected function setUp(): void
    {
        parent::setUp();
        $this->ctx = app(TenantContext::class);
    }

    public function test_description_returns_string(): void
    {
        $tool = new MonthlyProfitSummaryTool($this->ctx);
        $this->assertNotEmpty($tool->description());
    }

    public function test_handle_returns_403_when_context_not_initialized(): void
    {
        $tool = new MonthlyProfitSummaryTool(new TenantContext);
        $request = new Request(['outlet_id' => 1]);

        $this->expectException(HttpException::class);
        $tool->handle($request);
    }

    public function test_handle_returns_profit_data(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $outlet = Outlet::create(['tenant_id' => $tenant->id, 'name' => 'Outlet', 'address' => 'Jl. Test']);

        $this->ctx->setTenantId($tenant->id);

        Order::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'outlet_id' => $outlet->id,
            'order_code' => 'ORD-001',
            'table_number' => '1',
            'status' => 'selesai',
            'payment_status' => 'paid',
            'total' => 100000,
        ]);

        $tool = new MonthlyProfitSummaryTool($this->ctx);
        $request = new Request(['outlet_id' => $outlet->id]);

        $result = json_decode($tool->handle($request), true);

        $this->assertArrayHasKey('periode_bulan', $result);
        $this->assertArrayHasKey('total_transaksi_berhasil', $result);
        $this->assertArrayHasKey('total_penjualan_revenue', $result);
        $this->assertArrayHasKey('estimasi_biaya_dan_cogs', $result);
        $this->assertArrayHasKey('keuntungan_berdih_net_profit', $result);
        $this->assertArrayHasKey('status_keuangan', $result);
        $this->assertArrayHasKey('is_profit', $result);
        $this->assertEquals(1, $result['total_transaksi_berhasil']);
        $this->assertTrue($result['is_profit']);
    }

    public function test_handle_returns_error_for_unknown_outlet(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $this->ctx->setTenantId($tenant->id);

        $tool = new MonthlyProfitSummaryTool($this->ctx);
        $request = new Request(['outlet_id' => 9999]);

        $result = json_decode($tool->handle($request), true);
        $this->assertArrayHasKey('error', $result);
    }
}
