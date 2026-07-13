<?php

namespace Tests\Feature;

use App\Models\OrderArchive;
use App\Models\Outlet;
use App\Models\SalesDailyRollup;
use App\Models\Tenant;
use App\Models\User;
use App\Services\TenantContext;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class OwnerDashboardControllerTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private Outlet $outlet;

    private User $owner;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create([
            'name' => 'Resto Test',
            'brand_name' => 'Test',
            'email' => 't@test.com',
            'phone' => '081',
        ]);

        $this->outlet = Outlet::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Outlet Test',
            'address' => 'Jl. Test',
        ]);

        $this->owner = User::create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
            'name' => 'Owner',
            'email' => 'owner@test.com',
            'role' => 'owner',
            'password' => Hash::make('password'),
        ]);

        app(TenantContext::class)->setFromUser($this->owner);
    }

    public function test_owner_dashboard_returns_metrics(): void
    {
        $this->actingAs($this->owner);

        $response = $this->get('/owner/dashboard');

        $response->assertStatus(200);
    }

    public function test_sales_summary_returns_json(): void
    {
        SalesDailyRollup::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
            'date' => now()->toDateString(),
            'order_count' => 10,
            'net_revenue' => 500000,
            'gross_revenue' => 550000,
        ]);

        $this->actingAs($this->owner);

        $response = $this->getJson('/api/owner/sales-summary?days=7');

        $response->assertStatus(200);
        $response->assertJson([
            'period_days' => 7,
            'total_orders' => 10,
            'total_net' => 500000,
        ]);
    }

    public function test_sales_summary_with_outlet_filter(): void
    {
        SalesDailyRollup::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
            'date' => now()->toDateString(),
            'order_count' => 5,
            'net_revenue' => 250000,
            'gross_revenue' => 275000,
        ]);

        $this->actingAs($this->owner);

        $response = $this->getJson("/api/owner/sales-summary?days=7&outlet_id={$this->outlet->id}");

        $response->assertStatus(200);
        $response->assertJson([
            'total_orders' => 5,
            'total_net' => 250000,
        ]);
    }

    public function test_archived_orders_returns_paginated(): void
    {
        OrderArchive::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
            'order_code' => 'ARC-001',
            'status' => 'selesai',
            'total' => 50000,
        ]);

        $this->actingAs($this->owner);

        $response = $this->getJson('/api/owner/archived-orders?per_page=10');

        $response->assertStatus(200);
        $response->assertJsonFragment(['order_code' => 'ARC-001']);
    }

    public function test_archived_orders_with_outlet_filter(): void
    {
        $otherOutlet = Outlet::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Outlet Other',
            'address' => 'Jl. Other',
        ]);

        OrderArchive::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
            'order_code' => 'ARC-001',
            'status' => 'selesai',
            'total' => 50000,
        ]);

        OrderArchive::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $otherOutlet->id,
            'order_code' => 'ARC-002',
            'status' => 'selesai',
            'total' => 60000,
        ]);

        $this->actingAs($this->owner);

        $response = $this->getJson("/api/owner/archived-orders?outlet_id={$this->outlet->id}");

        $response->assertStatus(200);
        $response->assertJsonFragment(['order_code' => 'ARC-001']);
        $response->assertJsonMissing(['order_code' => 'ARC-002']);
    }

    public function test_redis_health_returns_status(): void
    {
        $this->actingAs($this->owner);

        $response = $this->getJson('/api/owner/redis-health');

        $response->assertStatus(200);
        $response->assertJsonStructure(['ok', 'driver']);
    }
}
