<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Outlet;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Verifikasi bahwa TenantScope benar-benar mengisolasi data antar-tenant.
 * Test ini adalah "integration smoke test" untuk jaminan keamanan multi-tenant.
 */
class TenantIsolationTest extends TestCase
{
    use RefreshDatabase;

    private User $userA;
    private User $userB;

    protected function setUp(): void
    {
        parent::setUp();

        $tenantA = Tenant::create(['name' => 'Tenant A', 'brand_name' => 'A', 'email' => 'a@test.com', 'phone' => '081']);
        $tenantB = Tenant::create(['name' => 'Tenant B', 'brand_name' => 'B', 'email' => 'b@test.com', 'phone' => '082']);

        $outletA = Outlet::create(['tenant_id' => $tenantA->id, 'name' => 'Outlet A', 'address' => 'Jl A']);
        $outletB = Outlet::create(['tenant_id' => $tenantB->id, 'name' => 'Outlet B', 'address' => 'Jl B']);

        $this->userA = User::create([
            'tenant_id' => $tenantA->id, 'outlet_id' => $outletA->id,
            'name' => 'User A', 'email' => 'user@a.com',
            'password' => bcrypt('pw'), 'role' => 'cashier',
        ]);

        $this->userB = User::create([
            'tenant_id' => $tenantB->id, 'outlet_id' => $outletB->id,
            'name' => 'User B', 'email' => 'user@b.com',
            'password' => bcrypt('pw'), 'role' => 'cashier',
        ]);

        // Order milik masing-masing tenant
        Order::withoutGlobalScopes()->create([
            'tenant_id' => $tenantA->id, 'order_code' => 'ORD-A-01',
            'table_number' => 'Meja 1', 'source' => 'pos',
            'status' => Order::STATUS_ANTRIAN_MASUK,
        ]);

        Order::withoutGlobalScopes()->create([
            'tenant_id' => $tenantB->id, 'order_code' => 'ORD-B-01',
            'table_number' => 'Meja 2', 'source' => 'pos',
            'status' => Order::STATUS_ANTRIAN_MASUK,
        ]);
    }

    public function test_user_a_cannot_see_orders_from_tenant_b(): void
    {
        $response = $this->actingAs($this->userA)->getJson('/api/orders');
        $response->assertStatus(200);

        $allIds = collect($response->json('grouped'))->flatten(1)->pluck('id');
        $this->assertContains('ORD-A-01', $allIds, 'Order tenant A harus muncul');
        $this->assertNotContains('ORD-B-01', $allIds, 'Order tenant B TIDAK boleh muncul');
    }

    public function test_user_b_cannot_see_orders_from_tenant_a(): void
    {
        $response = $this->actingAs($this->userB)->getJson('/api/orders');
        $response->assertStatus(200);

        $allIds = collect($response->json('grouped'))->flatten(1)->pluck('id');
        $this->assertContains('ORD-B-01', $allIds, 'Order tenant B harus muncul');
        $this->assertNotContains('ORD-A-01', $allIds, 'Order tenant A TIDAK boleh muncul');
    }

    public function test_user_cannot_update_order_of_other_tenant(): void
    {
        $response = $this->actingAs($this->userA)
                         ->putJson('/api/orders/ORD-B-01/status', ['status' => 'Sedang Dimasak']);

        // TenantScope + firstOrFail: 404 karena order tidak ditemukan untuk tenant A
        $response->assertStatus(404);
    }
}
