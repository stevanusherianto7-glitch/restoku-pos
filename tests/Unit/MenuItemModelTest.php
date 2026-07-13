<?php

namespace Tests\Unit;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Outlet;
use App\Models\Scopes\TenantScope;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class MenuItemModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_photo_url_attribute_returns_image_path(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $menu = MenuItem::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Nasi Goreng',
            'price' => 25000,
            'image_path' => 'https://res.cloudinary.com/test/image.jpg',
        ]);

        $this->assertEquals('https://res.cloudinary.com/test/image.jpg', $menu->photo_url);
    }

    public function test_photo_url_attribute_returns_null_when_no_image(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $menu = MenuItem::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Nasi Goreng',
            'price' => 25000,
        ]);

        $this->assertNull($menu->photo_url);
    }

    public function test_scope_for_guest_menu_returns_available_items(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $outlet = Outlet::create(['tenant_id' => $tenant->id, 'name' => 'Outlet', 'address' => 'Jl. Test']);

        MenuItem::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Nasi Goreng',
            'price' => 25000,
            'is_available' => true,
        ]);

        MenuItem::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Mie Goreng',
            'price' => 20000,
            'is_available' => false,
        ]);

        $items = MenuItem::withoutGlobalScope(TenantScope::class)
            ->forGuestMenu($outlet->id)
            ->get();

        $this->assertCount(1, $items);
        $this->assertEquals('Nasi Goreng', $items->first()->name);
    }

    public function test_scope_for_guest_menu_includes_global_items(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $outlet = Outlet::create(['tenant_id' => $tenant->id, 'name' => 'Outlet', 'address' => 'Jl. Test']);

        MenuItem::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Nasi Goreng',
            'price' => 25000,
            'is_available' => true,
            'outlet_id' => null,
        ]);

        MenuItem::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Es Teh',
            'price' => 10000,
            'is_available' => true,
            'outlet_id' => $outlet->id,
        ]);

        $items = MenuItem::withoutGlobalScope(TenantScope::class)
            ->forGuestMenu($outlet->id)
            ->get();

        $this->assertCount(2, $items);
    }

    public function test_tenant_relation(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $menu = MenuItem::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Nasi Goreng',
            'price' => 25000,
        ]);

        $this->assertEquals($tenant->id, $menu->tenant->id);
    }

    public function test_outlet_relation(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $outlet = Outlet::create(['tenant_id' => $tenant->id, 'name' => 'Outlet', 'address' => 'Jl. Test']);
        $menu = MenuItem::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'outlet_id' => $outlet->id,
            'name' => 'Nasi Goreng',
            'price' => 25000,
        ]);

        $this->assertEquals($outlet->id, $menu->outlet->id);
    }

    public function test_category_relation(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $category = MenuCategory::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Makanan',
        ]);
        $menu = MenuItem::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'menu_category_id' => $category->id,
            'name' => 'Nasi Goreng',
            'price' => 25000,
        ]);

        $this->assertEquals($category->id, $menu->category->id);
    }

    public function test_casts(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $menu = MenuItem::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Nasi Goreng',
            'price' => 25000,
            'is_available' => true,
            'is_popular' => true,
            'sort_order' => 1,
        ]);

        $this->assertIsBool($menu->is_available);
        $this->assertIsBool($menu->is_popular);
        $this->assertIsInt($menu->sort_order);
    }
}
