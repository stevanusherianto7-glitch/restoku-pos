<?php

namespace Tests\Unit;

use App\Models\Concerns\UsesTenantConnection;
use App\Models\Outlet;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Tests\TestCase;

class UsesTenantConnectionTraitTest extends TestCase
{
    use RefreshDatabase;

    public function test_get_connection_name_returns_default_when_context_not_initialized(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $outlet = Outlet::create([
            'tenant_id' => $tenant->id,
            'name' => 'Outlet',
            'address' => 'Jl. Test',
        ]);

        $conn = $outlet->getConnectionName();
        $this->assertEquals(Config::get('database.default'), $conn);
    }

    public function test_outlet_uses_trait(): void
    {
        $uses = class_uses_recursive(Outlet::class);
        $this->assertArrayHasKey(UsesTenantConnection::class, $uses);
    }
}
