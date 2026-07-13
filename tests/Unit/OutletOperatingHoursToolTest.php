<?php

namespace Tests\Unit;

use App\Ai\Tools\OutletOperatingHoursTool;
use App\Models\Outlet;
use App\Models\OutletSetting;
use App\Models\Tenant;
use App\Services\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Ai\Tools\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class OutletOperatingHoursToolTest extends TestCase
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
        $tool = new OutletOperatingHoursTool($this->ctx);
        $this->assertNotEmpty($tool->description());
    }

    public function test_handle_returns_403_when_context_not_initialized(): void
    {
        $tool = new OutletOperatingHoursTool(new TenantContext);
        $request = new Request(['outlet_id' => 1]);

        $this->expectException(HttpException::class);
        $tool->handle($request);
    }

    public function test_handle_returns_operating_hours(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $outlet = Outlet::create(['tenant_id' => $tenant->id, 'name' => 'Outlet', 'address' => 'Jl. Test']);
        OutletSetting::create([
            'outlet_id' => $outlet->id,
        ]);

        $this->ctx->setTenantId($tenant->id);

        $tool = new OutletOperatingHoursTool($this->ctx);
        $request = new Request(['outlet_id' => $outlet->id]);

        $result = json_decode($tool->handle($request), true);

        $this->assertArrayHasKey('outlet_id', $result);
        $this->assertArrayHasKey('operating_hours', $result);
        $this->assertEquals($outlet->id, $result['outlet_id']);
    }

    public function test_handle_returns_error_for_unknown_outlet(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $this->ctx->setTenantId($tenant->id);

        $tool = new OutletOperatingHoursTool($this->ctx);
        $request = new Request(['outlet_id' => 9999]);

        $result = json_decode($tool->handle($request), true);
        $this->assertArrayHasKey('error', $result);
    }

    public function test_handle_returns_error_when_no_settings(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $outlet = Outlet::create(['tenant_id' => $tenant->id, 'name' => 'Outlet', 'address' => 'Jl. Test']);

        $this->ctx->setTenantId($tenant->id);

        $tool = new OutletOperatingHoursTool($this->ctx);
        $request = new Request(['outlet_id' => $outlet->id]);

        $result = json_decode($tool->handle($request), true);
        $this->assertArrayHasKey('error', $result);
    }
}
