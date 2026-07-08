# 🛡️ Panduan Workflow Test-Driven Refactoring (TDR) — 6-Layer SaaS Architecture

Dokumen ini adalah instruksi standar dan panduan kerja resmi bagi **Developer Manusia** maupun **AI Agent (seperti Antigravity / Gemini / Copilot)** dalam mengembangkan fitur baru atau melakukan refactoring pada codebase **Restoku (6-Layer Enterprise Multi-Tenant SaaS)**.

---

## 🎯 Filosofi & Aturan Utama

Dalam arsitektur SaaS berskala besar dengan ribuan tenant, satu kesalahan kecil pada *filter query* atau *feature gate* dapat menyebabkan **kebocoran data antar-tenant (*data leakage*)** atau **kerugian finansial/langganan**.

Oleh karena itu, setiap pengembangan atau perubahan kode **WAJIB** mengikuti siklus **Test-Driven Refactoring (TDR)** menggunakan tool otomatis yang telah disediakan di dalam proyek ini: `scripts/tdr.mjs`.

---

## 🔄 Workflow Sehari-hari (SOP Developer & AI Agent)

Ketika Anda atau tim engineer (maupun AI Agent) ingin menambahkan fitur baru atau mengubah logika sistem, ikuti 3 langkah wajib ini:

```
+-----------------------------------------------------------------------------------+
| 1. BUAT / EDIT TEST TERLEBIH DAHULU (TDR)                                         |
|    Tulis ekspektasi & skenario pengujian di tests/Feature/NamaModulTest.php      |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
| 2. LAKUKAN KODING / REFACTORING (LAYER 1 - LAYER 5)                               |
|    Ubah struktur tabel, Model, Service, Controller, atau komponen UI React        |
+-----------------------------------------------------------------------------------+
                                         │
                                         ▼
+-----------------------------------------------------------------------------------+
| 3. JALANKAN VERIFIKASI OTOMATIS: `npm run tdr`                                    |
|    Dalam ~10 detik, script menjadi hakim yang menentukan apakah kode aman & valid |
+-----------------------------------------------------------------------------------+
```

### Langkah 1: Buat / Edit Test Terlebih Dahulu (TDR)
Sebelum menyentuh logika bisnis atau controller, tulis atau perbarui test case di:
- **Backend:** `tests/Feature/NamaModulTest.php` (Gunakan trait `HasTenantSetup`)
- **Frontend:** `resources/js/__tests__/NamaKomponen.test.tsx` (Jika ada logika kalkulasi kompleks)

**3 Skenario Wajib dalam Test Backend SaaS:**
1. **Happy Path:** Fitur bekerja normal untuk tenant pemilik data dengan langganan yang aktif.
2. **Tenant Isolation Check (Anti Data-Leak):** Coba akses/edit resource tersebut menggunakan akun dari *Tenant B*. Wajib menghasilkan HTTP `404 Not Found` atau `403 Forbidden`.
3. **Subscription Gate Check:** Coba akses fitur premium menggunakan akun dari tenant berpaket *Basic*. Wajib menghasilkan HTTP `402 Payment Required`.

### Langkah 2: Lakukan Koding / Refactoring
Lakukan implementasi dari layer bawah ke atas (*Bottom-Up*):
   - **Layer 1 (DB):** Buat migrasi jika perlu (`php artisan make:migration`).
   - **Layer 2 (Model):** Pastikan model menggunakan `TenantScope` (Global Scope di `app/Models/Scopes/`) untuk isolasi otomatis per tenant.
   - **Layer 3 (Service):** Taruh logika bisnis di Service (`app/Services/`), manfaatkan `TenantContext` sebagai resolver. SettingsService menggunakan self-healing cache (instanceof check).
   - **Layer 4 (HTTP):** Gunakan middleware `['auth', 'tenant', 'plan:<nama_fitur>']`. Data dikirim ke React via `Inertia::render()` dengan props.
   - **Layer 5 (React UI):** Gunakan `useSubscription()` dari `Hooks/useSubscription.ts` untuk feature gating dinamis. Baca data dari `usePage().props` (SSOT). **JANGAN** gunakan `localStorage` untuk data bisnis kritis atau konstanta hardcoded seperti `MOCK_PLAN`.

### Langkah 3: Jalankan Eksekusi TDR Suite (`npm run tdr`)
Jalankan perintah pengujian terintegrasi dari terminal Anda:

```bash
# Pilihan 1: Via npm (Rekomendasi Utama - Cross Platform)
npm run tdr

# Pilihan 1b: Via npm dengan Live E2E Route Test (Otomatis start server port 8000)
npm run tdr:e2e

# Pilihan 2: Via Composer
composer tdr

# Pilihan 3: Via PowerShell (Khusus Windows)
.\scripts\tdr.ps1

# Pilihan 4: Via Node.js Langsung
node scripts/tdr.mjs
```

---

## ⚙️ Bedah Mesin Verifikasi TDR (`scripts/tdr.mjs`)

Saat Anda menjalankan `npm run tdr`, script ini secara otomatis mengeksekusi **5 Langkah Audit & Verifikasi Beruntun**:

| Step | Nama Proses | Perintah Internal | Yang Diperiksa & Divalidasi |
|:---:|---|---|---|
| **1** | **SaaS Architecture & Multi-Tenant Linter** | `Internal AST / File Scanner` | • Memastikan tidak ada variabel hardcoded (`MOCK_PLAN`, `FEATURE_LOCKS`) di frontend.<br>• Memastikan seluruh model Eloquent di `app/Models/` mematuhi dan memasang `TenantScope`. |
| **2** | **Backend Automated Test Suite** | `php artisan test` | • Menjalankan 35+ Feature & Unit test Laravel.<br>• Memvalidasi isolasi tenant, endpoint atomik, locking konkurensi, dan HTTP status code.<br>• 3 skenario wajib: Happy Path, Tenant Isolation (HTTP 404/403), Subscription Gate (HTTP 402). |
| **3** | **Frontend Unit Test Suite** | `npm test -- --run` | • Menjalankan Vitest untuk memverifikasi logika utilitas, formatters, dan komponen React. |
| **4** | **Production Bundle Verification** | `npm run build` | • Memastikan kompilasi TypeScript bebas error.<br>• Memverifikasi bahwa seluruh 2,415+ modul dapat dibundel sempurna oleh Vite tanpa impor yang rusak. |
| **5** | **E2E HTTP Route Loop (Live Verification)** | `node scripts/e2e-test-loop.js` | • Mengeksekusi panggilan HTTP nyata ke **50 rute aplikasi** (POS, KDS, Dashboard, API endpoints, dll.).<br>• Memastikan seluruh halaman Inertia merender status 200 OK tanpa error 500 atau *broken routing*.<br>• Hasil normal: 37/50 berhasil (13 kegagalan non-kritis: 2x HTTP 404 owner routes belum ada, 11x HTTP 401/422 karena API endpoint butuh auth session). *(Otomatis berjalan jika server aktif atau menggunakan `npm run tdr:e2e`)*. |

> [!IMPORTANT]
> **Aturan Kelulusan:** Jika salah satu dari langkah di atas gagal (mengeluarkan warna merah), maka proses refactoring dianggap **GAGAL / BELUM SELESAI**. Anda atau AI Agent wajib memperbaiki root cause-nya hingga perintah `npm run tdr` menghasilkan status **✔ TDR VERIFICATION SUCCESSFUL**.

---

## 🤖 Instruksi Khusus untuk AI Agent

Jika Anda adalah AI Agent (Antigravity, Gemini, Copilot, dll.) yang sedang bertugas di repositori ini, Anda **WAJIB** mematuhi aturan berikut saat memberikan atau mengeksekusi solusi:

1. **Pantang Menggunakan `localStorage` untuk Data Bisnis Kritis:**
   Semua konfigurasi outlet, tarif pajak, dan daftar staf harus dibaca dari database melalui *Inertia Shared Props* (`usePage().props`). `localStorage` hanya boleh digunakan sebagai cache UI non-kritis (misal: mode tampilan, pilihan tab terakhir).
2. **Pantang Membuat Hardcoded Subscription Mocks:**
   Selalu gunakan custom hook `useSubscription()` dari `Hooks/useSubscription.ts` di React untuk memverifikasi apakah sebuah fitur (`kds`, `perbandingan_outlet`, `staf_shift`) diizinkan untuk tenant aktif. **JANGAN** hardcode seperti `const isKdsEnabled = true`.
3. **Wajib Membaca `useTenantSettings()` untuk Theming:**
   Semua komponen UI yang mendukung mode terang/gelap WAJIB membaca `isLight` dari `useTenantSettings()` (tersedia via `Components/Shared`). Jangan hardcode warna teks tanpa conditional styling.
4. **Wajib Memanggil `npm run tdr` Setelah Selesai Mengedit Kode:**
   Sebelum Anda melaporkan kepada User bahwa tugas/refactoring telah selesai, jalankan `npm run tdr` untuk membuktikan bahwa seluruh 35+ test lulus dan bundle produksi aman.
5. **Wajib Memanggil `npm run tdr:e2e` Setelah Perubahan Route/Controller:**
   Jika ada perubahan pada rute HTTP, controller, atau middleware, jalankan `npm run tdr:e2e` yang akan memverifikasi 50 endpoint secara end-to-end.

---

<p align="center"><b>Restoku Engineering Standard</b> — Build Fast, Scale Safely, Zero Data Leaks.</p>
