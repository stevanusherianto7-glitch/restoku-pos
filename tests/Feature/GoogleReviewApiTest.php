<?php

namespace Tests\Feature;

use App\Models\GoogleReview;
use App\Models\Outlet;
use App\Models\Tenant;
use App\Models\User;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Feature tests GoogleReviewController (alur Places API, bukan OAuth gated).
 *  - GET  /api/google-reviews            (index: real-time, prioritas belum dibalas)
 *  - POST /api/google-reviews/settings   (simpan link Maps -> resolve Place ID)
 *  - POST /api/google-reviews/{id}/generate-ai-reply (Groq wajib, semua ulasan)
 */
class GoogleReviewApiTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private Outlet $outlet;

    protected function setUp(): void
    {
        parent::setUp();

        $tenant = Tenant::create([
            'name' => 'R', 'brand_name' => 'R', 'email' => 'r@t.com', 'phone' => '1',
        ]);
        $this->outlet = Outlet::create([
            'tenant_id' => $tenant->id, 'name' => 'O', 'address' => 'A',
        ]);
        $this->user = User::create([
            'tenant_id' => $tenant->id, 'outlet_id' => $this->outlet->id,
            'name' => 'U', 'email' => 'u@t.com', 'role' => 'owner', 'password' => 'x',
        ]);
    }

    public function test_index_returns_none_when_no_place_id(): void
    {
        $response = $this->actingAs($this->user)->getJson('/api/google-reviews');

        $response->assertOk()
            ->assertJson(['status' => 'none', 'source' => 'local'])
            ->assertJsonStructure(['unreplied', 'replied']);
    }

    public function test_index_returns_unreplied_prioritized(): void
    {
        config(['google-business-profile.places_api_key' => 'test-key']);
        $this->outlet->update(['google_place_id' => 'ChIJabcUNIQ123']);

        Http::fake([
            'maps.googleapis.com/maps/api/place/details/*' => Http::response([
                'status' => 'OK',
                'result' => [
                    'rating' => 4.0,
                    'user_ratings_total' => 50,
                    'reviews' => [
                        ['author_name' => 'Budi', 'rating' => 5, 'text' => 'Enak', 'time' => 1700000000],
                        ['author_name' => 'Siti', 'rating' => 2, 'text' => 'Lambat', 'time' => 1699990000],
                    ],
                ],
            ]),
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/google-reviews');

        $response->assertOk()
            ->assertJson(['status' => 'success', 'source' => 'places', 'rating' => 4.0])
            ->assertJsonCount(2, 'unreplied'); // keduanya belum dibalas
    }

    public function test_index_marks_replied_separately(): void
    {
        config(['google-business-profile.places_api_key' => 'test-key']);
        $this->outlet->update(['google_place_id' => 'ChIJabc']);

        // Seed satu review SUDAH dibalas lokal.
        GoogleReview::create([
            'tenant_id' => $this->user->tenant_id, 'outlet_id' => $this->outlet->id,
            'google_review_id' => '1700000000', 'reviewer_name' => 'Budi', 'rating' => 5,
            'comment' => 'Enak', 'reviewed_at' => now(), 'reply_text' => 'Terima kasih!',
        ]);

        Http::fake([
            'maps.googleapis.com/maps/api/place/details/*' => Http::response([
                'status' => 'OK',
                'result' => [
                    'rating' => 5.0,
                    'user_ratings_total' => 1,
                    'reviews' => [
                        ['author_name' => 'Budi', 'rating' => 5, 'text' => 'Enak', 'time' => 1700000000],
                    ],
                ],
            ]),
        ]);

        $response = $this->actingAs($this->user)->getJson('/api/google-reviews');

        $response->assertOk()
            ->assertJsonCount(0, 'unreplied')
            ->assertJsonCount(1, 'replied');
    }

    public function test_save_settings_resolves_place_id_from_coordinate_link(): void
    {
        config(['google-business-profile.places_api_key' => 'test-key']);
        Http::fake([
            'maps.googleapis.com/maps/api/geocode/*' => Http::response([
                'status' => 'OK',
                'results' => [['place_id' => 'ChIJresolved']],
            ]),
        ]);

        $response = $this->actingAs($this->user)
            ->postJson('/api/google-reviews/settings', [
                'google_place_link' => 'https://www.google.com/maps/@-6.2,106.8,15z',
            ]);

        $response->assertOk()->assertJson(['status' => 'success', 'place_id' => 'ChIJresolved']);
        $this->assertEquals('ChIJresolved', $this->outlet->fresh()->google_place_id);
    }

    public function test_save_settings_rejects_unrecognized_link(): void
    {
        $response = $this->actingAs($this->user)
            ->postJson('/api/google-reviews/settings', [
                'google_place_link' => 'resto enak jakarta',
            ]);

        $response->assertStatus(422)
            ->assertJson(['status' => 'error']);
    }

    public function test_generate_ai_reply_uses_groq_for_arbitrary_name(): void
    {
        GoogleReview::create([
            'tenant_id' => $this->user->tenant_id, 'outlet_id' => $this->outlet->id,
            'google_review_id' => 'g1', 'reviewer_name' => 'Joko', 'rating' => 2,
            'comment' => 'nasinya keras', 'reviewed_at' => now(),
        ]);

        // Mock RestokuAiAssistant (Groq) — pastikan TIDAK ada template hardcoded "Kak Budi".
        Http::fake([
            'api.groq.com/*' => Http::response([
                'choices' => [['message' => ['content' => 'Halo Kak Joko, mohon maaf nasinya kurang matang.']]],
            ], 200),
        ]);

        $review = GoogleReview::first();
        $response = $this->actingAs($this->user)
            ->postJson("/api/google-reviews/{$review->id}/generate-ai-reply");

        $response->assertOk()
            ->assertJson(['status' => 'success'])
            ->assertJsonPath('reply', 'Halo Kak Joko, mohon maaf nasinya kurang matang.');
        // Groq benar-benar dipanggil (bukan template lokal).
        Http::assertSent(fn ($req) => str_contains((string) $req->url(), 'api.groq.com'));
    }
}
