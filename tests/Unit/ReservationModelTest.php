<?php

namespace Tests\Unit;

use App\Models\Outlet;
use App\Models\Reservation;
use App\Models\Tenant;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class ReservationModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_generate_code_format(): void
    {
        $code = 'RSV-'.str_pad('1', 3, '0', STR_PAD_LEFT);
        $this->assertStringStartsWith('RSV-', $code);
        $this->assertEquals(7, strlen($code));
    }

    public function test_tenant_relation(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $reservation = Reservation::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'reservation_code' => 'RSV-001',
            'name' => 'Test Customer',
            'phone' => '08123456789',
            'date' => now()->toDateString(),
            'time' => '19:00',
            'guests' => 2,
        ]);

        $this->assertEquals($tenant->id, $reservation->tenant->id);
    }

    public function test_outlet_relation(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $outlet = Outlet::create(['tenant_id' => $tenant->id, 'name' => 'Outlet', 'address' => 'Jl. Test']);
        $reservation = Reservation::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'outlet_id' => $outlet->id,
            'reservation_code' => 'RSV-001',
            'name' => 'Test Customer',
            'phone' => '08123456789',
            'date' => now()->toDateString(),
            'time' => '19:00',
            'guests' => 2,
        ]);

        $this->assertEquals($outlet->id, $reservation->outlet->id);
    }

    public function test_date_cast(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $reservation = Reservation::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'reservation_code' => 'RSV-001',
            'name' => 'Test Customer',
            'phone' => '08123456789',
            'date' => '2026-01-15',
            'time' => '19:00',
            'guests' => 4,
        ]);

        $this->assertInstanceOf(Carbon::class, $reservation->date);
        $this->assertEquals(4, $reservation->guests);
    }
}
