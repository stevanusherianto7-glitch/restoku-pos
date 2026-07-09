<?php

namespace Tests\Feature;

use App\Models\GoogleReview;
use App\Models\Outlet;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Session;
use Tests\TestCase;

/**
 * M2 (Security Audit): menangkap regresi C1 — sync review tenant A
 * tidak boleh menghapus review tenant B (truncate() bypass scope).
 */
class GoogleReviewTruncateIsolationTest extends TestCase
{
    use RefreshDatabase;

    private User $userA;

    private User $userB;

    protected function setUp(): void
    {
        parent::setUp();

        $tenantA = Tenant::create(['name' => 'Tenant A', 'brand_name' => 'A', 'email' => 'a@test.com', 'phone' => '081']);
        $tenantB = Tenant::create(['name' => 'Tenant B', 'brand_name' => 'B', 'email' => 'b@test.com', 'phone' => '082']);

        $outletA = Outlet::create(['tenant_id' => $tenantA->id, 'name' => 'Outlet A', 'address' => 'Jl A']);
        $outletB = Outlet::create(['tenant_id' => $tenantB->id, 'name' => 'Outlet B', 'address' => 'Jl B']);

        $this->userA = User::create([
            'tenant_id' => $tenantA->id, 'outlet_id' => $outletA->id,
            'name' => 'User A', 'email' => 'user@a.com',
            'password' => bcrypt('pw'), 'role' => 'owner',
        ]);
        $this->userB = User::create([
            'tenant_id' => $tenantB->id, 'outlet_id' => $outletB->id,
            'name' => 'User B', 'email' => 'user@b.com',
            'password' => bcrypt('pw'), 'role' => 'owner',
        ]);

        // Seed review untuk KEDUA tenant
        GoogleReview::create([
            'tenant_id' => $tenantA->id, 'outlet_id' => $outletA->id,
            'google_review_id' => 'rev_A', 'reviewer_name' => 'A', 'rating' => 5, 'comment' => 'a',
            'reviewed_at' => now()->subDay(),
        ]);
        GoogleReview::create([
            'tenant_id' => $tenantB->id, 'outlet_id' => $outletB->id,
            'google_review_id' => 'rev_B', 'reviewer_name' => 'B', 'rating' => 4, 'comment' => 'b',
            'reviewed_at' => now()->subDay(),
        ]);
    }

    public function test_sync_tenant_a_does_not_delete_tenant_b_reviews(): void
    {
        // Paksa placeId agar masuk branch truncate() lama (sekarang scoped delete)
        Session::put('google_place_id', 'ChIJmVwPLWHdaC4RzzPOd0s88Qk');

        $this->actingAs($this->userA)
            ->postJson('/api/google-reviews/sync')
            ->assertStatus(200);

        // Review tenant B harus tetap utuh (bukan terhapus oleh truncate lintas-tenant)
        $this->assertDatabaseHas('google_reviews', ['google_review_id' => 'rev_B']);
        // Review tenant A dihapus & di-reseed (harusnya ada lagi)
        $this->assertDatabaseHas('google_reviews', ['tenant_id' => $this->userA->tenant_id]);
    }
}
