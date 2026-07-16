<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OutletTable extends Model
{
    protected $fillable = [
        'tenant_id', 'outlet_id', 'label', 'pin_hash', 'last_scan_token',
        'latitude', 'longitude', 'is_queue', 'qr_type',
    ];

    protected $casts = [
        'latitude' => 'float',
        'longitude' => 'float',
        'is_queue' => 'boolean',
    ];

    protected $appends = ['pin'];

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    /**
     * Plain-text PIN untuk display ke owner/waiter (generate ulang dari seed deterministik).
     * Tidak disimpan sebagai plaintext di DB.
     */
    protected function getPinAttribute(): string
    {
        return self::derivePin($this->outlet_id, $this->label);
    }

    /**
     * Derive PIN 4-digit stabil per (outlet, label) tanpa simpan plaintext.
     * Mirror DailyPinService::derivePlain.
     */
    public static function derivePin(int $outletId, string $label): string
    {
        $seed = hash('sha256', "restoku:tablepin:{$outletId}:{$label}");
        $digits = substr(preg_replace('/\D/', '', $seed), -4);

        return str_pad($digits, 4, '0', STR_PAD_LEFT);
    }
}
