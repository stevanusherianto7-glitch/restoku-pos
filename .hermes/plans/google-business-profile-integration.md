# Plan: Integrasi Google Business Profile API (Review Sungguhan) — Restoku

## Konteks Masalah (terverifikasi)
- `GoogleReviewController::syncReviews()` saat ini **100% mock**: array hardcode `pawon_001/002/003`.
  Setiap klik "Sinkronkan" → cuma tulis ulang 3 review sama. Ulasan Google Maps asli **tidak pernah di-fetch**.
- DB sungguhan (`php artisan tinker`): `COUNT=3` → persis 3 mock statis. Tidak ada ulasan baru yang masuk.
- Google **tidak** punya API publik gratis untuk ambil review dari Place ID. Satu-satu jalan resmi =
  **Business Profile API** (OAuth 2.0, scope `business.manage` / `business.reviews`), butuh:
  1. Google Cloud project + Business Profile API enabled
  2. OAuth consent screen (verification untuk production; bisa "Testing" untuk dev)
  3. Owner login OAuth → persist **refresh token** (review API butuh offline access)
  4. Akun owner terdaftar sebagai manager di Google Business Profile resto bersangkutan

## Keputusan
User pilih: **Integrasi Google Business Profile API SUNGGUHAN**.
Saya siapkan seluruh fondasi kode sekarang; kredensial (Client ID/Secret dari project yang sama dgn OAuth login)
+ verifikasi bisnis dari user = tahap akhir di luar kode.

## Arsitektur (ikuti konvensi repo)
- OAuth: pakai **Laravel Socialite** (sudah ada `OAuthController` untuk login owner). Tambah scope
  `https://www.googleapis.com/auth/business.manage` + `prompt=consent` + `access_type=offline`
  supaya dapat refresh_token.
- Token persist: tabel **google_bp_tokens** (tenant_id, access_token, refresh_token, expires_at,
  google_account, desired_location_id). Multi-tenant safe (scoped per tenant).
- Service: `app/Services/GoogleBusinessProfileService.php` (mirip `CloudinaryService`/`RestokuAiAssistant`).
  Method: `getAccounts()`, `pickLocation(placeId)`, `fetchReviews(locationId)`, `postReply(locationId, reviewId, text)`.
- Controller: `syncReviews()` di-refactor → bila token ada → fetch live; bila tidak → fallback mock
  (transparan: return `status:'error', message:'Belum terhubung ke Google Business Profile'`).
- FE: sudah robust (error banner + retry). Tinggal handle pesan "belum terhubung".

## Langkah Eksekusi
1. **Migration** `create_google_bp_tokens_table` (tenant_id indexed, kolom token, unique(tenant_id)).
2. **Model** `GoogleBpToken` + boot `TenantScope` (konsisten isolasi multi-tenant).
3. **Config** `config/google-business-profile.php` (scopes, api base url, endpoints).
4. **Service** `GoogleBusinessProfileService`:
   - `authorizeUrl(tenant)` → Socialite google + scope business.manage + state=tenant.
   - `exchangeCode($code)` → dapat token + refresh_token, simpan ke DB.
   - `fetchReviews($tenant)` → GET `{bpApi}/accounts/{acc}/locations/{loc}/reviews` (atau
     accounts/{acc}/locations/{loc}/reviews.list) → normalisasi ke shape `GoogleReview`.
   - `postReply($tenant, $locationId, $reviewId, $text)` → POST reply.
   - `resolveLocationId($placeId)` → pakai Places API `findPlaceFromText` / `places/{placeId}`
     untuk map Place ID → location resource name (butuh Places API key terpisah, opsional).
5. **Routes** (`web.php`, grup owner auth):
   - `GET /owner/google-reviews/connect` → redirect OAuth Business Profile.
   - `GET /owner/google-reviews/callback` → exchange code → simpan token → redirect panel.
6. **Controller** refactor:
   - `syncReviews()`: bila `GoogleBpToken` ada → `fetchReviews()` live + upsert dedupe by
     `google_review_id`. Bila tidak → `status:'error'` transparan (bukan silent mock).
   - `reply()`: bila token ada → `postReply()` live (POST ke Google) + simpan lokal.
   - `saveSettings()`: simpan `google_place_id` (sudah ada) + catat butuh koneksi OAuth.
7. **Seeder/test**: `GoogleBusinessProfileServiceTest` dengan mock HTTP (Guzzle mock / Laravel
   `Http::fake`) → buktikan fetch live + dedupe + reply. FE test sudah ada (error state) tetap hijau.
8. **FE**: tombol "Hubungkan Google Business Profile" di panel settings (ganti input Place ID manual
   yang sekarang tidak cukup). Pesan error transparan bila belum connect.

## Verifikasi (real, bukan klaim)
- `php artisan migrate` jalan (testing DB / sqlite).
- `php artisan test` → service test dengan `Http::fake` (fetch live + dedupe + reply) PASS.
- `npx vitest run` → FE tetap hijau (error banner path ke-cover).
- `npm run build` hijau.
- Catatan jujur: sync **sungguhan ke Google** tidak bisa di-verify di sini (butuh credential +
  akun Google nyata dengan resto terverifikasi). Saya verifikasi sampai level service+HTTP-fake +
  token-persist; bagian "live ke Google" = butuh Anda colok key + OAuth di browser.

## Risiko / Blockers
- **OAuth consent verification**: Google bisa tolak app yg belum verified → dev pakai mode "Testing"
  (max 100 user terdaftar). Production butuh review Google (bisa hari).
- **Review API akses**: butuh akun terdaftar sebagai manager GBP + location verified.
- **Refresh token**: hanya diberikan saat `prompt=consent` pertama kali → harus disimpan aman
  (encrypt di DB, jangan log).
- **Tidak ada API key dari user yet** → kode siap, tapi `.env` `GOOGLE_*` sudah ada (dipakai OAuth login)
  → bisa reuse untuk BP OAuth (scope beda). Places API key = optional (untuk map Place ID → location).

## Out of scope (tahap ini)
- Webhook real-time Google (pub/sub) — bisa batch 7 nanti. Polling 30s (sudah ada) cukup untuk v1.
- Verifikasi bisnis Google (urusan user).
