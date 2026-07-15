<?php

namespace Tests\Unit;

use App\Models\Outlet;
use App\Models\Reservation;
use App\Models\Tenant;
use App\Services\ReservationService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Symfony\Component\HttpKernel\Exception\HttpException;
use Tests\TestCase;

/**
 * S-13 — Unit test ReservationService (ekstrak dari OrderController).
 */
class ReservationServiceTest extends TestCase
{
    use RefreshDatabase;

    private ReservationService $service;

    private Tenant $tenant;

    private Outlet $outlet;

    protected function setUp(): void
    {
        parent::setUp();

        $this->service = $this->app->make(ReservationService::class);

        $this->tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $this->outlet = Outlet::create(['tenant_id' => $this->tenant->id, 'name' => 'Outlet', 'address' => 'Jl. Test']);
    }

    public function test_create_persists_reservation_for_outlet_tenant(): void
    {
        $reservation = $this->service->create([
            'outlet_id' => $this->outlet->id,
            'name' => 'Tamu',
            'phone' => '081111',
            'date' => now()->addDay()->toDateString(),
            'time' => '18:00',
            'guests' => 4,
            'type' => 'meja',
        ]);

        $this->assertInstanceOf(Reservation::class, $reservation);
        $this->assertEquals($this->tenant->id, $reservation->tenant_id);
        $this->assertEquals('pending', $reservation->status);
        $this->assertStringStartsWith('RSV-', $reservation->reservation_code);
    }

    public function test_list_for_outlet_returns_only_same_tenant(): void
    {
        $otherTenant = Tenant::create(['name' => 'T2', 'brand_name' => 'B2', 'email' => 't2@test.com', 'phone' => '082']);
        $otherOutlet = Outlet::create(['tenant_id' => $otherTenant->id, 'name' => 'Other', 'address' => 'Jl. Other']);

        Reservation::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
            'reservation_code' => 'RSV-A',
            'name' => 'A', 'phone' => '1',
            'date' => now()->toDateString(), 'time' => '18:00', 'guests' => 1,
        ]);
        Reservation::withoutGlobalScopes()->create([
            'tenant_id' => $otherTenant->id,
            'outlet_id' => $otherOutlet->id,
            'reservation_code' => 'RSV-B',
            'name' => 'B', 'phone' => '1',
            'date' => now()->toDateString(), 'time' => '18:00', 'guests' => 1,
        ]);

        $list = $this->service->listForOutlet($this->outlet->id);

        $this->assertCount(1, $list);
        $this->assertEquals('RSV-A', $list->first()->reservation_code);
    }

    /** BUG-008 — cross-tenant update HARUS 403. */
    public function test_update_status_rejects_cross_tenant(): void
    {
        $otherTenant = Tenant::create(['name' => 'T2', 'brand_name' => 'B2', 'email' => 't2@test.com', 'phone' => '082']);

        $reservation = Reservation::withoutGlobalScopes()->create([
            'tenant_id' => $otherTenant->id,
            'reservation_code' => 'RSV-X',
            'name' => 'X', 'phone' => '1',
            'date' => now()->toDateString(), 'time' => '18:00', 'guests' => 1,
            'status' => 'pending',
        ]);

        $this->expectException(HttpException::class);
        $this->service->updateStatus($reservation->reservation_code, 'confirmed', $this->tenant->id);
    }

    public function test_update_status_applies_for_same_tenant(): void
    {
        $reservation = Reservation::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'reservation_code' => 'RSV-Y',
            'name' => 'Y', 'phone' => '1',
            'date' => now()->toDateString(), 'time' => '18:00', 'guests' => 1,
            'status' => 'pending',
        ]);

        $this->service->updateStatus($reservation->reservation_code, 'confirmed', $this->tenant->id);

        $this->assertDatabaseHas('reservations', [
            'reservation_code' => 'RSV-Y',
            'status' => 'confirmed',
        ]);
    }
}
