<?php

namespace App\Models;

use App\Models\Concerns\UsesTenantConnection;
use App\Models\Scopes\TenantScope;
use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Order extends Model
{
    use HasFactory;
    use UsesTenantConnection;

    protected $guarded = ['id'];

    // Status yang dipakai KDS / kasir. Disimpan sebagai konstanta supaya
    // konsisten dipakai di controller, bukan string bebas seperti sebelumnya.
    public const STATUS_ANTRIAN_MASUK = 'antrian_masuk';

    public const STATUS_DITERIMA = 'diterima';

    public const STATUS_SEDANG_DIMASAK = 'sedang_dimasak';

    public const STATUS_SELESAI_MASAK = 'selesai_masak';

    public const STATUS_SIAP_SAJIKAN = 'siap_sajikan';

    public const STATUS_SIAP_BAYAR = 'siap_bayar';

    public const STATUS_SELESAI = 'selesai';

    public const STATUS_DIBATALKAN = 'dibatalkan';

    // Tujuan order (routing layar dapur vs bar).
    public const DEST_KDS = 'kds';   // ada item makanan → Dapur/KDS

    public const DEST_BAR = 'bar';   // murni minuman → Bar/Waiter

    /**
     * S-07 — State machine order.
     * Transisi yang diizinkan. Status akhir (selesai/dibatalkan) bersifat terminal.
     * Tanpa ini, order "siap_bayar" bisa dipindah balik ke "antrian_masuk" (bug).
     */
    public const TRANSITIONS = [
        self::STATUS_ANTRIAN_MASUK => [
            self::STATUS_DITERIMA,
            self::STATUS_DIBATALKAN,
        ],
        self::STATUS_DITERIMA => [
            self::STATUS_SEDANG_DIMASAK,
            self::STATUS_DIBATALKAN,
        ],
        self::STATUS_SEDANG_DIMASAK => [
            self::STATUS_SELESAI_MASAK,
            self::STATUS_DIBATALKAN,
        ],
        self::STATUS_SELESAI_MASAK => [
            self::STATUS_SIAP_SAJIKAN,
            self::STATUS_DIBATALKAN,
        ],
        self::STATUS_SIAP_SAJIKAN => [
            self::STATUS_SIAP_BAYAR,
            self::STATUS_DIBATALKAN,
        ],
        self::STATUS_SIAP_BAYAR => [
            self::STATUS_SELESAI,
            self::STATUS_DIBATALKAN,
        ],
        self::STATUS_SELESAI => [],
        self::STATUS_DIBATALKAN => [],
    ];

    /**
     * Apakah transisi dari status saat ini ke $target diizinkan?
     */
    public function canTransitionTo(string $target): bool
    {
        if ($this->status === $target) {
            return true; // idempoten (re-set status sama = no-op)
        }

        return in_array($target, self::TRANSITIONS[$this->status] ?? [], true);
    }

    /**
     * Update status dengan validasi transisi. Throw jika ilegal.
     * Menggantikan update(['status'=>...]) mentah di controller.
     */
    public function transitionTo(string $target): void
    {
        if (! $this->canTransitionTo($target)) {
            throw new \InvalidArgumentException(
                "Transisi order ilegal: {$this->status} -> {$target}"
            );
        }

        $this->status = $target;
        $this->save();
    }

    protected $casts = [
        'subtotal' => 'decimal:2',
        'discount_amount' => 'decimal:2',
        'tax_amount' => 'decimal:2',
        'service_charge_amount' => 'decimal:2',
        'total' => 'decimal:2',
        'paid_at' => 'datetime',
        'cancelled_at' => 'datetime',
    ];

    /**
     * #3 — Wrapper query order yang menjamin isolasi tenant+outlet.
     * Ganti pemakaian Order::where('tenant_id', ...)->where('outlet_id', ...)
     * manual yang rawan lupa/typo. Semua akses order per-outlet lewat sini.
     */
    public static function forOutlet(Outlet $outlet)
    {
        return static::query()
            ->where('tenant_id', $outlet->tenant_id)
            ->where('outlet_id', $outlet->id);
    }

    /**
     * #3 — Wrapper query order per-tenant (tanpa outlet spesifik).
     */
    public static function byTenant(int $tenantId)
    {
        return static::query()->where('tenant_id', $tenantId);
    }

    /**
     * Fase 4 — Scope untuk orders yang layak diarsip (>N bulan, sudah selesai/batal).
     */
    public function scopeArchivable($query, int $months = 6)
    {
        return $query->where('created_at', '<', now()->subMonths($months))
            ->whereIn('status', [self::STATUS_SELESAI, self::STATUS_DIBATALKAN]);
    }

    protected static function booted()
    {
        static::addGlobalScope(new TenantScope);

        // Isi tenant_id otomatis dari user yang login saat order dibuat,
        // supaya controller tidak perlu set manual dan tidak mungkin lupa.
        static::creating(function (Order $order) {
            if (! $order->tenant_id && auth()->check()) {
                $order->tenant_id = auth()->user()->tenant_id;
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

    public function creator()
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    public function items()
    {
        return $this->hasMany(OrderItem::class);
    }

    /**
     * FNB-001: deteksi tipe item dalam 1 order utuh.
     * OrderItem tidak menyimpan type → baca lewat menuItem.category.type.
     */
    public function hasFood(): bool
    {
        return $this->items->contains(
            fn ($i) => ($i->menuItem?->category?->type ?? MenuCategory::TYPE_FOOD) === MenuCategory::TYPE_FOOD
        );
    }

    public function hasDrink(): bool
    {
        return $this->items->contains(
            fn ($i) => ($i->menuItem?->category?->type ?? MenuCategory::TYPE_FOOD) === MenuCategory::TYPE_BEVERAGE
        );
    }

    /**
     * Semua bagian yang ada sudah disajikan waiter.
     * allServed wajib sebelum order boleh masuk kasir (siap_bayar).
     */
    public function allServed(): bool
    {
        if ($this->hasFood() && ! $this->food_served_at) {
            return false;
        }
        if ($this->hasDrink() && ! $this->drink_served_at) {
            return false;
        }

        return true;
    }

    /**
     * Generate kode order unik per tenant, format ORD-MMDD-XX.
     * Dipanggil dari controller di dalam transaksi DB untuk hindari race condition.
     */
    public static function generateOrderCode(int $tenantId): string
    {
        // BUG-011 FIX: Lock tenant row dalam transaksi DB agar concurrent requests
        // tidak menghasilkan nomor urut ganda / race condition.
        Tenant::where('id', $tenantId)->lockForUpdate()->first();

        $todayCount = static::withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $tenantId)
            ->whereDate('created_at', now()->toDateString())
            ->count();

        return 'ORD-'.now()->format('md').'-'.str_pad((string) ($todayCount + 1), 2, '0', STR_PAD_LEFT);
    }
}
