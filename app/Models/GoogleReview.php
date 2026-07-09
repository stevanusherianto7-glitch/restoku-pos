<?php

namespace App\Models;

use App\Models\Concerns\UsesTenantConnection;
use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class GoogleReview extends Model
{
    use HasFactory;
    use UsesTenantConnection;

    protected $guarded = ['id'];

    protected $casts = [
        'rating' => 'integer',
        'replied_at' => 'datetime',
        'reviewed_at' => 'datetime',
    ];

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope);

        static::creating(function (GoogleReview $review) {
            if (! $review->tenant_id && auth()->check()) {
                $review->tenant_id = auth()->user()->tenant_id;
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
}
