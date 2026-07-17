<?php

namespace Tests\Sharding;

use App\Services\TenantConnection;
use Illuminate\Database\Migrations\Migrator;
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
     * Buat N schema tenant fisik + migrate via Migrator LANGSUNG.
     * (Jangan Artisan::call — me-reset Config::set runtime -> search_path hilang.)
     * Mono memperhatikan cleanup: schema di-DROP di akhir tiap test.
     */
    protected function provisionTenantSchemas(array $tenantIds): void
    {
        /** @var TenantConnection $conn */
        $conn = app(TenantConnection::class);
        /** @var Migrator $migrator */
        $migrator = app('migrator');

        foreach ($tenantIds as $tid) {
            // Bersihkan dulu (idempoten antar-run) — WAJIB pakai koneksi pgsql (tenant_template),
            // bukan default (sqlite di test) supaya DROP benar-benar ke Postgres.
            DB::connection('tenant_template')->statement("DROP SCHEMA IF EXISTS tenant_{$tid} CASCADE");
            DB::connection('tenant_template')->statement("CREATE SCHEMA tenant_{$tid}");
            $conn->resolveForTenant($tid);
            $migrator->setConnection("tenant_{$tid}");
            // Buat tabel migrations di schema target secara eksplisit (deterministik,
            // tidak bergantung pada migrator->install() yang bisa salah schema).
            DB::connection("tenant_{$tid}")->statement(
                'CREATE TABLE IF NOT EXISTS migrations ('.
                'id serial primary key, migration varchar(255) not null, batch integer not null)'
            );
            $migrator->run([database_path('migrations/tenant')]);
        }
    }

    /**
     * Drop schema fisik (cleanup) — panggil di tearDown test.
     */
    protected function dropTenantSchemas(array $tenantIds): void
    {
        foreach ($tenantIds as $tid) {
            DB::statement("DROP SCHEMA IF EXISTS tenant_{$tid} CASCADE");
        }
    }
}
