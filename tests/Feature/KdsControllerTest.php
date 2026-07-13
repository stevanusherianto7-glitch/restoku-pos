<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\Outlet;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class KdsControllerTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private Outlet $outlet;

    private User $staff;

    private User $kitchen;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create([
            'name' => 'Resto KDS',
            'brand_name' => 'KDS',
            'email' => 'kds@test.com',
            'phone' => '081111',
        ]);

        $this->outlet = Outlet::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Outlet KDS',
            'address' => 'Jl. KDS',
        ]);

        $this->staff = User::create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
            'name' => 'Staff KDS',
            'email' => 'staff@kds.com',
            'password' => bcrypt('password'),
            'role' => 'cashier',
        ]);

        $this->kitchen = User::create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
            'name' => 'Kitchen KDS',
            'email' => 'kitchen@kds.com',
            'password' => bcrypt('password'),
            'role' => 'kitchen',
        ]);
    }

    public function test_get_kds_orders_returns_grouped_orders(): void
    {
        Order::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'order_code' => 'KDS-001',
            'table_number' => 'Meja 1',
            'source' => 'pos',
            'status' => Order::STATUS_ANTRIAN_MASUK,
        ]);

        Order::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'order_code' => 'KDS-002',
            'table_number' => 'Meja 2',
            'source' => 'pos',
            'status' => Order::STATUS_SEDANG_DIMASAK,
        ]);

        $response = $this->actingAs($this->kitchen)
            ->getJson('/api/orders');

        $response->assertStatus(200)
            ->assertJsonStructure(['grouped']);

        $grouped = $response->json('grouped');
        $this->assertCount(1, $grouped['Antrian Masuk']);
        $this->assertCount(1, $grouped['Sedang Dimasak']);
        $this->assertCount(0, $grouped['Siap Sajikan']);
    }

    public function test_update_order_status_success(): void
    {
        $order = Order::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'order_code' => 'KDS-010',
            'table_number' => 'Meja 5',
            'source' => 'pos',
            'status' => Order::STATUS_ANTRIAN_MASUK,
        ]);

        $response = $this->actingAs($this->kitchen)
            ->putJson('/api/orders/KDS-010/status', [
                'status' => 'Sedang Dimasak',
            ]);

        $response->assertStatus(200)->assertJson(['success' => true]);

        $this->assertDatabaseHas('orders', [
            'order_code' => 'KDS-010',
            'status' => Order::STATUS_SEDANG_DIMASAK,
        ]);
    }

    public function test_update_order_status_to_selesai_moves_to_siap_bayar(): void
    {
        $order = Order::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'order_code' => 'KDS-011',
            'table_number' => 'Meja 6',
            'source' => 'pos',
            'status' => Order::STATUS_SIAP_SAJIKAN,
        ]);

        $response = $this->actingAs($this->kitchen)
            ->putJson('/api/orders/KDS-011/status', [
                'status' => 'Selesai',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('orders', [
            'order_code' => 'KDS-011',
            'status' => Order::STATUS_SIAP_BAYAR,
        ]);
    }

    public function test_update_order_status_rejects_invalid_status(): void
    {
        Order::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'order_code' => 'KDS-012',
            'table_number' => 'Meja 7',
            'source' => 'pos',
            'status' => Order::STATUS_ANTRIAN_MASUK,
        ]);

        $response = $this->actingAs($this->kitchen)
            ->putJson('/api/orders/KDS-012/status', [
                'status' => 'InvalidStatus',
            ]);

        $response->assertStatus(422);
    }

    public function test_kds_orders_excludes_completed(): void
    {
        Order::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'order_code' => 'KDS-020',
            'table_number' => 'Meja 10',
            'source' => 'pos',
            'status' => Order::STATUS_SELESAI,
        ]);

        $response = $this->actingAs($this->kitchen)
            ->getJson('/api/orders');

        $response->assertStatus(200);

        $allIds = collect($response->json('grouped'))->flatten(1)->pluck('id');
        $this->assertNotContains('KDS-020', $allIds);
    }

    public function test_kds_orders_returns_siap_sajikan_group(): void
    {
        Order::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'order_code' => 'KDS-030',
            'table_number' => 'Meja 15',
            'source' => 'pos',
            'status' => Order::STATUS_SIAP_SAJIKAN,
        ]);

        $response = $this->actingAs($this->kitchen)
            ->getJson('/api/orders');

        $response->assertStatus(200);

        $grouped = $response->json('grouped');
        $this->assertCount(1, $grouped['Siap Sajikan']);
        $this->assertEquals('KDS-030', $grouped['Siap Sajikan'][0]['id']);
    }

    public function test_update_order_status_to_siap_sajikan(): void
    {
        Order::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'order_code' => 'KDS-040',
            'table_number' => 'Meja 20',
            'source' => 'pos',
            'status' => Order::STATUS_SEDANG_DIMASAK,
        ]);

        $response = $this->actingAs($this->kitchen)
            ->putJson('/api/orders/KDS-040/status', [
                'status' => 'Siap Sajikan',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('orders', [
            'order_code' => 'KDS-040',
            'status' => Order::STATUS_SIAP_SAJIKAN,
        ]);
    }
}
