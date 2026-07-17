# Restoku — GOLDEN RULES v3.0
### *Aturan besi tim Restoku. Dibaca SEBELUM bilang "done" / "selesai" / "verified".*

> Setiap aturan di sini lahir dari bug nyata yang lolos ke production atau hampir lolos.
> Pelanggaran = bug production. Bukan sekedar rekomendasi — ini **WAJIB**.
> *Dokumen ini hidup. Setiap pelanggaran baru = tambah 1 baris.*

**Versi:** 3.0 | **Terakhir diperbarui:** 2026-07-17
**Sumber:** Sesi 2026-07-15 + 2026-07-17 + Audit Menyeluruh 2026-07-17

---

## 📜 DAFTAR ISI

1. [THE #1 RULE — Jangan Klaim Kosong](#-the-1-rule--jangan-klaim-kosong-buktikan)
2. [Render di Browser Sungguhan](#-render-di-browser-sungguhan-bukan-cuma-build)
3. [Verifikasi Lintas Origin](#-verifikasi-lintas-origin-untuk-public-ui)
4. [Server-Driven State untuk Public UI](#-server-driven-state-untuk-public-ui)
5. [Import Helper Sebelum Pakai](#-import-helper-sebelum-pakai)
6. [Multi-Tenancy — TenantScope Wajib](#-multi-tenancy--tenantscope-wajib) ← **BARU**
7. [Code Quality Frontend](#-code-quality-frontend) ← **BARU**
8. [Data Estimasi Wajib Diberi Label](#-data-estimasi-wajib-diberi-label) ← **BARU**
9. [Inertia Fetch — Header + Array Guard](#-inertia-fetch--header--array-guard)
10. [Verifikasi Shape API](#-verifikasi-shape-api-via-session-segar)
11. [API Contract & Response Format](#-api-contract--response-format) ← **BARU**
12. [Single Responsibility — Jangan God Files](#-single-responsibility--jangan-god-files) ← **BARU**
13. [Keamanan & Secrets](#-keamanan--secrets)
14. [MENU_BASE_URL & Deployment](#-menu_base_url--deployment)
15. [Test Coverage](#-test-coverage--bukan-angka-kosong)
16. [Checklist Sebelum Done](#-checklist-sebelum-done-fe--public-ui)
17. [Hutang Teknis Aktif](#-hutang-teknis-aktif) ← **BARU**

---

## 🔴 THE #1 RULE — JANGAN KLAIM KOSONG, BUKTIKAN

> "jangan pernah klaim kosong tapi BUKTIKAN itu sudah golden rules kita!"
> — Owner, 2026-07-15

Klaim `"done"`, `"100%"`, `"works"`, `"no error"`, `"sudah konsisten"` **TANPA artifacts verifikasi nyata**
adalah pelanggaran fatal. Bukti = output tool sungguhan (curl/Playwright/test), bukan narasi.

| DONT'T ❌ | DO ✅ |
|---|---|
| Bilang "done" tanpa artefak | Jalankan verifikasi, tempel output asli |
| Bilang "tema sudah sama di HP & desktop" tanpa render | Render BENAR-BENAR di kedua origin, screenshot + console capture |
| Bilang "0 error" tanpa jalanin browser | Capture `pageerror` + `console.error` via Playwright |
| Percaya stale flag / cache lama | Re-run command di turn ini, buat artifact segar |
| Klaim angka laba/rugi akurat tanpa data nyata | Sertakan flag `is_estimate` di response + tampilkan badge di UI |

---

## 🟠 DO — RENDER DI BROWSER SUNGGUHAN (BUKAN CUMA BUILD)

`npm run build` GREEN **TIDAK** berarti aplikasi jalan. Build cuma bundling — tidak mengeksekusi.

**Bukti nyata sesi ini:** `usePage is not defined` — `npm run build` PASS (Vite tidak cek undefined
global), tapi runtime **crash di kedua origin**. Ketahuan HANYA setelah Playwright render.

| DONT'T ❌ | DO ✅ |
|---|---|
| Anggap `BUILD=0` = fitur jalan | Render headless Chromium, capture console + screenshot |
| Cek cuma API JSON (`curl /api/menu`) | Cek HALAMAN (`/m/{slug}`) render + interaktif |
| Pakai context fresh Playwright (no cache) | **Pre-seed localStorage terbalik** untuk ngetes override server beneran |
| Stop di `npm run lint` | Lint + Build + **Render** = 3 gate wajib |

### Script verifikasi standar (dual-origin)
```bash
# 1. Lint + Build
npx eslint resources/js/Pages/BukuMenuDigital/CustomerView.tsx
npm run build

# 2. Render sungguhan di LOCALHOST + CLOUDFLARE, capture console error
node scripts/verify_render.mjs
#   - localStorage di-pre-seed 'terang' (light) -> buktikan override ke 'nano-banana'
#   - assert: hasTitle>0, hasTambah>0, lsMode==='nano-banana', 0 pageerror
#   - screenshot fullPage -> vision_analyze konfirmasi dark/light
```

---

## 🟠 DO — VERIFIKASI LINTAS ORIGIN UNTUK PUBLIC UI

e-Menu (`/m/{slug}`) diakses dari **HP via cloudflare tunnel** DAN **desktop via localhost**.
Satu origin hijau ≠ dua-duanya hijau.

| DONT'T ❌ | DO ✅ |
|---|---|
| Cek cuma localhost | Cek BOTH: `http://localhost:8000/m/{slug}` + `https://<tunnel>.trycloudflare.com/m/{slug}` |
| Asumsi tema sama karena kode sama | Render dua-duanya, bandingkan screenshot visual |
| Lupa `trustProxies` di cloudflare | Tunnel butuh `trustProxies('*')` supaya asset `https://` (no mixed-content) |

**Root cause nyata (2026-07-15):** `localStorage` itu **per-origin**. HP cache `nano-banana`,
localhost cache `terang` → tampilan BEDA padahal kode sama. Fix: state publik HARUS server-driven.

---

## 🟡 DO — SERVER-DRIVEN STATE UNTUK PUBLIC UI

Public UI (e-Menu tamu) tidak boleh bergantung `localStorage` per-origin.

| DONT'T ❌ | DO ✅ |
|---|---|
| Simpan tema/brand di `localStorage` tamu | Kirim dari controller (`outlet_settings.screen_mode`) |
| Baca tema dari `usePage().props` padahal route cuma kirim `slug` | Ambil dari **API response** (`/api/menu` → `screen_mode`) |
| Cache-nya jadi source-of-truth | API response = source-of-truth, localStorage cuma fallback offline |

```php
// PublicOrderController::getPublicMenu — kirim tema dari DB
'screen_mode' => $outlet->settings?->screen_mode ?? 'nano-banana', // fallback standar brand
```

```ts
// CustomerView — override localStorage DENGAN nilai server
if (data?.screen_mode) {
  localStorage.setItem('outlet_screen_mode', data.screen_mode);
  localStorage.setItem('tenant_layout', data.tenant_layout ?? data.screen_mode);
}
```

---

## 🟡 DO — IMPORT HELPER SEBELUM PAKAI

`ReferenceError: X is not defined` (usePage, icon, dsb) = class error nomor 1 di Restoku FE.

| DONT'T ❌ | DO ✅ |
|---|---|
| Pakai `usePage()` tanpa `import { usePage } from '@inertiajs/react'` | Import DULU, lalu pakai |
| Pakai `<Pencil>` padahal nama `PencilIcon` | Cek `Components/icons.tsx`, import nama persis |
| Percaya build hijau | Render browser = ketahuan ReferenceError |
| Import dari `Components/Shared` untuk kode baru | Import langsung dari `Components/shared/Button`, `lib/formatters`, dsb. |

> **Catatan:** `Components/Shared.tsx` adalah **compatibility shim** yang akan dihapus. Kode baru WAJIB import dari path baru.

---

## 🔵 DO — MULTI-TENANCY: TENANTSCOPE WAJIB

Restoku adalah **shared-database, multi-tenant**. Satu bug isolasi = data tenant lain bocor = GDPR violation.

| DON'T ❌ | DO ✅ |
|---|---|
| Query langsung `Model::where(...)` tanpa scope | Selalu via model yang punya `TenantScope` global scope |
| Pakai `Auth::user()->tenant_id` tersebar di controller | Inject `TenantContext` + pakai `$ctx->id()` |
| `withoutGlobalScope(TenantScope::class)` sembarangan | Hanya di service terpercaya, SELALU tambahkan filter `tenant_id` eksplisit |
| Tambah model baru tanpa `UsesTenantConnection` trait | Semua model tenant-scoped WAJIB pakai trait ini |
| `TenantContext::id()` dipanggil sebelum middleware | Pastikan route masuk dalam group `['auth', 'tenant']` |
| Lupa filter `tenant_id` di artisan command/queue job | Command wajib panggil `$ctx->setTenantId($id)` sebelum query apapun |

**Model yang wajib pakai TenantScope:**
`MenuItem, MenuCategory, Order, OrderItem, Outlet, User, Reservation, GoogleReview, ReceiptConfig, PrintJob, AuditLog, SalesDailyRollup, SalesMonthlyRollup, OrderArchive`

---

## 🔵 DO — CODE QUALITY FRONTEND

Temuan dari Audit 2026-07-17. God Component dan hardcoded mock data adalah sumber bug terbesar.

| DON'T ❌ | DO ✅ |
|---|---|
| File > 300 baris dengan logika + render + data | Pisah: `Page/Index.tsx` (layout), `components/`, `hooks/` |
| Hardcode data dummy langsung di komponen | Pisah ke `lib/mock/<namaDomain>.ts`, beri flag `USE_REAL_API` |
| 2+ definisi komponen dalam 1 file | 1 file = 1 komponen utama |
| `any` type di TypeScript untuk data API | Definisikan interface di `Types/index.ts`, gunakan konsisten |
| `featureLocks[i.name]` — key = display name | Gunakan ID stabil/slug, bukan display name yang bisa berubah |
| Tidak ada skeleton loader di halaman async | Gunakan `<SkeletonCard>` / `<SkeletonTable>` dari `Components/shared/` |
| 2 halaman untuk hal yang sama (Index.tsx + OwnerDashboard.tsx) | Konsolidasikan ke 1 halaman/route yang jelas |

**Batas ukuran file:**
| Tipe File | Max Baris |
|-----------|-----------|
| Page component | 200 baris |
| Sub-component | 150 baris |
| Hook | 100 baris |
| Controller | 5 public method |

**Refactor pattern wajib untuk dashboard:**
```
Pages/Dashboard/
├── Index.tsx           ← hanya wiring props + layout (max 100 baris)
├── components/
│   ├── RevenueChart.tsx
│   ├── KpiCard.tsx
│   └── ProductTable.tsx
└── hooks/
    └── useDashboardData.ts  ← fetch + transform data
```

---

## 🔵 DO — DATA ESTIMASI WAJIB DIBERI LABEL

Backend menggunakan benchmark industri (COGS 35%, OpEx 20%) untuk estimasi laba. Data ini BUKAN data nyata.

| DON'T ❌ | DO ✅ |
|---|---|
| Tampilkan angka laba/rugi tanpa keterangan | Tambahkan badge `~ Estimasi` di semua KPI keuangan |
| `is_estimate: true` dari backend diabaikan UI | UI HARUS cek `is_estimate` dan render label visual |
| Gunakan benchmark global untuk semua tenant | Simpan `cogs_benchmark` + `opex_benchmark` di `tenant_settings` |

```tsx
// Wajib di setiap KPI keuangan:
{metrics.is_estimate && (
  <span className="text-[10px] text-amber-400 border border-amber-500/30 px-1.5 py-0.5 rounded">
    ~ Estimasi
  </span>
)}
```

```php
// Backend: selalu sertakan flag
return [
    'net_profit'   => $net,
    'is_estimate'  => true,   // ← WAJIB, UI harus render label
    'note'         => 'COGS dan OpEx berdasarkan benchmark industri (35%/20%).',
];
```

---

## 🔵 DO — INERTIA FETCH: HEADER + ARRAY GUARD (root cause crash `T.map`)

`fetch()` ke route di `web.php` DARI dalam Inertia app **TANPA** header `X-Requested-With` →
middleware Inertia balas **409 / redirect HTML** (bukan JSON). `response.json()` gagal/empty →
state jadi non-array → `.map`/`.filter` crash (`TypeError: T.map is not a function`).

**Bukti nyata (2026-07-17):** tab "Antrean Siap Bayar" crash karena `fetchServedQueue` panggil
`/api/cashier-queue` tanpa header → `servedQueue` non-array → `.map` di grid kartu.
Ketahuan HANYA setelah Playwright render sesi kasir (bukan dari nebak).

| DONT'T ❌ | DO ✅ |
|---|---|
| Panggil `fetch('/api/...')` polos dalam Inertia app | Header `{Accept:'application/json','X-Requested-With':'XMLHttpRequest'}` |
| Asumsi `data.queue` selalu array | Guard: `setX(Array.isArray(data?.queue) ? data.queue : [])` |
| `.map()`/`.filter()` langsung ke response API | Wrap: `(Array.isArray(x) ? x : []).map(...)` |
| Percaya `response.ok` = JSON benar | `if (response.ok) { const d = await response.json(); ... }` + `try/catch` |
| Guard cuma di 1 tempat | Guard DI MANA PUN ada `.map`/`.filter` ke data `fetch` (render + helper seperti `calculateOrderTotal`) |

**Exception:** `BukuMenuDigital/Index.tsx` fetch publik pakai `X-Inertia: false` (konteks e-Menu publik).
Tapi di full Inertia app (`/pos`, `/kds`, `/waiter-bar`) **SELALU** pakai `X-Requested-With`.

**Cache + Array (root cause flicker):** endpoint yg di-poll frontend (`/api/cashier-queue`)
pakai `Cache::remember` → saat cache HIT, collection ter-deserialize jadi **OBJECT** (bukan
sequential array) → `Array.isArray` gagal → flicker isi↔kosong.
FIX backend: `array_values($q->toArray())` (selalu sequential array di JSON).

---

## 🔵 DO — VERIFIKASI SHAPE API PAKAI SESSION SEAGAR

Jangan percaya curl pakai cookie lama (`ck.txt`) → `{"message":"Unauthenticated."}` →
shape tidak terverifikasi → guard salah sasaran / crash lolos.

| DONT'T ❌ | DO ✅ |
|---|---|
| curl `-b ck.txt` (kadaluarsa) lalu nebak shape | Re-login via Playwright (PIN/email) → fetch asli → cetak `typeof`/`Array.isArray` |
| Asumsi `items` = array of object | Probe di browser: `itemsIsArray`, `type` — kasir queue = **array of STRING** |
| Tulis guard berdasar tebakan | Tulis guard defensif + **buktikan shape asli dulu** |

**Bukti:** `/api/cashier-queue` kasir → `items:["1x Ayam Goreng..."]` (**STRING**, bukan object).
Guard `item.startsWith('+')` aman karena string. Tapi `order.items` di tempat lain bisa object —
**selalu handle both** (robust render) atau guard `Array.isArray`.

**Gotcha RoleGuard saat repro:** `activeKaryawan.token` harus match `/^.+_.+_auth_ok$/`
(**2 underscore**). Token `x_auth_ok` (1 underscore) → RoleGuard **deny** kasir.
Saat simulasi staff di Playwright: `token: 'sess_' + Date.now() + '_auth_ok'`.

---

## 🟣 DO — MENU_BASE_URL = SERVER-INJECTED (bukan VITE bake)

Frontend QR (`QRCodeMeja`, `BukuMenuDigital`) baca `props.menu_base_url`
(dari `config('app.menu_base_url')` ← `env('MENU_BASE_URL')`), **BUKAN** `import.meta.env.VITE_*`.

| DONT'T ❌ | DO ✅ |
|---|---|
| `npm run build` ulang tiap ubah MENU_BASE_URL | Cukup edit `.env` + restart `php artisan serve` (+ `php artisan config:clear`) |
| Hardcode localhost di QR | `.env` `MENU_BASE_URL=https://<tunnel>.trycloudflare.com` |
| Commit `.env` | `.env` gitignored — set manual/di-shell |

**Verifikasi:** `curl /login | grep menu_base_url` → harus = URL tunnel.
`buildMenuUrl(base, slug, table)` → `${base}/m/${slug}?t=${table}` (base = prop tsb).

---

## 🟣 DO — VERCEL ≠ RESTOKU (full-stack Laravel)

Restoku = Laravel + MySQL/SQLite + Redis + queue worker (stateful).
Vercel TIDAK bisa jalanin PHP/Laravel, scheduler, Redis.

| DONT'T ❌ | DO ✅ |
|---|---|
| Deploy Restoku ke Vercel | Preview publik = **cloudflared** tunnel ke localhost:8000 |
| | Production = **VPS sewaan** (Forge opsional, Vercel tdk relevan) |
| Pakai ngrok (sering `ERR_NGROK_334` stuck di host ini) | cloudflared quick tunnel (account-less, URL acak tiap restart) |

**Script runnable:** `scripts/dev-cloudflared-live.sh`
(tunnel + sync `MENU_BASE_URL` ke `.env` + restart serve + verify prop).
Install cloudflared: download `cloudflared-windows-amd64.exe` dari GitHub release → symlink ke `~/bin`.

---

## 📋 CHECKLIST SEBELUM "DONE" (FE / Public UI)

### Gate Syntax & Build
- [ ] `npx eslint <file>` → 0 errors
- [ ] `php -l <controller>` → No syntax errors
- [ ] `npm run build` → GREEN

### Gate Runtime Verification
- [ ] **Playwright render localhost** → `0 pageerror`, elemen kritis muncul
- [ ] **Playwright render cloudflare** → `0 pageerror`, TAMPILAN SAMA dengan localhost
- [ ] localStorage pre-seed terbalik → override server terbukti
- [ ] Screenshot visual di-`vision_analyze` → konfirmasi tema/bukan error

### Gate API & Data
- [ ] **Setiap `fetch` internal Inertia pakai header `X-Requested-With` + `Accept: application/json`**
- [ ] **Setiap `.map`/`.filter` ke data `fetch` di-guard `Array.isArray`**
- [ ] **Shape API diverifikasi via session segar** (bukan cookie kadaluarsa)
- [ ] Jika ada `is_estimate: true` → UI menampilkan badge `~ Estimasi`

### Gate Multi-Tenancy
- [ ] Model baru: sudah pakai `UsesTenantConnection` trait?
- [ ] Endpoint baru: dalam group `['auth', 'tenant']`?
- [ ] `withoutGlobalScope` baru: ada filter `tenant_id` eksplisit?

### Gate Testing
- [ ] `php artisan test` relevant filter → PASS
- [ ] `vitest run` (relevant) → PASS — laporkan angka riil, sebut file di-exclude
- [ ] Endpoint baru ada test isolasi multi-tenant (2 tenant, row=0 dari tenant lain)

### Gate Code Quality
- [ ] File tidak melebihi batas ukuran (200 baris page, 150 sub-component, 5 method controller)
- [ ] Tidak ada `any` type baru di TypeScript untuk data API kritis
- [ ] Kode baru import dari path baru, bukan dari `Components/Shared` shim
- [ ] Mock data yang baru tidak disematkan langsung di komponen (pisah ke `lib/mock/`)

### Gate Deployment
- [ ] Public tunnel = **cloudflared** (bukan ngrok)
- [ ] `MENU_BASE_URL` + `APP_URL` = URL tunnel aktif
- [ ] (Kalau ubah `MENU_BASE_URL`) restart `php artisan serve`, verify `curl /login | grep menu_base_url`

### Gate Final
- [ ] Commit message berisi BUKTI: contoh `"fix: kasir queue crash [verified: 0 pageerror, screenshot attached]"`

---

## 📌 HUTANG TEKNIS AKTIF

Temuan yang belum di-fix — wajib diselesaikan sebelum production launch:

| ID | Temuan | Severity | File | Status |
|----|--------|----------|------|--------|
| T-01 | `GeminiAiController` belum sanitasi prompt injection | 🔴 HIGH | `GeminiAiController.php` | OPEN |
| T-02 | Redis monitoring (Prometheus/Grafana) belum setup | 🟡 MEDIUM | VPS/infra | OPEN |
| T-03 | `Dashboard/Index.tsx` god component 1.349 baris | 🔴 HIGH | `Pages/Dashboard/Index.tsx` | OPEN |
| T-04 | 2 dashboard owner (Index.tsx vs OwnerDashboard.tsx) tidak konsisten | 🔴 HIGH | kedua file | OPEN |
| T-05 | `Components/Shared.tsx` shim belum dimigrasikan | 🟡 MEDIUM | `Components/Shared.tsx` | OPEN |
| T-06 | `OwnerDashboardController` menangani 12 endpoint (SRP violation) | 🟡 MEDIUM | `OwnerDashboardController.php` | OPEN |
| T-07 | `is_estimate: true` tidak ditampilkan ke UI | 🔴 HIGH | `OwnerDashboard.tsx`, `Index.tsx` | ✅ CLOSED (fix 2026-07-17, commit 047e4fe, badge `~Estimasi`) |
| T-08 | `featureLocks` pakai display name sebagai key (bisa silently break) | 🟡 MEDIUM | `MainLayout.tsx` | OPEN |
| T-09 | Tidak ada `<SkeletonCard>` / `<SkeletonTable>` di halaman async | 🟢 LOW | semua halaman laporan | OPEN |
| T-10 | `any` type di `MainLayout.tsx` untuk data reservasi L198 | 🟡 MEDIUM | `MainLayout.tsx` | ✅ CLOSED (fix H-3 2026-07-17, `Types/reservation.ts` + cast `as Reservation[]`) |
| T-11 | Sharding Fase 2 (schema-per-tenant) | 🔴 HIGH→✅ | `TenantConnection.php`, migrasi `tenant/*` | ✅ CLOSED (2026-07-17, commit `eb1395e`): 9 bug fix, CI `sharding-postgres` GREEN, 7 passed/2 skipped Docker Postgres. Aktif saat `DB_SHARDING_ENABLED=true` + Postgres |

> **T-03 / T-04 status**: DEFERRED (bukan OPEN-critical). Refaktor god-component `Dashboard/Index.tsx` **DITUNDA** sampai data nyata API siap (user: "biarkan staged, tunggu data nyata"). Badge estimasi (T-07) sudah CLOSED — KPI tetap tampil estimasi saat `is_estimate: true`.

*Tutup setiap item dengan PR + bukti fix (screenshot/test output) + tanggal.*

---

*Dokumen ini hidup. Setiap pelanggaran yang lolos ke production = tambah 1 baris di sini.*
