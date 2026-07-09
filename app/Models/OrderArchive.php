<?php

namespace App\Models;

use App\Models\Concerns\UsesTenantConnection;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

/**
 * Fase 4 — Orders yang sudah diarsip (cold storage, >6 bulan).
 * Mirror Order, tapi di tabel orders_archive. Read-only untuk compliance.
 */
class OrderArchive extends Model
{
    use HasFactory;
    use UsesTenantConnection;

    protected $table = 'orders_archive';

    protected $guarded = ['id'];

    protected $casts = [
        'paid_at' => 'datetime',
        'cancelled_at' => 'datetime',
        'archived_at' => 'datetime',
    ];
}
