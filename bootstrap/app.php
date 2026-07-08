<?php

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
        $middleware->web(append: [
            \App\Http\Middleware\HandleInertiaRequests::class,
        ]);
        $middleware->validateCsrfTokens(except: [
            'api/*',
        ]);

        // Alias supaya bisa dipakai singkat di routes:
        //   ->middleware(['auth', 'tenant'])        — pastikan user login & punya tenant
        //   ->middleware('plan:kds')                — pastikan plan cukup untuk fitur
        $middleware->alias([
            'tenant' => \App\Http\Middleware\EnsureTenantContext::class,
            'plan'   => \App\Http\Middleware\RequiresPlan::class,
        ]);
    })
    ->withExceptions(function (Exceptions $exceptions): void {
        $exceptions->shouldRenderJsonWhen(
            fn (Request $request) => $request->is('api/*'),
        );
    })->create();
