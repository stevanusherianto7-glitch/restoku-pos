<?php

namespace Tests\Feature;

use App\Models\MenuItem;
use App\Models\Order;
use App\Models\Outlet;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests untuk OrderController.
 * Verifikasi: tenant isolation, BUG-006 fix, BUG-007 fix, BUG-008 fix, BUG-012 fix.
 */
class OrderControllerTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenantA;
    private Tenant $tenantB;
    private Outlet $outletA;
    private Outlet $outletB;
    private User   $staffA;
    private User   $ownerA;
    private MenuItem $menuItemA;

    protected function setUp(): void
    {
        parent::setUp();

        // Tenant A
        $this->tenantA = Tenant::create([
            'name'       => 'Resto A',
            'brand_name' => 'Resto A',
            'email'      => 'a@test.com',
            'phone'      => '0811111111',
        ]);

        $this->outletA = Outlet::create([
            'tenant_id' => $this->tenantA->id,
            'name'      => 'Outlet A',
            'address'   => 'Jl. Test A',
        ]);

        $this->staffA = User::create([
            'tenant_id' => $this->tenantA->id,
            'outlet_id' => $this->outletA->id,
            'name'      => 'Kasir A',
            'email'     => 'kasir@a.com',
            'password'  => bcrypt('password'),
            'role'      => 'cashier',
        ]);

        $this->ownerA = User::create([
            'tenant_id' => $this->tenantA->id,
            'name'      => 'Owner A',
            'email'     => 'owner@a.com',
            'password'  => bcrypt('password'),
            'role'      => 'owner',
        ]);

        $this->menuItemA = MenuItem::withoutGlobalScopes()->create([
            'tenant_id'    => $this->tenantA->id,
            'name'         => 'Nasi Goreng',
            'price'        => 30000,
            'is_available' => true,
        ]);

        // Tenant B (untuk cross-tenant test)
        $this->tenantB = Tenant::create([
            'name'       => 'Resto B',
            'brand_name' => 'Resto B',
            'email'      => 'b@test.com',
            'phone'      => '0822222222',
        ]);

        $this->outletB = Outlet::create([
            'tenant_id' => $this->tenantB->id,
            'name'      => 'Outlet B',
            'address'   => 'Jl. Test B',
        ]);
    }

    // ─── submitOrder ──────────────────────────────────────────────────────────

    /**
     * BUG-006 FIX: Pastikan tenant_id TIDAK diterima dari body request.
     * tenant_id harus diambil dari outlet.
     */
    public function test_submit_order_uses_tenant_from_outlet_not_request(): void
    {
        $response = $this->postJson('/api/orders', [
            'outlet_id' => $this->outletA->id,
            'table'     => '5',
            'items'     => [
                ['menu_item_id' => $this->menuItemA->id, 'quantity' => 2],
            ],
            // Tidak ada tenant_id di sini — harus diambil dari outlet
        ]);

        $response->assertStatus(200)
                 ->assertJson(['success' => true]);

        $this->assertDatabaseHas('orders', [
            'tenant_id' => $this->tenantA->id,
            'outlet_id' => $this->outletA->id,
        ]);
    }

    /**
     * BUG-006 FIX: Client TIDAK BISA menggunakan outlet tenant lain untuk inject tenant_id.
     * Order harus selalu ke tenant yang memiliki outlet tersebut.
     */
    public function test_submit_order_cannot_inject_different_tenant(): void
    {
        // Kirim order ke outletB tapi dengan menu dari tenantA
        $response = $this->postJson('/api/orders', [
            'outlet_id' => $this->outletB->id,
            'table'     => '1',
            'items'     => [
                // menu_item_id dari tenant A — tidak boleh bisa dipesan via outlet B
                ['menu_item_id' => $this->menuItemA->id, 'quantity' => 1],
            ],
        ]);

        // Harus 422 karena menu item tidak ditemukan untuk tenant B
        $response->assertStatus(422);
    }

    /**
     * BUG-012 FIX: Menu yang tidak tersedia tidak boleh bisa dipesan.
     */
    public function test_submit_order_rejects_unavailable_menu_item(): void
    {
        $unavailableItem = MenuItem::withoutGlobalScopes()->create([
            'tenant_id'    => $this->tenantA->id,
            'name'         => 'Menu Habis',
            'price'        => 20000,
            'is_available' => false,
        ]);

        $response = $this->postJson('/api/orders', [
            'outlet_id' => $this->outletA->id,
            'table'     => '3',
            'items'     => [
                ['menu_item_id' => $unavailableItem->id, 'quantity' => 1],
            ],
        ]);

        $response->assertStatus(422);
    }

    // ─── Tenant Isolation ─────────────────────────────────────────────────────

    /**
     * Tenant isolation: staff dari tenant A tidak boleh melihat order tenant B.
     */
    public function test_kds_orders_are_scoped_to_tenant(): void
    {
        // Buat order untuk tenant B
        Order::withoutGlobalScopes()->create([
            'tenant_id'    => $this->tenantB->id,
            'order_code'   => 'ORD-0708-01',
            'table_number' => 'Meja 1',
            'source'       => 'guest_qr',
            'status'       => Order::STATUS_ANTRIAN_MASUK,
        ]);

        $response = $this->actingAs($this->staffA)
                         ->getJson('/api/orders');

        $response->assertStatus(200);

        // Staff A tidak boleh melihat order tenant B
        $allIds = collect($response->json('grouped'))->flatten(1)->pluck('id');
        $this->assertNotContains('ORD-0708-01', $allIds);
    }

    // ─── updateReservationStatus ───────────────────────────────────────────────

    /**
     * BUG-007 FIX: Status reservasi harus divalidasi.
     */
    public function test_update_reservation_status_rejects_invalid_status(): void
    {
        $reservation = \App\Models\Reservation::withoutGlobalScopes()->create([
            'tenant_id'        => $this->tenantA->id,
            'reservation_code' => 'RSV-001',
            'name'             => 'Test Tamu',
            'phone'            => '08111',
            'date'             => now()->addDay()->toDateString(),
            'time'             => '18:00',
            'guests'           => 4,
            'type'             => 'meja',
            'status'           => 'pending',
        ]);

        $response = $this->actingAs($this->staffA)
                         ->putJson("/api/reservations/{$reservation->reservation_code}/status", [
                             'status' => 'hacked_status', // nilai tidak valid
                         ]);

        $response->assertStatus(422);
    }

    /**
     * BUG-008 FIX: Staff tenant A tidak boleh update reservasi milik tenant B.
     */
    public function test_update_reservation_status_enforces_tenant_ownership(): void
    {
        // Reservasi milik tenant B
        $reservationB = \App\Models\Reservation::withoutGlobalScopes()->create([
            'tenant_id'        => $this->tenantB->id,
            'reservation_code' => 'RSV-B01',
            'name'             => 'Tamu B',
            'phone'            => '082222',
            'date'             => now()->addDay()->toDateString(),
            'time'             => '19:00',
            'guests'           => 2,
            'type'             => 'meja',
            'status'           => 'pending',
        ]);

        // Staff dari tenant A mencoba update
        $response = $this->actingAs($this->staffA)
                         ->putJson("/api/reservations/{$reservationB->reservation_code}/status", [
                             'status' => 'confirmed',
                         ]);

        // Harus 404 (TenantScope menyembunyikan reservasi tenant lain) atau 403
        $response->assertStatus(404);
    }

    /**
     * Happy path: update status reservasi berhasil oleh staff yang tepat.
     */
    public function test_update_reservation_status_success(): void
    {
        $reservation = \App\Models\Reservation::withoutGlobalScopes()->create([
            'tenant_id'        => $this->tenantA->id,
            'reservation_code' => 'RSV-A01',
            'name'             => 'Tamu A',
            'phone'            => '08111',
            'date'             => now()->addDay()->toDateString(),
            'time'             => '18:00',
            'guests'           => 2,
            'type'             => 'meja',
            'status'           => 'pending',
        ]);

        $response = $this->actingAs($this->staffA)
                         ->putJson("/api/reservations/{$reservation->reservation_code}/status", [
                             'status' => 'confirmed',
                         ]);

        $response->assertStatus(200)->assertJson(['success' => true]);
        $this->assertDatabaseHas('reservations', [
            'reservation_code' => 'RSV-A01',
            'status'           => 'confirmed',
        ]);
    }

    // ─── Authentication ────────────────────────────────────────────────────────

    /**
     * Route yang protected harus menolak unauthenticated request.
     */
    public function test_protected_routes_require_authentication(): void
    {
        $this->getJson('/api/orders')->assertStatus(401);
        $this->getJson('/api/cashier-queue')->assertStatus(401);
    }
}
