<?php

namespace App\Http\Middleware;

use App\Services\TenantContext;
use Closure;
use Illuminate\Http\Request;
use Symfony\Component\HttpFoundation\Response;

/**
 * EnsureTenantContext — dipasang SETELAH middleware 'auth'.
 *
 * Dua tanggung jawab:
 *   1. Guard: tolak request jika user tidak punya tenant_id (akun rusak)
 *   2. Bootstrap: isi TenantContext singleton dari user yang login
 *
 * Setelah middleware ini berjalan, seluruh request stack bisa menggunakan:
 *   app(TenantContext::class)->id()         → tenant_id
 *   app(TenantContext::class)->plan()       → 'basic'|'pro'|'enterprise'
 *   app(TenantContext::class)->hasFeature() → true|false
 *
 * Dan TenantScope akan otomatis menyaring semua query Eloquent.
 */
class EnsureTenantContext
{
    public function __construct(private TenantContext $ctx) {}

    public function handle(Request $request, Closure $next): Response
    {
        $user = $request->user();

        if (! $user || ! $user->tenant_id) {
            abort(403, 'Akun ini tidak terhubung ke tenant manapun.');
        }

        // Bootstrap TenantContext + bind 'tenant.id' ke container
        // sehingga TenantScope bisa membacanya tanpa menyentuh Auth::user()
        $this->ctx->setFromUser($user);

        return $next($request);
    }
}
