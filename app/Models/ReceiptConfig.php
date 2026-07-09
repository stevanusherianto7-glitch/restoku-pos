<?php

namespace App\Models;

use App\Models\Concerns\UsesTenantConnection;
use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class ReceiptConfig extends Model
{
    use HasFactory;
    use UsesTenantConnection;

    protected $guarded = ['id'];

    protected $casts = [
        'show_npwp' => 'boolean',
        'show_nib' => 'boolean',
        'show_service_charge' => 'boolean',
        'show_pbjt' => 'boolean',
        'auto_write_cashier' => 'boolean',
    ];

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope);
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Ambil config milik tenant, atau buat dengan default jika belum ada.
     */
    public static function forTenant(int $tenantId): self
    {
        return static::withoutGlobalScope(TenantScope::class)
            ->firstOrCreate(
                ['tenant_id' => $tenantId],
                [
                    'header' => 'RESTOKU',
                    'footer' => "Terima kasih atas kunjungan Anda!\nSampai jumpa kembali.",
                    'show_npwp' => false,
                    'show_nib' => false,
                    'show_service_charge' => false,
                    'show_pbjt' => true,
                    'paper_width' => '80mm',
                    'font_type' => 'font-a',
                    'print_density' => 'normal',
                    'auto_write_cashier' => true,
                    'void_policy' => 'audit_full',
                ]
            );
    }
}
