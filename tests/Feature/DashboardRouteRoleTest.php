<?php

namespace Tests\Feature;

use App\Models\Outlet;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Route /dashboard harus role-aware:
 *  - owner   -> Inertia render Dashboard/Index (Owner Dashboard)
 *  - manager -> redirect /laporan-penjualan
 *  - kasir   -> redirect /pos
 *  - waiter  -> redirect /waiter-bar
 *  - kitchen -> redirect /kds
 *  - guest   -> redirect /login
 *
 * Mencegah staff (manager/kasir/waiter/kitchen) melihat Owner Dashboard
 * konsolidasi multi-outlet (100 cabang).
 */
class DashboardRouteRoleTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private Outlet $outlet;

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
            'slug' => 'outlet-test',
        ]);
    }

    public function test_owner_sees_owner_dashboard(): void
    {
        $owner = User::create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
            'name' => 'Owner',
            'email' => 'owner@test.com',
            'password' => bcrypt('pw'),
            'role' => 'owner',
        ]);

        $this->actingAs($owner)
            ->get('/dashboard')
            ->assertOk()
            ->assertInertia(fn ($page) => $page->component('Dashboard/Index'));
    }

    public function test_manager_redirects_to_laporan_penjualan(): void
    {
        $manager = User::create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
            'name' => 'Manager',
            'email' => 'mgr@test.com',
            'password' => bcrypt('pw'),
            'role' => 'manager',
        ]);

        $this->actingAs($manager)
            ->get('/dashboard')
            ->assertRedirect('/laporan-penjualan');
    }

    public function test_kasir_redirects_to_pos(): void
    {
        $kasir = User::create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
            'name' => 'Kasir',
            'email' => 'kasir@test.com',
            'password' => bcrypt('pw'),
            'role' => 'kasir',
        ]);

        $this->actingAs($kasir)
            ->get('/dashboard')
            ->assertRedirect('/pos');
    }

    public function test_cashier_db_role_redirects_to_pos(): void
    {
        // Seeder DB memakai 'cashier' (bukan 'kasir'). Pastikan tetap -> /pos.
        $cashier = User::create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
            'name' => 'Cashier',
            'email' => 'cashier@test.com',
            'password' => bcrypt('pw'),
            'role' => 'cashier',
        ]);

        $this->actingAs($cashier)
            ->get('/dashboard')
            ->assertRedirect('/pos');
    }

    public function test_waiter_redirects_to_waiter_bar(): void
    {
        $waiter = User::create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
            'name' => 'Waiter',
            'email' => 'waiter@test.com',
            'password' => bcrypt('pw'),
            'role' => 'waiter',
        ]);

        $this->actingAs($waiter)
            ->get('/dashboard')
            ->assertRedirect('/waiter-bar');
    }

    public function test_kitchen_redirects_to_kds(): void
    {
        $kitchen = User::create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
            'name' => 'Kitchen',
            'email' => 'kitchen@test.com',
            'password' => bcrypt('pw'),
            'role' => 'kitchen',
        ]);

        $this->actingAs($kitchen)
            ->get('/dashboard')
            ->assertRedirect('/kds');
    }

    public function test_guest_redirects_to_login(): void
    {
        $this->get('/dashboard')->assertRedirect('/login');
    }
}
