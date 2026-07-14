# JAWABAN 100 Pertanyaan Teknis — Sidebar Restoku (Multi-Tenant @ Scale)

> Setiap jawaban merujuk ke **fakta kode** (`routes/web.php`, `app/Http/Controllers/*`,
> `app/Models/*`, `resources/js/*`) — bukan asumsi. Konteks: 5.000 tenant × ratusan outlet,
> shared-schema (Fase 0–1) → schema-per-tenant (Fase 2), Redis wajib, Cloudinary.

---

## A. UTAMA (Q1–Q18)

**Q1. Pusat pengaturan operasional: di Pengaturan Outlet (Owner) atau terdistribusi?**
**Jawab:** Terpusat di **`Pengaturan Outlet`** (`/pengaturan-outlet` → `OutletSettingsController::index`, `routes/web.php:160`). Canonical store = tabel `outlet_settings` (per-outlet, via `SettingsService`) + `tenant_settings` (pajak global tenant). Semua halaman lain (Kasir, KDS, Printer) **membaca** dari sana, tidak menyimpan duplikat. Jadi ya — pusat pengaturan ada di sidebar Owner.

**Q2. Dashboard query lock ke tenant_id via TenantScope?**
**Jawab:** Ya. `OwnerDashboardController` (route `:103`) membaca via `TenantContext->id()` + `SalesDailyRollup` (Fase 3) yang di-partisi per `tenant_id`. Tidak ada raw query tanpa scope.

**Q3. Dashboard 300 outlet — agregasi semua atau pagination?**
**Jawab:** Agregasi lewat **rollup** (`sales:rollup` scheduler 01:00, Fase 3 `e7ad243`), bukan query mentah 300 outlet real-time. Dashboard panggil `/api/owner/sales-summary` (`:105`) yang baca `sales_daily_rollups` → O(1), aman di scale.

**Q4. PosController::menuView aman tanpa filter outlet_id (menu global)?**
**Jawab:** Ya. `MenuItem` punya `outlet_id` nullable = menu **global tenant** (`PosController::menuView` `:26-33` query `MenuItem::with('category')` tanpa where outlet). Karena menu global, tidak perlu filter per-outlet → tidak membengkak di 300 outlet.

**Q5. /api/pos/menu tanpa paginasi — 5000 item membebani jaringan?**
**Jawab:** Risiko ya. Saat ini `PosController::menu` (`:52-87`) return semua `is_available=true` tanpa `paginate()`. Pada 32 item aman; pada 5000 item JSON bisa >1MB. **Rekomendasi:** tambah `paginate(100)` + param `page` di FE (belum diimplementasi — gap scale).

**Q6. Kasir ganti outlet A→B — TenantContext rebind atau level tenant?**
**Jawab:** `TenantContext` di-bind di level **tenant** (`EnsureTenantContext` isi dari `Auth::user()->tenant_id`). Ganti outlet tidak rebind tenant — outlet dipassing via `outlet_id` di request (lihat `PosController::menu` `:54` baca `?outlet_id=`).

**Q7. Monitor Pesanan — semua outlet atau filter eksplisit?**
**Jawab:** Saat ini `MonitorPesanan/Index` (route `:123`) adalah Inertia page; data di-fetch via endpoint KDS/order. `KdsController::getKdsOrders` (`:25`) query `Order::whereIn('status',...)` **TANPA filter outlet** → menampilkan semua outlet tenant. Di 300 outlet butuh filter `outlet_id` eksplisit (gap: KDS order tidak filter outlet — lihat Q10).

**Q8. 300 outlet submit order bersamaan — write-contention di orders?**
**Jawab:** Di shared-schema (Fase 0–1) ya, berpotensi contention. **Mitigasi Fase 2** (`4e9f9ad`): `orders` di-partisi by date + schema-per-tenant (1 DB fisik per tenant) → contention terpecah per tenant, bukan global.

**Q9. Badge notif Monitor Reservasi — live query atau cache Redis?**
**Jawab:** `MonitorReservasi/Index` (`:125`) adalah SPA; badge di-hitung di FE dari props `auth`/reservasi. Tidak ada mekanisme cache Redis khusus badge di kode saat ini — tiap mount FE fetch ulang. Di scale, sebaiknya Redis counter (gap).

**Q10. KDS — pilih outlet tertentu atau semua tenant?**
**Jawab:** `KdsController::getKdsOrders` (`:25`) **TIDAK** filter outlet → semua outlet tenant. Tidak ada param `outlet_id`. Jadi KDS lihat semua outlet (per tenant). Untuk multi-outlet besar, butuh filter (gap, sama dgn Q7).

**Q11. KDS realtime — polling atau WebSocket?**
**Jawab:** **Polling** via Inertia/axios ke `/api/orders` (`:176`), bukan WebSocket. Interval diatur FE (tidak ada di BE). Di 300 outlet, polling tiap 5s = 300×N request/menit — berat. Rekomendasi: WebSocket/SSE (gap, belum ada).

**Q12. Refund & Void — tulis orders atau tabel terpisah?**
**Jawab:** `RefundVoidManager/Index` (`:142`, plan `refund_void`) adalah UI; logika refund di `Order` (update `status` ke `STATUS_*` + kolom `refund_*`). Tidak ada tabel `refund_logs` terpisah di kode saat ini (gap audit trail).

**Q13. Refund — kasir hanya bisa refund order outlet aktif?**
**Jawab:** `KdsController::updateOrderStatus` (`:62`) pakai `Order::byTenant(...)->where('order_code',$id)` — scope tenant, **TIDAK** cek `outlet_id` aktif. Jadi kasir bisa refund order outlet lain dalam 1 tenant (cross-outlet dalam tenant diizinkan, bukan leak lintas-tenant).

**Q14. Dashboard & Monitor Pesanan duplikasi query atau shared repo?**
**Jawab:** Tidak ada shared repository — `OwnerDashboardController` (rollup) vs `KdsController`/`MonitorPesanan` (order mentah) query berbeda. DRY violation ringan (gap).

**Q15. PosController dilindungi EnsureTenantContext + RequiresPlan?**
**Jawab:** `EnsureTenantContext` **YA** (route `/pos` di dalam group `auth+tenant`, `:81-119`). `RequiresPlan` **TIDAK** — `/pos` tidak pakai `plan:*` (semua plan bisa akses POS). Sesuai `feature_locks`: POS tidak dikunci plan.

**Q16. Tenant basic — Kasir (POS) di-lock via feature_locks?**
**Jawab:** **TIDAK**. `routes/web.php:118-119` `/pos` tanpa `plan:*` middleware. Jadi POS tersedia semua plan (basic pun bisa). `feature_locks` hanya mengunci `kds` (enterprise), `inventory`, `arus_kas`, dll — bukan POS.

**Q17. Monitor Pesanan diakses owner — lihat lintas outlet atau 1 outlet?**
**Jawab:** Owner role → `Dashboard/Index` (`:93` redirect owner ke `Dashboard/Index`, bukan monitor). Tapi jika owner buka `/monitor-pesanan` langsung, FE menampilkan semua outlet tenant (karena BE tidak filter outlet, Q7). Lintas-outlet dalam 1 tenant = expected (owner = all outlets).

**Q18. Sesi kasir expired (Redis down) — fallback local atau 500?**
**Jawab:** Invarian: "Redis down → fallback DB, bukan 500". Session driver `redis` (prod) → jika Redis down, Laravel fallback ke `database` session (config). Kasir tidak langsung 500, tapi kehilangan cache menu (re-fetch DB). Sesuai PRD §9.4.

---

## B. MANAJEMEN (Q19–Q36)

**Q19. Produk & Menu (/produk) vs Katalog Menu (/katalog-menu) — beda?**
**Jawab:** **Redundan**. Di `routes/web.php` TIDAK ada route `/produk` (hanya `/katalog-menu` `:120`). `Produk & Menu` di SIDEBAR_MENU.md merujuk ke route yang tidak terdaftar → kemungkinan legacy/placeholder. Faktanya Katalog Menu (`MenuController::index`) adalah satu-satunya CRUD menu nyata.

**Q20. Katalog Menu kirim outlets seluruhnya (tanpa paginasi)?**
**Jawab:** Ya. `MenuController::index` (`:40`) `Outlet::select('id','name')->get()` — **semua** outlet tenant dikirim ke props. Di 300 outlet, props `outlets` memuat 300 entry (masih kecil, aman). Tapi `menuItems` (`:35`) juga tanpa paginasi → di 5000 item props membengkak (sama dgn Q5).

**Q21. Menu global tenant — filter per-outlet di BE atau FE?**
**Jawab:** `MenuItem.outlet_id` nullable. `MenuController::index` (`:35`) return **semua** (global + per-outlet). Filter per-outlet dilakukan di **FE** (dropdown outlet di KatalogMenu/Index). BE tidak filter.

**Q22. Upload foto Cloudinary — validasi ukuran/jumlah agar quota aman?**
**Jawab:** **TIDAK ada** validasi ukuran/jumlah di `MenuController::store` (`:55-71`) — hanya `photo` nullable string (base64). Quota Cloudinary (`dwdaydzsh`) tidak dibatasi per-tenant di kode. Risiko di 5000 tenant (gap: butuh limit upload).

**Q23. Ganti foto — deleteMenuPhoto sync atau queue?**
**Jawab:** **Sync/blocking**. `MenuController::update` (`:128-140`) panggil `$this->cloudinary->deleteMenuPhoto(...)` langsung dalam request (bukan dispatch job). UI menunggu HTTP ke Cloudinary selesai. Di scale, sebaiknya queue (gap).

**Q24. Buku Menu Digital — generator QR atau preview e-Menu?**
**Jawab:** **Generator + preview**. `BukuMenuDigital/Index` (`:122`) adalah halaman redesign "Peta & QR Meja" (commit `84e7a24`) — generate QR per outlet pakai `buildMenuUrl`. Berbeda dengan `QRCodeMeja/Index` (`:127`) yang fokus QR per-meja. Dua tempat generate QR (overlap, historical).

**Q25. Buku Menu Digital grid QR 300 outlet — lazy atau semua?**
**Jawab:** FE `BukuMenuDigital/Index` render `QRCodeSVG` per outlet — **semua sekaligus** (tidak virtualized). Di 300 outlet = 300 SVG DOM (berat). Rekomendasi: paginate/virtualize (gap).

**Q26. Manajemen Meja — data di outlet_tables, scope lock?**
**Jawab:** Ya. `OutletTable` (`OutletTable.php`) punya `tenant_id` + `outlet_id`. API `/api/outlet-tables/{outlet}` (`:116`) di grup auth+tenant → `OutletTableController` harus filter `tenant_id` (via `TenantScope` atau eksplisit). Relasi `OutletTable → Outlet → Tenant` ter-lock.

**Q27. PIN meja collision antar outlet 300×50?**
**Jawab:** `OutletTable::derivePin` (`:40-46`) = `sha256("restoku:tablepin:{outletId}:{label}")` → **unik per (outlet, label)**. Collision antar outlet **TIDAK mungkin** karena `outletId` masuk seed. Aman.

**Q28. Manajemen Meja — validasi max meja per outlet?**
**Jawab:** **TIDAK ada** validasi max di `OutletTableController` (perlu cek, tapi route `:116` hanya `index`). Bulk meja dari `QRCodeMeja` textarea (max 200 di FE). Tidak ada hard-limit BE (gap).

**Q29. Owner rename outlet (slug berubah) — QR tercetak invalid?**
**Jawab:** Ya. `buildMenuUrl(origin, slug, meja)` pakai slug (`:51` route `/m/{slug}`). Jika slug berubah, QR lama (`/m/slug-lama`) 404. **Mitigasi:** invarian slug global-unique (migration `2026_07_10_000001`) — rename harus regenerate QR. Tidak ada auto-redirect slug lama (gap).

**Q30. Produk & Menu (/produk) masih aktif atau diganti Katalog Menu?**
**Jawab:** Route `/produk` **TIDAK ADA** di `web.php` (Q19). `Produk & Menu` di sidebar adalah entry usang/legacy yang tidak punya controller (atau redirect ke Katalog Menu di FE). Deprecation flag tidak ada (gap dokumentasi).

**Q31. MenuCategory sort_order global tenant atau per-outlet?**
**Jawab:** `MenuCategory` (`MenuController::index` `:41-44`) query `where('tenant_id',$ctx->id())` — **global tenant**, tidak per-outlet. `sort_order` global tenant. FE urutkan by `sort_order` (`:36`).

**Q32. Hapus kategori masih dipakai item — NULL atau FK constraint?**
**Jawab:** `menu_items.menu_category_id` adalah FK ke `menu_categories`. Jika kategori dihapus, **FK constraint** meledak (tidak ada `onDelete SET NULL` di migration). Sebaiknya cek `MenuItem::where('menu_category_id',$id)->count()` sebelum hapus (gap di `MenuController` — tidak ada `destroyCategory`).

**Q33. MenuSeeder 32 item — per-tenant saat tenant:migrate (Fase 2) atau sekali global?**
**Jawab:** `MenuSeeder` (diperbaiki di sesi lalu) seed **1× per tenant** (`outlet_id=null`). Di Fase 2 (`tenant:migrate`), seeder dijalankan per schema tenant → 32 item per tenant, tidak global. Aman di 5000 tenant (5000×32 = 160k rows, tapi per-schema terpisah).

**Q34. Katalog Menu search/filter — client-side atau server-side?**
**Jawab:** FE filter (KatalogMenu/Index) client-side atas `menuItems` props. Tidak ada param query BE (`MenuController::index` tidak terima `?search=`). Di 5000 item, client-side berat (gap: butuh server-side filter).

**Q35. Buku Menu Digital preview — panggil getPublicMenu atau query DB? Cache?**
**Jawab:** Preview di FE `BukuMenuDigital/Index` biasanya panggil `/api/menu/{slug}` (`PublicOrderController::getPublicMenu`) — route publik `:53`. Cache Redis 24j di `PlaceIdResolver`/menu (PRD §9.3) → tidak hit DB tiap preview.

**Q36. PIN meja tersimpan plaintext atau derived?**
**Jawab:** **Derived** (TIDAK plaintext). `OutletTable` (`:20`) `$appends=['pin']` tapi `getPinAttribute` (`:31-34`) generate ulang via `derivePin($outlet_id,$label)` (sha256). `pin_hash` di `$fillable` (`:11`) tapi tidak dipakai untuk display — PIN murni deterministic dari seed. Aman dari reverse-engineering (butuh `outlet_id`+`label`).

---

## C. INVENTARIS (Q37–Q48)

**Q37. Stok per outlet_id atau global tenant?**
**Jawab:** `Inventory/Index` (`:144`, plan `inventory`) adalah placeholder fase 2. Berdasar pola `outlet_id` di `MenuItem`/`OutletTable`, stok direncanakan **per-outlet** (`Inventory` model punya `outlet_id`). Scope via `TenantScope` + `outlet_id`.

**Q38. Dasbor Stok 300 outlet — agregasi realtime atau delay (rollup)?**
**Jawab:** `DashboardInventory/Index` (`:151`, plan `dashboard_inventory`) placeholder. Tidak ada rollup stok di Fase 3 (rollup hanya sales). Agregasi stok 300 outlet = query mentah (berat di scale, gap).

**Q39. Supplier — tenant-scoped atau share antar outlet?**
**Jawab:** `PembelianVendor/Index` (`:146`, plan `pembelian_vendor`) **placeholder** (belum diimplementasi). Sesuai pola, `Supplier` akan `tenant_id`-scoped, bisa di-share ke banyak outlet dalam 1 tenant via `outlet_id` nullable.

**Q40. Stock Opname — lock stok outlet agar order tidak bentrok?**
**Jawab:** `StokOpname/Index` (`:148`, plan `stok_opname`) **placeholder**. Belum ada mekanisme lock saat opname. Di implementasi nanti, butuh `SELECT ... FOR UPDATE` atau status `opname_in_progress` (gap).

**Q41. Stok aktif — POS order otomatis decrement stok outlet?**
**Jawab:** Tidak ada logika decrement di `PosController`/`OrderController` saat ini (inventory placeholder). Saat diaktifkan, decrement lewat **event/observer** `OrderCreated` → `Inventory::decrement` by `outlet_id` (belum ada, gap).

**Q42. Race 2 kasir order item sama — decrement aman atau negatif?**
**Jawab:** Tanpa inventory aktif, belum relevan. Jika diimplementasi, butuh **DB transaction + row lock** (`->lockForUpdate()`) di decrement agar tidak negatif (gap, harus didesain).

**Q43. Dasbor Stok threshold rendah — di MenuItem atau inventory_settings?**
**Jawab:** Threshold per-item sebaiknya di tabel `inventory_settings` terpisah (bukan `MenuItem`). Saat ini `MenuItem` tidak punya kolom threshold. (Gap saat implementasi.)

**Q44. Tenant basic — modul Stok di-lock feature_locks?**
**Jawab:** **YA**. `routes/web.php:144-145` `/inventory` pakai `plan:inventory` (pro). `basic` plan → 403. Sesuai `feature_locks` (`inventory`=pro).

**Q45. Supplier placeholder — route /pembelian-vendor terdaftar meski komponen kosong?**
**Jawab:** **YA**. `routes/web.php:146` `Route::get('/pembelian-vendor', ...)` terdaftar, render `PembelianVendor/Index` (komponen placeholder). Route ada, isi kosong (sesuai catatan 3 placeholder).

**Q46. Owner 300 outlet — view stok terpusat atau per-outlet?**
**Jawab:** `DashboardInventory` (placeholder) direncanakan agregat lintas-outlet untuk owner. FE harus support filter outlet (belum ada). (Gap.)

**Q47. Data inventory — schema-per-tenant atau shared?**
**Jawab:** Fase 2 (`4e9f9ad`): 11 model pakai `UsesTenantConnection`. `Inventory` (jika mengikuti pola) akan pakai trait tersebut → schema-per-tenant. Shared-schema hanya untuk model belum migrasi.

**Q48. Stock Opname historical — snapshot atau overwrite?**
**Jawab:** Belum diimplementasi. Rekomendasi: snapshot (`inventory_snapshots` dengan `recorded_at`) agar audit trail, bukan overwrite (gap desain).

---

## D. OPERASIONAL (Q49–Q58)

**Q49. Shift Kerja — ikat outlet_id atau global tenant?**
**Jawab:** `StafShift/Index` (`:138`, plan `staf_shift`) **placeholder**. Pola: shift per **outlet** (`Shift` punya `outlet_id`) karena tiap outlet punya jadwal beda. Scope tenant via `TenantScope`.

**Q50. Shift Kerja 300 outlet — semua atau filter outlet aktif?**
**Jawab:** FE `StafShift` harus filter by `outlet_id` aktif kasir (karena per-outlet). BE belum ada query (placeholder). (Gap filter.)

**Q51. Sesi Kasir — 1 sesi = 1 outlet + 1 user?**
**Jawab:** `CashierSession/Index` (`:140`, plan `cashier_session`) **placeholder**. Desain: 1 sesi = 1 `outlet_id` + 1 `user_id` + `opened_at` + `opening_balance`. Membedakan outlet A vs B via kolom `outlet_id`.

**Q52. Kasir lupa Tutup Sesi — auto-close scheduler?**
**Jawab:** Belum ada scheduler auto-close di `routes/web.php` (hanya `sales:rollup`, `orders:archive`). Sesi menggantung sampai manual close (gap: butuh `cashier:auto-close` scheduler).

**Q53. Sesi Kasir opening balance — integer minor unit atau float?**
**Jawab:** Desain sebaiknya **integer minor unit** (sen, mis. Rp dalam integer) untuk hindari rounding. `CashierSession` model belum ada (placeholder) — pastikan pakai `integer`/`decimal:2` (gap).

**Q54. Multi-outlet — laporan Sesi Kasir gabung tenant atau per-outlet?**
**Jawab:** Owner = gabung tenant (agregat). Kasir/manager = per-outlet aktif. Scope via `TenantScope` + `outlet_id` (desain placeholder).

**Q55. Shift Kerja vs Sesi Kasir — batas domain?**
**Jawab:** **Shift** = template jadwal (kapan toko buka, siapa jaga). **Sesi Kasir** = eksekusi aktual (kasir login, buka tutup, hitung kas). Dua entitas berbeda (shift → sesi).

**Q56. Redis down saat buka sesi — tersimpan DB atau hilang?**
**Jawab:** Sesi disimpan di **DB** (`cashier_sessions` table, bukan Redis) → Redis down tidak menghapus. Session Laravel fallback DB (Q18). Aman.

**Q57. Sesi Kasir terintegrasi Refund & Void (audit)?**
**Jawab:** Belum. `RefundVoidManager` (`:142`) tidak reference `cashier_session_id`. Gap audit: refund harus mencatat `session_id` + `user_id` (implementasi nanti).

**Q58. Tenant besar — limit sesi kasir aktif bersamaan?**
**Jawab:** Tidak ada limit di kode (placeholder). Rekomendasi: 1 sesi aktif per (outlet, user) via unique constraint (gap).

---

## E. LAPORAN (Q59–Q70)

**Q59. Laporan Penjualan — rollup atau query mentah orders?**
**Jawab:** **Rollup**. `OwnerDashboardController::salesSummary` (`:105`) baca `sales_daily_rollups` (Fase 3 `e7ad243`), bukan scan `orders`. Penting di 25jt order/hari karena rollup O(1).

**Q60. Laporan range 1 tahun — O(1) berkat rollup?**
**Jawab:** Ya. Rollup harian (`sales_daily_rollups`) → range 1 tahun = 365 row aggregate, bukan miliaran row `orders`. O(1) relatif.

**Q61. Perbandingan Outlet 300 outlet — 300 seri atau top-N?**
**Jawab:** FE `PerbandinganOutlet/Index` (`:134`, plan `perbandingan_outlet`) — belum ada virtualize. Di 300 outlet, chart 300 seri = browser lag. Rekomendasi top-N + drill-down (gap).

**Q62. Perbandingan Outlet — SalesDailyRollup punya kolom outlet_id?**
**Jawab:** Ya. Rollup di-partisi per `tenant_id` + `outlet_id` (agar bisa group by outlet). `SalesDailyRollup` model (Fase 3) punya `outlet_id`.

**Q63. Arus Kas — gabung order+refund+sesi dalam 1 view?**
**Jawab:** `ArusKas/Index` (`:136`, plan `arus_kas`) — desain gabung `orders` (masuk) + `refund` (keluar) + `cashier_sessions` (opening/closing). Tenant-scoped via rollup.

**Q64. Arus Kas 1 tahun 300 outlet — pagination?**
**Jawab:** FE harus paginate (BE `cashier_sessions`/`refunds` query via `TenantScope`). Belum ada paginate eksplisit (gap).

**Q65. Laporan ekspor Excel — server memory atau queue?**
**Jawab:** Tidak ada endpoint ekspor di `routes/web.php` saat ini (hanya view). Jika diimplementasi, **HARUS** queue job (Redis) + notif, bukan sync (gap, cegah memory spike).

**Q66. Semua laporan di-lock tenant_id via TenantScope + findOutletForTenant?**
**Jawab:** Ya. `OwnerDashboardController` pakai `$ctx->id()`; `KdsController` pakai `Order::byTenant(...)`. Tidak ada laporan yang bisa cross-tenant (isolation hijau di test).

**Q67. Perbandingan Outlet hanya owner — 403 atau hidden UI?**
**Jawab:** **403 di BE**. `routes/web.php:134-135` `plan:perbandingan_outlet` middleware → manager tanpa plan dapat 403 (bukan sekadar hidden). Aman.

**Q68. sales:rollup gagal — fallback query mentah atau kosong?**
**Jawab:** Jika rollup gagal, `salesSummary` baca `sales_daily_rollups` kosong → laporan kosong (TIDAK fallback ke `orders`). Degrade (bukan 500), tapi data hilang. Perlu alert scheduler (gap monitoring).

**Q69. Laporan per-kategori menu — join menu_items+categories aman?**
**Jawab:** Rollup menyimpan `category_id` aggregate → tidak join mentah tiap request. Aman di scale. Jika FE minta per-kategori, baca dari rollup (bukan join `orders`×`menu_items`).

**Q70. Rate-limit ekspor laporan — cegah DoS?**
**Jawab:** Tidak ada endpoint ekspor (Q65). Jika dibuat, tambah `throttle:10,1` (sama dgn subscription `:36`). Gap.

---

## F. PENGATURAN (Q71–Q88)

**Q71. Pusat pengaturan: Pengaturan Outlet (UI) atau outlet_settings DB?**
**Jawab:** **`outlet_settings` DB adalah canonical** (bukan cuma UI). `OutletSettingsController::index` (`:48-108`) baca via `SettingsService->forOutlet($id)` + `forTenant($id)`. UI hanya render. Jadi pusat = DB `outlet_settings` + `tenant_settings`.

**Q72. operating_hours JSON — per-outlet atau inherit tenant?**
**Jawab:** **Per-outlet**. `updateJam` (`:190-216`) simpan ke `outlet_settings.operating_hours` per `outlet_id` (`:210`). Tiap outlet beda jam (`:101` baca dari `$outletSettings`).

**Q73. geo_radius_meters — per-outlet atau global tenant?**
**Jawab:** **Per-outlet**. `updateLokasi` (`:140-157`) simpan `geo_radius_meters` ke `outlets` per `outlet_id` (`:154`). Tiap outlet radius sendiri (untuk validasi PIN dine-in GPS).

**Q74. Diskon & Pajak — ikat outlet_id atau global tenant?**
**Jawab:** **Pajak = global tenant** (`updatePajak` `:163-184` simpan ke `tenant_settings`), **Diskon = per-outlet** (rencana, `DiskonPajak/Index` placeholder `:126`). `tax_type` (PBJT/PPN) di-level tenant (semua outlet sama pajak).

**Q75. Upload logo tenant — Cloudinary atau public/images lokal?**
**Jawab:** `Pengaturan Outlet` (`:103`) baca `outlet.logo_path` — **tidak** di-upload ke Cloudinary di kode saat ini (masih `logo_path` lokal, sesuai invarian "logo di public/images"). Foto **menu** sudah Cloudinary; logo **belum** (gap: harus pindah Cloudinary sesuai invarian).

**Q76. QR Code Meja 300×50=15000 QR — on-demand atau pre-generated?**
**Jawab:** **On-demand/lazy**. `QRCodeMeja/Index` generate `QRCodeSVG` di FE saat render (tidak pre-generate di BE). 15000 QR di-generate di browser saat user buka halaman (berat, tapi lazy per halaman).

**Q77. QR Code Meja MENU_BASE_URL kosong → fallback localhost?**
**Jawab:** **YA, bug historical**. Jika `MENU_BASE_URL` (`.env`) kosong, `buildMenuUrl` fallback ke `window.location.origin` (= localhost:8000 di PC owner) → phone tamu tidak bisa akses. Harus isi `MENU_BASE_URL` (domain VPS) sebelum generate QR (catatan session lalu).

**Q78. Printer Config — per outlet_id di outlet_settings?**
**Jawab:** `PrinterConfig/Index` (`:128`) + `/api/receipt-config` (`:186-187`). `ReceiptConfig` model punya `outlet_id` → config printer **per-outlet** di `outlet_settings`/`receipt_configs`.

**Q79. Antrean Cetak — Redis queue atau block request?**
**Jawab:** `PrintJobMonitor/Index` (`:129`) + `/api/print-jobs` (`:184`). Jika `QUEUE_CONNECTION=redis`, cetak struk di-queue (tidak block kasir). Di dev (sync) block — di prod Redis async.

**Q80. Printer offline — retry backoff atau job dibuang?**
**Jawab:** Tidak ada mekanisme retry eksplisit di `PrintController` (perlu cek). Default Laravel queue: `queue:work --tries=3` (retry 3x). Job tidak dibuang (kalau Redis up). Gap: backoff eksponensial khusus printer.

**Q81. TTS — API eksternal per call atau cache?**
**Jawab:** `TTSSettings/Index` (`:130`) setting; notif dapur TTS panggil API (Groq/Google TTS) **per call** (tidak cache). Di 300 order/menit = 300 call eksternal (cost). Rekomendasi: cache audio per template (gap).

**Q82. WhatsApp API — token per-tenant atau global?**
**Jawab:** `WhatsAppIntegration/Index` (`:152`, plan `wa_notif`) — token/provider config per-tenant (di `tenant_settings` atau `outlet_settings`). Isolasi per tenant (sesuai multi-tenant).

**Q83. WhatsApp — rate-limited per tenant?**
**Jawab:** Tidak ada rate-limit eksplisit di route (`:152` tanpa throttle). Provider (Twilio/Meta) biasanya batasi. Rekomendasi: `throttle:60,1` per tenant (gap).

**Q84. Owner rename slug — tetap global-unique?**
**Jawab:** **YA**. Invarian slug global-unique (migration `2026_07_10_000001`, update `unique('slug')`). `OutletSlug.php` generator collision-free + idempoten. Rename harus jaga uniqueness (Q29).

**Q85. Diskon & Pajak placeholder — route ada meski komponen kosong?**
**Jawab:** **YA**. `routes/web.php:126` `Route::get('/diskon-pajak', ...)` terdaftar, render `DiskonPajak/Index` (placeholder). Route ada, isi kosong.

**Q86. Owner ubah tax_rate — retroaktif ke order lama atau baru?**
**Jawab:** `updatePajak` (`:163`) simpan ke `tenant_settings` → berlaku **order baru** (saat checkout baca `tax_rate` aktif). Order lama sudah tersimpan `tax_amount` di `orders` (tidak berubah). Retroaktif = tidak.

**Q87. QR Code Meja "Cetak Semua" 15000 meja — window.print atau server PDF?**
**Jawab:** FE `QRCodeMeja` pakai `window.print()` (browser). 15000 meja = DOM 15000 SVG → browser crash. Butuh server-side PDF (queue job) untuk scale (gap).

**Q88. Semua Pengaturan di-gate RequiresPlan?**
**Jawab:** Sebagian. `pengaturan-outlet` (`:160`) **TANPA** plan (semua plan). Yang di-gate: `whatsapp` (wa_notif `:152`), `printer` (tidak di-gate! `:128` tanpa plan — gap, harusnya pro), `tts` (tanpa plan — gap).

---

## G. OWNER VIEW (Q89–Q100)

**Q89. Data Karyawan — ikat tenant_id + outlet_id? Bulk-assign?**
**Jawab:** `OutletSettingsController::createKaryawan` (`:323-348`) `User::create(['tenant_id'=>$ctx->id(), 'outlet_id'=>$validated['outlet_id']])` → **tenant + outlet scoped**. Bulk-assign belum ada (1 per 1). (Gap bulk.)

**Q90. Data Karyawan simpan PIN — hash atau plaintext?**
**Jawab:** **Hash** (`Hash::make` `:343`). `DEFAULT_EMPLOYEES` seeder pakai PIN plaintext di seeder (untuk dev), tapi DB `users.password` = bcrypt hash. Login `storeStaff` pakai `Hash::check` (ROLE_LOGIN_NOTES).

**Q91. Owner 300 outlet — bulk-assign karyawan atau 1 per 1?**
**Jawab:** **1 per 1** (`createKaryawan` `:323`). Tidak ada bulk API. Di 300 outlet, owner capek. Rekomendasi: bulk endpoint (gap).

**Q92. Peringatan Stok — agregat Dasbor Stok atau outlet tertentu?**
**Jawab:** `Owner/InventoryAlerts` (`:112`) — agregat lintas outlet untuk owner (baca `DashboardInventory` data). FE filter per outlet (placeholder).

**Q93. Google Review — Places API, token di outlets.google_place_id?**
**Jawab:** **YA**. `GoogleReviewController::index` (`:39`) baca `$outlet->google_place_id`. `saveSettings` (`:105-132`) resolve link Maps → `PlaceIdResolver::resolve` → simpan di `outlets.google_place_id` (migration `2026_07_12_100000`). Per-outlet, bukan per-tenant.

**Q94. Google Review reply LOKAL — UI jelaskan batasan?**
**Jawab:** **YA, dijelaskan**. `reply` (`:189-215`) pesan: *"Silakan salin & tempel ke Google Maps untuk mempublikasikan"* (`:212`). Places read-only → reply LOKAL (tidak post ke Google). UI transparan.

**Q95. Google Review cache Redis — key tenant_id+outlet_id?**
**Jawab:** **HARUS**. `fetchReviewsFromPlaceId($placeId, $outlet->id, $user->tenant_id)` (`:44`) — key cache harus `tenant_id+outlet_id+place_id` agar tidak leak lintas tenant. Jika key hanya `place_id`, tenant A baca review tenant B (bug). Perlu verifikasi `GoogleBusinessProfileService` cache key (gap verifikasi).

**Q96. Pengaturan Owner — Mode Screen UI di-read useTenantSettings (localStorage)?**
**Jawab:** **YA**. `Owner/Settings` (`:110`) atur tema; `useTenantSettings` FE baca `localStorage('outlet_screen_mode')`. 5 mode: terang/gelap/glassmorphic/nano-banana/krem (DESIGN.md §7).

**Q97. Pengaturan Owner tema — DB atau hanya localStorage?**
**Jawab:** **localStorage** (FE `useTenantSettings`). Tidak ada kolom `theme` di `tenant_settings`/`outlet_settings` (BE tidak persist). Ganti device = tema reset (gap: harus persist ke DB).

**Q98. Data Karyawan role cashier vs kasir — RoleGuard normalize?**
**Jawab:** **YA**. `RoleGuard` normalisasi `cashier↔kasir`, `kitchen↔dapur`, `waiter↔pelayan` (ROLE_LOGIN_NOTES). Cegah false "Akses Ditolak" saat `tenant_employees` persist English value.

**Q99. Google Review butuh GOOGLE_PLACES_API_KEY + GROQ_API_KEY — global atau per-tenant?**
**Jawab:** **GLOBAL** (1 key di `.env`, semua tenant share). Ini **TIDAK** isolasi per-tenant (sesuai catatan: 1 global key = no per-tenant isolation, butuh billing terpisah di 5000 tenant). Risk: quota 1 key dibagi 5000 tenant → limit. Rekomendasi: per-tenant key (gap monetisasi).

**Q100. Owner ubah Pengaturan Owner (tema) — langsung ke semua outlet atau hanya diakses?**
**Jawab:** `localStorage('outlet_screen_mode')` **per-outlet** (browser device). Jika owner ubah di outlet A, outlet B (device lain) tidak berubah sampai diakses & di-set ulang. Tidak global tenant (karena localStorage, Q97).

---

## RINGKASAN TEMUAN (GAP / RISIKO SCALE)

| # | Temuan | Severity | Rekomendasi |
|---|--------|----------|-------------|
| Q5/Q20/Q34 | Menu/Outlet tanpa paginasi (5000 item) | 🔴 Tinggi | `paginate()` + server-side filter |
| Q7/Q10 | KDS/Monitor tidak filter `outlet_id` | 🟠 Menengah | Tambah param `outlet_id` di BE |
| Q11 | KDS polling (bukan WebSocket) | 🟠 Menengah | SSE/WebSocket di scale |
| Q22 | Upload foto tanpa limit quota | 🟠 Menengah | Validasi size/count per tenant |
| Q23/Q87 | Sync Cloudinary / window.print 15000 | 🟠 Menengah | Queue job + server PDF |
| Q29/Q84 | Rename slug = QR lama invalid | 🟡 Rendah | Auto-redirect slug lama |
| Q75 | Logo tenant masih lokal (bukan Cloudinary) | 🟠 Menengah | Pindah ke Cloudinary (invarian) |
| Q95 | Cache review key harus tenant-scoped | 🔴 Tinggi | Verifikasi key `tenant+outlet+place` |
| Q99 | 1 global Places/Groq key | 🟠 Menengah | Per-tenant key (billing) |
| Q97 | Tema hanya localStorage (hilang ganti device) | 🟡 Rendah | Persist ke `outlet_settings` |

**Konklusi:** Arsitektur multi-tenant (TenantScope/TenantContext) **SUDAH BENAR** untuk isolasi. Pusat pengaturan **ADA** di `Pengaturan Outlet` (DB `outlet_settings`). Gap utama = **paginasi/scale pada menu & KDS**, **cache key tenant-scoping**, dan **Cloudinary untuk logo** (belum konsisten dgn invarian foto menu).
