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

### 7.3 Modul Tamu / Buku Menu Digital (`BukuMenuDigital/CustomerView`)
- **Read-only**, tanpa auth.
- Akses via `/m/{slug}?t={meja}` (slug outlet, label meja bebas).
- Data nyata dari `/api/menu/{slug}` (Fase 1 — `MOCK_ITEMS` dicabut, fallback graceful bila 0 item).

### 7.4 Modul QR Generator (`QRCodeMeja/Index`)
- Owner pilih outlet → isi **label meja bebas** (1 per baris: `A1`, `01`,
  `Meja 7`, …).
- Generate **QR asli** (`qrcode.react`) per meja → URL `buildMenuUrl(origin,
  slug, label)`.
- Tombol cetak stiker (A5/A6).

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

---

## 11. Roadmap Migrasi Skalabilitas

| Fase | Isi | Status |
|------|-----|--------|
| **Fase 0** | `+slug` outlets + backfill, auto-outlet-default, redis config, real QR generator, `buildMenuUrl` | ✅ **DONE** (`8013133`) |
| **Fase 1** | Integrasi data menu nyata (cabut `MOCK_ITEMS`), cache buku menu (Redis), modul upload foto → **Cloudinary**, bulk-create outlet | ✅ **DONE** (`5a05df8`) |
| **Fase 2** | **Schema-per-tenant** (`TenantConnection` + `UsesTenantConnection` trait 11 model), Redis cache aktif, read replica (`TenantReadConnection`), partisi `orders` by date | ✅ **DONE** (`4e9f9ad`) |
| **Fase 3** | Daily/monthly rollup owner (`SalesRollupService`, `sales:rollup` scheduler 01:00) — dashboard O(1), bukan query raw 25jt | ✅ **DONE** (`e7ad243`) |
| **Fase 4** | Cold archive orders >6 bulan (`orders_archive`, `OrderArchiveService`, `orders:archive` scheduler 1/02:00) — partisi aktif tetap kecil | ✅ **DONE** (`de39047`) |

---

## 12. Risiko (Ringkas — detail di audit 5 pilar)

| Pilar | Risiko utama | Mitigasi sudah/rencana |
|-------|--------------|------------------------|
| PRD/Scope | Alur QR→order salah asosiasi tenant | `C1`+slug+scope ✅ |
| Modularisasi | Kasir vs owner bentrok akses outlet | `TenantScope` + `findOutletForTenant` ✅ |
| Arsitektur/Security | Shared-schema collapse di skala penuh | Fase 2 schema-per-tenant ✅ (siap 5.000×ratusan) |
| CI/CD | pcov vs xdebug, peer-dep conflict | CI pcov ✅, `--legacy-peer-deps` ✅ |
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
- **Foto menu**: Cloudinary wajib.
- **Peran**: Principal SE + Security Architect + QA Lead mengambil alih keputusan teknis.
- **Status refactor skala 5.000×ratusan**: **READY secara arsitektural** — Fase 0–4 selesai
  (schema-per-tenant + partisi + rollup + cold archive). Prasyarat produksi: VPS dengan
  Postgres (`DB_SHARDING_ENABLED=true`), Redis jalan, Cloudinary API key terisi.

---

*PRD disusun berbasis fakta kode per commit `8013133` (Fase 0). Diperbarui pasca
Fase 1–4 (`5a05df8` / `4e9f9ad` / `e7ad243` / `de39047`) — semua fase skalabilitas SELESAI.*
