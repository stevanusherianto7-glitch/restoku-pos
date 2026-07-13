<?php

namespace Tests\Unit;

use App\Models\Subscription;
use App\Models\Tenant;
use Carbon\Carbon;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubscriptionModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_is_valid_plan(): void
    {
        $this->assertTrue(Subscription::isValidPlan('basic'));
        $this->assertTrue(Subscription::isValidPlan('pro'));
        $this->assertTrue(Subscription::isValidPlan('enterprise'));
        $this->assertFalse(Subscription::isValidPlan('free'));
        $this->assertFalse(Subscription::isValidPlan(null));
    }

    public function test_is_active_with_active_status_no_period_end(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $sub = Subscription::create([
            'tenant_id' => $tenant->id,
            'plan' => 'pro',
            'status' => 'active',
        ]);

        $this->assertTrue($sub->isActive());
    }

    public function test_is_active_with_future_period_end(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $sub = Subscription::create([
            'tenant_id' => $tenant->id,
            'plan' => 'pro',
            'status' => 'active',
            'current_period_end' => Carbon::now()->addMonth(),
        ]);

        $this->assertTrue($sub->isActive());
    }

    public function test_is_active_with_past_period_end(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $sub = Subscription::create([
            'tenant_id' => $tenant->id,
            'plan' => 'pro',
            'status' => 'active',
            'current_period_end' => Carbon::now()->subDay(),
        ]);

        $this->assertFalse($sub->isActive());
    }

    public function test_is_active_with_expired_status(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $sub = Subscription::create([
            'tenant_id' => $tenant->id,
            'plan' => 'pro',
            'status' => 'expired',
        ]);

        $this->assertFalse($sub->isActive());
    }

    public function test_is_active_with_trialing_status(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $sub = Subscription::create([
            'tenant_id' => $tenant->id,
            'plan' => 'basic',
            'status' => 'trialing',
            'trial_ends_at' => Carbon::now()->addDays(7),
        ]);

        $this->assertTrue($sub->isActive());
    }

    public function test_is_active_with_past_due_status(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $sub = Subscription::create([
            'tenant_id' => $tenant->id,
            'plan' => 'pro',
            'status' => 'past_due',
            'current_period_end' => Carbon::now()->addDays(3),
        ]);

        $this->assertTrue($sub->isActive());
    }

    public function test_is_trialing(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $sub = Subscription::create([
            'tenant_id' => $tenant->id,
            'plan' => 'basic',
            'status' => 'trialing',
            'trial_ends_at' => Carbon::now()->addDays(5),
        ]);

        $this->assertTrue($sub->isTrialing());
    }

    public function test_is_trialing_false_when_not_trialing_status(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $sub = Subscription::create([
            'tenant_id' => $tenant->id,
            'plan' => 'pro',
            'status' => 'active',
        ]);

        $this->assertFalse($sub->isTrialing());
    }

    public function test_is_trialing_false_when_trial_expired(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $sub = Subscription::create([
            'tenant_id' => $tenant->id,
            'plan' => 'basic',
            'status' => 'trialing',
            'trial_ends_at' => Carbon::now()->subDay(),
        ]);

        $this->assertFalse($sub->isTrialing());
    }

    public function test_is_cancelled(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $sub = Subscription::create([
            'tenant_id' => $tenant->id,
            'plan' => 'pro',
            'status' => 'cancelled',
        ]);

        $this->assertTrue($sub->isCancelled());
    }

    public function test_is_expired_status_expired(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $sub = Subscription::create([
            'tenant_id' => $tenant->id,
            'plan' => 'pro',
            'status' => 'expired',
        ]);

        $this->assertTrue($sub->isExpired());
    }

    public function test_is_expired_past_period_end(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $sub = Subscription::create([
            'tenant_id' => $tenant->id,
            'plan' => 'pro',
            'status' => 'active',
            'current_period_end' => Carbon::now()->subDay(),
        ]);

        $this->assertTrue($sub->isExpired());
    }

    public function test_is_expired_not_expired_when_perpetual(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $sub = Subscription::create([
            'tenant_id' => $tenant->id,
            'plan' => 'pro',
            'status' => 'active',
        ]);

        $this->assertFalse($sub->isExpired());
    }

    public function test_days_left_in_trial(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $sub = Subscription::create([
            'tenant_id' => $tenant->id,
            'plan' => 'basic',
            'status' => 'trialing',
            'trial_ends_at' => Carbon::now()->addDays(10),
        ]);

        $this->assertGreaterThanOrEqual(9, $sub->daysLeftInTrial());
        $this->assertLessThanOrEqual(10, $sub->daysLeftInTrial());
    }

    public function test_days_left_in_trial_zero_when_not_triaing(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $sub = Subscription::create([
            'tenant_id' => $tenant->id,
            'plan' => 'pro',
            'status' => 'active',
        ]);

        $this->assertEquals(0, $sub->daysLeftInTrial());
    }

    public function test_days_left_in_period_null_when_perpetual(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $sub = Subscription::create([
            'tenant_id' => $tenant->id,
            'plan' => 'pro',
            'status' => 'active',
        ]);

        $this->assertNull($sub->daysLeftInPeriod());
    }

    public function test_days_left_in_period_returns_integer(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $sub = Subscription::create([
            'tenant_id' => $tenant->id,
            'plan' => 'pro',
            'status' => 'active',
            'current_period_end' => Carbon::now()->addDays(30),
        ]);

        $this->assertGreaterThanOrEqual(29, $sub->daysLeftInPeriod());
        $this->assertLessThanOrEqual(30, $sub->daysLeftInPeriod());
    }

    public function test_scope_active_returns_active_trials_and_past_due(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);

        Subscription::create(['tenant_id' => $tenant->id, 'plan' => 'pro', 'status' => 'active']);
        Subscription::create(['tenant_id' => $tenant->id, 'plan' => 'basic', 'status' => 'trialing', 'trial_ends_at' => Carbon::now()->addDays(5)]);
        Subscription::create(['tenant_id' => $tenant->id, 'plan' => 'pro', 'status' => 'past_due', 'current_period_end' => Carbon::now()->addDays(2)]);
        Subscription::create(['tenant_id' => $tenant->id, 'plan' => 'pro', 'status' => 'expired']);

        $active = Subscription::active()->get();
        $this->assertCount(3, $active);
    }

    public function test_scope_expired(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);

        Subscription::create(['tenant_id' => $tenant->id, 'plan' => 'pro', 'status' => 'expired']);
        Subscription::create(['tenant_id' => $tenant->id, 'plan' => 'pro', 'status' => 'active', 'current_period_end' => Carbon::now()->subDay()]);
        Subscription::create(['tenant_id' => $tenant->id, 'plan' => 'pro', 'status' => 'active']);

        $expired = Subscription::expired()->get();
        $this->assertCount(2, $expired);
    }

    public function test_scope_for_plan(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);

        Subscription::create(['tenant_id' => $tenant->id, 'plan' => 'pro', 'status' => 'active']);
        Subscription::create(['tenant_id' => $tenant->id, 'plan' => 'basic', 'status' => 'active']);

        $pro = Subscription::forPlan('pro')->get();
        $this->assertCount(1, $pro);
        $this->assertEquals('pro', $pro->first()->plan);
    }

    public function test_tenant_relation(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $sub = Subscription::create(['tenant_id' => $tenant->id, 'plan' => 'pro', 'status' => 'active']);

        $this->assertEquals($tenant->id, $sub->tenant->id);
    }
}
