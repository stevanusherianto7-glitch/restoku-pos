<?php

namespace App\Console\Commands;

use App\Models\Tenant;
use App\Services\TenantConnection;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\Artisan;
use Illuminate\Support\Facades\Config;

/**
 * Fase 2 — Jalankan migrasi ke tiap schema tenant.
 *
 *   php artisan tenant:migrate           # semua tenant
 *   php artisan tenant:migrate --tenant=3 # satu tenant
 *   php artisan tenant:migrate --dry      # list schema tanpa jalan
 *
 * Strategi: clone koneksi 'tenant_template' menjadi 'tenant_{id}',
 * set search_path (Postgres) / database (MySQL), lalu jalankan migrate.
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

        foreach ($tenants as $tenant) {
            $schema = 'tenant_'.$tenant->id;
            if ($this->option('dry')) {
                $this->line("[dry] akan migrate schema: {$schema}");

                continue;
            }

            // Daftarkan koneksi tenant_{id}
            $conn->resolveForTenant($tenant->id);

            $this->info("Migrating schema: {$schema}");
            Artisan::call('migrate', [
                '--database' => $schema,
                '--path' => 'database/migrations/tenant',
                '--force' => $this->option('force') ?? true,
            ]);
            $this->line(Artisan::output());
        }

        $this->info('Selesai.');

        return self::SUCCESS;
    }
}
