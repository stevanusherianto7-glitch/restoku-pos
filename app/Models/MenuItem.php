<?php

namespace App\Models;

use App\Models\Concerns\UsesTenantConnection;
use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Builder;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class MenuItem extends Model
{
    use HasFactory;
    use UsesTenantConnection;

    protected $guarded = ['id'];

    protected $casts = [
        'price' => 'decimal:2',
        'is_available' => 'boolean',
        'is_popular' => 'boolean',
        'sort_order' => 'integer',
        'modifiers' => 'json',
        'stock' => 'integer',
        'stock_threshold' => 'integer',
        'track_stock' => 'boolean',
    ];

    // [L3] Alert stok: true kalau tracking aktif & stok <= threshold.
    public function getIsLowStockAttribute(): bool
    {
        return $this->track_stock && $this->stock <= $this->stock_threshold;
    }

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope);
    }

    // ─── Relations ──────────────────────────────────────────────────────────

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function category(): BelongsTo
    {
        return $this->belongsTo(MenuCategory::class, 'menu_category_id');
    }

    // ─── Scopes ─────────────────────────────────────────────────────────────

    /**
     * Buku menu tamu: item tersedia, untuk outlet tertentu ATAU global tenant.
     */
    public function scopeForGuestMenu(Builder $query, ?int $outletId): Builder
    {
        return $query->where('is_available', true)
            ->where(function (Builder $q) use ($outletId) {
                $q->whereNull('outlet_id');
                if ($outletId) {
                    $q->orWhere('outlet_id', $outletId);
                }
            })
            ->orderBy('sort_order')
            ->orderBy('name');
    }

    /**
     * URL foto aman (Cloudinary). Map dari image_path -> photo_url.
     */
    protected function getPhotoUrlAttribute(): ?string
    {
        return $this->image_path ?: null;
    }
}
