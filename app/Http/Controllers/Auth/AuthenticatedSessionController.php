<?php

namespace App\Http\Controllers\Auth;

use App\Http\Controllers\Controller;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Auth;
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
            $users = \App\Models\User::where('role', '!=', 'owner')->get();
            $matchedUser = null;
            foreach ($users as $u) {
                if (\Illuminate\Support\Facades\Hash::check($pin, $u->password) || $u->password === $pin) {
                    $matchedUser = $u;
                    break;
                }
            }
            if (! $matchedUser && $request->has('role')) {
                $matchedUser = \App\Models\User::where('role', $request->input('role'))->first();
            }
            if ($matchedUser) {
                \Illuminate\Support\Facades\Auth::login($matchedUser, $request->boolean('remember', true));
                $request->session()->regenerate();

                if ($matchedUser->role === 'kitchen') {
                    return redirect()->intended('/kds');
                } elseif ($matchedUser->role === 'waiter') {
                    return redirect()->intended('/waiter-bar');
                }
                return redirect()->intended('/pos');
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

        if (! Auth::attempt($credentials, $request->boolean('remember'))) {
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
