<?php

namespace Tests\Unit;

use App\Services\SettingsService;
use App\Services\TenantConnection;
use App\Services\TenantContext;
use App\Services\TenantReadConnection;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class AppServiceProviderTest extends TestCase
{
    use RefreshDatabase;

    public function test_register_binds_tenant_context_singleton(): void
    {
        $ctx1 = app(TenantContext::class);
        $ctx2 = app(TenantContext::class);

        $this->assertSame($ctx1, $ctx2);
    }

    public function test_register_binds_tenant_connection_singleton(): void
    {
        $conn1 = app(TenantConnection::class);
        $conn2 = app(TenantConnection::class);

        $this->assertSame($conn1, $conn2);
    }

    public function test_register_binds_tenant_read_connection_singleton(): void
    {
        $read1 = app(TenantReadConnection::class);
        $read2 = app(TenantReadConnection::class);

        $this->assertSame($read1, $read2);
    }

    public function test_register_binds_settings_service_singleton(): void
    {
        $svc1 = app(SettingsService::class);
        $svc2 = app(SettingsService::class);

        $this->assertSame($svc1, $svc2);
    }
}
