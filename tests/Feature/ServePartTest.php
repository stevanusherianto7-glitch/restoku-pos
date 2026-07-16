<?php

namespace Tests\Feature;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Outlet;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * FNB-001 — Endpoint serve-part: waiter tandai saji per kategori.
 * allServed wajib sebelum order masuk kasir (siap_bayar).
 */
class ServePartTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private Outlet $outlet;

    private User $waiter;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create([
            'name' => 'Resto Serve', 'brand_name' => 'SV',
            'email' => 'sv@test.com', 'phone' => '081',
        ]);
        $this->outlet = Outlet::create([
            'tenant_id' => $this->tenant->id, 'name' => 'O', 'address' => 'J',
        ]);
        $this->waiter = User::create([
            'tenant_id' => $this->tenant->id, 'outlet_id' => $this->outlet->id,
            'name' => 'W', 'email' => 'w@sv.com', 'password' => bcrypt('x'), 'role' => 'waiter',
        ]);
    }

    private function cat(string $type): MenuCategory
    {
        return MenuCategory::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'name' => $type, 'type' => $type,
        ]);
    }

    private function item(MenuCategory $c): MenuItem
    {
        return MenuItem::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id, 'name' => 'I-'.uniqid(),
            'menu_category_id' => $c->id, 'price' => 10000, 'is_available' => true,
        ]);
    }

    private function orderWith(array $items, string $status = Order::STATUS_SIAP_SAJIKAN): Order
    {
        $order = Order::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id, 'outlet_id' => $this->outlet->id,
            'order_code' => 'ORD-SV-'.uniqid(), 'table_number' => 'A1',
            'status' => $status, 'total' => 0,
        ]);
        foreach ($items as $mi) {
            OrderItem::withoutGlobalScopes()->create([
                'tenant_id' => $this->tenant->id, 'order_id' => $order->id,
                'menu_item_id' => $mi->id, 'item_name' => $mi->name,
                'quantity' => 1, 'unit_price' => $mi->price, 'subtotal' => $mi->price,
            ]);
        }

        return $order;
    }

    public function test_serve_drink_only_keeps_order_in_siap_sajikan(): void
    {
        $food = $this->item($this->cat(MenuCategory::TYPE_FOOD));
        $drink = $this->item($this->cat(MenuCategory::TYPE_BEVERAGE));
        $order = $this->orderWith([$food, $drink]);

        $resp = $this->actingAs($this->waiter)
            ->putJson("/api/orders/{$order->order_code}/serve-part", ['part' => 'drink']);

        $resp->assertStatus(200)->assertJson(['success' => true, 'status' => Order::STATUS_SIAP_SAJIKAN]);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'drink_served_at' => now()->toDateTimeString()]);
        $this->assertNull(Order::withoutGlobalScopes()->find($order->id)->food_served_at);
    }

    public function test_serve_both_parts_moves_to_siap_bayar(): void
    {
        $food = $this->item($this->cat(MenuCategory::TYPE_FOOD));
        $drink = $this->item($this->cat(MenuCategory::TYPE_BEVERAGE));
        $order = $this->orderWith([$food, $drink]);

        $this->actingAs($this->waiter)
            ->putJson("/api/orders/{$order->order_code}/serve-part", ['part' => 'drink'])
            ->assertStatus(200);
        $resp = $this->actingAs($this->waiter)
            ->putJson("/api/orders/{$order->order_code}/serve-part", ['part' => 'food']);

        $resp->assertStatus(200)->assertJson(['success' => true, 'status' => Order::STATUS_SIAP_BAYAR]);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'status' => Order::STATUS_SIAP_BAYAR]);
    }

    public function test_only_food_order_moves_to_siap_bayar_after_food_served(): void
    {
        $food = $this->item($this->cat(MenuCategory::TYPE_FOOD));
        $order = $this->orderWith([$food]);

        $resp = $this->actingAs($this->waiter)
            ->putJson("/api/orders/{$order->order_code}/serve-part", ['part' => 'food']);

        $resp->assertStatus(200)->assertJson(['status' => Order::STATUS_SIAP_BAYAR]);
    }

    public function test_serve_part_rejects_when_not_siap_sajikan(): void
    {
        $drink = $this->item($this->cat(MenuCategory::TYPE_BEVERAGE));
        $order = $this->orderWith([$drink], Order::STATUS_ANTRIAN_MASUK);

        $this->actingAs($this->waiter)
            ->putJson("/api/orders/{$order->order_code}/serve-part", ['part' => 'drink'])
            ->assertStatus(422);
    }
}
