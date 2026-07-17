<?php

namespace App\Services;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use RuntimeException;

/**
 * TenantConnection — resolver koneksi DB per-tenant (Fase 2: schema-per-tenant).
 *
 * Strategi (Architect decision):
 *  - 1 shared DB  : `restoku_sys` (tenants, outlet pemeta slug->schema). Koneksi 'sys'.
 *  - N tenant DB  : schema `tenant_{id}` (Postgres) atau DB `tenant_{id}` (MySQL).
 *  - On-demand    : koneksi di-resolve saat runtime via TenantContext, BUKAN dibuka
 *                   semua sekaligus (cegah connection exhaustion di 5000 tenant).
 *  - Fallback     : sqlite / test → pakai koneksi default + TenantScope tetap aktif
 *                   (backward-compatible, Fase 1 test tidak break).
 *
 * Postgres: SET search_path = tenant_{id}, public.
 * MySQL   : USE tenant_{id} (atau koneksi terpisah dengan database=tenant_{id}).
 */
class TenantConnection
{
    public const SYS_CONNECTION = 'sys';

    private TenantContext $ctx;

    public function __construct(TenantContext $ctx)
    {
        $this->ctx = $ctx;
    }

    /**
     * Nama schema/koneksi untuk tenant aktif.
     */
    public function schemaName(): string
    {
        return 'tenant_'.$this->ctx->id();
    }

    /**
     * Apakah mode schema-per-tenant aktif? (false di sqlite/test → fallback shared).
     */
    public function isSharded(): bool
    {
        $driver = Config::get('database.default');
        // Saat test pakai sqlite → tetap shared schema (TenantScope handled).
        if ($driver === 'sqlite') {
            return false;
        }

        return (bool) Config::get('database.sharding_enabled', true);
    }

    /**
     * Daftarkan & return koneksi untuk tenant tertentu (tanpa ctx).
     * Dipakai oleh tenant:migrate command.
     */
    public function resolveForTenant(int $tenantId): string
    {
        $schema = 'tenant_'.$tenantId;
        if (! Config::has("database.connections.{$schema}")) {
            $this->registerConnection($schema, $schema);
        }

        return $schema;
    }

    /**
     * Resolve koneksi DB untuk tenant aktif (via TenantContext).
     * Return nama koneksi Laravel ('tenant_{id}' saat sharded).
     */
    public function resolve(): string
    {
        if (! $this->isSharded()) {
            return Config::get('database.default');
        }

        $schema = $this->schemaName();
        $connectionName = $schema;

        if (! Config::has("database.connections.{$connectionName}")) {
            $this->registerConnection($connectionName, $schema);
        }

        return $connectionName;
    }

    /**
     * Daftarkan koneksi tenant secara dinamis (clone dari template 'tenant_template').
     */
    private function registerConnection(string $connectionName, string $schema): void
    {
        $template = Config::get('database.connections.tenant_template');
        if (! $template) {
            throw new RuntimeException(
                'Config database.connections.tenant_template tidak ditemukan. '.
                'Wajib untuk mode schema-per-tenant (Fase 2).'
            );
        }

        $driver = $template['driver'] ?? 'pgsql';
        $config = $template;
        if ($driver === 'pgsql') {
            // Postgres: isolasi via search_path (schema terpisah dalam 1 DB).
            // DB SAMA dengan shared (restoku/restoku_sys); isolasi lewat schema.
            // Laravel PostgresConnector.configureSearchPath() otomatis menjalankan
            // "set search_path to <schema>" saat koneksi dibuka (lihat
            // vendor/laravel/framework/.../PostgresConnector.php:46,152).
            $config['database'] = $template['database'] ?? 'restoku';
            $config['search_path'] = $schema;
        } else {
            // MySQL: database terpisah per tenant
            $config['database'] = $schema;
        }

        Config::set("database.connections.{$connectionName}", $config);
    }

    /**
     * Jalankan closure dalam koneksi tenant (untuk query raw / migrasi).
     */
    public function usingTenant(callable $callback)
    {
        $conn = $this->resolve();
        if ($conn === Config::get('database.default')) {
            return $callback(); // sqlite fallback
        }

        return DB::connection($conn)->transaction($callback);
    }
}
