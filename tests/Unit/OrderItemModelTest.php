<?php

namespace Tests\Unit;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\OrderItem;
use App\Models\Tenant;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class OrderItemModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_order_relation(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $order = Order::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'order_code' => 'ORD-001',
            'table_number' => '1',
            'status' => 'selesai',
            'total' => 50000,
        ]);

        $item = OrderItem::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'item_name' => 'Nasi Goreng',
            'quantity' => 2,
            'unit_price' => 25000,
            'subtotal' => 50000,
        ]);

        $this->assertEquals($order->id, $item->order->id);
    }

    public function test_menu_item_relation(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $menu = MenuItem::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'name' => 'Nasi Goreng',
            'price' => 25000,
        ]);

        $order = Order::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'order_code' => 'ORD-001',
            'table_number' => '1',
            'status' => 'selesai',
            'total' => 50000,
        ]);

        $item = OrderItem::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'menu_item_id' => $menu->id,
            'item_name' => 'Nasi Goreng',
            'quantity' => 2,
            'unit_price' => 25000,
            'subtotal' => 50000,
        ]);

        $this->assertEquals($menu->id, $item->menuItem->id);
    }

    public function test_casts(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $order = Order::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'order_code' => 'ORD-001',
            'table_number' => '1',
            'status' => 'selesai',
            'total' => 50000,
        ]);

        $item = OrderItem::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'order_id' => $order->id,
            'item_name' => 'Nasi Goreng',
            'quantity' => 2,
            'unit_price' => 25000,
            'subtotal' => 50000,
        ]);

        $this->assertIsInt($item->quantity);
        $this->assertEquals(2, $item->quantity);
    }
}
