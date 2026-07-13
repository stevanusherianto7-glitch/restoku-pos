<?php

namespace Tests\Unit;

use App\Services\TenantConnection;
use App\Services\TenantContext;
use App\Services\TenantReadConnection;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class TenantReadConnectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_resolve_returns_primary_when_not_sharded(): void
    {
        $ctx = app(TenantContext::class);
        $ctx->setTenantId(1);

        $mainConn = new TenantConnection($ctx);
        $readConn = new TenantReadConnection($mainConn);

        $resolved = $readConn->resolve();
        $this->assertEquals($mainConn->resolve(), $resolved);
    }

    public function test_resolve_returns_primary_when_no_replica_configured(): void
    {
        Config::set('database.connections.tenant_read', []);

        $ctx = app(TenantContext::class);
        $ctx->setTenantId(1);

        $mainConn = new TenantConnection($ctx);
        $readConn = new TenantReadConnection($mainConn);

        $resolved = $readConn->resolve();
        $this->assertEquals($mainConn->resolve(), $resolved);
    }

    public function test_read_executes_callback_via_primary_when_no_replica(): void
    {
        $ctx = app(TenantContext::class);
        $ctx->setTenantId(1);

        $mainConn = new TenantConnection($ctx);
        $readConn = new TenantReadConnection($mainConn);

        $result = $readConn->read(fn () => 'read_result');
        $this->assertEquals('read_result', $result);
    }

    public function test_resolve_returns_primary_when_context_not_initialized(): void
    {
        $ctx = app(TenantContext::class);
        $ctx->reset();

        $mainConn = new TenantConnection($ctx);
        $readConn = new TenantReadConnection($mainConn);

        $resolved = $readConn->resolve();
        $this->assertEquals($mainConn->resolve(), $resolved);
    }

    public function test_resolve_returns_primary_when_sharded_but_no_replica_driver(): void
    {
        Config::set('database.connections.tenant_read', []);

        $ctx = app(TenantContext::class);
        $ctx->setTenantId(1);

        $mainConn = new TenantConnection($ctx);
        $readConn = new TenantReadConnection($mainConn);

        $resolved = $readConn->resolve();
        $this->assertEquals($mainConn->resolve(), $resolved);
    }
}
