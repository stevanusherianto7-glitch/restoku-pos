<?php

namespace Tests\Feature;

use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;
use Tests\Traits\HasTenantSetup;

class SubscriptionFeatureGateTest extends TestCase
{
    use RefreshDatabase, HasTenantSetup;

    public function test_basic_plan_cannot_access_pro_feature(): void
    {
        $this->setupTenantEnvironment('basic');

        // Web request -> redirects to dashboard
        $response = $this->actingAs($this->testOwner)->get('/perbandingan-outlet');
        $response->assertRedirect('/dashboard');
        $response->assertSessionHas('error');

        // JSON API request -> returns 402 UpgradeRequired
        $jsonResponse = $this->actingAs($this->testOwner)->getJson('/perbandingan-outlet');
        $jsonResponse->assertStatus(402);
        $jsonResponse->assertJson([
            'error'         => 'upgrade_required',
            'current_plan'  => 'basic',
            'required_plan' => 'pro',
        ]);
    }

    public function test_pro_plan_can_access_pro_feature(): void
    {
        $this->setupTenantEnvironment('pro');

        $response = $this->actingAs($this->testOwner)->get('/perbandingan-outlet');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('PerbandinganOutlet/Index')
        );
    }

    public function test_pro_plan_cannot_access_enterprise_feature(): void
    {
        $this->setupTenantEnvironment('pro');

        $response = $this->actingAs($this->testOwner)->get('/kds');
        $response->assertRedirect('/dashboard');

        $jsonResponse = $this->actingAs($this->testOwner)->getJson('/kds');
        $jsonResponse->assertStatus(402);
        $jsonResponse->assertJson([
            'error'         => 'upgrade_required',
            'current_plan'  => 'pro',
            'required_plan' => 'enterprise',
        ]);
    }

    public function test_enterprise_plan_can_access_enterprise_feature(): void
    {
        $this->setupTenantEnvironment('enterprise');

        $response = $this->actingAs($this->testOwner)->get('/kds');
        $response->assertStatus(200);
        $response->assertInertia(fn ($page) =>
            $page->component('KDS/Index')
        );
    }
}
