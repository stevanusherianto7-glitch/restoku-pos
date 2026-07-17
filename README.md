# Restoku — SaaS Multi-Tenant POS & Restaurant Management

> Platform SaaS all-in-one untuk restoran/F&B. Multi-tenant (shared-schema + `TenantScope`; schema-per-tenant aktif di Postgres), QR menu digital, POS, KDS, laporan keuangan, dan manajemen staf.

**Stack:** Laravel 13 · React 18 · Inertia.js v3 · TypeScript · Vite · Redis · Postgres · Cloudinary

[![CI Status](https://github.com/stevanusherianto7-glitch/restoku-pos/actions/workflows/ci.yml/badge.svg)](https://github.com/stevanusherianto7-glitch/restoku-pos/actions)

---

## Daftar Isi

1. [Fitur Utama](#1-fitur-utama)
2. [Tech Stack](#2-tech-stack)
3. [Arsitektur Multi-Tenancy](#3-arsitektur-multi-tenancy)
4. [Struktur Direktori](#4-struktur-direktori)
5. [Setup Lokal](#5-setup-lokal)
6. [Alur Request HTTP](#6-alur-request-http)
7. [Design System](#7-design-system)
8. [Testing & CI](#8-testing--ci)
9. [Sidebar & Fitur per Role](#9-sidebar--fitur-per-role)
10. [Skalabilitas & Roadmap](#10-skalabilitas--roadmap)
11. [Konvensi Kode Wajib](#11-konvensi-kode-wajib)
12. [Hutang Teknis Aktif](#12-hutang-teknis-aktif)

---

## 1. Fitur Utama

| Modul | Deskripsi | Plan Gate |
|-------|-----------|-----------|
| **Buku Menu Digital** | QR per-meja → tamu scan → menu & pesan, tanpa app | Semua |
| **POS / Kasir** | Antarmuka kasir full-featured, PIN login | Semua |
| **KDS (Kitchen Display)** | Monitor pesanan dapur real-time | Enterprise |
| **Waiter & Waiter Bar** | Serve order, TTS notifikasi | Semua |
| **Owner Dashboard** | Konsolidasi multi-outlet, KPI, leaderboard cabang | Semua |
| **Laporan Keuangan** | Laba/rugi, food cost, void, produk, shift, meja | Pro/Enterprise |
| **Manajemen Staf** | Shift kerja, sesi kasir, kehadiran | Pro |
| **Inventaris** | Stok bahan baku, supplier, stock opname | Enterprise |
| **QR Generator** | Cetak stiker QR per-meja mandiri | Semua |
| **Upload Foto Menu** | Cloudinary backend-signed, CRUD katalog | Semua |
| **Reservasi** | Booking meja oleh tamu publik | Semua |
| **AI Copilot** | Gemini AI untuk balasan review & rekomendasi | Enterprise |

---

## 2. Tech Stack

| Layer | Teknologi |
|-------|-----------|
| **Backend** | Laravel 13 (PHP 8.3+), Eloquent ORM, PHPUnit 12 |
| **Frontend** | React 18 + Inertia.js v3 (server-driven SPA) + TypeScript |
| **Build** | Vite 6, Vitest (FE test), Tailwind CSS |
| **Icons** | Phosphor Icons (duotone) + Heroicons + inline SVG — **tanpa lucide-react** |
| **AI** | `laravel/ai` (Gemini) — copilot & balasan review |
| **Database** | MySQL / Postgres — multi-tenant (shared-schema + `TenantScope`; schema-per-tenant di Postgres, Fase 2) |
| **Cache/Session/Queue** | Redis (wajib prod), fallback DB di lokal |
| **Foto Menu** | Cloudinary (CDN + transform + backend-signed upload) |
| **Routing SPA** | Ziggy (route Laravel → JS) |
| **CI/CD** | GitHub Actions — lint, PHPUnit (pcov), Vitest, Psalm SAST, Vite build |

---

## 3. Arsitektur Multi-Tenancy

Restoku menggunakan pola **shared-database, multi-tenant** (shared-schema + `TenantScope`; `TenantConnection` schema-per-tenant **AKTIF di Postgres, INAKTIF di sqlite/test**):
- Isolasi via `tenant_id` + **`TenantScope`** (global Eloquent scope) + **`TenantContext`** (singleton per request).
- Fase 2: routing koneksi per-tenant via `TenantConnection` + `UsesTenantConnection` trait (**15 model**). Aktif & **teruji di CI Postgres** (job `sharding-postgres`); di sqlite/test fallback ke shared-schema (`isSharded()` = `false`).

### 3.1 Tiga Pilar Isolasi

1. **`TenantScope`** (`app/Models/Scopes/TenantScope.php`)
   Global Eloquent scope yang menyisipkan `WHERE tenant_id = :ctx` ke semua model tenant-scoped.
   Di produksi, jika `tenant.id` tidak ter-bound → `abort(500)` (fail-closed, cegah bocor cross-tenant).

2. **`TenantContext`** (`app/Services/TenantContext.php`)
   Singleton per-request, single source of truth untuk tenant aktif. Helper: `id()`, `plan()`, `hasFeature()`, `isTrialing()`. Cache 1x DB-hit per request.

3. **`EnsureTenantContext` middleware** (`app/Http/Middleware/EnsureTenantContext.php`)
   Alias `tenant`, **dipasang SETELAH `auth`**. Mengisi `TenantContext` dari `Auth::user()->tenant_id`.

### 3.2 Model Relasi Tenant

```
Tenant ──< Outlet ──< (Order, Reservation, MenuItem, OutletSetting, ...)
  │
  ├──< User (staff/owner, punya tenant_id + outlet_id)
  ├──< GoogleReview
  ├──< Subscription (plan: basic|pro|enterprise)
  └──< SalesDailyRollup (Fase 3)
```

### 3.3 Resolusi Tenant untuk Tamu (Publik, Tanpa Auth)

Endpoint tamu (`/api/orders`, `/api/reservations`, `/m/{slug}`) tidak punya user login.
Tenant diidentifikasi **dari `outlet_id`** yang dikirim tamu — bukan dari request body yang bisa dimanipulasi.

### 3.4 Feature Gating per Plan

`RequiresPlan` middleware (`plan:kds`, `plan:inventory`, dll.) membatasi fitur berdasar `TenantContext->hasFeature()`. Konfigurasi plan di `config/subscription.php`.

| Plan | Fitur tambahan |
|------|----------------|
| `basic` | POS, menu digital, laporan dasar |
| `pro` | Shift, sesi kasir, laporan lengkap |
| `enterprise` | KDS, inventaris, AI copilot |

---

## 4. Struktur Direktori

```
app/
  Models/
    Tenant.php, Outlet.php, User.php
    Order.php, OrderItem.php, Reservation.php
    MenuItem.php, MenuCategory.php
    GoogleReview.php, OutletSetting.php, ReceiptConfig.php
    SalesDailyRollup.php, SalesMonthlyRollup.php, OrderArchive.php
    Scopes/TenantScope.php          ← isolasi tenant
  Services/
    TenantContext.php               ← ctx aktif (singleton)
    TenantConnection.php            ← routing koneksi per-tenant (Fase 2)
    OwnerDashboardService.php       ← aggregasi data dashboard owner
    SalesRollupService.php          ← Fase 3: rollup harian/bulanan
    OrderArchiveService.php         ← Fase 4: cold storage
    CloudinaryService.php           ← backend-signed upload
    FeatureRegistry.php             ← plan feature mapping
  Http/
    Middleware/
      EnsureTenantContext.php       ← bootstrap ctx
      RequiresPlan.php              ← feature gate
    Controllers/
      OrderController.php           ← KDS/order/reservasi
      PosController.php             ← Kasir POS
      MenuController.php            ← Katalog Menu CRUD
      OutletSettingsController.php  ← pengaturan outlet
      OwnerDashboardController.php  ← dashboard owner (TODO: pisah ke LaporanController)
      GoogleReviewController.php    ← review + AI reply
      GeminiAiController.php        ← copilot AI
routes/
  web.php                           ← route tunggal (web + api terkelompok)
resources/
  js/
    Pages/                          ← Inertia pages
      Dashboard/Index.tsx           ← owner dashboard (TODO: refaktor god component)
      POS/Index.tsx
      KDS/Index.tsx
      WaiterBar/Index.tsx
      BukuMenuDigital/CustomerView.tsx
      KatalogMenu/Index.tsx
      QRCodeMeja/Index.tsx
    Components/
      shared/                       ← design system komponen baru
      POS/, KDS/, Settings/         ← fitur-spesifik components
    Layouts/
      MainLayout.tsx                ← sidebar + role-based nav
    lib/
      menuUrl.ts                    ← buildMenuUrl helper
      formatters.ts                 ← formatRupiah, dll.
    Types/
      index.ts                      ← TypeScript interfaces
  css/
    system.css                      ← design tokens Halo-adapted
tests/
  Feature/                          ← PHPUnit feature tests
    TenantIsolationTest.php
    MenuIsolationTest.php
    OrderControllerTest.php
    PosKatalogVerifyTest.php
    SubscriptionFeatureGateTest.php
docs/
  GOLDEN_RULES.md                   ← aturan wajib tim (baca sebelum commit!)
  PRD.md                            ← product requirements document
  AUDIT_RESTOKU_V2.md               ← audit risiko 5 pilar
  DESIGN.md                         ← design system spec
  SIDEBAR_MENU.md                   ← mapping sidebar → route → controller
```

---

## 5. Setup Lokal

```bash
# 1. Clone & install dependencies
composer install
npm install

# 2. Konfigurasi environment
cp .env.example .env
php artisan key:generate

# Edit .env — minimal untuk dev lokal:
# DB_CONNECTION=mysql (atau sqlite untuk cepat)
# REDIS_HOST=127.0.0.1  (opsional, fallback file kalau Redis tidak jalan)
# CLOUDINARY_URL=       (opsional, foto pakai placeholder kalau kosong)
# MENU_BASE_URL=http://localhost:8000  (untuk QR generator)

# 3. Migrate & seed
php artisan migrate --seed
# → MenuSeeder mengisi 32 item menu contoh per tenant

# 4. Jalankan server
php artisan serve    # backend di localhost:8000
npm run dev          # frontend Vite (hot reload)

# 5. Login
# - Owner/Manager: http://localhost:8000/login (email + password)
# - Staff/Kasir: http://localhost:8000/login (PIN: 123456/111111/654321/999999)
# - Tamu: http://localhost:8000/m/{outlet_slug}?t=1
```

### Akses Dev Cepat (Default Seeder)
| Role | PIN / Email |
|------|-------------|
| Kasir | `123456` |
| Kitchen | `111111` |
| Waiter | `654321` |
| Manager | `999999` |

### Tunnel Publik (untuk HP tamu)
```bash
# Install cloudflared (bukan ngrok — ngrok sering ERR_NGROK_334)
# Download dari: https://github.com/cloudflare/cloudflared/releases
cloudflared tunnel --url http://localhost:8000

# Update .env
MENU_BASE_URL=https://<url-acak>.trycloudflare.com
APP_URL=https://<url-acak>.trycloudflare.com
php artisan config:clear
```

---

## 6. Alur Request HTTP

```
Request
  → web middleware (CSRF, session, Ziggy)
  → auth (session guard)             ← kecuali endpoint publik tamu
  → tenant (EnsureTenantContext)     ← isi TenantContext singleton
  → plan (RequiresPlan, opsional)    ← feature gate
  → Controller (inject TenantContext, query via TenantScope)
  → Inertia response (SSR-free SPA) / JSON API
```

**Endpoint publik** (CSRF-exempt, throttle `30,1`):
- `POST /api/orders` — order tamu
- `POST /api/reservations` — reservasi tamu
- `GET /api/menu/{slug}` — menu publik (cached Redis 10 menit)
- `GET /m/{slug}` — buku menu digital

---

## 7. Design System

**Halo-adapted tokens** — didokumentasikan di `DESIGN.md` & `resources/css/system.css`.

| Token | Nilai |
|-------|-------|
| Brand cabe | `#FF5B35` |
| Brand emas | `#F59E0B` |
| Screen modes | `terang` / `gelap` / `glassmorphic` / `nano-banana` / `krem` |
| Icons | Phosphor (duotone) + Heroicons + inline SVG — **tanpa lucide-react** |
| Font | Inter (Google Fonts) |

**Komponen design system** (import dari `Components/shared/`, bukan `Shared.tsx`):
- `<Glass>` — card glassmorphic
- `<Screen>` — page container
- `<Badge tone="...">` — status badge
- `<Button>` — tombol dengan varian
- `<SkeletonCard>` / `<SkeletonTable>` — loading state (TODO: T-09)

---

## 8. Testing & CI

### Backend (PHPUnit)
```bash
php artisan test                              # semua test
php artisan test --filter TenantIsolation     # isolasi multi-tenant
php artisan test --coverage                   # coverage (butuh xdebug)
```

**Status:** 469/469 test hijau, 61.6% coverage baseline.

### Frontend (Vitest)
```bash
npm run test                  # run semua test
npm run test -- --coverage    # dengan coverage report
```

**Status:** 242/242 test hijau pada scope terpilih (100% coverage enforced).

### CI (GitHub Actions)
- `ci.yml`: Secret Scan, PHPUnit (pcov), Vitest, Vite Build, Playwright E2E ×4
- `codeql.yml`: CodeQL SAST — failure by design (repo private free)
- Coverage artifact diupload tiap run

### Pola Test Isolasi Wajib
```php
// Setiap endpoint baru WAJIB ada test isolasi seperti ini:
public function test_tenant_isolation(): void
{
    [$tenantA, $outletA] = $this->createTenantWithOutlet();
    [$tenantB]           = $this->createTenantWithOutlet();

    Order::factory()->for($outletA)->create(); // data di tenant A

    $this->actingAs($tenantB->owner)
         ->getJson('/api/owner/sales')
         ->assertJsonCount(0, 'data'); // tenant B harus dapat 0
}
```

---

## 9. Sidebar & Fitur per Role

Sidebar dikontrol di `MainLayout.tsx` dengan `featureLocks` per subscription plan.

| Grup | Menu | Route | Role | Plan Gate |
|------|------|-------|------|-----------|
| Operasional | Kasir (POS) | `/pos` | kasir+ | — |
| Operasional | Monitor Pesanan | `/monitor-pesanan` | kasir+ | — |
| Operasional | Dapur (KDS) | `/kds` | kitchen+ | enterprise |
| Operasional | Waiter | `/waiter` | waiter+ | — |
| Operasional | Shift Kerja | `/staf-shift` | manager+ | pro |
| Operasional | Sesi Kasir | `/cashier-session` | manager+ | pro |
| Produk | Produk & Menu | `/produk` | owner+ | — |
| Produk | Katalog Menu | `/katalog-menu` | owner+ | — |
| Produk | Buku Menu Digital | `/buku-menu-digital` | owner+ | — |
| Produk | Manajemen Meja | `/manajemen-meja` | owner+ | — |
| Inventaris | Stok Bahan Baku | `/inventory` | owner+ | enterprise |
| Inventaris | Supplier | `/pembelian-vendor` | owner+ | enterprise |
| Inventaris | Stock Opname | `/stok-opname` | owner+ | enterprise |
| Laporan | Laporan Penjualan | `/laporan-penjualan` | manager+ | pro |
| Laporan | Perbandingan Outlet | `/perbandingan-outlet` | owner | enterprise |
| Laporan | Arus Kas | `/arus-kas` | owner | enterprise |
| Laporan | Laba & Rugi | `/laporan/laba-rugi` | owner | pro |
| Keuangan | Biaya Operasional | `/biaya-operasional` | owner | pro |
| Pengaturan | Pengaturan Outlet | `/pengaturan-outlet` | owner | — |
| Pengaturan | QR Code Meja | `/qr-code-meja` | owner | — |

---

## 10. Skalabilitas & Roadmap

| Fase | Status | Deskripsi |
|------|--------|-----------|
| 0 — Fondasi | ✅ DONE | Slug outlet, auto-outlet, QR generator, buildMenuUrl |
| 1 — Menu Nyata | ✅ DONE | Cabut mock data, cache Redis, upload Cloudinary, seeder |
| 2 — Schema-per-Tenant | ✅ DONE | TenantConnection, partisi orders, read replica — TERUJI CI (`sharding-postgres`) |
| 3 — Sales Rollup | ✅ DONE | SalesRollupService, scheduler harian 01:00 |
| 4 — Cold Archive | ✅ DONE | OrderArchiveService, orders >6 bulan ke archive |
| UI Refactor | ✅ DONE | Halo design system, 5 screen-mode, tanpa lucide |
| Testing A+ | ✅ DONE | 242/242 Vitest, 469/469 PHPUnit, xdebug, Psalm SAST |
| **5 — Dashboard Nyata** | 🔴 **OPEN** | Refaktor god component, data nyata (badge estimasi ✅ CLOSED T-07) |
| **6 — Fitur Placeholder** | ⏳ Backlog | Arus Kas, Inventaris, Perbandingan Outlet |
| **7 — Monitoring** | ⏳ Backlog | Prometheus/Grafana Redis, alert VPS |
| **8 — Security Hardening** | 🔴 **OPEN** | Sanitasi prompt injection Gemini AI |

---

## 11. Konvensi Kode Wajib

> Lihat `GOLDEN_RULES.md` untuk aturan lengkap. Ini ringkasannya:

### Backend
```php
// ✅ Benar — pakai TenantContext
public function __construct(private TenantContext $ctx) {}
$this->ctx->id(); // bukan Auth::user()->tenant_id

// ✅ Benar — model query via TenantScope otomatis
MenuItem::where('name', 'like', '%nasi%')->get(); // sudah scoped

// ❌ Salah — bypass scope tanpa filter
MenuItem::withoutGlobalScope(TenantScope::class)->get(); // bocor!

// ✅ Benar — bypass dengan filter eksplisit
MenuItem::withoutGlobalScope(TenantScope::class)
    ->where('tenant_id', $tenantId)->get();
```

### Frontend
```tsx
// ✅ Benar — fetch dengan header wajib + array guard
const res = await fetch('/api/endpoint', {
    headers: { Accept: 'application/json', 'X-Requested-With': 'XMLHttpRequest' }
});
const data = await res.json();
setState(Array.isArray(data) ? data : data?.items ?? []);

// ❌ Salah — fetch tanpa header (Inertia balas 409/redirect)
const data = await fetch('/api/endpoint').then(r => r.json());
items.map(...); // crash jika items bukan array!

// ✅ Benar — import dari path baru
import { Glass, Badge } from '@/Components/shared';
import { formatRupiah } from '@/lib/formatters';

// ❌ Salah — import dari shim lama (akan dihapus)
import { Glass } from '@/Components/Shared';
```

### Secrets
```bash
# ✅ .env (git-ignored, isi manual)
CLOUDINARY_URL=cloudinary://key:secret@cloudname

# ❌ Jangan expose ke frontend
VITE_CLOUDINARY_SECRET=...  # JANGAN — terexpose ke browser!
```

---

## 12. Hutang Teknis Aktif

| ID | Temuan | Severity | File | Status |
|----|--------|----------|------|--------|
| T-01 | GeminiAiController belum sanitasi prompt injection | 🔴 HIGH | `GeminiAiController.php` | OPEN |
| T-02 | Redis monitoring (Prometheus/Grafana) belum setup | 🟡 MEDIUM | VPS/infra | OPEN |
| T-03 | Dashboard/Index.tsx god component 1.349 baris | 🔴 HIGH | `Pages/Dashboard/Index.tsx` | OPEN |
| T-04 | 2 dashboard owner (Index.tsx vs OwnerDashboard.tsx) tidak konsisten | 🔴 HIGH | kedua file | OPEN |
| T-05 | Components/Shared.tsx shim belum dimigrasikan | 🟡 MEDIUM | `Components/Shared.tsx` | OPEN |
| T-06 | OwnerDashboardController menangani 12 endpoint (SRP violation) | 🟡 MEDIUM | `OwnerDashboardController.php` | OPEN |
| T-07 | is_estimate: true tidak ditampilkan ke UI | 🔴 HIGH | `OwnerDashboard.tsx`, `Index.tsx` | ✅ CLOSED (047e4fe) |
| T-08 | featureLocks pakai display name sebagai key | 🟡 MEDIUM | `MainLayout.tsx` | OPEN |
| T-09 | Tidak ada SkeletonCard/SkeletonTable di halaman async | 🟢 LOW | semua halaman laporan | OPEN |
| T-10 | any type di MainLayout.tsx untuk data reservasi L198 | 🟡 MEDIUM | `MainLayout.tsx` | ✅ CLOSED (047e4fe) |

---

*README v2.0 — diperbarui 2026-07-17 pasca Audit Menyeluruh & integrasi fitur UR-Hub.*
