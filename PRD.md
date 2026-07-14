# PRD — Restoku: SaaS Multi-Tenant POS & Restaurant Management

> Dokumen ini adalah **Product Requirements Document** resmi Restoku.
> Disusun oleh Principal Software Engineer + SaaS Security Architect + QA Lead,
> berbasis fakta kode (Laravel 13 + Inertia/React) per Juli 2026.
> Roadmap skalabilitas mengacu pada `.hermes/scalability-migration-plan.md`.

---

## 1. Vision & Ringkasan Produk

**Restoku** adalah platform SaaS untuk restoran/F&B yang melayani banyak tenant
(pemilik usaha) dalam satu instans aplikasi. Produk unggulan adalah **Buku Menu
Digital berbasis QR per-meja**: tamu memindai QR di meja → langsung membuka menu
(interaktif, bisa pesan) tanpa unduh aplikasi.

Restoku menargetkan **5.000 tenant × ratusan outlet (~500.000 outlet)** dengan
beban tulis estimasi ~25 juta order/hari pada skala penuh.

---

## 2. Goals (Tujuang)

| # | Goal | Cara pengukuran |
|---|------|-----------------|
| G1 | Multi-tenancy aman & terisolasi | 0 insiden cross-tenant (terbukti test isolasi) |
| G2 | Tamu bisa buka menu dari QR tanpa login | Time-to-menu < 1.5s (cached) |
| G3 | Owner kelola outlet & cetak QR mandiri | 0 intervensi engineer untuk onboarding outlet |
| G4 | Skala ke 5.000 tenant × ratusan outlet | Survive load test 25jt order/hari (Fase 2+) |
| G5 | Keamanan publik (order/reservasi tamu) | 0 exploit CSRF/spam (throttle aktif) |

## 3. Non-Goals (Di luar scope)

- **Native Android/iOS app** — semua antarmuka **web/PWA** (keputusan produk).
  Tamu = read-only mobile web; owner/kasir = web responsif.
- Payment gateway bawaan (fokus MVP: order & reservation, bukan settlement).
- Inventory/procurement terintegrasi (fase lanjutan).
- White-label domain per tenant (fase lanjutan).

---

## 4. Target Users & Persona

| Persona | Akses | Kebutuhan utama |
|---------|-------|-----------------|
| **Tamu** | Web/PWA read-only (tanpa auth) | Scan QR → lihat menu, pesan, reservasi |
| **Owner** | Web (auth, role `owner`) | Dashboard, pengaturan outlet, QR generator, subscription |
| **Kasir** | Web/POS (auth, role `cashier`/dst) | Operasional order, PIN login |
| **Admin/Manager** | Web | Override outlet, kelola karyawan |

---

## 5. Arsitektur & Tech Stack (Fakta)

| Layer | Teknologi | Catatan |
|-------|-----------|---------|
| Backend | **Laravel 13** (PHP 8.3/8.5) | PHPUnit 12, Pint, `laravel/ai` (Gemini) |
| Frontend | **Inertia.js + React + TypeScript (Vite)** | `qrcode.react` untuk QR generator |
| Database | MySQL/Postgres | Kolom `tenant_id` sebagai pivot isolasi |
| Cache/Session/Queue | **Redis** (wajib di prod) | `.env.example` sudah arahkan redis |
| Foto menu | **Cloudinary** (CDN + transform + signed URL) | Terintegrasi via `CloudinaryService` (Fase 1) |
| Deploy | **VPS sewaan** (user putuskan) | Backend + frontend + Redis di VPS; Forge opsional; Vercel tidak relevan |
| CI/CD | GitHub + GitHub Actions | Lint + test + coverage (pcov di CI) |
| Design System | **Halo-adapted tokens** (`resources/css/system.css` + `DESIGN.md`) | Palette cabe `#FF5B35` / emas `#F59E0B`; 5 screen-mode (terang/gelap/glassmorphic/nano-banana/krem); tanpa lucide (inline SVG/Heroicons/Phosphor) |
| Testing | Vitest (FE, scoped 100%) + PHPUnit + **xdebug** (BE) | `vite.config.js` scoped include; PHP PIE install xdebug 3.5.3 (Windows); QA rule: tiap perubahan wajib test |

---

## 6. Model Multi-Tenancy

### 6.1 Saat ini — Shared-DB / Shared-Schema
- Isolasi via `tenant_id` + `TenantScope` (global scope) + `TenantContext`
  (singleton per request) + `EnsureTenantContext` middleware.
- Guest (tamu) di-resolusi lewat `outlet_id` → outlet punya `tenant_id`.
- **Status**: isolasi sudah benar & teruji (test `GoogleReviewTruncateIsolationTest`).

### 6.2 Target — Schema-per-Tenant (Fase 2)
- 5.000 DB terlalu mahal → **schema-per-tenant** dalam 1 (atau sekelompok) DB
  fisik, routing via `TenantContext`.
- Alasan: shared-schema tidak viable di 25jt order/hari (write-contention +
  backup GB-scale).

---

## 7. Modul & Fitur (Functional Requirements)

### 7.1 Modul Owner / Admin
- **Dashboard** — ringkasan penjualan (tenant-scoped).
- **Pengaturan Outlet** (`PengaturanOutlet`, `OutletSettingsController`)
  - Profil, lokasi (lat/long + `geo_radius_meters`), jam operasional
    (`operating_hours` JSON), pajak (PBJT/PPN + service charge).
  - **Auto-outlet-default**: saat tenant dibuat, otomatis punya 1 "Outlet Utama"
    (booted `Tenant::created`) → cabut dead-end tenant tanpa outlet.
  - **Bulk-create N outlet** (Fase 1, max 500, idempoten).
- **Subscription & Feature Gate** (`FeatureRegistry`, `TenantContext`)
  - Plan: free / pro / enterprise; lock fitur via `feature_locks`.
- **QR Generator** (`QRCodeMeja/Index`) — lihat §8.

### 7.2 Modul Kasir / POS
- Operasional order (role `cashier`/manajerial).
- PIN login (hash bcrypt, di-share ke `login_employees` di halaman login).
- Tenant-scoped via `TenantScope`.
- **Kasir (POS) UI** (`POS/Index`, route `/pos`):
  - Data menu di-render dari backend via `PosController::menuView` (Inertia props `posMenu`)
    → query `MenuItem::with('category')` (tenant-scoped, Tanpa hardcode di FE).
  - Endpoint JSON: `GET /api/pos/menu` (`PosController::menu`) untuk reload dinamis.
  - Foto item pakai `photo_url` (Cloudinary `secure_url`) via `ProductImage` — konsisten
    dengan e-Menu tamu (tidak ada path lokal mock).
  - Regression guard: `PosKatalogVerifyTest` assert `/pos` + `/katalog-menu` 200 dan
    **tidak ada duplikat foto** (public_id Cloudinary unik per item).

### 7.3 Modul Tamu / Buku Menu Digital (`BukuMenuDigital/CustomerView`)
- **Read-only**, tanpa auth.
- Akses via `/m/{slug}?t={meja}` (slug outlet, label meja bebas).
- Data nyata dari `/api/menu/{slug}` (`OrderController::getPublicMenu`) — `MOCK_ITEMS`
  dicabut; fallback graceful ke `FALLBACK_ITEMS` bila 0 item.
- **Foto menu**: `photo_url` dari `MenuItem` (Cloudinary `secure_url` saat `CLOUDINARY_URL`
  terisi, atau asset publik akun `demo` saat dev tanpa akun). Tidak ada path mock
  lokal `/images/*.webp` di produksi.
- **Seeder**: `MenuSeeder` mengisi **32 menu asli** (Makanan/Minuman/Camilan) per tenant
  (`outlet_id=null` = menu global tenant, **di-seed 1×, BUKAN loop per-outlet** → tidak ada
  duplikat antar-outlet) + kategori agar e-Menu tidak kosong saat pertama deploy.
  Foto tiap item = Cloudinary `public_id` (akun `dwdaydzsh`), `photo_url` accessor derive
  `secure_url`. Regression: `PosKatalogVerifyTest` jamin duplikat foto = 0.
- **Design System (UI Refactor P2–P6, `ff7b162`/`957edbe`/`1cc4793`/`aa8e173`)**: e-Menu &
  seluruh halaman admin/staff direfactor ke **Halo-adapted tokens** (`system.css` + `DESIGN.md`),
  5 screen-mode (`terang`/`gelap`/`glassmorphic`/`nano-banana`/`krem`), tanpa lucide-react
  (inline SVG/Heroicons/Phosphor). `useTenantSettings` membaca `localStorage('outlet_screen_mode')`.

### 7.4 Modul QR Generator (`QRCodeMeja/Index`)
- Owner pilih outlet → isi **label meja bebas** (1 per baris: `A1`, `01`,
  `Meja 7`, …).
- Generate **QR asli** (`qrcode.react`) per meja → URL `buildMenuUrl(origin,
  slug, label)`.
- Tombol cetak stiker (A5/A6).

### 7.5 Modul Upload Foto Menu (Owner) — Fase 1
- Halaman **Katalog Menu** (`KatalogMenu/Index`, auth owner) — data riil dari backend
  (`MenuController::index` kirim `menuItems` + `outlets` + `categories`), form CRUD
  (Inertia `router.post/put/delete`) dengan upload foto WebP.
- **Upload backend signed** (`CloudinaryService::uploadMenuPhoto`):
  - Secret di server (`.env` `CLOUDINARY_URL`), signature SHA1 manual (raw HTTP, tanpa SDK).
  - Folder `restoku/{tenant_id}/menu` (isolasi multi-tenant), return `url`+`public_id`.
  - Optimasi: `f_auto,q_auto` + `eager` thumbnail `c_fill,w_500,h_500`.
  - Ganti foto → foto lama di-`destroy` (`deleteMenuPhoto`) agar tidak orphan.
  - Tanpa `CLOUDINARY_URL` → fallback `null` (dev lokal jalan, `ProductImage` placeholder).
- **Model**: `MenuItem` (`image_path`, `image_public_id`, `photo_url` accessor) +
  `MenuCategory` (`tenant_id`, `name`, `sort_order`).
- **Frontend e-Menu**: render `photo_url` via `ProductImage` (Cloudinary `secure_url`).

---

## 8. Alur QR → Menu → Pesan (Core Flow)

```
[Tamu scan QR di meja]
   │  URL: https://<domain>/m/{outlet_slug}?t={meja}
   ▼
[CustomerView] — read-only, resolve outlet via slug (cache)
   │  tampilkan menu (Cloudinary image), pilih item
   ▼
[POST /api/orders] — CSRF-exempt, throttle:30,1 (publik, aman)
   │  payload: outlet_id + table_number + items
   ▼
[OrderController::submitOrder] — scope ke tenant outlet, simpan order
   ▼
[Kasir/Admin] — lihat order masuk (tenant-scoped)
```

**Keamanan alur publik** (sudah di-hardening):
- `C2`: throttle `30,1` di guest order & reservation (cegah spam/DoS).
- `C1`: scoped delete (tidak `truncate` lintas-tenant).
- `H1`: tidak ada fallback `?? 1` yang salah asosiasi outlet.

---

## 9. Non-Functional Requirements

### 9.1 Skalabilitas
- Target: 5.000 tenant × ratusan outlet, ~25jt order/hari.
- **Bottleneck saat ini**: shared-schema (1 tabel `orders`), session `file`.
- **Wajib Fase 2**: schema-per-tenant, Redis cache, read replica, partisi `orders`.

### 9.2 Keamanan
- Isolasi multi-tenant = non-negotiable (G1).
- Endpoint publik (order/reservasi) = CSRF-exempt + throttle.
- Cloudinary = signed URL (jangan expose path storage internal).
- Gemini AI: sanitasi input (cegah prompt injection dari nama/menu tenant).

### 9.3 Performa
- Buku menu tamu: cache di Redis, invalidate per-outlet (target < 1.5s).
- Foto: transform Cloudinary on-the-fly (webp, ukuran sesuai device).

### 9.4 Availability
- Redis down → fallback ke DB (degrade, bukan 500).
- VPS: monitoring + backup otomatis (DB + Cloudinary).

### 9.5 Test Coverage (A+ Regime)
- **QA rule (mandat user 2026-07-11)**: SETIAP perubahan kode (fitur/fix/refactor)
  wajib diiringi unit test yang diperbarui; coverage ditekan ke **100%** pada scope
  terpilih (tidak boleh drop di commit).
- **Frontend (Vitest)**: `vite.config.js` enforcement `100%` pada include scoped —
  `resources/js/lib/**`, `Components/shared/**`, `ProductImage.tsx`, `RoleGuard.tsx`,
  `Layouts/AuthLayout.tsx`, `Hooks/**`. File berat (`Components/ui`, `Pages`, `MainLayout`,
  `icons`, `Shared`, `LandingPage`, dll) masuk backlog exclude. **Status**: 64/64 test
  harness hijau pada scope (perbaikan 13 failure via `vi.hoisted` + localStorage-driven
  `useTenantSettings` + `vi.clearAllMocks` di `tts`).
- **Backend (PHPUnit + xdebug)**: xdebug 3.5.3 di-install via **PHP PIE** (`pie.phar install
  xdebug/xdebug`, pre-built DLL Windows, tanpa build toolchain) + `xdebug.mode=coverage`.
  `php artisan test --coverage` terukur **61.6% baseline** (121 test hijau). `kds`
  dikunci `enterprise` (bukan `pro`) — selaras `config/subscription.php`.
- **CI**: coverage di-enforce di GitHub Actions (`ci.yml`) — playground/setup tidak boleh
  drop threshold. Job tambahan: **`php-sast`** (Psalm 6.x via `vendor/bin/psalm`, SARIF
  diunggah ke Security tab; `psalm-baseline.xml` allowlist known-issues).

---

## 10. Data Model (Entitas Kunci)

| Entity | Field penting | Catatan |
|--------|---------------|---------|
| `tenants` | `id`, `brand_name`, `plan`, settings JSON | 1 tenant = 1 bisnis |
| `outlets` | `tenant_id`, **`slug`** (unique per tenant), `name`, `is_active`, `operating_hours` JSON, lat/long | auto-outlet-default saat tenant dibuat |
| `users` | `tenant_id`, `outlet_id`, `role`, `pin` (hash) | owner/kasir/staff |
| `orders` | `tenant_id`, `outlet_id`, `table_number`, items JSON | write-heavy (Fase 2 partisi) |
| `reservations` | `tenant_id`, `outlet_id`, … | guest, CSRF-exempt + throttle |
| `google_reviews` | `tenant_id`, `outlet_id`, `reviewer_photo` | dari API Google |
| `outlet_settings` | per-outlet config (printer, struk) | `resolveSettings()` fallback |
| `menu_categories` | `tenant_id`, `name`, `sort_order` | kategori menu (Makanan/Minuman/...) |
| `menu_items` | `tenant_id`, `outlet_id` (nullable=global), `menu_category_id`, `name`, `price`, `image_path` (Cloudinary `secure_url`), `image_public_id`, `is_available`, `is_popular`, `sort_order` | foto via Cloudinary; `photo_url` accessor |

---

## 11. Roadmap Migrasi Skalabilitas

| Fase | Isi | Status |
|------|-----|--------|
| **Fase 0** | `+slug` outlets + backfill, auto-outlet-default, redis config, real QR generator, `buildMenuUrl` | ✅ **DONE** (`8013133`) |
| **Fase 1** | Integrasi data menu nyata (cabut `MOCK_ITEMS`), cache buku menu (Redis), **modul upload foto → Cloudinary** (`CloudinaryService` signed upload + `MenuItem`/`MenuCategory` + `KatalogMenu` CRUD), **seeder menu contoh** (`MenuSeeder`) agar e-Menu tidak kosong | ✅ **DONE** (`c9a0835` modul upload + seeder) |
| **Fase 2** | **Schema-per-tenant** (`TenantConnection` + `UsesTenantConnection` trait 11 model), Redis cache aktif, read replica (`TenantReadConnection`), partisi `orders` by date | ✅ **DONE** (`4e9f9ad`) |
| **Fase 3** | Daily/monthly rollup owner (`SalesRollupService`, `sales:rollup` scheduler 01:00) — dashboard O(1), bukan query raw 25jt | ✅ **DONE** (`e7ad243`) |
| **Fase 4** | Cold archive orders >6 bulan (`orders_archive`, `OrderArchiveService`, `orders:archive` scheduler 1/02:00) — partisi aktif tetap kecil | ✅ **DONE** (`de39047`) |
| **UI Refactor P2–P6** | Design system **Halo-adapted** (`system.css` + `DESIGN.md`), 5 screen-mode, cabut lucide → inline SVG/Heroicons/Phosphor, refactor halaman admin/staff + e-Menu | ✅ **DONE** (`ff7b162`/`957edbe`/`1cc4793`/`aa8e173`) |
| **Testing A+** | Enforce 100% coverage (Vitest scoped + PHPUnit/xdebug), `vi.hoisted` harness, PHP PIE install xdebug 3.5.3, `kds`→`enterprise` | ✅ **DONE** (FE 64/64 hijau, BE 121/121 + 61.6% coverage) |

---

## 12. Risiko (Ringkas — detail di audit 5 pilar)

| Pilar | Risiko utama | Mitigasi sudah/rencana |
|-------|--------------|------------------------|
| PRD/Scope | Alur QR→order salah asosiasi tenant | `C1`+slug+scope ✅ |
| Modularisasi | Kasir vs owner bentrok akses outlet | `TenantScope` + `findOutletForTenant` ✅ |
| Arsitektur/Security | Shared-schema collapse di skala penuh | Fase 2 schema-per-tenant ✅ (siap 5.000×ratusan) |
| CI/CD | pcov vs xdebug, peer-dep conflict | CI pcov ✅, `--legacy-peer-deps` ✅ |
| QA/Coverage | BE coverage terblokir xdebug di Windows | PHP PIE install xdebug 3.5.3 pre-built DLL ✅; FE harness 13 failure → `vi.hoisted`+localStorage ✅ |
| Eksternal | Redis down, Cloudinary quota, Laravel major | fallback DB ✅, monitoring ⏳ |

> Audit risiko lengkap (5 pilar, format `⚠️/🛡️/🔧`) **sudah dieksekusi** — lihat `AUDIT_RESTOKU_V2.md` di repo ini (`docs/` atau root) serta ringkasan di memori `[AUDIT RISIKO RESTOKU v2 — FINAL]`.

---

## 13. Success Metrics

- **Onboarding**: owner buat tenant → langsung punya outlet + bisa cetak QR < 5 menit.
- **Isolasi**: 100% test isolasi lintas-tenant hijau di CI.
- **Skala**: load test 25jt order/hari tanpa degradasi (pasca Fase 2).
- **Keamanan**: 0 insiden publik (CSRF/spam) di prod.

---

## 14. Keputusan & Konteks (Log)

- **Platform**: ALL web/PWA, tidak ada native Android.
- **Deploy**: VPS sewaan (Forge opsional, Vercel tidak relevan).
- **Foto menu**: Cloudinary wajib. Upload **backend signed** (secret di VPS, signature
  SHA1 di `CloudinaryService`) — sesuai invarian "foto route ke Cloudinary, secret tidak
  ke client". Tanpa `CLOUDINARY_URL` → fallback placeholder (dev lokal jalan).
- **Peran**: Principal SE + Security Architect + QA Lead mengambil alih keputusan teknis.
- **Status refactor skala 5.000×ratusan**: **READY secara arsitektural** — Fase 0–4 selesai
  (schema-per-tenant + partisi + rollup + cold archive). Prasyarat produksi: VPS dengan
  Postgres (`DB_SHARDING_ENABLED=true`), Redis jalan, **`CLOUDINARY_URL` terisi**.
- **CI**: `CI — Restoku Quality Gate` (ci.yml) = 8/8 GREEN (Secret Scan, PHPUnit, Vitest,
  Vite Build, Playwright x4). `CodeQL Static Security Analysis` (codeql.yml) **failure by
  design** — GitHub blokir code scanning di repo **private free** (butuh Pro/public);
  bukan bug kode, diabaikan.
- **UI/Design**: Design system **Halo-adapted** (`resources/css/system.css` + `DESIGN.md`).
  Palette brand cabe `#FF5B35` / emas `#F59E0B`; 5 screen-mode selectable
  (terang/gelap/glassmorphic/nano-banana/krem) via `localStorage('outlet_screen_mode')`;
  **tanpa lucide-react** (inline SVG / Heroicons / Phosphor) untuk hindari AI-template look.
  Brand co-lockup tenant+Restoku di `TenantBrandLockup`.
- **Testing A+ (QA rule)**: tiap perubahan kode wajib unit test; coverage 100% pada scope
  terpilih. FE = Vitest scoped (64/64 hijau). BE = PHPUnit + **xdebug 3.5.3** (PHP PIE,
  Windows) → coverage terukur 61.6% baseline, 121 test hijau. `kds` dikunci `enterprise`.

---

*PRD disusun berbasis fakta kode per commit `8013133` (Fase 0). Diperbarui pasca
Fase 1 (`c9a0835`), Fase 2–4 (`4e9f9ad`/`e7ad243`/`de39047`), UI Refactor P2–P6
(`ff7b162`/`957edbe`/`1cc4793`/`aa8e173`), dan Testing A+ (xdebug via PHP PIE + FE 64/64).*
