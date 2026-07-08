<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;
use Illuminate\Database\Eloquent\Relations\HasOne;

class Tenant extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    protected $casts = [
        'settings'                => 'json',
        'onboarding_completed_at' => 'datetime',
        // Kolom lama dipertahankan cast-nya sebagai fallback COALESCE
        // hingga migration drop-columns dijalankan setelah verifikasi.
        'pbjt_rate'           => 'decimal:2',
        'ppn_rate'            => 'decimal:2',
        'service_charge_rate' => 'decimal:2',
    ];

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
    public function getPlanAttribute(): string
    {
        return $this->subscription?->plan ?? 'basic';
    }
}
