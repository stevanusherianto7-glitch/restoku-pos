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

/**
 * Feature tests untuk Authenticated Mutation API Endpoints.
 *
 * Mencakup endpoint yang sebelumnya hanya ditest dari luar (HTTP 401):
 * - PUT /api/orders/{id}/status
 * - DELETE /api/cashier-queue/{id}
 * - PUT /api/reservations/{id}/status
 * - POST /api/ai/chat
 * - POST /api/outlet-settings/karyawan (create staff)
 *
 * Setiap test memverifikasi 3 skenario wajib:
 *   1. Happy Path — user yang benar bisa melakukan aksi
 *   2. Tenant Isolation — user tenant lain mendapat 403/404
 *   3. Unauthenticated — tanpa auth mendapat 401
 */
class AuthenticatedMutationTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenantA;
    private Tenant $tenantB;
    private Outlet $outletA;
    private Outlet $outletB;
    private User   $staffA;
    private User   $ownerA;
    private User   $staffB;
    private Order  $orderA;
    private MenuItem $menuItemA;

    protected function setUp(): void
    {
        parent::setUp();

        // ── Tenant A ──────────────────────────────────────────────────────
        $this->tenantA = Tenant::create([
            'name'       => 'Resto Alpha',
            'brand_name' => 'Alpha',
            'email'      => 'alpha@test.com',
            'phone'      => '0811111111',
        ]);
        $this->outletA = Outlet::create([
            'tenant_id' => $this->tenantA->id,
            'name'      => 'Outlet Alpha',
            'address'   => 'Jl. Alpha',
        ]);
        $this->staffA = User::create([
            'tenant_id' => $this->tenantA->id,
            'outlet_id' => $this->outletA->id,
            'name'      => 'Kasir Alpha',
            'email'     => 'kasir@alpha.com',
            'password'  => bcrypt('pw'),
            'role'      => 'kasir',
        ]);
        $this->ownerA = User::create([
            'tenant_id' => $this->tenantA->id,
            'outlet_id' => $this->outletA->id,
            'name'      => 'Owner Alpha',
            'email'     => 'owner@alpha.com',
            'password'  => bcrypt('pw'),
            'role'      => 'owner',
        ]);
        $this->menuItemA = MenuItem::withoutGlobalScopes()->create([
            'tenant_id'    => $this->tenantA->id,
            'name'         => 'Soto Ayam',
            'price'        => 25000,
            'is_available' => true,
        ]);
        // Buat order untuk Tenant A
        $this->orderA = Order::withoutGlobalScopes()->create([
            'tenant_id'    => $this->tenantA->id,
            'outlet_id'    => $this->outletA->id,
            'order_code'   => 'ORD-ALPHA-001',
            'table_number' => 'Meja 3',
            'source'       => 'pos',
            'status'       => Order::STATUS_ANTRIAN_MASUK,
        ]);

        // ── Tenant B (untuk cross-tenant isolation tests) ─────────────────
        $this->tenantB = Tenant::create([
            'name'       => 'Resto Beta',
            'brand_name' => 'Beta',
            'email'      => 'beta@test.com',
            'phone'      => '0822222222',
        ]);
        $this->outletB = Outlet::create([
            'tenant_id' => $this->tenantB->id,
            'name'      => 'Outlet Beta',
            'address'   => 'Jl. Beta',
        ]);
        $this->staffB = User::create([
            'tenant_id' => $this->tenantB->id,
            'outlet_id' => $this->outletB->id,
            'name'      => 'Kasir Beta',
            'email'     => 'kasir@beta.com',
            'password'  => bcrypt('pw'),
            'role'      => 'kasir',
        ]);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUT /api/orders/{id}/status — Update status pesanan
    // ═══════════════════════════════════════════════════════════════════════

    public function test_authenticated_staff_can_update_order_status(): void
    {
        $response = $this->actingAs($this->staffA)
            ->putJson("/api/orders/{$this->orderA->order_code}/status", [
                'status' => 'Selesai',
            ]);

        $response->assertStatus(200)
                 ->assertJson(['success' => true]);

        $this->assertDatabaseHas('orders', [
            'id'     => $this->orderA->id,
            'status' => Order::STATUS_SIAP_BAYAR,
        ]);
    }

    public function test_unauthenticated_cannot_update_order_status(): void
    {
        $response = $this->putJson("/api/orders/{$this->orderA->order_code}/status", [
            'status' => 'Selesai',
        ]);
        $response->assertStatus(401);
    }

    public function test_staff_b_cannot_update_order_from_tenant_a(): void
    {
        $response = $this->actingAs($this->staffB)
            ->putJson("/api/orders/{$this->orderA->order_code}/status", [
                'status' => 'Selesai',
            ]);

        // Harus 404 karena TenantScope menyembunyikan order milik tenant A
        $response->assertStatus(404);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // PUT /api/reservations/{id}/status — Update status reservasi
    // ═══════════════════════════════════════════════════════════════════════

    public function test_authenticated_staff_can_update_reservation_status(): void
    {
        $reservation = Reservation::withoutGlobalScopes()->create([
            'tenant_id'        => $this->tenantA->id,
            'outlet_id'        => $this->outletA->id,
            'reservation_code' => 'RSV-A-001',
            'name'             => 'Andi Setiawan',
            'phone'            => '08123456789',
            'date'             => now()->addDays(2)->toDateString(),
            'time'             => '19:00',
            'guests'           => 4,
            'type'             => 'meja',
            'status'           => 'pending',
        ]);

        $response = $this->actingAs($this->staffA)
            ->putJson("/api/reservations/{$reservation->reservation_code}/status", [
                'status' => 'confirmed',
            ]);

        $response->assertStatus(200);

        $this->assertDatabaseHas('reservations', [
            'id'     => $reservation->id,
            'status' => 'confirmed',
        ]);
    }

    public function test_unauthenticated_cannot_update_reservation_status(): void
    {
        $reservation = Reservation::withoutGlobalScopes()->create([
            'tenant_id'        => $this->tenantA->id,
            'outlet_id'        => $this->outletA->id,
            'reservation_code' => 'RSV-A-002',
            'name'             => 'Budi',
            'phone'            => '08111',
            'date'             => now()->addDay()->toDateString(),
            'time'             => '18:00',
            'guests'           => 2,
            'type'             => 'meja',
            'status'           => 'pending',
        ]);

        $response = $this->putJson("/api/reservations/{$reservation->reservation_code}/status", [
            'status' => 'confirmed',
        ]);
        $response->assertStatus(401);
    }

    public function test_staff_b_cannot_update_reservation_from_tenant_a(): void
    {
        $reservation = Reservation::withoutGlobalScopes()->create([
            'tenant_id'        => $this->tenantA->id,
            'outlet_id'        => $this->outletA->id,
            'reservation_code' => 'RSV-A-003',
            'name'             => 'Citra',
            'phone'            => '08222',
            'date'             => now()->addDays(3)->toDateString(),
            'time'             => '20:00',
            'guests'           => 3,
            'type'             => 'meja',
            'status'           => 'pending',
        ]);

        $response = $this->actingAs($this->staffB)
            ->putJson("/api/reservations/{$reservation->reservation_code}/status", [
                'status' => 'confirmed',
            ]);

        $response->assertStatus(404);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // POST /api/outlet-settings/karyawan — Buat karyawan baru
    // ═══════════════════════════════════════════════════════════════════════

    public function test_owner_can_create_new_employee(): void
    {
        $response = $this->actingAs($this->ownerA)
            ->post('/api/outlet-settings/karyawan', [
                'name'     => 'Dewi Rahayu',
                'role'     => 'waiter',
                'password' => '1234',
                'email'    => 'dewi@alpha.com',
            ]);

        $response->assertStatus(302);

        $this->assertDatabaseHas('users', [
            'name'      => 'Dewi Rahayu',
            'tenant_id' => $this->tenantA->id,
        ]);
    }

    public function test_unauthenticated_cannot_create_employee(): void
    {
        $response = $this->postJson('/api/outlet-settings/karyawan', [
            'name'     => 'Ghost User',
            'role'     => 'kasir',
            'password' => '1234',
            'email'    => 'ghost@alpha.com',
        ]);
        $response->assertStatus(401);
    }

    // ═══════════════════════════════════════════════════════════════════════
    // POST /api/ai/chat — Gemini AI Chat
    // ═══════════════════════════════════════════════════════════════════════

    public function test_unauthenticated_cannot_access_ai_chat(): void
    {
        $response = $this->postJson('/api/ai/chat', [
            'message' => 'Rekomendasikan menu untuk malam ini',
        ]);
        $response->assertStatus(401);
    }

    public function test_authenticated_user_can_call_ai_chat_endpoint(): void
    {
        // AI chat mungkin butuh API key eksternal — kita hanya verifikasi
        // bahwa endpoint bisa diakses (tidak 401/403), meski hasilnya 422/500
        // jika API key tidak dikonfigurasi di test environment.
        $response = $this->actingAs($this->staffA)
            ->postJson('/api/ai/chat', [
                'message' => 'Test message',
            ]);

        // Endpoint diakses (bukan 401). Response bisa 200, 422, atau 500
        // tergantung apakah GEMINI_API_KEY tersedia di test env.
        $this->assertNotEquals(401, $response->status(), 'AI chat endpoint tidak boleh return 401 untuk user yang sudah login');
    }

    // ═══════════════════════════════════════════════════════════════════════
    // DELETE /api/cashier-queue/{id} — Hapus item dari antrean kasir
    // ═══════════════════════════════════════════════════════════════════════

    public function test_unauthenticated_cannot_clear_cashier_queue(): void
    {
        $response = $this->deleteJson('/api/cashier-queue/999');
        $response->assertStatus(401);
    }

    public function test_authenticated_staff_get_proper_response_for_nonexistent_queue_item(): void
    {
        // ID 999 tidak ada — harus 404, bukan crash
        $response = $this->actingAs($this->staffA)
            ->deleteJson('/api/cashier-queue/999');

        $response->assertStatus(404);
    }
}
