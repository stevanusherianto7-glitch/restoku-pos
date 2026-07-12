<?php

namespace Tests\Feature;

use App\Models\Outlet;
use App\Models\OutletDailyPin;
use App\Services\DailyPinService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\HasTenantSetup;

class CashierGeoVerifyTest extends TestCase
{
    use HasTenantSetup;
    use RefreshDatabase;

    private DailyPinService $service;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setupTenantEnvironment();
        $this->service = app(DailyPinService::class);
    }

    public function test_daily_pin_is_generated_and_stable_per_day(): void
    {
        $pin1 = $this->service->getOrGenerate($this->testOutlet->id, '2026-07-12');
        $pin2 = $this->service->getOrGenerate($this->testOutlet->id, '2026-07-12');

        $this->assertMatchesRegularExpression('/^\d{4}$/', $pin1);
        $this->assertSame($pin1, $pin2, 'PIN harus stabil untuk tanggal yang sama');
    }

    public function test_pin_differs_across_dates(): void
    {
        $pinA = $this->service->getOrGenerate($this->testOutlet->id, '2026-07-12');
        $pinB = $this->service->getOrGenerate($this->testOutlet->id, '2026-07-13');

        $this->assertNotSame($pinA, $pinB, 'PIN harus berbeda tiap hari (rotate harian)');
    }

    public function test_verify_accepts_correct_pin_and_rejects_wrong(): void
    {
        $pin = $this->service->getOrGenerate($this->testOutlet->id, '2026-07-12');

        $this->assertTrue($this->service->verify($this->testOutlet->id, $pin, '2026-07-12'));
        $this->assertFalse($this->service->verify($this->testOutlet->id, '0000', '2026-07-12'));
    }

    public function test_mark_verified_records_timestamp(): void
    {
        $this->service->getOrGenerate($this->testOutlet->id, '2026-07-12');
        $this->service->markVerified($this->testOutlet->id, $this->testStaff, '2026-07-12');

        $row = OutletDailyPin::where('outlet_id', $this->testOutlet->id)
            ->where('pin_date', '2026-07-12')
            ->firstOrFail();

        $this->assertNotNull($row->verified_at);
        $this->assertSame($this->testStaff->id, $row->verified_by);
    }

    public function test_endpoint_verify_requires_correct_pin(): void
    {
        $pin = $this->service->getOrGenerate($this->testOutlet->id, now()->toDateString());

        // PIN salah
        $bad = $this->actingAs($this->testStaff)
            ->postJson('/api/cashier/verify-location', ['pin' => '0000']);
        $bad->assertOk();
        $bad->assertJson(['verified' => false, 'pin_ok' => false]);

        // PIN benar, tanpa GPS → PIN_ONLY
        $good = $this->actingAs($this->testStaff)
            ->postJson('/api/cashier/verify-location', ['pin' => $pin]);
        $good->assertOk();
        $good->assertJson(['verified' => true, 'pin_ok' => true, 'gps_provided' => false, 'method' => 'PIN_ONLY']);
    }

    public function test_endpoint_verify_within_radius(): void
    {
        $pin = $this->service->getOrGenerate($this->testOutlet->id, now()->toDateString());

        // Outlet di (-6.20, 106.82), radius 50m. Titik ~10m di utara.
        $resp = $this->actingAs($this->testStaff)
            ->postJson('/api/cashier/verify-location', [
                'pin' => $pin,
                'lat' => -6.19991,
                'lng' => 106.82,
                'accuracy' => 10,
            ]);

        $resp->assertOk();
        $resp->assertJson(['verified' => true, 'within_radius' => true, 'method' => 'GPS']);
    }

    public function test_endpoint_verify_outside_radius_fails(): void
    {
        $pin = $this->service->getOrGenerate($this->testOutlet->id, now()->toDateString());

        // ~500m jauhnya → di luar radius 50m
        $resp = $this->actingAs($this->testStaff)
            ->postJson('/api/cashier/verify-location', [
                'pin' => $pin,
                'lat' => -6.205,
                'lng' => 106.82,
                'accuracy' => 10,
            ]);

        $resp->assertOk();
        $resp->assertJson(['verified' => false, 'within_radius' => false, 'method' => 'GPS_OUT_OF_RANGE']);
    }

    public function test_owner_can_view_daily_pin(): void
    {
        $resp = $this->actingAs($this->testOwner)->getJson('/owner/outlet/daily-pin');
        $resp->assertOk();
        $resp->assertJsonStructure(['pin', 'date', 'latitude', 'longitude', 'geo_radius_meters']);
        $this->assertMatchesRegularExpression('/^\d{4}$/', $resp->json('pin'));
    }

    public function test_haversine_computes_distance(): void
    {
        $dist = DailyPinService::haversine(-6.20, 106.82, -6.19991, 106.82);
        // ~10m utara
        $this->assertGreaterThan(5, $dist);
        $this->assertLessThan(20, $dist);
    }
}
