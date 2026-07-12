# GBP Reviews → Google Places API (Place ID) Pivot — Implementation Plan

> **For Hermes:** Use subagent-driven-development skill to implement task-by-task.

**Goal:** Ganti sumber ulasan Google Business Profile dari OAuth `businessprofile.googleapis.com` (gated, stuck, quota 0) ke **Google Places API by Place ID** (standar, key-based, real-time terbukti). Tenant cukup **tempel link Google Maps** → Restoku ekstrak Place ID → fetch ulasan live via 1 server-key Restoku, cache Redis. Tidak ada GCP console / OAuth / request-access untuk tenant. **Ulasan ditampilkan prioritas TERBARU + BELUM DIBALAS** (filter lokal `reply_text IS NULL`, sort `reviewed_at DESC`). **Balas ulasan wajib via Groq AI untuk SEMUA ulasan** (template hardcoded dihapus, terbukti live).

**Architecture:** Display ulasan jadi **read-only real-time** via Places API Place Details (`fields=reviews,rating,user_ratings_total`). Place ID disimpan per-outlet. **Status "belum dibalas" dilacak LOKAL** (Places API tidak mengembalikan balasan — itu cuma ada di BP API gated): saat owner klik "Salin balasan AI" → tandai `reply_text`/`replied_at` lokal. Filter `reply_text IS NULL` = belum dibalas. Balas ulasan → **Groq AI generate** (semua ulasan, tanpa template hardcoded) + copy-to-clipboard (owner paste ke Google). Key Restoku satu (`GOOGLE_PLACES_API_KEY`) + Groq key (`GROQ_API_KEY`) di `.env`.

**Tech Stack:** Laravel 13 (Http facade + Cache/Redis), Google Places API (legacy Place Details JSON), Vitest + PHPUnit, Inertia/React FE.

**Status saat ini (fakta):** `GoogleBusinessProfileService` memanggil `businessprofile.googleapis.com` sungguhan (bukan mock) TAPI belum pernah mengambil 1 ulasan asli end-to-end karena API gated. Ini = klaim, bukan bukti. Pivot menyelesaikan itu.

---

## Task 1: Tambah `GOOGLE_PLACES_API_KEY` ke `.env` + config

**Objective:** Sediakan key server Restoku untuk Places API.

**Files:**
- Modify: `.env` (tambah baris, nilai diisi user — jangan hardcode)
- Modify: `.env.example` (dokumentasi)
- Modify: `config/google-business-profile.php` (tambah key `places_api_key`)

**Step 1:** Tambah ke `.env` (nilai kosong, user isi nanti):
```
GOOGLE_PLACES_API_KEY=
```
**Step 2:** Di `config/google-business-profile.php` tambah setelah `api_base`:
```php
// Server-key Restoku untuk Google Places API (ulasan real-time by Place ID).
// Satu key untuk semua tenant — bukan per-tenant.
'places_api_key' => env('GOOGLE_PLACES_API_KEY', ''),
'places_api_base' => 'https://maps.googleapis.com/maps/api/place/details/json',
```
**Step 3:** Commit `git commit -m "feat(gbp): add Places API key config"`

---

## Task 1.5: `PlaceIdResolver` robust — handle semua varian link Maps

**Objective:** "Auto detect" Place ID dari link Maps APA PUN formatnya: `ChIJ...` langsung, hex cid `0x..:0x..`, **atau koordinat `@lat,lng,z`** (reverse-geocode). Ini menyelesaikan requirement "link mengandung koordinat → auto detect robust".

**Files:**
- Create: `app/Services/PlaceIdResolver.php`
- Test: `tests/Unit/PlaceIdResolverTest.php`

**Step 1 (failing tests — semua varian):**
```php
// 1. ChIJ langsung
$this->assertEquals('ChIJabc123', PlaceIdResolver::resolve('ChIJabc123'));
// 2. URL dengan ChIJ
$this->assertEquals('ChIJabc123', PlaceIdResolver::resolve('https://maps.google.com/?q&ftid=ChIJabc123'));
// 3. URL koordinat @lat,lng,z  → reverse-geocode via Places API
Http::fake([
  'maps.googleapis.com/maps/api/geocode/*' => Http::response([
    'status'=>'OK',
    'results'=>[['place_id'=>'ChIJresolved123']]
  ]),
]);
$this->assertEquals('ChIJresolved123', PlaceIdResolver::resolve('https://www.google.com/maps/@-6.2,106.8,15z'));
// 4. URL dengan !3d/!4d koordinat
$this->assertEquals('ChIJresolved123', PlaceIdResolver::resolve('https://maps.google.com/maps/place/X/@-6.2,106.8,17z?entry=ttu'));
// 5. tidak ada info sama sekali → null (error transparan, bukan tebakan)
$this->assertNull(PlaceIdResolver::resolve('resto enak jakarta'));
```
**Step 2:** Implementasi `PlaceIdResolver::resolve(string $input): ?string`:
- regex `(ChIJ[A-Za-z0-9_-]+)` → return langsung.
- regex `@(-?\d+\.\d+),(-?\d+\.\d+)` atau `!3d(-?\d+\.\d+)!4d(-?\d+\.\d+)` → ambil lat,lng → `Http::get(geocode_url, ['latlng'=>"$lat,$lng",'key'=>places_api_key])` → `results[0].place_id` (atau fallback `findPlaceFromText` dengan `query`=nama).
- else → null.
## Task 2: `PlaceIdExtractor` → ganti pakai `PlaceIdResolver` (robust)

**Objective:** Pastikan helper ekstrak Place ID memakai `PlaceIdResolver` (handle koordinat), bukan regex sederhana. (Jika Task 1.5 cukup, file ini bisa di-skip — langsung pakai Resolver di controller/FE.)

**Files:**
- Create: `app/Services/PlaceIdExtractor.php` (thin wrapper ke `PlaceIdResolver::resolve`)
- Test: `tests/Unit/PlaceIdExtractorTest.php`

---

## Task 3: Ganti `fetchReviews` ke Places API (real-time)

**Objective:** `GoogleBusinessProfileService::fetchReviews` memanggil Places API, bukan Business Profile API.

**Files:**
- Modify: `app/Services/GoogleBusinessProfileService.php` (ganti method `fetchReviews`, hapus `postReply`/`listLocations`/`bpSelectLocation` usage gated)
- Test: `tests/Feature/GoogleBusinessProfileServiceTest.php` (mock Http, assert URL + key)

**Step 1 (failing test — mock Http):**
```php
Http::fake([
    'maps.googleapis.com/maps/api/place/details/*' => Http::response([
        'status' => 'OK',
        'result' => [
            'rating' => 4.5,
            'user_ratings_total' => 120,
            'reviews' => [
                ['author_name' => 'Budi', 'rating' => 5, 'text' => 'Enak!', 'time' => 1700000000, 'profile_photo_url' => ''],
            ],
        ],
    ]),
]);
$svc = new GoogleBusinessProfileService();
$rows = $svc->fetchReviewsFromPlaceId('ChIJxxxx');
// assert 1 row, rating 5, comment 'Enak!', source 'places'
```
**Step 2:** Implementasi `fetchReviewsFromPlaceId(string $placeId): array`:
- cache key `gbp_reviews_places_{$placeId}`, TTL `config('google-business-profile.cache_ttl')` (naik ke 300).
- `Http::get(config('google-business-profile.places_api_base'), ['place_id'=>$placeId, 'fields'=>'reviews,rating,user_ratings_total','key'=>config('...places_api_key')])`
- map `reviews[]` → `GoogleReview` upsert (tanpa scope cross-tenant; tambah kolom `source='places'`).
- `rating`/`user_ratings_total` simpan ke outlet_settings atau return bareng.
- throw `\RuntimeException` bila `status != 'OK'` (transparan, bukan demo).
**Step 3:** Run test → PASS. Commit.

---

## Task 4: Controller — Place ID + filter "belum dibalas" + Groq wajib

**Objective:** `GoogleReviewController` ambil ulasan via Place ID tersimpan; **prioritas TERBARU + BELUM DIBALAS** (`reply_text IS NULL`, sort `reviewed_at DESC`); hapus dependency OAuth gated; `generateAiReply` **selalu Groq** (template hardcoded dihapus).

**Files:**
- Modify: `app/Http/Controllers/GoogleReviewController.php`
  - `index()`: ambil `place_id` dari `outlet_settings` → `fetchReviewsFromPlaceId`. Return shape:
    ```json
    {
      "status":"success",
      "source":"places",
      "unreplied": [ /* reply_text IS NULL, sort reviewed_at DESC */ ],
      "replied":   [ /* sudah ada reply_text lokal */ ],
      "rating": 4.5, "user_ratings_total": 120
    }
    ```
  - `saveSettings()`: simpan `place_id` via `PlaceIdResolver::resolve()` ke `outlet_settings.google_place_id` (bukan session). Jika null → 422 transparan "Link tidak dikenali".
  - Hapus `bpConnect`, `bpCallback`, `bpLocations`, `bpSelectLocation`, `postReply` (gated).
  - `generateAiReply()`: **HAPUS 3 if hardcoded (Budi/Siti/Anisa)** → langsung `RestokuAiAssistant::make()->prompt($prompt)` untuk SEMUA ulasan. Catch → 502 transparan (sudah ada, pertahankan). Pastikan `GROQ_API_KEY`/`AI_DEFAULT_PROVIDER=groq` terbaca.
  - `reply()`: ubah jadi **simpan reply_text lokal + flag `clipboard:true`** (owner copy ke Google), bukan panggil Google.
- Migration: `outlet_settings` tambah `google_place_id varchar(255) null`.
- Test: `tests/Feature/GoogleReviewApiTest.php`:
  - `index()` outlet punya `google_place_id` → returns reviews, `unreplied` di-front, `source:'places'`, no OAuth redirect.
  - `generateAiReply()` → asserts `RestokuAiAssistant` dipanggil (mock), **tidak** ada string template "Kak Budi" hardcoded.

**Step 1 (failing test):** `index()` returns `unreplied` prioritized; `generateAiReply` calls Groq for arbitrary name (mock `RestokuAiAssistant`).
**Step 2:** Implementasi + migration + `php artisan migrate`.
**Step 3:** Run `php artisan test --filter GoogleReview` → PASS. Commit.

---

## Task 5: FE — alur tempel-link, hapus OAuth button

**Objective:** `GoogleReviews.tsx` ganti tombol "Hubungkan GBP" (OAuth) jadi input "Tempel link Google Maps" + simpan Place ID + refresh. Tampilkan badge "Real-time • Places API".

**Files:**
- Modify: `resources/js/Pages/Owner/GoogleReviews.tsx`
- Test: `resources/js/__tests__/Owner/GoogleReviews.test.tsx` (render input, submit link, assert saveSettings dipanggil dengan place_id; assert tab "Belum Dibalas" menampilkan `unreplied` di-front)

**Step 1 (failing test):** render input + tombol "Simpan Link"; simulasi ketik link berbagai varian (`ChIJ...`, `@lat,lng,z`, `!3d!4d`) → submit → `mockPost` called dengan `{google_place_id:'ChIJ...'}` (hasil resolver BE, bukan regex FE). Render list: `unreplied` muncul di atas, badge "Belum Dibalas".
**Step 2:** Ganti UI. Hapus `bpConnect`/`bpCallback` fetch. Tambah `placeId` state dari settings. **Tab/filter**: "Belum Dibalas" (default, `unreplied`) vs "Semua". Tiap card punya tombol "Balas AI" → `generateAiReply` → hasil di textarea + tombol "Salin" (clipboard). Badge "Real-time • Places API".
**Step 3:** `npx vitest run resources/js/__tests__/Owner/GoogleReviews` → PASS. Commit.

---

## Task 6: **BUKTI REAL-TIME + GROQ AKTIF** (verifikasi live, bukan klaim)

**Objective:** Tunjukkan (a) Places API mengembalikan ulasan ASULI, (b) Groq benar-benar generate balasan untuk ulasan arbitrary (bukan template).

**Step 1:** Minta user tempel **link Google Maps restorannya** (atau Place ID `ChIJ...` asli).
**Step 2 (Proof Places API live):**
```bash
curl -s "https://maps.googleapis.com/maps/api/place/details/json?place_id=CHIJ_RESTORAN_ASLI&fields=reviews,rating&key=$GOOGLE_PLACES_API_KEY" | head -c 800
```
Expected: JSON `status:"OK"` + `reviews[]` nama reviewer ASLI + teks ASLI.
**Step 3 (Proof Groq live — bukan klaim):**
```bash
curl -s -X POST https://api.groq.com/openai/v1/chat/completions \
  -H "Authorization: Bearer $GROQ_API_KEY" -H "Content-Type: application/json" \
  -d '{"model":"llama-3.3-70b-versatile","messages":[{"role":"user","content":"Balas ulasan resto: Nama: Joko, Rating: 2, Komentar: nasinya keras. 1 kalimat peduli."}]}' \
  | head -c 400
```
Expected: JSON `choices[0].message.content` berisi balasan ASLI (bukan template "Kak Budi"). Ini bukti Groq aktif.
**Step 4:** Di app, set `google_place_id` outlet → buka panel → ulasan muncul + tab "Belum Dibalas" di-front. Klik "Balas AI" pada ulasan arbitrary → respons dari Groq (cek log/response). Screenshot sebagai evidence.

---

## Task 7: Naikkan coverage + cleanup

**Objective:** Pastikan tidak ada regression; threshold transparan naik.

**Files:** `vite.config.js` thresholds, hapus file/test gated yang orphan (`tests/Feature/GoogleBusinessProfileServiceTest.php` bagian OAuth).

**Step 1:** `npx vitest run --coverage` → assert naik vs baseline.
**Step 2:** `npm run build` exit 0; `php artisan test` 127+ passed.
**Step 3:** Commit + push.

---

## Risks / Tradeoffs
- **Places API legacy return max 5 ulasan terbaru** (batasan Google). Cukup untuk display MVP real-time. (New Places API bisa lebih banyak tapi lebih ribet — YAGNI untuk sekarang.)
- **Biaya:** Places API ~$17/1000 call. Dengan cache Redis 5 menit/lokasi + 5000 tenant → < 300k call/bulan ≈ murah. Catat di PRD.
- **Reply ke Google:** hilang jalur otomatis (gated). Ganti AI-suggest + clipboard. Owner balas manual di Google. Jujuur & tidak stuck.
- **Place ID vs Business Profile ID:** `11440950457431200377` adalah BP account/location ID, BUKAN Maps Place ID. Jangan campur. Place ID didapat dari link Maps (`ChIJ...`).
- **Key security:** `GOOGLE_PLACES_API_KEY` server-side saja, jangan expose ke FE. Batasi referrer/restriction di GCP nanti (opsional).

## Open Questions (need user)
- Place ID `ChIJ...` ASLI restoran user (untuk Task 6 proof). User tempel link Maps → kita ekstrak.
- Setujukah balas ulasan jadi AI-suggest + clipboard (bukan auto-post)? (Rekomendasi: ya, hindari gated API.)
