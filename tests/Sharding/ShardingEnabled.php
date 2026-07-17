<?php

namespace Tests\Sharding;

use App\Services\TenantConnection;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

/**
 * Trait untuk test jalur schema-per-tenant (Fase 2).
 *
 * Guard: HANYA jalan saat driver = pgsql DAN sharding_enabled=true.
 * Di sqlite/test lokal (default project) test di-SKIP — sesuai desain
 * TenantConnection::isSharded() = false di sqlite.
 *
 * Bukti runtime dihasilkan oleh:
 *  - scripts/test-sharding-local.sh (Docker Postgres lokal), dan
 *  - job CI `sharding-postgres`.
 */
trait ShardingEnabled
{
    protected function requiresSharding(): void
    {
        if (Config::get('database.default') !== 'pgsql'
            || ! Config::get('database.sharding_enabled')) {
            $this->markTestSkipped(
                'Schema-per-tenant hanya berlaku di Postgres + DB_SHARDING_ENABLED=true. '
                .'Jalankan via scripts/test-sharding-local.sh atau job CI sharding-postgres.'
            );
        }
    }

    /**
     * Buat N schema tenant fisik + migrate via TenantConnection.
     * Mengembalikan array tenant id yang dibuat.
     */
    protected function provisionTenantSchemas(array $tenantIds): void
    {
        /** @var TenantConnection $conn */
        $conn = app(TenantConnection::class);

        foreach ($tenantIds as $tid) {
            DB::statement("CREATE SCHEMA IF NOT EXISTS tenant_{$tid}");
            $conn->resolveForTenant($tid);
            \Artisan::call('migrate', [
                '--database' => "tenant_{$tid}",
                '--path' => 'database/migrations/tenant',
                '--force' => true,
            ]);
        }
    }
}
