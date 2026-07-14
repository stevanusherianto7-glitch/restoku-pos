<?php

namespace Tests\Feature;

use App\Models\OutletTable;
use App\Services\DailyPinService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Crypt;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;
use Tests\Traits\HasTenantSetup;

class GuestVerifyControllerTest extends TestCase
{
    use HasTenantSetup;
    use RefreshDatabase;

    protected function setUp(): void
    {
        parent::setUp();
        $this->setupTenantEnvironment();
    }

    private function makeTable(string $label = 'A1'): OutletTable
    {
        return OutletTable::withoutGlobalScopes()->create([
            'tenant_id' => $this->testTenant->id,
            'outlet_id' => $this->testOutlet->id,
            'label' => $label,
            'pin_hash' => Hash::make(OutletTable::derivePin($this->testOutlet->id, $label)),
            'latitude' => $this->testOutlet->latitude,
            'longitude' => $this->testOutlet->longitude,
        ]);
    }

    public function test_verify_success_with_correct_pins_and_gps_in_radius(): void
    {
        $this->makeTable('A1');
        $daily = (new DailyPinService)->getOrGenerate($this->testOutlet->id);

        $resp = $this->postJson('/api/guest/verify', [
            'slug' => $this->testOutlet->slug,
            'table' => 'A1',
            'table_pin' => OutletTable::derivePin($this->testOutlet->id, 'A1'),
            'daily_pin' => $daily,
            'lat' => -6.20,
            'lng' => 106.82,
            'accuracy' => 10,
        ]);

        $resp->assertOk();
        $resp->assertJson(['ok' => true]);
        $this->assertNotEmpty($resp->json('token'));

        // token decryptable
        $payload = json_decode(Crypt::decryptString($resp->json('token')), true);
        $this->assertSame($this->testOutlet->id, $payload['outlet_id']);
        $this->assertSame('A1', $payload['table']);
    }

    public function test_verify_fails_with_wrong_table_pin(): void
    {
        $this->makeTable('A1');
        $daily = (new DailyPinService)->getOrGenerate($this->testOutlet->id);

        $resp = $this->postJson('/api/guest/verify', [
            'slug' => $this->testOutlet->slug,
            'table' => 'A1',
            'table_pin' => '0000',
            'daily_pin' => $daily,
            'lat' => -6.20,
            'lng' => 106.82,
            'accuracy' => 10,
        ]);

        $resp->assertStatus(422);
        $resp->assertJson(['ok' => false, 'reason' => 'pin_table']);
    }

    public function test_verify_fails_with_wrong_daily_pin(): void
    {
        $this->makeTable('A1');

        $resp = $this->postJson('/api/guest/verify', [
            'slug' => $this->testOutlet->slug,
            'table' => 'A1',
            'table_pin' => OutletTable::derivePin($this->testOutlet->id, 'A1'),
            'daily_pin' => '9999',
            'lat' => -6.20,
            'lng' => 106.82,
            'accuracy' => 10,
        ]);

        $resp->assertStatus(422);
        $resp->assertJson(['ok' => false, 'reason' => 'pin_daily']);
    }

    public function test_verify_fails_when_gps_outside_radius(): void
    {
        $this->makeTable('A1');
        $daily = (new DailyPinService)->getOrGenerate($this->testOutlet->id);

        // ~11km away from outlet (-6.20, 106.82)
        $resp = $this->postJson('/api/guest/verify', [
            'slug' => $this->testOutlet->slug,
            'table' => 'A1',
            'table_pin' => OutletTable::derivePin($this->testOutlet->id, 'A1'),
            'daily_pin' => $daily,
            'lat' => -6.30,
            'lng' => 106.90,
            'accuracy' => 10,
        ]);

        $resp->assertStatus(422);
        $resp->assertJson(['ok' => false, 'reason' => 'gps']);
    }

    public function test_verify_fails_when_table_not_found(): void
    {
        $daily = (new DailyPinService)->getOrGenerate($this->testOutlet->id);

        $resp = $this->postJson('/api/guest/verify', [
            'slug' => $this->testOutlet->slug,
            'table' => 'ZZ9',
            'table_pin' => '1111',
            'daily_pin' => $daily,
            'lat' => -6.20,
            'lng' => 106.82,
            'accuracy' => 10,
        ]);

        $resp->assertStatus(422);
        $resp->assertJson(['ok' => false, 'reason' => 'table_not_found']);
    }

    public function test_submit_order_requires_verify_token(): void
    {
        $resp = $this->postJson('/api/orders', [
            'table' => 'Meja A1',
            'items' => ['1x Nasi Goreng'],
        ]);
        $resp->assertStatus(422);
        $resp->assertJsonValidationErrors(['verify_token']);
    }

    public function test_submit_order_accepts_valid_token(): void
    {
        $this->makeTable('A1');
        $token = Crypt::encryptString(json_encode([
            'outlet_id' => $this->testOutlet->id,
            'table' => 'A1',
            'exp' => now()->addMinutes(15)->timestamp,
        ]));

        $resp = $this->postJson('/api/orders', [
            'table' => 'Meja A1',
            'items' => ['1x Nasi Goreng'],
            'verify_token' => $token,
        ]);

        // Token valid → BE tidak menolak dengan error validasi verify_token
        $resp->assertJsonMissingValidationErrors(['verify_token']);
    }

    public function test_guest_daily_pin_endpoint_public_and_matches_service(): void
    {
        // Endpoint publik (tanpa auth) harus return PIN harian yang sama dengan DailyPinService.
        $expected = (new DailyPinService)->getOrGenerate($this->testOutlet->id);

        $resp = $this->getJson('/api/guest/daily-pin?slug='.$this->testOutlet->slug);

        $resp->assertOk();
        $resp->assertJson(['pin' => $expected, 'outlet_id' => $this->testOutlet->id]);
    }

    public function test_guest_daily_pin_rejects_unknown_slug(): void
    {
        $resp = $this->getJson('/api/guest/daily-pin?slug=outlet-tidak-ada-xyz');

        $resp->assertNotFound();
    }
}
