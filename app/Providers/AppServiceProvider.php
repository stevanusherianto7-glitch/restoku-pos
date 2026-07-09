<?php

namespace App\Providers;

use App\Services\FeatureRegistry;
use App\Services\SettingsService;
use App\Services\TenantConnection;
use App\Services\TenantContext;
use App\Services\TenantReadConnection;
use Illuminate\Auth\Middleware\Authenticate;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\ServiceProvider;

class AppServiceProvider extends ServiceProvider
{
    /**
     * Register any application services.
     */
    public function register(): void
    {
        // TenantContext: singleton per request — diisi oleh EnsureTenantContext middleware.
        // Semua controller, service, dan scope membaca tenant dari sini.
        // Tidak ada lagi Auth::user()->tenant_id tersebar di mana-mana.
        $this->app->singleton(TenantContext::class, fn () => new TenantContext);

        // Fase 2: resolver koneksi per-tenant (schema-per-tenant).
        $this->app->singleton(TenantConnection::class, fn () => new TenantConnection(app(TenantContext::class)));

        // Fase 2.7: read replica resolver untuk beban baca tamu.
        $this->app->singleton(TenantReadConnection::class, fn () => new TenantReadConnection(app(TenantConnection::class)));

        // SettingsService: singleton dengan internal cache — aman di semua context.
        $this->app->singleton(SettingsService::class, fn () => new SettingsService);

        // FeatureRegistry adalah stateless (konstanta semua) — no binding needed.
        // Akses via FeatureRegistry::planHasFeature() atau inject langsung.
    }

    /**
     * Bootstrap any application services.
     */
    public function boot(): void
    {
        // Redirect middleware 'auth' ke halaman login staf.
        Authenticate::redirectUsing(fn () => '/login');

        // Cegah cURL error 60 (SSL certificate verification) pada lingkungan pengembangan lokal (Windows PHP CLI)
        if ($this->app->isLocal()) {
            Http::globalOptions(['verify' => false]);
        }
    }
}
