<?php

namespace App\Models;

use App\Services\OutletSlug;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Tenant extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'settings' => 'json',
        'onboarding_completed_at' => 'datetime',
        // Kolom lama dipertahankan cast-nya sebagai fallback COALESCE
        // hingga migration drop-columns dijalankan setelah verifikasi.
        'pbjt_rate' => 'decimal:2',
        'ppn_rate' => 'decimal:2',
        'service_charge_rate' => 'decimal:2',
    ];

    protected static function booted(): void
    {
        // Fase 0: tenant tanpa outlet = dead-end (QR/menu tamu 404).
        // Jaminan: tiap tenant yang dibuat otomatis punya 1 outlet default
        // ("Outlet Utama") sehingga URL /m/{slug} SELALU punya target.
        // Dijalankan setelah parent tersimpan (butuh $this->id).
        static::created(function (Tenant $tenant) {
            if ($tenant->outlets()->doesntExist()) {
                $name = $tenant->brand_name ?: ($tenant->name ?: 'Outlet Utama');
                $tenant->outlets()->create([
                    'name' => $name,
                    'slug' => OutletSlug::unique($name, $tenant->id),
                    'is_active' => true,
                ]);
                // Slug diisi eksplisit (global-unique) — lihat OutletSlug service.
            }
        });
    }

    // ─── Relations ────────────────────────────────────────────────────────────

    public function outlets(): HasMany
    {
        return $this->hasMany(Outlet::class);
    }

    public function users(): HasMany
    {
        return $this->hasMany(User::class);
    }

    /** Subscription aktif tenant. Satu tenant punya satu subscription aktif. */
    public function subscription(): HasOne
    {
        return $this->hasOne(Subscription::class)->latestOfMany();
    }

    /** Semua history subscription. */
    public function subscriptions(): HasMany
    {
        return $this->hasMany(Subscription::class);
    }

    /** Konfigurasi bisnis tenant (pajak, notif, integrasi). */
    public function settings(): HasOne
    {
        return $this->hasOne(TenantSetting::class);
    }

    // ─── Helpers ──────────────────────────────────────────────────────────────

    /**
     * Resolve plan dari subscription aktif.
     * Fallback ke 'basic' jika tidak ada subscription.
     */
    protected function getPlanAttribute(): string
    {
        return $this->subscription?->plan ?? 'basic';
    }
}
