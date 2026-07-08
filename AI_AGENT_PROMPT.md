# 🤖 Prompt Standar untuk AI Agent
### (Antigravity / Gemini / Copilot / Claude / Cursor / Windsurf)

Gunakan atau salin (*copy-paste*) instruksi di bawah ini setiap kali Anda memulai sesi percakapan baru dengan AI Agent dalam mengembangkan fitur atau melakukan *refactoring* pada proyek **Restoku (6-Layer Enterprise Multi-Tenant SaaS)**.

> **Status Terakhir:** Terverifikasi ✅ — E2E 61/61 routes HTTP OK | 51/51 Backend PHPUnit | 38/38 Vitest Frontend | 104/104 Playwright (4 browsers) | 2417 modules compiled clean.
> Diperbarui: 8 Juli 2026

---

## 📋 Salin Teks di Bawah Ini ke dalam Chat AI Agent:

```text
Halo! Sebelum kamu memulai menganalisis, menulis kode, atau melakukan refactoring pada
proyek Restoku ini, kamu WAJIB membaca dan memahami aturan arsitektur serta alur kerja
kami terlebih dahulu dengan menggunakan tool view_file pada 5 file dokumen markdown berikut:

1. TDR_WORKFLOW_GUIDE.md  — Panduan wajib TDR & alur kerja Bottom-Up 6 Layer
2. .agents/AGENTS.md      — SOP developer: UI/UX guidelines, coding standards, & do/don't
3. README.md              — Gambaran sistem: arsitektur, tech stack, route, & quick start
4. BACKEND_DESIGN.md      — Arsitektur backend aktual: Models, Services, Middleware, Controllers
5. FRONTEND_ARCHITECTURE.md — Arsitektur frontend aktual: Hooks, Components, Data Flow, Theming

Setelah kamu selesai membaca kelima file tersebut, konfirmasikan pemahamanmu mengenai
poin-poin berikut sebelum kita mulai bekerja:

【ARSITEKTUR & TDR】
- Alur kerja Test-Driven Refactoring (TDR): Tulis test dulu → Koding Bottom-Up (Layer 1–6)
  → Verifikasi dengan `npm run tdr`
- 3 skenario test wajib per fitur: Happy Path, Tenant Isolation (HTTP 403/404),
  Subscription Gate (HTTP 402)

【LARANGAN MUTLAK — JANGAN PERNAH LAKUKAN INI】
- ❌ Menggunakan localStorage untuk data bisnis kritis (tarif pajak, daftar staf,
  konfigurasi outlet). Gunakan usePage().props dari Inertia Shared Props.
- ❌ Hardcode subscription/plan check seperti `const isKdsEnabled = true`. Gunakan
  hook `useSubscription()` dari Hooks/useSubscription.ts.
- ❌ Menulis tipe TypeScript inline di komponen. Gunakan definisi di Types/.
- ❌ Hardcode konstanta tarif langsung di komponen. Gunakan lib/constants.ts.
- ❌ Akses props array dari Inertia TANPA null/Array.isArray check. Props bisa null
  di halaman tertentu atau saat data DB belum ada (contoh: employee.pin = null).

【KEWAJIBAN THEMING】
- Semua komponen UI yang mendukung mode terang/gelap WAJIB membaca `isLight` dari
  `useTenantSettings()` (tersedia via Components/Shared). Jangan hardcode warna teks.

【KEWAJIBAN NULL-SAFETY — WAJIB SAAT AKSES PROPS INERTIA】
- Selalu gunakan Array.isArray(props) sebelum akses .length atau .map()
- Selalu filter data yang masuk: arr.filter(e => e && typeof e.field === 'string')
- Gunakan optional chaining: e.pin?.length, e.name ?? 'Unknown'
- Contoh bug nyata yang pernah terjadi: login_employees dari DB mengandung pin: null
  → crash TypeError: Cannot read properties of undefined (reading 'length')

【KEWAJIBAN VERIFIKASI SETELAH KODING】
- Setelah setiap perubahan kode: jalankan `npm run tdr` (39+ tests + build + lint)
- Setelah perubahan route/controller/middleware: jalankan `npm run tdr:e2e`
  (verifikasi 50 HTTP endpoint secara live)
- Untuk perubahan React komponen kritis: jalankan `npm run test:pw:chromium`
  (Playwright browser test — mendeteksi React runtime error yg tidak terdeteksi HTTP check)
- Codebase dianggap SELESAI hanya jika semua perintah di atas menghasilkan ✅ PASS

【STATUS E2E REFERENSI (Terakhir Diverifikasi — 8 Juli 2026)】
- 61/61 routes & API endpoints ✅ (39 halaman Inertia + 22 API endpoint)
- Inertia pages: HTTP 200 ✅ (termasuk /owner/google-reviews)
- Protected API /api/*: HTTP 401 (expected) ✅
- Public API /api/orders POST & /api/reservations: HTTP 422 (validasi, expected) ✅
- Public API /api/outlet-operating-hours: HTTP 200 ✅
- 51/51 Backend PHPUnit tests ✅ (124 assertions)
- 38/38 Vitest Frontend tests ✅ (StaffLogin + GoogleReviews null-safety: A1–A4, B1–B4, C1–C4, D1–D6, E1–E4)
- 104/104 Playwright Browser tests ✅ (Chromium + Firefox + WebKit + Mobile Chrome, covering login + 17 critical pages)
- 2417 Vite modules compiled clean ✅

Setelah kamu mengonfirmasi pemahamanmu terhadap semua poin di atas, baru kita mulai
mengerjakan tugasnya!
```

---

## ⚡ Alternatif Singkat (IDE berbasis AI):

Jika Anda menggunakan IDE berbasis AI (seperti Cursor, Windsurf, atau Antigravity IDE)
yang bisa membaca file secara langsung, cukup ketikkan:

```text
@AI_AGENT_PROMPT.md Tolong baca dan ikuti instruksi pada file ini sebelum kita memulai tugas baru.
```

---

## 🚦 Quick-Reference Rules untuk AI Agent

### ✅ SELALU LAKUKAN INI

| Kategori | Aturan |
|----------|--------|
| **Data bisnis** | Baca dari `usePage().props` (Inertia Shared Props) |
| **Feature gating** | Gunakan `useSubscription()` dari `Hooks/useSubscription.ts` |
| **Theming** | Baca `isLight` dari `useTenantSettings()` sebelum assign warna |
| **TypeScript types** | Definisikan di `Types/` (menu.ts, order.ts, staff.ts, outlet.ts) |
| **Konstanta** | Taruh di `lib/constants.ts`, formatter di `lib/formatters.ts` |
| **Multi-tenancy** | Semua model WAJIB pakai `TenantScope` via `app/Models/Scopes/` |
| **HTTP Gateway** | Middleware stack: `['auth', 'tenant', 'plan:<fitur>']` |
| **Null-safety props** | `Array.isArray(arr) && arr.length > 0` sebelum `.map()` atau `.length` |
| **Optional chaining** | `e.pin?.length`, `e.name ?? 'fallback'` untuk field yang bisa null di DB |
| **Verifikasi akhir** | `npm run tdr` (wajib) + `npm run tdr:e2e` (wajib jika ada perubahan route) + `npm run test:pw:chromium` (wajib jika ada perubahan komponen React) |

### ❌ JANGAN PERNAH LAKUKAN INI

| Larangan | Alasan |
|----------|--------|
| `localStorage.getItem('plan')` untuk data bisnis | Data bisa stale, tidak terisolasi per tenant |
| Hardcode `const plan = 'enterprise'` di komponen | Membypass subscription enforcement |
| `Cache::remember()` tanpa `instanceof` check | Bisa menghasilkan `__PHP_Incomplete_Class` |
| Import dari `@/Components/Shared` (deprecated shim) | Gunakan `shared/` langsung atau via barrel |
| Menulis tipe inline `interface MyType { ... }` di komponen | Duplikasi, gunakan `Types/` |
| `arr.length` atau `arr.map()` tanpa null-check | Crash saat props dari Inertia bernilai null (terbukti di login page) |
| `e.field.length` tanpa optional chaining | Crash saat record DB punya field null (terbukti: employee.pin = null) |
| Mengandalkan HTTP 200 check sebagai bukti "React aman" | HTTP 200 = server OK, bukan render OK. Gunakan Playwright untuk itu |

---

## 🧪 Perintah Testing Lengkap

```bash
# 1. TDR standar — wajib setelah setiap perubahan kode
npm run tdr

# 2. TDR + E2E HTTP loop — wajib jika ada perubahan route/controller/middleware
npm run tdr:e2e

# 3. Playwright browser test — wajib jika ada perubahan komponen React
npm run test:pw:chromium        # Chromium saja (cepat, ~10 detik)
npm run test:pw                 # Semua browser: Chromium + Firefox + WebKit + Mobile

# 4. Vitest unit test saja (cepat, ~3 detik)
npm test

# 5. Playwright interactive UI (debugging visual)
npm run test:pw:ui

# 6. Playwright headed mode (lihat browser terbuka)
npm run test:pw:headed

# 7. Playwright debug mode (step-by-step)
npm run test:pw:debug
```

---

## 📁 Peta File Referensi Cepat

```
restoku backend/
├── TDR_WORKFLOW_GUIDE.md        ← 📖 BACA PERTAMA — SOP testing & refactoring
├── .agents/AGENTS.md            ← 📖 BACA KEDUA  — Coding standards & UI rules
├── README.md                    ← Gambaran sistem, quick start, route table
├── BACKEND_DESIGN.md            ← Arsitektur backend aktual (models, services)
├── FRONTEND_ARCHITECTURE.md     ← Arsitektur frontend aktual (hooks, components)
├── AI_AGENT_PROMPT.md           ← 📖 File ini — copy-paste ke AI Agent baru
├── playwright.config.ts         ← Konfigurasi Playwright (Chromium/Firefox/WebKit)
├── scripts/
│   ├── tdr.mjs                  ← npm run tdr (all-in-one: lint + test + build)
│   └── e2e-test-loop.js         ← npm run tdr:e2e (50 route HTTP verification)
├── e2e/
│   └── staff-login.spec.ts      ← Playwright browser test (mendeteksi React runtime error)
├── app/
│   ├── Models/Scopes/TenantScope.php   ← Global multi-tenant isolation
│   └── Services/
│       ├── TenantContext.php    ← SSOT identitas tenant per request
│       ├── FeatureRegistry.php  ← Plan hierarchy & feature gating
│       └── SettingsService.php  ← Fallback chain + self-healing cache
└── resources/js/
    ├── Hooks/useSubscription.ts ← ✅ WAJIB untuk feature check di React
    ├── Components/Shared.tsx    ← useTenantSettings() tersedia di sini
    ├── __tests__/
    │   ├── setup.ts             ← Vitest jsdom setup
    │   ├── dummy.test.tsx       ← Sanity check
    │   └── StaffLogin.test.tsx  ← 16 unit tests: null-safety A1–A8, B1–B5, C1–C2
    └── lib/
        ├── constants.ts         ← PLAN_FEATURES, ORDER_STATUS, TAX_LABELS
        └── formatters.ts        ← formatRupiah(), formatDate()
```

---

## ⚠️ Pelajaran dari Bug Produksi (8 Juli 2026)

> Bug ini **lolos TDR** karena layer Frontend hanya punya 1 dummy test (`1+1=2`).
> HTTP E2E check `/login` → 200 OK **tidak berarti React berhasil dirender**.

**Root cause:** `login_employees` dari DB mengandung record dengan `pin: null`
(karyawan baru yang belum diset PIN). Kode langsung akses `e.pin.length` → crash.

**Solusi yang diterapkan:**
1. `Array.isArray()` check sebelum semua operasi array
2. `filterValid()` — filter hanya karyawan dengan `typeof pin === 'string' && pin.length > 0`
3. Optional chaining `e.pin?.length ?? 0` di render
4. Guard `if (!emp.pin) continue` di loop verifikasi
5. **16 Vitest unit tests** covering semua skenario null/undefined
6. **9 Playwright browser tests** yang detect React crash secara real

---

<p align="center">
  <b>Restoku Engineering Standard</b><br>
  Automated Quality Control • Zero Data Leakage • 61/61 E2E Verified<br>
  51 PHPUnit • 38 Vitest • 26 Playwright (104 runs) • 2417 Vite Modules Clean
</p>
