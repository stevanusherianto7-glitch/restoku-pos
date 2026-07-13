<?php

namespace Tests\Unit;

use App\Models\Tenant;
use App\Models\User;
use App\Services\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class TenantContextTest extends TestCase
{
    use RefreshDatabase;

    public function test_set_from_user_sets_tenant_id(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $user = User::create([
            'tenant_id' => $tenant->id,
            'name' => 'U',
            'email' => 'u@test.com',
            'role' => 'owner',
            'password' => Hash::make('password'),
        ]);

        $ctx = app(TenantContext::class);
        $ctx->setFromUser($user);

        $this->assertTrue($ctx->isInitialized());
        $this->assertEquals($tenant->id, $ctx->id());
    }

    public function test_set_tenant_id_sets_context(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $ctx = app(TenantContext::class);
        $ctx->setTenantId($tenant->id);

        $this->assertTrue($ctx->isInitialized());
        $this->assertEquals($tenant->id, $ctx->id());
    }

    public function test_id_throws_if_not_initialized(): void
    {
        $this->expectException(\RuntimeException::class);
        $ctx = app(TenantContext::class);
        $ctx->id();
    }

    public function test_tenant_loads_tenant_model(): void
    {
        $tenant = Tenant::create(['name' => 'Test Tenant', 'brand_name' => 'Test', 'email' => 't@test.com', 'phone' => '081']);
        $ctx = app(TenantContext::class);
        $ctx->setTenantId($tenant->id);

        $this->assertEquals('Test Tenant', $ctx->tenant()->name);
    }

    public function test_subscription_returns_default_when_none_exists(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $ctx = app(TenantContext::class);
        $ctx->setTenantId($tenant->id);

        $sub = $ctx->subscription();
        $this->assertEquals('basic', $sub->plan);
        $this->assertEquals('expired', $sub->status);
    }

    public function test_plan_returns_basic_when_no_subscription(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $ctx = app(TenantContext::class);
        $ctx->setTenantId($tenant->id);

        $this->assertEquals('basic', $ctx->plan());
    }

    public function test_has_feature_checks_plan_features(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $ctx = app(TenantContext::class);
        $ctx->setTenantId($tenant->id);

        $this->assertTrue($ctx->hasFeature('pbjt_tax'));
        $this->assertFalse($ctx->hasFeature('multi_outlet'));
    }

    public function test_is_not_trialing_when_no_subscription(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $ctx = app(TenantContext::class);
        $ctx->setTenantId($tenant->id);

        $this->assertFalse($ctx->isTrialing());
    }

    public function test_days_left_in_trial_returns_zero_when_not_trialing(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $ctx = app(TenantContext::class);
        $ctx->setTenantId($tenant->id);

        $this->assertEquals(0, $ctx->daysLeftInTrial());
    }

    public function test_days_left_in_period_returns_null_when_no_period_end(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $ctx = app(TenantContext::class);
        $ctx->setTenantId($tenant->id);

        $this->assertNull($ctx->daysLeftInPeriod());
    }

    public function test_reset_clears_context(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $ctx = app(TenantContext::class);
        $ctx->setTenantId($tenant->id);
        $this->assertTrue($ctx->isInitialized());

        $ctx->reset();
        $this->assertFalse($ctx->isInitialized());
    }
}
