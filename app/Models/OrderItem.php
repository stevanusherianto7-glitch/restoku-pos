<?php

namespace App\Models;

use App\Models\Concerns\UsesTenantConnection;
use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class OrderItem extends Model
{
    use HasFactory;
    use UsesTenantConnection;

    protected $guarded = ['id'];

    protected $casts = [
        'unit_price' => 'decimal:2',
        'subtotal' => 'decimal:2',
        'quantity' => 'integer',
    ];

    protected static function booted()
    {
        static::addGlobalScope(new TenantScope);

        static::creating(function (OrderItem $item) {
            if (! $item->tenant_id && auth()->check()) {
                $item->tenant_id = auth()->user()->tenant_id;
            }
        });
    }

    public function order()
    {
        return $this->belongsTo(Order::class);
    }

    public function menuItem()
    {
        return $this->belongsTo(MenuItem::class);
    }
}
