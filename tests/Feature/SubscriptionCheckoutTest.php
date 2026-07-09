<?php

namespace Tests\Feature;

use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Simulasi checkout subscription (Basic/Pro/Enterprise).
 * Tidak ada payment gateway — hanya buat Subscription trialing + redirect.
 */
class SubscriptionCheckoutTest extends TestCase
{
    use RefreshDatabase;

    private function makeTenantAndOwner(string $plan = 'basic'): User
    {
        $tenant = Tenant::create([
            'name' => 'T',
            'brand_name' => 'B',
            'email' => 't@x.com',
            'phone' => '081',
            'tax_type' => 'pbjt',
            'pbjt_rate' => 10.00,
            'service_charge_rate' => 5.00,
        ]);
        Subscription::create([
            'tenant_id' => $tenant->id,
            'plan' => $plan,
            'status' => 'active',
        ]);

        return User::create([
            'tenant_id' => $tenant->id,
            'name' => 'Owner',
            'email' => 'owner@x.com',
            'password' => bcrypt('password'),
            'role' => 'owner',
        ]);
    }

    public function test_valid_plan_renders_checkout_page(): void
    {
        $this->get('/subscribe/pro')
            ->assertOk()
            ->assertInertia(fn ($page) => $page
                ->component('Subscribe/Checkout')
                ->where('plan', 'pro')
                ->where('price_idr', 399000));
    }

    public function test_invalid_plan_returns_404(): void
    {
        $this->get('/subscribe/free')->assertNotFound();
        $this->get('/subscribe/')->assertNotFound();
    }

    public function test_guest_can_view_all_three_plans(): void
    {
        foreach (['basic', 'pro', 'enterprise'] as $p) {
            $this->get("/subscribe/$p")->assertOk();
        }
    }

    public function test_store_logged_in_owner_creates_trialing_subscription(): void
    {
        $owner = $this->makeTenantAndOwner('basic');
        $tenantId = $owner->tenant_id;

        $this->actingAs($owner)
            ->post('/subscribe/enterprise')
            ->assertRedirect(route('owner.dashboard'));

        $this->assertDatabaseHas('subscriptions', [
            'tenant_id' => $tenantId,
            'plan' => 'enterprise',
            'status' => 'trialing',
        ]);
        // Trial harus ~14 hari ke depan
        $sub = Subscription::where('tenant_id', $tenantId)->first();
        $this->assertNotNull($sub->trial_ends_at);
        $this->assertTrue($sub->trial_ends_at->greaterThan(now()->addDays(13)));
    }

    public function test_store_guest_saves_intended_plan_and_redirects_to_login(): void
    {
        $this->post('/subscribe/basic')
            ->assertRedirect(route('owner.login'));

        $this->assertEquals('basic', session('intended_plan'));
    }

    public function test_store_invalid_plan_404(): void
    {
        $this->post('/subscribe/bogus')->assertNotFound();
    }
}
