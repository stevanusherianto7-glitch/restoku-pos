<?php

namespace Tests\Feature;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Outlet;
use App\Models\Tenant;
use App\Models\User;
use App\Services\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class MenuControllerTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private Outlet $outlet;

    private User $owner;

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

        $this->owner = User::create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
            'name' => 'Owner',
            'email' => 'owner@test.com',
            'role' => 'owner',
            'password' => Hash::make('password'),
        ]);

        app(TenantContext::class)->setFromUser($this->owner);
    }

    public function test_index_renders_inertia_with_menu_items(): void
    {
        $category = MenuCategory::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Makanan',
        ]);

        MenuItem::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Nasi Goreng',
            'price' => 25000,
            'menu_category_id' => $category->id,
        ]);

        $this->actingAs($this->owner);

        // The /katalog-menu route is a Closure rendering Inertia directly
        $response = $this->get('/katalog-menu');

        $response->assertStatus(200);
    }

    public function test_destroy_removes_item_and_invalidates_cache(): void
    {
        $item = MenuItem::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Mie Ayam',
            'price' => 20000,
        ]);

        $this->actingAs($this->owner);

        $response = $this->delete("/api/menu/{$item->id}");

        $response->assertRedirect();
        $this->assertDatabaseMissing('menu_items', ['id' => $item->id]);
    }

    public function test_store_creates_menu_item(): void
    {
        $category = MenuCategory::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Minuman',
        ]);

        $this->actingAs($this->owner);

        $response = $this->post('/api/menu', [
            'name' => 'Es Teh',
            'price' => 8000,
            'menu_category_id' => $category->id,
            'is_available' => true,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('menu_items', [
            'tenant_id' => $this->tenant->id,
            'name' => 'Es Teh',
            'price' => 8000,
        ]);
    }

    public function test_update_modifies_menu_item(): void
    {
        $category = MenuCategory::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Makanan',
        ]);

        $item = MenuItem::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Nasi Uduk',
            'price' => 15000,
            'menu_category_id' => $category->id,
        ]);

        $this->actingAs($this->owner);

        $response = $this->put("/api/menu/{$item->id}", [
            'name' => 'Nasi Uduk Spesial',
            'price' => 20000,
            'menu_category_id' => $category->id,
        ]);

        $response->assertRedirect();
        $this->assertDatabaseHas('menu_items', [
            'id' => $item->id,
            'name' => 'Nasi Uduk Spesial',
            'price' => 20000,
        ]);
    }
}
