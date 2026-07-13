# Plan: Verifikasi Kehadiran Tamu (Anti-Fraud QR Order)

## Konteks
Fitur verifikasi geolokasi + PIN tadinya salah saya taruh di POS kasir.
Sesuai arahan user, verifikasi ditujukan ke **TAMU** di alur pesan makanan
(CustomerView `/m/{slug}?t={meja}`) untuk mencegah pesanan bodong dari luar
lokasi restoran. Waiter memberitahu PIN verifikasi 4-digit ke tamu.

Keputusan user (2026-07-13):
1. PIN = **KEDUANYA**: PIN Meja (per meja, spt "PIN MEJA: 5125") + PIN Harian Restoran.
2. GPS pakai `outlets.lat/lng` + radius `geo_radius_meters` (default 50m).
   Tamu di luar radius → order DITOLAK.
3. Gate di CustomerView: tombol "Kirim Pesanan" TERKUNCI sampai terverifikasi.
4. Waiter yg memberitahu PIN 4-digit ke tamu.

## Mockup (sudah disetujui gaya Elvera)
`public/guest-verify-mockup.html` — cream bg, aksen cabe, kartu flat,
widget "VERIFIKASI KEHADIRAN" menonjol halus, GPS check + input PIN + CTA.

## Arsitektur

### A. Data Layer
- **Tabel baru `outlet_tables`**:
  `id, outlet_id, tenant_id, label (free-form A1/01/Meja 7), pin_hash (bcrypt 4-digit),
   latitude nullable, longitude nullable, created_at, updated_at`.
  - PIN meja di-derive stabil: `derivePin(outlet_id, label)` = 4 digit dari
    `hash('sha256', "restoku:tablepin:{outlet_id}:{label}")` (mirip DailyPinService).
  - Seed: untuk outlet yg sudah punya meja aktif (dari QR generator), backfill
    `outlet_tables` dengan label = table_number existing.
- **Reuse**: `DailyPinService` (PIN harian) + `OutletDailyPin` sudah ada.
- `outlets.lat/lng/geo_radius_meters` sudah ada (50m default).

### B. Backend (Laravel)
- **New**: `GuestVerifyController@verify`
  `POST /api/guest/verify` (throttle:30,1, public):
  - Input: `slug`, `table` (label), `table_pin` (4d), `daily_pin` (4d),
    `lat`, `lng`, `accuracy?`.
  - Cari outlet by slug (withoutGlobalScope TenantScope).
  - Cari `outlet_tables` by (outlet_id, label).
  - Cek: `Hash::check(table_pin, table.pin_hash)` DAN
    `DailyPinService::verify(outlet_id, daily_pin)` DAN
    `DailyPinService::isWithinRadius(outlet, lat, lng, accuracy)`.
  - Sukses → return `{ok:true, token: <signed short-lived token>}`.
    Token = `base64(json({outlet_id, table, exp:now+15m}))` + HMAC signature
    (app key). Tamu pakai token ini saat submit order.
  - Gagal → `{ok:false, reason:'pin_table'|'pin_daily'|'gps'|'table_not_found'}`.
- **Modify**: `PublicOrderController@submitOrder`
  - Wajib field `verify_token`. Validasi signature+HMAC+expiry.
  - Tanpa token valid → 422 "Verifikasi kehadiran diperlukan".
  - (Tidak mengubah validasi item/stok yg sudah ada.)
- **Route**: tambah di `routes/web.php` public group.

### C. Frontend (React / CustomerView.tsx)
- **New component**: `GuestVerifyGate.tsx` (cream/cabe style, reuse GeoPinVerify
  GPS logic Haversine + inline-SVG icons, NO lucide).
  - State: GPS detect (auto `navigator.geolocation`, timeout 6s fallback manual),
    input PIN Meja (4d), input PIN Harian (4d).
  - On "Verifikasi & Kirim": POST `/api/guest/verify`. Sukses →
    `setGuestVerified(true)` + simpan `verify_token` + `localStorage` (session).
  - Render di atas panel transaksi / sebelum tombol Kirim Pesanan.
- **Modify CustomerView**:
  - `handleSubmitOrder` (line ~510): BLOKIR kalau `!guestVerified`.
    Tombol "Kirim Pesanan Ke Dapur" (line 1591) jadi disabled + gembok sampai
    `guestVerified`. Sertakan `verify_token` di body POST `/api/orders`.
  - Pass `outletLat/Lng/radius` ke GuestVerifyGate (dari `/api/menu/{slug}`
    response — tambah `latitude/longitude/geo_radius_meters` di getPublicMenu).
- **Remove** widget GeoPinVerify dari POS kasir (salah tempat) — cabut dari
  POS/Index.tsx + hapus import. (DailyPinService/OutletDailyPin tetap dipakai
  untuk PIN harian tamu, jadi tidak dihapus.)

### D. Tests (QA rule: 100% coverage per change)
- **BE PHPUnit**: `GuestVerifyControllerTest`
  - sukses (gps ok + 2 pin benar) → token.
  - gagal pin meja, gagal pin harian, gagal gps luar radius, table tidak ada.
  - `submitOrder` tanpa token → 422; dgn token valid → 201.
- **FE Vitest**: `guestVerifyGate.test.tsx`
  - render gate, input pins, mock fetch sukses → guestVerified true.
  - fetch gagal → pesan error, tombol tetap lock.
  - gps luar radius → deny.

## File Changes
- `database/migrations/2026_07_13_000000_create_outlet_tables_table.php` (NEW)
- `app/Models/OutletTable.php` (NEW)
- `app/Http/Controllers/GuestVerifyController.php` (NEW)
- `app/Http/Controllers/PublicOrderController.php` (MODIFY: require token)
- `routes/web.php` (MODIFY: route verify)
- `resources/js/Components/GuestVerifyGate.tsx` (NEW)
- `resources/js/Pages/BukuMenuDigital/CustomerView.tsx` (MODIFY: gate + lock)
- `resources/js/Pages/POS/Index.tsx` (MODIFY: remove GeoPinVerify)
- `tests/Feature/GuestVerifyControllerTest.php` (NEW)
- `resources/js/__tests__/guestVerifyGate.test.tsx` (NEW)
- Seed backfill `outlet_tables` untuk meja existing (NEW seeder/command).

## Verifikasi
1. `php artisan test --filter GuestVerify` → green.
2. `npx vitest run guestVerifyGate` → green.
3. `npm run build` → exit 0.
4. Browser: buka `/m/{slug}?t=A1` → gate muncul, tombol Kirim terkunci →
   input PIN (waiter kasih) + GPS → Verifikasi → tombol aktif → submit sukses.
   (Capture screenshot sebagai bukti visual.)
5. Commit + push + trigger CI (setelah billing GitHub beres).

## Risiko
- GPS di headless browser tidak fire (sudah diantisipasi timeout 6s fallback).
  Bukti E2E via browser saya terbatas; andalkan unit test + mock fetch.
- Outlet tanpa lat/lng → `isWithinRadius` return false (strict). Untuk dev,
  seed lat/lng outlet (sudah ada di DB Pawon Salam). Outlet tanpa koordinat
  → verifikasi gps di-skip dengan flag `gps_optional` (outlet.latitude null).
