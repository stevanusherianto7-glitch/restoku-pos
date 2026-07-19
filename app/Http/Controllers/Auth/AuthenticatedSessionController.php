<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use App\Models\Scopes\TenantScope;
use App\Models\Subscription;
use App\Models\User;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
use Illuminate\Support\Facades\Hash;
use Illuminate\Validation\ValidationException;

/**
 * Skeleton auth session-based (belum pakai Sanctum/Fortify - cukup untuk
 * halaman Inertia yang stateful). Tujuannya cuma satu: sebelum ini TIDAK ADA
 * endpoint POST /login sama sekali, jadi form login di frontend tidak
 * tersambung ke apa pun. Silakan perluas (rate limiting, 2FA, dsb) sesuai
 * kebutuhan RESTOKU_INSTRUCTIONS.md.
 */
class AuthenticatedSessionController extends Controller
{
    /**
     * Login untuk staf (cashier/admin/kitchen/waiter). Role 'owner' ditolak
     * di sini supaya owner wajib lewat /owner/login (pemisahan yang sudah
     * diisyaratkan lewat adanya dua halaman login terpisah di routes lama).
     */
    public function storeStaff(Request $request): RedirectResponse
    {
        if ($request->has('pin')) {
            $pin = $request->input('pin');
            // SECURITY (C-1): never trust a raw role param to bypass PIN verification.
            // Only match by hashed PIN; plaintext fallback removed. Load is scoped by
            // role (owner excluded) — tenant scoping happens post-login via TenantContext.
            // SECURITY FIX: Use cursor() to avoid loading all users into memory (OOM risk at scale).
            $matchedUser = null;
            // Cross-tenant PIN lookup (bypass TenantScope — same reason as email login).
            $users = TenantScope::bypass(fn () => User::where('role', '!=', 'owner')
                ->whereNotNull('password')
                ->select('id', 'password', 'role', 'tenant_id', 'outlet_id', 'name')
                ->cursor()
            );
            foreach ($users as $u) {
                if (Hash::check($pin, $u->password)) {
                    $matchedUser = $u;
                    break;
                }
            }
            if ($matchedUser) {
                Auth::login($matchedUser, $request->boolean('remember', true));
                $request->session()->regenerate();

                if ($matchedUser->role === 'kitchen') {
                    return redirect('/kds');
                } elseif ($matchedUser->role === 'waiter') {
                    return redirect('/waiter-bar');
                }

                return redirect('/pos');
            }
            throw ValidationException::withMessages([
                'pin' => 'PIN otorisasi salah atau tidak terdaftar.',
            ]);
        }

        return $this->attemptLogin($request, allowedRoles: ['cashier', 'admin', 'kitchen', 'waiter', 'manager'], redirectTo: '/pos');
    }

    /**
     * Login untuk owner saja.
     */
    public function storeOwner(Request $request): RedirectResponse
    {
        return $this->attemptLogin($request, allowedRoles: ['owner'], redirectTo: '/owner/dashboard');
    }

    private function attemptLogin(Request $request, array $allowedRoles, string $redirectTo): RedirectResponse
    {
        $credentials = $request->validate([
            'email' => ['required', 'email'],
            'password' => ['required', 'string'],
        ]);

        // Login is intrinsically cross-tenant: we authenticate the credential
        // BEFORE we know which tenant the user belongs to (TenantContext is
        // bootstrapped only AFTER a successful login via EnsureTenantContext).
        // The User model carries TenantScope, so the lookup would abort(500)
        // in production where the scope fails closed. Bypass it for the
        // credential check — scoping is enforced post-login by EnsureTenantContext.
        if (! TenantScope::bypass(fn () => Auth::attempt($credentials, $request->boolean('remember')))) {
            throw ValidationException::withMessages([
                'email' => 'Email atau password salah.',
            ]);
        }

        $request->session()->regenerate();

        $user = Auth::user();

        if (! in_array($user->role, $allowedRoles, true)) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            throw ValidationException::withMessages([
                'email' => 'Akun ini tidak memiliki akses ke halaman login ini.',
            ]);
        }

        if (! $user->tenant_id) {
            Auth::logout();
            $request->session()->invalidate();
            $request->session()->regenerateToken();

            throw ValidationException::withMessages([
                'email' => 'Akun ini belum terhubung ke tenant manapun.',
            ]);
        }

        // Apply paket yang dipilih dari landing page (flow: klik plan → login owner).
        if ($plan = $request->session()->pull('intended_plan')) {
            if (in_array($plan, Subscription::PLANS, true)) {
                Subscription::updateOrCreate(
                    ['tenant_id' => $user->tenant_id],
                    [
                        'plan' => $plan,
                        'status' => 'trialing',
                        'trial_ends_at' => now()->addDays(config('subscription.trial_days')),
                        'current_period_end' => null,
                    ]
                );
            }
        }

        return redirect()->intended($redirectTo);
    }

    public function destroy(Request $request): RedirectResponse
    {
        Auth::guard('web')->logout();

        $request->session()->invalidate();
        $request->session()->regenerateToken();

        return redirect('/login');
    }
}
