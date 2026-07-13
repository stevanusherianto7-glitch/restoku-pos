<?php

namespace App\Models;

use App\Models\Concerns\UsesTenantConnection;
use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Fase 3 — Rollup penjualan bulanan per outlet.
 */
class SalesMonthlyRollup extends Model
{
    use HasFactory;
    use UsesTenantConnection;

    protected static function booted(): void
    {
        static::addGlobalScope(new TenantScope);
    }

    protected $guarded = ['id'];

    protected $casts = [
        'gross_revenue' => 'decimal:2',
        'net_revenue' => 'decimal:2',
        'avg_order_value' => 'decimal:2',
    ];
}
