<?php

namespace Tests\Feature;

use App\Models\Outlet;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Facades\Socialite;
use Mockery;
use Symfony\Component\HttpFoundation\RedirectResponse;
use Tests\TestCase;

class OAuthControllerRedirectTest extends TestCase
{
    use RefreshDatabase;

    public function test_redirect_returns_google_oauth_url(): void
    {
        $mockRedirectResponse = new RedirectResponse('https://accounts.google.com/o/oauth2/auth?client_id=test');

        Socialite::shouldReceive('driver->redirect')->once()->andReturn($mockRedirectResponse);

        $response = $this->get('/oauth/google');

        $this->assertEquals(302, $response->getStatusCode());
    }

    public function test_callback_handles_google_error(): void
    {
        $response = $this->get('/oauth/google/callback?error=access_denied');

        $response->assertRedirect('/owner/login');
        $response->assertSessionHas('error');
    }

    public function test_callback_rejects_unverified_email(): void
    {
        $mockUser = Mockery::mock();
        $mockUser->shouldReceive('getEmail')->andReturn(null);
        $mockUser->shouldReceive('getRaw')->andReturn(['email_verified' => false]);
        $mockUser->shouldReceive('getId')->andReturn('123');
        $mockUser->shouldReceive('getAvatar')->andReturn(null);

        Socialite::shouldReceive('driver->user')->once()->andReturn($mockUser);

        $response = $this->get('/oauth/google/callback');

        $response->assertStatus(403);
    }

    public function test_callback_rejects_non_owner_user(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'T', 'email' => 't@t.com', 'phone' => '1']);
        $outlet = Outlet::create(['tenant_id' => $tenant->id, 'name' => 'O', 'address' => 'a']);

        User::create([
            'tenant_id' => $tenant->id,
            'outlet_id' => $outlet->id,
            'email' => 'staff@test.com',
            'name' => 'Staff',
            'role' => 'cashier',
            'password' => Hash::make('password'),
        ]);

        $mockUser = Mockery::mock();
        $mockUser->shouldReceive('getEmail')->andReturn('staff@test.com');
        $mockUser->shouldReceive('getRaw')->andReturn(['email_verified' => true]);
        $mockUser->shouldReceive('getId')->andReturn('456');
        $mockUser->shouldReceive('getAvatar')->andReturn(null);

        Socialite::shouldReceive('driver->user')->once()->andReturn($mockUser);

        $response = $this->get('/oauth/google/callback');

        $response->assertStatus(403);
    }

    public function test_callback_redirects_unknown_email_to_subscribe(): void
    {
        $mockUser = Mockery::mock();
        $mockUser->shouldReceive('getEmail')->andReturn('unknown@gmail.com');
        $mockUser->shouldReceive('getRaw')->andReturn(['email_verified' => true]);
        $mockUser->shouldReceive('getId')->andReturn('789');
        $mockUser->shouldReceive('getAvatar')->andReturn(null);

        Socialite::shouldReceive('driver->user')->once()->andReturn($mockUser);

        $response = $this->get('/oauth/google/callback');

        $response->assertRedirect('/subscribe/basic');
    }
}
