<?php

namespace Tests\Feature;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Outlet;
use App\Models\Tenant;
use App\Services\TenantConnection;
use App\Services\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

/**
 * Fase 2 — Verifikasi arsitektur schema-per-tenant (fallback + resolver).
 *
 * Di sqlite/test: sharding=false → semua model tetap di koneksi default +
 * TenantScope menyaring (backward-compatible, Fase 1 test tidak break).
 *
 * Di Postgres prod: sharding=true → model query ke schema tenant_{id}.
 */
class TenantShardingTest extends TestCase
{
    use RefreshDatabase;

    public function test_sharding_nonaktif_di_sqlite(): void
    {
        // Test lokal pakai sqlite → sharding harus false (fallback shared).
        $conn = app(TenantConnection::class);
        $this->assertFalse($conn->isSharded(), 'Di sqlite, sharding harus non-aktif (fallback).');
    }

    public function test_resolve_for_tenant_mendaftarkan_koneksi(): void
    {
        // resolveForTenant harus mendaftarkan config tanpa error (meski driver beda).
        $conn = app(TenantConnection::class);
        $name = $conn->resolveForTenant(99);
        $this->assertEquals('tenant_99', $name);
        // Tidak throw walau template pgsql (karena tidak benar-benar connect di sini)
        $this->assertTrue(Config::has('database.connections.tenant_99'));
    }

    public function test_model_tetap_terisolasi_via_tenant_scope_di_sqlite(): void
    {
        $tenantA = Tenant::create(['name' => 'A', 'brand_name' => 'A', 'email' => 'a@t.com', 'phone' => '1']);
        $tenantB = Tenant::create(['name' => 'B', 'brand_name' => 'B', 'email' => 'b@t.com', 'phone' => '2']);
        Outlet::create(['tenant_id' => $tenantA->id, 'name' => 'OA', 'address' => 'x']);
        MenuItem::create([
            'tenant_id' => $tenantB->id, 'name' => 'Secret', 'price' => 1000,
            'menu_category_id' => MenuCategory::create(['tenant_id' => $tenantB->id, 'name' => 'M'])->id,
        ]);

        // Tanpa ctx: TenantScope tidak aktif → lihat semua
        $this->assertGreaterThanOrEqual(1, MenuItem::count());

        // Dengan ctx tenant A: scope menyaring → tidak lihat menu tenant B
        app(TenantContext::class)->setTenantId($tenantA->id);
        $this->assertEquals(0, MenuItem::count());
    }

    public function test_tenant_context_reset_antar_assertion(): void
    {
        app(TenantContext::class)->reset();
        $this->assertFalse(app(TenantContext::class)->isInitialized());
    }
}
