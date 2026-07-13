<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Outlet;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class CashierControllerTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private Outlet $outlet;

    private User $cashier;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create([
            'name' => 'Resto Cashier',
            'brand_name' => 'Cashier',
            'email' => 'cashier@test.com',
            'phone' => '081111',
        ]);

        $this->outlet = Outlet::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Outlet Cashier',
            'address' => 'Jl. Cashier',
        ]);

        $this->cashier = User::create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
            'name' => 'Kasir',
            'email' => 'kasir@cashier.com',
            'password' => bcrypt('password'),
            'role' => 'cashier',
        ]);
    }

    public function test_get_cashier_queue_returns_siap_bayar_orders(): void
    {
        Order::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'order_code' => 'CSH-001',
            'table_number' => 'Meja 1',
            'source' => 'pos',
            'status' => Order::STATUS_SIAP_BAYAR,
        ]);

        Order::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'order_code' => 'CSH-002',
            'table_number' => 'Meja 2',
            'source' => 'pos',
            'status' => Order::STATUS_ANTRIAN_MASUK, // not in queue
        ]);

        $response = $this->actingAs($this->cashier)
            ->getJson('/api/cashier-queue');

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $queue = $response->json('queue');
        $this->assertCount(1, $queue);
        $this->assertEquals('CSH-001', $queue[0]['id']);
    }

    public function test_clear_cashier_queue_item_marks_as_paid(): void
    {
        Order::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'order_code' => 'CSH-010',
            'table_number' => 'Meja 5',
            'source' => 'pos',
            'status' => Order::STATUS_SIAP_BAYAR,
        ]);

        $response = $this->actingAs($this->cashier)
            ->deleteJson('/api/cashier-queue/CSH-010');

        $response->assertStatus(200)->assertJson(['success' => true]);

        $this->assertDatabaseHas('orders', [
            'order_code' => 'CSH-010',
            'status' => Order::STATUS_SELESAI,
            'payment_status' => 'paid',
        ]);
    }

    public function test_clear_cashier_queue_item_rejects_other_tenant(): void
    {
        $tenantB = Tenant::create([
            'name' => 'Resto B',
            'brand_name' => 'B',
            'email' => 'b@test.com',
            'phone' => '082222',
        ]);

        $outletB = Outlet::create([
            'tenant_id' => $tenantB->id,
            'name' => 'Outlet B',
            'address' => 'Jl. B',
        ]);

        Order::withoutGlobalScopes()->create([
            'tenant_id' => $tenantB->id,
            'order_code' => 'CSH-B01',
            'table_number' => 'Meja 1',
            'source' => 'pos',
            'status' => Order::STATUS_SIAP_BAYAR,
        ]);

        $response = $this->actingAs($this->cashier)
            ->deleteJson('/api/cashier-queue/CSH-B01');

        $response->assertStatus(404);
    }
}
