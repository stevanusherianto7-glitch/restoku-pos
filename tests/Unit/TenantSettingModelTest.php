<?php

namespace Tests\Unit;

use App\Models\Tenant;
use App\Models\TenantSetting;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantSettingModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_defaults_returns_array_with_all_keys(): void
    {
        $defaults = TenantSetting::defaults();
        $this->assertArrayHasKey('tax_type', $defaults);
        $this->assertArrayHasKey('pbjt_rate', $defaults);
        $this->assertArrayHasKey('ppn_rate', $defaults);
        $this->assertArrayHasKey('service_charge_rate', $defaults);
        $this->assertArrayHasKey('wa_notif_enabled', $defaults);
        $this->assertArrayHasKey('email_notif_enabled', $defaults);
    }

    public function test_active_tax_rate_attribute(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $setting = TenantSetting::create([
            'tenant_id' => $tenant->id,
            'tax_type' => 'ppn',
            'ppn_rate' => 11.00,
            'pbjt_rate' => 10.00,
        ]);

        $this->assertEquals(11.00, $setting->active_tax_rate);
    }

    public function test_active_tax_rate_returns_pbjt_for_non_ppn(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $setting = TenantSetting::create([
            'tenant_id' => $tenant->id,
            'tax_type' => 'pbjt',
            'ppn_rate' => 11.00,
            'pbjt_rate' => 10.00,
        ]);

        $this->assertEquals(10.00, $setting->active_tax_rate);
    }

    public function test_to_tax_shareable_array_active(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $setting = TenantSetting::create([
            'tenant_id' => $tenant->id,
            'tax_type' => 'ppn',
            'ppn_rate' => 11.00,
            'service_charge_rate' => 5.00,
        ]);

        $array = $setting->toTaxShareableArray();
        $this->assertTrue($array['is_tax_active']);
        $this->assertEquals('ppn', $array['tax_type']);
        $this->assertEquals(11.00, $array['tax_rate']);
        $this->assertEquals(5.00, $array['service_charge']);
    }

    public function test_to_tax_shareable_array_inactive(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $setting = TenantSetting::create([
            'tenant_id' => $tenant->id,
            'tax_type' => 'none',
        ]);

        $array = $setting->toTaxShareableArray();
        $this->assertFalse($array['is_tax_active']);
        $this->assertEquals(0, $array['tax_rate']);
        $this->assertEquals(0, $array['service_charge']);
    }

    public function test_tenant_relation(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $setting = TenantSetting::create([
            'tenant_id' => $tenant->id,
            'tax_type' => 'pbjt',
        ]);

        $this->assertEquals($tenant->id, $setting->tenant->id);
    }

    public function test_casts(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $setting = TenantSetting::create([
            'tenant_id' => $tenant->id,
            'tax_type' => 'pbjt',
            'pbjt_rate' => 10.00,
            'ppn_rate' => 11.00,
            'service_charge_rate' => 5.00,
            'wa_notif_enabled' => true,
            'email_notif_enabled' => false,
        ]);

        $this->assertIsFloat($setting->pbjt_rate);
        $this->assertIsFloat($setting->ppn_rate);
        $this->assertIsFloat($setting->service_charge_rate);
        $this->assertIsBool($setting->wa_notif_enabled);
        $this->assertIsBool($setting->email_notif_enabled);
    }
}
