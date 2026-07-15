# Bank Soal QA Teknis Restoku (100 Soal, Tanpa Jawaban)

Bank soal ini untuk memvalidasi agen AI/developer terhadap **kode nyata** Restoku.
Semua soal dapat dijawab dari kode (bukan asumsi). Jawaban + sitasi `file:line`
ada di `SIDEBAR_TECHNICAL_QA_ANSWERS.md`. Beberapa soal adalah **TRAP** yang
dirancang untuk menjebak agen dangkal — baca kode sebelum menjawab.

---

## BAGIAN 1 — 30+ Item Sidebar & Pemetaan Route (Soal 1–26)

1. Di `resources/js/Layouts/MainLayout.tsx`, berapa banyak item navigasi (`NavItem`)
   total yang terdaftar di array `nav`, dan berapa grup (`NavGroup`)?
2. Route `/dashboard` di `routes/web.php` merender component apa, dan apakah ia
   role-aware redirect? Sebutkan tujuan untuk role `owner`, `manager`, `kasir`,
   `waiter`, dan `kitchen`.
3. Menu sidebar "Kasir (POS)" (`MainLayout.tsx`) memetakan ke route `/pos`.
   Controller & method apa yang menanganinya di `routes/web.php`?
4. Menu "Monitor Pesanan" memetakan ke `/monitor-pesanan`. Apakah route tersebut
   di-handle oleh controller, atau sekadar `Inertia::render`?
5. Menu "Dapur (KDS)" → `/kds`. Controller apa yang menanganinya, dan apakah
   route ini punya middleware `plan`?
6. Menu "Refund & Void" → `/refund-void`. Ada controller/plan gate apa?
7. Menu "Produk & Menu" di `MainLayout.tsx` memetakan ke `href: '/produk'`.
   Apakah `Route::get('/produk', ...)` terdaftar di `routes/web.php`? Jika tidak,
   apa yang terjadi bila menu diklik?
8. Menu "Katalog Menu" → `/katalog-menu`. Controller & method apa?
9. Menu "Buku Menu Digital" → `/buku-menu-digital`. Di-handle oleh controller
   atau `Inertia::render` langsung?
10. Menu "Manajemen Meja" → `/manajemen-meja`. Controller atau render?
11. Grup Inventaris: "Stok (Bahan Baku)" → `/inventory`. Plan gate apa?
12. Grup Inventaris: "Supplier" → `/pembelian-vendor`. Apakah ini placeholder
   kosong (tanpa controller, tanpa plan gate)?
13. Grup Inventaris: "Stock Opname" → `/stok-opname`. Apakah placeholder kosong?
14. Grup Inventaris: "Dasbor Stok" → `/dashboard-inventory`. Plan gate apa?
15. Grup Operasional: "Shift Kerja" → `/staf-shift`. Plan gate apa?
16. Grup Operasional: "Sesi Kasir" → `/cashier-session`. Plan gate apa?
17. Grup Laporan: "Laporan Penjualan" → `/laporan-penjualan`. Ada plan gate?
18. Grup Laporan: "Perbandingan Outlet" → `/perbandingan-outlet`. Plan gate apa?
19. Grup Laporan: "Arus Kas" → `/arus-kas`. Plan gate apa?
20. Grup Laporan: "Laba & Rugi" → `/laporan/laba-rugi`. Controller & method?
21. Grup Laporan: "Laporan Produk" → `/laporan/produk`. Controller & method?
22. Grup Laporan: "Laporan Shift" → `/laporan/shift`. Controller & method?
23. Grup Laporan: "Laporan Meja" → `/laporan/meja`. Controller & method?
24. Grup Laporan: "Transaksi Void" → `/laporan/void`. Controller & method?
25. Grup Keuangan: "Biaya Operasional" → `/biaya-operasional`. Controller & method?
26. Grup Pengaturan: sebutkan 3 route yang hanya `Inertia::render` tanpa
   controller — "Diskon & Pajak", "Pengaturan Outlet", "QR Code Meja",
   "WhatsApp API integration" — mana yang punya plan gate dan mana yang placeholder?

---

## BAGIAN 2 — Arsitektur Multi-Tenancy (Soal 27–46)

27. Di `app/Models/Scopes/TenantScope.php`, dari mana `TenantScope` membaca
   `tenant_id` saat menerapkan filter query?
28. Siapa yang mengisi binding `'tenant.id'` ke service container, dan lewat
   method apa?
29. Apakah `TenantScope` membaca `Auth::user()->tenant_id` secara langsung?
30. Di environment `production`, bila binding `'tenant.id'` belum diisi, apa yang
   terjadi pada query model yang kena `TenantScope`?
31. Di environment `local`/`testing`/`console` (seeding), bila binding kosong,
   apa behaviour `TenantScope`?
32. `EnsureTenantContext` dipasang SETELAH middleware `auth`. Apa guard-nya
   bila user login tapi tidak punya `tenant_id`?
33. Di `routes/web.php`, route group mana yang memasang middleware
   `['auth', 'tenant']`?
34. `TenantContext` di-bind sebagai singleton di mana?
35. `TenantContext::subscription()` — bila tenant tidak punya subscription,
   apa fallback plan/status-nya?
36. Migration `2026_07_10_000001_make_outlet_slug_globally_unique.php`:
   constraint `slug` diubah dari apa menjadi apa?
37. Mengapa `slug` outlet harus **global-unique** (bukan per-tenant)?
38. Di `PublicOrderController::getPublicMenu`, mengapa pemanggilan
   `Outlet::withoutGlobalScope(TenantScope::class)` diperlukan?
39. `PublicOrderController::getOutletOperatingHours` juga memakai
   `withoutGlobalScope(TenantScope::class)`? Di baris berapa?
40. Model `Outlet` mendaftarkan `TenantScope` lewat `booted()`?
41. Apakah model `Tenant` itu sendiri memakai `TenantScope`?
42. `cacheKey` di `getPublicMenu` — apakah mengandung `tenant_id`?
43. (TRAP) Apakah cache menu `menu:tenant:...` bisa bocor lintas-tenant
   karena key yang dipakai?
44. `TenantScope::bypass()` — apa fungsinya dan apakah ia otomatis mengembalikan
   (restore) scope setelah callback selesai?
45. Di artisan command / queue job, bagaimana `tenant_id` di-set agar
   `TenantScope` aktif?
46. Di `submitOrder`, `Order::create(...)` dipanggil dengan
   `withoutGlobalScope(TenantScope::class)`. Mengapa bisa aman?

---

## BAGIAN 3 — Public e-Menu / Customer View (Soal 47–66)

47. Route `/m/{slug}` merender component apa, dan prop apa yang dikirim?
48. (TRAP) Di `CustomerView.tsx`, slug outlet dibaca dari prop `'slug'` yang
   dikirim Inertia, atau dari URL path?
49. (TRAP) Tema e-Menu (`screen_mode`) dibaca dari **server** atau dari
   **localStorage**?
50. Bila `outlet_settings.screen_mode` kosong, apa fallback `screen_mode`
   di `getPublicMenu`?
51. Setelah `CustomerView` fetch API, ke `localStorage` key apa saja
   `screen_mode` disimpan?
52. URL API yang dipanggil `CustomerView` untuk mengambil menu adalah?
53. Route `/api/menu/{slug}` di-handle oleh controller & method apa?
54. JSON top-level yang dikembalikan `getPublicMenu` berisi field apa saja?
55. Field `tenant_layout` di respon `getPublicMenu` selalu bernilai apa?
56. Berapa lama TTL cache menu di `getPublicMenu`?
57. Scope `forGuestMenu($outlet->id)` di `getPublicMenu` mengambil arti apa?
58. Di `lib/menuUrl.ts`, bila `base` atau `slug` kosong, `buildMenuUrl`
   mengembalikan apa?
59. `buildMenuUrl` menambahkan nomor meja ke URL sebagai query param
   dengan nama apa?
60. (TRAP) Apakah query param `?t=<meja>` disertakan dalam cache key menu
   (sehingga setiap meja punya cache berbeda)?
61. Di `MainLayout.tsx`, `activeRole` dihitung dari mana?
62. Filter sidebar berdasarkan role dilakukan dengan kondisi apa?
63. `RoleGuard`: bila `auth.user.role === 'owner'` dan `'owner'` ada di
   `allowedRoles`, status yang dikembalikan apa?
64. `RoleGuard` memvalidasi format token session dengan regex apa?
65. `RoleGuard` menormalisasi alias role — `cashier` dipetakan ke apa?
66. (TRAP) Bila owner mengganti `slug` outlet, apa yang terjadi pada QR
   tercetak yang masih memakai slug lama?

---

## BAGIAN 4 — QR Meja (Soal 67–86)

67. (TRAP) Di `QRCodeMeja/Index.tsx`, `baseUrl` diambil dari prop apa dengan
   fallback apa? Bila `MENU_BASE_URL` kosong saat generate QR, URL jadi apa
   dan apa dampaknya bila tamu scan dari HP?
68. `QRCodeMeja` mem-bungkus halaman dengan `RoleGuard` — `allowedRoles`-nya apa?
69. `tableUrl` di `QRCodeMeja` dibangun lewat fungsi apa?
70. Nilai default `tableInput` (label meja) di `QRCodeMeja`?
71. Batas maksimal jumlah meja per cetak di `QRCodeMeja`?
72. Library apa yang dipakai `QRCodeMeja` untuk merender QR SVG?
73. Di `BukuMenuDigital/Index.tsx`, data meja nyata di-load dari endpoint API apa?
74. Di `BukuMenuDigital/Index.tsx`, `baseUrl` juga diambil dari
   `props.menu_base_url` dengan fallback `window.location.origin`?
75. `OutletTable::getPinAttribute` — apakah PIN meja disimpan sebagai plaintext
   di database?
76. `OutletTable::derivePin()` memakai algoritma apa untuk menghasilkan PIN?
77. Apakah PIN meja **deterministik & stabil** per (outlet, label), dan apakah
   ia disimpan di DB?
78. Kolom DB mana yang menyimpan PIN meja (plaintext atau hash)?
79. `OutletTableController::store` menyimpan PIN lewat `Hash::make(derivePin(...))`?
80. `OutletTableController::index` menampilkan `pin` plaintext ke owner/waiter —
   dari accessor mana?
81. (TRAP) Format meja `A1–A9 / B1–B3` — apakah di-lock/hardcode di FE,
   atau bebas diisi owner?
82. `OutletTableController::store` memvalidasi `qr_type` hanya boleh salah satu
   dari nilai apa?
83. `OutletTableController::bulkStore` — bila ada label duplikat, apakah
   request gagal total atau dilewati (skipped)?
84. `OutletTableController` menjamin keamanan lintas-tenant lewat method apa?
85. PIN harian restoran untuk tamu di `CustomerView` diambil dari endpoint apa?
86. (TRAP) "1 global API key (Groq/Gemini) sudah cukup untuk isolasi
   multi-tenant" — benar atau salah? Buktikan dari kode.

---

## BAGIAN 5 — Google Reviews (Soal 87–100)

87. `PlaceIdResolver::resolve()` — bila input sudah berisi `ChIJ...` (Place ID),
   apa yang langsung dikembalikan?
88. `PlaceIdResolver` — bila input berisi koordinat `@lat,lng` atau `!3d lat !4d lng`,
   apa yang dilakukannya?
89. `reverseGeocode()` di `PlaceIdResolver` memanggil API apa dan membaca
   config key apa?
90. `PlaceIdResolver` punya hardcode untuk "Pawon Salam Resto" — Place ID apa
   yang dikembalikan?
91. `GoogleReviewController::index` — field `source` bernilai `'places'` atau
   `'local'` berdasarkan kondisi apa?
92. Kolom `google_reviews.source` di-set nilai `'places'` di mana di kode?
93. (TRAP) Fitur Google Review Restoku memakai **Business Profile OAuth** atau
   **Places API** (Place Details by Place ID)?
94. `GoogleReviewController::saveSettings` menerima input apa dan memanggil
   `PlaceIdResolver` untuk apa?
95. `generateAiReply` — bila provider utama (Groq) gagal, fallback ke provider
   apa?
96. `generateAiReply` dan `reply` mengecek bahwa review milik tenant yang login?
   Di baris berapa?
97. Model `GoogleReview` mendaftarkan `TenantScope` lewat `booted()`?
98. `GoogleBusinessProfileService::fetchReviewsFromPlaceId` — cache key-nya
   mengandung apa saja (tenant / outlet / place)?
99. `GoogleBusinessProfileService::keyForTenant()` mengambil API key per-tenant
   dari `TenantSetting` dengan fallback ke config global?
100. (TRAP) Bila dua tenant kebetulan memakai Place ID Google yang SAMA,
     apakah mereka bisa membaca cache review tenant lain (cross-tenant leak)?
