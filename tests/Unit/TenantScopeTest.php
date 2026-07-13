<?php

namespace Tests\Unit;

use App\Models\Scopes\TenantScope;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\App;
use Tests\TestCase;

class TenantScopeTest extends TestCase
{
    use RefreshDatabase;

    public function test_scope_filters_by_tenant_id_when_bound(): void
    {
        $tenant1 = Tenant::create(['name' => 'T1', 'brand_name' => 'B1', 'email' => 't1@test.com', 'phone' => '081']);
        $tenant2 = Tenant::create(['name' => 'T2', 'brand_name' => 'B2', 'email' => 't2@test.com', 'phone' => '082']);

        $user1 = User::create([
            'tenant_id' => $tenant1->id,
            'name' => 'User 1',
            'email' => 'u1@test.com',
            'role' => 'owner',
            'password' => bcrypt('password'),
        ]);

        $user2 = User::create([
            'tenant_id' => $tenant2->id,
            'name' => 'User 2',
            'email' => 'u2@test.com',
            'role' => 'owner',
            'password' => bcrypt('password'),
        ]);

        App::bind('tenant.id', fn () => $tenant1->id);

        $users = User::all();
        $this->assertCount(1, $users);
        $this->assertEquals($user1->id, $users->first()->id);

        App::offsetUnset('tenant.id');
    }

    public function test_scope_does_not_filter_when_no_binding(): void
    {
        $tenant1 = Tenant::create(['name' => 'T1', 'brand_name' => 'B1', 'email' => 't1@test.com', 'phone' => '081']);
        $tenant2 = Tenant::create(['name' => 'T2', 'brand_name' => 'B2', 'email' => 't2@test.com', 'phone' => '082']);

        User::create([
            'tenant_id' => $tenant1->id,
            'name' => 'User 1',
            'email' => 'u1@test.com',
            'role' => 'owner',
            'password' => bcrypt('password'),
        ]);

        User::create([
            'tenant_id' => $tenant2->id,
            'name' => 'User 2',
            'email' => 'u2@test.com',
            'role' => 'owner',
            'password' => bcrypt('password'),
        ]);

        $users = User::all();
        $this->assertCount(2, $users);
    }

    public function test_bypass_restores_binding(): void
    {
        $tenant = Tenant::create(['name' => 'T1', 'brand_name' => 'B1', 'email' => 't1@test.com', 'phone' => '081']);
        App::bind('tenant.id', fn () => $tenant->id);

        TenantScope::bypass(function () {
            $all = User::all();
            $this->assertCount(0, $all); // No users in test DB
        });

        // Binding should be restored
        $this->assertEquals($tenant->id, App('tenant.id'));

        App::offsetUnset('tenant.id');
    }

    public function test_bypass_works_without_existing_binding(): void
    {
        TenantScope::bypass(function () {
            $all = User::all();
            $this->assertCount(0, $all);
        });

        $this->assertFalse(App()->bound('tenant.id'));
    }
}
