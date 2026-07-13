<?php

namespace Tests\Unit;

use App\Models\Outlet;
use App\Models\OutletSetting;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OutletModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_set_name_attribute_auto_generates_slug(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $outlet = new Outlet;
        $outlet->tenant_id = $tenant->id;
        $outlet->name = 'Outlet Baru';
        $outlet->save();

        $this->assertNotEmpty($outlet->slug);
        $this->assertStringContainsString('outlet-baru', $outlet->slug);
    }

    public function test_set_name_does_not_overwrite_existing_slug(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $outlet = Outlet::create([
            'tenant_id' => $tenant->id,
            'name' => 'Outlet Lama',
            'slug' => 'custom-slug',
        ]);

        $outlet->name = 'Outlet Baru';
        $outlet->save();

        $this->assertEquals('custom-slug', $outlet->fresh()->slug);
    }

    public function test_resolve_settings_returns_defaults_when_no_settings(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $outlet = Outlet::create([
            'tenant_id' => $tenant->id,
            'name' => 'Outlet',
        ]);

        $resolved = $outlet->resolveSettings();
        $this->assertNull($resolved->receipt_header);
        $this->assertEquals('Terima kasih atas kunjungan Anda!', $resolved->receipt_footer);
    }

    public function test_tenant_relation(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $outlet = Outlet::create([
            'tenant_id' => $tenant->id,
            'name' => 'Outlet',
        ]);

        $this->assertEquals($tenant->id, $outlet->tenant->id);
    }

    public function test_outlet_settings_can_be_created_and_queried(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $outlet = Outlet::create([
            'tenant_id' => $tenant->id,
            'name' => 'Outlet',
        ]);

        OutletSetting::create([
            'outlet_id' => $outlet->id,
            'receipt_footer' => 'Test Footer',
        ]);

        $this->assertDatabaseHas('outlet_settings', [
            'outlet_id' => $outlet->id,
            'receipt_footer' => 'Test Footer',
        ]);
    }

    public function test_users_relation(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $outlet = Outlet::create([
            'tenant_id' => $tenant->id,
            'name' => 'Outlet',
        ]);

        $this->assertNotNull($outlet->users);
    }
}
