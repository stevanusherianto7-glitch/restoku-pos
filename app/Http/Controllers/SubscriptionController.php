<?php

namespace App\Http\Controllers;

use App\Models\Subscription;
use App\Services\SubscriptionConfig;
use Illuminate\Http\RedirectResponse;
use Illuminate\Http\Request;
use Inertia\Inertia;

/**
 * Checkout simulasi untuk paket Basic/Pro/Enterprise.
 *
 * TIDAK ada payment gateway sungguhan (PRD non-goal). Flow:
 *   GET  /subscribe/{plan}  → render halaman checkout (props dari config)
 *   POST /subscribe/{plan}  → simpan intended_plan di session;
 *                            bila owner sudah login → buat/upgrade Subscription (trial);
 *                            bila guest → redirect ke /owner/login.
 *
 * Saat owner login nanti (AuthenticatedSessionController), intended_plan di-apply
 * otomatis ke tenant mereka (lihat attemptLogin).
 */
class SubscriptionController extends Controller
{
    public function show(string $plan)
    {
        abort_unless(Subscription::isValidPlan($plan), 404);

        $cfg = config("subscription.plans.$plan");

        return Inertia::render('Subscribe/Checkout', [
            'plan' => $plan,
            'name' => $cfg['name'],
            'price_idr' => $cfg['price_idr'],
            'tagline' => $cfg['tagline'],
            'features' => SubscriptionConfig::allFeatures($plan),
            'extra_features' => SubscriptionConfig::extraFeatures($plan),
            'inherits' => SubscriptionConfig::inherits($plan),
            'popular' => $cfg['popular'],
        ]);
    }

    public function store(Request $request, string $plan): RedirectResponse
    {
        abort_unless(Subscription::isValidPlan($plan), 404);

        $cfg = config("subscription.plans.$plan");

        // Simpan pilihan di session agar bisa di-apply saat owner login/register.
        session(['intended_plan' => $plan]);

        // Jika owner sudah login → langsung aktivasi trial untuk tenant mereka.
        if ($user = $request->user()) {
            $tenant = $user->tenant;

            if ($tenant) {
                Subscription::updateOrCreate(
                    ['tenant_id' => $tenant->id],
                    [
                        'plan' => $plan,
                        'status' => 'trialing',
                        'trial_ends_at' => now()->addDays(config('subscription.trial_days')),
                        'current_period_end' => null,
                    ]
                );

                return redirect()->route('owner.dashboard')
                    ->with('success', "Paket {$cfg['name']} aktif (trial ".config('subscription.trial_days').' hari).');
            }
        }

        // Guest → arahkan ke login owner (intended_plan sudah di session).
        return redirect()->route('owner.login');
    }
}
