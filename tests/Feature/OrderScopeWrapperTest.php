<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Outlet;
use App\Models\Scopes\TenantScope;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * #3 — Verifikasi wrapper Order::forOutlet() / byTenant() menjamin isolasi.
 * Tujuannya: cross-tenant leak prevention by-design (defense-in-depth).
 */
class OrderScopeWrapperTest extends TestCase
{
    use RefreshDatabase;

    private function seedOrder(Tenant $tenant, Outlet $outlet, string $code): Order
    {
        return Order::withoutGlobalScope(TenantScope::class)->create([
            'tenant_id' => $tenant->id,
            'outlet_id' => $outlet->id,
            'order_code' => $code,
            'table_number' => 'A1',
            'status' => Order::STATUS_SELESAI,
            'total' => 10000,
        ]);
    }

    public function test_for_outlet_only_returns_orders_of_that_outlet(): void
    {
        $t1 = Tenant::create(['name' => 'T1', 'brand_name' => 'A', 'email' => 'a@t.com', 'phone' => '081']);
        $t2 = Tenant::create(['name' => 'T2', 'brand_name' => 'B', 'email' => 'b@t.com', 'phone' => '082']);
        $o1 = Outlet::create(['tenant_id' => $t1->id, 'name' => 'O1', 'address' => 'Jl A']);
        $o2 = Outlet::create(['tenant_id' => $t1->id, 'name' => 'O2', 'address' => 'Jl B']);

        $this->seedOrder($t1, $o1, 'ORD-A');
        $this->seedOrder($t1, $o2, 'ORD-B');

        $found = Order::forOutlet($o1)->get();
        $this->assertCount(1, $found);
        $this->assertEquals('ORD-A', $found->first()->order_code);
    }

    public function test_by_tenant_only_returns_orders_of_that_tenant(): void
    {
        $t1 = Tenant::create(['name' => 'T1', 'brand_name' => 'A', 'email' => 'a@t.com', 'phone' => '081']);
        $t2 = Tenant::create(['name' => 'T2', 'brand_name' => 'B', 'email' => 'b@t.com', 'phone' => '082']);
        $o1 = Outlet::create(['tenant_id' => $t1->id, 'name' => 'O1', 'address' => 'Jl A']);
        $o2 = Outlet::create(['tenant_id' => $t2->id, 'name' => 'O2', 'address' => 'Jl B']);

        $this->seedOrder($t1, $o1, 'ORD-T1');
        $this->seedOrder($t2, $o2, 'ORD-T2');

        $t1Orders = Order::byTenant($t1->id)->get();
        $this->assertCount(1, $t1Orders);
        $this->assertEquals('ORD-T1', $t1Orders->first()->order_code);

        // byTenant($t2) must NOT see $t1's order (cross-tenant block)
        $t2Orders = Order::byTenant($t2->id)->get();
        $this->assertCount(1, $t2Orders);
        $this->assertEquals('ORD-T2', $t2Orders->first()->order_code);
    }

    public function test_by_tenant_blocks_cross_tenant_access(): void
    {
        $t1 = Tenant::create(['name' => 'T1', 'brand_name' => 'A', 'email' => 'a@t.com', 'phone' => '081']);
        $t2 = Tenant::create(['name' => 'T2', 'brand_name' => 'B', 'email' => 'b@t.com', 'phone' => '082']);
        $o1 = Outlet::create(['tenant_id' => $t1->id, 'name' => 'O1', 'address' => 'Jl A']);

        $this->seedOrder($t1, $o1, 'SECRET');

        // Querying tenant 2 must return zero, even though a secret order exists in tenant 1
        $this->assertCount(0, Order::byTenant($t2->id)->where('order_code', 'SECRET')->get());
    }
}
