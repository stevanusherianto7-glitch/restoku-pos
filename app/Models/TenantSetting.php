<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * TenantSetting — konfigurasi bisnis per tenant (pajak, notif, integrasi, white-label).
 *
 * Menggunakan pola "getOrCreate" via SettingsService sehingga controller
 * tidak pernah menemukan null settings — selalu ada row dengan nilai default.
 *
 * @property int $tenant_id
 * @property string $tax_type
 * @property float $pbjt_rate
 * @property float $ppn_rate
 * @property float $service_charge_rate
 * @property bool $wa_notif_enabled
 * @property ?string $wa_phone_number
 * @property bool $email_notif_enabled
 */
class TenantSetting extends Model
{
    protected $table = 'tenant_settings';

    protected $fillable = [
        'tenant_id',
        'tax_type',
        'pbjt_rate',
        'ppn_rate',
        'service_charge_rate',
        'wa_notif_enabled',
        'wa_phone_number',
        'email_notif_enabled',
        'gofood_merchant_id',
        'grab_merchant_id',
        'shopeefood_merchant_id',
        'logo_path',
        'primary_color',
        'brand_display_name',
    ];

    protected $casts = [
        'pbjt_rate' => 'float',
        'ppn_rate' => 'float',
        'service_charge_rate' => 'float',
        'wa_notif_enabled' => 'boolean',
        'email_notif_enabled' => 'boolean',
    ];

    // ─── Defaults ─────────────────────────────────────────────────────────────

    /**
     * Nilai default ketika tenant belum punya row settings.
     * Dipakai oleh SettingsService::forTenant() sebagai fallback.
     */
    public static function defaults(): array
    {
        return [
            'tax_type' => 'pbjt',
            'pbjt_rate' => 10.00,
            'ppn_rate' => 11.00,
            'service_charge_rate' => 0.00,
            'wa_notif_enabled' => false,
            'wa_phone_number' => null,
            'email_notif_enabled' => true,
            'gofood_merchant_id' => null,
            'grab_merchant_id' => null,
            'shopeefood_merchant_id' => null,
            'logo_path' => null,
            'primary_color' => null,
            'brand_display_name' => null,
        ];
    }

    // ─── Relations ────────────────────────────────────────────────────────────

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    // ─── Accessors ────────────────────────────────────────────────────────────

    /** Tarif pajak aktif berdasarkan tax_type yang dipilih. */
    protected function getActiveTaxRateAttribute(): float
    {
        return $this->tax_type === 'ppn' ? $this->ppn_rate : $this->pbjt_rate;
    }

    /**
     * Data pajak yang aman untuk di-share ke frontend via Inertia shared props.
     * Dipakai oleh HandleInertiaRequests untuk menggantikan localStorage POS.
     */
    public function toTaxShareableArray(): array
    {
        $isActive = $this->tax_type !== 'none';

        return [
            'is_tax_active' => $isActive,
            'tax_type' => $this->tax_type ?? 'pbjt',
            'tax_rate' => $isActive ? (float) ($this->active_tax_rate ?? 10) : 0,
            'service_charge' => $isActive ? (float) ($this->service_charge_rate ?? 0) : 0,
        ];
    }
}
