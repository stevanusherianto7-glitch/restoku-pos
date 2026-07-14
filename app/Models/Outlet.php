<?php

namespace App\Models;

use App\Models\Concerns\UsesTenantConnection;
use App\Models\Scopes\TenantScope;
use App\Services\OutletSlug;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Outlet extends Model
{
    use HasFactory;
    use UsesTenantConnection;

    protected $guarded = ['id'];

    protected $casts = [
        'settings' => 'json',
        'operating_hours' => 'json',   // kolom lama — dipertahankan untuk fallback
        'latitude' => 'decimal:8',
        'longitude' => 'decimal:8',
        'geo_radius_meters' => 'integer',
        'is_active' => 'boolean',
    ];

    protected static function booted(): void
    {
        // Keputusan 3 (Senior Architect): TenantScope membaca dari container
        // (diisi oleh EnsureTenantContext middleware di HTTP context).
        // Di artisan commands → TenantContext::setTenantId() dipanggil manual.
        static::addGlobalScope(new TenantScope);
    }

    // ─── Relations ────────────────────────────────────────────────────────────

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /** Konfigurasi outlet: jam operasional, struk, printer. */
    public function settings(): HasOne
    {
        return $this->hasOne(OutletSetting::class);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Auto-slug saat nama diisi & slug kosong (memudahkan auto-outlet-default).
     */
    protected function setNameAttribute($value): void
    {
        $this->attributes['name'] = $value;
        if (empty($this->attributes['slug'])) {
            // Slug global-unique (route /m/{slug} bersifat publik global).
            // tenant_id mungkin belum terikat saat ini → fallback random aman.
            $this->attributes['slug'] = OutletSlug::unique($value, $this->tenant_id ?? null);
        }
    }

    /**
     * Resolve OutletSetting dengan fallback ke defaults.
     * Tidak pernah return null — aman untuk langsung diakses.
     */
    public function resolveSettings(): OutletSetting
    {
        return $this->settings ?? new OutletSetting(OutletSetting::defaults());
    }
}
