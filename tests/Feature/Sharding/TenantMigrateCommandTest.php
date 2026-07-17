<?php

namespace Tests\Feature\Sharding;

use App\Models\Tenant;
use Illuminate\Support\Facades\DB;
use Tests\Sharding\ShardingEnabled;
use Tests\TestCase;

/**
 * Bukti bahwa `php artisan tenant:migrate` mendaftarkan koneksi per-tenant
 * dan menjalankan migrasi ke schema fisik masing-masing.
 */
class TenantMigrateCommandTest extends TestCase
{
    use ShardingEnabled;

    public function test_tenant_migrate_membuat_schema_dan_tabel_per_tenant(): void
    {
        $this->requiresSharding();

        // Buat 2 tenant (di shared schema sys/default)
        $t1 = Tenant::create(['name' => 'T1 '.uniqid(), 'brand_name' => 'T1', 'email' => 't1-'.uniqid().'@t.com', 'phone' => '1']);
        $t2 = Tenant::create(['name' => 'T2 '.uniqid(), 'brand_name' => 'T2', 'email' => 't2-'.uniqid().'@t.com', 'phone' => '2']);

        // Jalankan command (butuh sharding aktif — guard di handle())
        \Artisan::call('tenant:migrate', ['--force' => true]);
        $output = \Artisan::output();
        $this->assertStringContainsString('tenant_'.$t1->id, $output);
        $this->assertStringContainsString('tenant_'.$t2->id, $output);

        // ASSERT: tabel outlets ada di tiap schema tenant
        $this->assertTrue(
            DB::connection('tenant_'.$t1->id)->getSchemaBuilder()->hasTable('outlets'),
            'tenant:migrate gagal membuat tabel di schema tenant_'.$t1->id
        );
        $this->assertTrue(
            DB::connection('tenant_'.$t2->id)->getSchemaBuilder()->hasTable('outlets'),
            'tenant:migrate gagal membuat tabel di schema tenant_'.$t2->id
        );
    }

    public function test_tenant_migrate_dry_run_tidak_menulis(): void
    {
        $this->requiresSharding();

        Tenant::create(['name' => 'Dry '.uniqid(), 'brand_name' => 'Dry', 'email' => 'dry-'.uniqid().'@t.com', 'phone' => '9']);

        \Artisan::call('tenant:migrate', ['--dry' => true, '--force' => true]);
        $output = \Artisan::output();
        $this->assertStringContainsString('[dry]', $output);
    }
}
