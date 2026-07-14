<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class Expense extends Model
{
    protected $fillable = [
        'tenant_id',
        'outlet_id',
        'category',
        'description',
        'amount',
        'expense_date',
        'is_recurring',
    ];

    protected $casts = [
        'amount' => 'decimal:2',
        'is_recurring' => 'boolean',
        'expense_date' => 'date',
    ];
}
