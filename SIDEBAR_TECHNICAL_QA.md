# 100 Pertanyaan Teknis — Sidebar Restoku (Multi-Tenant @ Scale)

> Pertanyaan ini ditujukan untuk developer/agent AI yang membedah arsitektur Restoku.
> Konteks wajib: **5.000 tenant × ratusan outlet (~500.000 outlet)**, shared-schema
> (Fase 0–1) → schema-per-tenant (Fase 2), Redis wajib, Cloudinary untuk foto menu,
> semua muka web/PWA (tanpa native). Setiap pertanyaan harus bisa dijawab dari kode
> (`app/`, `routes/web.php`, `resources/js/`) — bukan asumsi.

---

## A. UTAMA (Dashboard, Kasir POS, Monitor Pesanan, Monitor Reservasi, Dapur KDS, Refund & Void) — 18

1. Dengan scope multi-tenant + ratusan outlet per tenant, apakah pusat pengaturan operasional berada di **Pengaturan Outlet** (sidebar Owner) atau terdistribusi per halaman Kasir?
2. `Dashboard` (`/dashboard`) menampilkan ringkasan penjualan — apakah query-nya selalu di-lock ke `tenant_id` via `TenantScope`, atau ada raw query yang bisa bocor lintas tenant?
3. Pada tenant dengan 300 outlet, apakah `Dashboard` mengagregasi semua outlet sekaligus, atau ada pagination/partial-load agar tidak membunuh DB?
4. `Kasir (POS)` (`/pos`) memanggil `PosController::menuView` — pada saat tenant punya 300 outlet, apakah `MenuItem::with('category')` masih aman tanpa filter `outlet_id` (karena menu bersifat global tenant)?
5. `PosController::menu` (`/api/pos/menu`) mengembalikan menu tanpa paginasi — pada 32+ item aman, tapi jika suatu tenant seed 5.000 item, apakah response JSON akan membebani jaringan kasir?
6. Pada POS, saat kasir ganti outlet (mis. outlet A → B dalam 1 tenant), apakah `TenantContext` di-rebind atau tetap di level tenant?
7. `Monitor Pesanan` (`/monitor-pesanan`) — apakah menampilkan order dari **semua** outlet tenant, atau butuh filter outlet eksplisit agar bisa diskalakan ke 300 outlet?
8. Jika 300 outlet submit order bersamaan, apakah tabel `orders` (shared-schema) mengalami write-contention? Bagaimana Fase 2 (partisi `orders` by date) meredamnya?
9. `Monitor Reservasi` (`/monitor-reservasi`) punya badge notif jumlah pending — apakah badge dihitung via query live tiap request, atau di-cache di Redis (dan bagaimana invalidasinya)?
10. `Dapur (KDS)` (`/kds`) menerima order untuk diproses dapur — pada multi-outlet, apakah KDS bisa memilih "lihat hanya outlet ini" atau semua outlet tenant?
11. `KDS` real-time: apakah menggunakan polling (Inertia partial reload) atau WebSocket? Jika polling, berapa intervalnya dan apakah aman di 300 outlet?
12. `Refund & Void` (`/refund-void`, fase 2) — apakah operasi ini menulis ke `orders` (update status) atau tabel terpisah `refund_logs`? Bagaimana isolasi tenant-nya?
13. Pada refund, apakah ada validasi bahwa kasir hanya bisa refund order dari outlet yang sedang aktif (cegah cross-outlet abuse dalam 1 tenant)?
14. Jika `Dashboard` dan `Monitor Pesanan` sama-sama query `orders`, apakah keduanya pakai repository/shared method yang sama atau duplikat query (DRY violation)?
15. Apakah `PosController` sudah terlindungi `EnsureTenantContext` + `RequiresPlan` (jika POS adalah fitur berbayar di plan tertentu)?
16. Pada tenant dengan subscription `basic` (bukan `pro`), apakah `Kasir (POS)` di-lock via `feature_locks`? Di mana gate-nya didefinisikan?
17. `Monitor Pesanan` diakses role `owner` — apakah owner melihat order lintas outlet (tenant-scoped) atau hanya outlet yang dia pilih?
18. Jika sesi kasir tiba-tiba expired (Redis down), apakah POS fallback ke local state atau langsung 500 (sesuai invariant "Redis down → fallback DB, bukan 500")?

---

## B. MANAJEMEN (Produk & Menu, Katalog Menu, Buku Menu Digital, Manajemen Meja) — 18

19. `Produk & Menu` (`/produk`) vs `Katalog Menu` (`/katalog-menu`) — apa perbedaan domain keduanya? Apakah `Produk & Menu` adalah halaman lama yang redundan dengan Katalog Menu?
20. `Katalog Menu` (`/katalog-menu`) di-render via `MenuController::index` yang mengirim `menuItems` + `outlets` + `categories` — pada 300 outlet, apakah `outlets` dikirim seluruhnya (tanpa paginasi) sehingga props membengkak?
21. `MenuController::index` mengquery `MenuItem` tenant-scoped — jika menu bersifat global tenant (`outlet_id=null`), apakah filter per-outlet di Katalog Menu dilakukan di BE atau FE?
22. Upload foto menu di Katalog Menu (`CloudinaryService::uploadMenuPhoto`) — folder `restoku/{tenant_id}/menu` mengisolasi per tenant, tapi apakah ada validasi ukuran/banyaknya foto agar quota Cloudinary tidak meledak di 5.000 tenant?
23. Saat ganti foto menu, `deleteMenuPhoto` memanggil Cloudinary destroy — apakah ini sync (blocking request) atau di-queue (Redis) agar UI tidak nyangkut?
24. `Buku Menu Digital` (`/buku-menu-digital`, fase 2) — apakah ini halaman generator QR (sama dengan `QR Code Meja`) atau preview e-Menu tamu? Jelaskan overlap keduanya.
25. `Buku Menu Digital` menampilkan QR per outlet — pada 300 outlet, apakah grid QR di-render lazy/virtualized atau semua sekaligus (DOM blow-up)?
26. `Manajemen Meja` (`/manajemen-meja`) — apakah data meja disimpan di tabel `outlet_tables` per outlet? Bagaimana relasi `OutletTable → Outlet → Tenant` di-lock scope-nya?
27. PIN meja (`OutletTable::getPinAttribute`) di-derive deterministik — pada tenant dengan 300 outlet × 50 meja, apakah ada collision PIN antar outlet yang bisa disalahgunakan kasir?
28. `Manajemen Meja` memungkinkan tambah meja — apakah validasi max meja per outlet untuk cegah abusive insert di tenant besar?
29. Jika owner rename outlet (slug berubah), apakah `Manajemen Meja` + QR tercetak otomatis invalid (karena URL `buildMenuUrl` pakai slug)? Bagaimana strategi regenerate?
30. `Produk & Menu` (`/produk`) — apakah masih aktif atau sudah diganti `Katalog Menu`? Jika masih ada, apakah ada redirect/deprecation flag?
31. Pada Katalog Menu, kategori (`MenuCategory`) bersifat tenant-scoped — apakah `sort_order` global tenant atau per-outlet? Bagaimana FE mengurutkan saat render?
32. Jika tenant menghapus kategori yang masih dipakai item, apakah `MenuItem.menu_category_id` di-set NULL (graceful) atau FK constraint meledak?
33. `MenuSeeder` seed 32 item per tenant — pada skenario 5.000 tenant fresh, apakah seeder ini dijalankan per-tenant saat `tenant:migrate` (Fase 2) atau hanya sekali global?
34. Apakah `Katalog Menu` punya fitur search/filter di FE? Jika 5.000 item, apakah filter dilakukan client-side (membebani browser) atau server-side (param query BE)?
35. `Buku Menu Digital` preview — apakah memanggil `getPublicMenu` (route tamu) atau langsung query DB? Apakah ada cache Redis agar tidak hit DB tiap preview?
36. Pada `Manajemen Meja`, apakah PIN meja tersimpan di DB (明文) atau hanya derived? Jika derived, apa seed/algorithm-nya dan apakah aman dari reverse-engineering?

---

## C. INVENTARIS (Stok, Supplier, Stock Opname, Dasbor Stok) — 12

37. `Stok (Bahan Baku)` (`/inventory`, fase 2) — apakah data stok disimpan per `outlet_id` atau global tenant? Bagaimana `TenantScope` + `outlet_id` berinteraksi di sini?
38. Pada 300 outlet, apakah `Dasbor Stok` (`/dashboard-inventory`) mengagregasi stok lintas outlet real-time atau ada delay (cache rollup)?
39. `Supplier` (`/pembelian-vendor`, placeholder) — ketika diimplementasi, apakah data supplier tenant-scoped atau bisa dishare antar outlet dalam 1 tenant?
40. `Stock Opname` (`/stok-opname`, placeholder) — apakah proses opname lock stok outlet tersebut (agar order tidak bentrok dengan penghitungan)?
41. Jika `Stok` diaktifkan, apakah `Kasir (POS)` saat order otomatis mengurangi stok `outlet_id` terkait? Di mana logika decrement-nya (event/observer)?
42. Race condition: 2 kasir di outlet sama order item sama secara bersamaan — apakah decrement stok aman (DB transaction / row lock) atau bisa negatif?
43. `Dasbor Stok` memperingatkan stok rendah — apakah threshold per-item disimpan di `MenuItem` atau tabel `inventory_settings` terpisah?
44. Pada tenant `basic`, apakah modul `Stok` di-lock via `feature_locks` (karena inventory adalah fitur `pro`/`enterprise`)?
45. `Supplier` placeholder saat ini — apakah route `/pembelian-vendor` sudah terdaftar di `web.php` meski komponen hanya placeholder?
46. Jika owner punya 300 outlet, apakah ada view "stok terpusat" di `Dasbor Stok` atau harus cek per-outlet satu per satu?
47. Apakah data inventory masuk ke schema-per-tenant (Fase 2) atau tetap shared-schema? Bagaimana `UsesTenantConnection` trait diterapkan?
48. `Stock Opname` historical — apakah disimpan sebagai snapshot (audit trail) atau overwrite nilai aktual saja?

---

## D. OPERASIONAL (Shift Kerja, Sesi Kasir) — 10

49. `Shift Kerja` (`/staf-shift`, fase 2) — apakah shift diikat `outlet_id` (tiap outlet punya shift berbeda) atau global tenant?
50. Pada 300 outlet, apakah `Shift Kerja` menampilkan semua shift semua outlet (butuh filter) atau hanya outlet aktif kasir?
51. `Sesi Kasir` (`/cashier-session`, fase 2) — apakah 1 sesi kasir = 1 outlet + 1 user? Bagaimana membedakan sesi kasir outlet A vs B dalam 1 tenant?
52. Jika kasir lupa "Tutup Sesi", apakah ada auto-close via scheduler (`schedule:run`) atau sesi menggantung selamanya?
53. `Sesi Kasir` menyimpan opening balance — apakah dalam mata uang raw (integer minor unit) atau float (risiko rounding)?
54. Pada multi-outlet, apakah laporan `Sesi Kasir` bisa digabung per tenant (owner) atau strict per-outlet?
55. `Shift Kerja` vs `Sesi Kasir` — apa batas domainnya? Apakah shift adalah template jadwal, sedangkan sesi adalah eksekusi aktual?
56. Jika Redis down saat kasir buka sesi, apakah data sesi tetap tersimpan (DB fallback) atau hilang?
57. Apakah `Sesi Kasir` terintegrasi dengan `Refund & Void` (audit siapa yang refund di sesi mana)?
58. Pada tenant besar, apakah ada limit jumlah sesi kasir aktif bersamaan (anti-abuse)?

---

## E. LAPORAN (Laporan Penjualan, Perbandingan Outlet, Arus Kas) — 12

59. `Laporan Penjualan` (`/laporan-penjualan`) — apakah query langsung ke `orders` atau ke `sales_daily_rollups` (Fase 3 rollup)? Mengapa rollup penting di 25jt order/hari?
60. `Laporan Penjualan` dengan filter tanggal range 1 tahun — apakah masih O(1) berkat rollup, atau query mentah ke `orders` (yang sudah di-partisi)?
61. `Perbandingan Outlet` (`/perbandingan-outlet`, owner only) — pada 300 outlet, apakah chart memuat 300 seri sekaligus (browser lag) atau top-N + drill-down?
62. `Perbandingan Outlet` mengambil data dari rollup — apakah `SalesDailyRollup` punya kolom `outlet_id` agar bisa di-group per outlet?
63. `Arus Kas` (`/arus-kas`, fase 2) — apakah menggabungkan order + refund + sesi kasir dalam 1 view tenant-scoped?
64. Pada `Arus Kas`, apakah ada pagination saat data kas 1 tahun di 300 outlet (jutaan baris)?
65. `Laporan Penjualan` diekspor Excel — apakah generate di server (memory spike) atau queue job (Redis) dengan notif saat selesai?
66. Apakah semua laporan di-lock `tenant_id` via `TenantScope` + `findOutletForTenant` (cegah owner lihat outlet tenant lain)?
67. `Perbandingan Outlet` hanya `owner` — apakah `manager` benar-benar diblokir (403) atau hanya disembunyikan di UI (masih bisa diakses via URL manipulation)?
68. Jika `sales:rollup` scheduler gagal (DB down), apakah laporan fallback ke query mentah `orders` (degrade) atau kosong?
69. `Laporan Penjualan` per-kategori menu — apakah join ke `menu_items` + `menu_categories` masih aman di skala besar?
70. Apakah ada rate-limit pada endpoint ekspor laporan (cegah DoS via request Excel berulang)?

---

## F. PENGATURAN (Pengaturan Outlet, Diskon & Pajak, QR Code Meja, Printer Config, Antrean Cetak, Pengaturan TTS, WhatsApp API) — 18

71. **Pusat pengaturan**: dengan multi-tenant + ratusan outlet, apakah `Pengaturan Outlet` (`/pengaturan-outlet`) adalah single source of truth untuk konfigurasi outlet, atau ada tabel `outlet_settings` terpisah yang jadi canonical?
72. `Pengaturan Outlet` menyimpan `operating_hours` JSON — apakah ini per-outlet (tiap outlet beda jam) atau inherit dari tenant default?
73. `Pengaturan Outlet` punya `geo_radius_meters` (validasi PIN dine-in) — pada 300 outlet, apakah tiap outlet punya radius sendiri atau satu radius global tenant?
74. `Diskon & Pajak` (`/diskon-pajak`, placeholder) — saat diimplementasi, apakah diskon diikat `outlet_id` atau global tenant? Bagaimana dengan `tax_type` (PBJT/PPN) per outlet?
75. `Pengaturan Outlet` memungkinkan upload logo tenant — apakah disimpan ke Cloudinary (seperti foto menu) atau `public/images` lokal (melanggar invarian Cloudinary)?
76. `QR Code Meja` (`/qrcode-meja`) generate QR per meja — pada 300 outlet × 50 meja = 15.000 QR, apakah generate on-demand (lazy) atau pre-generated semua?
77. `QR Code Meja` link pakai `buildMenuUrl(origin, slug, meja)` — jika `MENU_BASE_URL` kosong, apakah fallback ke `window.location.origin` (masalah di phone, sesuai catatan historical)?
78. `Printer Config` (`/printer-config`) — apakah config printer disimpan per `outlet_id` (tiap outlet printer beda) di `outlet_settings`?
79. `Antrean Cetak` (`/print-job-monitor`, fase 2) — apakah menggunakan Redis queue (`QUEUE_CONNECTION=redis`) agar cetak struk tidak block request kasir?
80. Jika printer offline, apakah `Antrean Cetak` retry dengan backoff atau job dibuang (data struk hilang)?
81. `Pengaturan TTS` (`/tts-settings`) — Text-to-Speech untuk notif dapur, apakah调用 API eksternal (Groq/Google) per call (cost) atau di-cache?
82. `WhatsApp API integration` (`/whatsapp-integration`) — apakah menggunakan `wa_notif` (fitur `pro`) via webhook, dan bagaimana isolasi token per tenant?
83. `WhatsApp API` mengirim notif order ke tamu — apakah rate-limited per tenant (cegah spam/ban dari provider)?
84. Pada `Pengaturan Outlet`, apakah ada validasi bahwa `slug` tetap global-unique saat owner rename (sesuai invarian slug)?
85. `Diskon & Pajak` placeholder — apakah route sudah ada di `web.php` meski komponen kosong?
86. Jika owner mengubah `tax_rate` di `Pengaturan Outlet`, apakah berlaku retroaktif ke order sudah ada atau hanya order baru?
87. `QR Code Meja` "Cetak Semua" — pada 15.000 meja, apakah `window.print()` browser sanggup atau butuh server-side PDF (queue)?
88. Apakah semua halaman Pengaturan di-gate `RequiresPlan` sesuai `feature_locks` (mis. `whatsapp` = pro, `printer` = pro)?

---

## G. OWNER VIEW (Data Karyawan, Peringatan Stok, Google Review & Complaint, Pengaturan Owner) — 12

89. `Data Karyawan` (`/owner/employees`, owner only) — apakah karyawan diikat `tenant_id` + `outlet_id`? Bagaimana owner assign karyawan ke multi-outlet?
90. `Data Karyawan` menyimpan PIN untuk staff login — apakah PIN di-hash (bcrypt) atau plaintext (sesuai catatan DEFAULT_EMPLOYEES)?
91. Pada 300 outlet, apakah owner bisa bulk-assign karyawan ke banyak outlet sekaligus, atau satu per satu?
92. `Peringatan Stok` (`/owner/inventory/alerts`) — apakah ini view agregat dari `Dasbor Stok` (semua outlet) atau hanya outlet tertentu?
93. `Google Review & Complaint` (`/owner/google-reviews`) — sekarang pakai **Google Places API** (bukan Business Profile OAuth) — apakah token/key disimpan per-tenant di `outlets.google_place_id`?
94. `Google Review` reply adalah **lokal** (Places read-only tidak bisa post ke Google) — apakah UI menjelaskan batasan ini ke owner agar tidak bingung?
95. `Google Review` fetch live + cache Redis 24j — pada 5.000 tenant, apakah cache key menyertakan `tenant_id` + `outlet_id` (cegah cross-tenant leak data review)?
96. `Pengaturan Owner` (`/owner/settings`) — apakah ini tempat atur `Mode Screen UI` (terang/gelap/krem/...) yang di-read FE via `useTenantSettings` (localStorage)?
97. `Pengaturan Owner` memungkinkan pilih tema — apakah tema tersimpan di `outlet_settings` (DB) atau hanya localStorage (hilang saat ganti device)?
98. Pada `Data Karyawan`, apakah role `cashier` (English) dan `kasir` (Indonesian) dinormalisasi via `RoleGuard` agar tidak bentrok (sesuai ROLE_LOGIN_NOTES)?
99. `Google Review` butuh `GOOGLE_PLACES_API_KEY` + `GROQ_API_KEY` di `.env` — apakah key ini global (1 key semua tenant) atau per-tenant (isolation + billing terpisah)?
100. Jika owner mengubah `Pengaturan Owner` (mis. ganti tema), apakah perubahan langsung berlaku di semua outlet tenant (karena `localStorage('outlet_screen_mode')` per-outlet) atau hanya outlet yang diakses?

---

## Catatan Penilaian (untuk agent AI)

- **Jawaban BENAR** = merujuk ke file/line konkret (`app/Models/...`, `routes/web.php:NN`, `resources/js/...`) + menjelaskan mekanisme `TenantScope`/`TenantContext`.
- **Jawaban SALAH** = asumsi tanpa bukti kode, atau mengabaikan isolasi tenant (cross-tenant leak).
- **Pertanyaan jebakan**: #71 (pusat pengaturan = `outlet_settings` DB, bukan hanya UI), #77 (MENU_BASE_URL kosong → fallback localhost = bug phone), #95 (cache key harus tenant-scoped), #99 (1 global key = no per-tenant isolation, butuh billing).
