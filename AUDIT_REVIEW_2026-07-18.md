# COUNTER-CHECK — General Audit Restoku 2026-07-18

> Tanggal counter-check: 2026-07-18 (post-push commit `0b45b2f`)
> Metodologi: verifikasi setiap klaim ke kode asli (`file:line`) + jalankan test
> suite sungguhan. Audit eksternal diperlakukan sebagai **UNTRUSTED** (skill
> `audit-countercheck`, insiden 2026-07-15).
>
> ⚠️ KOREKSI (2026-07-18, post-investigasi): dugaan awal "dual-tree =
> deployment risk fatal" **SALAH**. Fakta sebenarnya:
> - **Source-of-truth produksi = `restoku backend/resources/js/`** (216 file
>   git-tracked, 41 file test, punya CustomerView 2071 + reservation.ts).
>   Build produksi dijalankan dari **backend root `vite.config.js`** yang
>   membaca tree ini → output ke `restoku backend/public/build`. TIDAK ada
>   risk deployment.
> - `restoku frontend/` = **scratch folder** yang tercipta saat debug
>   landing-page (hanya punya `shared.test.ts` 13 test + LandingPage baru,
>   TIDAK punya CustomerView/reservation.ts). Bukan build source produksi.
> Tindakan: merge 4 file work landing (subscription.ts, ImageWithFallback,
> PengaturanToko, shared.test.ts) KE backend tree; hapus `restoku frontend/`
> setelah dikonfirmasi (destructive → tanya user).

---

## 1. HASIL TEST SUITE (dijalankan ulang, bukan percaya laporan)

| Suite | Klaim audit | Verifikasi nyata | Status |
|-------|-------------|------------------|--------|
| PHPUnit | 472/477 (98.9%) | **472 passed / 5 skipped / 0 failed** (1175 assertions, 87.7s) | ✅ VALID (477 = 472+5) |
| Vitest (committed tree) | 242/242 (100%), 41 file | 41 test file ada di `restoku backend/resources/js` | ✅ VALID untuk committed tree |
| Vitest (`restoku frontend` tree) | — | **13 passed / 2 file** (5.5s) | ⚠️ tree deploy beda → lihat §URGENT |

Kesimpulan: angka test audit **VALID untuk committed tree**. Tapi deployment
build dari tree lain → test suite yang lulus tidak menjamin artifact deploy.

## 2. CODE QUALITY — ESLint

| Klaim audit | Verifikasi |
|-------------|------------|
| 0 errors | ✅ VALID (0 errors, `npx eslint .` di `resources/js`) |
| 27 warnings | ❌ **TIDAK TERBUKTI** — `npx eslint .` di committed tree = **0 warnings**. Kemungkinan audit scan tree lain / state lama. |

→ T-11 ("ESLint 27 warnings") = **SALAH / STALE**. Drop.

## 3. GOD COMPONENTS — UKURAN FILE

| File | Klaim audit | Real (committed tree `wc -l`) | Verdict |
|------|-------------|-------------------------------|---------|
| `Dashboard/Index.tsx` | 2.257 | **1.348** | ⚠️ OVERSTATED angka (audit tukar Dashboard↔PengaturanOutlet), tapi **masalah NYATA** |
| `PengaturanOutlet/Index.tsx` | 1.348 | **2.257** | ⚠️ angka audit = ukuran Dashboard asli; file ini memang 2.257 (god) |
| `BukuMenuDigital/CustomerView.tsx` | 2.071 | **2.071** | ✅ VALID |
| `KatalogMenu/Index.tsx` | 1.126 | **391** | ❌ OVERSTATED (3× lipat) — tetap oversized |
| `KDS/Index.tsx` | 811 | **380** | ❌ OVERSTATED |
| `Owner/GoogleReviews.tsx` | 613 | **613** | ✅ VALID |
| `Owner/OwnerDashboard.tsx` | 748 (Pages) | ada di `Components/Owner/` (bukan Pages) | ⚠️ path salah, file nyata ada |

→ T-03/T-13/T-14 = **VALID (god components nyata)**, tapi angka spesifik sebagian
salah (audit menukar Dashboard/PengaturanOutlet & melebih-lebihkan KDS/Katalog).
Prioritas pecah tetap benar: CustomerView 2071 + PengaturanOutlet 2257.

## 4. TYPE-SAFETY (`any`) & SHARED SHIM

| Klaim | Verifikasi (committed tree) | Verdict |
|-------|------------------------------|---------|
| 26 `any` di Pages | **32** `: any`/`any[]` di Pages | ✅ VALID (audit under-count) → T-15 VALID |
| 53 file import Shared shim | **50** file | ✅ VALID (audit over-count 3) → T-05 VALID |
| T-10 `any` di MainLayout OPEN | **0 `any`** di MainLayout (committed); `Types/reservation.ts` ADA | ❌ **SUDAH CLOSED** (`047e4fe`, H-3) — audit salah |

## 5. SECURITY

| Klaim | Verifikasi | Verdict |
|-------|------------|---------|
| T-01 GeminiAI prompt injection FIXED (`PromptSanitizer`) | `GeminiAiController.php:6,25,37` pakai `$sanitizer->looksInjected/sanitize` | ✅ VALID CLOSED |
| No hardcoded secrets | `config()/env()`, `Hash::make`, `Crypt::encryptString` | ✅ VALID |
| Public endpoints throttled + tenant from record | `throttle:30,1`; tenant via `outlet_id` | ✅ VALID |
| T-12: `/kds` dll tanpa controller | `routes/web.php:208,213,231` = `Inertia::render` murni; KdsController ada tapi hanya API (`getKdsOrders` dll), **tidak ada method `index()`** yang load initial queue | ✅ VALID — halaman render tapi data awal di-fetch client; ini by-design Inertia tapi T-12 butuh perhatian |

→ T-01 CLOSED ✅. T-12 VALID (minor).

## 6. T-07 `is_estimate` BADGE — VERIFIED CLOSED

Audit tandai **OPEN**. Kode membuktikan **SUDAH CLOSED**:
- Backend: `OwnerDashboardService.php:80,155,185` kirim `'is_estimate' => true`.
- FE: `resources/js/Pages/Dashboard/OwnerDashboard.tsx:49,185,336` — tipe
  `is_estimate?: boolean`, komentar wajib badge, dan render literal **`~Estimasi`**
  (line 336) saat `profitMetrics?.is_estimate === true`.
- Commit `047e4fe` ("fix(audit-2026-07-17): C-3 badge estimasi") = bukti historis.

→ T-07 = **SALAH dibuka oleh audit**. CLOSED.

## 7. HUTANG TEKNIS — REKONSOLIASI

| ID | Audit | Counter-check | Verdict |
|----|-------|---------------|---------|
| T-01 | CLOSED | CLOSED (sanitizer ada) | ✅ setuju |
| T-02 | OPEN | OPEN (belum cek Redis monitor) | ⏸️ biarkan |
| T-03 | OPEN | OPEN (Dashboard 1348) | ✅ setuju |
| T-04 | OPEN | OPEN (2 dashboard) | ✅ setuju |
| T-05 | OPEN | OPEN (50 file shim) | ✅ setuju |
| T-06 | OPEN | OPEN (OwnerDashboardController SRP) | ✅ setuju |
| T-07 | OPEN | **CLOSED** (`047e4fe`) | ❌ audit salah |
| T-08 | OPEN | OPEN | ✅ setuju |
| T-09 | OPEN | OPEN | ✅ setuju |
| T-10 | OPEN | **CLOSED** (reservation.ts + MainLayout 0 any) | ❌ audit salah |
| T-11 (baru) | 27 warnings | **0 warnings** | ❌ STALE/SALAH → drop |
| T-12 (baru) | /kds no controller | VALID (render-only route) | ✅ setuju |
| T-13 (baru) | CustomerView 2071 | 2071 | ✅ setuju |
| T-14 (baru) | PengaturanOutlet 1348 | **2257** (audit under-count) | ⚠️ VALID tapi angka salah |
| T-15 (baru) | 26 any | **32 any** | ✅ VALID (under-count) |

## 8. VERDICT — APA YANG BOLEH DIEKSEKUSI

**VALID & AMAN dikerjakan (tanpa blind-fix):**
- Pecah god components: CustomerView (2071), PengaturanOutlet (2257), Dashboard (1348).
  ⚠️ Tapi tunggu dulu — lihat §URGENT: tree mana yang dipecah?
- T-15: ganti 32 `any` → interface (sudah ada `Types/`).
- T-05: migrasi Shared shim (50 file).
- T-12: tambah initial-data load untuk /kds, /laporan-penjualan (PHP/react).

**DITOLAK / SALAH (jangan eksekusi):**
- T-11 (27 warnings) — 0 warnings nyata.
- T-07, T-10 mark-as-OPEN — sudah CLOSED.

**⚠️ URGENT — DUAL-TREE INCONSISTENCY (bukan dari audit, ditemukan saat counter-check):**
Workspace punya 2 `resources/js` yang tidak sinkron:
- Committed (`restoku backend/resources/js`): source "asli" yg di-audit, punya
  god components + 242 test + T-07/T-10 CLOSED.
- Build source (`restoku frontend/resources/js`): terpisah, tidak di-git, hanya
  13 test, Dashboard 90 baris, TIDAK ada CustomerView/reservation.ts.
`npm run build` membaca tree kedua → artifact deploy BUKAN yang di-commit/di-audit.
Risiko: perbaikan di committed tree tidak akan masuk ke build; sebaliknya build
memuat kode lawas. **Wajib diselesaikan sebelum eksekusi T-03/T-13/T-14** — pilih
satu source-of-truth (rekomendasi: jadikan `restoku backend/resources/js` satu-satunya
tree, hapus/merge `restoku frontend`, arahkan vite root ke sana).

## 9. BUKTI EKSEKUSI (real tool output)

```
# PHPUnit (committed backend)
php artisan test --no-coverage
→ Tests: 5 skipped, 472 passed (1175 assertions), Duration 87.70s

# Vitest committed tree
resources/js: 41 test file ditemukan (audit: 41 passed, 242 tests)

# ESLint committed tree
npx eslint .  → 0 errors, 0 warnings

# God component sizes (wc -l, committed tree)
CustomerView.tsx  2071
PengaturanOutlet  2257
Dashboard/Index   1348
KatalogMenu       391
KDS/Index         380
GoogleReviews     613

# any / shim counts (committed tree)
grep any Pages → 32
grep Components/Shared → 50

# T-07/T-10 proof
OwnerDashboardService.php:80,155,185  'is_estimate' => true
Pages/Dashboard/OwnerDashboard.tsx:336  "~Estimasi"
Types/reservation.ts EXISTS; MainLayout.tsx 0 any
```
