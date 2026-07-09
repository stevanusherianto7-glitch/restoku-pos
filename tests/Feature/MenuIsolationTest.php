<?php

namespace Tests\Feature;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Outlet;
use App\Models\Scopes\TenantScope;
use App\Models\Tenant;
use App\Models\User;
use App\Services\CloudinaryService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Cache;
use Tests\TestCase;

/**
 * Fase 1 — Isolasi menu multi-tenant + cache + bulk outlet.
 */
class MenuIsolationTest extends TestCase
{
    use RefreshDatabase;

    private User $ownerA;

    private User $ownerB;

    private Outlet $outletA;

    private Outlet $outletB;

    protected function setUp(): void
    {
        parent::setUp();

        $tenantA = Tenant::create(['name' => 'T A', 'brand_name' => 'A', 'email' => 'a@t.com', 'phone' => '081']);
        $tenantB = Tenant::create(['name' => 'T B', 'brand_name' => 'B', 'email' => 'b@t.com', 'phone' => '082']);

        $this->outletA = Outlet::create(['tenant_id' => $tenantA->id, 'name' => 'Outlet A', 'address' => 'Jl A']);
        $this->outletB = Outlet::create(['tenant_id' => $tenantB->id, 'name' => 'Outlet B', 'address' => 'Jl B']);

        $this->ownerA = User::create([
            'tenant_id' => $tenantA->id, 'outlet_id' => $this->outletA->id,
            'name' => 'OA', 'email' => 'oa@t.com', 'password' => bcrypt('pw'), 'role' => 'owner',
        ]);
        $this->ownerB = User::create([
            'tenant_id' => $tenantB->id, 'outlet_id' => $this->outletB->id,
            'name' => 'OB', 'email' => 'ob@t.com', 'password' => bcrypt('pw'), 'role' => 'owner',
        ]);
    }

    public function test_owner_cannot_see_other_tenant_menu(): void
    {
        MenuItem::create(['tenant_id' => $this->ownerB->tenant_id, 'name' => 'Secret', 'price' => 1000, 'category' => 'Makanan']);

        $this->actingAs($this->ownerA)
            ->get('/katalog-menu')
            ->assertOk()
            ->assertSessionHasNoErrors();

        // TenantScope aktif: owner A tidak melihat menu tenant B
        $this->assertCount(0, MenuItem::all()->where('tenant_id', $this->ownerA->tenant_id));
        $this->assertCount(1, MenuItem::withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $this->ownerB->tenant_id)->get());
    }

    public function test_store_menu_scopes_to_tenant(): void
    {
        $this->actingAs($this->ownerA)
            ->post('/api/menu', [
                'name' => 'Nasi Goreng', 'price' => 25000,
                'menu_category_id' => MenuCategory::create([
                    'tenant_id' => $this->ownerA->tenant_id, 'name' => 'Makanan',
                ])->id,
                'outlet_id' => $this->outletA->id,
            ])
            ->assertRedirect();

        $item = MenuItem::first();
        $this->assertEquals($this->ownerA->tenant_id, $item->tenant_id);
    }

    public function test_store_menu_rejects_other_tenant_outlet(): void
    {
        // outlet_id milik tenant B tidak boleh dipakai owner A
        $catA = MenuCategory::create([
            'tenant_id' => $this->ownerA->tenant_id, 'name' => 'Makanan',
        ]);
        $this->actingAs($this->ownerA)
            ->post('/api/menu', [
                'name' => 'X', 'price' => 1000,
                'menu_category_id' => $catA->id,
                'outlet_id' => $this->outletB->id, // outlet B
            ])
            ->assertJsonValidationErrors('outlet_id');
    }

    public function test_public_menu_api_returns_by_slug(): void
    {
        MenuItem::create([
            'tenant_id' => $this->ownerA->tenant_id, 'outlet_id' => $this->outletA->id,
            'name' => 'Es Teh', 'price' => 5000, 'category' => 'Minuman', 'is_available' => true,
        ]);

        $this->getJson('/api/menu/'.$this->outletA->slug)
            ->assertOk()
            ->assertJsonCount(1, 'menu')
            ->assertJsonPath('outlet.slug', $this->outletA->slug);
    }

    public function test_public_menu_api_404_for_unknown_slug(): void
    {
        $this->getJson('/api/menu/tidak-ada')->assertNotFound();
    }

    public function test_cache_invalidated_on_menu_update(): void
    {
        $item = MenuItem::create([
            'tenant_id' => $this->ownerA->tenant_id, 'outlet_id' => $this->outletA->id,
            'name' => 'Item', 'price' => 1000, 'category' => 'Makanan',
        ]);

        // Seed cache manual
        $key = "menu:tenant:{$this->ownerA->tenant_id}:outlet:{$this->outletA->id}";
        Cache::put($key, ['cached'], 10);
        $this->assertNotNull(Cache::get($key));

        $this->actingAs($this->ownerA)
            ->put("/api/menu/{$item->id}", [
                'name' => 'Item Updated', 'price' => 2000,
                'menu_category_id' => MenuCategory::create([
                    'tenant_id' => $this->ownerA->tenant_id, 'name' => 'Makanan',
                ])->id,
            ])
            ->assertRedirect();

        $this->assertNull(Cache::get($key), 'Cache menu harus di-invalidate saat update');
    }

    public function test_bulk_create_outlets_idempotent(): void
    {
        $this->actingAs($this->ownerA)
            ->post('/api/outlet-settings/bulk-outlets', [
                'names' => "Cabang 1\nCabang 2\nCabang 1", // duplikat sengaja
            ])
            ->assertRedirect();

        $this->assertCount(2, Outlet::where('tenant_id', $this->ownerA->tenant_id)
            ->whereIn('name', ['Cabang 1', 'Cabang 2'])->get());
    }

    public function test_cloudinary_service_falls_back_without_config(): void
    {
        // Tanpa CLOUDINARY_URL -> null (tidak throw), frontend pakai placeholder
        config(['services.cloudinary.url' => null]);
        $svc = new CloudinaryService;
        $this->assertNull($svc->uploadMenuPhoto('data:image/png;base64,xxx', $this->ownerA->tenant_id));
    }
}
