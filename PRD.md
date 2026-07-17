# PRD — Restoku: SaaS Multi-Tenant POS & Restaurant Management

> Dokumen ini adalah **Product Requirements Document** resmi Restoku.
> Disusun berbasis fakta kode (Laravel 13 + Inertia/React) per Juli 2026.
> **Versi 2.0** — diperbarui pasca Audit Menyeluruh 2026-07-17 + integrasi fitur UR-Hub.
> Roadmap skalabilitas mengacu pada `.hermes/scalability-migration-plan.md`.

---

## 1. Vision & Ringkasan Produk

**Restoku** adalah platform SaaS all-in-one untuk restoran/F&B yang melayani banyak tenant
(pemilik usaha) dalam satu instans aplikasi. Produk unggulan adalah **Buku Menu Digital berbasis
QR per-meja**: tamu memindai QR di meja → langsung membuka menu (interaktif, bisa pesan) tanpa
unduh aplikasi.

Restoku menargetkan **5.000 tenant × ratusan outlet (~500.000 outlet)** dengan beban tulis
estimasi ~25 juta order/hari pada skala penuh.

**Positioning:** Setara fitur dengan platform seperti UR-Hub — meliputi manajemen menu, laporan
penjualan real-time, analitik multi-outlet, manajemen staf & shift, reservasi, inventaris, dan
sistem cashier — namun dengan **arsitektur SaaS multi-tenant** yang lebih kuat untuk skala besar.

---

## 2. Goals

| # | Goal | Cara pengukuran |
|---|------|-----------------|
| G1 | Multi-tenancy aman & terisolasi | 0 insiden cross-tenant (terbukti test isolasi) |
| G2 | Tamu bisa buka menu dari QR tanpa login | Time-to-menu < 1.5s (cached) |
| G3 | Owner kelola outlet & cetak QR mandiri | 0 intervensi engineer untuk onboarding outlet |
| G4 | Skala ke 5.000 tenant × ratusan outlet | Survive load test 25jt order/hari (Fase 2+) |
| G5 | Keamanan publik (order/reservasi tamu) | 0 exploit CSRF/spam (throttle aktif) |
| G6 | Dashboard Owner setara UR-Hub | Semua widget utama terisi data nyata dari backend |
| G7 | Laporan keuangan & operasional per-outlet | Laba/rugi, food cost, void report tersedia real-time |

## 3. Non-Goals (Di luar scope)

- **Native Android/iOS app** — semua antarmuka **web/PWA**. Tamu = read-only mobile web; owner/kasir = web responsif.
- Payment gateway bawaan (fokus MVP: order & reservation, bukan settlement).
- White-label domain per tenant (fase lanjutan).

---

## 4. Target Users & Persona

| Persona | Akses | Kebutuhan utama |
|---------|-------|-----------------|
| **Tamu** | Web/PWA read-only (tanpa auth) | Scan QR → lihat menu, pesan, reservasi |
| **Owner** | Web (auth, role `owner`) | Dashboard konsolidasi multi-outlet, laporan keuangan, subscription |
| **Manager** | Web (auth, role `manager`) | Kelola staf, shift, monitoring outlet tunggal |
| **Kasir** | Web/POS (auth, role `cashier`) | Operasional order harian, sesi kasir, PIN login |
| **Waiter** | Web (auth, role `waiter`) | Antrean pesanan, serve order |
| **Kitchen/KDS** | Web (auth, role `kitchen`) | Monitor pesanan dapur |

---

## 5. Arsitektur & Tech Stack (Fakta)

| Layer | Teknologi | Catatan |
|-------|-----------|---------|
| Backend | **Laravel 13** (PHP 8.3/8.5) | PHPUnit 12, Pint, `laravel/ai` (Gemini) |
| Frontend | **Inertia.js + React + TypeScript (Vite)** | `qrcode.react` untuk QR generator |
| Database | MySQL/Postgres | Kolom `tenant_id` pivot isolasi (shared-schema); Fase 2 `TenantConnection` schema-per-tenant aktif di Postgres |
| Cache/Session/Queue | **Redis** (wajib di prod) | Session, menu cache, pub/sub |
| Foto menu | **Cloudinary** (CDN + transform + signed URL) | `CloudinaryService` backend-signed |
| Deploy | **VPS sewaan** | Backend + frontend + Redis; Forge opsional; Vercel TIDAK relevan |
| CI/CD | GitHub Actions | Lint + test + coverage (pcov di CI) + Psalm SAST |
| Design System | **Halo-adapted tokens** (`system.css` + `DESIGN.md`) | Palette cabe `#FF5B35` / emas `#F59E0B`; 5 screen-mode |
| Testing | Vitest (FE, scoped 100%) + PHPUnit + xdebug | 242/242 FE hijau, 469/469 BE hijau (2026-07-17) |

---

## 6. Model Multi-Tenancy

### 6.1 Saat ini — Shared-DB / Multi-Tenant (Fase 2 code-ready, AKTIF hanya di Postgres)
- Isolasi via `tenant_id` + `TenantScope` (global scope) + `TenantContext` (singleton per request) + `EnsureTenantContext` middleware.
- Guest (tamu) di-resolusi lewat `outlet_id` → outlet punya `tenant_id`.
- **Fase 2 code-ready + TERUJI**: `TenantConnection` + `UsesTenantConnection` trait (**15 model**) — schema-per-tenant **AKTIF & teruji di CI Postgres** (job `sharding-postgres`), fallback shared-schema di sqlite/test lokal. `TenantConnection::isSharded()` return `false` saat driver `sqlite`. Prasyarat aktivasi prod: VPS + Postgres.
- **Ulasan Google = Places API** (bukan Business Profile OAuth, yang gated/quota-0). `PlaceIdResolver::resolve(link Maps)` → `outlets.google_place_id` → fetch live + cache Redis 24j. Reply LOKAL via Groq (3 template hardcoded dihapus; `generateAiReply` return error kalau Groq gagal). Prasyarat: `GOOGLE_PLACES_API_KEY` + `GROQ_API_KEY`.
- **Login Owner**: rencana `Masuk dengan Google` via Laravel Socialite (owner lupa password → Gmail, bukan reset email). Plan drafted; Socialite NOT installed. `.env MAIL_MAILER=log` → email-reset tidak bisa kirim, jadi OAuth = recovery path preferensi.
- **Status**: isolasi sudah benar & teruji (test `GoogleReviewTruncateIsolationTest`, `MenuIsolationTest`, `SchemaIsolationTest`).

### 6.2 Target — Skala 5.000 Tenant
- Redis session wajib (`SESSION_DRIVER=redis`), read replica aktif (`TenantReadConnection`).
- Partisi `orders` by date untuk write-heavy 25jt/hari.
- Daily/monthly rollup (`SalesRollupService`) — dashboard O(1), bukan query raw.

---

## 7. Modul & Fitur (Functional Requirements)

### 7.1 Modul Owner — Dashboard & Analitik

Dashboard owner adalah **pusat komando** untuk pemantauan multi-outlet real-time.

**Widget & KPI (target setara UR-Hub):**
- **Total Pendapatan Global** — konsolidasi semua outlet, per timeframe (hari/minggu/semester/tahun)
- **Okupansi & Rotasi Meja** — meja aktif, rata-rata waktu tempuh
- **Food Cost Percentage** — HPP vs harga jual, alert jika > 30%
- **Laba Kotor & Bersih** — dengan flag `is_estimate: true` + badge `~ Estimasi` di UI (wajib per Golden Rules)
- **Peringkat Cabang** (Leaderboard) — top revenue generators, growth vs periode lalu
- **Radar Audit & Peringatan** — anomali finansial, lonjakan void, penurunan omset ekstrem
- **Produk Terlaris** — top items per outlet/global, volume & revenue
- **Jam Ramai Order** (Peak Hours heatmap) — distribusi pesanan per jam

> ⚠️ **Hutang Teknis T-03, T-04** (OPEN) + **T-07** (✅ CLOSED 2026-07-17, commit 047e4fe — badge `~Estimasi` sudah tampil): Dashboard saat ini masih menggunakan data hardcoded
> di `Dashboard/Index.tsx` (1.349 baris). Wajib direfaktor menjadi komponen terpisah + data
> nyata dari `OwnerDashboardService`. KPI keuangan dengan `is_estimate: true` wajib diberi
> badge `~ Estimasi` di UI.

### 7.2 Modul Owner — Fitur Manajemen (UR-Hub Parity)

Fitur-fitur berikut diprioritaskan untuk kesetaraan dengan platform UR-Hub:

| Fitur | Status | Sidebar Route |
|-------|--------|---------------|
| Pengaturan Outlet (profil, jam, pajak, geo) | ✅ Ada | `/pengaturan-outlet` |
| QR Generator per-meja | ✅ Ada | `/qr-code-meja` |
| Bulk-create outlet (max 500) | ✅ Ada | via `OutletSettingsController` |
| Subscription & Feature Gate | ✅ Ada | `FeatureRegistry` |
| Laporan Penjualan | ✅ Ada | `/laporan-penjualan` |
| Laba & Rugi | ✅ Ada | `/laporan/laba-rugi` |
| Laporan Produk | ✅ Ada | `/laporan/produk` |
| Laporan Shift | ✅ Ada | `/laporan/shift` |
| Laporan Meja | ✅ Ada | `/laporan/meja` |
| Transaksi Void | ✅ Ada | `/laporan/void` |
| Biaya Operasional | ✅ Ada | `/biaya-operasional` |
| Arus Kas | ⚠️ Placeholder | `/arus-kas` |
| Perbandingan Outlet | ⚠️ Placeholder | `/perbandingan-outlet` |
| Inventaris / Stok | ⚠️ Placeholder | `/inventory`, `/stok-opname` |
| Manajemen Supplier | ⚠️ Placeholder | `/pembelian-vendor` |
| Dashboard Inventaris | ⚠️ Placeholder | `/dashboard-inventory` |

### 7.3 Modul Kasir / POS

- Operasional order (role `cashier`/manajerial), PIN login (hash bcrypt).
- Data menu dari `PosController::menuView` (Inertia props `posMenu`) — query `MenuItem::with('category')` tenant-scoped.
- Endpoint JSON: `GET /api/pos/menu` untuk reload dinamis.
- Foto item: `photo_url` (Cloudinary `secure_url`) via `ProductImage`.
- Antrean Siap Bayar: endpoint `/api/cashier-queue` — semua fetch wajib header `X-Requested-With` + `Array.isArray` guard.

### 7.4 Modul KDS (Kitchen Display System)

- Route `/kds`, plan gate `pro` (operational core, BUKAN enterprise).
- Real-time order queue untuk dapur, **tampilkan ITEM (bukan cuma order)** dengan tracker per-item 5-step.
- **Per-item cook_status** (`order_items.cook_status`): `dikonfirmasi → sedang dimasak → selesai masak → siap sajikan → selesai`. Tombol advance 1 step per klik.
- Order `siap_sajikan` = semua item-nya `selesai_masak`.
- Pulse di step aktif (cabe) / selesai (hijau), guard `prefers-reduced-motion`.

### 7.5 Modul Waiter & Waiter Bar

- Route `/waiter` + `/waiter-bar`.
- **Routing order-level**: 1 pesanan utuh → KDS kalau ada item makanan, ATAU Bar kalau MURNI minuman (`menu_categories.type` = food|beverage).
- Serve order per item, TTS (Text-to-Speech) notifikasi pesanan baru.
- Fetch polling `/api/orders` + `/api/bar/orders` dengan header `X-Requested-With` wajib.

### 7.6 Modul Tamu / Buku Menu Digital (`BukuMenuDigital/CustomerView`)

- **Read-only**, tanpa auth. Akses via `/m/{slug}?t={meja}`.
- Data nyata dari `/api/menu/{slug}` — fallback graceful ke `FALLBACK_ITEMS`.
- Foto menu: `photo_url` dari Cloudinary.
- **Tracker per-item 5-step** ke tamu: tiap menu item punya node `dikonfirmasi → sedang dimasak → selesai masak → siap sajikan → selesai` (sinkron dengan KDS). Pulse di step aktif (cabe) / selesai (hijau), guard `prefers-reduced-motion`.
- **Tema server-driven**: `screen_mode` dari `outlet_settings` (default `nano-banana`), BUKAN localStorage per-origin (cegah HP vs desktop beda tampilan).
- **Seeder**: 32 menu asli (Makanan/Minuman/Camilan) per tenant — di-seed 1×, BUKAN loop per-outlet.

### 7.7 Modul Staf & SDM

- Shift kerja: `/staf-shift` (plan gate `pro`)
- Sesi kasir: `/cashier-session` (plan gate `pro`)
- Absensi & kehadiran: `/kehadiran`
- Jadwal shift: `/jadwal-shift`

### 7.8 Modul QR Generator

- Owner pilih outlet → label meja bebas (1 per baris: `A1`, `01`, `Meja 7`, …).
- Generate QR asli (`qrcode.react`) per meja → URL `buildMenuUrl(origin, slug, label)`.
- Tombol cetak stiker (A5/A6).

### 7.9 Modul Upload Foto Menu (Owner) — Fase 1 ✅

- Katalog Menu (`KatalogMenu/Index`) — CRUD menu item + upload foto WebP.
- Upload backend signed (`CloudinaryService::uploadMenuPhoto`): secret di server, folder `restoku/{tenant_id}/menu`.
- Ganti foto → foto lama di-`destroy` (tidak orphan).

---

## 8. Alur QR → Menu → Pesan (Core Flow)

```
[Tamu scan QR di meja]
   │  URL: https://<domain>/m/{outlet_slug}?t={meja}
   ▼
[CustomerView] — read-only, resolve outlet via slug (cache Redis)
   │  tampilkan menu (Cloudinary image), pilih item
   ▼
[POST /api/orders] — CSRF-exempt, throttle:30,1 (publik, aman)
   │  payload: outlet_id + table_number + items
   ▼
[OrderController::submitOrder] — scope ke tenant outlet, simpan order
   ▼
[KDS/Waiter/Kasir] — lihat order masuk (tenant-scoped, real-time)
```

**Keamanan alur publik:**
- `throttle:30,1` di guest order & reservation (cegah spam/DoS).
- Scoped delete (tidak `truncate` lintas-tenant).
- Tidak ada fallback `?? 1` yang salah asosiasi outlet.

---

## 9. Non-Functional Requirements

### 9.1 Skalabilitas
- Target: 5.000 tenant × ratusan outlet, ~25jt order/hari.
| Fase 2 | Schema-per-tenant (aktif di Postgres + TERUJI CI `sharding-postgres`; fallback shared-schema di sqlite), Redis cache, read replica, partisi `orders`. |
- Fase 3 DONE: daily/monthly rollup (`SalesRollupService`).
- Fase 4 DONE: cold archive orders >6 bulan (`OrderArchiveService`).

### 9.2 Keamanan
- Isolasi multi-tenant = non-negotiable (G1).
- Endpoint publik (order/reservasi) = CSRF-exempt + throttle.
- Cloudinary = signed URL (secret tidak ke client).
- Gemini AI: **BELUM ada** sanitasi prompt injection → hutang teknis T-01.
- localStorage = UI state only, BUKAN security boundary.

### 9.3 Performa
- Buku menu tamu: cache di Redis, invalidate per-outlet (target < 1.5s).
- Foto: transform Cloudinary on-the-fly (webp, ukuran sesuai device).
- Polling interval: AbortController wajib + cleanup di setiap `useEffect`.

### 9.4 Availability
- Redis down → fallback ke DB (degrade, bukan 500).
- VPS: monitoring + backup otomatis. Redis monitoring (Prometheus) → hutang teknis T-02.

### 9.5 Test Coverage (A+ Regime)
- **Frontend (Vitest)**: 242/242 test hijau pada scope terpilih (100% coverage wajib).
- **Backend (PHPUnit + xdebug 3.5.3)**: 469 test hijau, 61.6% coverage baseline.
- **CI**: GitHub Actions — PHPUnit (pcov), Vitest, Vite build, Psalm SAST.
- **Wajib**: setiap endpoint baru harus punya test isolasi multi-tenant (2 tenant, row=0 dari tenant lain).

### 9.6 Code Quality
- Setiap file page max 200 baris, sub-component max 150 baris, controller max 5 public method.
- Tidak ada `any` type TypeScript di data API kritis.
- Tidak ada hardcoded mock data di komponen produksi.
- Import harus dari path baru (`Components/shared/`, `lib/`), bukan dari `Shared.tsx` shim.

---

## 10. Data Model (Entitas Kunci)

| Entity | Field penting | Catatan |
|--------|---------------|---------|
| `tenants` | `id`, `brand_name`, `plan`, settings JSON | 1 tenant = 1 bisnis |
| `outlets` | `tenant_id`, **`slug`** (unique global), `name`, `is_active`, `operating_hours` JSON, lat/long | auto-outlet-default saat tenant dibuat |
| `users` | `tenant_id`, `outlet_id`, `role`, `pin` (hash) | owner/kasir/staff |
| `orders` | `tenant_id`, `outlet_id`, `table_number`, items JSON, `status` (string, 5-state+), `destination` (kds|bar) | write-heavy; Fase 2 partisi by date; status machine di `Order.php` |
| `order_items` | `order_id`, `menu_item_id`, `cook_status` (5-step per-item), `food/drink_served_at` | tracker per-item sinkron KDS/CustomerView |
| `outlets` | `tenant_id`, **`slug`** (unique global), `name`, `is_active`, `operating_hours` JSON, lat/long, **`google_place_id`** | auto-outlet-default saat tenant dibuat; `google_place_id` dari PlaceIdResolver |
| `google_reviews` | `tenant_id`, `outlet_id`, `reviewer_photo` | dari API Google |
| `outlet_settings` | per-outlet config (printer, struk, screen_mode) | `resolveSettings()` fallback |
| `menu_categories` | `tenant_id`, `name`, `sort_order` | Makanan/Minuman/Camilan/... |
| `menu_items` | `tenant_id`, `outlet_id` (nullable=global), `name`, `price`, `image_path`, `image_public_id` | foto via Cloudinary; `photo_url` accessor |
| `sales_daily_rollups` | `tenant_id`, `outlet_id`, `date`, aggregates | Fase 3: dashboard O(1) |
| `orders_archive` | clone `orders` >6bln | Fase 4: cold storage |
| `tenant_settings` | `cogs_benchmark`, `opex_benchmark` | **TODO T-04**: per-tenant COGS/OpEx |

---

## 11. Roadmap Migrasi Skalabilitas

| Fase | Isi | Status |
|------|-----|--------|
| **Fase 0** | `+slug` outlets, auto-outlet-default, redis config, real QR, `buildMenuUrl` | ✅ DONE |
| **Fase 1** | Cabut `MOCK_ITEMS`, cache buku menu, upload foto Cloudinary, seeder menu 32 item | ✅ DONE |
| **Fase 2** | Schema-per-tenant (`TenantConnection`), Redis aktif, read replica, partisi `orders` | ✅ CODE + TERUJI CI (job `sharding-postgres`) |
| **Fase 3** | Daily/monthly rollup owner (`SalesRollupService`, scheduler 01:00) | ✅ DONE |
| **Fase 4** | Cold archive orders >6 bulan (`OrderArchiveService`, scheduler 1/02:00) | ✅ DONE |
| **UI Refactor P2–P6** | Design system Halo-adapted, 5 screen-mode, cabut lucide → inline SVG | ✅ DONE |
| **Testing A+** | Vitest 242/242, PHPUnit 469/469 + xdebug 3.5.3, Psalm SAST | ✅ DONE |
| **Fase 5 — Dashboard Nyata** | Refaktor `Dashboard/Index.tsx` → komponen + data nyata dari `OwnerDashboardService` | 🔴 OPEN (T-03, T-04) · T-07 ✅ CLOSED |
| **Fase 6 — Placeholder Pages** | Implementasi fitur placeholder (Arus Kas, Inventaris, Perbandingan Outlet) | ⏳ Backlog |
| **Fase 7 — Monitoring** | Prometheus/Grafana Redis monitoring, alert VPS | ⏳ Backlog (T-02) |
| **Fase 8 — Security Hardening** | Sanitasi prompt injection Gemini AI, audit keamanan menyeluruh | 🔴 OPEN (T-01) |

---

## 12. Risiko (Ringkas — detail di `AUDIT_RESTOKU_V2.md`)

| Pilar | Risiko utama | Status |
|-------|--------------|--------|
| PRD/Scope | Alur QR→order salah asosiasi tenant | ✅ Fix (C1+slug+scope) |
| Modularisasi | Kasir vs owner bentrok akses outlet | ✅ `TenantScope` + `findOutletForTenant` |
| Arsitektur/Security | Shared-schema collapse di skala penuh | ✅ Fase 2 schema-per-tenant |
| Security | Gemini AI prompt injection | 🔴 **BELUM** (T-01) |
| CI/CD | pcov vs xdebug, peer-dep conflict | ✅ CI pcov + `--legacy-peer-deps` |
| Eksternal | Redis monitoring belum setup | 🟡 Rencana Fase 7 (T-02) |
| Frontend | God component + hardcoded data | 🔴 **BELUM** (T-03, T-04) · T-07 ✅ CLOSED |

---

## 13. Success Metrics

- **Onboarding**: owner buat tenant → langsung punya outlet + bisa cetak QR < 5 menit.
- **Isolasi**: 100% test isolasi lintas-tenant hijau di CI.
- **Skala**: load test 25jt order/hari tanpa degradasi (pasca Fase 2).
- **Keamanan**: 0 insiden publik (CSRF/spam) di prod.
- **Data akurasi**: 0 tampilan KPI keuangan tanpa label `~ Estimasi` saat `is_estimate: true`.
- **Code health**: 0 file page > 200 baris, 0 hardcoded mock data di komponen produksi.

---

## 14. Keputusan & Konteks (Log)

- **Platform**: ALL web/PWA, tidak ada native Android.
- **Deploy**: VPS sewaan (Forge opsional, Vercel TIDAK relevan untuk Laravel stateful).
- **Foto menu**: Cloudinary wajib. Upload backend-signed (secret di VPS). Tanpa `CLOUDINARY_URL` → fallback placeholder.
- **Status arsitektur**: READY secara arsitektural — Fase 0–4 selesai. Prasyarat produksi: VPS dengan Postgres, Redis, `CLOUDINARY_URL`.
- **CI**: `CI — Restoku Quality Gate` (ci.yml) = 8/8 GREEN. CodeQL failure = by design (repo private free).
- **UI/Design**: Halo-adapted (`system.css` + `DESIGN.md`). 5 screen-mode. Tanpa lucide-react.
- **Fitur UR-Hub**: Dianalisis Juli 2026. Fitur utama sudah ada; placeholder pages (Arus Kas, Inventaris, Perbandingan Outlet) masuk backlog Fase 6.
- **Hutang teknis aktif**: lihat `GOLDEN_RULES.md` seksi "Hutang Teknis Aktif" (T-01 s/d T-10).

---

*PRD v2.0 — diperbarui pasca Audit Menyeluruh 2026-07-17, integrasi analisis fitur UR-Hub,*
*dan penambahan tracking hutang teknis frontend. Berbasis fakta kode Fase 0–4 + UI Refactor P2–P6 + Testing A+.*
