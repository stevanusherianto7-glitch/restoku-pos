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

    // Status memasak per-item (5-tahap, mandiri dari order).
    public const COOK_DIKONFIRMASI = 'dikonfirmasi';

    public const COOK_SEDANG_DIMASAK = 'sedang_dimasak';

    public const COOK_SELESAI_MASAK = 'selesai_masak';

    public const COOK_SIAP_SAJIKAN = 'siap_sajikan';

    public const COOK_SELESAI = 'selesai';

    public const COOK_TRANSITIONS = [
        self::COOK_DIKONFIRMASI => [self::COOK_SEDANG_DIMASAK],
        self::COOK_SEDANG_DIMASAK => [self::COOK_SELESAI_MASAK],
        self::COOK_SELESAI_MASAK => [self::COOK_SIAP_SAJIKAN],
        self::COOK_SIAP_SAJIKAN => [self::COOK_SELESAI],
        self::COOK_SELESAI => [],
    ];

    // Label tampilan per-item (persis kata user).
    public const COOK_LABELS = [
        self::COOK_DIKONFIRMASI => 'dikonfirmasi',
        self::COOK_SEDANG_DIMASAK => 'sedang dimasak',
        self::COOK_SELESAI_MASAK => 'selesai masak',
        self::COOK_SIAP_SAJIKAN => 'siap sajikan',
        self::COOK_SELESAI => 'selesai',
    ];

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
            if (empty($item->cook_status)) {
                $item->cook_status = self::COOK_DIKONFIRMASI;
            }
        });
    }

    /**
     * Apakah transisi cook_status legal?
     */
    public function canCookTransitionTo(string $target): bool
    {
        if ($this->cook_status === $target) {
            return true;
        }

        return in_array($target, self::COOK_TRANSITIONS[$this->cook_status] ?? [], true);
    }

    /**
     * Advance 1 tahap (idempoten).
     */
    public function advanceCook(): void
    {
        $next = self::COOK_TRANSITIONS[$this->cook_status][0] ?? null;
        if ($next) {
            $this->cook_status = $next;
            $this->save();
        }
    }

    /**
     * Step index 1-5 untuk tracker FE.
     */
    public function cookStep(): int
    {
        return array_search($this->cook_status, array_keys(self::COOK_LABELS), true) + 1;
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
