# Changelog — Restoku

Semua perubahan penting pada proyek ini didokumentasikan di file ini.  
Format mengikuti [Keep a Changelog](https://keepachangelog.com/en/1.0.0/).

---

## [Unreleased]

### Planned
- Integrasi GoFood & GrabFood (live order sync)
- Modul loyalitas pelanggan
- Dashboard mobile (PWA)
- Real authentication & session management

---

## [0.7.0] — 2026-07-07

### Added — Frontend Architecture Audit & Radical Refactor
- **`Types/`** — Sebelumnya kosong, kini berisi 4 file type definitions:
  - `menu.ts` — `MenuItem`, `MenuVariant`, `MenuCatalog`
  - `order.ts` — `Order`, `OrderItem`, `PaymentMethod`, `Receipt`, `SplitBillItem`
  - `staff.ts` — `Staff`, `ShiftSchedule`, `AttendanceRecord`, `PayrollRecord`
  - `outlet.ts` — `Outlet`, `Table`, `InventoryItem`, `DailySummary`
  - `index.ts` — Barrel export tunggal untuk semua types
- **`lib/`** — Direktori baru berisi utilities terpusat:
  - `constants.ts` — Single source of truth untuk `MOCK_PLAN`, `ORDER_STATUS`, `PLAN_FEATURES`, `FEATURE_LOCKS`, dll.
  - `formatters.ts` — `formatRupiah`, `formatDate`, `formatTime`, `formatDateShort`, `formatRupiahCompact`
  - `utils.ts` — `cn()`, `debounce()`, `groupBy()`, `truncate()`, `clamp()`
- **`Components/shared/`** — Design system dipecah dari `Shared.tsx` monolitik:
  - `Button.tsx` — 4 variant, loading state, full a11y
  - `Input.tsx` — Label, error state, hint text support
  - `Badge.tsx` — 9 tone, dot indicator animasi
  - `Glass.tsx` — Glassmorphism card, hover lift option
  - `Screen.tsx` — Page wrapper, Live badge, notification bell
  - `ErrorBoundary.tsx` — Styled error UI (bukan plain teks)
  - `index.ts` — Barrel export
- **`Layouts/OwnerLayout.tsx`** — Shell layout khusus Owner (emerald accent, read-only nav)
- **`Layouts/AuthLayout.tsx`** — Reusable split-screen auth layout
- **`FRONTEND_ARCHITECTURE.md`** — 5 diagram Mermaid (User Flow, Component Hierarchy, URL Map, Data Flow, Folder Structure)
- **`CHANGELOG.md`** — File ini
- **`CONTRIBUTING.md`** — Panduan kontribusi
- **`scripts/e2e-test-loop.js`** — E2E HTTP route testing loop script

### Changed
- **`Components/Shared.tsx`** — Dikonversi menjadi compatibility shim (re-exports dari `shared/`)
- **`main.tsx`** — Dibersihkan dari inline `ErrorBoundary` class; kini hanya 20 baris
- **`README.md`** — Diganti total dari boilerplate Laravel ke dokumentasi proyek nyata

### Removed
- **`Components/figma/`** — Folder aset Figma dihapus dari codebase produksi

### Fixed
- Build error: `Screen cannot be exported from Shared.tsx as it is a reexport that references itself` (Rollup circular re-export)

---

## [0.6.0] — 2026-07-07

### Added — Landing Page Redesign (Light Mode SaaS)
- Perombakan total `LandingPage.tsx` dari dark mode ke light mode SaaS style
- Hero section dengan split layout + isometric dashboard mockup 3D
- Trusted By logos (Waroeng Steak, Kopi Kenangan, Solaria, HokBen, dll.)
- Features section (POS, KDS, Buku Menu Digital) dengan kartu ikon modern
- Analitik section dengan fake line chart interaktif
- Pricing cards (Basic, Pro, Enterprise) dengan highlight "Paling Populer"
- Testimonials section dengan avatar dan bintang rating
- CTA Banner hijau + Footer lengkap dengan tautan

### Fixed
- `ReferenceError: Clock is not defined` — Icon `Clock` ditambahkan ke import lucide-react

---

## [0.5.0] — 2026-07-07

### Added — Kitchen Display System (KDS) & Manajemen Meja
- **KDS (`/kds`)** — Kanban board 3 kolom (Antrian, Sedang Dimasak, Siap Sajikan)
  - Kartu pesanan berukuran besar untuk kemudahan baca di dapur
  - Toggle Text-to-Speech (TTS) notifikasi pesanan baru
  - Tombol aksi pindah status antar kolom
- **Manajemen Meja (`/manajemen-meja`)** — Denah restoran interaktif
  - Grid meja dengan kode warna status (Tersedia, Terisi, Dipesan, Kotor)
  - Filter area (Lantai 1, Lantai 2, VIP, Outdoor)
  - Modal QR Code generator per meja dengan tombol Print & Download

---

## [0.4.0] — 2026-07-06

### Added — Modul Owner (Pemilik Restoran)
- **Owner Dashboard** (`/dashboard`) — KPI multi-outlet, grafik revenue
- **Laporan Keuangan** (`/laporan-keuangan`) — Laporan pendapatan detail
- **Data Karyawan Owner** (`/owner/employees`) — View read-only daftar karyawan
- **Peringatan Stok** (`/owner/inventory/alerts`) — Alert stok kritis
- **Pengaturan Owner** (`/owner/settings`) — Profil dan preferensi notifikasi
- **OwnerLogin** (`/owner/login`) — Halaman login terpisah Email + Password

---

## [0.3.0] — 2026-07-06

### Added — Modul HRD & Karyawan
- Manajemen Karyawan dengan CRUD & filter jabatan
- Penjadwalan Shift (kalender mingguan)
- Absensi & Review Kehadiran
- Payroll Management (slip gaji)
- Cuti & Izin (LeaveAndDiscipline)
- QR Scanner Absensi

---

## [0.2.0] — 2026-07-06

### Added — POS Kasir & Inventaris
- **POS (`/pos`)** — Full kasir: keranjang, diskon, QRIS, split bill, nota digital
- **CashierSession** — Buka/tutup sesi kasir dengan kas awal
- **Refund & Void Manager** — Void transaksi dengan alasan
- **Inventory** — CRUD bahan baku, alert minimum stok
- **Stock Opname** — Penghitungan stok fisik vs sistem
- **Pembelian Vendor** — Purchase order ke supplier
- **Dashboard Inventory** — KPI & grafik stok

---

## [0.1.0] — 2026-07-06

### Added — Foundation
- Setup Laravel 13 + Inertia.js + React 19 + TypeScript
- Konfigurasi Tailwind CSS 4 + Shadcn/UI (48 komponen)
- `MainLayout.tsx` — App shell dengan sidebar collapsible
- `Shared.tsx` — Design system primitif awal
- Landing Page awal (dark mode)
- `StaffLogin.tsx` — Login PIN keypad untuk staff
- Dashboard Admin awal
- Routing dasar (`web.php`)
