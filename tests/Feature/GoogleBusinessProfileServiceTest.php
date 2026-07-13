<?php

namespace Tests\Feature;

use App\Models\GoogleBpToken;
use App\Models\GoogleReview;
use App\Models\Outlet;
use App\Models\Tenant;
use App\Models\User;
use App\Services\GoogleBusinessProfileService;
use Illuminate\Foundation\Testing\RefreshDatabase;
use Illuminate\Support\Facades\Http;
use Tests\TestCase;

/**
 * Bukti integrasi Google Business Profile sungguhan (tanpa konek ke Google nyata).
 * Semua HTTP di-fake via Http::fake — membuktikan service memanggil endpoint benar,
 * normalisasi response, dedupe by google_review_id, dan post reply.
 */
class GoogleBusinessProfileServiceTest extends TestCase
{
    use RefreshDatabase;

    private User $user;

    private GoogleBpToken $token;

    protected function setUp(): void
    {
        parent::setUp();

        $tenant = Tenant::create(['name' => 'T', 'brand_name' => 'T', 'email' => 't@t.com', 'phone' => '1']);
        $outlet = Outlet::create(['tenant_id' => $tenant->id, 'name' => 'O', 'address' => 'Jl']);
        $this->user = User::create([
            'tenant_id' => $tenant->id, 'outlet_id' => $outlet->id,
            'name' => 'U', 'email' => 'u@t.com', 'password' => bcrypt('x'), 'role' => 'owner',
        ]);
        $this->token = GoogleBpToken::create([
            'tenant_id' => $tenant->id,
            'access_token' => 'enc_dummy',
            'refresh_token' => 'enc_refresh',
            'expires_at' => now()->addHour(),
            'location_id' => '123',
        ]);
    }

    public function test_fetch_reviews_calls_bp_api_and_upserts(): void
    {
        Http::fake([
            'mybusinessaccountmanagement.googleapis.com/*' => Http::response(['accounts' => [['name' => 'accounts/999']]]),
            'businessprofile.googleapis.com/*' => Http::response([
                'reviews' => [
                    [
                        'reviewId' => 'r1',
                        'reviewer' => ['displayName' => 'Budi', 'profilePhotoUrl' => 'http://x/y.jpg'],
                        'starRating' => 'FIVE',
                        'comment' => 'Enak',
                        'createTime' => now()->toRfc3339String(),
                    ],
                    [
                        'reviewId' => 'r2',
                        'reviewer' => ['displayName' => 'Siti'],
                        'starRating' => 'ONE',
                        'comment' => 'Lambat',
                        'createTime' => now()->subDay()->toRfc3339String(),
                        'reviewReply' => ['comment' => 'Maaf', 'updateTime' => now()->toRfc3339String()],
                    ],
                ],
            ]),
        ]);

        $service = new GoogleBusinessProfileService;
        $reviews = $service->fetchReviews($this->user, $this->token);

        $this->assertCount(2, $reviews);
        $this->assertDatabaseHas('google_reviews', ['google_review_id' => 'r1', 'rating' => 5, 'reviewer_name' => 'Budi']);
        $this->assertDatabaseHas('google_reviews', ['google_review_id' => 'r2', 'rating' => 1, 'reply_text' => 'Maaf']);
    }

    public function test_fetch_reviews_dedupe_on_second_sync(): void
    {
        Http::fake([
            'mybusinessaccountmanagement.googleapis.com/*' => Http::response(['accounts' => [['name' => 'accounts/999']]]),
            'businessprofile.googleapis.com/*' => Http::response([
                'reviews' => [['reviewId' => 'r1', 'reviewer' => ['displayName' => 'Budi'], 'starRating' => 'FIVE', 'comment' => 'Enak', 'createTime' => now()->toRfc3339String()]],
            ]),
        ]);

        $service = new GoogleBusinessProfileService;
        $service->fetchReviews($this->user, $this->token);
        $service->fetchReviews($this->user, $this->token); // sync ke-2

        // Tidak boleh duplikat (dedupe by google_review_id).
        $this->assertEquals(1, GoogleReview::where('google_review_id', 'r1')->count());
    }

    public function test_post_reply_calls_bp_api(): void
    {
        // Seed review lokal dulu (postReply update by google_review_id).
        GoogleReview::create([
            'tenant_id' => $this->user->tenant_id, 'outlet_id' => $this->user->outlet_id,
            'google_review_id' => 'r1', 'reviewer_name' => 'Budi', 'rating' => 5, 'comment' => 'Enak',
            'reviewed_at' => now(),
        ]);

        Http::fake([
            'mybusinessaccountmanagement.googleapis.com/*' => Http::response(['accounts' => [['name' => 'accounts/999']]]),
            'businessprofile.googleapis.com/*' => Http::response([], 200),
        ]);

        $service = new GoogleBusinessProfileService;
        $service->postReply($this->user, $this->token, 'r1', 'Terima kasih!');

        // Reply tersimpan lokal.
        $this->assertDatabaseHas('google_reviews', ['google_review_id' => 'r1', 'reply_text' => 'Terima kasih!']);
        // Endpoint reply dipanggil.
        Http::assertSent(fn ($req) => str_contains((string) $req->url(), '/reviews/r1/reply') && $req->method() === 'PUT');
    }

    public function test_exchange_code_saves_token_encrypted(): void
    {
        Http::fake([
            'oauth2.googleapis.com/token' => Http::response([
                'access_token' => 'at', 'refresh_token' => 'rt', 'expires_in' => 3600, 'email' => 'u@t.com',
            ]),
        ]);

        $service = new GoogleBusinessProfileService;
        $token = $service->exchangeCode($this->user, 'code_xyz');

        $this->assertEquals('u@t.com', $token->google_account);
        $this->assertNotNull($token->refresh_token);
        // Terenkripsi di DB (cast encrypted).
        $raw = \DB::table('google_bp_tokens')->where('tenant_id', $this->user->tenant_id)->first();
        $this->assertNotEquals('rt', $raw->refresh_token);
    }

    public function test_fetch_reviews_from_place_id_calls_places_api(): void
    {
        config(['google-business-profile.places_api_key' => 'test-key']);
        Http::fake([
            'maps.googleapis.com/maps/api/place/details/*' => Http::response([
                'status' => 'OK',
                'result' => [
                    'rating' => 4.5,
                    'user_ratings_total' => 120,
                    'reviews' => [
                        [
                            'author_name' => 'Budi',
                            'rating' => 5,
                            'text' => 'Enak!',
                            'time' => 1700000000,
                            'profile_photo_url' => 'http://x/y.jpg',
                        ],
                        [
                            'author_name' => 'Siti',
                            'rating' => 2,
                            'text' => 'Lambat',
                            'time' => 1699990000,
                        ],
                    ],
                ],
            ]),
        ]);

        $service = new GoogleBusinessProfileService;
        $payload = $service->fetchReviewsFromPlaceId('ChIJabc123', $this->user->outlet_id, $this->user->tenant_id);

        $this->assertEquals(4.5, $payload['rating']);
        $this->assertEquals(120, $payload['user_ratings_total']);
        $this->assertCount(2, $payload['reviews']);
        // sorted desc by time → Budi (1700000000) duluan.
        $this->assertEquals('Budi', $payload['reviews'][0]->reviewer_name);
        $this->assertDatabaseHas('google_reviews', ['google_review_id' => '1700000000', 'rating' => 5, 'source' => 'places']);
        Http::assertSent(fn ($req) => str_contains((string) $req->url(), 'maps.googleapis.com/maps/api/place/details')
            && str_contains((string) $req->url(), 'place_id=ChIJabc123')
            && str_contains((string) $req->url(), 'key=test-key'));
    }

    public function test_fetch_reviews_from_place_id_throws_on_non_ok(): void
    {
        config(['google-business-profile.places_api_key' => 'test-key']);
        Http::fake([
            'maps.googleapis.com/maps/api/place/details/*' => Http::response([
                'status' => 'INVALID_REQUEST',
                'error_message' => 'bad place',
            ]),
        ]);

        $service = new GoogleBusinessProfileService;
        $this->expectException(\RuntimeException::class);
        $service->fetchReviewsFromPlaceId('ChIJbad', null, $this->user->tenant_id);
    }

    public function test_authorize_url_contains_required_oauth_params(): void
    {
        config([
            'services.google.client_id' => 'test-client-id',
            'google-business-profile.bp_redirect_uri' => 'https://example.com/callback',
            'google-business-profile.scopes' => ['business.manage'],
        ]);

        $service = new GoogleBusinessProfileService;
        $url = $service->authorizeUrl($this->user);

        $this->assertStringContainsString('accounts.google.com/o/oauth2/v2/auth', $url);
        $this->assertStringContainsString('client_id=test-client-id', $url);
        $this->assertStringContainsString('response_type=code', $url);
        $this->assertStringContainsString('scope=business.manage', $url);
        $this->assertStringContainsString('access_type=offline', $url);
        $this->assertStringContainsString('prompt=consent', $url);
        $this->assertStringContainsString('state=', $url);
    }

    public function test_refresh_if_needed_skips_when_not_expired(): void
    {
        $this->token->update(['expires_at' => now()->addHour()]);

        $service = new GoogleBusinessProfileService;
        $result = $service->refreshIfNeeded($this->token);

        $this->assertEquals($this->token->id, $result->id);
        Http::assertNothingSent();
    }

    public function test_refresh_if_needed_refreshes_when_expired(): void
    {
        $this->token->update(['expires_at' => now()->subHour()]);

        Http::fake([
            'oauth2.googleapis.com/token' => Http::response([
                'access_token' => 'new_access_token',
                'expires_in' => 3600,
            ]),
        ]);

        $service = new GoogleBusinessProfileService;
        $result = $service->refreshIfNeeded($this->token);

        $this->assertNotEquals('enc_dummy', $result->fresh()->access_token);
        Http::assertSent(fn ($req) => str_contains((string) $req->url(), 'oauth2.googleapis.com/token')
            && $req->method() === 'POST');
    }

    public function test_refresh_if_needed_returns_original_on_failure(): void
    {
        $this->token->update(['expires_at' => now()->subHour()]);

        Http::fake([
            'oauth2.googleapis.com/token' => Http::response(['error' => 'invalid_grant'], 400),
        ]);

        $service = new GoogleBusinessProfileService;
        $result = $service->refreshIfNeeded($this->token);

        $this->assertEquals($this->token->id, $result->id);
    }

    public function test_list_locations_returns_mapped_array(): void
    {
        Http::fake([
            'mybusinessaccountmanagement.googleapis.com/*' => Http::response(['accounts' => [['name' => 'accounts/999']]]),
            'businessprofile.googleapis.com/*' => Http::response([
                'locations' => [
                    [
                        'name' => 'accounts/999/locations/loc1',
                        'title' => 'Resto Cabang Utama',
                        'storefrontAddress' => ['addressLines' => ['Jl. Merdeka No. 1']],
                    ],
                    [
                        'name' => 'accounts/999/locations/loc2',
                        'storeCode' => 'RC2',
                    ],
                ],
            ]),
        ]);

        $service = new GoogleBusinessProfileService;
        $locations = $service->listLocations($this->token);

        $this->assertCount(2, $locations);
        $this->assertEquals('loc1', $locations[0]['location_id']);
        $this->assertEquals('Resto Cabang Utama', $locations[0]['name']);
        $this->assertEquals('Jl. Merdeka No. 1', $locations[0]['address']);
        $this->assertEquals('loc2', $locations[1]['location_id']);
        $this->assertEquals('RC2', $locations[1]['name']);
    }

    public function test_list_locations_returns_empty_on_failure(): void
    {
        Http::fake([
            'mybusinessaccountmanagement.googleapis.com/*' => Http::response(['accounts' => [['name' => 'accounts/999']]]),
            'businessprofile.googleapis.com/*' => Http::response(['error' => 'unauthorized'], 403),
        ]);

        $service = new GoogleBusinessProfileService;
        $locations = $service->listLocations($this->token);

        $this->assertEmpty($locations);
    }

    public function test_list_locations_returns_empty_when_no_account(): void
    {
        Http::fake([
            'mybusinessaccountmanagement.googleapis.com/*' => Http::response(['accounts' => []]),
        ]);

        $service = new GoogleBusinessProfileService;
        $locations = $service->listLocations($this->token);

        $this->assertEmpty($locations);
    }

    public function test_resolve_account_uses_config_override(): void
    {
        config(['google-business-profile.account_id' => 'override-account-123']);

        $service = new GoogleBusinessProfileService;
        $locations = $service->listLocations($this->token);

        // When config override is set, resolveAccount returns 'accounts/override-account-123'
        // and should NOT call the accounts API
        Http::assertNotSent(fn ($req) => str_contains((string) $req->url(), 'mybusinessaccountmanagement'));
    }
}
