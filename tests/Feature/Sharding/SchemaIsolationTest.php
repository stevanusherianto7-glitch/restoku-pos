<?php

namespace Tests\Feature\Sharding;

use App\Services\TenantConnection;
use App\Services\TenantContext;
use Illuminate\Support\Facades\DB;
use Tests\Sharding\ShardingEnabled;
use Tests\TestCase;

/**
 * Bukti isolasi schema-FISIK antar tenant (tanpa mengandalkan TenantScope).
 *
 * Skenario: tulis data ke schema tenant_1, assert koneksi tenant_2
 * TIDAK melihatnya (isolasi di level DB, bukan aplikasi).
 */
class SchemaIsolationTest extends TestCase
{
    use ShardingEnabled;

    public function test_data_terisolasi_secara_fisik_antar_schema(): void
    {
        $this->requiresSharding();
        $this->provisionTenantSchemas([1, 2]);

        // Tulis 1 outlet ke schema tenant_1 saja
        DB::connection('tenant_1')->table('outlets')->insert([
            'tenant_id' => 1,
            'name' => 'Outlet T1',
            'slug' => 'outlet-t1-'.uniqid(),
            'is_active' => true,
            'geo_radius_meters' => 50,
            'created_at' => now(),
            'updated_at' => now(),
        ]);

        // ASSERT isolasi fisik: tenant_2 tidak melihat data tenant_1
        $this->assertSame(1, DB::connection('tenant_1')->table('outlets')->count());
        $this->assertSame(0, DB::connection('tenant_2')->table('outlets')->count(),
            'Isolasi gagal: koneksi tenant_2 seharusnya KOSONG (data tenant_1 bocor).');
    }

    public function test_koneksi_tenant_mengarah_ke_schema_terpisah(): void
    {
        $this->requiresSharding();
        $this->provisionTenantSchemas([1, 2]);

        /** @var TenantConnection $conn */
        $conn = app(TenantConnection::class);

        // resolve() untuk tenant 1 harus mengembalikan koneksi tenant_1
        app(TenantContext::class)->setTenantId(1);
        $this->assertSame('tenant_1', $conn->resolve());
        app(TenantContext::class)->reset();

        app(TenantContext::class)->setTenantId(2);
        $this->assertSame('tenant_2', $conn->resolve());
        app(TenantContext::class)->reset();
    }
}
