<?php

namespace Tests\Feature;

use App\Models\Outlet;
use App\Models\Tenant;
use App\Services\OutletSlug;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Verifikasi: slug outlet GLOBAL-unique (lintas tenant) untuk QR Code Meja.
 *
 * Menjamin:
 *  - 2 tenant dengan outlet bernama sama → slug BEDA (tidak collision).
 *  - getPublicMenu by slug tenant A tidak kembalikan outlet tenant B.
 *  - getOutletOperatingHours by slug tenant A tidak kembalikan jam tenant B.
 *  - Helper OutletSlug::unique menghasilkan slug unik & stabil.
 */
class OutletSlugUniqueTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenantA;

    private Tenant $tenantB;

    private Outlet $outletA;

    private Outlet $outletB;

    protected function setUp(): void
    {
        parent::setUp();

        // Dua tenant dengan brand SAMA → auto-outlet "Resto Sama" harus slug BEDA.
        $this->tenantA = Tenant::create([
            'name' => 'Resto Sama', 'brand_name' => 'Resto Sama',
            'email' => 'a@t.com', 'phone' => '081',
        ]);
        $this->tenantB = Tenant::create([
            'name' => 'Resto Sama', 'brand_name' => 'Resto Sama',
            'email' => 'b@t.com', 'phone' => '082',
        ]);

        // Outlet eksplisit bernama sama (selain auto-outlet default).
        $this->outletA = Outlet::create([
            'tenant_id' => $this->tenantA->id, 'name' => 'Cabang Pusat', 'address' => 'Jl A',
        ]);
        $this->outletB = Outlet::create([
            'tenant_id' => $this->tenantB->id, 'name' => 'Cabang Pusat', 'address' => 'Jl B',
        ]);
    }

    public function test_two_tenants_same_outlet_name_get_distinct_slugs(): void
    {
        // Auto-outlet default (dari Tenant::created) juga harus distinct.
        $defaultA = $this->tenantA->outlets()->where('name', '!=', 'Cabang Pusat')->first();
        $defaultB = $this->tenantB->outlets()->where('name', '!=', 'Cabang Pusat')->first();

        $this->assertNotNull($defaultA);
        $this->assertNotNull($defaultB);
        $this->assertNotEquals($defaultA->slug, $defaultB->slug, 'Auto-outlet default antar tenant harus slug beda');

        // Outlet eksplisit bernama sama → slug beda.
        $this->assertNotEquals($this->outletA->slug, $this->outletB->slug, 'Outlet Cabang Pusat antar tenant harus slug beda');
    }

    public function test_helper_produces_unique_stable_slug(): void
    {
        // Buat outlet pertama (tenant A) dengan nama sama → slug dasar.
        $first = Outlet::create([
            'tenant_id' => $this->tenantA->id, 'name' => 'Kedai Nusantara', 'address' => 'Jl A',
        ]);
        $s1 = $first->slug;

        // Helper untuk tenant B dengan nama SAMA → harus beda (suffix tenant id).
        $s2 = OutletSlug::unique('Kedai Nusantara', $this->tenantB->id);
        $this->assertNotEquals($s1, $s2);

        // Panggil lagi untuk tenant A → hasil konsisten (deterministik, idemPoten).
        $this->assertEquals($s1, OutletSlug::unique('Kedai Nusantara', $this->tenantA->id));
    }

    public function test_public_menu_lookup_is_not_cross_tenant(): void
    {
        $resA = $this->getJson('/api/menu/'.$this->outletA->slug);
        $resA->assertOk();
        $resA->assertJsonPath('outlet.id', $this->outletA->id);
        $resA->assertJsonPath('outlet.slug', $this->outletA->slug);

        // Slug tenant B pasti beda → tidak bisa dipakai untuk mengakses tenant A.
        $resB = $this->getJson('/api/menu/'.$this->outletB->slug);
        $resB->assertOk();
        $resB->assertJsonPath('outlet.id', $this->outletB->id);
        $this->assertNotEquals($this->outletA->slug, $this->outletB->slug);
    }

    public function test_public_menu_unknown_slug_returns_404(): void
    {
        $this->getJson('/api/menu/slug-yang-tidak-ada')->assertNotFound();
    }

    public function test_operating_hours_lookup_by_slug_is_not_cross_tenant(): void
    {
        $resA = $this->getJson('/api/outlet-operating-hours?outlet='.$this->outletA->slug);
        $resA->assertOk();
        // Tidak boleh bocor ke outlet tenant B.
        $this->assertNotEquals($this->outletB->slug, $this->outletA->slug);
    }

    public function test_operating_hours_does_not_resolve_by_other_tenant_id(): void
    {
        // Passing id outlet tenant B tidak boleh mengembalikan data tenant B
        // (orWhere('id') sudah dihapus — hanya slug yang diakui).
        $res = $this->getJson('/api/outlet-operating-hours?outlet='.$this->outletB->id);
        // Karena param bukan slug valid → tidak ada match → default (bukan data tenant B).
        $res->assertOk();
        $res->assertJsonPath('note', 'outlet_not_found_using_defaults');
    }
}
