<?php

use App\Http\Middleware\EnsureTenantContext;
use App\Http\Middleware\HandleInertiaRequests;
use App\Http\Middleware\RequiresPlan;
use Illuminate\Foundation\Application;
use Illuminate\Foundation\Configuration\Exceptions;
use Illuminate\Foundation\Configuration\Middleware;
use Illuminate\Http\Request;

return Application::configure(basePath: dirname(__DIR__))
    ->withRouting(
        web: __DIR__.'/../routes/web.php',
        commands: __DIR__.'/../routes/console.php',
        health: '/up',
    )
    ->withMiddleware(function (Middleware $middleware): void {
        // Trust cloudflare/tunnel/proxy headers (X-Forwarded-Proto) supaya
        // scheme https terdeteksi saat diakses via tunnel -> asset URL ikut https
        // (hindari mixed-content blank page). Localhost tetap http (tanpa header).
        $middleware->trustProxies(at: '*', headers: Request::HEADER_X_FORWARDED_FOR
            | Request::HEADER_X_FORWARDED_HOST
            | Request::HEADER_X_FORWARDED_PORT
            | Request::HEADER_X_FORWARDED_PROTO
            | Request::HEADER_X_FORWARDED_AWS_ELB);

        $middleware->web(append: [
            HandleInertiaRequests::class,
        ]);
        $middleware->validateCsrfTokens(except: [
            'api/orders',
            'api/orders/*',
            'api/reservations',
            'api/reservations/*',
            'api/outlet-operating-hours',
        ]);

        // Alias supaya bisa dipakai singkat di routes:
        //   ->middleware(['auth', 'tenant'])        — pastikan user login & punya tenant
        //   ->middleware('plan:kds')                — pastikan plan cukup untuk fitur
        $middleware->alias([
            'tenant' => EnsureTenantContext::class,
            'plan' => RequiresPlan::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
