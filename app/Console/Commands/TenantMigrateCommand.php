<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Services\TenantConnection;
use Illuminate\Console\Command;
use Illuminate\Database\Migrations\Migrator;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;

/**
 * Fase 2 — Jalankan migrasi ke tiap schema tenant.
 *
 *   php artisan tenant:migrate           # semua tenant
 *   php artisan tenant:migrate --tenant=3 # satu tenant
 *   php artisan tenant:migrate --dry      # list schema tanpa jalan
 *
 * Strategi: clone koneksi 'tenant_template' menjadi 'tenant_{id}',
 * set search_path (Postgres) / database (MySQL), lalu jalankan migrasi
 * via Migrator LANGSUNG (bukan Artisan::call — Artisan::call me-reset
 * Config::set runtime sehingga search_path hilang -> "no schema" error).
 */
class TenantMigrateCommand extends Command
{
    protected $signature = 'tenant:migrate {--tenant= : ID tenant} {--dry : Dry run} {--force : Force}';

    protected $description = 'Jalankan migrasi ke schema per-tenant (Fase 2)';

    public function handle(): int
    {
        if (! Config::get('database.sharding_enabled', false)) {
            $this->warn('Sharding tidak aktif (DB_SHARDING_ENABLED=false). Gunakan "php artisan migrate" biasa.');

            return self::SUCCESS;
        }

        $query = Tenant::query();
        if ($this->option('tenant')) {
            $query->where('id', $this->option('tenant'));
        }
        $tenants = $query->get();

        if ($tenants->isEmpty()) {
            $this->warn('Tidak ada tenant.');

            return self::SUCCESS;
        }

        /** @var TenantConnection $conn */
        $conn = app(TenantConnection::class);
        /** @var Migrator $migrator */
        $migrator = app('migrator');

        foreach ($tenants as $tenant) {
            $schema = 'tenant_'.$tenant->id;
            if ($this->option('dry')) {
                $this->line("[dry] akan migrate schema: {$schema}");

                continue;
            }

            // Daftarkan koneksi tenant_{id} (clone dari tenant_template)
            $conn->resolveForTenant($tenant->id);

            // Buat schema fisik kalau belum ada (Postgres).
            // Di prod ini WAJIB — migrate akan gagal kalau schema tidak ada.
            DB::connection('tenant_template')->statement(
                "CREATE SCHEMA IF NOT EXISTS \"{$schema}\""
            );

            $this->info("Migrating schema: {$schema}");
            // Migrator LANGSUNG (config runtime survive) — jangan Artisan::call.
            $migrator->setConnection($schema);
            // Buat tabel migrations di schema target secara eksplisit (deterministik).
            DB::connection($schema)->statement(
                'CREATE TABLE IF NOT EXISTS migrations ('.
                'id serial primary key, migration varchar(255) not null, batch integer not null)'
            );
            $migrator->run([database_path('migrations/tenant')]);
            // Laravel 12 Migrator tidak punya getNotes(); output migrasi sudah
            // dicatat ke repository. Cukup lanjut (idempoten via tabel migrations).
        }

        $this->info('Selesai.');

        return self::SUCCESS;
    }
}
