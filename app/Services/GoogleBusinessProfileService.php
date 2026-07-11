<?php

namespace App\Services;

use App\Models\GoogleBpToken;
use App\Models\GoogleReview;
use App\Models\Scopes\TenantScope;
use App\Models\User;
use Carbon\Carbon;
use Illuminate\Support\Facades\Cache;
use Illuminate\Support\Facades\Http;
use Illuminate\Support\Facades\Log;

/**
 * Google Business Profile API — ambil & balas ulasan resto sungguhan.
 *
 * Alur:
 *   1. owner klik "Hubungkan GBP" → authorizeUrl() → redirect Google (scope business.manage).
 *   2. Google callback → exchangeCode() → simpan access+refresh token (encrypted).
 *   3. syncReviews() → bila token ada → GET live reviews; bila tidak → fallback demo/error.
 *
 * Keamanan:
 *   - Token per-tenant (GoogleBpToken), terenkripsi di DB.
 *   - Refresh token hanya diberikan sekali → disimpan, tidak di-log.
 *   - Tidak ada cross-tenant: query selalu di-scope tenant.
 */
class GoogleBusinessProfileService
{
    public function __construct(
        private readonly string $apiBase = '',
    ) {}

    private function base(): string
    {
        return $this->apiBase ?: config('google-business-profile.api_base');
    }

    /** URL OAuth ke Google dengan scope business.manage + offline (dapat refresh token). */
    public function authorizeUrl(User $user): string
    {
        $state = encrypt((string) $user->tenant_id);

        return 'https://accounts.google.com/o/oauth2/v2/auth?'.http_build_query([
            'client_id' => config('services.google.client_id'),
            'redirect_uri' => config('google-business-profile.bp_redirect_uri'),
            'response_type' => 'code',
            'scope' => implode(' ', config('google-business-profile.scopes')),
            'access_type' => 'offline',
            'prompt' => 'consent',
            'state' => $state,
        ]);
    }

    /** Tukar code → token, simpan terenkripsi per-tenant. Kembalikan GoogleBpToken. */
    public function exchangeCode(User $user, string $code): GoogleBpToken
    {
        $resp = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'client_id' => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            'code' => $code,
            'grant_type' => 'authorization_code',
            'redirect_uri' => config('google-business-profile.bp_redirect_uri'),
        ]);

        if (! $resp->successful()) {
            throw new \RuntimeException('Google token exchange gagal: '.$resp->body());
        }

        $data = $resp->json();

        return GoogleBpToken::updateOrCreate(
            ['tenant_id' => $user->tenant_id],
            [
                'google_account' => $data['email'] ?? null,
                'access_token' => $data['access_token'],
                'refresh_token' => $data['refresh_token'] ?? null,
                'expires_at' => now()->addSeconds((int) ($data['expires_in'] ?? 3600)),
                'location_id' => null,
                'location_name' => null,
            ]
        );
    }

    /** Refresh access token pakai refresh_token (jika expired). */
    public function refreshIfNeeded(GoogleBpToken $token): GoogleBpToken
    {
        if (! $token->isExpired() || ! $token->refresh_token) {
            return $token;
        }

        $resp = Http::asForm()->post('https://oauth2.googleapis.com/token', [
            'client_id' => config('services.google.client_id'),
            'client_secret' => config('services.google.client_secret'),
            'refresh_token' => $token->refresh_token,
            'grant_type' => 'refresh_token',
        ]);

        if (! $resp->successful()) {
            Log::warning('[GBP] refresh token gagal: '.$resp->body());

            return $token;
        }

        $data = $resp->json();
        $token->update([
            'access_token' => $data['access_token'],
            'expires_at' => now()->addSeconds((int) ($data['expires_in'] ?? 3600)),
        ]);

        return $token->fresh();
    }

    /** List lokasi GBP milik akun (untuk owner pilih locationId). */
    public function listLocations(GoogleBpToken $token): array
    {
        $token = $this->refreshIfNeeded($token);
        $account = $this->resolveAccount($token);
        if (! $account) {
            return [];
        }

        $resp = Http::withToken($token->access_token)
            ->get("{$this->base()}/{$account}/locations");

        if (! $resp->successful()) {
            Log::warning('[GBP] list locations gagal: '.$resp->body());

            return [];
        }

        return collect($resp->json('locations') ?? [])
            ->map(fn ($loc) => [
                'location_id' => basename((string) ($loc['name'] ?? '')),
                'name' => $loc['title'] ?? ($loc['storeCode'] ?? basename((string) ($loc['name'] ?? ''))),
                'address' => $loc['storefrontAddress']['addressLines'][0] ?? null,
            ])
            ->all();
    }

    /** Ambil ulasan live dari BP API, normalisasi + upsert dedupe by google_review_id. */
    public function fetchReviews(User $user, GoogleBpToken $token, ?string $locationId = null): array
    {
        $token = $this->refreshIfNeeded($token);
        $loc = $locationId ?? $token->location_id;
        if (! $loc) {
            throw new \RuntimeException('Location GBP belum dipilih.');
        }

        $cacheKey = "gbp_reviews_{$user->tenant_id}_{$loc}";
        $cached = Cache::get($cacheKey);
        if ($cached !== null) {
            return $cached;
        }

        // location resource name = accounts/{acc}/locations/{loc}
        $account = $this->resolveAccount($token);
        $resource = $account ? "{$account}/locations/{$loc}" : "locations/{$loc}";

        $resp = Http::withToken($token->access_token)
            ->get("{$this->base()}/{$resource}/reviews");

        if (! $resp->successful()) {
            throw new \RuntimeException('Google review fetch gagal: '.$resp->body());
        }

        $starMap = ['ONE' => 1, 'TWO' => 2, 'THREE' => 3, 'FOUR' => 4, 'FIVE' => 5];

        $rows = [];
        foreach ($resp->json('reviews') ?? [] as $r) {
            $rid = (string) ($r['reviewId'] ?? ($r['name'] ?? uniqid('rev_')));
            $review = GoogleReview::withoutGlobalScope(TenantScope::class)
                ->updateOrCreate(
                    ['tenant_id' => $user->tenant_id, 'google_review_id' => $rid],
                    [
                        'outlet_id' => $user->outlet_id,
                        'reviewer_name' => $r['reviewer']['displayName'] ?? 'Anonim',
                        'reviewer_photo' => $r['reviewer']['profilePhotoUrl'] ?? null,
                        'rating' => (int) ($starMap[$r['starRating'] ?? ''] ?? (int) ($r['starRating'] ?? 0)),
                        'comment' => $r['comment'] ?? '',
                        'reviewed_at' => isset($r['createTime'])
                            ? Carbon::parse($r['createTime'])
                            : now(),
                        'reply_text' => $r['reviewReply']['comment'] ?? null,
                        'replied_at' => isset($r['reviewReply']['updateTime'])
                            ? Carbon::parse($r['reviewReply']['updateTime'])
                            : null,
                    ]
                );
            $rows[] = $review;
        }

        $rows = collect($rows)->sortByDesc('reviewed_at')->values()->all();
        Cache::put($cacheKey, $rows, config('google-business-profile.cache_ttl'));

        return $rows;
    }

    /** Balas ulasan ke Google (live) + simpan lokal. */
    public function postReply(User $user, GoogleBpToken $token, string $reviewId, string $text): void
    {
        $token = $this->refreshIfNeeded($token);
        $loc = $token->location_id;
        if (! $loc) {
            throw new \RuntimeException('Location GBP belum dipilih.');
        }

        $account = $this->resolveAccount($token);
        $resource = $account ? "{$account}/locations/{$loc}/reviews/{$reviewId}/reply" : "locations/{$loc}/reviews/{$reviewId}/reply";

        $resp = Http::withToken($token->access_token)
            ->put("{$this->base()}/{$resource}", ['comment' => $text]);

        if (! $resp->successful()) {
            throw new \RuntimeException('Google reply gagal: '.$resp->body());
        }

        GoogleReview::withoutGlobalScope(TenantScope::class)
            ->where('tenant_id', $user->tenant_id)
            ->where('google_review_id', $reviewId)
            ->update(['reply_text' => $text, 'replied_at' => now()]);
    }

    /** Tentukan account resource name (accounts/{id}). Pakai override config bila ada, else auto-discover. */
    private function resolveAccount(GoogleBpToken $token): ?string
    {
        $override = config('google-business-profile.account_id');
        if ($override) {
            return 'accounts/'.$override;
        }

        $resp = Http::withToken($token->access_token)
            ->get('https://mybusinessaccountmanagement.googleapis.com/v1/accounts');

        if (! $resp->successful()) {
            return null;
        }

        $accounts = $resp->json('accounts') ?? [];
        if (empty($accounts)) {
            return null;
        }

        return (string) ($accounts[0]['name'] ?? null);
    }
}
