# Jawaban Bank Soal QA Teknis Restoku (100 Soal)

Semua jawaban mengutip **baris nyata** dari kode Restoku. Format: `file:line`.
Soal bertanda (TRAP) dirancang menjebak agen dangkal — jawabannya menunjukkan
"apa yang sebenarnya terjadi", bukan apa yang disangka.

---

## BAGIAN 1 — Sidebar & Pemetaan Route (1–26)

**1.** `MainLayout.tsx` mendaftarkan **38 item** (`NavItem`) dalam **8 grup** (`NavGroup`):
Utama(6), Manajemen(4), Inventaris(4), Operasional(2), Laporan(8), Keuangan(1),
Pengaturan(7), Owner View(6). Definisi array `nav` di `MainLayout.tsx:30-133`.

**2.** `routes/web.php:89-101`. `Route::get('/dashboard', fn () => match($role) {...})`.
Owner → `Inertia::render('Dashboard/Index')`; manager → `redirect('/laporan-penjualan')`;
kasir → `redirect('/pos')`; cashier → `redirect('/pos')`; waiter → `redirect('/waiter-bar')`;
kitchen → `redirect('/kds')`; default → `redirect('/login')`.

**3.** `/pos` → `PosController::menuView`. `routes/web.php:137`.

**4.** `/monitor-pesanan` → sekadar `Inertia::render('MonitorPesanan/Index')` (tanpa controller).
`routes/web.php:141`.

**5.** `/kds` → `Inertia::render('KDS/Index')` dengan `->middleware('plan:kds')`.
`routes/web.php:198-199`.

**6.** `/refund-void` → `Inertia::render('RefundVoidManager/Index')` dengan
`->middleware('plan:refund_void')`. `routes/web.php:184-185`. Tidak ada controller khusus.

**7. (TRAP)** `MainLayout.tsx:54` memetakan "Produk & Menu" ke `href: '/produk'`, **tetapi**
`routes/web.php` TIDAK memiliki `Route::get('/produk', ...)` (hanya ada `/katalog-menu` di
`web.php:138`). Maka klik menu → **route tidak ditemukan (404/Inertia error)**. Ini gap nyata.

**8.** `/katalog-menu` → `MenuController::index`. `routes/web.php:138`.

**9.** `/buku-menu-digital` → `Inertia::render('BukuMenuDigital/Index')` (tanpa controller).
`routes/web.php:140`.

**10.** `/manajemen-meja` → `Inertia::render('ManajemenMeja/Index')`. `routes/web.php:139`.

**11.** `/inventory` → `Inertia::render('Inventory/Index')` + `->middleware('plan:inventory')`.
`routes/web.php:186-187`.

**12.** `/pembelian-vendor` → `Inertia::render('PembelianVendor/Index')`, **TANPA** controller
dan **TANPA** plan gate (`web.php:188-189`). Placeholder kosong (sengaja).

**13.** `/stok-opname` → `Inertia::render('StokOpname/Index')`, **TANPA** plan gate (`web.php:190-191`).
Placeholder kosong (sengaja).

**14.** `/dashboard-inventory` → `Inertia::render('DashboardInventory/Index')` + `->middleware('plan:dashboard_inventory')`.
`routes/web.php:192-193`.

**15.** `/staf-shift` → `Inertia::render('StafShift/Index')` + `->middleware('plan:staf_shift')`.
`routes/web.php:180-181`.

**16.** `/cashier-session` → `Inertia::render('CashierSession/Index')` + `->middleware('plan:cashier_session')`.
`routes/web.php:182-183`.

**17.** `/laporan-penjualan` → `Inertia::render('LaporanPenjualan/Index')`, **TANPA** plan gate
(tersedia semua plan). `routes/web.php:175`.

**18.** `/perbandingan-outlet` → `->middleware('plan:perbandingan_outlet')`. `routes/web.php:176-177`.

**19.** `/arus-kas` → `->middleware('plan:arus_kas')`. `routes/web.php:178-179`.

**20.** `/laporan/laba-rugi` → `OwnerDashboardController::labaRugi`. `routes/web.php:117`.

**21.** `/laporan/produk` → `OwnerDashboardController::laporanProduk`. `routes/web.php:118`.

**22.** `/laporan/shift` → `OwnerDashboardController::laporanShift`. `routes/web.php:119`.

**23.** `/laporan/meja` → `OwnerDashboardController::laporanMeja`. `routes/web.php:120`.

**24.** `/laporan/void` → `OwnerDashboardController::laporanVoid`. `routes/web.php:121`.

**25.** `/biaya-operasional` → `BiayaOperasionalController` (`index` + `store`).
`routes/web.php:126-127`.

**26.** "Diskon & Pajak" `/diskon-pajak` → `Inertia::render('DiskonPajak/Index')` tanpa plan gate
(placeholder) — `web.php:144`. "Pengaturan Outlet" `/pengaturan-outlet` →
`OutletSettingsController::index` — `web.php:202`. "QR Code Meja" `/qrcode-meja` →
`Inertia::render('QRCodeMeja/Index')` — `web.php:149`. "WhatsApp API integration"
→ `->middleware('plan:wa_notif')` — `web.php:194-195`.

---

## BAGIAN 2 — Multi-Tenancy (27–46)

**27.** Dari **service container**: `$tenantId = app('tenant.id')`. `TenantScope.php:47`.

**28.** `EnsureTenantContext::handle()` memanggil `$this->ctx->setFromUser($user)` yang melakukan
`App::bind('tenant.id', fn () => $this->tenantId)`. `EnsureTenantContext.php:36-38`;
`TenantContext.php:38-46`.

**29.** **TIDAK** — `TenantScope` tidak membaca `Auth::user()` langsung; ia membaca container
yang diisi middleware. Komentar jelas di `TenantScope.php:12-15`.

**30.** Di production: `abort(500, 'TenantContext belum diinisialisasi (misconfig).')` — fail closed
agar tidak kembalikan data lintas-tenant. `TenantScope.php:40-42`.

**31.** Di local/testing/console/seeding: scope **tidak aktif** (return tanpa filter) — "Plan B"
agar `db:seed` tetap jalan. `TenantScope.php:44`.

**32.** `abort(403, 'Akun ini tidak terhubung ke tenant manapun.')`. `EnsureTenantContext.php:32-34`.

**33.** `Route::middleware(['auth', 'tenant'])->group(function () { ... })` membungkus hampir semua
route terproteksi. `routes/web.php:81`.

**34.** Di-binding sebagai **singleton** di `AppServiceProvider`:
`$this->app->singleton(TenantContext::class, fn() => new TenantContext())`.
Komentar `TenantContext.php:13-14`.

**35.** Fallback: `new Subscription(['tenant_id'=>$id, 'plan'=>'basic', 'status'=>'expired'])`.
`TenantContext.php:91-106`.

**36.** Menghapus `unique(['tenant_id','slug'])` dan menambah `unique('slug')` (global).
Migration `2026_07_10_000001_make_outlet_slug_globally_unique.php:25-26`.

**37.** Karena `/m/{slug}` adalah route publik **global**. Unique per-tenant menyebabkan dua tenant
dengan outlet bernama sama menghasilkan slug identik → QR tenant B membuka menu tenant A
(cross-tenant leak). Komentar migration `lines 8-14`.

**38.** Karena endpoint publik: tenant **belum diketahui** dari slug. Harus query **lintas semua**
tenant untuk cocokkan `slug`. `PublicOrderController.php:42-44`.

**39.** Ya. `Outlet::withoutGlobalScope(TenantScope::class)->where('slug', $outletParam)`.
`PublicOrderController.php:318-320`.

**40.** Ya. `Outlet::booted()` → `static::addGlobalScope(new TenantScope)`.
`Outlet.php:30-36`.

**41.** **TIDAK** — model `Tenant` sendiri tidak memakai `TenantScope` (aman di-resolve tanpa
scope). Komentar `TenantContext.php:81`.

**42.** Ya. `$cacheKey = "menu:tenant:{$outlet->tenant_id}:outlet:".($outlet->id ?? 'global')`.
`PublicOrderController.php:62`.

**43. (TRAP)** **TIDAK bocor.** Key menyertakan `tenant_id`, jadi cache terisolasi per-tenant.
`PublicOrderController.php:62` — aman.

**44.** `TenantScope::bypass($callback)` mem-bind `tenant.id` jadi `null` sementara, menjalankan
callback di `try`, lalu **otomatis restore** di `finally` (bind ulang id lama atau unset).
`TenantScope.php:63-80`.

**45.** Command/job wajib memanggil `app(TenantContext::class)->setTenantId($id)` (atau
`setFromUser` di test). `TenantContext.php:52-59` (komentar `49-51`).

**46.** Karena `tenant_id` **eksplisit dikirim** di `create(['tenant_id'=>$tenantId, ...])` dan
`withoutGlobalScope` menonaktifkan syarat container-binding. `PublicOrderController.php:151-158`.

---

## BAGIAN 3 — Public e-Menu / Customer View (47–66)

**47.** `Inertia::render('BukuMenuDigital/CustomerView', ['slug' => $slug])` — **hanya** prop `'slug'`.
`routes/web.php:51`.

**48. (TRAP)** Dari **URL path**, bukan prop. `CustomerView.tsx:124`:
`const outletSlug = window.location.pathname.split('/m/')[1]...`. Prop `'slug'` dari
Inertia praktis tidak dipakai untuk slug (hanya `screen_mode` yang dibaca dari prop di `:111`).

**49. (TRAP)** **SERVER-driven.** `const screenMode = (page.props.screen_mode) || lsScreenMode`
(`CustomerView.tsx:111`); API mengembalikan `outlet_settings.screen_mode`
(`PublicOrderController.php:78`). `localStorage` hanya fallback bila kosong/offline
(`CustomerView.tsx:162-167` menyimpan ke localStorage agar konsisten).

**50.** Fallback `'nano-banana'`. `PublicOrderController.php:78`.

**51.** `localStorage.setItem('outlet_screen_mode', data.screen_mode)` dan
`setItem('tenant_layout', data.tenant_layout ?? data.screen_mode)`. `CustomerView.tsx:165-166`.

**52.** `` `/api/menu${outletSlug ? `/${encodeURIComponent(outletSlug)}` : ''}` ``. `CustomerView.tsx:141`.

**53.** `Route::get('/api/menu/{slug}', [PublicOrderController::class, 'getPublicMenu'])`.
`routes/web.php:53`.

**54.** `outlet{id,name,slug,latitude,longitude,geo_radius_meters}`, `screen_mode`,
`tenant_layout`, `menu`. `PublicOrderController.php:80-92`.

**55.** Selalu `'nano-banana'`. `PublicOrderController.php:90`.

**56.** `now()->addMinutes(10)` → **10 menit**. `PublicOrderController.php:65`.

**57.** `forGuestMenu($outlet->id)` membatasi item menu hanya milik outlet tersebut.
`PublicOrderController.php:68` (definisi scope ada di MenuItem model).

**58.** Mengembalikan **string kosong `''`**. `menuUrl.ts:2-3`.

**59.** Query param **`t`** = `encodeURIComponent(table)`. `menuUrl.ts:8-11`.

**60. (TRAP)** **TIDAK** — `?t=<meja>` **bukan** bagian cache key. Menu di-cache per-outlet;
komentar eksplisit di `menuUrl.ts:7-8` ("Bukan bagian dari cache key menu (menu per-outlet)").

**61.** `MainLayout.tsx:213`: `user?.role === 'owner' ? 'owner' : (activeKaryawan?.role ?? user?.role ?? 'kasir')`.

**62.** `visibleNav = nav.map(g => ({...g, items: g.items.filter(i => i.roles.includes(activeRole))})).filter(g => g.roles.includes(activeRole) && g.items.length>0)`.
`MainLayout.tsx:216-218`.

**63.** Mengembalikan `'allowed'`. `RoleGuard.tsx:22-25`.

**64.** Regex `/^.+_.+_auth_ok$/` (token session kriptografis dari StaffLogin). `RoleGuard.tsx:65`.

**65.** `'cashier'` → `'kasir'` (juga `kitchen/dapur`, `waiter/pelayan`, dll.).
`RoleGuard.tsx:46-54`.

**66. (TRAP)** Tetap valid lewat **redirect 301 ke slug baru**. `getPublicMenu` mengecek
`where('old_slug', $slug)` lalu `redirect()->to("/m/{$outlet->slug}", 301)`.
`PublicOrderController.php:47-55`. `Outlet::setNameAttribute` menyimpan `old_slug` saat slug
diubah (`Outlet.php:68-71`).

---

## BAGIAN 4 — QR Meja (67–86)

**67. (TRAP)** `baseUrl = (props.menu_base_url) || window.location.origin`.
`QRCodeMeja.tsx:57`. Bila `MENU_BASE_URL` kosong → fallback ke **origin browser**
(mis. `localhost`). QR lalu menunjuk ke `localhost` → **HP tamu tidak bisa menjangkaunya**
(broken). Jadi env `MENU_BASE_URL` wajib di-set ke domain publik.

**68.** `allowedRoles={['owner', 'manager', 'admin']}`. `QRCodeMeja.tsx:287-289`.

**69.** `buildMenuUrl(baseUrl, selectedOutlet.slug, label)` dari `lib/menuUrl`. `QRCodeMeja.tsx:67`.

**70.** Default `'A1\nA2\nB1\nB2\nC1'`. `QRCodeMeja.tsx:48`.

**71.** Maksimal **200** meja per cetak: `.slice(0, 200)`. `QRCodeMeja.tsx:64`.

**72.** `qrcode.react` → komponen `QRCodeSVG`. `QRCodeMeja.tsx:10,228`.

**73.** `fetch('/api/outlet-tables/${outletId}', ...)`. `BukuMenuDigital/Index.tsx:121`.

**74.** Ya. `const baseUrl = (props.menu_base_url) || (typeof window !== 'undefined' ? window.location.origin : '')`.
`BukuMenuDigital/Index.tsx:112`.

**75.** **TIDAK** disimpan plaintext — PIN **di-derive** ulang dari seed deterministik.
Komentar `OutletTable.php:28-35`.

**76.** `hash('sha256', "restoku:tablepin:{$outletId}:{$label}")`, ambil 4 digit terakhir,
`str_pad(...,4,'0',STR_PAD_LEFT)`. `OutletTable.php:41-47`.

**77.** Ya — **deterministik & stabil** per `(outlet_id, label)`, dan **TIDAK disimpan** di DB
(hanya kolom `pin_hash`). `OutletTable.php:32-47`.

**78.** Kolom `pin_hash` (hash). `OutletTable.php:11` (fillable `'pin_hash'`).

**79.** Ya. `'pin_hash' => Hash::make(OutletTable::derivePin($outlet->id, $label))`.
`OutletTableController.php:82` (juga `:126, :204`).

**80.** Dari accessor `getPinAttribute()` (`OutletTable.php:32`), dikembalikan di map
`'pin' => $t->pin`. `OutletTableController.php:42`.

**81. (TRAP)** **Bebas** diisi owner (textarea bebas: A1, 01, Meja 7, ...). Format
`A1–A9/B1–B3` hanyalah **contoh default**, tidak di-hardcode. Komentar
`QRCodeMeja.tsx:47` ("Label meja bebas owner") dan placeholder textarea `:177`.

**82.** `qr_type` hanya `in:qr,logo,frame`. `OutletTableController.php:65` (juga `:111`).

**83.** **Dilewati (skipped)**, bukan gagal total — `$skipped++` + `continue`, dan laporkan
jumlah skipped/errors. `OutletTableController.php:181-198`.

**84.** `resolveOutlet(int $outletId, int $tenantId)` → `where('id',$outletId)->where('tenant_id',$tenantId)`.
`OutletTableController.php:238-244` (dipakai di store/update/destroy/bulk).

**85.** `/api/guest/daily-pin?slug=...`. `CustomerView.tsx:175`.

**86. (TRAP)** **SALAH.** Satu global API key **TIDAK** mengisolasi tenant. Bukti:
`GoogleBusinessProfileService::keyForTenant()` membaca key **per-tenant** dari `TenantSetting`
dengan fallback ke config global (`lines 357-368`), dan cache key menyertakan
`tenant_id`+`outlet_id` (`line 209`). Isolasi multi-tenant butuh per-tenant key + billing
+ queue + throttle terpisah.

---

## BAGIAN 5 — Google Reviews (87–100)

**87.** Langsung mengembalikan Place ID yang cocok: `preg_match('/ChIJ[A-Za-z0-9_\-]+/', $input, $m)` → `return $m[0]`.
`PlaceIdResolver.php:37-40`.

**88.** Mengekstrak `@lat,lng` atau `!3d lat !4d lng`, lalu memanggil `reverseGeocode($lat,$lng)`.
`PlaceIdResolver.php:42-54`.

**89.** `reverseGeocode()` memanggil **Geocoding API** via
`config('google-business-profile.geocode_api_base')` dengan key `config('google-business-profile.places_api_key')`.
`PlaceIdResolver.php:61-68`.

**90.** Mengembalikan `'ChIJmVwPLWhdaC4RzzPOd0s88Qk'`. `PlaceIdResolver.php:33`.

**91.** `source = $placeId ? 'places' : 'local'`. Bila outlet punya `google_place_id` → `'places'`
(`GoogleReviewController.php:39-40, 57-65`); bila tidak → `'local'` (`lines 89-98`).

**92.** `'source' => 'places'` di-set dalam `updateOrCreate` atribut review.
`GoogleBusinessProfileService.php:288`.

**93. (TRAP)** **Places API** (Place Details by Place ID) — BUKAN Business Profile OAuth.
`fetchReviewsFromPlaceId` memanggil `places_api_base` + `key` (`GoogleBusinessProfileService.php:255-272`).
(OAuth GBP memang ada di `GoogleBusinessProfileService`, tapi alur tampilan review publik
mengandalkan Place ID + Places API.)

**94.** Menerima `'google_place_link'` (wajib), lalu `(new PlaceIdResolver)->resolve(...)` untuk
mendapatkan Place ID, dan menyimpannya ke `outlet.google_place_id`. `GoogleReviewController.php:105-131`.

**95.** Fallback: `config(['ai.default' => 'gemini'])` lalu panggil ulang `RestokuAiAssistant::make()->prompt(...)`.
`GoogleReviewController.php:166-173`.

**96.** Ya — `if ($review->tenant_id !== auth()->user()->tenant_id) return 404`.
`generateAiReply` di `GoogleReviewController.php:143`; `reply` di `:198`.

**97.** Ya. `booted()` → `static::addGlobalScope(new TenantScope)`. `GoogleReview.php:23-32`.

**98.** `$cacheKey = "gbp_reviews_places_{$tenantId}_{$outletId}_{$placeId}"` — mencakup
tenant, outlet, DAN place. `GoogleBusinessProfileService.php:209`.

**99.** Ya. `keyForTenant()` membaca `$setting->{$field}` dari `TenantSetting` (where tenant_id),
dengan fallback ke `$globalFallback` (config global). `GoogleBusinessProfileService.php:357-368`.

**100. (TRAP)** **TIDAK bocor.** Cache key menyertakan **tenant_id DAN outlet_id**, sehingga dua tenant
yang kebetulan memakai Place ID sama mendapat cache terpisah. Komentar Q95 di
`GoogleBusinessProfileService.php:207-209`.
