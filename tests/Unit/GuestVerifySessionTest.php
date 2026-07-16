<?php

namespace Tests\Unit;

use App\Http\Controllers\GuestVerifyController;
use App\Models\Outlet;
use App\Models\OutletTable;
use App\Models\Tenant;
use App\Services\DailyPinService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Session-based guest verification:
 * - verify() menghasilkan last_scan_token baru per scan (invalidate sesi lama)
 * - tableSession() mengembalikan last_scan_token aktif
 * - tamu baru scan meja SAMA -> token berubah -> sesi lama invalid
 */
class GuestVerifySessionTest extends TestCase
{
    use RefreshDatabase;

    private function seedOutletAndTable(): array
    {
        $tenant = Tenant::create(['name' => 'T', 'slug' => 't', 'brand_name' => 'T Brand', 'email' => 't@example.com']);
        $outlet = Outlet::create([
            'tenant_id' => $tenant->id,
            'name' => 'Pawon',
            'slug' => 'pawon-salam',
            'latitude' => null,
            'longitude' => null,
        ]);
        $table = OutletTable::create([
            'tenant_id' => $tenant->id,
            'outlet_id' => $outlet->id,
            'label' => 'A1',
            'pin_hash' => Hash::make('6565'),
        ]);

        return [$outlet, $table];
    }

    private function seedDailyPin(Outlet $outlet): string
    {
        // Pakai service asli (final class, tidak bisa di-mock): generate lalu return PIN plaintext.
        return app(DailyPinService::class)->getOrGenerate($outlet->id, now()->toDateString());
    }

    public function test_verify_returns_table_session_and_persists_token(): void
    {
        [$outlet, $table] = $this->seedOutletAndTable();
        $dailyPin = $this->seedDailyPin($outlet);

        $ctrl = app(GuestVerifyController::class);
        $req = Request::create('/api/guest/verify', 'POST', [
            'slug' => 'pawon-salam',
            'table' => 'A1',
            'table_pin' => '6565',
            'daily_pin' => $dailyPin,
            'lat' => 0,
            'lng' => 0,
        ]);
        $req->setMethod('POST');
        $resp = $ctrl->verify($req)->getData(true);

        $this->assertTrue($resp['ok']);
        $this->assertNotEmpty($resp['table_session']);
        $this->assertEquals(32, strlen($resp['table_session']));

        // token tersimpan di DB
        $table->refresh();
        $this->assertEquals($resp['table_session'], $table->last_scan_token);
    }

    public function test_new_scan_on_same_table_invalidates_previous_session(): void
    {
        [$outlet, $table] = $this->seedOutletAndTable();
        $dailyPin = $this->seedDailyPin($outlet);

        $ctrl = app(GuestVerifyController::class);
        $post = function () use ($ctrl, $dailyPin) {
            $req = Request::create('/api/guest/verify', 'POST', [
                'slug' => 'pawon-salam',
                'table' => 'A1',
                'table_pin' => '6565',
                'daily_pin' => $dailyPin,
                'lat' => 0,
                'lng' => 0,
            ]);

            return $ctrl->verify($req)->getData(true);
        };

        $first = $post();
        $table->refresh();
        $this->assertEquals($first['table_session'], $table->last_scan_token);

        // Tamu BARU scan QR meja yang SAMA -> token berubah
        $second = $post();
        $this->assertNotEquals($first['table_session'], $second['table_session']);
        $table->refresh();
        $this->assertEquals($second['table_session'], $table->last_scan_token);
    }

    public function test_table_session_endpoint_returns_active_token(): void
    {
        [$outlet, $table] = $this->seedOutletAndTable();
        $dailyPin = $this->seedDailyPin($outlet);

        $ctrl = app(GuestVerifyController::class);
        $verifyReq = Request::create('/api/guest/verify', 'POST', [
            'slug' => 'pawon-salam',
            'table' => 'A1',
            'table_pin' => '6565',
            'daily_pin' => $dailyPin,
            'lat' => 0,
            'lng' => 0,
        ]);
        $resp = $ctrl->verify($verifyReq)->getData(true);
        $expected = $resp['table_session'];

        $sessionReq = Request::create('/api/guest/table-session?slug=pawon-salam&table=A1', 'GET');
        $sessionResp = $ctrl->tableSession($sessionReq)->getData(true);

        $this->assertEquals($expected, $sessionResp['table_session']);
    }

    public function test_table_session_missing_params_returns_422(): void
    {
        $ctrl = app(GuestVerifyController::class);
        $req = Request::create('/api/guest/table-session', 'GET');
        $resp = $ctrl->tableSession($req);
        $this->assertEquals(422, $resp->getStatusCode());
    }
}
