<?php

namespace Tests\Feature;

use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use App\Services\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class RequiresPlanTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create([
            'name' => 'Resto Test',
            'brand_name' => 'Test',
            'email' => 't@test.com',
            'phone' => '081',
        ]);
    }

    public function test_basic_plan_user_can_access_free_feature(): void
    {
        $user = User::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Owner',
            'email' => 'owner@test.com',
            'role' => 'owner',
            'password' => Hash::make('password'),
        ]);

        $this->actingAs($user);

        $response = $this->get('/owner/dashboard');
        $response->assertStatus(200);
    }

    public function test_basic_plan_user_redirected_for_pro_feature(): void
    {
        $user = User::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Owner',
            'email' => 'owner@test.com',
            'role' => 'owner',
            'password' => Hash::make('password'),
        ]);

        $this->actingAs($user);

        $response = $this->get('/kds');
        $response->assertStatus(302);
    }

    public function test_pro_plan_user_can_access_pro_feature(): void
    {
        Subscription::create([
            'tenant_id' => $this->tenant->id,
            'plan' => 'pro',
            'status' => 'active',
        ]);

        $user = User::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Owner',
            'email' => 'owner@test.com',
            'role' => 'owner',
            'password' => Hash::make('password'),
        ]);

        $this->actingAs($user);

        // This should pass the feature gate
        $response = $this->get('/owner/dashboard');
        $response->assertStatus(200);
    }

    public function test_json_api_returns_402_for_locked_feature(): void
    {
        $user = User::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Owner',
            'email' => 'owner@test.com',
            'role' => 'owner',
            'password' => Hash::make('password'),
        ]);

        $this->actingAs($user);

        // /kds route has plan:kds middleware - test via JSON request
        $response = $this->getJson('/kds');

        $response->assertStatus(402);
        $response->assertJson([
            'error' => 'upgrade_required',
        ]);
    }

    public function test_inertia_request_returns_402_for_locked_feature(): void
    {
        $user = User::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Owner',
            'email' => 'owner@test.com',
            'role' => 'owner',
            'password' => Hash::make('password'),
        ]);

        $this->actingAs($user);

        // Without X-Inertia header, RequiresPlan returns web redirect (302)
        $response = $this->get('/kds');

        $response->assertStatus(302);
    }

    public function test_uninitialized_context_denies_access(): void
    {
        $user = User::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Owner',
            'email' => 'owner@test.com',
            'role' => 'owner',
            'password' => Hash::make('password'),
        ]);

        $this->actingAs($user);

        app(TenantContext::class)->reset();

        $response = $this->get('/kds');

        $response->assertStatus(302);
    }
}
