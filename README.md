# 🍽️ Restoku — Platform Manajemen Restoran & Multi-Tenant SaaS Berskala Besar

<p align="center">
  <img src="https://img.shields.io/badge/Laravel-13.x-FF2D20?style=for-the-badge&logo=laravel&logoColor=white" alt="Laravel" />
  <img src="https://img.shields.io/badge/React-19-61DAFB?style=for-the-badge&logo=react&logoColor=black" alt="React" />
  <img src="https://img.shields.io/badge/TypeScript-5.x-3178C6?style=for-the-badge&logo=typescript&logoColor=white" alt="TypeScript" />
  <img src="https://img.shields.io/badge/Inertia.js-2.x-9553E9?style=for-the-badge&logo=inertia&logoColor=white" alt="Inertia.js" />
  <img src="https://img.shields.io/badge/Tailwind-4.x-06B6D4?style=for-the-badge&logo=tailwindcss&logoColor=white" alt="Tailwind CSS" />
  <img src="https://img.shields.io/badge/Vite-6.x-646CFF?style=for-the-badge&logo=vite&logoColor=white" alt="Vite" />
  <img src="https://img.shields.io/badge/Architecture-6--Layer_SaaS-00C853?style=for-the-badge&logo=architecture&logoColor=white" alt="6-Layer SaaS Architecture" />
</p>

---

## 📖 Tentang Proyek

**Restoku** adalah platform manajemen restoran *all-in-one* berbasis **Enterprise Multi-Tenant SaaS (Software as a Service)** yang dirancang untuk mendukung ekosistem kuliner dari skala warung independen hingga jaringan *franchise* multi-cabang dengan ribuan outlet. 

Dibangun dengan fondasi stack modern **Laravel 13 + React 19 + Inertia.js 2**, Restoku menyatukan seluruh operasional restoran—mulai dari Point of Sales (POS), Kitchen Display System (KDS), manajemen meja & QR menu, inventaris bahan baku, HRD & shift staf, hingga analitik finansial owner—dalam satu sistem yang super cepat, real-time, dan terisolasi secara aman.

---

## 🏛️ Arsitektur Multi-Tenant SaaS Berskala Besar (6 Layer)

Salah satu keunggulan terbesar dan paling fundamental dari Restoku adalah **Arsitektur 6-Layer Enterprise Multi-Tenant SaaS**. Arsitektur ini dirancang secara khusus untuk mengatasi tantangan terbesar dalam aplikasi berskala besar: **mengelola ribuan tenant (grup restoran) dengan paket berlangganan (*subscription plan*) yang berbeda-beda serta kustomisasi pengaturan outlet yang kompleks, tanpa mengorbankan performa, keamanan, atau kemudahan pemeliharaan.**

### 🌟 Mengapa Arsitektur 6 Layer Restoku Unggul?

1. **🔒 Isolasi Data Mutlak (*True Tenant Isolation*) Tanpa Duplikasi Server**
   - Menggunakan pola *Single-Database Shared-Schema* yang diperkuat dengan *Global Scopes* (`TenantScope`) dan *Centralized Resolver* (`TenantContext`).
   - Ribuan grup restoran dapat berjalan bersamaan di dalam database yang sama dengan efisiensi biaya server maksimal, namun memiliki tingkat keamanan dan privasi sekelas *database-per-tenant*.
   - **Zero Data Leakage:** Developer tidak perlu khawatir lupa menuliskan `where('tenant_id', ...)` pada query. Sistem secara otomatis memindai, memproses, dan memfilter seluruh operasi pembacaan maupun penulisan data di level ORM Eloquent.

2. **🏢 Hierarchical Settings Fallback (Outlet → Tenant → Default System)**
   - Menjawab realitas bisnis kuliner multi-cabang di mana setiap outlet sering kali memiliki kebijakan pajak (PBJT vs PPN), tarif *service charge*, atau jam operasional yang berbeda dari kantor pusat.
   - Melalui `SettingsService`, sistem mengevaluasi pengaturan secara berjenjang dengan *zero-latency fallback*: jika sebuah outlet tidak memiliki aturan khusus, sistem otomatis mengambil kebijakan dari tingkat *Tenant*; jika tidak ada, sistem menerapkan *Default System*.

3. **🛡️ Backend-Enforced Feature Gating & Subscription Management**
   - Keamanan pembatasan fitur (seperti modul *Perbandingan Outlet* untuk tier **Pro** atau *KDS* untuk tier **Enterprise**) tidak hanya bergantung pada penyembunyian elemen UI di frontend.
   - Diperkuat di layer HTTP melalui middleware `RequiresPlan`. Jika pengguna mencoba melakukan *bypass* melalui DevTools, cURL, atau Postman, server langsung menolak request dengan standar HTTP `402 Payment Required` atau merender halaman Inertia `Errors/UpgradeRequired`.

4. **⚡ Zero-Race-Condition Transaction Engine**
   - Menggunakan mekanisme *pessimistic locking* (`lockForUpdate()`) tingkat baris tenant di dalam transaksi atomik database (`DB::transaction`).
   - Menjamin pembuatan nomor pesanan (*order code*), transaksi kasir serentak, serta kalkulasi inventaris tetap akurat dan bebas dari *race condition* atau nomor ganda saat jam sibuk (*rush hour*).

5. **🎯 Single Source of Truth (SSOT) via Inertia Shared Props**
   - Menghilangkan sinkronisasi manual atau *mock data* yang terfragmentasi. Status langganan, daftar fitur yang terbuka, data staf, dan konfigurasi outlet disuntikkan secara real-time ke dalam memori React melalui `usePage().props` pada setiap navigasi halaman.

---

### 📚 Bedah Detail 6 Layer Arsitektur Restoku

```
+-------------------------------------------------------------------------------+
| LAYER 6: TESTING & VERIFICATION SUITE                                         |
|  • Automated Tenant Isolation Tests (Pest/PHPUnit) • Subscription Gate Tests  |
|  • Vitest Frontend Unit Suite • Vite Production Bundle Integrity Verification |
+-------------------------------------------------------------------------------+
                                       │
+-------------------------------------------------------------------------------+
| LAYER 5: FRONTEND PRESENTATION & DYNAMIC UI (React 19 + TypeScript + Tailwind)|
|  • useSubscription Hook • Dynamic Feature Lock Badges • SSOT Inertia Props    |
|  • Atomic Form Submissions • Real-time KDS & POS UI Interfaces                |
+-------------------------------------------------------------------------------+
                                       │
+-------------------------------------------------------------------------------+
| LAYER 4: HTTP & GATEWAY LAYER (Laravel Controllers & Middleware)              |
|  • EnsureTenantContext • RequiresPlan (HTTP 402) • Atomic Settings Endpoints  |
|  • HandleInertiaRequests (Shared Props Injection) • Guest QR Security         |
+-------------------------------------------------------------------------------+
                                       │
+-------------------------------------------------------------------------------+
| LAYER 3: APPLICATION SERVICES & DOMAIN LOGIC                                  |
|  • TenantContext (SSOT Resolver) • FeatureRegistry (Plan Hierarchy Truth)     |
|  • SettingsService (Fallback Chain) • OwnerDashboardService (Real DB Queries) |
+-------------------------------------------------------------------------------+
                                       │
+-------------------------------------------------------------------------------+
| LAYER 2: DOMAIN MODELS & GLOBAL SCOPES                                        |
|  • TenantScope (Automatic ORM Isolation) • Eloquent Hierarchical Relations    |
|  • Lock-For-Update Concurrency Control • Type-safe Attribute Casting          |
+-------------------------------------------------------------------------------+
                                       │
+-------------------------------------------------------------------------------+
| LAYER 1: DATABASE SCHEMA & PERSISTENCE LAYER                                  |
|  • Shared-Schema Multi-Tenancy • Subscriptions & Settings Dedicated Tables    |
|  • JSON Operating Hours & Tax Configs • Foreign Key Indexing & Constraints    |
+-------------------------------------------------------------------------------+
```

#### 🔹 Layer 1 — Database Schema & Persistence Layer
- **Struktur Tabel Terdedikasi:** Memisahkan tabel `subscriptions`, `tenant_settings`, dan `outlet_settings` dari entitas utama untuk fleksibilitas konfigurasi tanpa membebani tabel relasional transaksional.
- **Tipe Data JSON & Optimasi Indeks:** Menyimpan jam operasional harian (`operating_hours`) dan konfigurasi pajak berjenjang dengan validasi skema di level migrasi serta indeks performa tinggi pada kunci asing (`tenant_id`, `outlet_id`).

#### 🔹 Layer 2 — Domain Models & Global Scopes
- **`TenantScope`:** Global scope Eloquent yang menyuntikkan filter tenant secara transparan pada setiap query SQL (`WHERE tenant_id = ?`).
- **Concurrency & Deadlock Prevention:** Penggunaan *pessimistic locking* (`lockForUpdate()`) pada baris tenant untuk menjaga integritas nomor urut pesanan dan kalkulasi finansial pada transaksi paralel.
- **Hierarchical Models:** Model `Tenant`, `Outlet`, `User`, `Order`, dan `Subscription` terikat dengan relasi yang bersih dan *type-casted* secara konsisten.

#### 🔹 Layer 3 — Application Services & Domain Logic
- **`TenantContext`:** Singleton service di dalam Laravel Service Container yang bertindak sebagai resolver utama identitas tenant, outlet aktif, dan status langganan selama *request lifecycle*.
- **`FeatureRegistry`:** Pusat registrasi fitur (*Feature Registry*) yang memetakan fitur ke tier minimum (`basic`, `pro`, `enterprise`) serta mengevaluasi hierarki langganan secara efisien.
- **`SettingsService`:** Mesin pembaca konfigurasi dengan logika *fallback* berjenjang (Outlet → Tenant → Default System).
- **`OwnerDashboardService`:** Mesin analitik finansial yang mengagregasi data transaksi nyata dari database tanpa mengandalkan data fiktif (*mock*).

#### 🔹 Layer 4 — HTTP Layer (Middleware & Controllers)
- **`EnsureTenantContext` & `RequiresPlan`:** Middleware berlapis yang mengamankan setiap *request*. Mencegah kebocoran lintas tenant dan menolak eksploitasi fitur yang belum dilanggan dengan standar HTTP `402 Payment Required`.
- **Atomic Endpoints (`PUT /api/outlet-settings/all`):** Memungkinkan penyimpanan seluruh perubahan pengaturan (Profil, Lokasi/Geofence, Pajak, dan Jam Operasional) dalam satu transaksi database tunggal untuk menjamin konsistensi data.

#### 🔹 Layer 5 — Frontend Presentation & Dynamic UI (React 19 + Inertia 2)
- **`useSubscription` Custom Hook:** Memberikan antarmuka reaktif bagi komponen UI untuk memeriksa izin fitur dan menampilkan *badge* atau *locked state* secara elegan tanpa *hardcoded constant*.
- **Single Source of Truth (SSOT):** Mengeliminasi penggunaan `localStorage` untuk data bisnis kritis; semua state dikendalikan langsung oleh *props* yang disajikan oleh server.
- **Modern UI & Micro-animations:** Antarmuka dengan estetika premium, *dark mode*, *glassmorphism*, serta responsivitas tinggi untuk kasir dan dapur.

#### 🔹 Layer 6 — Testing & Verification Suite
- **Comprehensive Automated Testing:** Dilengkapi dengan 35+ automated test cases di backend (PHPUnit via `php artisan test`) dan frontend unit test (Vitest) yang memvalidasi isolasi tenant, penguncian fitur, dan keandalan endpoint atomik.
- **Production Build Assurance:** Verifikasi ketat melalui bundler Vite untuk memastikan keseluruhan 2,400+ modul terkompilasi sempurna tanpa *runtime error* atau ketidakcocokan tipe data TypeScript.

---

## ✨ Fitur Utama & Modul Sistem

| Modul | Deskripsi | Tier Minimum | Role Akses |
|-------|-----------|--------------|------------|
| 🏪 **POS Kasir** | Transaksi kasir, pembayaran QRIS/GoPay/Tunai, split bill, kelola pesanan | **Basic** | Kasir, Admin |
| 👨‍🍳 **KDS (Kitchen Display)** | Layar dapur real-time, pengelompokan antrian, audio TTS pesanan masuk | **Enterprise** | Dapur, Admin |
| 📊 **Dashboard Analytics** | KPI real-time, grafik penjualan, top produk & slow movers | **Basic** | Admin, Owner |
| 📋 **Manajemen Produk** | Katalog menu, variasi harga, buku menu digital QR interaktif | **Basic** | Admin |
| 🪑 **Manajemen Meja** | Denah restoran interaktif, generator QR Code per meja untuk pesanan mandiri | **Basic** | Pelayan, Admin |
| 📦 **Inventaris & Stok** | Stok bahan baku, supplier, pembelian vendor, stock opname | **Pro** | Admin |
| 👥 **HRD & Staf Shift** | Manajemen karyawan, jadwal shift kerja, absensi, kalkulasi payroll | **Pro** | Admin |
| 💰 **Laporan Keuangan** | Laporan laba rugi, arus kas, perbandingan performa antar outlet | **Pro** | Owner |
| ⚙️ **Pengaturan Outlet** | Konfigurasi profil, geofence koordinat, pajak PBJT/PPN, jam operasional, struk | **Basic** | Admin, Owner |

---

## 📦 Tech Stack

### Backend
- **Laravel 13** — PHP web framework berperforma tinggi
- **Inertia.js 2** — SPA bridge (menghubungkan backend dan frontend tanpa REST API terpisah)
- **MySQL / SQLite** — Database relasional dengan dukungan transaksi & locking penuh

### Frontend
- **React 19** — Library UI deklaratif generasi terbaru
- **TypeScript 5** — Type safety menyeluruh dari server hingga client
- **Tailwind CSS 4** — Utility-first CSS framework untuk desain modern & responsif
- **Vite 6** — Next-generation frontend bundler & HMR
- **Lucide React & Recharts** — Ikon vektor modern dan visualisasi grafik interaktif

### Testing & Quality Assurance
- **PHPUnit / Pest** — Backend automated test suite (35+ feature & unit tests)
- **Vitest & Testing Library** — Frontend unit testing runner
- **Custom E2E Loop** — Automated HTTP route verification script

---

## 🚀 Quick Start & Instalasi

### Prasyarat
- PHP 8.2+ (Diuji pada PHP 8.5.8)
- Composer 2.x
- Node.js 20+ & npm 10+
- MySQL 8.0+ atau SQLite 3.x (default: SQLite untuk development)

### Langkah Instalasi

```bash
# 1. Clone repositori & masuk ke direktori proyek
git clone <repo-url>
cd "restoku backend"

# 2. Install dependensi PHP & Node.js
composer install
npm install

# 3. Konfigurasi environment & generate key
cp .env.example .env
php artisan key:generate

# 4. Jalankan migrasi database beserta seeder (termasuk Subscription & Tenant Seeder)
php artisan migrate --seed

# 5. Jalankan server development serentak
php artisan serve          # Terminal 1 — Laravel Server (http://localhost:8000)
npm run dev                # Terminal 2 — Vite HMR Bundler (http://localhost:5174)
```

### Akun Demo (Hasil Seeder)

| Role | URL Login | Kredensial | Keterangan |
|------|-----------|------------|------------|
| **Owner** | `http://localhost:8000/owner/login` | Email: `owner@example.com`<br>Password: `password` | Akses analitik finansial & perbandingan outlet |
| **Admin / Kasir** | `http://localhost:8000/login` | PIN: `123456` | Akses POS Kasir, KDS, Manajemen Meja, & Pengaturan |
| **Staff Dapur** | `http://localhost:8000/login` | PIN: `654321` | Akses KDS (Kitchen Display) |
| **Manager** | `http://localhost:8000/login` | PIN: `999999` | Akses semua modul termasuk Pengaturan Outlet |

---

## 🧪 Testing & Verification (TDR Workflow)

Restoku menerapkan standar verifikasi ketat sebelum deployment ke production untuk mencegah kebocoran data antar-tenant (*data leakage*). 

> 📖 **Panduan Resmi:** Baca **[TDR_WORKFLOW_GUIDE.md](./TDR_WORKFLOW_GUIDE.md)** untuk SOP lengkap Test-Driven Refactoring bagi developer & AI Agent.

### Cara Tercepat: All-in-One TDR Suite
Jalankan 1 perintah ini untuk melakukan linter arsitektur SaaS, unit test backend/frontend, serta verifikasi build sekaligus (~10 detik):

```bash
npm run tdr        # atau: composer tdr / node scripts/tdr.mjs
```

### Pengujian Manual / Modular
Jika Anda ingin menjalankan verifikasi secara terpisah:

```bash
# 1. Verifikasi Build Produksi
npm run build

# 2. Jalankan Suite Pengujian Backend (35+ Tests: Isolasi Tenant & Feature Gate)
php artisan test

# 3. Jalankan Suite Pengujian Frontend (Vitest)
npm test -- --run

# 4. Jalankan E2E Test Loop untuk memverifikasi kesehatan rute HTTP
node scripts/e2e-test-loop.js
```

---

## 📁 Struktur Route Utama

| URL | Halaman | Role Akses | Middleware |
|-----|---------|------------|------------|
| `/` | Landing Page | Public | - |
| `/login` | Login Staf (PIN) | Public | `guest` |
| `/owner/login` | Login Owner (Email/Pass) | Public | `guest` |
| `/dashboard` | Dashboard Analytics | Admin, Owner | `auth`, `tenant` |
| `/pos` | Kasir POS | Kasir, Admin | `auth`, `tenant` |
| `/monitor-pesanan` | Monitor Pesanan | Admin | `auth`, `tenant` |
| `/monitor-reservasi` | Monitor Reservasi | Admin | `auth`, `tenant` |
| `/kds` | Kitchen Display | Dapur, Admin | `auth`, `tenant`, `plan:kds` |
| `/refund-void` | Refund & Void | Admin | `auth`, `tenant` |
| `/cashier-session` | Sesi Kasir | Kasir, Admin | `auth`, `tenant` |
| `/produk` | Produk & Menu | Admin | `auth`, `tenant` |
| `/katalog-menu` | Katalog Menu | Admin | `auth`, `tenant` |
| `/buku-menu-digital` | Buku Menu Digital | Admin | `auth`, `tenant` |
| `/manajemen-meja` | Manajemen Meja | Pelayan, Admin | `auth`, `tenant` |
| `/inventory` | Stok (Bahan Baku) | Admin | `auth`, `tenant`, `plan:inventory` |
| `/pembelian-vendor` | Pembelian Vendor | Admin | `auth`, `tenant`, `plan:inventory` |
| `/stok-opname` | Stock Opname | Admin | `auth`, `tenant`, `plan:inventory` |
| `/dashboard-inventory` | Dashboard Inventory | Admin | `auth`, `tenant`, `plan:inventory` |
| `/staf-shift` | Jadwal Shift & Staf | Admin | `auth`, `tenant`, `plan:staf_shift` |
| `/laporan-penjualan` | Laporan Penjualan | Admin, Owner | `auth`, `tenant` |
| `/perbandingan-outlet` | Perbandingan Outlet | Owner | `auth`, `tenant`, `plan:perbandingan_outlet` |
| `/arus-kas` | Arus Kas | Owner | `auth`, `tenant` |
| `/laporan-keuangan` | Laporan Keuangan (Owner) | Owner | `auth`, `tenant` |
| `/pengaturan-outlet` | Pengaturan Outlet | Admin, Owner | `auth`, `tenant` |
| `/printer-config` | Printer Config | Admin | `auth`, `tenant` |
| `/print-job-monitor` | Antrian Cetak | Admin | `auth`, `tenant` |
| `/tts-settings` | Pengaturan TTS KDS | Admin | `auth`, `tenant` |
| `/whatsapp-integration` | WhatsApp Integration | Admin | `auth`, `tenant` |
| `/waiter-bar` | Monitor Bar & Waiter | Admin | `auth`, `tenant` |
| `/diskon-pajak` | Diskon & Pajak | Admin | `auth`, `tenant` |
| `/qrcode-meja` | QR Code Meja | Admin | `auth`, `tenant` |
| `/owner/settings` | Pengaturan Owner | Owner | `auth`, `tenant` |
| `/owner/dashboard` | Analitik Owner | Owner | `auth`, `tenant` |
| `/admin/employees` | Data Karyawan (Admin) | Admin | `auth`, `tenant` |

---

## 📄 Lisensi

Proyek ini dikembangkan untuk keperluan ekosistem internal Restoku. Seluruh kode sumber adalah hak cipta tim pengembang Restoku.

<p align="center">Dibangun dengan ❤️ menggunakan Arsitektur 6-Layer Enterprise SaaS (Laravel + React + Inertia.js)</p>
