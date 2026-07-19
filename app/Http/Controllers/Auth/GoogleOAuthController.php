<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Outlet;
use App\Models\Scopes\TenantScope;
use App\Models\Tenant;
use App\Models\User;
use App\Services\OutletSlug;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Str;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Laravel\Socialite\Facades\Socialite;

/**
 * Owner login via Google OAuth ("Masuk dengan Google").
 *
 * Design (arsitek): owner lupa password -> diarahkan ke Gmail, Google yang
 * verifikasi identitas, tanpa reset via email (MAIL_MAILER=log di dev).
 *
 * Flow:
 *   GET  /oauth/google          -> redirect ke Google consent
 *   GET  /oauth/google/callback -> Socialite exchange code -> user info
 *        - email/null/unverified -> tolak (403-safe redirect dgn flash)
 *        - email sudah ada       -> login sebagai user tsb (role apa pun)
 *        - email baru            -> auto-create tenant + outlet default + owner
 *
 * NOTE KEAMANAN: GOOGLE_CLIENT_ID/SECRET diisi user di .env (TIDAK pernah lewat
 * chat). Tanpa credential, redirect() akan throw — ditangani di route web dengan
 * try/catch agar tidak 500 mentah.
 */
class GoogleOAuthController extends Controller
{
    public function redirect(): RedirectResponse
    {
        try {
            return Socialite::driver('google')
                ->scopes(['openid', 'email', 'profile'])
                ->redirect();
        } catch (\Throwable $e) {
            // Tanpa GOOGLE_CLIENT_ID/SECRET di .env -> Socialite throw.
            // Jangan 500; arahkan balik dengan pesan jelas.
            return redirect('/owner/login')
                ->withErrors(['email' => 'OAuth Google belum dikonfigurasi. Isi GOOGLE_CLIENT_ID/SECRET di .env.']);
        }
    }

    public function callback(Request $request): RedirectResponse
    {
        if (! $request->filled('code')) {
            return redirect('/owner/login')
                ->withErrors(['email' => 'Otorisasi Google dibatalkan atau gagal.']);
        }

        try {
            $google = Socialite::driver('google')->user();
        } catch (\Throwable $e) {
            return redirect('/owner/login')
                ->withErrors(['email' => 'Gagal menghubungi Google: '.$e->getMessage()]);
        }

        $result = $this->resolveOrCreate($google);

        if ($result['error']) {
            return redirect('/owner/login')->withErrors(['email' => $result['error']]);
        }

        /** @var User $user */
        $user = $result['user'];
        Auth::login($user, true);
        $request->session()->regenerate();

        return redirect()->intended('/owner/dashboard');
    }

    /**
     * Resolve existing owner by Google email, atau auto-create tenant+outlet+owner
     * untuk email Google baru. Returns ['user' => ?User, 'error' => ?string].
     */
    public function resolveOrCreate(SocialiteUser $google): array
    {
        $email = $google->getEmail();
        $name = $google->getName() ?: ($google->getNickname() ?: 'Owner Restoku');

        // Guard: email wajib ada & terverifikasi oleh Google.
        // Google OIDC payload menyertakan 'email_verified' (bool) di raw user.
        $raw = method_exists($google, 'getRaw') ? $google->getRaw() : [];
        $verified = $raw['email_verified'] ?? true;
        if (! $email || $verified === false) {
            return ['user' => null, 'error' => 'Email Google tidak tersedia atau belum terverifikasi.'];
        }

        // 1) Email sudah terdaftar -> langsung login sebagai user tsb.
        $existing = User::withoutGlobalScope(TenantScope::class)
            ->where('email', $email)
            ->first();
        if ($existing) {
            return ['user' => $existing, 'error' => null];
        }

        // 2) Email baru -> auto-create tenant + outlet default + owner.
        $tenant = Tenant::create([
            'name' => $name,
            'brand_name' => $name,
            'email' => $email,
        ]);
        // Tenant boot-created default outlet (OutletSlug::unique) via model event.

        $user = User::create([
            'name' => $name,
            'email' => $email,
            'password' => Hash::make(Str::random(32)), // owner login via Google, bukan password
            'tenant_id' => $tenant->id,
            'role' => 'owner',
            'email_verified_at' => now(),
        ]);

        return ['user' => $user, 'error' => null];
    }
}
