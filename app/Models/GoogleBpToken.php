<?php

namespace App\Models;

use App\Models\Concerns\UsesTenantConnection;
use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GoogleBpToken extends Model
{
    use HasFactory;
    use UsesTenantConnection;

    protected $guarded = ['id'];

    /**
     * Token disimpan terenkripsi di DB (Laravel encrypted cast).
     * Refresh token jangan pernah di-log / di-expose ke FE.
     */
    protected $casts = [
        'access_token' => 'encrypted',
        'refresh_token' => 'encrypted',
        'expires_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope);

        static::creating(function (GoogleBpToken $token) {
            if (! $token->tenant_id && auth()->check()) {
                $token->tenant_id = auth()->user()->tenant_id;
            }
        });
    }

    public function tenant()
    {
        return $this->belongsTo(Tenant::class);
    }

    /** Token masih berlaku (buffer 5 menit)? */
    public function isExpired(): bool
    {
        return ! $this->expires_at || $this->expires_at->subMinutes(5)->isPast();
    }
}
