<?php

namespace Tests\Feature;

use App\Models\GoogleReview;
use App\Models\Outlet;
use App\Models\Tenant;
use App\Models\User;
use App\Services\GoogleBusinessProfileService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * M2 (Security Audit): fetchReviewsFromPlaceId tidak boleh bocor lintas-tenant.
 * Review hasil sync tenant A tidak boleh menimpa/mengacak review tenant B.
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

        $outletA = Outlet::create(['tenant_id' => $tenantA->id, 'name' => 'Outlet A', 'address' => 'Jl A', 'google_place_id' => 'ChIJA']);
        $outletB = Outlet::create(['tenant_id' => $tenantB->id, 'name' => 'Outlet B', 'address' => 'Jl B', 'google_place_id' => 'ChIJB']);

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

        // Seed review untuk KEDUA tenant (sudah ada sebelum sync).
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
        config(['google-business-profile.places_api_key' => 'test-key']);

        Http::fake([
            'maps.googleapis.com/maps/api/place/details/*' => Http::response([
                'status' => 'OK',
                'result' => [
                    'rating' => 5.0,
                    'user_ratings_total' => 1,
                    'reviews' => [
                        ['author_name' => 'Caca', 'rating' => 5, 'text' => 'Mantap', 'time' => 1700000000],
                    ],
                ],
            ]),
        ]);

        // Sync tenant A (updateOrCreate scoped by tenant_id → tidak sentuh tenant B).
        $service = new GoogleBusinessProfileService;
        $service->fetchReviewsFromPlaceId('ChIJA', $this->userA->outlet_id, $this->userA->tenant_id);

        // Review tenant B tetap utuh (tidak terhapus/tertimpa).
        $this->assertDatabaseHas('google_reviews', ['google_review_id' => 'rev_B', 'tenant_id' => $this->userB->tenant_id]);
        // Review tenant A hasil sync ada (rev_A tetap + rev baru dari Places).
        $this->assertDatabaseHas('google_reviews', ['tenant_id' => $this->userA->tenant_id, 'source' => 'places']);
    }
}
