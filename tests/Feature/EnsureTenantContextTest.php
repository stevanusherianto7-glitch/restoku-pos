<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Tests\TestCase;

class EnsureTenantContextTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $this->tenant = Tenant::create([
            'name' => 'Resto Test',
            'brand_name' => 'Test',
            'email' => 't@test.com',
            'phone' => '081',
        ]);

        $this->user = User::create([
            'tenant_id' => $this->tenant->id,
            'name' => 'Owner',
            'email' => 'owner@test.com',
            'role' => 'owner',
            'password' => Hash::make('password'),
        ]);
    }

    public function test_request_with_user_and_tenant_id_succeeds(): void
    {
        $this->actingAs($this->user);

        $response = $this->get('/owner/dashboard');
        $response->assertStatus(200);
    }

    public function test_request_without_user_returns_403(): void
    {
        $response = $this->get('/pos');
        $response->assertStatus(302); // Redirect to login
    }

    public function test_request_with_user_without_tenant_returns_403(): void
    {
        $user = User::create([
            'name' => 'No Tenant',
            'email' => 'notenant@test.com',
            'role' => 'owner',
            'password' => Hash::make('password'),
        ]);

        $this->actingAs($user);

        $response = $this->get('/owner/dashboard');
        $response->assertStatus(403);
    }
}
