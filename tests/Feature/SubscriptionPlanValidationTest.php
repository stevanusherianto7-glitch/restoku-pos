<?php

namespace Tests\Feature;

use App\Models\Subscription;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class SubscriptionPlanValidationTest extends TestCase
{
    use RefreshDatabase;

    public function test_valid_plans_accepted(): void
    {
        $this->assertTrue(Subscription::isValidPlan('basic'));
        $this->assertTrue(Subscription::isValidPlan('pro'));
        $this->assertTrue(Subscription::isValidPlan('enterprise'));
    }

    public function test_invalid_and_null_rejected(): void
    {
        $this->assertFalse(Subscription::isValidPlan('free'));
        $this->assertFalse(Subscription::isValidPlan('premium'));
        $this->assertFalse(Subscription::isValidPlan(null));
    }

    public function test_plans_constant_matches_config(): void
    {
        $this->assertEquals(Subscription::PLANS, array_keys(config('subscription.plans')));
    }
}
