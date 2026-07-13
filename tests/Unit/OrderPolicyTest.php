<?php

namespace Tests\Unit;

use App\Models\Order;
use App\Models\Tenant;
use App\Models\User;
use App\Policies\OrderPolicy;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderPolicyTest extends TestCase
{
    use RefreshDatabase;

    private OrderPolicy $policy;

    protected function setUp(): void
    {
        parent::setUp();
        $this->policy = new OrderPolicy;
    }

    public function test_view_any_returns_true_when_user_has_tenant(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $user = User::create([
            'tenant_id' => $tenant->id,
            'name' => 'U',
            'email' => 'u@test.com',
            'role' => 'owner',
            'password' => bcrypt('password'),
        ]);

        $this->assertTrue($this->policy->viewAny($user));
    }

    public function test_view_any_returns_false_when_user_has_no_tenant(): void
    {
        $user = User::create([
            'name' => 'U',
            'email' => 'u@test.com',
            'role' => 'owner',
            'password' => bcrypt('password'),
        ]);

        $this->assertFalse($this->policy->viewAny($user));
    }

    public function test_view_returns_true_when_same_tenant(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $user = User::create([
            'tenant_id' => $tenant->id,
            'name' => 'U',
            'email' => 'u@test.com',
            'role' => 'owner',
            'password' => bcrypt('password'),
        ]);

        $order = Order::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'order_code' => 'ORD-001',
            'table_number' => '1',
            'status' => 'selesai',
            'total' => 50000,
        ]);

        $this->assertTrue($this->policy->view($user, $order));
    }

    public function test_view_returns_false_when_different_tenant(): void
    {
        $tenant1 = Tenant::create(['name' => 'T1', 'brand_name' => 'B1', 'email' => 't1@test.com', 'phone' => '081']);
        $tenant2 = Tenant::create(['name' => 'T2', 'brand_name' => 'B2', 'email' => 't2@test.com', 'phone' => '082']);

        $user = User::create([
            'tenant_id' => $tenant1->id,
            'name' => 'U',
            'email' => 'u@test.com',
            'role' => 'owner',
            'password' => bcrypt('password'),
        ]);

        $order = Order::withoutGlobalScopes()->create([
            'tenant_id' => $tenant2->id,
            'order_code' => 'ORD-001',
            'table_number' => '1',
            'status' => 'selesai',
            'total' => 50000,
        ]);

        $this->assertFalse($this->policy->view($user, $order));
    }

    public function test_create_returns_false_for_owner(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $user = User::create([
            'tenant_id' => $tenant->id,
            'name' => 'U',
            'email' => 'u@test.com',
            'role' => 'owner',
            'password' => bcrypt('password'),
        ]);

        $this->assertFalse($this->policy->create($user));
    }

    public function test_create_returns_true_for_staff(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $user = User::create([
            'tenant_id' => $tenant->id,
            'name' => 'U',
            'email' => 'u@test.com',
            'role' => 'cashier',
            'password' => bcrypt('password'),
        ]);

        $this->assertTrue($this->policy->create($user));
    }

    public function test_update_returns_true_for_same_tenant_staff(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $user = User::create([
            'tenant_id' => $tenant->id,
            'name' => 'U',
            'email' => 'u@test.com',
            'role' => 'cashier',
            'password' => bcrypt('password'),
        ]);

        $order = Order::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'order_code' => 'ORD-001',
            'table_number' => '1',
            'status' => 'selesai',
            'total' => 50000,
        ]);

        $this->assertTrue($this->policy->update($user, $order));
    }

    public function test_update_returns_false_for_owner(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $user = User::create([
            'tenant_id' => $tenant->id,
            'name' => 'U',
            'email' => 'u@test.com',
            'role' => 'owner',
            'password' => bcrypt('password'),
        ]);

        $order = Order::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'order_code' => 'ORD-001',
            'table_number' => '1',
            'status' => 'selesai',
            'total' => 50000,
        ]);

        $this->assertFalse($this->policy->update($user, $order));
    }

    public function test_update_returns_false_for_different_tenant(): void
    {
        $tenant1 = Tenant::create(['name' => 'T1', 'brand_name' => 'B1', 'email' => 't1@test.com', 'phone' => '081']);
        $tenant2 = Tenant::create(['name' => 'T2', 'brand_name' => 'B2', 'email' => 't2@test.com', 'phone' => '082']);

        $user = User::create([
            'tenant_id' => $tenant1->id,
            'name' => 'U',
            'email' => 'u@test.com',
            'role' => 'cashier',
            'password' => bcrypt('password'),
        ]);

        $order = Order::withoutGlobalScopes()->create([
            'tenant_id' => $tenant2->id,
            'order_code' => 'ORD-001',
            'table_number' => '1',
            'status' => 'selesai',
            'total' => 50000,
        ]);

        $this->assertFalse($this->policy->update($user, $order));
    }
}
