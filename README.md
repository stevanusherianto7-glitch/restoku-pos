# Restoku — SaaS Multi-Tenant POS & Restaurant Management

**Restoku** adalah platform SaaS untuk restoran/F&B yang melayani multi-tenant: satu
instans aplikasi melayani banyak tenant (pemilik usaha), masing-masing dengan satu atau
ratusan outlet/cabang. Terdiri dari tiga muka pengguna:

- **Kasir / KDS / Waiter** — web app (Inertia + React) untuk operasional harian.
- **Owner** — web dashboard analitik & pengaturan (lintas outlet).
- **Tamu** — Buku Menu Digital web/PWA, diakses via scan QR di meja (read-only).

---

## 1. Tech Stack

| Layer | Teknologi |
|---|---|
| Backend | **Laravel 13** (PHP 8.3), Eloquent ORM |
| Frontend | **React 18** + **Inertia.js v3** (server-driven SPA, tanpa API terpisah) |
| UI | Radix UI primitives + **Phosphor Icons** (duotone) + Tailwind |
| AI | `laravel/ai` (Gemini) untuk copilot & balasan review |
| DB | MySQL/MariaDB (shared-schema multi-tenant) |
| Build | Vite, Vitest (frontend test), PHPUnit (backend test) |
| Routing SPA | Ziggy (route Laravel → JS) |

---

## 2. Multi-Tenancy (Inti Arsitektur)

Restoku menggunakan pola **shared-database, shared-schema**: seluruh tenant berada dalam
satu database dan satu skema, dipisahkan oleh kolom `tenant_id` di tiap tabel. Isolasi
diterapkan secara terpusat, bukan manual per query.

### 2.1 Tiga pilar isolasi

1. **`TenantScope`** (`app/Models/Scopes/TenantScope.php`)
   Global Eloquent scope yang menyisipkan `WHERE tenant_id = :ctx` ke semua model
   tenant-scoped. Membaca `tenant.id` dari service container (bukan `Auth::user()`
   langsung) agar bisa dipakai di HTTP, artisan, queue, dan test. Di produksi, jika
   `tenant.id` tidak ter-bound → `abort(500)` (fail-closed, cegah bocor cross-tenant).

2. **`TenantContext`** (`app/Services/TenantContext.php`)
   Singleton per-request, single source of truth untuk tenant aktif. Menyimpan
   `tenant_id`, lazy-load `Tenant`, dan `Subscription` (plan). Menyediakan helper
   `id()`, `plan()`, `hasFeature()`, `isTrialing()`. Cache 1x DB-hit per request.

3. **`EnsureTenantContext` middleware** (`app/Http/Middleware/EnsureTenantContext.php`)
   Dipasang sebagai alias `tenant`, **setelah `auth`**. Mengisi `TenantContext` dari
   `Auth::user()->tenant_id`, dan menolak (403) user tanpa `tenant_id`.

### 2.2 Model relasi tenant

```
Tenant ──< Outlet ──< (Order, Reservation, MenuItem, OutletSetting, ...)
  │
  ├──< User (staff/owner, punya tenant_id + outlet_id)
  ├──< GoogleReview
  └──< Subscription (plan: basic|pro|enterprise)
```

Semua model di atas terikat `tenant_id`. `Outlet.tenant_id` NOT NULL → setiap outlet
harus milik satu tenant.

### 2.3 Resolusi tenant untuk tamu (publik, tanpa auth)

Endpoint tamu (`/api/orders`, `/api/reservations`, `/m/{slug}`) tidak punya user login.
Tenant diidentifikasi **dari `outlet_id`** yang dikirim tamu (BUG-006 fix) — bukan dari
request body yang bisa dimanipulasi. `OrderController` mengambil `tenant_id` dari record
outlet, lalu mengunci query ke tenant tersebut. Ini mencegah tamu memalsukan tenant.

### 2.4 Feature gating per plan

`RequiresPlan` middleware (`plan:kds`, `plan:inventory`, dll.) membatasi fitur berdasar
`TenantContext->hasFeature()`. Route tanpa gate = tersedia semua plan.

---

## 3. Buku Menu Digital & QR (Tamu)

- Tamu memindai **QR per-meja** → `https://{base}/m/{outlet_slug}?t={meja}`.
- `Outlet` memiliki `slug` (unik per tenant) sebagai basis URL.
- Isi menu bersifat **read-only & cacheable per outlet** → beban tamu tidak masuk hot
  write path kasir.
- **QR generator self-serve**: owner mencetak stiker QR dari dashboard (label meja bebas:
  `A1`, `01`, `Meja 7`). QR dibuat sekali (generate-time), bukan per-scan.
- Owner dapat **bulk-create N outlet** (input jumlah cabang) + auto-outlet default saat
  register, sehingga tenant tanpa cabang tetap punya target URL.

---

## 4. Struktur Direktori

```
app/
  Models/
    Tenant.php, Outlet.php, User.php
    Order.php, OrderItem.php, Reservation.php
    MenuItem.php, MenuCategory.php
    GoogleReview.php, OutletSetting.php, ReceiptConfig.php
    Scopes/TenantScope.php          ← isolasi tenant
  Services/
    TenantContext.php               ← ctx aktif
    SettingsService.php, FeatureRegistry.php
  Http/
    Middleware/
      EnsureTenantContext.php       ← bootstrap ctx
      RequiresPlan.php              ← feature gate
    Controllers/
      OrderController.php           ← KDS/order/reservasi (publik+auth)
      OutletSettingsController.php  ← pengaturan outlet (DB-backed)
      GoogleReviewController.php    ← review + AI reply
      GeminiAiController.php        ← copilot AI
  Ai/Agents/RestokuAiAssistant.php
routes/web.php                      ← route tunggal (web + api terkelompok)
resources/js/
  Pages/        (Inertia pages per route)
  Components/   (UI, termasuk LandingPage, BukuMenuDigital)
  lib/menuUrl.ts (helper buildMenuUrl)
tests/Feature/  (TenantIsolationTest, OrderControllerTest, ...)
```

---

## 5. Alur Request (HTTP)

```
Request
  → web middleware (CSRF, session)
  → auth (session guard)
  → tenant (EnsureTenantContext → isi TenantContext)
  → plan (RequiresPlan, opsional)
  → Controller (inject TenantContext, query via TenantScope)
  → Inertia response (SSR-free SPA) / JSON API
```

CSRF aktif di seluruh route web. Endpoint tamu publik (`/api/orders`, `/api/reservations`)
di-exempt CSRF **dengan sengaja** (tamu tak miliki token) namun dibatasi `throttle`.

---

## 6. Testing & CI

- **Backend:** PHPUnit 12 — `php artisan test`. Termasuk `TenantIsolationTest` (jaminan
  cross-tenant aman), `OrderControllerTest`, `GoogleReview*Test`, `OutletSettings*Test`,
  `SubscriptionFeatureGateTest`.
- **Frontend:** Vitest — `npm run test`.
- **CI:** GitHub Actions menjalankan PHPUnit (coverage via `pcov`), Vitest, PHPStan,
  dan Vite build. Artifact coverage diunggah tiap run.

### 6.1 Catatan keamanan (hasil audit)
- `GoogleReview::truncate()` diganti `where('tenant_id', ...)->delete()` untuk cegah
  hapus lintas-tenant.
- Endpoint tamu dipagari `throttle:30,1`.
- Fallback `?? 1` pada `outlet_id`/`tenant_id` dihapus agar tak salah asosiasi tenant.

---

## 7. Skalabilitas (Catatan Arsitektur)

Shared-schema ideal untuk puluhan–ratusan tenant. Untuk target 5.000 tenant × ratusan
outlet, direkomendasikan transisi ke **schema-per-tenant** + Redis (session/cache) +
read-replica + daily-sales rollup. Path tamu yang read-only & cacheable membuat beban
QR tidak proporsional terhadap jumlah outlet.

---

## 8. Setup Lokal

```bash
composer install
npm install
cp .env.example .env && php artisan key:generate
php artisan migrate --seed
npm run dev          # frontend (Vite)
php artisan serve    # backend
```

---

## 9. Konvensi Kode

- Isolasi tenant SELALU lewat `TenantScope` + `TenantContext`; jangan baca
  `Auth::user()->tenant_id` tersebar di controller.
- Untuk bypass legitimate (artisan/seed), gunakan `TenantScope::bypass(fn() => ...)`,
  bukan `withoutGlobalScope` mentah.
- Owner cross-outlet = tenant-scoped (lihat semua cabang); tamu = outlet-scoped.
- Secret hanya di `.env` (git-ignored); jangan ekspos ke `VITE_*` kecuali aman.
```
