<?php

namespace Tests\Feature;

use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Outlet;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderItemCookTest extends TestCase
{
    use RefreshDatabase;

    private User $kitchen;

    private Order $order;

    protected function setUp(): void
    {
        parent::setUp();

        $tenant = Tenant::withoutGlobalScopes()->first()
            ?? Tenant::withoutGlobalScopes()->create([
                'name' => 'T',
                'slug' => 't-'.uniqid(),
                'brand_name' => 'T Brand',
                'email' => 't'.uniqid().'@x.com',
            ]);
        $outlet = Outlet::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'name' => 'O',
            'slug' => 'o-'.uniqid(),
        ]);
        $this->kitchen = User::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'name' => 'K',
            'email' => 'k'.uniqid().'@x.com',
            'password' => bcrypt('x'),
            'role' => 'kitchen',
        ]);
        $this->order = Order::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'outlet_id' => $outlet->id,
            'order_code' => 'OC-001',
            'table_number' => 'A1',
            'source' => 'guest_qr',
            'status' => Order::STATUS_SEDANG_DIMASAK,
            'destination' => 'kds',
        ]);
    }

    private function makeItem(string $cook = OrderItem::COOK_DIKONFIRMASI): OrderItem
    {
        return OrderItem::withoutGlobalScopes()->create([
            'tenant_id' => $this->order->tenant_id,
            'order_id' => $this->order->id,
            'item_name' => 'Ayam Penyet',
            'quantity' => 1,
            'unit_price' => 10000,
            'subtotal' => 10000,
            'cook_status' => $cook,
        ]);
    }

    public function test_item_defaults_to_dikonfirmasi(): void
    {
        $item = $this->makeItem();
        $this->assertEquals(OrderItem::COOK_DIKONFIRMASI, $item->cook_status);
        $this->assertEquals(1, $item->cookStep());
    }

    public function test_advance_cook_one_step_at_a_time(): void
    {
        $item = $this->makeItem();
        $item->advanceCook();
        $this->assertEquals(OrderItem::COOK_SEDANG_DIMASAK, $item->cook_status);
        $this->assertEquals(2, $item->cookStep());

        $item->advanceCook();
        $this->assertEquals(OrderItem::COOK_SELESAI_MASAK, $item->cook_status);
        $this->assertEquals(3, $item->cookStep());

        $item->advanceCook();
        $this->assertEquals(OrderItem::COOK_SIAP_SAJIKAN, $item->cook_status);
        $this->assertEquals(4, $item->cookStep());

        $item->advanceCook();
        $this->assertEquals(OrderItem::COOK_SELESAI, $item->cook_status);
        $this->assertEquals(5, $item->cookStep());

        // sudah di ujung → advance tidak error, tetap selesai
        $item->advanceCook();
        $this->assertEquals(OrderItem::COOK_SELESAI, $item->cook_status);
    }

    public function test_cook_transition_illegal_rejected(): void
    {
        $item = $this->makeItem(OrderItem::COOK_SELESAI);
        $this->assertFalse($item->canCookTransitionTo(OrderItem::COOK_DIKONFIRMASI));
        $this->assertFalse($item->canCookTransitionTo(OrderItem::COOK_SEDANG_DIMASAK));
    }

    public function test_endpoint_advances_cook_status(): void
    {
        $item = $this->makeItem();

        $this->actingAs($this->kitchen)
            ->putJson("/api/order-items/{$item->id}/cook-status", ['status' => 'sedang dimasak'])
            ->assertStatus(200)
            ->assertJson(['success' => true, 'cook_status' => 'sedang_dimasak']);

        $this->assertDatabaseHas('order_items', [
            'id' => $item->id,
            'cook_status' => 'sedang_dimasak',
        ]);
    }

    public function test_endpoint_rejects_illegal_cook(): void
    {
        $item = $this->makeItem(OrderItem::COOK_SELESAI);

        $this->actingAs($this->kitchen)
            ->putJson("/api/order-items/{$item->id}/cook-status", ['status' => 'dikonfirmasi'])
            ->assertStatus(422);
    }
}
