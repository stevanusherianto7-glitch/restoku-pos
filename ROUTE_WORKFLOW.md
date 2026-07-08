# 🗺️ Restoku POS — Route, Workflow & Data Flow Documentation

> **Versi:** Juli 2026 · **Stack:** Laravel 11 + Inertia.js + React + Vite
> Dokumen ini mencakup seluruh route, alur kerja, algoritma data, dan diagram visual sistem Restoku POS.

---

## 📐 Arsitektur Sistem (High-Level)

```mermaid
graph TB
    subgraph CLIENT["🌐 Client Layer (Browser)"]
        REACT["React + Inertia.js SPA"]
        LS["localStorage\n(activeKaryawan session)"]
    end

    subgraph SERVER["⚙️ Server Layer (Laravel)"]
        ROUTER["web.php\nRoute Registry"]
        INERTIA["Inertia::render()"]
        CTRL["Controllers\n(OrderController, OwnerDashboardController)"]
    end

    subgraph STORAGE["🗄️ Data Layer"]
        DB[("MySQL / SQLite")]
        SESSION["Laravel Session"]
    end

    REACT -->|"Inertia Visit"| ROUTER
    ROUTER --> INERTIA
    ROUTER --> CTRL
    INERTIA --> REACT
    CTRL --> DB
    CTRL -->|"JSON Response"| REACT
    LS -.->|"Role-based UI filter"| REACT
```

---

## 🔑 Auth & Session Flow

```mermaid
flowchart TD
    START([Buka Aplikasi]) --> LANDING[/ Landing Page /]

    LANDING --> CHOICE{Login sebagai?}

    CHOICE -->|Staff| SLOGIN[/login — Staff PIN Pad]
    CHOICE -->|Owner| OLOGIN[/owner/login — Email + Password]

    SLOGIN --> PIN{Verifikasi PIN}
    PIN -->|"123456 — Kasir"| SAVE_K["localStorage: name=BUDI HARTONO, role=kasir"]
    PIN -->|"654321 — Waiter"| SAVE_W["localStorage: name=SARI PERTIWI, role=waiter"]
    PIN -->|"999999 — Manager"| SAVE_M["localStorage: name=AGUS SETIAWAN, role=manager"]
    PIN -->|PIN salah| ERR["❌ Error shake — Reset PIN"]
    ERR --> SLOGIN

    SAVE_K --> POS[/pos — Kasir Dashboard]
    SAVE_W --> WAITER[/waiter-bar — Waiter Dashboard]
    SAVE_M --> POS

    OLOGIN --> AUTH{Laravel Auth}
    AUTH -->|Berhasil| OWNER_DASH[/laporan-keuangan — Owner Dashboard]
    AUTH -->|Gagal| OLOGIN
```

---

## 📋 Tabel Route Lengkap (45 Routes)

| # | URL | Method | Page Component | Min. Role | Plan |
|---|-----|--------|----------------|-----------|------|
| 1 | `/` | GET | `LandingPage/Index` | Public | — |
| 2 | `/login` | GET | `Auth/StaffLogin` | Public | — |
| 3 | `/owner/login` | GET | `Auth/OwnerLogin` | Public | — |
| 4 | `/dashboard` | GET | `Dashboard/Index` | Kasir | Basic |
| 5 | `/laporan-keuangan` | GET | `Dashboard/Reports` | Owner | Pro |
| 6 | `/pos` | GET | `POS/Index` | Kasir | Basic |
| 7 | `/monitor-pesanan` | GET | `MonitorPesanan/Index` | Kasir | Basic |
| 8 | `/kds` | GET | `KDS/Index` | Waiter | Enterprise |
| 9 | `/refund-void` | GET | `RefundVoidManager/Index` | Manager | Pro |
| 10 | `/produk` | GET | `ProdukMenu/Index` | Manager | Basic |
| 11 | `/katalog-menu` | GET | `KatalogMenu/Index` | Kasir | Basic |
| 12 | `/buku-menu-digital` | GET | `QRCodeMeja/Index` | Manager | Pro |
| 13 | `/manajemen-meja` | GET | `ManajemenMeja/Index` | Kasir | Basic |
| 14 | `/inventory` | GET | `Inventory/Index` | Manager | Pro |
| 15 | `/pembelian-vendor` | GET | `PembelianVendor/Index` | Manager | Pro |
| 16 | `/stok-opname` | GET | `StokOpname/Index` | Manager | Enterprise |
| 17 | `/dashboard-inventory` | GET | `DashboardInventory/Index` | Manager | Pro |
| 18 | `/staf-shift` | GET | `StafShift/Index` | Manager | Pro |
| 19 | `/cashier-session` | GET | `CashierSession/Index` | Kasir | Pro |
| 20 | `/laporan-penjualan` | GET | `LaporanPenjualan/Index` | Manager | Basic |
| 21 | `/perbandingan-outlet` | GET | `PerbandinganOutlet/Index` | Owner | Pro |
| 22 | `/arus-kas` | GET | `ArusKas/Index` | Owner | Pro |
| 23 | `/pengaturan-outlet` | GET | `PengaturanOutlet/Index` | Manager | Basic |
| 24 | `/diskon-pajak` | GET | `DiskonPajak/Index` | Manager | Basic |
| 25 | `/qrcode-meja` | GET | `QRCodeMeja/Index` | Manager | Basic |
| 26 | `/printer-config` | GET | `PrinterConfig/Index` | Manager | Basic |
| 27 | `/print-job-monitor` | GET | `PrintJobMonitor/Index` | Manager | Pro |
| 28 | `/tts-settings` | GET | `TTSSettings/Index` | Manager | Basic |
| 29 | `/whatsapp-integration` | GET | `WhatsAppIntegration/Index` | Manager | Enterprise |
| 30 | `/order?table=N` | GET | `BukuMenuDigital/CustomerView` | Tamu | — |
| 31 | `/m/{outlet}` | GET | `BukuMenuDigital/CustomerView` | Tamu | — |
| 32 | `/waiter-bar` | GET | `WaiterBar/Index` | Waiter | Basic |
| 33 | `/owner/employees` | GET | `Owner/Employees` | Owner | Basic |
| 34 | `/owner/inventory/alerts` | GET | `Owner/InventoryAlerts` | Owner | Basic |
| 35 | `/owner/settings` | GET | `Owner/Settings` | Owner | Basic |
| 36 | `/admin/employees` | GET | `Admin/Employees` | Manager | Basic |
| **37** | **`/api/orders`** | **GET** | **OrderController@getKdsOrders** | — | — |
| **38** | **`/api/orders`** | **POST** | **OrderController@submitOrder** | — | — |
| **39** | **`/api/orders/{id}`** | **GET** | **OrderController@getOrderStatus** | — | — |
| **40** | **`/api/orders/{id}/status`** | **PUT** | **OrderController@updateOrderStatus** | — | — |
| **41** | **`/api/print-jobs`** | **GET** | **OrderController@getPrintJobs** | — | — |
| **42** | **`/api/cashier-queue`** | **GET** | **OrderController@getCashierQueue** | — | — |
| **43** | **`/api/cashier-queue/{id}`** | **DELETE** | **OrderController@clearCashierQueueItem** | — | — |
| **44** | **`/api/print-receipt`** | **POST** | **OrderController@printReceipt** | — | — |
| **45** | **`/api/receipt-config`** | **GET/POST** | **OrderController@getReceiptConfig** | — | — |

---

## 🧭 Sidebar RBAC Matrix (Role × Menu)

| Grup | Menu | Kasir 🔵 | Waiter 🟢 | Manager 🟡 | Owner 🟣 |
|------|------|:---:|:---:|:---:|:---:|
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
| | WhatsApp API | ❌ | ❌ | ✅ | ✅ |
| **OWNER VIEW** | Data Karyawan | ❌ | ❌ | ❌ | ✅ |
| | Peringatan Stok | ❌ | ❌ | ❌ | ✅ |
| | Pengaturan Owner | ❌ | ❌ | ❌ | ✅ |

---

## 🛒 Order Lifecycle — Sequence Diagram

```mermaid
sequenceDiagram
    participant C as Pelanggan
    participant W as Waiter
    participant POS as Kasir POS
    participant MON as Monitor Pesanan
    participant KDS as Dapur KDS
    participant PRN as Printer

    C->>W: Pesan menu
    W->>POS: Input item ke POS
    POS->>MON: POST /api/orders — status: pending
    MON-->>KDS: Realtime update
    KDS->>KDS: Masak pesanan
    KDS->>MON: PUT /api/orders/{id}/status — processing
    KDS->>MON: PUT /api/orders/{id}/status — ready_for_pickup
    MON-->>W: Notifikasi TTS pesanan siap
    W->>C: Antar makanan ke meja
    POS->>PRN: POST /api/print-receipt
    POS->>MON: PUT status — completed
```

---

## 🏪 User Journey per Role

```mermaid
flowchart LR
    subgraph KASIR["🔵 KASIR"]
        K1[Login /pos] --> K2[Buat pesanan]
        K2 --> K3[Pilih menu + meja]
        K3 --> K4[Proses pembayaran]
        K4 --> K5[Cetak struk]
        K5 --> K6[Sesi Kasir]
    end

    subgraph WAITER["🟢 WAITER"]
        W1[Login /waiter-bar] --> W2[Lihat pesanan meja]
        W2 --> W3[KDS status masak]
        W3 --> W4[Antar ke meja]
    end

    subgraph MANAGER["🟡 MANAGER"]
        M1[Login /pos] --> M2[Semua akses kasir]
        M2 --> M3[Kelola produk]
        M3 --> M4[Atur shift karyawan]
        M4 --> M5[Lihat laporan]
        M5 --> M6[Kelola inventaris]
        M6 --> M7[Refund + void]
        M7 --> M8[Pengaturan sistem]
    end

    subgraph OWNER["🟣 OWNER"]
        O1[Login /laporan-keuangan] --> O2[Dashboard keuangan]
        O2 --> O3[Perbandingan outlet]
        O3 --> O4[Arus kas]
        O4 --> O5[Data karyawan]
        O5 --> O6[Peringatan stok]
    end
```

---

## 📦 Data Flow Inventaris

```mermaid
flowchart TD
    VENDOR[Supplier — /pembelian-vendor] -->|PO diterima| STOCK[Stok Masuk — /inventory]
    STOCK --> OPNAME[Stock Opname — /stok-opname]
    STOCK --> ALERT[Peringatan Stok — /owner/inventory/alerts]
    OPNAME -->|Rekonsiliasi| STOCK
    POS[POS Transaksi] -->|Kurangi stok| STOCK
    STOCK --> DASH_INV[Dasbor Stok — /dashboard-inventory]

    subgraph THRESHOLD["Algoritma Threshold"]
        T1{Stok kurang dari minimum?}
        T1 -->|Ya, warning| YELLOW[Segera Reorder]
        T1 -->|Kritis < 10%| RED[Alert Stok Habis]
        T1 -->|Normal| GREEN[Stok Aman]
    end

    STOCK --> T1
```

---

## 🖨️ Printer & Receipt Flow

```mermaid
flowchart TD
    POS_ORDER[POS: Transaksi Selesai] --> AUTO{Auto Print aktif?}
    AUTO -->|Ya| QUEUE[POST /api/print-receipt]
    AUTO -->|Tidak| MANUAL[Tombol Print Manual]
    MANUAL --> QUEUE
    QUEUE --> CONFIG[GET /api/receipt-config]
    CONFIG --> RENDER[Render HTML Struk]
    RENDER --> PRINTER{Tipe Printer}
    PRINTER -->|Thermal 58mm| T58[Cetak 58mm]
    PRINTER -->|Thermal 80mm| T80[Cetak 80mm]
    PRINTER -->|PDF| PDF[Download PDF]
    MONITOR[/print-job-monitor] --> JOB_LIST[GET /api/print-jobs]
```

---

## 🔐 Defense in Depth — Role Access Layers

```mermaid
flowchart TD
    USER[User Request URL] --> L1

    subgraph L1["Layer 1 — Sidebar Filter"]
        SB{Item.roles includes activeRole?}
        SB -->|Tidak| GONE[Tidak di-render di DOM]
        SB -->|Ya| L2
    end

    subgraph L2["Layer 2 — Tab/Button Lock"]
        TB{Role diizinkan untuk tombol?}
        TB -->|Tidak| DISABLED[Disabled + ikon gembok]
        TB -->|Ya| L3
    end

    subgraph L3["Layer 3 — Page Guard"]
        PG{localStorage role in AUTHORIZED_ROLES?}
        PG -->|Tidak| DENY[Halaman Akses Ditolak]
        PG -->|Ya| CONTENT[Konten halaman tampil]
    end
```

---

## 🏷️ Plan Feature Gating

```mermaid
flowchart LR
    subgraph BASIC["Basic"]
        B1[QR Order]
        B2[Thermal Print]
        B3[QRIS + GoPay]
        B4[PBJT Tax]
        B5[Produk & Menu]
    end

    subgraph PRO["Pro (aktif saat ini)"]
        P1[Semua Basic]
        P2[PPN 11% + Service Charge]
        P3[Buku Menu Digital]
        P4[Shift Management]
        P5[WhatsApp Notif]
        P6[Multi Outlet 3]
        P7[Auto Print]
        P8[Laporan Excel]
    end

    subgraph ENT["Enterprise"]
        E1[Semua Pro]
        E2[KDS Dapur]
        E3[White Label]
        E4[Stock Opname Lanjut]
        E5[Payroll]
        E6[WhatsApp API Integration]
        E7[Unlimited Outlet]
        E8[Priority Support]
    end

    BASIC --> PRO --> ENT
```

---

## 📅 Shift Algoritma — Pola Mingguan ke Bulanan

```mermaid
flowchart TD
    START[Manager buka /staf-shift] --> ROLE{Cek role}
    ROLE -->|kasir atau waiter| READONLY[Mode Baca Saja — tombol dikunci]
    ROLE -->|manager atau owner| EDIT[Mode Edit]

    EDIT --> VIEW{Pilih tampilan}
    VIEW -->|Monthly| MGRID[Grid 31 hari]
    VIEW -->|Weekly| WGRID[Grid 7 hari — pola]

    MGRID --> CLICK[Klik sel karyawan+hari]
    CLICK --> ROTATE[Rotasi: P > S > M > O > P]
    ROTATE --> MGRID

    WGRID --> APPLY[Terapkan ke Bulan Ini]
    APPLY --> ALGO["Mapping: setiap hari bulan ke pola hari yang sama (Senin ke Senin, dst)"]
    ALGO --> MGRID

    MGRID --> DOWNLOAD[Unduh PDF]
```

---

## ⚙️ Pengaturan Outlet — Data Flow

```mermaid
flowchart LR
    subgraph BRANDING["Branding"]
        B1[Nama Toko] --> LS1[localStorage: tenantName]
        B2[Logo Icon] --> LS2[localStorage: tenantLogo]
        B3[Upload Gambar] --> B3P[Canvas 120x120px] --> LS3[localStorage: tenantImage]
    end

    subgraph GEO["Geolokasi"]
        L1[Input Alamat] --> API{Google Maps Geocoding}
        API -->|Sukses| COORD[Lat/Long auto-fill]
        API -->|Gagal| LOCAL[Fallback: local city parser]
        COORD --> MAP[Embed Maps]
    end

    subgraph TAX["Pajak"]
        T1[PBJT 10%] --> SAVE[Simpan ke state]
        T2[PPN 11%] --> SAVE
        SAVE --> POS_CALC[Digunakan di POS kalkulasi total]
    end

    LS1 & LS2 & LS3 --> HEADER[Header + Sidebar real-time update]
```

---

## 🗂️ Ringkasan Statistik

| Kategori | Jumlah |
|----------|--------|
| Route halaman (GET) | 35 |
| API Endpoints | 10 |
| **Total Routes** | **45** |
| Menu sidebar (total) | 28 |
| Komponen halaman | 36+ |
| Role pengguna | 4 |
| Tier plan | 3 |

---

*Dokumen ini di-generate dari analisis kode sumber Restoku POS.*
*Terakhir diperbarui: Juli 2026*
