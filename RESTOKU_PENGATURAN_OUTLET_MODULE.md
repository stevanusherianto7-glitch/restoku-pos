# RESTOKU OS - MODUL PENGATURAN OUTLET & SECURITY HARDENING

Dokumen ini adalah rujukan teknis, arsitektural, dan spesifikasi keamanan untuk modul **Pengaturan Outlet** (`/pengaturan-outlet`). Modul ini mengintegrasikan seluruh pengaturan operasional restoran dengan keamanan tingkat lanjut dan arsitektur *stateful synchronization*.

---

## 1. Arsitektur Modul & Single Source of Truth (SSOT)

Modul Pengaturan Outlet dibagi menjadi 5 tab utama yang sepenuhnya bersinkronisasi secara dua arah (*bidirectional*) dengan penyimpanan lokal (*localStorage*) dan backend API:

| Tab | State Utama | Storage Key (SSOT) | API Endpoint Terkait |
| :--- | :--- | :--- | :--- |
| **Profil Outlet** | `namaOutletInput`, `teleponInput`, `npwpInput`, `nibInput` | `outlet_nama`, `outlet_telepon`, `outlet_npwp`, `outlet_nib` | - |
| **Lokasi Restoran** | `alamatInput`, `latitudeInput`, `longitudeInput` | `outlet_alamat`, `outlet_latitude`, `outlet_longitude` | Google Geocoding API |
| **Pajak & Tarif** | `taxType`, `taxRateInput`, `serviceChargeInput` | `outlet_tax_type`, `outlet_tax_rate`, `outlet_service_charge` | Digunakan live oleh POS (`/pos`) |
| **Tampilan Struk** | `strukHeader`, `strukFooter`, `strukPaperWidth` | `outlet_struk_config` (JSON) | `/api/receipt-config` |
| **Jam Operasional** | `jamOperasional` (Array 7 Hari) | `outlet_jam_operasional` (JSON) | Digunakan live oleh E-Menu (`/m/{outlet}`) |

### Fitur Navigasi Hash URL
Setiap tab dapat diakses secara langsung (*deep-linking*) melalui parameter query URL:
- `?tab=profil` → Profil Outlet
- `?tab=lokasi` → Lokasi Restoran
- `?tab=pajak` → Pajak & Tarif
- `?tab=struk` → Tampilan Struk
- `?tab=jam` → Jam Operasional

---

## 2. Penyelesaian Audit & Security Hardening (9 Temuan)

### 🔴 Critical Issues

#### [C-1] Atomic Save Operations & Prevent Data Loss
- **Masalah**: Sebelumnya, panggilan `saveSettings()` menimpa seluruh daftar karyawan (`tenant_employees`) dengan 4 data default karena menggabungkan penyimpanan branding dan personil dalam satu fungsi.
- **Solusi**: 
  - `saveSettings()` direfactor di `Shared.tsx` menjadi hanya 4 parameter (`name, logo, image, ownerName`).
  - Operasi penyimpanan karyawan dipisahkan sepenuhnya ke dalam `saveEmployees(employeesList)`.
  - Penghapusan pemanggilan event storage ganda (*double dispatch*), hanya satu event `window.dispatchEvent(new Event("storage"))` yang dipicu saat menyimpan.

#### [C-2] SHA-256 PIN Hashing & Backward Compatibility
- **Masalah**: PIN staf sebelumnya tersimpan dalam bentuk teks terang (*plaintext*) di `localStorage`, rentan diintip via DevTools.
- **Solusi**:
  - Implementasi Web Crypto API SHA-256 hex string hashing pada fungsi `hashPin()`.
  - Pembuatan utilitas asinkron `verifyPin(inputPin, storedPin)` yang mendeteksi apakah PIN di database sudah berupa hash SHA-256 (64 karakter hex) atau masih teks terang (legacy), sehingga **kompatibel 100% dengan data lama tanpa mematahkan sesi login**.
  - `saveEmployees()` otomatis mengonversi PIN baru menjadi hash SHA-256 sebelum disimpan.

#### [C-3] RoleGuard & Anti Console-Spoofing
- **Masalah**: Akses halaman sensitif sebelumnya mudah dibypass melalui konsol browser (`localStorage.setItem('activeKaryawan', '{"role":"owner"}')`).
- **Solusi**:
  - Saat login berhasil di `StaffLogin.tsx`, sistem membuat token otentikasi sesi: `token: "${id}_${role}_auth_ok"`.
  - Di `RoleGuard.tsx`, sistem melakukan **validasi kredensial ganda**:
    1. Memeriksa apakah nama dan role pengguna benar-benar terdaftar di dalam direktori `tenant_employees`.
    2. Memvalidasi token sesi otentikasi. Sesi palsu hasil manipulasi konsol langsung ditolak dan dialihkan ke layar *Access Denied*.

---

### 🟠 High & Medium Issues

#### [H-1] Dynamic Tax Calculation di POS
- Penghapusan nilai pajak hardcoded (`0.10` / 10%) di komponen Point of Sales (`POS/Index.tsx`).
- POS kini memanggil `getOutletTaxConfig()` dari `Shared.tsx` untuk membaca tarif pajak (`taxRate`) dan service charge secara dinamis dari pengaturan outlet.

#### [H-2] Sinkronisasi Bidireksional Printer & Struk
- Komponen `PrinterConfig.tsx` kini terhubung langsung ke `outlet_struk_config` di `localStorage`.
- Setiap perubahan pada layar pengaturan printer atau pengaturan outlet otomatis menyinkronkan API endpoint `/api/receipt-config` dan penyimpanan lokal.

#### [H-3] Deprecation of Legacy Staff Keys
- Penghapusan pembacaan key tunggal yang deprecated (`tenant_pin_kasir`, `tenant_pin_dapur`, dll) di `StaffLogin.tsx`.
- Seluruh autentikasi mengacu pada satu sumber kebenaran: array `tenant_employees`.

#### [M-1] & [L-1] Event Dispatch & RoleGuard Labeling
- Perbaikan *double storage event dispatch* untuk efisiensi render komponen React.
- Pembaruan properti `pageName="Pengaturan Outlet"` pada seluruh proteksi rute terkait.

---

## 3. Integrasi Jam Operasional pada E-Menu Digital

Jam operasional yang diatur di tab **Jam Operasional** kini berdampak langsung pada sistem pemesanan pelanggan di `BukuMenuDigital/CustomerView.tsx`:
1. **Pemeriksaan Real-Time**: Sistem memeriksa hari saat ini dan mencocokkan waktu sekarang dengan `openTime` dan `closeTime`.
2. **Alert Banner**: Jika toko tutup, banner peringatan berwarna merah (*"Pemesanan Online Ditutup"*) ditampilkan di puncak E-Menu.
3. **Checkout Guard**: Tombol checkout/pesan dicek secara programatis. Jika toko di luar jam operasional, transaksi ditolak dengan pesan peringatan yang ramah.

---

## 4. E2E Test Loop Integration

Script automated end-to-end test loop (`scripts/e2e-test-loop.js`) telah diperbarui untuk mencakup rute modul baru dan memvalidasi respons HTTP 200/POST endpoints:
- Endpoint UI: `/pengaturan-outlet` (Deskripsi: *Pengaturan Outlet*)
- Endpoint API: `/api/receipt-config` (GET & POST)
- Endpoint API: `/api/print-receipt` (POST)
- Endpoint API: `/api/reservations` (GET & POST)

Untuk menjalankan automated regression testing:
```bash
# Jalankan test loop tunggal
node scripts/e2e-test-loop.js

# Jalankan dalam mode pantau berkelanjutan (watch mode)
node scripts/e2e-test-loop.js --watch
```
