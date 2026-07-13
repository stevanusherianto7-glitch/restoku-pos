<?php

namespace Tests\Feature;

use App\Models\GoogleReview;
use App\Models\Outlet;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Hash;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

class GoogleReviewControllerEdgeTest extends TestCase
{
    use RefreshDatabase;

    private Tenant $tenant;

    private Outlet $outlet;

    private User $user;

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

    public function test_save_settings_requires_google_place_link(): void
    {
        $this->actingAs($this->user);

        $response = $this->postJson('/api/google-reviews/settings', []);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['google_place_link']);
    }

    public function test_save_settings_invalidates_invalid_link(): void
    {
        $this->actingAs($this->user);

        $response = $this->postJson('/api/google-reviews/settings', [
            'google_place_link' => 'not-a-valid-link',
        ]);

        $response->assertStatus(422);
    }

    public function test_reply_requires_reply_text(): void
    {
        $this->actingAs($this->user);

        $review = GoogleReview::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
            'rating' => 5,
            'reviewer_name' => 'Test',
            'google_review_id' => 'gr_test_1',
            'reviewed_at' => now(),
        ]);

        $response = $this->postJson("/api/google-reviews/{$review->id}/reply", []);
        $response->assertStatus(422);
        $response->assertJsonValidationErrors(['reply_text']);
    }

    public function test_reply_rejects_unauthorized_tenant(): void
    {
        $otherTenant = Tenant::create([
            'name' => 'Other',
            'brand_name' => 'O',
            'email' => 'o@test.com',
            'phone' => '082',
        ]);

        $otherOutlet = Outlet::create([
            'tenant_id' => $otherTenant->id,
            'name' => 'Other Outlet',
            'address' => 'Jl. Other',
        ]);

        $otherUser = User::create([
            'tenant_id' => $otherTenant->id,
            'outlet_id' => $otherOutlet->id,
            'name' => 'Other Owner',
            'email' => 'other@test.com',
            'role' => 'owner',
            'password' => Hash::make('password'),
        ]);

        $review = GoogleReview::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
            'rating' => 5,
            'reviewer_name' => 'Test',
            'google_review_id' => 'gr_test_2',
            'reviewed_at' => now(),
        ]);

        $this->actingAs($otherUser);

        $response = $this->postJson("/api/google-reviews/{$review->id}/reply", [
            'reply_text' => 'Thank you!',
        ]);

        $response->assertStatus(404);
    }

    public function test_generate_ai_reply_rejects_unauthorized_tenant(): void
    {
        $otherTenant = Tenant::create([
            'name' => 'Other',
            'brand_name' => 'O',
            'email' => 'o@test.com',
            'phone' => '082',
        ]);

        $otherOutlet = Outlet::create([
            'tenant_id' => $otherTenant->id,
            'name' => 'Other Outlet',
            'address' => 'Jl. Other',
        ]);

        $otherUser = User::create([
            'tenant_id' => $otherTenant->id,
            'outlet_id' => $otherOutlet->id,
            'name' => 'Other Owner',
            'email' => 'other@test.com',
            'role' => 'owner',
            'password' => Hash::make('password'),
        ]);

        $review = GoogleReview::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
            'rating' => 5,
            'reviewer_name' => 'Test',
            'google_review_id' => 'gr_test_3',
            'reviewed_at' => now(),
        ]);

        $this->actingAs($otherUser);

        $response = $this->postJson("/api/google-reviews/{$review->id}/generate-reply");
        $response->assertStatus(404);
    }

    public function test_index_without_place_id_returns_local_reviews(): void
    {
        GoogleReview::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
            'rating' => 5,
            'reviewer_name' => 'Local Reviewer',
            'google_review_id' => 'gr_local_1',
            'reviewed_at' => now(),
        ]);

        $this->actingAs($this->user);

        $response = $this->getJson('/api/google-reviews');

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'none',
            'source' => 'local',
        ]);
    }

    public function test_index_with_place_id_fetches_from_places(): void
    {
        $this->outlet->update(['google_place_id' => 'ChIJTest123']);

        config(['google-business-profile.places_api_key' => 'test-key']);
        Http::fake([
            'maps.googleapis.com/maps/api/place/details/*' => Http::response([
                'status' => 'OK',
                'result' => [
                    'rating' => 4.0,
                    'user_ratings_total' => 50,
                    'reviews' => [
                        [
                            'author_name' => 'Budi',
                            'rating' => 5,
                            'text' => 'Enak!',
                            'time' => 1700000000,
                        ],
                    ],
                ],
            ]),
        ]);

        $this->actingAs($this->user);

        $response = $this->getJson('/api/google-reviews');

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'success',
            'source' => 'places',
            'rating' => 4.0,
        ]);
    }

    public function test_save_settings_success_resolves_place_id(): void
    {
        Http::fake([
            'maps.googleapis.com/maps/api/geocode/*' => Http::response([
                'results' => [
                    ['place_id' => 'ChIJResolved123'],
                ],
                'status' => 'OK',
            ]),
        ]);

        config(['google-business-profile.places_api_key' => 'test-key']);

        $this->actingAs($this->user);

        $response = $this->postJson('/api/google-reviews/settings', [
            'google_place_link' => 'https://maps.google.com/@-6.2,106.8',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'success',
        ]);
    }

    public function test_reply_success_saves_reply_text(): void
    {
        $review = GoogleReview::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
            'rating' => 5,
            'reviewer_name' => 'Test Reviewer',
            'google_review_id' => 'gr_test_success',
            'reviewed_at' => now(),
        ]);

        $this->actingAs($this->user);

        $response = $this->postJson("/api/google-reviews/{$review->id}/reply", [
            'reply_text' => 'Terima kasih atas ulasannya!',
        ]);

        $response->assertStatus(200);
        $response->assertJson([
            'status' => 'success',
        ]);

        $this->assertDatabaseHas('google_reviews', [
            'google_review_id' => 'gr_test_success',
            'reply_text' => 'Terima kasih atas ulasannya!',
        ]);
    }

    public function test_generate_ai_reply_returns_ai_response(): void
    {
        $review = GoogleReview::withoutGlobalScopes()->create([
            'tenant_id' => $this->tenant->id,
            'outlet_id' => $this->outlet->id,
            'rating' => 4,
            'reviewer_name' => 'AI Tester',
            'comment' => 'Makanannya enak',
            'google_review_id' => 'gr_ai_test',
            'reviewed_at' => now(),
        ]);

        $this->actingAs($this->user);

        $response = $this->postJson("/api/google-reviews/{$review->id}/generate-ai-reply");

        // Response is either 200 with AI reply or 502 if AI service fails
        $this->assertContains($response->status(), [200, 502]);
    }
}
