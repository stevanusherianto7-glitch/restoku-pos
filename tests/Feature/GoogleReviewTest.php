<?php

namespace Tests\Feature;

use App\Models\GoogleReview;
use App\Models\Outlet;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GoogleReviewTest extends TestCase
{
    use RefreshDatabase;

    private User $userA;

    private User $userB;

    private GoogleReview $reviewA;

    private GoogleReview $reviewB;

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

        $this->reviewA = GoogleReview::withoutGlobalScopes()->create([
            'tenant_id' => $tenantA->id,
            'outlet_id' => $outletA->id,
            'google_review_id' => 'g_rev_a',
            'reviewer_name' => 'Pelanggan A',
            'rating' => 2,
            'comment' => 'Makanannya lambat datang',
            'reviewed_at' => now(),
        ]);

        $this->reviewB = GoogleReview::withoutGlobalScopes()->create([
            'tenant_id' => $tenantB->id,
            'outlet_id' => $outletB->id,
            'google_review_id' => 'g_rev_b',
            'reviewer_name' => 'Pelanggan B',
            'rating' => 1,
            'comment' => 'Pelayanan kurang memuaskan',
            'reviewed_at' => now(),
        ]);
    }

    public function test_unauthenticated_user_cannot_access_reviews_api(): void
    {
        $response = $this->getJson('/api/google-reviews');
        $response->assertStatus(401);
    }

    public function test_user_a_can_fetch_their_own_reviews(): void
    {
        $response = $this->actingAs($this->userA)->getJson('/api/google-reviews');
        $response->assertStatus(200);

        // Controller baru: pisah unreplied/replied (bukan key 'reviews').
        $unreplied = $response->json('unreplied');
        $replied = $response->json('replied');
        $all = array_merge($unreplied, $replied);
        $this->assertCount(1, $all);
        $this->assertEquals('g_rev_a', $all[0]['google_review_id']);
    }

    public function test_user_a_cannot_reply_to_review_from_tenant_b(): void
    {
        $response = $this->actingAs($this->userA)
            ->postJson("/api/google-reviews/{$this->reviewB->id}/reply", [
                'reply_text' => 'Terima kasih atas masukannya',
            ]);

        $response->assertStatus(404);
    }

    public function test_user_a_can_reply_to_their_own_review(): void
    {
        $response = $this->actingAs($this->userA)
            ->postJson("/api/google-reviews/{$this->reviewA->id}/reply", [
                'reply_text' => 'Terima kasih, kami akan perbaiki segera.',
            ]);

        $response->assertStatus(200);
        $this->assertDatabaseHas('google_reviews', [
            'id' => $this->reviewA->id,
            'reply_text' => 'Terima kasih, kami akan perbaiki segera.',
        ]);
    }
}
