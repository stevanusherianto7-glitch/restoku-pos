<?php

namespace App\Models;

use Carbon\Carbon;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * Model Subscription — merepresentasikan paket & status billing satu tenant.
 *
 * Status lifecycle:
 *   trialing → active → (past_due → active atau expired)
 *                     → cancelled → expired
 *
 * Keputusan arsitektur (Senior Architect):
 *   - Tenant existing di-assign plan='pro', status='active', period_end=null
 *     (grandfathered model — tidak ada akses yang terputus)
 *   - period_end=null berarti perpetual, tidak ada auto-expiry
 *   - Ketika billing siap: php artisan subscription:enforce --grace-days=30
 *
 * @property int $id
 * @property int $tenant_id
 * @property string $plan 'basic'|'pro'|'enterprise'
 * @property string $status 'trialing'|'active'|'past_due'|'cancelled'|'expired'
 * @property ?Carbon $trial_ends_at
 * @property ?Carbon $current_period_start
 * @property ?Carbon $current_period_end
 * @property ?Carbon $cancelled_at
 * @property ?array $metadata
 */
class Subscription extends Model
{
    /** Plan yang didukung (harus sinkron dengan config/subscription.php). */
    public const PLANS = ['basic', 'pro', 'enterprise'];

    protected $fillable = [
        'tenant_id',
        'plan',
        'status',
        'trial_ends_at',
        'current_period_start',
        'current_period_end',
        'cancelled_at',
        'metadata',
    ];

    protected $casts = [
        'trial_ends_at' => 'datetime',
        'current_period_start' => 'datetime',
        'current_period_end' => 'datetime',
        'cancelled_at' => 'datetime',
        'metadata' => 'array',
    ];

    // ─── Relations ────────────────────────────────────────────────────────────

    public function tenant(): BelongsTo
    {
        return $this->belongsTo(Tenant::class);
    }

    // ─── Plan helpers ──────────────────────────────────────────────────────

    /** True jika $plan adalah salah satu plan valid (basic/pro/enterprise). */
    public static function isValidPlan(?string $plan): bool
    {
        return in_array($plan, self::PLANS, true);
    }

    // ─── Status helpers ───────────────────────────────────────────────────────

    /** Subscription dianggap aktif jika status active, trialing, atau past_due (grace period). */
    public function isActive(): bool
    {
        if (! in_array($this->status, ['active', 'trialing', 'past_due'])) {
            return false;
        }

        // Jika period_end null → perpetual/grandfathered, selalu aktif
        if ($this->current_period_end === null) {
            return true;
        }

        return $this->current_period_end->isFuture();
    }

    public function isTrialing(): bool
    {
        return $this->status === 'trialing'
            && $this->trial_ends_at !== null
            && $this->trial_ends_at->isFuture();
    }

    public function isCancelled(): bool
    {
        return $this->status === 'cancelled';
    }

    public function isExpired(): bool
    {
        if ($this->status === 'expired') {
            return true;
        }
        if ($this->current_period_end === null) {
            return false;
        }

        return $this->current_period_end->isPast() && $this->status !== 'trialing';
    }

    /**
     * Hari tersisa dalam trial. 0 jika sudah expired atau bukan trialing.
     */
    public function daysLeftInTrial(): int
    {
        if (! $this->isTrialing()) {
            return 0;
        }

        return max(0, (int) now()->diffInDays($this->trial_ends_at, false));
    }

    /**
     * Hari tersisa hingga period_end. null jika perpetual.
     */
    public function daysLeftInPeriod(): ?int
    {
        if ($this->current_period_end === null) {
            return null;
        }

        return max(0, (int) now()->diffInDays($this->current_period_end, false));
    }

    // ─── Scopes ───────────────────────────────────────────────────────────────

    public function scopeActive($query)
    {
        return $query->whereIn('status', ['active', 'trialing', 'past_due'])
            ->where(function ($q) {
                $q->whereNull('current_period_end')
                    ->orWhere('current_period_end', '>', now());
            });
    }

    public function scopeExpired($query)
    {
        return $query->where(function ($q) {
            $q->where('status', 'expired')
                ->orWhere(function ($q2) {
                    $q2->whereNotNull('current_period_end')
                        ->where('current_period_end', '<=', now())
                        ->whereNotIn('status', ['trialing', 'cancelled']);
                });
        });
    }

    public function scopeForPlan($query, string $plan)
    {
        return $query->where('plan', $plan);
    }
}
