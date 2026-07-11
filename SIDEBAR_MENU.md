# Daftar Sidebar Restoku

Daftar menu & sub-menu di sidebar aplikasi Restoku (admin/staff), diambil langsung dari
source `resources/js/Layouts/MainLayout.tsx` (array `nav`, line 29–119).

Sidebar di-render oleh komponen `Sidebar` di dalam `MainLayout`. Navigasi di-filter
otomatis berdasarkan **role aktif** (`kasir` / `kitchen` / `waiter` / `manager` / `owner`)
lewat `visibleNav` — hanya grup & item yang role-nya punya akses yang tampil.

> **Fase**: `phase: 1` = sudah live; `phase: 2` = fitur tahap 2 (beberapa masih placeholder UI).
> **Lock**: item yang terkait fitur berlangganan akan tampil dengan ikon 🔒 bila fitur
> dikunci (`featureLocks` + `useSubscription().isLocked`).

---

## 1. Utama
| Sub-menu | Route | Fase | Role |
|----------|-------|------|------|
| Dashboard | `/dashboard` | 1 | kasir, waiter, manager, owner |
| Kasir (POS) | `/pos` | 1 | kasir, manager, owner |
| Monitor Pesanan | `/monitor-pesanan` | 1 | kasir, waiter, manager, owner |
| Monitor Reservasi | `/monitor-reservasi` | 1 | kasir, manager, owner *(badge notif jumlah pending)* |
| Dapur (KDS) | `/kds` | 1 | kitchen, waiter, manager, owner |
| Refund & Void | `/refund-void` | 2 | manager, owner |

## 2. Manajemen
| Sub-menu | Route | Fase | Role |
|----------|-------|------|------|
| Produk & Menu | `/produk` | 1 | manager, owner |
| Katalog Menu | `/katalog-menu` | 1 | kasir, waiter, manager, owner |
| Buku Menu Digital | `/buku-menu-digital` | 2 | manager, owner |
| Manajemen Meja | `/manajemen-meja` | 1 | kasir, waiter, manager, owner |

## 3. Inventaris
| Sub-menu | Route | Fase | Role |
|----------|-------|------|------|
| Stok (Bahan Baku) | `/inventory` | 2 | manager, owner |
| Supplier | `/pembelian-vendor` | 2 | manager, owner *(placeholder)* |
| Stock Opname | `/stok-opname` | 2 | manager, owner *(placeholder)* |
| Dasbor Stok | `/dashboard-inventory` | 2 | manager, owner |

## 4. Operasional
| Sub-menu | Route | Fase | Role |
|----------|-------|------|------|
| Shift Kerja | `/staf-shift` | 2 | manager, owner |
| Sesi Kasir | `/cashier-session` | 2 | kasir, manager, owner |

## 5. Laporan
| Sub-menu | Route | Fase | Role |
|----------|-------|------|------|
| Laporan Penjualan | `/laporan-penjualan` | 1 | manager, owner |
| Perbandingan Outlet | `/perbandingan-outlet` | 2 | owner only |
| Arus Kas | `/arus-kas` | 2 | owner only |

## 6. Pengaturan
| Sub-menu | Route | Fase | Role |
|----------|-------|------|------|
| Pengaturan Outlet | `/pengaturan-outlet` | 1 | manager, owner |
| Diskon & Pajak | `/diskon-pajak` | 1 | manager, owner *(placeholder)* |
| QR Code Meja | `/qrcode-meja` | 1 | manager, owner |
| Printer Config | `/printer-config` | 1 | manager, owner |
| Antrean Cetak | `/print-job-monitor` | 2 | manager, owner |
| Pengaturan TTS | `/tts-settings` | 1 | manager, owner |
| WhatsApp API integration | `/whatsapp-integration` | 1 | manager, owner |

## 7. Owner View *(owner only)*
| Sub-menu | Route | Fase | Role |
|----------|-------|------|------|
| Data Karyawan | `/owner/employees` | 1 | owner |
| Peringatan Stok | `/owner/inventory/alerts` | 1 | owner |
| Google Review & Complaint | `/owner/google-reviews` | 1 | owner |
| Pengaturan Owner | `/owner/settings` | 1 | owner |

---

## Elemen non-menu di sidebar
- **Brand lockup**: `TenantBrandLockup` (logo tenant + nama outlet + wordmark Restoku).
- **Restoku Co-Pilot AI**: `GeminiCopilotWidget` (placement `sidebar`) di bawah nav.
- **Staff Profile Card**: avatar berwarna-role + badge role + tombol "Kembali ke Website" (`/`).

## Catatan
- **3 sub-menu placeholder** (sesuai instruksi 2026-07-10, sengaja dibiarkan kosong karena
  data belum siap): `Supplier` (`/pembelian-vendor`), `Stock Opname` (`/stok-opname`),
  `Diskon & Pajak` (`/diskon-pajak`). Route ada, tapi isinya komponen placeholder.
- Menu tampil/sembunyi dinamis mengikuti `activeRole` (owner session atau `activeKaryawan`
  dari `localStorage`).
- Setiap grup bisa di-collapse/expand; saat sidebar collapse (lebar 80px) hanya ikon yang
  tampil, grup "Utama" dapat dot merah notif reservasi pending.
- Source of truth: `resources/js/Layouts/MainLayout.tsx` (`nav: NavGroup[]`, `Sidebar`).
