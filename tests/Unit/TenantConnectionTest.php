<?php

namespace Tests\Unit;

use App\Services\TenantConnection;
use App\Services\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class TenantConnectionTest extends TestCase
{
    use RefreshDatabase;

    public function test_schema_name_returns_correct_format(): void
    {
        $ctx = app(TenantContext::class);
        $ctx->setTenantId(42);

        $conn = new TenantConnection($ctx);
        $this->assertEquals('tenant_42', $conn->schemaName());
    }

    public function test_is_sharded_returns_false_for_sqlite(): void
    {
        $ctx = app(TenantContext::class);
        $ctx->setTenantId(1);

        $conn = new TenantConnection($ctx);
        $this->assertFalse($conn->isSharded());
    }

    public function test_resolve_returns_default_when_not_sharded(): void
    {
        $ctx = app(TenantContext::class);
        $ctx->setTenantId(1);

        $conn = new TenantConnection($ctx);
        $resolved = $conn->resolve();
        $this->assertEquals(Config::get('database.default'), $resolved);
    }

    public function test_resolve_for_tenant_returns_connection_name(): void
    {
        Config::set('database.connections.tenant_template', [
            'driver' => 'sqlite',
            'database' => ':memory:',
        ]);

        $ctx = app(TenantContext::class);
        $ctx->setTenantId(1);

        $conn = new TenantConnection($ctx);
        $result = $conn->resolveForTenant(99);
        $this->assertEquals('tenant_99', $result);
    }

    public function test_using_tenant_executes_callback(): void
    {
        $ctx = app(TenantContext::class);
        $ctx->setTenantId(1);

        $conn = new TenantConnection($ctx);
        $result = $conn->usingTenant(fn () => 'executed');
        $this->assertEquals('executed', $result);
    }

    public function test_sys_connection_constant(): void
    {
        $this->assertEquals('sys', TenantConnection::SYS_CONNECTION);
    }

    public function test_register_connection_pgsql_sets_search_path(): void
    {
        Config::set('database.connections.tenant_template', [
            'driver' => 'pgsql',
            'host' => 'localhost',
            'database' => 'restoku',
        ]);

        $ctx = app(TenantContext::class);
        $ctx->setTenantId(1);

        $conn = new TenantConnection($ctx);
        $result = $conn->resolveForTenant(50);

        $this->assertEquals('tenant_50', $result);
        $this->assertEquals('pgsql', Config::get('database.connections.tenant_50.driver'));
    }

    public function test_register_connection_mysql_sets_database(): void
    {
        Config::set('database.connections.tenant_template', [
            'driver' => 'mysql',
            'host' => 'localhost',
            'database' => 'restoku',
        ]);

        $ctx = app(TenantContext::class);
        $ctx->setTenantId(1);

        $conn = new TenantConnection($ctx);
        $result = $conn->resolveForTenant(60);

        $this->assertEquals('tenant_60', $result);
        $this->assertEquals('tenant_60', Config::get('database.connections.tenant_60.database'));
    }
}
