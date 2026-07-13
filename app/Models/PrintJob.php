<?php

namespace App\Models;

use App\Models\Concerns\UsesTenantConnection;
use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class PrintJob extends Model
{
    use HasFactory;
    use UsesTenantConnection;

    protected $guarded = ['id'];

    protected $casts = [
        'retry_count' => 'integer',
    ];

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope);

        static::creating(function (PrintJob $job) {
            if (! $job->tenant_id && auth()->check()) {
                $job->tenant_id = auth()->user()->tenant_id;
            }
        });
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    /**
     * Generate kode print job unik per tenant, format PRJ-NNNN.
     */
    public static function generateCode(int $tenantId): string
    {
        $count = static::withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenantId)
            ->lockForUpdate()
            ->count();

        return 'PRJ-'.str_pad((string) ($count + 1), 4, '0', STR_PAD_LEFT);
    }
}
