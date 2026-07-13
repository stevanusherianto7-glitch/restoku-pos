<?php

namespace Tests\Unit;

use App\Models\Outlet;
use App\Models\OutletSetting;
use App\Models\Tenant;
use App\Models\TenantSetting;
use App\Services\SettingsService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

class SettingsServiceTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private Outlet $outlet;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create([
            'name' => 'Resto Test',
            'brand_name' => 'Test',
            'email' => 't@test.com',
            'phone' => '081',
        ]);

        $this->outlet = Outlet::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Outlet Test',
            'address' => 'Jl. Test',
        ]);
    }

    public function test_for_tenant_creates_default_when_missing(): void
    {
        $service = new SettingsService;
        $settings = $service->forTenant($this->tenant->id);

        $this->assertInstanceOf(TenantSetting::class, $settings);
        $this->assertEquals($this->tenant->id, $settings->tenant_id);
        $this->assertEquals('pbjt', $settings->tax_type);
        $this->assertEquals(10.0, $settings->pbjt_rate);
        $this->assertDatabaseHas('tenant_settings', ['tenant_id' => $this->tenant->id]);
    }

    public function test_for_tenant_returns_cached_instance(): void
    {
        $service = new SettingsService;
        $settings1 = $service->forTenant($this->tenant->id);
        $settings2 = $service->forTenant($this->tenant->id);

        $this->assertEquals($settings1->id, $settings2->id);
    }

    public function test_for_tenant_clears_stale_cache(): void
    {
        $service = new SettingsService;
        $settings = $service->forTenant($this->tenant->id);

        // Simulate stale cache with __PHP_Incomplete_Class
        Cache::put("settings.tenant.{$this->tenant->id}", new \stdClass, 60);

        $settings2 = $service->forTenant($this->tenant->id);

        $this->assertInstanceOf(TenantSetting::class, $settings2);
        $this->assertEquals($settings->id, $settings2->id);
    }

    public function test_for_outlet_creates_default_when_missing(): void
    {
        $service = new SettingsService;
        $settings = $service->forOutlet($this->outlet->id);

        $this->assertInstanceOf(OutletSetting::class, $settings);
        $this->assertEquals($this->outlet->id, $settings->outlet_id);
        $this->assertEquals('80mm', $settings->paper_width);
        $this->assertDatabaseHas('outlet_settings', ['outlet_id' => $this->outlet->id]);
    }

    public function test_for_outlet_returns_cached_instance(): void
    {
        $service = new SettingsService;
        $settings1 = $service->forOutlet($this->outlet->id);
        $settings2 = $service->forOutlet($this->outlet->id);

        $this->assertEquals($settings1->id, $settings2->id);
    }

    public function test_save_tenant_settings_and_invalidates_cache(): void
    {
        $service = new SettingsService;
        $service->forTenant($this->tenant->id); // prime cache

        $result = $service->saveTenantSettings($this->tenant->id, [
            'tax_type' => 'ppn',
            'ppn_rate' => 11.0,
        ]);

        $this->assertEquals('ppn', $result->tax_type);
        $this->assertEquals(11.0, $result->ppn_rate);
        $this->assertNull(Cache::get("settings.tenant.{$this->tenant->id}"));
    }

    public function test_save_outlet_settings_and_invalidates_cache(): void
    {
        $service = new SettingsService;
        $service->forOutlet($this->outlet->id); // prime cache

        $result = $service->saveOutletSettings($this->outlet->id, [
            'receipt_header' => 'Toko Enak',
            'paper_width' => '58mm',
        ]);

        $this->assertEquals('Toko Enak', $result->receipt_header);
        $this->assertEquals('58mm', $result->paper_width);
        $this->assertNull(Cache::get("settings.outlet.{$this->outlet->id}"));
    }

    public function test_invalidate_tenant_clears_cache(): void
    {
        $service = new SettingsService;
        $service->forTenant($this->tenant->id); // prime cache

        $this->assertNotNull(Cache::get("settings.tenant.{$this->tenant->id}"));

        $service->invalidateTenant($this->tenant->id);

        $this->assertNull(Cache::get("settings.tenant.{$this->tenant->id}"));
    }

    public function test_invalidate_outlet_clears_cache(): void
    {
        $service = new SettingsService;
        $service->forOutlet($this->outlet->id); // prime cache

        $this->assertNotNull(Cache::get("settings.outlet.{$this->outlet->id}"));

        $service->invalidateOutlet($this->outlet->id);

        $this->assertNull(Cache::get("settings.outlet.{$this->outlet->id}"));
    }
}
