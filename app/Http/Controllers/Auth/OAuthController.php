<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Log;
use Illuminate\Support\Str;
use Laravel\Socialite\Facades\Socialite;

/**
 * OAuth login via Google — khusus OWNER.
 *
 * Alur:
 *   1. Klik "Masuk dengan Google" → /oauth/google → redirect ke Google.
 *   2. Google redirect → /oauth/google/callback → Socialite ambil user.
 *   3. Email Google (sudah terverifikasi) jadi trust anchor:
 *        - Sudah ada user (owner) → login langsung (password lama tetap valid).
 *        - Belum ada → auto-register: buat Tenant + Outlet default + User owner.
 *   4. Setelah login, middleware `tenant` (EnsureTenantContext) jalan di
 *      request berikutnya → tenant context otomatis ter-set dari $user->tenant_id.
 *
 * Keamanan:
 *   - Hanya role 'owner' yang diizinkan. Email tak terverifikasi / null → 403.
 *   - Tidak ada cross-tenant: user dicari by email global (unique), login
 *     langsung ke tenant miliknya.
 *   - Auto-register dibatasi owner saja (staff wajib lewat PIN, bukan OAuth).
 */
class OAuthController extends Controller
{
    public function redirect(): \Symfony\Component\HttpFoundation\RedirectResponse
    {
        return Socialite::driver('google')->redirect();
    }

    public function callback(Request $request): RedirectResponse
    {
        if ($request->has('error')) {
            // Google mengirim ?error=access_denied saat user membatalkan.
            return redirect('/owner/login')->with('error', 'Otorisasi Google dibatalkan.');
        }

        try {
            /** @var \Laravel\Socialite\Two\User $google */
            $google = Socialite::driver('google')->user();
        } catch (\Throwable $e) {
            Log::warning('[OAuth Google] Gagal mengambil user: '.$e->getMessage());

            return redirect('/owner/login')->with('error', 'Gagal menghubungkan ke Google.');
        }

        $email = $google->getEmail();
        $raw = $google->getRaw();
        $verified = ($raw['email_verified'] ?? false) === true
            || str_ends_with((string) $email, '@gmail.com');
        if (! $email || ! $verified) {
            // Email tak tersedia atau tak terverifikasi → tolak (phishing guard).
            abort(403, 'Email dari Google tidak terverifikasi.');
        }

        $user = User::where('email', $email)->first();

        if (! $user) {
            $user = $this->registerOwnerFromGoogle($google, $email);
        } elseif ($user->role !== 'owner') {
            // Akun dengan email ini ada tapi bukan owner (mis. staff).
            // Jangan izinkan login OAuth ke akun staff.
            abort(403, 'Email ini terdaftar sebagai staf; gunakan login PIN.');
        }

        // Tautkan google_id bila belum (idempoten).
        if (! $user->google_id) {
            $user->google_id = $google->getId();
            $user->avatar_url = $google->getAvatar() ?? $user->avatar_url;
            $user->email_verified_at ??= now();
            $user->save();
        }

        if (! $user->tenant_id) {
            abort(403, 'Akun owner belum terhubung ke tenant.');
        }

        Auth::login($user, true);
        $request->session()->regenerate();

        return redirect()->intended('/owner/dashboard');
    }

    /**
     * Auto-register owner baru dari Google:
     *   buat Tenant (brand = nama depan email) + Outlet default (otomatis
     *   lewat Tenant::created) + User owner (password random, verifikasi email).
     */
    private function registerOwnerFromGoogle(\Laravel\Socialite\Two\User $google, string $email): User
    {
        $name = $google->getName() ?: explode('@', $email)[0];
        $brand = ucwords(explode('@', $email)[0]);

        $tenant = Tenant::create([
            'name' => $brand,
            'brand_name' => $brand,
            'email' => $email,
        ]);
        // Outlet default otomatis ter-buat lewat Tenant::created boot.

        $user = $tenant->users()->create([
            'name' => $name,
            'email' => $email,
            'role' => 'owner',
            'password' => bcrypt(Str::random(32)), // tak terpakai; login lewat Google
            'google_id' => $google->getId(),
            'avatar_url' => $google->getAvatar(),
            'email_verified_at' => now(),
        ]);

        return $user;
    }
}
