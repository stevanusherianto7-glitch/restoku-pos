<?php

namespace Tests\Feature;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Outlet;
use App\Models\Reservation;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class PublicOrderControllerTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private Outlet $outlet;

    private MenuItem $menuItem;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create([
            'name' => 'Resto Public',
            'brand_name' => 'Public',
            'email' => 'public@test.com',
            'phone' => '081111',
        ]);

        $this->outlet = Outlet::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Outlet Public',
            'address' => 'Jl. Public',
            'slug' => 'outlet-public',
        ]);

        $this->menuItem = MenuItem::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Nasi Goreng',
            'price' => 30000,
            'is_available' => true,
        ]);
    }

    // ─── getPublicMenu ─────────────────────────────────────────────────────────

    public function test_get_public_menu_returns_menu_items(): void
    {
        $response = $this->getJson('/api/menu/outlet-public');

        $response->assertStatus(200)
            ->assertJsonStructure(['outlet', 'menu']);
    }

    public function test_get_public_menu_returns_404_for_unknown_slug(): void
    {
        $response = $this->getJson('/api/menu/unknown-slug');

        $response->assertStatus(404);
    }

    // ─── submitOrder ───────────────────────────────────────────────────────────

    public function test_submit_order_creates_order(): void
    {
        $response = $this->postJson('/api/orders', [
            'outlet_id' => $this->outlet->id,
            'table' => '5',
            'items' => [
                ['menu_item_id' => $this->menuItem->id, 'quantity' => 2],
            ],
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('orders', [
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
        ]);
    }

    public function test_submit_order_rejects_invalid_outlet(): void
    {
        $response = $this->postJson('/api/orders', [
            'outlet_id' => 99999,
            'table' => '1',
            'items' => [
                ['menu_item_id' => $this->menuItem->id, 'quantity' => 1],
            ],
        ]);

        $response->assertStatus(422);
    }

    public function test_submit_order_rejects_unavailable_item(): void
    {
        $unavailable = MenuItem::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Habis',
            'price' => 10000,
            'is_available' => false,
        ]);

        $response = $this->postJson('/api/orders', [
            'outlet_id' => $this->outlet->id,
            'table' => '1',
            'items' => [
                ['menu_item_id' => $unavailable->id, 'quantity' => 1],
            ],
        ]);

        $response->assertStatus(422);
    }

    // ─── getOrderStatus ────────────────────────────────────────────────────────

    public function test_get_order_status_success(): void
    {
        Order::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'order_code' => 'PUB-001',
            'table_number' => 'Meja 1',
            'source' => 'guest_qr',
            'status' => Order::STATUS_ANTRIAN_MASUK,
        ]);

        $response = $this->getJson("/api/orders/PUB-001?outlet_id={$this->outlet->id}");

        $response->assertStatus(200)
            ->assertJson(['success' => true]);
    }

    public function test_get_order_status_returns_404_for_unknown(): void
    {
        $response = $this->getJson("/api/orders/UNKNOWN?outlet_id={$this->outlet->id}");

        $response->assertStatus(404);
    }

    // ─── Reservation ───────────────────────────────────────────────────────────

    public function test_submit_reservation_creates_reservation(): void
    {
        $response = $this->postJson('/api/reservations', [
            'outlet_id' => $this->outlet->id,
            'name' => 'Tamu Test',
            'phone' => '081111',
            'date' => now()->addDay()->toDateString(),
            'time' => '18:00',
            'guests' => 4,
            'type' => 'meja',
        ]);

        $response->assertStatus(200)
            ->assertJson(['success' => true]);

        $this->assertDatabaseHas('reservations', [
            'tenant_id' => $this->tenant->id,
            'name' => 'Tamu Test',
        ]);
    }

    public function test_get_reservations_returns_reservations(): void
    {
        Reservation::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'reservation_code' => 'RSV-001',
            'name' => 'Tamu 1',
            'phone' => '081111',
            'date' => now()->addDay()->toDateString(),
            'time' => '18:00',
            'guests' => 2,
            'type' => 'meja',
            'status' => 'pending',
        ]);

        $response = $this->getJson("/api/reservations?outlet_id={$this->outlet->id}");

        $response->assertStatus(200)
            ->assertJsonStructure(['reservations']);
    }

    // ─── getOutletOperatingHours ───────────────────────────────────────────────

    public function test_get_outlet_operating_hours_returns_defaults_for_unknown(): void
    {
        $response = $this->getJson('/api/outlet-operating-hours?outlet=unknown');

        $response->assertStatus(200)
            ->assertJson(['is_open_now' => true]);
    }

    public function test_get_outlet_operating_hours_returns_settings(): void
    {
        $response = $this->getJson('/api/outlet-operating-hours?outlet=outlet-public');

        $response->assertStatus(200)
            ->assertJsonStructure(['is_open_now', 'operating_hours']);
    }

    // ─── updateReservationStatus ───────────────────────────────────────────────

    public function test_update_reservation_status_success(): void
    {
        $reservation = Reservation::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'reservation_code' => 'RSV-010',
            'name' => 'Tamu Update',
            'phone' => '081111',
            'date' => now()->addDay()->toDateString(),
            'time' => '19:00',
            'guests' => 3,
            'type' => 'meja',
            'status' => 'pending',
        ]);

        $user = User::create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
            'name' => 'Staff',
            'email' => 'staff@update.com',
            'password' => bcrypt('password'),
            'role' => 'cashier',
        ]);

        $response = $this->actingAs($user)
            ->putJson('/api/reservations/RSV-010/status', [
                'status' => 'confirmed',
            ]);

        $response->assertStatus(200)->assertJson(['success' => true]);
    }

    public function test_update_reservation_status_rejects_invalid_status(): void
    {
        $reservation = Reservation::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'reservation_code' => 'RSV-011',
            'name' => 'Tamu Invalid',
            'phone' => '081111',
            'date' => now()->addDay()->toDateString(),
            'time' => '19:00',
            'guests' => 2,
            'type' => 'meja',
            'status' => 'pending',
        ]);

        $user = User::create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
            'name' => 'Staff2',
            'email' => 'staff2@update.com',
            'password' => bcrypt('password'),
            'role' => 'cashier',
        ]);

        $response = $this->actingAs($user)
            ->putJson('/api/reservations/RSV-011/status', [
                'status' => 'invalid_status',
            ]);

        $response->assertStatus(422);
    }

    public function test_submit_order_prepends_meja_to_table_number(): void
    {
        $response = $this->postJson('/api/orders', [
            'outlet_id' => $this->outlet->id,
            'table' => '7',
            'items' => [
                ['menu_item_id' => $this->menuItem->id, 'quantity' => 1],
            ],
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('orders', [
            'tenant_id' => $this->tenant->id,
            'table_number' => 'Meja 7',
        ]);
    }

    public function test_submit_order_preserves_meja_prefix(): void
    {
        $response = $this->postJson('/api/orders', [
            'outlet_id' => $this->outlet->id,
            'table' => 'Meja VIP',
            'items' => [
                ['menu_item_id' => $this->menuItem->id, 'quantity' => 1],
            ],
        ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('orders', [
            'tenant_id' => $this->tenant->id,
            'table_number' => 'Meja VIP',
        ]);
    }

    public function test_get_order_status_returns_tone_for_status(): void
    {
        $order = Order::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
            'order_code' => 'ORD-TONE-001',
            'table_number' => 'Meja 1',
            'source' => 'guest_qr',
            'status' => Order::STATUS_SEDANG_DIMASAK,
        ]);

        $response = $this->getJson("/api/orders/ORD-TONE-001?outlet_id={$this->outlet->id}");

        $response->assertStatus(200);
        $response->assertJson([
            'success' => true,
            'status' => 'Sedang Dimasak',
            'tone' => 'blue',
        ]);
    }
}
