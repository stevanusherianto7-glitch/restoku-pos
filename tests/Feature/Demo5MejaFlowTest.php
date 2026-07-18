<?php

namespace Tests\Feature;

use App\Http\Controllers\CashierController;
use App\Http\Controllers\GuestVerifyController;
use App\Http\Controllers\KdsController;
use App\Http\Controllers\PublicOrderController;
use App\Models\MenuCategory;
use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Outlet;
use App\Models\OutletTable;
use App\Models\User;
use App\Services\DailyPinService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;
use Tests\Traits\HasTenantSetup;

/**
 * DEMO PRE-PRODUCTION: 5 meja (A1-A5) order variasi makanan + minuman,
 * lewat alur tamu → KDS (per-item 5-step) → kasir bayar, sampai lunas.
 *
 * Menjalankan endpoint NYATA (GuestVerifyController / PublicOrderController /
 * KdsController / CashierController) — bukan mocking. Bukti alur end-to-end.
 */
class Demo5MejaFlowTest extends TestCase
{
    use HasTenantSetup;
    use RefreshDatabase;

    private GuestVerifyController $guestCtrl;

    private PublicOrderController $orderCtrl;

    private KdsController $kdsCtrl;

    private CashierController $cashierCtrl;

    private User $kitchen;

    private User $cashier;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setupTenantEnvironment('pro');

        // Outlet tanpa koordinat = GPS di-skip (dev mode / pawon-salam).
        $this->testOutlet->update(['latitude' => null, 'longitude' => null]);

        $this->guestCtrl = app(GuestVerifyController::class);
        $this->orderCtrl = app(PublicOrderController::class);
        $this->kdsCtrl = app(KdsController::class);
        $this->cashierCtrl = app(CashierController::class);

        // Staff: kitchen (advance KDS) + cashier (bayar).
        $this->kitchen = User::create([
            'tenant_id' => $this->testTenant->id,
            'outlet_id' => $this->testOutlet->id,
            'name' => 'Kru Dapur',
            'email' => 'kitchen@demo.test',
            'password' => Hash::make('123456'),
            'role' => 'kitchen',
            'pin' => Hash::make('111111'),
        ]);
        $this->cashier = User::create([
            'tenant_id' => $this->testTenant->id,
            'outlet_id' => $this->testOutlet->id,
            'name' => 'Kasir Demo',
            'email' => 'kasir@demo.test',
            'password' => Hash::make('123456'),
            'role' => 'cashier',
            'pin' => Hash::make('123456'),
        ]);

        $this->seedMenu();
        $this->seedTables();
    }

    private function seedMenu(): void
    {
        $food = MenuCategory::create([
            'tenant_id' => $this->testTenant->id,
            'name' => 'Makanan',
            'type' => 'food',
            'sort_order' => 1,
        ]);
        $drink = MenuCategory::create([
            'tenant_id' => $this->testTenant->id,
            'name' => 'Minuman',
            'type' => 'beverage',
            'sort_order' => 2,
        ]);

        $this->foodIds = [];
        $this->drinkIds = [];
        foreach ([
            'Ayam Goreng Penyet' => 18000,
            'Nasi Goreng Spesial' => 22000,
            'Soto Ayam' => 15000,
            'Es Teh Manis' => 5000,
            'Es Jeruk' => 7000,
            'Kopi Susu' => 12000,
        ] as $name => $price) {
            $cat = in_array($name, ['Es Teh Manis', 'Es Jeruk', 'Kopi Susu']) ? $drink : $food;
            $item = MenuItem::create([
                'tenant_id' => $this->testTenant->id,
                'outlet_id' => $this->testOutlet->id,
                'menu_category_id' => $cat->id,
                'name' => $name,
                'price' => $price,
                'is_available' => true,
            ]);
            if ($cat->type === 'food') {
                $this->foodIds[] = $item->id;
            } else {
                $this->drinkIds[] = $item->id;
            }
        }
    }

    private function seedTables(): void
    {
        foreach (['A1', 'A2', 'A3', 'A4', 'A5'] as $label) {
            OutletTable::withoutGlobalScopes()->create([
                'tenant_id' => $this->testTenant->id,
                'outlet_id' => $this->testOutlet->id,
                'label' => $label,
                'pin_hash' => Hash::make(OutletTable::derivePin($this->testOutlet->id, $label)),
            ]);
        }
    }

    /** Buat verify token untuk meja tertentu (alur tamu nyata). */
    private function guestVerifyToken(string $table): string
    {
        $daily = (new DailyPinService)->getOrGenerate($this->testOutlet->id);
        $tablePin = OutletTable::derivePin($this->testOutlet->id, $table);

        $resp = $this->guestCtrl->verify(Request::create('/api/guest/verify', 'POST', [
            'slug' => $this->testOutlet->slug,
            'table' => $table,
            'table_pin' => $tablePin,
            'daily_pin' => $daily,
        ]))->getData(true);

        $this->assertTrue($resp['ok'], "verify gagal untuk meja {$table}");

        return $resp['token'];
    }

    /** Tamu submit order dengan items (menu_item_id + qty). */
    private function submitOrder(string $table, string $token, array $items): array
    {
        $resp = $this->orderCtrl->submitOrder(Request::create('/api/orders', 'POST', [
            'outlet_id' => $this->testOutlet->id,
            'table' => $table,
            'items' => $items,
            'verify_token' => $token,
        ]))->getData(true);

        $this->assertTrue($resp['success'], "submit order gagal meja {$table}");

        return $resp['order'];
    }

    /** KDS: advance tiap item order 5-step sampai selesai, lalu order → siap_bayar. */
    private function runKitchen(string $orderCode): void
    {
        $this->actingAs($this->kitchen);

        $order = Order::withoutGlobalScopes()
            ->where('order_code', $orderCode)->firstOrFail();
        $items = $order->items()->withoutGlobalScopes()->get();

        $steps = [
            'dikonfirmasi',
            'sedang dimasak',
            'selesai masak',
            'siap sajikan',
            'selesai',
        ];

        foreach ($items as $item) {
            foreach ($steps as $step) {
                $this->kdsCtrl->updateItemCookStatus(
                    Request::create("/api/order-items/{$item->id}/cook-status", 'PUT', ['status' => $step]),
                    $item->id
                );
            }
        }

        // Order → siap_bayar (tombol "Selesai" di KDS).
        $this->kdsCtrl->updateOrderStatus(
            Request::create("/api/orders/{$orderCode}/status", 'PUT', ['status' => 'Selesai']),
            $orderCode
        );

        $order->refresh();
        $this->assertSame(Order::STATUS_SIAP_BAYAR, $order->status);
    }

    /** Kasir bayar (hapus dari antrean → lunas). */
    private function cashierPay(string $orderCode): void
    {
        $this->actingAs($this->cashier);

        $this->cashierCtrl->clearCashierQueueItem($orderCode);

        $order = Order::withoutGlobalScopes()
            ->where('order_code', $orderCode)->firstOrFail();
        $this->assertSame(Order::STATUS_SELESAI, $order->status);
        $this->assertSame('paid', $order->payment_status);
    }

    public function test_demo_5_meja_alur_lengkap_hingga_pembayaran(): void
    {
        // 5 meja dengan variasi makanan + minuman berbeda.
        $scenarios = [
            'A1' => [['menu_item_id' => $this->foodIds[0], 'quantity' => 2], ['menu_item_id' => $this->foodIds[1], 'quantity' => 1], ['menu_item_id' => $this->drinkIds[0], 'quantity' => 1]],
            'A2' => [['menu_item_id' => $this->foodIds[2], 'quantity' => 1], ['menu_item_id' => $this->drinkIds[1], 'quantity' => 2], ['menu_item_id' => $this->drinkIds[2], 'quantity' => 1]],
            'A3' => [['menu_item_id' => $this->foodIds[0], 'quantity' => 1], ['menu_item_id' => $this->foodIds[1], 'quantity' => 1], ['menu_item_id' => $this->foodIds[2], 'quantity' => 1]],
            'A4' => [['menu_item_id' => $this->drinkIds[0], 'quantity' => 2], ['menu_item_id' => $this->drinkIds[2], 'quantity' => 1]], // murni minuman → BAR
            'A5' => [['menu_item_id' => $this->foodIds[1], 'quantity' => 2], ['menu_item_id' => $this->foodIds[2], 'quantity' => 1], ['menu_item_id' => $this->drinkIds[0], 'quantity' => 2], ['menu_item_id' => $this->drinkIds[1], 'quantity' => 1]],
        ];

        foreach ($scenarios as $table => $items) {
            $token = $this->guestVerifyToken($table);
            $order = $this->submitOrder($table, $token, $items);
            $this->runKitchen($order['id']);
            $this->cashierPay($order['id']);
        }

        // Semua 5 order lunas.
        $paid = Order::withoutGlobalScopes()
            ->where('tenant_id', $this->testTenant->id)
            ->where('payment_status', 'paid')
            ->count();
        $this->assertSame(5, $paid);

        // BAR destination (A4) benar routing.
        $barOrder = Order::withoutGlobalScopes()
            ->where('tenant_id', $this->testTenant->id)
            ->where('table_number', 'Meja A4')->firstOrFail();
        $this->assertSame(Order::DEST_BAR, $barOrder->destination);
    }
}
