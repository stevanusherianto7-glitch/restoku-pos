<?php

namespace App\Http\Middleware;

use App\Models\Outlet;
use App\Models\User;
use App\Services\FeatureRegistry;
use App\Services\SettingsService;
use App\Services\TenantContext;
use Illuminate\Http\Request;
use Inertia\Middleware;

/**
 * HandleInertiaRequests — share data ke SEMUA halaman Inertia.
 *
 * Data yang dishare di sini tersedia di React via usePage().props:
 *   - auth.user         → identitas user yang login
 *   - subscription      → plan, status, fitur, trial info (MENGGANTIKAN MOCK_PLAN)
 *   - feature_registry  → feature_locks & plan_hierarchy dari FeatureRegistry
 *   - outlet            → outlet aktif user yang login
 *   - outlet_settings   → tax config dari TenantSetting (MENGGANTIKAN localStorage POS)
 *   - login_employees   → daftar karyawan dengan PIN hash (untuk StaffLogin PIN pad)
 *   - flash             → success/error message dari backend
 *
 * Frontend tidak perlu MOCK_PLAN, PLAN_FEATURES, atau FEATURE_LOCKS hardcoded lagi.
 * Semua feature gate membaca dari props ini.
 */
class HandleInertiaRequests extends Middleware
{
    protected $rootView = 'app';

    public function version(Request $request): ?string
    {
        return parent::version($request);
    }

    public function share(Request $request): array
    {
        $user = $request->user();
        $ctx = null;

        // TenantContext hanya tersedia jika user sudah login dan EnsureTenantContext sudah berjalan
        if ($user?->tenant_id) {
            try {
                $ctx = app(TenantContext::class);
                if (! $ctx->isInitialized()) {
                    $ctx->setFromUser($user);
                }
            } catch (\Throwable) {
                $ctx = null;
            }
        }

        // Tax config — dibaca dari TenantSetting, bukan localStorage
        // Tersedia di React via usePage().props.outlet_settings
        $taxConfig = null;
        if ($ctx) {
            try {
                $settings = app(SettingsService::class)->forTenant($ctx->id());
                $taxConfig = $settings->toTaxShareableArray();
            } catch (\Throwable) {
                $taxConfig = null;
            }
        }

        return [
            ...parent::share($request),

            // ── Auth ──────────────────────────────────────────────────────────
            'auth' => [
                'user' => $user ? [
                    'id' => $user->id,
                    'name' => $user->name,
                    'email' => $user->email,
                    'role' => $user->role,
                ] : null,
            ],

            // ── Subscription & Feature Gate ───────────────────────────────────
            // Menggantikan MOCK_PLAN = "pro" dan PLAN_FEATURES hardcoded di Shared.tsx
            'subscription' => $ctx ? [
                'plan' => $ctx->plan(),
                'status' => $ctx->subscription()->status,
                'is_trialing' => $ctx->isTrialing(),
                'days_left' => $ctx->daysLeftInTrial(),
                'plan_features' => FeatureRegistry::allFeaturesForPlan($ctx->plan()),
                'feature_locks' => FeatureRegistry::FEATURE_LOCKS,
            ] : null,

            // ── Outlet ────────────────────────────────────────────────────────
            // Fallback ke outlet pertama tenant kalau user belum di-bind ke outlet
            // (agar header "· Outlet ..." ikut brand, bukan mock 'Senopati').
            'outlet' => $user ? (function () use ($user, $ctx) {
                $outlet = $user->outlet;
                if (! $outlet && $ctx) {
                    $outlet = Outlet::where('tenant_id', $ctx->id())->first();
                }

                return $outlet ? ['id' => $outlet->id, 'name' => $outlet->name] : null;
            })() : null,

            // ── Outlets (untuk QR generator) ──────────────────────────────────
            // Daftar outlet milik tenant (TenantScope aktif → hanya outlet tenant ini).
            // Field slug wajib untuk build URL buku menu tamu /m/{slug}?t={meja}.
            'outlets' => $ctx ? Outlet::select('id', 'name', 'slug', 'is_active')
                ->orderBy('name')
                ->get()
                ->toArray() : [],

            // ── Menu Base URL (QR generator) ──────────────────────────────────
            // Base URL untuk QR buku menu tamu. Kosong → frontend pakai
            // window.location.origin (benar di produksi/VPS).
            // Di dev, isi MENU_BASE_URL=<URL cloudflared/ngrok/LAN> agar
            // HP bisa scan QR (localhost tidak reachable dari HP).
            'menu_base_url' => config('app.menu_base_url', ''),

            // ── Outlet Settings (Tax Config) ──────────────────────────────────
            // Menggantikan localStorage.getItem("outlet_tax_rate") di POS/Index.tsx
            // Format: { is_tax_active, tax_type, tax_rate, service_charge }
            'outlet_settings' => $taxConfig,

            // ── Outlet Geo (untuk verifikasi geolokasi kasir di POS) ──────────
            // Koordinat + radius outlet aktif (sudah ada di model Outlet).
            // Dipakai widget GeoPinVerify di pojok kanan atas dashboard kasir.
            'outlet_geo' => $user ? (function () use ($user, $ctx) {
                $outlet = $user->outlet;
                if (! $outlet && $ctx) {
                    $outlet = Outlet::where('tenant_id', $ctx->id())->first();
                }

                return $outlet ? [
                    'latitude' => $outlet->latitude ? (float) $outlet->latitude : null,
                    'longitude' => $outlet->longitude ? (float) $outlet->longitude : null,
                    'geo_radius_meters' => (int) ($outlet->geo_radius_meters ?? 50),
                ] : null;
            })() : null,

            // ── Login Employees ───────────────────────────────────────────────
            // Tersedia di halaman /login untuk StaffLogin PIN verification.
            // Hanya share pada halaman login — null di halaman lain (efisiensi).
            // PIN yang di-share adalah hash (bcrypt), BUKAN plaintext.
            'login_employees' => fn () => $request->routeIs('login')
                ? User::whereNotNull('tenant_id')
                    ->where('role', '!=', 'owner')
                    ->select('id', 'name', 'role')
                    ->get()
                    ->map(fn ($u) => ['id' => $u->id, 'name' => $u->name, 'role' => $u->role, 'pin' => null])
                    ->toArray()
                : null,

            // ── Cloudinary (public cloud name only — untuk display foto menu) ──
            // Secret TIDAK pernah di-share ke client. Upload tetap dari backend.
            // Cloud name diambil dari CLOUDINARY_URL (format cloudinary://@cloud).
            'cloudinary' => (function () {
                $url = config('services.cloudinary.url');
                if (! $url || ! str_starts_with($url, 'cloudinary://')) {
                    return null;
                }
                $host = parse_url($url, PHP_URL_HOST);

                return $host ? ['cloud_name' => $host] : null;
            })(),

            // ── Flash Messages ────────────────────────────────────────────────
            'flash' => [
                'success' => fn () => $request->session()->get('success'),
                'error' => fn () => $request->session()->get('error'),
            ],
        ];
    }
}
