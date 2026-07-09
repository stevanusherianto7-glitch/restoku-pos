<?php

namespace App\Console\Commands;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Outlet;
use App\Models\Tenant;
use App\Services\TenantConnection;
use Illuminate\Console\Command;
use Illuminate\Support\Facades\DB;
use Illuminate\Support\Facades\Schema;

/**
 * Fase 2.8 — Backfill data dari shared-schema (legacy) ke per-tenant schema.
 *
 * Strategi (Architect):
 *  - Baca dari koneksi shared lama (tenant_id masih ada di kolom).
 *  - Tulis ke schema tenant_{id} via TenantConnection::resolveForTenant().
 *  - Idempoten: skip bila sudah ada (cek by id).
 *  - Hanya jalan saat sharding aktif.
 *
 *   php artisan tenant:backfill --dry
 *   php artisan tenant:backfill
 */
class TenantBackfillCommand extends Command
{
    protected $signature = 'tenant:backfill {--dry : Dry run} {--tenant= : ID tenant}';

    protected $description = 'Backfill data shared-schema ke per-tenant schema (Fase 2)';

    public function handle(): int
    {
        if (! config('database.sharding_enabled', false)) {
            $this->warn('Sharding tidak aktif. Backfill hanya relevan saat mode schema-per-tenant.');

            return self::SUCCESS;
        }

        $conn = app(TenantConnection::class);
        $tenants = Tenant::when($this->option('tenant'), fn ($q, $t) => $q->where('id', $t))->get();

        foreach ($tenants as $tenant) {
            $schema = $conn->resolveForTenant($tenant->id);
            $this->info("Backfill tenant_{$tenant->id} → schema {$schema}");

            if ($this->option('dry')) {
                $counts = [
                    'outlets' => Outlet::where('tenant_id', $tenant->id)->count(),
                    'menu_items' => MenuItem::where('tenant_id', $tenant->id)->count(),
                    'orders' => Order::where('tenant_id', $tenant->id)->count(),
                ];
                $this->line('  [dry] '.json_encode($counts));

                continue;
            }

            // Pindahkan per tabel. Gunakan DB connection tenant schema.
            $this->copyTable(Outlet::class, $schema, $tenant->id);
            $this->copyTable(MenuItem::class, $schema, $tenant->id);
            $this->copyTable(Order::class, $schema, $tenant->id);
        }

        $this->info('Backfill selesai.');

        return self::SUCCESS;
    }

    private function copyTable(string $modelClass, string $schema, int $tenantId): void
    {
        $table = (new $modelClass)->getTable();
        if (! Schema::connection($schema)->hasTable($table)) {
            $this->warn("  skip {$table}: tabel belum ada di {$schema} (jalankan tenant:migrate dulu)");

            return;
        }

        $rows = DB::connection(config('database.default'))
            ->table($table)
            ->where('tenant_id', $tenantId)
            ->get();

        foreach ($rows as $row) {
            $data = (array) $row;
            // Idempoten: cek by id
            if (DB::connection($schema)->table($table)->where('id', $data['id'])->exists()) {
                continue;
            }
            DB::connection($schema)->table($table)->insert($data);
        }
        $this->line("  ✓ {$table}: ".$rows->count().' baris');
    }
}
