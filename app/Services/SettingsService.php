<?php

namespace App\Services;

use App\Models\OutletSetting;
use App\Models\TenantSetting;
use Illuminate\Support\Facades\Cache;

/**
 * SettingsService — hierarchical settings resolution dengan caching.
 *
 * Hierarki resolusi (dari tertinggi ke terendah prioritasnya):
 *   OutletSetting (per outlet) → TenantSetting (per tenant) → hardcoded defaults
 *
 * Caching strategy:
 *   - Cache key: 'settings.tenant.{id}' dan 'settings.outlet.{id}'
 *   - TTL: 60 menit (dapat di-override via SETTINGS_CACHE_TTL env)
 *   - Invalidasi: otomatis saat save() dipanggil
 *
 * Penggunaan di controller:
 *   $settings = app(SettingsService::class)->forTenant($this->ctx->id());
 *   $taxRate  = $settings->pbjt_rate;
 *
 * Tidak pernah return null — selalu ada nilai default.
 */
class SettingsService
{
    private int $ttl;

    public function __construct()
    {
        $this->ttl = (int) config('app.settings_cache_ttl', 3600); // 60 menit
    }

    // ─── Read ─────────────────────────────────────────────────────────────────

    /**
     * Ambil settings tenant. Jika belum ada row, auto-create dengan defaults.
     * Hasil di-cache — tidak hit DB di setiap request.
     * Dilengkapi proteksi anti __PHP_Incomplete_Class saat cache stale/unserialized.
     */
    public function forTenant(int $tenantId): TenantSetting
    {
        $cached = Cache::get("settings.tenant.{$tenantId}");
        if ($cached instanceof TenantSetting) {
            return $cached;
        }

        if ($cached !== null) {
            Cache::forget("settings.tenant.{$tenantId}");
        }

        $setting = TenantSetting::firstOrCreate(
            ['tenant_id' => $tenantId],
            TenantSetting::defaults()
        );

        Cache::put("settings.tenant.{$tenantId}", $setting, $this->ttl);

        return $setting;
    }

    /**
     * Ambil settings outlet. Jika belum ada row, auto-create dengan defaults.
     * Dilengkapi proteksi anti __PHP_Incomplete_Class saat cache stale/unserialized.
     */
    public function forOutlet(int $outletId): OutletSetting
    {
        $cached = Cache::get("settings.outlet.{$outletId}");
        if ($cached instanceof OutletSetting) {
            return $cached;
        }

        if ($cached !== null) {
            Cache::forget("settings.outlet.{$outletId}");
        }

        $setting = OutletSetting::firstOrCreate(
            ['outlet_id' => $outletId],
            OutletSetting::defaults()
        );

        Cache::put("settings.outlet.{$outletId}", $setting, $this->ttl);

        return $setting;
    }

    // ─── Write ────────────────────────────────────────────────────────────────

    /**
     * Simpan tenant settings dan invalidasi cache.
     *
     * @param  array<string,mixed>  $data
     */
    public function saveTenantSettings(int $tenantId, array $data): TenantSetting
    {
        $settings = TenantSetting::updateOrCreate(
            ['tenant_id' => $tenantId],
            array_intersect_key($data, array_flip((new TenantSetting)->getFillable()))
        );

        Cache::forget("settings.tenant.{$tenantId}");

        return $settings;
    }

    /**
     * Simpan outlet settings dan invalidasi cache.
     *
     * @param  array<string,mixed>  $data
     */
    public function saveOutletSettings(int $outletId, array $data): OutletSetting
    {
        $settings = OutletSetting::updateOrCreate(
            ['outlet_id' => $outletId],
            array_intersect_key($data, array_flip((new OutletSetting)->getFillable()))
        );

        Cache::forget("settings.outlet.{$outletId}");

        return $settings;
    }

    // ─── Invalidation ─────────────────────────────────────────────────────────

    public function invalidateTenant(int $tenantId): void
    {
        Cache::forget("settings.tenant.{$tenantId}");
    }

    public function invalidateOutlet(int $outletId): void
    {
        Cache::forget("settings.outlet.{$outletId}");
    }
}
