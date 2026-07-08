<?php

namespace App\Services;

use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Support\Facades\App;

/**
 * TenantContext — single source of truth untuk "tenant siapa yang aktif sekarang".
 *
 * Di-bind sebagai singleton per request di AppServiceProvider:
 *   $this->app->singleton(TenantContext::class, fn() => new TenantContext());
 *
 * Cara penggunaan:
 *   // HTTP: diisi otomatis oleh EnsureTenantContext middleware
 *   // Artisan: app(TenantContext::class)->setTenantId(1);
 *   // Test: app(TenantContext::class)->setFromUser($owner);
 *
 * Semua controller & service yang butuh tenant_id cukup inject class ini.
 * Tidak ada lagi Auth::user()->tenant_id tersebar di 15+ controller.
 *
 * Performance: tenant dan subscription di-cache sebagai property — hanya 1x DB hit
 * per request meskipun dipanggil berkali-kali.
 */
class TenantContext
{
    private ?int          $tenantId     = null;
    private ?Tenant       $tenant       = null;
    private ?Subscription $subscription = null;

    // ─── Setters ──────────────────────────────────────────────────────────────

    /**
     * Set context dari User yang sudah login (dipanggil oleh EnsureTenantContext).
     */
    public function setFromUser(User $user): void
    {
        $this->tenantId     = $user->tenant_id;
        $this->tenant       = null; // reset cache → lazy load saat dibutuhkan
        $this->subscription = null;

        // Bind ke container sehingga TenantScope bisa membacanya
        App::bind('tenant.id', fn () => $this->tenantId);
    }

    /**
     * Set context manual (untuk artisan commands dan queue jobs).
     * Command harus memanggil ini sebelum menjalankan query apapun.
     */
    public function setTenantId(int $tenantId): void
    {
        $this->tenantId     = $tenantId;
        $this->tenant       = null;
        $this->subscription = null;

        App::bind('tenant.id', fn () => $this->tenantId);
    }

    // ─── Getters ──────────────────────────────────────────────────────────────

    public function id(): int
    {
        if ($this->tenantId === null) {
            throw new \RuntimeException(
                'TenantContext belum diinisialisasi. ' .
                'Pastikan EnsureTenantContext middleware sudah dipasang, ' .
                'atau panggil setTenantId() di artisan command.'
            );
        }
        return $this->tenantId;
    }

    /**
     * Lazy-load tenant — hanya 1x DB hit per request.
     */
    public function tenant(): Tenant
    {
        if ($this->tenant === null) {
            // withoutGlobalScope: Tenant tidak pakai TenantScope, tapi aman di sini
            $this->tenant = Tenant::findOrFail($this->id());
        }
        return $this->tenant;
    }

    /**
     * Lazy-load subscription aktif — hanya 1x DB hit per request.
     * Jika tidak ada subscription → return default (plan=basic, status=expired).
     */
    public function subscription(): Subscription
    {
        if ($this->subscription === null) {
            $this->subscription = Subscription::where('tenant_id', $this->id())
                ->active()
                ->latest()
                ->first()
                // Fallback: tenant tanpa subscription → basic expired
                ?? new Subscription([
                    'tenant_id' => $this->id(),
                    'plan'      => 'basic',
                    'status'    => 'expired',
                ]);
        }
        return $this->subscription;
    }

    // ─── Plan & Feature helpers ───────────────────────────────────────────────

    public function plan(): string
    {
        return $this->subscription()->plan;
    }

    public function hasFeature(string $feature): bool
    {
        return FeatureRegistry::planHasFeature($this->plan(), $feature);
    }

    public function isTrialing(): bool
    {
        return $this->subscription()->isTrialing();
    }

    public function daysLeftInTrial(): int
    {
        return $this->subscription()->daysLeftInTrial();
    }

    public function daysLeftInPeriod(): ?int
    {
        return $this->subscription()->daysLeftInPeriod();
    }

    /**
     * Apakah context sudah diinisialisasi? (berguna untuk tests)
     */
    public function isInitialized(): bool
    {
        return $this->tenantId !== null;
    }

    /**
     * Reset context — berguna untuk tests antar-tenant.
     */
    public function reset(): void
    {
        $this->tenantId     = null;
        $this->tenant       = null;
        $this->subscription = null;

        if (App::bound('tenant.id')) {
            App::offsetUnset('tenant.id');
        }
    }
}
