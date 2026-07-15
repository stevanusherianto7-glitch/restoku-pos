<?php

namespace Tests\Unit;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Outlet;
use App\Models\Tenant;
use App\Services\GuestOrderService;
use Illuminate\Database\Eloquent\ModelNotFoundException;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

/**
 * S-11 — Unit test GuestOrderService.
 * Cakupan logika ekstrak dari OrderController::submitOrder.
 */
class GuestOrderServiceTest extends TestCase
{
    use RefreshDatabase;

    private GuestOrderService $service;

    private Tenant $tenant;

    private Outlet $outlet;

    private MenuItem $menuItem;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = $this->app->make(GuestOrderService::class);

        $this->tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $this->outlet = Outlet::create(['tenant_id' => $this->tenant->id, 'name' => 'Outlet', 'address' => 'Jl. Test']);
        $this->menuItem = MenuItem::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Nasi Goreng',
            'price' => 30000,
            'is_available' => true,
        ]);
    }

    public function test_create_builds_order_with_items_and_subtotal(): void
    {
        $order = $this->service->create([
            'outlet_id' => $this->outlet->id,
            'table' => '5',
            'items' => [
                ['menu_item_id' => $this->menuItem->id, 'quantity' => 2],
            ],
        ]);

        $this->assertInstanceOf(Order::class, $order);
        $this->assertEquals('Meja 5', $order->table_number); // prefix "Meja" ditambah
        $this->assertEquals(Order::STATUS_ANTRIAN_MASUK, $order->status);
        $this->assertEquals(60000, $order->total); // 2 x 30000
        $this->assertCount(1, $order->items);
        $this->assertDatabaseHas('orders', ['id' => $order->id, 'tenant_id' => $this->tenant->id]);
    }

    public function test_create_preserves_existing_meja_prefix(): void
    {
        $order = $this->service->create([
            'outlet_id' => $this->outlet->id,
            'table' => 'Meja VIP',
            'items' => [
                ['menu_item_id' => $this->menuItem->id, 'quantity' => 1],
            ],
        ]);

        $this->assertEquals('Meja VIP', $order->table_number);
    }

    public function test_create_rejects_unavailable_item(): void
    {
        $unavailable = MenuItem::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Habis',
            'price' => 10000,
            'is_available' => false,
        ]);

        $this->expectException(HttpException::class);
        $this->service->create([
            'outlet_id' => $this->outlet->id,
            'table' => '1',
            'items' => [
                ['menu_item_id' => $unavailable->id, 'quantity' => 1],
            ],
        ]);
    }

    public function test_create_rejects_unknown_outlet(): void
    {
        $this->expectException(ModelNotFoundException::class);
        $this->service->create([
            'outlet_id' => 99999,
            'table' => '1',
            'items' => [
                ['menu_item_id' => $this->menuItem->id, 'quantity' => 1],
            ],
        ]);
    }
}
