<?php

namespace App\Http\Middleware;

use App\Services\FeatureRegistry;
use App\Services\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Inertia\Inertia;
use Symfony\Component\HttpFoundation\Response;

/**
 * RequiresPlan — backend enforcement untuk feature gate.
 *
 * Sebelumnya feature gate HANYA ada di frontend (FEATURE_LOCKS di Shared.tsx).
 * Ini berarti user bisa bypass dengan DevTools atau curl langsung ke endpoint.
 *
 * Middleware ini memastikan backend juga meng-enforce gate yang sama.
 *
 * Penggunaan di routes:
 *   Route::get('/kds', ...)->middleware('plan:kds');
 *   Route::get('/laporan-excel', ...)->middleware('plan:laporan_excel');
 *   Route::get('/staf-shift', ...)->middleware('plan:staf_shift,pro');
 *
 * Response:
 *   - JSON request (API) → 402 Payment Required dengan JSON error
 *   - Inertia request    → render halaman Errors/UpgradeRequired
 *   - Web request biasa  → redirect ke /dashboard dengan flash error
 *
 * HTTP 402 dipilih karena secara semantic berarti "akses butuh payment/upgrade",
 * berbeda dengan 403 (forbidden) yang lebih ke "tidak punya izin apapun".
 */
class RequiresPlan
{
    public function __construct(private TenantContext $ctx) {}

    public function handle(Request $request, Closure $next, string $feature): Response
    {
        if (! $this->ctx->isInitialized()) {
            // Fallback: jika TenantContext belum diisi (seharusnya tidak terjadi
            // karena middleware ini selalu di-chain setelah EnsureTenantContext)
            return $this->denyAccess($request, $feature, 'basic');
        }

        if ($this->ctx->hasFeature($feature)) {
            return $next($request);
        }

        $currentPlan  = $this->ctx->plan();
        $requiredPlan = FeatureRegistry::minimumPlanFor($feature) ?? 'enterprise';

        return $this->denyAccess($request, $feature, $currentPlan, $requiredPlan);
    }

    private function denyAccess(
        Request $request,
        string $feature,
        string $currentPlan,
        string $requiredPlan = 'pro'
    ): Response {
        // JSON / API request
        if ($request->expectsJson()) {
            return response()->json([
                'error'         => 'upgrade_required',
                'message'       => "Fitur '{$feature}' membutuhkan plan {$requiredPlan} atau lebih tinggi.",
                'feature'       => $feature,
                'current_plan'  => $currentPlan,
                'required_plan' => $requiredPlan,
                'upgrade_url'   => '/billing/upgrade',
            ], 402);
        }

        // Inertia request → render upgrade page
        if ($request->header('X-Inertia')) {
            return Inertia::render('Errors/UpgradeRequired', [
                'feature'       => $feature,
                'current_plan'  => $currentPlan,
                'required_plan' => $requiredPlan,
            ])->toResponse($request)->setStatusCode(402);
        }

        // Web request → redirect dengan flash error
        return redirect('/dashboard')->with(
            'error',
            "Fitur ini membutuhkan plan " . ucfirst($requiredPlan) . ". Silakan upgrade untuk mengakses."
        );
    }
}
