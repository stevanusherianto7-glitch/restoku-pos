<?php

namespace Tests\Unit;

use App\Models\GoogleReview;
use App\Models\Outlet;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Tests\TestCase;

class GoogleReviewModelTest extends TestCase
{
    use RefreshDatabase;

    public function test_creating_sets_tenant_id_from_auth(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $outlet = Outlet::create(['tenant_id' => $tenant->id, 'name' => 'Outlet', 'address' => 'Jl. Test']);
        $user = User::create([
            'tenant_id' => $tenant->id,
            'outlet_id' => $outlet->id,
            'name' => 'Owner',
            'email' => 'owner@test.com',
            'role' => 'owner',
            'password' => bcrypt('password'),
        ]);

        $this->actingAs($user);

        $review = GoogleReview::create([
            'outlet_id' => $outlet->id,
            'rating' => 5,
            'reviewer_name' => 'John',
            'comment' => 'Great food!',
            'google_review_id' => 'gr_001',
            'reviewed_at' => now(),
        ]);

        $this->assertEquals($tenant->id, $review->tenant_id);
    }

    public function test_tenant_relation(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $outlet = Outlet::create(['tenant_id' => $tenant->id, 'name' => 'Outlet', 'address' => 'Jl. Test']);
        $review = GoogleReview::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'outlet_id' => $outlet->id,
            'rating' => 4,
            'reviewer_name' => 'Jane',
            'google_review_id' => 'gr_002',
            'reviewed_at' => now(),
        ]);

        $this->assertEquals($tenant->id, $review->tenant->id);
    }

    public function test_outlet_relation(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $outlet = Outlet::create(['tenant_id' => $tenant->id, 'name' => 'Outlet', 'address' => 'Jl. Test']);
        $review = GoogleReview::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'outlet_id' => $outlet->id,
            'rating' => 3,
            'reviewer_name' => 'Bob',
            'google_review_id' => 'gr_003',
            'reviewed_at' => now(),
        ]);

        $this->assertEquals($outlet->id, $review->outlet->id);
    }

    public function test_rating_cast(): void
    {
        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'B', 'email' => 't@test.com', 'phone' => '081']);
        $outlet = Outlet::create(['tenant_id' => $tenant->id, 'name' => 'Outlet', 'address' => 'Jl. Test']);
        $review = GoogleReview::withoutGlobalScopes()->create([
            'tenant_id' => $tenant->id,
            'outlet_id' => $outlet->id,
            'rating' => 5,
            'reviewer_name' => 'Test',
            'google_review_id' => 'gr_004',
            'reviewed_at' => now(),
        ]);

        $this->assertIsInt($review->rating);
        $this->assertEquals(5, $review->rating);
    }
}
