<?php

namespace Tests\Feature;

use App\Ai\Agents\RestokuAiAssistant;
use App\Models\Outlet;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\Hash;
use Laravel\Ai\Ai;
use Laravel\Ai\Responses\Data\Meta;
use Laravel\Ai\Responses\Data\Usage;
use Laravel\Ai\Responses\TextResponse;
use Tests\TestCase;

/**
 * S-17 — GeminiAiController fallback TANPA mutate global config(['ai.default'=>...]).
 * Per-call provider dipakai (prompt($prompt, [], 'gemini')) sehingga tidak ada
 * race-condition state global antar tenant/request.
 *
 * Deterministik via Ai::fake() (FakeTextGateway) — tanpa network.
 */
class GeminiAiControllerS17Test extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create(['name' => 'Resto', 'brand_name' => 'R', 'email' => 't@test.com', 'phone' => '081']);
        $outlet = Outlet::create(['tenant_id' => $this->tenant->id, 'name' => 'O', 'address' => 'Jl. Test']);
        $this->user = User::create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $outlet->id,
            'name' => 'Owner',
            'email' => 'owner@test.com',
            'role' => 'owner',
            'password' => Hash::make('password'),
        ]);

        // Fake agent: primary call throws (force fallback), fallback call returns reply.
        // Closure STATEFUL (counter) — fake gateway tidak advance index saat
        // response resolver THROW, jadi kita pakai counter eksternal agar
        // pemanggilan ke-2 mengembalikan TextResponse.
        $calls = 0;
        RestokuAiAssistant::fake(function () use (&$calls) {
            $calls++;
            if ($calls === 1) {
                throw new \RuntimeException('primary down');
            }

            return new TextResponse(
                'Gemini fallback reply',
                new Usage,
                new Meta('gemini', 'gemini-2.0-flash')
            );
        });
    }

    public function test_fallback_returns_reply_without_mutating_global_config(): void
    {
        $originalDefault = Config::get('ai.default');

        $response = $this->actingAs($this->user)
            ->postJson('/api/ai/chat', ['message' => 'Halo']);

        $response->assertStatus(200)
            ->assertJson(['status' => 'success', 'reply' => 'Gemini fallback reply']);

        // S-17 ASSERT: config global TIDAK berubah (tidak ada race-condition).
        $this->assertEquals($originalDefault, Config::get('ai.default'));
    }

    public function test_fallback_does_not_throw_when_primary_fails(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/ai/chat', ['message' => '1+1?']);

        // Tidak 500 — fallback berhasil.
        $response->assertStatus(200);
        $response->assertJsonMissing(['status' => 'error']);
    }
}
