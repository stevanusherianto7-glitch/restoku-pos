<?php

namespace Tests\Unit;

use App\Ai\Tools\TenantTaxConfigTool;
use App\Models\Tenant;
use App\Models\TenantSetting;
use App\Services\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Laravel\Ai\Tools\Request;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

class TenantTaxConfigToolTest extends TestCase
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
        $tool = new TenantTaxConfigTool($this->ctx);
        $this->assertNotEmpty($tool->description());
    }

    public function test_handle_returns_403_when_context_not_initialized(): void
    {
        $tool = new TenantTaxConfigTool(new TenantContext);
        $request = new Request([]);

        $this->expectException(HttpException::class);
        $tool->handle($request);
    }

    public function test_handle_returns_default_when_no_settings(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $this->ctx->setTenantId($tenant->id);

        $tool = new TenantTaxConfigTool($this->ctx);
        $request = new Request([]);

        $result = json_decode($tool->handle($request), true);

        $this->assertEquals('pbjt', $result['tax_type']);
        $this->assertEquals(10, $result['pbjt_rate']);
        $this->assertEquals(11, $result['ppn_rate']);
        $this->assertEquals(0, $result['service_charge_rate']);
        $this->assertTrue($result['is_active']);
    }

    public function test_handle_returns_settings_when_exists(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        TenantSetting::create([
            'tenant_id' => $tenant->id,
            'tax_type' => 'ppn',
            'ppn_rate' => 11.00,
            'pbjt_rate' => 10.00,
            'service_charge_rate' => 5.00,
        ]);

        $this->ctx->setTenantId($tenant->id);

        $tool = new TenantTaxConfigTool($this->ctx);
        $request = new Request([]);

        $result = json_decode($tool->handle($request), true);

        $this->assertEquals('ppn', $result['tax_type']);
        $this->assertEquals(11.00, $result['tax_rate']);
    }
}
