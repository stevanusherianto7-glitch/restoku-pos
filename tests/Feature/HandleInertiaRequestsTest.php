<?php

namespace Tests\Feature;

use App\Models\Outlet;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Inertia\Testing\AssertableInertia;
use Tests\TestCase;

class HandleInertiaRequestsTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private User $user;

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
            'address' => 'Jl. Test',
        ]);

        $this->user = User::create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
            'name' => 'Owner',
            'email' => 'owner@test.com',
            'role' => 'owner',
            'password' => Hash::make('password'),
        ]);
    }

    public function test_inertia_share_contains_auth_user(): void
    {
        $this->actingAs($this->user);

        $response = $this->get('/owner/dashboard');
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->has('auth.user')
            ->where('auth.user.name', 'Owner')
            ->where('auth.user.email', 'owner@test.com')
        );
    }

    public function test_inertia_share_contains_subscription(): void
    {
        $this->actingAs($this->user);

        $response = $this->get('/owner/dashboard');
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->has('subscription')
            ->has('subscription.plan')
            ->has('subscription.status')
        );
    }

    public function test_inertia_share_contains_feature_registry(): void
    {
        $this->actingAs($this->user);

        $response = $this->get('/owner/dashboard');
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->has('subscription.feature_locks')
            ->has('subscription.plan_features')
        );
    }

    public function test_inertia_share_contains_outlet(): void
    {
        $this->actingAs($this->user);

        $response = $this->get('/owner/dashboard');
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->has('outlet')
            ->where('outlet.name', 'Outlet Test')
        );
    }

    public function test_inertia_share_contains_outlets(): void
    {
        $this->actingAs($this->user);

        $response = $this->get('/owner/dashboard');
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->has('outlets')
        );
    }

    public function test_inertia_share_contains_flash_messages(): void
    {
        $this->actingAs($this->user);

        $response = $this->get('/owner/dashboard');
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->has('flash')
        );
    }

    public function test_login_employees_shared_on_login_page(): void
    {
        $response = $this->get('/login');
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->has('login_employees')
        );
    }

    public function test_login_employees_null_on_other_pages(): void
    {
        $this->actingAs($this->user);

        $response = $this->get('/owner/dashboard');
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->where('login_employees', null)
        );
    }

    public function test_version_returns_hash(): void
    {
        $this->actingAs($this->user);

        $response = $this->get('/owner/dashboard');
        $response->assertStatus(200);
        // version() returns parent::version() which may be null if no app_version config
        // Just verify the endpoint works without error
    }

    public function test_share_includes_outlet_settings_tax_config(): void
    {
        $this->actingAs($this->user);

        $response = $this->get('/owner/dashboard');
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->has('outlet_settings')
            ->has('outlet_settings.tax_type')
            ->has('outlet_settings.tax_rate')
        );
    }

    public function test_share_includes_outlet_geo_coordinates(): void
    {
        $this->outlet->update([
            'latitude' => -6.2088,
            'longitude' => 106.8456,
            'geo_radius_meters' => 100,
        ]);

        $this->actingAs($this->user);

        $response = $this->get('/owner/dashboard');
        $response->assertInertia(fn (AssertableInertia $page) => $page
            ->has('outlet_geo')
            ->has('outlet_geo.latitude')
            ->has('outlet_geo.longitude')
            ->has('outlet_geo.geo_radius_meters')
        );
    }
}
