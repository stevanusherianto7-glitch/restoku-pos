# Plan: PIN 4-digit + Verifikasi Geolokasi di Dashboard Kasir (POS)

**Tanggal:** 2026-07-12
**Author:** Hermes (arsitektur di-delegasikan user)
**Scope:** Tambah widget verifikasi (PIN 4-digit + GPS radius) di pojok kanan atas
dashboard kasir (`POS/Index.tsx`), didukung backend (`daily_pin` per-outlet harian).

---

## Keputusan Arsitektur (diambil alih)

1. **Fungsi widget** = indikator status + aksi verifikasi (bukan hard-gate transaksi).
   Kasir bisa tetap transaksi; widget menampilkan badge "Terverifikasi ✓ / Belum ✓".
   Rasional: hindari memblokir operasional kalau GPS gagal (gedung, izin ditolak).
2. **PIN 4-digit** = generate otomatis **harian per-outlet** di BE, disimpan di DB,
   tampil di Pengaturan Outlet (owner lihat), kasir ketik di dashboard untuk verifikasi.
3. **Verifikasi = AND**: PIN benar **DAN** GPS dalam `geo_radius_meters` outlet.
   Jika GPS gagal → fallback "Verifikasi PIN saja" (owner bisa set kebijakan).
4. **Data koordinat outlet** sudah ada di `Outlet` (`latitude`, `longitude`,
   `geo_radius_meters`) — tinggal di-share ke props POS.

---

## Backend

### A. Migration: `daily_pin` per outlet
- Tabel `outlet_daily_pins` (atau kolom di `outlets`): `outlet_id`, `pin` (hashed,
  bcrypt/topi), `date` (Y-m-d), `verified_at`, `verified_by`, `created_at`.
- Unique `(outlet_id, date)` → 1 PIN per outlet per hari.
- Seeder/default: generate saat pertama dibutuhkan (lazy) via service.

### B. Service `DailyPinService`
- `getOrGenerate(outletId, date)`: return PIN 4-digit (angka, 0000–9999),
  generate + hash + simpan kalau belum ada untuk hari ini.
- `verify(outletId, date, plainPin)`: bandingkan hash (Hash::check).
- Auto-rotate: PIN berubah tiap hari (lazy regenerate kalau `date` ≠ hari ini).

### C. Controller + Route
- `GET /owner/outlet/daily-pin` → return PIN hari ini (untuk Pengaturan Outlet,
  owner-only, TenantScope). Bukan endpoint publik.
- `POST /api/cashier/verify-location` (throttle:10,1) → payload `{ pin, lat, lng }`:
  - cek PIN via DailyPinService::verify
  - hitung haversine ke outlet.lat/lng, banding radius (toleransi akurasi)
  - return `{ verified: bool, distance_m, within_radius, method }`
  - simpan `verified_at` kalau lolos.
- Share `latitude/longitude/geo_radius_meters` + `daily_pin` (atau flag) ke
  `HandleInertiaRequests` → `outlet_settings` props agar POS punya data.

### D. Pengaturan Outlet
- Tampilkan PIN hari ini (read-only, "Reset/Putar ulang" untuk owner).
- Field koordinat + radius sudah ada → pastikan tersimpan.

---

## Frontend

### E. Komponen `GeoPinVerify` (baru: `resources/js/Components/POS/GeoPinVerify.tsx`)
- Props: `outletLat`, `outletLng`, `radius`.
- State: `pin` (4 digit), `status` ('idle'|'verifying'|'ok'|'fail'), `distance`, `error`.
- UI: input 4-box PIN + tombol "Verifikasi", badge status di pojok kanan atas.
- Pakai `haversine` dari `Geolocation.tsx` (sudah ada).
- Saat klik: `navigator.geolocation.getCurrentPosition` → POST `/api/cashier/verify-location`.
- Simpan status ke `localStorage` (session kasir) supaya tidak verify tiap render.

### F. Pasang di `POS/Index.tsx`
- Di dalam `<Screen title="Kasir (POS)">`, tambahkan flex `justify-between`:
  kiri = judul, kanan = `<GeoPinVerify ... />`.
- Ambil `latitude/longitude/geo_radius_meters` dari `usePage().props.outlet_settings`.

### G. Ikon
- Pakai inline-SVG di `Components/icons.tsx` (sudah ada `MapPinIcon`, `ShieldAlertIcon`,
  `CheckCircle2Icon`) — **tanpa lucide-react** (anti-AI-look).

---

## Tests (mandat: setiap perubahan bawa test, jaga coverage)

### Backend (PHPUnit)
- `DailyPinServiceTest`: generate deterministik per (outlet,date); verify benar/salah;
  rotate harian.
- `CashierVerifyLocationTest`: PIN benar + dlm radius → verified; PIN salah → fail;
  di luar radius → within_radius=false.

### Frontend (Vitest)
- `GeoPinVerify.test.tsx`: mock `navigator.geolocation` + `fetch`;
  - render input PIN + tombol
  - isi PIN 0000 + mock pos dlm radius → status 'ok'
  - PIN salah → status 'fail'
  - GPS deny → fallback verify PIN saja.

---

## Verifikasi (bukan klaim)
1. `php artisan test` → BE hijau (target +2 test class).
2. `npx vitest run` → FE hijau (+GeoPinVerify test).
3. `npm run build` → exit 0.
4. Browser: buka `/pos` → widget di pojok kanan atas; ketik PIN + verify → badge berubah.
5. `gh` push → CI Quality Gate hijau (Vitest/PHPUnit/Playwright/Secret Scan).

---

## Catatan Risiko
- `geo_radius_meters` default 50m — kasir di dalam gedung bisa gagal GPS. Fallback
  "PIN saja" mitigasi. Owner bisa naikkan radius di Pengaturan Outlet.
- PIN plaintext di layar owner = risiko rendah (session owner, bukan publik).
- Tidak memblokir transaksi (indikator) → aman untuk rollout bertahap.
