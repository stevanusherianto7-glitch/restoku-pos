<?php

namespace Tests\Feature;

use App\Http\Controllers\Auth\GoogleOAuthController;
use App\Models\Outlet;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Laravel\Socialite\Contracts\User as SocialiteUser;
use Tests\TestCase;

/**
 * Google OAuth owner login — verifikasi logic resolveOrCreate TANPA credential
 * Google nyata (mock SocialiteUser). Keamanan: email null/unverified ditolak;
 * email terdaftar -> login; email baru -> auto-create tenant+outlet+owner.
 */
class GoogleOAuthTest extends TestCase
{
    use RefreshDatabase;

    private function fakeGoogle(string $email, bool $verified = true): SocialiteUser
    {
        return new class($email, $verified) implements SocialiteUser
        {
            public function __construct(private string $email, private bool $verified) {}

            public function getId(): ?string
            {
                return 'g_123';
            }

            public function getNickname(): ?string
            {
                return null;
            }

            public function getName(): ?string
            {
                return 'Budi Owner';
            }

            public function getEmail(): ?string
            {
                return $this->email;
            }

            public function getAvatar(): ?string
            {
                return null;
            }

            public function getRaw(): array
            {
                return ['email_verified' => $this->verified];
            }

            public function token(): ?string
            {
                return 'tok';
            }

            public function refreshToken(): ?string
            {
                return null;
            }

            public function expiresIn(): ?int
            {
                return 3600;
            }
        };
    }

    public function test_email_null_ditolak(): void
    {
        $ctrl = new GoogleOAuthController;
        $r = $ctrl->resolveOrCreate($this->fakeGoogle(''));
        $this->assertNull($r['user']);
        $this->assertNotNull($r['error']);
        $this->assertDatabaseCount('users', 0);
    }

    public function test_email_unverified_ditolak(): void
    {
        $ctrl = new GoogleOAuthController;
        $r = $ctrl->resolveOrCreate($this->fakeGoogle('unverified@gmail.com', false));
        $this->assertNull($r['user']);
        $this->assertNotNull($r['error']);
    }

    public function test_email_terdaftar_login(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'T', 'email' => 'ada@gmail.com']);
        $user = User::create([
            'name' => 'Existing', 'email' => 'ada@gmail.com',
            'password' => Hash::make('x'), 'tenant_id' => $tenant->id, 'role' => 'owner',
        ]);

        $ctrl = new GoogleOAuthController;
        $r = $ctrl->resolveOrCreate($this->fakeGoogle('ada@gmail.com'));
        $this->assertNull($r['error']);
        $this->assertTrue($r['user']->is($user));
        $this->assertDatabaseCount('tenants', 1); // tidak bikin tenant baru
    }

    public function test_email_baru_auto_create_tenant_outlet_owner(): void
    {
        $ctrl = new GoogleOAuthController;
        $r = $ctrl->resolveOrCreate($this->fakeGoogle('baru@gmail.com'));
        $this->assertNull($r['error']);
        $this->assertInstanceOf(User::class, $r['user']);
        $this->assertEquals('owner', $r['user']->role);
        $this->assertDatabaseHas('tenants', ['id' => $r['user']->tenant_id]);
        // Tenant boot event bikin 1 outlet default
        $this->assertDatabaseHas('outlets', ['tenant_id' => $r['user']->tenant_id]);
        $this->assertNotNull($r['user']->email_verified_at);
    }
}
