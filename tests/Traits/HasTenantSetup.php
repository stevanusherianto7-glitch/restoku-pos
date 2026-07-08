<?php

namespace Tests\Traits;

use App\Models\Tenant;
use App\Models\Outlet;
use App\Models\User;
use App\Models\Subscription;
use App\Models\TenantSetting;
use App\Models\OutletSetting;

trait HasTenantSetup
{
    protected Tenant $testTenant;
    protected Outlet $testOutlet;
    protected User   $testOwner;
    protected User   $testStaff;

    /**
     * Setup standard tenant, outlet, owner, and staff with full subscriptions & settings.
     */
    protected function setupTenantEnvironment(string $plan = 'pro'): void
    {
        $this->testTenant = Tenant::create([
            'name'                => 'Test Tenant',
            'brand_name'          => 'Test Brand',
            'email'               => 'test@tenant.com',
            'phone'               => '081234567890',
            'tax_type'            => 'pbjt',
            'pbjt_rate'           => 10.00,
            'service_charge_rate' => 5.00,
        ]);

        Subscription::create([
            'tenant_id'     => $this->testTenant->id,
            'plan'          => $plan,
            'status'        => 'active',
            'trial_ends_at' => now()->addDays(14),
            'ends_at'       => now()->addYear(),
        ]);

        TenantSetting::create([
            'tenant_id'           => $this->testTenant->id,
            'tax_type'            => 'pbjt',
            'pbjt_rate'           => 10.00,
            'ppn_rate'            => 11.00,
            'service_charge_rate' => 5.00,
            'currency'            => 'IDR',
            'locale'              => 'id_ID',
        ]);

        $this->testOutlet = Outlet::withoutGlobalScopes()->create([
            'tenant_id'         => $this->testTenant->id,
            'name'              => 'Test Outlet',
            'address'           => 'Jl. Test No. 1',
            'latitude'          => -6.20,
            'longitude'         => 106.82,
            'geo_radius_meters' => 50,
        ]);

        OutletSetting::create([
            'outlet_id'         => $this->testOutlet->id,
            'tenant_id'         => $this->testTenant->id,
            'is_active'         => true,
            'operating_hours'   => [
                'mon' => ['open' => '08:00', 'close' => '22:00', 'closed' => false],
                'tue' => ['open' => '08:00', 'close' => '22:00', 'closed' => false],
                'wed' => ['open' => '08:00', 'close' => '22:00', 'closed' => false],
                'thu' => ['open' => '08:00', 'close' => '22:00', 'closed' => false],
                'fri' => ['open' => '08:00', 'close' => '22:00', 'closed' => false],
                'sat' => ['open' => '08:00', 'close' => '23:00', 'closed' => false],
                'sun' => ['open' => '08:00', 'close' => '23:00', 'closed' => false],
            ],
            'table_count'       => 20,
            'geo_radius_meters' => 50,
        ]);

        $this->testOwner = User::create([
            'tenant_id' => $this->testTenant->id,
            'name'      => 'Test Owner',
            'email'     => 'owner@tenant.com',
            'password'  => bcrypt('password'),
            'role'      => 'owner',
        ]);

        $this->testStaff = User::create([
            'tenant_id' => $this->testTenant->id,
            'outlet_id' => $this->testOutlet->id,
            'name'      => 'Test Staff',
            'email'     => 'staff@tenant.com',
            'password'  => bcrypt('password'),
            'role'      => 'cashier',
        ]);
    }
}
