<?php

namespace App\Models;

use App\Models\Concerns\UsesTenantConnection;
use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Reservation extends Model
{
    use HasFactory;
    use UsesTenantConnection;

    protected $guarded = ['id'];

    protected $casts = [
        'date' => 'date',
        'guests' => 'integer',
    ];

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope);

        static::creating(function (Reservation $reservation) {
            // Auto-set tenant_id dari user yang login (untuk endpoint staff)
            if (! $reservation->tenant_id && auth()->check()) {
                $reservation->tenant_id = auth()->user()->tenant_id;
            }
        });
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    public function outlet()
    {
        return $this->belongsTo(Outlet::class);
    }

    /**
     * Generate kode reservasi unik per tenant, format RSV-NNN.
     */
    public static function generateCode(int $tenantId): string
    {
        $count = static::withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenantId)
            ->lockForUpdate()
            ->count();

        return 'RSV-'.str_pad((string) ($count + 1), 3, '0', STR_PAD_LEFT);
    }
}
