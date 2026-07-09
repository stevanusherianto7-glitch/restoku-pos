<?php

namespace App\Models\Scopes;

use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Scope;

/**
 * TenantScope — menyaring semua query Eloquent berdasarkan tenant aktif.
 *
 * Keputusan 3 (Senior Architect): scope ini TIDAK lagi membaca dari Auth::user()
 * secara langsung. Sebagai gantinya, ia membaca tenant_id dari service container:
 *
 *   app()->bound('tenant.id') → set oleh EnsureTenantContext middleware
 *
 * Keuntungan:
 *   1. HTTP requests: EnsureTenantContext::handle() memanggil setTenantId()
 *   2. Artisan commands: command wajib memanggil app(TenantContext::class)->setTenantId()
 *   3. Queue jobs: job menyimpan tenantId di constructor, restore di handle()
 *   4. Tests: setUp() memanggil app(TenantContext::class)->setTenantId()
 *   5. Tidak ada circular dependency dengan Auth system
 *
 * Plan B: jika container kosong (mis. seeding), scope diam-diam tidak aktif
 *   sehingga `php artisan db:seed` tetap bisa berjalan tanpa setup tenant.
 *
 * Cara bypass yang BENAR untuk kasus legitimate:
 *   TenantScope::bypass(fn () => User::all())    ← scoped, otomatis restore
 *   Model::withoutGlobalScope(TenantScope::class) ← tetap diizinkan di commands
 */
class TenantScope implements Scope
{
    public function apply(Builder $builder, Model $model): void
    {
        // Baca dari container — diisi oleh EnsureTenantContext atau artisan command
        if (! app()->bound('tenant.id')) {
            // SECURITY (H-3): in production, a missing tenant binding on a
            // tenant-scoped model is a misconfiguration that would silently
            // return CROSS-TENANT data. Fail closed instead of returning everything.
            if (app()->environment('production')) {
                abort(500, 'TenantContext belum diinisialisasi (misconfig).');
            }

            return; // local/testing/console/seeding: scope tidak aktif (Plan B)
        }

        $tenantId = app('tenant.id');

        if ($tenantId) {
            $builder->where($model->getTable().'.tenant_id', $tenantId);
        }
    }

    /**
     * Eksekusi callback dengan TenantScope dinonaktifkan untuk model tertentu.
     * Otomatis restore setelah callback selesai — tidak perlu manual cleanup.
     *
     * Contoh penggunaan:
     *   $allUsers = TenantScope::bypass(fn () => User::all());
     *
     * Ini lebih eksplisit dan aman daripada withoutGlobalScope() yang mudah terlupa.
     */
    public static function bypass(callable $callback): mixed
    {
        // Simpan tenant.id sementara, kosongkan, jalankan callback, restore
        $currentId = app()->bound('tenant.id') ? app('tenant.id') : null;

        app()->bind('tenant.id', fn () => null);

        try {
            return $callback();
        } finally {
            if ($currentId !== null) {
                app()->bind('tenant.id', fn () => $currentId);
            } else {
                // Hapus binding
                app()->offsetUnset('tenant.id');
            }
        }
    }
}
