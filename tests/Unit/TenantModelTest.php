<?php

namespace Tests\Unit;

use App\Models\Outlet;
use App\Models\Subscription;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class TenantModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_created_event_creates_default_outlet(): void
    {
        $tenant = Tenant::create([
            'name' => 'Resto Baru',
            'brand_name' => 'Baru',
            'email' => 'baru@test.com',
            'phone' => '08123',
        ]);

        $this->assertNotNull($tenant->outlets);
        $this->assertCount(1, $tenant->outlets);
        $this->assertEquals('Baru', $tenant->outlets->first()->name);
    }

    public function test_outlets_relation(): void
    {
        $tenant = Tenant::create([
            'name' => 'Resto',
            'brand_name' => 'R',
            'email' => 'r@test.com',
            'phone' => '081',
        ]);

        Outlet::create([
            'tenant_id' => $tenant->id,
            'name' => 'Outlet 1',
            'address' => 'Jl. Test',
        ]);

        $this->assertGreaterThanOrEqual(1, $tenant->outlets->count());
    }

    public function test_users_relation(): void
    {
        $tenant = Tenant::create([
            'name' => 'Resto',
            'brand_name' => 'R',
            'email' => 'r@test.com',
            'phone' => '081',
        ]);

        User::create([
            'tenant_id' => $tenant->id,
            'name' => 'Owner',
            'email' => 'owner@test.com',
            'role' => 'owner',
            'password' => bcrypt('password'),
        ]);

        $this->assertCount(1, $tenant->users);
    }

    public function test_subscription_relation(): void
    {
        $tenant = Tenant::create([
            'name' => 'Resto',
            'brand_name' => 'R',
            'email' => 'r@test.com',
            'phone' => '081',
        ]);

        $this->assertNull($tenant->subscription);
    }

    public function test_subscriptions_relation(): void
    {
        $tenant = Tenant::create([
            'name' => 'Resto',
            'brand_name' => 'R',
            'email' => 'r@test.com',
            'phone' => '081',
        ]);

        $this->assertNotNull($tenant->subscriptions);
    }

    public function test_settings_relation(): void
    {
        $tenant = Tenant::create([
            'name' => 'Resto',
            'brand_name' => 'R',
            'email' => 'r@test.com',
            'phone' => '081',
        ]);

        $this->assertNull($tenant->settings);
    }

    public function test_plan_attribute_returns_basic_when_no_subscription(): void
    {
        $tenant = Tenant::create([
            'name' => 'Resto',
            'brand_name' => 'R',
            'email' => 'r@test.com',
            'phone' => '081',
        ]);

        $this->assertEquals('basic', $tenant->plan);
    }

    public function test_plan_attribute_returns_plan_from_subscription(): void
    {
        $tenant = Tenant::create([
            'name' => 'Resto',
            'brand_name' => 'R',
            'email' => 'r@test.com',
            'phone' => '081',
        ]);

        Subscription::create([
            'tenant_id' => $tenant->id,
            'plan' => 'pro',
            'status' => 'active',
        ]);

        $this->assertEquals('pro', $tenant->fresh()->plan);
    }

    public function test_settings_json_cast(): void
    {
        $tenant = Tenant::create([
            'name' => 'Resto',
            'brand_name' => 'R',
            'email' => 'r@test.com',
            'phone' => '081',
            'settings' => ['key' => 'value'],
        ]);

        $this->assertIsArray($tenant->settings);
        $this->assertEquals('value', $tenant->settings['key']);
    }
}
