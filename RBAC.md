# 🔐 Role-Based Access Control (RBAC) — Restoku POS

Dokumen ini mendefinisikan **matriks hak akses sidebar** berdasarkan role staf yang aktif login.  
Prinsip desain: **Least Privilege UI** — menu yang tidak diotorisasi tidak di-render sama sekali di DOM.

---

## 🔑 PIN Login Staf

| Role | PIN | Warna Badge |
|------|-----|-------------|
| 🔵 Kasir | `123456` | Biru |
| 🟢 Waiter / Bar | `654321` | Hijau |
| 🟡 Manager | `999999` | Kuning |
| 🟣 Owner | *(login terpisah via `/owner/login`)* | Ungu |

---

## 📋 Matriks Akses Menu Sidebar

| Grup | Menu | 🔵 Kasir | 🟢 Waiter | 🟡 Manager | 🟣 Owner |
|------|------|:--------:|:---------:|:----------:|:--------:|
| **UTAMA** | Dashboard | ✅ | ✅ | ✅ | ✅ |
| | Kasir (POS) | ✅ | ❌ | ✅ | ✅ |
| | Monitor Pesanan | ✅ | ✅ | ✅ | ✅ |
| | Dapur (KDS) | ❌ | ✅ | ✅ | ✅ |
| | Refund & Void | ❌ | ❌ | ✅ | ✅ |
| **MANAJEMEN** | Produk & Menu | ❌ | ❌ | ✅ | ✅ |
| | Katalog Menu | ✅ | ✅ | ✅ | ✅ |
| | Buku Menu Digital | ❌ | ❌ | ✅ | ✅ |
| | Manajemen Meja | ✅ | ✅ | ✅ | ✅ |
| **INVENTARIS** | Stok (Bahan Baku) | ❌ | ❌ | ✅ | ✅ |
| | Supplier | ❌ | ❌ | ✅ | ✅ |
| | Stock Opname | ❌ | ❌ | ✅ | ✅ |
| | Dasbor Stok | ❌ | ❌ | ✅ | ✅ |
| **OPERASIONAL** | Shift Kerja | ❌ | ❌ | ✅ | ✅ |
| | Sesi Kasir | ✅ | ❌ | ✅ | ✅ |
| **LAPORAN** | Laporan Penjualan | ❌ | ❌ | ✅ | ✅ |
| | Perbandingan Outlet | ❌ | ❌ | ❌ | ✅ |
| | Arus Kas | ❌ | ❌ | ❌ | ✅ |
| **PENGATURAN** | Pengaturan Outlet | ❌ | ❌ | ✅ | ✅ |
| | Diskon & Pajak | ❌ | ❌ | ✅ | ✅ |
| | QR Code Meja | ❌ | ❌ | ✅ | ✅ |
| | Printer Config | ❌ | ❌ | ✅ | ✅ |
| | Antrean Cetak | ❌ | ❌ | ✅ | ✅ |
| | Pengaturan TTS | ❌ | ❌ | ✅ | ✅ |
| | WhatsApp API Integration | ❌ | ❌ | ✅ | ✅ |
| **OWNER VIEW** | Data Karyawan | ❌ | ❌ | ❌ | ✅ |
| | Peringatan Stok | ❌ | ❌ | ❌ | ✅ |
| | Pengaturan Owner | ❌ | ❌ | ❌ | ✅ |

---

## 🛡️ Ringkasan Hak Akses per Role

### 🔵 Kasir
Fokus pada **transaksi langsung di meja kasir**.
- Bisa: Dashboard, POS, Monitor Pesanan, Katalog Menu, Manajemen Meja, Sesi Kasir
- Tidak bisa: Inventaris, Laporan keuangan, Pengaturan, Refund, Shift kerja

### 🟢 Waiter / Bar
Fokus pada **pelayanan meja dan display pesanan**.
- Bisa: Dashboard, Monitor Pesanan, KDS (Dapur), Katalog Menu, Manajemen Meja
- Tidak bisa: POS (uang), Inventaris, Laporan, Pengaturan apapun

### 🟡 Manager
Akses **operasional penuh** kecuali laporan finansial eksklusif owner.
- Bisa: Semua menu kecuali Perbandingan Outlet, Arus Kas, dan Owner View
- Wewenang khusus: Edit jadwal shift, Kelola produk & stok, Semua pengaturan sistem

### 🟣 Owner
Akses **penuh tanpa batas** termasuk laporan finansial dan owner view.
- Bisa: Semua menu tanpa terkecuali
- Eksklusif: Perbandingan Outlet, Arus Kas, Data Karyawan (owner view), Pengaturan Owner

---

## 🏗️ Implementasi Teknis

| Komponen | File | Keterangan |
|----------|------|------------|
| Sidebar nav filter | `resources/js/Layouts/MainLayout.tsx` | `visibleNav` di-compute dari `activeRole` vs `item.roles[]` |
| Sesi login staf | `resources/js/Pages/Auth/StaffLogin.tsx` | Simpan `{ name, role }` ke `localStorage["activeKaryawan"]` |
| Read-only jadwal | `resources/js/Components/Placeholder/StafShift.tsx` | `isReadOnly = role !== "manager" && role !== "owner"` |
| Profile card sidebar | `MainLayout.tsx` | Avatar & badge warna dinamis per role |

---

## 📐 Prinsip Desain

> **"Menu yang tidak terlihat = menu yang tidak ada."**  
> Menu non-authorized tidak di-render di DOM (bukan disabled/greyed-out).  
> Ini mencegah *curiosity bypass* dan menjaga UX tetap bersih, fokus, dan tidak membingungkan staf.

---

*Dokumen ini di-generate otomatis. Terakhir diperbarui: Juli 2026.*
