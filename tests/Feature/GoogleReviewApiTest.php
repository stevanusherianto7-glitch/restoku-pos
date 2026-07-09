<?php

namespace Tests\Feature;

use App\Models\GoogleReview;
use App\Models\Tenant;
use App\Models\Outlet;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

/**
 * Feature tests untuk GoogleReviewController API endpoints.
 *
 *  - GET  /api/google-reviews        (index)
 *  - POST /api/google-reviews/sync   (syncReviews, auth required)
 */
class GoogleReviewApiTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    protected function setUp(): void
    {
        parent::setUp();

        $tenant = Tenant::create([
            'name' => 'R', 'brand_name' => 'R', 'email' => 'r@t.com', 'phone' => '1',
        ]);
        $outlet = Outlet::create([
            'tenant_id' => $tenant->id, 'name' => 'O', 'address' => 'A',
        ]);
        $this->user = User::create([
            'tenant_id' => $tenant->id, 'outlet_id' => $outlet->id,
            'name' => 'U', 'email' => 'u@t.com', 'role' => 'owner', 'password' => 'x',
        ]);
    }

    public function test_index_returns_json_list(): void
    {
        GoogleReview::create([
            'tenant_id'        => $this->user->tenant_id,
            'google_review_id' => 'g1',
            'reviewer_name'    => 'Budi',
            'rating'           => 5,
            'comment'          => 'Enak',
            'reviewed_at'      => now(),
        ]);

        $response = $this->actingAs($this->user)
            ->getJson('/api/google-reviews');

        $response->assertOk()
            ->assertJsonStructure(['status', 'reviews'])
            ->assertJsonFragment(['google_review_id' => 'g1']);
    }

    public function test_sync_requires_authentication(): void
    {
        $response = $this->postJson('/api/google-reviews/sync');

        // Laravel auth middleware returns 401 with {"message":"Unauthenticated."}
        $response->assertStatus(401)
            ->assertJson(['message' => 'Unauthenticated.']);
    }

    public function test_sync_authenticated_returns_success(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/google-reviews/sync');

        // Sync seeds mock reviews -> at least one row persisted.
        $response->assertOk();
        $this->assertGreaterThanOrEqual(1, GoogleReview::count());
    }
}
