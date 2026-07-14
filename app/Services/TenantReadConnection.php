<?php

namespace App\Services;

use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

/**
 * TenantReadConnection — arahkan query baca berat (CustomerView / public menu)
 * ke read replica (Fase 2.7). Turunkan beban primary saat 500k outlet scan QR.
 *
 * Fallback: replica tidak diset → pakai koneksi tenant utama.
 */
class TenantReadConnection
{
    public function __construct(private TenantConnection $conn) {}

    public function resolve(): string
    {
        $main = $this->conn->resolve();
        // Safety net: bila ctx belum init (mis. lupa setTenantId), fallback primary.
        if (! app(TenantContext::class)->isInitialized()) {
            return $main;
        }
        // Replica hanya relevan saat sharding aktif (Postgres prod). Di sqlite/test
        // (sharding=false) tidak ada replica → langsung primary.
        if (! $this->conn->isSharded()) {
            return $main;
        }
        // Jika replica dikonfigurasi (driver terisi), clone per tenant
        if (empty(Config::get('database.connections.tenant_read.driver'))) {
            return $main; // tidak ada replica → primary
        }

        $tenantId = app(TenantContext::class)->id();
        $schema = 'tenant_read_'.$tenantId;
        if (! Config::has("database.connections.{$schema}")) {
            $template = Config::get('database.connections.tenant_read');
            // Postgres: database sama, schema beda via search_path.
            // Pastikan key 'database' ada (clone dari env utama bila kosong).
            if (empty($template['database'])) {
                $template['database'] = config('database.connections.tenant_template.database', Config::get('database.connections.tenant_template.database', 'forge'));
            }
            $template['search_path'] = 'tenant_'.$tenantId;
            Config::set("database.connections.{$schema}", $template);
        }

        return $schema;
    }

    /**
     * Jalankan closure di replica (atau primary bila tidak ada replica).
     */
    public function read(callable $callback)
    {
        $conn = $this->resolve();
        if ($conn === $this->conn->resolve()) {
            return $callback(); // fallback primary
        }

        return DB::connection($conn)->transaction($callback);
    }
}
