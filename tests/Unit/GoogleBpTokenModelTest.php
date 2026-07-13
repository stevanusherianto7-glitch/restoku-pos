<?php

namespace Tests\Unit;

use App\Models\GoogleBpToken;
use App\Models\Tenant;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GoogleBpTokenModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_is_expired_returns_true_when_no_expires_at(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $token = GoogleBpToken::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'access_token' => 'test_token',
            'refresh_token' => 'test_refresh',
        ]);

        $this->assertTrue($token->isExpired());
    }

    public function test_is_expired_returns_true_when_past(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $token = GoogleBpToken::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'access_token' => 'test_token',
            'refresh_token' => 'test_refresh',
            'expires_at' => Carbon::now()->subHour(),
        ]);

        $this->assertTrue($token->isExpired());
    }

    public function test_is_expired_returns_false_when_future(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $token = GoogleBpToken::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'access_token' => 'test_token',
            'refresh_token' => 'test_refresh',
            'expires_at' => Carbon::now()->addHour(),
        ]);

        $this->assertFalse($token->isExpired());
    }

    public function test_is_expired_returns_true_within_5min_buffer(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $token = GoogleBpToken::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'access_token' => 'test_token',
            'refresh_token' => 'test_refresh',
            'expires_at' => Carbon::now()->addMinutes(3),
        ]);

        $this->assertTrue($token->isExpired());
    }

    public function test_tenant_relation(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $token = GoogleBpToken::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'access_token' => 'test_token',
            'refresh_token' => 'test_refresh',
        ]);

        $this->assertEquals($tenant->id, $token->tenant->id);
    }
}
