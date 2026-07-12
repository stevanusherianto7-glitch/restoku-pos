<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class OutletDailyPin extends Model
{
    use HasFactory;

    protected $guarded = ['id'];

    // pin_date disimpan sebagai string Y-m-d (tanpa cast date agar match eksak
    // dengan unique index dan updateOrCreate where-clause).
    protected $casts = [
        'verified_at' => 'datetime',
    ];

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    public function verifiedBy(): BelongsTo
    {
        return $this->belongsTo(User::class, 'verified_by');
    }
}
