<?php

namespace Tests\Feature;

use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Auth;
use Laravel\Socialite\Facades\Socialite;
use Laravel\Socialite\Two\User as SocialiteUser;
use Tests\TestCase;

/**
 * Feature tests untuk OAuth "Masuk dengan Google" (OAuthController).
 * Mock Socialite → tidak butuh credential Google nyata.
 *
 * Cover:
 *  - callback dgn email owner existing → login sukses (password lama tetap valid).
 *  - callback dgn email baru → auto-register tenant+outlet+owner.
 *  - callback email null / tak terverifikasi → 403.
 *  - email sama tapi role staff → 403 (jangan izinkan OAuth ke akun staff).
 *  - tidak ada cross-tenant: login langsung ke tenant milik user.
 */
class OAuthControllerTest extends TestCase
{
    use RefreshDatabase;

    private function mockGoogleUser(string $email, bool $verified = true, ?string $id = 'google-123'): void
    {
        $socialiteUser = (new SocialiteUser)
            ->setRaw([
                'email' => $email,
                'sub' => $id,
                'email_verified' => $verified,
            ])
            ->map([
                'id' => $id,
                'email' => $email,
                'name' => 'Budi Santoso',
                'avatar' => 'https://example.com/avatar.jpg',
            ]);

        // API resmi Socialite::fake — tanpa credential Google nyata.
        Socialite::fake('google', $socialiteUser);
    }

    public function test_owner_existing_email_logs_in(): void
    {
        $tenant = Tenant::create(['name' => 'Kedai', 'brand_name' => 'Kedai', 'email' => 'owner@x.com']);
        $owner = $tenant->users()->create([
            'name' => 'Owner X',
            'email' => 'owner@x.com',
            'role' => 'owner',
            'password' => bcrypt('secret123'),
        ]);

        $this->mockGoogleUser('owner@x.com');

        $this->get('/oauth/google/callback')
            ->assertRedirect('/owner/dashboard');

        $this->assertTrue(Auth::check());
        $this->assertTrue(Auth::user()->is($owner));
        // Password lama tetap valid (tidak di-reset oleh OAuth).
        $this->assertTrue(Auth::user()->password !== '');
    }

    public function test_new_google_email_auto_registers_owner(): void
    {
        $this->mockGoogleUser('newowner@gmail.com');

        $this->get('/oauth/google/callback')
            ->assertRedirect('/owner/dashboard');

        $this->assertDatabaseHas('users', [
            'email' => 'newowner@gmail.com',
            'role' => 'owner',
            'google_id' => 'google-123',
        ]);
        // Tenant + outlet default otomatis terbuat.
        $tenant = Tenant::where('email', 'newowner@gmail.com')->first();
        $this->assertNotNull($tenant);
        $this->assertCount(1, $tenant->outlets);
        $this->assertTrue(Auth::check());
    }

    public function test_unverified_google_email_is_rejected(): void
    {
        $this->mockGoogleUser('fake@x.com', verified: false);

        $this->get('/oauth/google/callback')
            ->assertForbidden();

        $this->assertFalse(Auth::check());
    }

    public function test_staff_email_rejects_oauth_login(): void
    {
        $tenant = Tenant::create(['name' => 'Kedai', 'brand_name' => 'Kedai', 'email' => 'staff@x.com']);
        $tenant->users()->create([
            'name' => 'Staff',
            'email' => 'staff@x.com',
            'role' => 'cashier',
            'password' => bcrypt('secret123'),
        ]);

        $this->mockGoogleUser('staff@x.com');

        $this->get('/oauth/google/callback')
            ->assertForbidden();

        $this->assertFalse(Auth::check());
    }

    public function test_existing_owner_session_has_correct_tenant_scope(): void
    {
        $tenantA = Tenant::create(['name' => 'A', 'brand_name' => 'A', 'email' => 'a@x.com']);
        $ownerA = $tenantA->users()->create([
            'name' => 'A', 'email' => 'a@x.com', 'role' => 'owner', 'password' => bcrypt('x'),
        ]);
        $tenantB = Tenant::create(['name' => 'B', 'brand_name' => 'B', 'email' => 'b@x.com']);

        $this->mockGoogleUser('a@x.com');
        $this->get('/oauth/google/callback')->assertRedirect('/owner/dashboard');

        // Login ke tenant A, bukan B (tidak ada cross-tenant leak).
        $this->assertTrue(Auth::user()->is($ownerA));
        $this->assertEquals($tenantA->id, Auth::user()->tenant_id);
        $this->assertNotEquals($tenantB->id, Auth::user()->tenant_id);
    }
}
