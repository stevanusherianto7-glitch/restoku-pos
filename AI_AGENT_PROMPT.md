# 🤖 Prompt Standar untuk AI Agent
### (Antigravity / Gemini / Copilot / Claude / Cursor / Windsurf)

Gunakan atau salin (*copy-paste*) instruksi di bawah ini setiap kali Anda memulai sesi percakapan baru dengan AI Agent dalam mengembangkan fitur atau melakukan *refactoring* pada proyek **Restoku (6-Layer Enterprise Multi-Tenant SaaS)**.

> **Status Terakhir:** Terverifikasi ✅ — E2E 50/50 routes HTTP OK | 35/35 Backend Tests | 2415 modules compiled clean.
> Diperbarui: Juli 2026

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

【KEWAJIBAN THEMING】
- Semua komponen UI yang mendukung mode terang/gelap WAJIB membaca `isLight` dari
  `useTenantSettings()` (tersedia via Components/Shared). Jangan hardcode warna teks.

【KEWAJIBAN VERIFIKASI SETELAH KODING】
- Setelah setiap perubahan kode: jalankan `npm run tdr` (35+ tests + build + lint)
- Setelah perubahan route/controller/middleware: jalankan `npm run tdr:e2e`
  (verifikasi 50 HTTP endpoint secara live)
- Codebase dianggap SELESAI hanya jika kedua perintah di atas menghasilkan ✅ PASS

【STATUS E2E REFERENSI (Terakhir Diverifikasi)】
- 50/50 routes: HTTP 200 ✅ (halaman Inertia)
- /api/* endpoints: HTTP 401 (protected, expected) ✅
- /api/orders POST & /api/reservations: HTTP 422 (validasi, expected) ✅
- 35/35 Backend PHPUnit tests ✅
- 2415 Vite modules compiled clean ✅

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
| **Verifikasi akhir** | `npm run tdr` (wajib) + `npm run tdr:e2e` (wajib jika ada perubahan route) |

### ❌ JANGAN PERNAH LAKUKAN INI

| Larangan | Alasan |
|----------|--------|
| `localStorage.getItem('plan')` untuk data bisnis | Data bisa stale, tidak terisolasi per tenant |
| Hardcode `const plan = 'enterprise'` di komponen | Membypass subscription enforcement |
| `Cache::remember()` tanpa `instanceof` check | Bisa menghasilkan `__PHP_Incomplete_Class` |
| Import dari `@/Components/Shared` (deprecated shim) | Gunakan `shared/` langsung atau via barrel |
| Menulis tipe inline `interface MyType { ... }` di komponen | Duplikasi, gunakan `Types/` |

---

## 📁 Peta File Referensi Cepat

```
restoku backend/
├── TDR_WORKFLOW_GUIDE.md        ← 📖 BACA PERTAMA — SOP testing & refactoring
├── .agents/AGENTS.md            ← 📖 BACA KEDUA  — Coding standards & UI rules
├── README.md                    ← Gambaran sistem, quick start, route table
├── BACKEND_DESIGN.md            ← Arsitektur backend aktual (models, services)
├── FRONTEND_ARCHITECTURE.md     ← Arsitektur frontend aktual (hooks, components)
├── scripts/
│   ├── tdr.mjs                  ← npm run tdr (all-in-one: lint + test + build)
│   └── e2e-test-loop.js         ← npm run tdr:e2e (50 route HTTP verification)
├── app/
│   ├── Models/Scopes/TenantScope.php   ← Global multi-tenant isolation
│   └── Services/
│       ├── TenantContext.php    ← SSOT identitas tenant per request
│       ├── FeatureRegistry.php  ← Plan hierarchy & feature gating
│       └── SettingsService.php  ← Fallback chain + self-healing cache
└── resources/js/
    ├── Hooks/useSubscription.ts ← ✅ WAJIB untuk feature check di React
    ├── Components/Shared.tsx    ← useTenantSettings() tersedia di sini
    └── lib/
        ├── constants.ts         ← PLAN_FEATURES, ORDER_STATUS, TAX_LABELS
        └── formatters.ts        ← formatRupiah(), formatDate()
```

---

<p align="center">
  <b>Restoku Engineering Standard</b><br>
  Automated Quality Control • Zero Data Leakage • 50/50 E2E Verified
</p>
