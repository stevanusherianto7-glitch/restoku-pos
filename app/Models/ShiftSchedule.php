<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class ShiftSchedule extends Model
{
    protected $fillable = [
        'tenant_id',
        'user_id',
        'day_of_week',
        'shift_start',
        'shift_end',
    ];

    protected $casts = [
        'day_of_week' => 'integer',
        'shift_start' => 'datetime',
        'shift_end' => 'datetime',
    ];

    public function user()
    {
        return $this->belongsTo(User::class);
    }
}
