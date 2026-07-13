<?php

namespace Tests\Unit;

use App\Models\Outlet;
use App\Models\OutletSetting;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OutletSettingModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_defaults_returns_array_with_all_keys(): void
    {
        $defaults = OutletSetting::defaults();
        $this->assertArrayHasKey('operating_hours', $defaults);
        $this->assertArrayHasKey('receipt_header', $defaults);
        $this->assertArrayHasKey('receipt_footer', $defaults);
        $this->assertArrayHasKey('paper_width', $defaults);
        $this->assertArrayHasKey('font_type', $defaults);
        $this->assertArrayHasKey('show_pbjt', $defaults);
        $this->assertArrayHasKey('show_service_charge', $defaults);
        $this->assertArrayHasKey('show_ppn', $defaults);
        $this->assertArrayHasKey('printer_ip', $defaults);
        $this->assertArrayHasKey('printer_port', $defaults);
        $this->assertArrayHasKey('auto_print_on_order', $defaults);
        $this->assertArrayHasKey('kds_display_mode', $defaults);
        $this->assertArrayHasKey('kds_alert_minutes', $defaults);
    }

    public function test_default_operating_hours_has_all_days(): void
    {
        $hours = OutletSetting::defaultOperatingHours();
        $this->assertArrayHasKey('mon', $hours);
        $this->assertArrayHasKey('tue', $hours);
        $this->assertArrayHasKey('wed', $hours);
        $this->assertArrayHasKey('thu', $hours);
        $this->assertArrayHasKey('fri', $hours);
        $this->assertArrayHasKey('sat', $hours);
        $this->assertArrayHasKey('sun', $hours);
    }

    public function test_default_operating_hours_format(): void
    {
        $hours = OutletSetting::defaultOperatingHours();
        $this->assertEquals('08:00', $hours['mon']['open']);
        $this->assertEquals('22:00', $hours['mon']['close']);
        $this->assertFalse($hours['mon']['closed']);
    }

    public function test_is_open_now_returns_true_when_no_operating_hours(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $outlet = Outlet::create(['tenant_id' => $tenant->id, 'name' => 'Outlet', 'address' => 'Jl. Test']);
        $setting = OutletSetting::create([
            'outlet_id' => $outlet->id,
            'operating_hours' => null,
        ]);

        $this->assertTrue($setting->isOpenNow());
    }

    public function test_is_open_now_returns_false_when_closed_today(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $outlet = Outlet::create(['tenant_id' => $tenant->id, 'name' => 'Outlet', 'address' => 'Jl. Test']);

        $dayKey = strtolower(now()->format('D'));
        $hours = OutletSetting::defaultOperatingHours();
        $hours[$dayKey]['closed'] = true;

        $setting = OutletSetting::create([
            'outlet_id' => $outlet->id,
            'operating_hours' => $hours,
        ]);

        $this->assertFalse($setting->isOpenNow());
    }

    public function test_to_public_schedule_array(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $outlet = Outlet::create(['tenant_id' => $tenant->id, 'name' => 'Outlet', 'address' => 'Jl. Test']);
        $setting = OutletSetting::create([
            'outlet_id' => $outlet->id,
        ]);

        $array = $setting->toPublicScheduleArray();
        $this->assertArrayHasKey('is_open_now', $array);
        $this->assertArrayHasKey('operating_hours', $array);
    }

    public function test_outlet_relation(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $outlet = Outlet::create(['tenant_id' => $tenant->id, 'name' => 'Outlet', 'address' => 'Jl. Test']);
        $setting = OutletSetting::create([
            'outlet_id' => $outlet->id,
        ]);

        $this->assertEquals($outlet->id, $setting->outlet->id);
    }

    public function test_casts(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $outlet = Outlet::create(['tenant_id' => $tenant->id, 'name' => 'Outlet', 'address' => 'Jl. Test']);
        $setting = OutletSetting::create([
            'outlet_id' => $outlet->id,
            'printer_port' => 9100,
            'kds_alert_minutes' => 10,
            'show_pbjt' => true,
            'auto_print_on_order' => false,
        ]);

        $this->assertIsInt($setting->printer_port);
        $this->assertIsInt($setting->kds_alert_minutes);
        $this->assertIsBool($setting->show_pbjt);
        $this->assertIsBool($setting->auto_print_on_order);
    }
}
