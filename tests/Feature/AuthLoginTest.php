<?php

namespace Tests\Feature;

use App\Models\Outlet;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

/**
 * Feature tests untuk Auth session login (staff PIN + owner email).
 *
 * Men-cover AuthenticatedSessionController:
 *  - storeStaff (PIN login, role-based redirect, wrong PIN)
 *  - storeOwner (email login, role separation, tenant requirement)
 *  - destroy (logout)
 */
class AuthLoginTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private Outlet $outlet;

    private User $manager;

    private User $owner;

    private User $kitchen;

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
        $this->manager = User::create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
            'name' => 'Mgr',
            'email' => 'mgr@test.com',
            'role' => 'manager',
            'password' => Hash::make('999999'),
        ]);
        $this->kitchen = User::create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
            'name' => 'Kok',
            'email' => 'kok@test.com',
            'role' => 'kitchen',
            'password' => Hash::make('555555'),
        ]);
        $this->owner = User::create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
            'name' => 'Own',
            'email' => 'own@test.com',
            'role' => 'owner',
            'password' => Hash::make('secret123'),
        ]);
    }

    public function test_staff_pin_login_succeeds_and_redirects_to_pos(): void
    {
        $response = $this->post('/login', [
            'pin' => '999999',
            'role' => 'manager',
            'remember' => true,
        ]);

        $response->assertRedirect('/pos');
        $this->assertAuthenticatedAs($this->manager);
    }

    public function test_kitchen_pin_login_redirects_to_kds(): void
    {
        $response = $this->post('/login', [
            'pin' => '555555',
        ]);

        $response->assertRedirect('/kds');
        $this->assertAuthenticatedAs($this->kitchen);
    }

    public function test_staff_pin_login_wrong_pin_returns_validation_error(): void
    {
        $response = $this->post('/login', [
            'pin' => '000000',
        ]);

        $response->assertInvalid(['pin']);
        $this->assertGuest();
    }

    public function test_owner_cannot_login_via_staff_pin_endpoint(): void
    {
        // Owner password is hashed; staff endpoint only matches non-owner roles.
        $response = $this->post('/login', [
            'pin' => 'secret123',
        ]);

        $response->assertInvalid(['pin']);
        $this->assertGuest();
    }

    public function test_owner_email_login_succeeds_and_redirects_to_dashboard(): void
    {
        $response = $this->post('/owner/login', [
            'email' => 'own@test.com',
            'password' => 'secret123',
        ]);

        $response->assertRedirect('/owner/dashboard');
        $this->assertAuthenticatedAs($this->owner);
    }

    public function test_owner_login_wrong_password_fails(): void
    {
        $response = $this->post('/owner/login', [
            'email' => 'own@test.com',
            'password' => 'wrong',
        ]);

        $response->assertInvalid(['email']);
        $this->assertGuest();
    }

    public function test_staff_cannot_login_via_owner_endpoint(): void
    {
        $response = $this->post('/owner/login', [
            'email' => 'mgr@test.com',
            'password' => '999999',
        ]);

        $response->assertInvalid(['email']);
        $this->assertGuest();
    }

    public function test_logout_redirects_to_login(): void
    {
        $this->actingAs($this->manager);
        $response = $this->post('/logout');

        $response->assertRedirect('/login');
        $this->assertGuest();
    }

    public function test_waiter_pin_login_redirects_to_waiter_bar(): void
    {
        $waiter = User::create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
            'name' => 'Wtr',
            'email' => 'wtr@test.com',
            'role' => 'waiter',
            'password' => Hash::make('123456'),
        ]);

        $response = $this->post('/login', [
            'pin' => '123456',
        ]);

        $response->assertRedirect('/waiter-bar');
        $this->assertAuthenticatedAs($waiter);
    }

    public function test_owner_login_without_intended_plan_does_not_create_trial(): void
    {
        $response = $this->post('/owner/login', [
            'email' => 'own@test.com',
            'password' => 'secret123',
        ]);

        $response->assertRedirect('/owner/dashboard');
        $this->assertDatabaseMissing('subscriptions', [
            'tenant_id' => $this->tenant->id,
            'plan' => 'basic',
            'status' => 'trialing',
        ]);
    }
}
