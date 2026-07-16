<?php

namespace Tests\Unit;

use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * FNB-001 — Unit test deteksi tipe item & allServed() dalam 1 order utuh.
 */
class OrderServedPartsTest extends TestCase
{
    use RefreshDatabase;

    private function makeTenant(): Tenant
    {
        return Tenant::create([
            'name' => 'T', 'brand_name' => 'B',
            'email' => uniqid().'@test.com', 'phone' => '081',
        ]);
    }

    private function makeCategory(Tenant $tenant, string $type): MenuCategory
    {
        return MenuCategory::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'name' => $type === MenuCategory::TYPE_FOOD ? 'Makanan' : 'Minuman',
            'type' => $type,
        ]);
    }

    private function makeItem(Tenant $tenant, MenuCategory $cat): MenuItem
    {
        return MenuItem::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Item-'.uniqid(),
            'menu_category_id' => $cat->id,
            'price' => 10000,
            'is_available' => true,
        ]);
    }

    private function makeOrder(Tenant $tenant, string $status): Order
    {
        return Order::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'order_code' => 'ORD-SP-'.uniqid(),
            'table_number' => 'A1',
            'status' => $status,
            'total' => 0,
        ]);
    }

    private function attach(Order $order, MenuItem $item): void
    {
        OrderItem::withoutGlobalScopes()->create([
            'tenant_id' => $order->tenant_id,
            'order_id' => $order->id,
            'menu_item_id' => $item->id,
            'item_name' => $item->name,
            'quantity' => 1,
            'unit_price' => $item->price,
            'subtotal' => $item->price,
        ]);
    }

    public function test_order_with_food_and_drink_detects_both_types(): void
    {
        $t = $this->makeTenant();
        $food = $this->makeItem($t, $this->makeCategory($t, MenuCategory::TYPE_FOOD));
        $drink = $this->makeItem($t, $this->makeCategory($t, MenuCategory::TYPE_BEVERAGE));

        $order = $this->makeOrder($t, Order::STATUS_SIAP_SAJIKAN);
        $this->attach($order, $food);
        $this->attach($order, $drink);
        $order->load('items.menuItem.category');

        $this->assertTrue($order->hasFood());
        $this->assertTrue($order->hasDrink());
    }

    public function test_all_served_false_when_nothing_served_yet(): void
    {
        $t = $this->makeTenant();
        $food = $this->makeItem($t, $this->makeCategory($t, MenuCategory::TYPE_FOOD));
        $drink = $this->makeItem($t, $this->makeCategory($t, MenuCategory::TYPE_BEVERAGE));

        $order = $this->makeOrder($t, Order::STATUS_SIAP_SAJIKAN);
        $this->attach($order, $food);
        $this->attach($order, $drink);
        $order->load('items.menuItem.category');

        $this->assertFalse($order->allServed());
    }

    public function test_all_served_true_when_both_parts_served(): void
    {
        $t = $this->makeTenant();
        $food = $this->makeItem($t, $this->makeCategory($t, MenuCategory::TYPE_FOOD));
        $drink = $this->makeItem($t, $this->makeCategory($t, MenuCategory::TYPE_BEVERAGE));

        $order = $this->makeOrder($t, Order::STATUS_SIAP_SAJIKAN);
        $this->attach($order, $food);
        $this->attach($order, $drink);
        $order->load('items.menuItem.category');
        $order->food_served_at = now();
        $order->drink_served_at = now();
        $order->save();

        $this->assertTrue($order->allServed());
    }

    public function test_only_food_order_served_when_food_served(): void
    {
        $t = $this->makeTenant();
        $food = $this->makeItem($t, $this->makeCategory($t, MenuCategory::TYPE_FOOD));

        $order = $this->makeOrder($t, Order::STATUS_SIAP_SAJIKAN);
        $this->attach($order, $food);
        $order->load('items.menuItem.category');
        $order->food_served_at = now();
        $order->save();

        $this->assertTrue($order->hasFood());
        $this->assertFalse($order->hasDrink());
        $this->assertTrue($order->allServed());
    }
}
