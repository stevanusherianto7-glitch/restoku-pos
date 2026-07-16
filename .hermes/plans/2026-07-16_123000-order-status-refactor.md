# Refactor Status Pesanan — CustomerView (gaya Kedai Elvera) + Routing Dapur/Bar + Antrean Kasir

> **For Hermes:** Gunakan skill `subagent-driven-development` untuk eksekusi task-by-task (arsitektur dipegang asisten).

**Goal:** Redesain layar status pesanan tamu (CustomerView) mengikuti gaya Kedai Elvera (4-step tracker per order), lalu routing order-level: ada makanan → KDS, murni minuman → Bar/Waiter; saat waiter menyajikan ke meja (status `siap_bayar`), order masuk antrean pembayaran di Monitor Kasir.

**Architecture:**
- Order punya kolom `destination` (`kds`|`bar`) dihitung saat submit: jika ada item kategori `food` → `kds`, jika semua item `beverage` → `bar`.
- `MenuCategory` dapat kolom `type` (`food`|`beverage`); `MenuItem` warisi via relasi kategori.
- KDS (`/kds`) hanya tampilkan `destination=kds` + status persiapan. Bar (`/waiter-bar`) tampilkan `destination=bar` + status persiapan. Monitor Kasir (`/monitor-pesanan`) tampilkan `siap_bayar` (sudah disajikan).
- Pemetaan 4-step tracker CustomerView → status DB: KONFIRMASI=`antrian_masuk`, DIMASAK=`sedang_dimasak`, SIAP=`siap_sajikan`, DISAJIKAN=`siap_bayar`. (Catatan: `siap_bayar` = sudah disajikan & menunggu bayar = masuk kasir. `selesai` = lunas.)

**Tech Stack:** Laravel 13 (PHP), Inertia/React/TS (Vite), SQLite (dev). Status constants di `app/Models/Order.php` (sudah ada state machine `TRANSITIONS`).

---

## Task 1: Migration — `menu_categories.type`
**Objective:** Tandai kategori sebagai makanan vs minuman.
- Create: `database/migrations/2026_07_16_000001_add_type_to_menu_categories.php`
- Modify: `app/Models/MenuCategory.php` (tambah `$fillable`/`$casts`)
**Step:** migration `up()`:
```php
Schema::table('menu_categories', function (Blueprint $t) {
    $t->string('type')->default('food'); // 'food' | 'beverage'
});
```
MenuCategory tambah: `protected $fillable = ['name','type','is_active','sort_order','tenant_id'];`

## Task 2: Migration — `orders.destination`
**Objective:** Simpan tujuan order (KDS/Bar).
- Create: `database/migrations/2026_07_16_000002_add_destination_to_orders.php`
```php
Schema::table('orders', function (Blueprint $t) {
    $t->string('destination')->default('kds'); // 'kds' | 'bar'
});
```
- Modify: `app/Models/Order.php` tambah konstanta `DEST_KDS='kds'`, `DEST_BAR='bar'` + `$fillable` sertakan `destination`.

## Task 3: Hitung destination saat submit order
**Objective:** PublicOrderController::submitOrder menentukan KDS vs Bar.
- Modify: `app/Http/Controllers/PublicOrderController.php` `submitOrder()` — setelah validasi items, query kategori item:
```php
$catTypes = MenuItem::withoutGlobalScope(TenantScope::class)
    ->whereIn('id', $menuItemIds)
    ->with('category:id,type')->get()
    ->map(fn($m)=> $m->category?->type ?? 'food');
$destination = $catTypes->contains('food') ? Order::DEST_KDS : Order::DEST_BAR;
$order->destination = $destination;
```
**Test:** `tests/Feature/PublicOrderControllerTest.php` tambah `test_submit_order_drink_only_routes_to_bar` & `test_submit_order_with_food_routes_to_kds`.

## Task 4: KDS filter by destination
**Objective:** `/kds` hanya tampilkan order `destination=kds`.
- Modify: `app/Http/Controllers/KdsController.php` `buildKdsGroups()` — tambahkan `->where('destination','kds')` di query (atau terima `?dest=`).
**Test:** `tests/Feature/KdsControllerTest.php` — order `bar` tidak muncul di stream KDS.

## Task 5: Endpoint Bar (WaiterBar)
**Objective:** Layar Bar menampilkan order `destination=bar` + status persiapan.
- Modify: `app/Http/Controllers/KdsController.php` tambah method `barOrders(Request $r)` (atau param `?dest=bar` di `stream`). Kembalikan grup sama seperti KDS tapi `where('destination','bar')`.
- Modify: `routes/web.php` tambah `Route::get('/api/bar/orders', [KdsController::class,'barOrders']);`
- Modify: `resources/js/Pages/WaiterBar/Index.tsx` fetch `/api/bar/orders` (bukan semua).

## Task 6: Redesain CustomerView status (gaya Kedai Elvera)
**Objective:** Card status per-order dengan 4-step tracker (KONFIRMASI·DIMASAK·SIAP·DISAJIKAN), header brand+meja+HALAL, order ID, durasi, item+harga, badge rute, tombol "Pesan Menu Lainnya".
- Modify: `resources/js/Pages/BukuMenuDigital/CustomerView.tsx`
  - Ganti modal "Menunggu Konfirmasi" (line ~1637) + card renderer (1545-1584) ke komponen `<OrderStatusCard>` baru (stepper 4 langkah, mapping status→step: antrian_masuk=1, sedang_dimasak=2, siap_sajikan=3, siap_bayar=4).
  - Poll `/api/orders/{id}` sudah ada (520-543) — pastikan `data.status` dipetakan ke step & `data.destination` untuk badge rute.
- Mockup referensi: `design-reference/order-status-mockup.html` (buka di browser).
**Test:** `tests/Feature` tidak wajib (UI); lakukan verifikasi browser (Playwright) di dua origin.

## Task 7: Monitor Kasir = antrean pembayaran (`siap_bayar`)
**Objective:** Saat waiter sajikan (status → `siap_bayar`), order muncul di layar kasir.
- Modify: `app/Http/Controllers/KdsController.php` `getKdsOrders()` — MonitorPesanan saat ini poll `/api/orders` (getKdsOrders) yang HANYA return 3 status persiapan. Tambah guard: jika `?queue=payment` → return order `status=siap_bayar` (semua destination).
- Modify: `resources/js/Pages/MonitorPesanan/Index.tsx` fetch `/api/orders?queue=payment` untuk tab antrean bayar.
**Test:** `tests/Feature/MonitorPesananTest.php` — order `siap_bayar` muncul di queue=payment.

## Task 8: Verifikasi end-to-end
- `php artisan test` (backend) — semua hijau.
- `npx vitest run` (FE) — 237+ passed.
- `npm run build` — exit 0.
- Browser (Playwright) dua origin: `localhost:8000/m/pawon-salam?t=A1` + tunnel — verifikasi: (a) submit order makanan → KDS; (b) minuman → Bar; (c) ubah status ke `siap_bayar` → muncul di Monitor Kasir.

---

## Risiko / Keputusan
- **Mapping DISAJIKAN = `siap_bayar`**: saya putuskan `siap_bayar` = sudah disajikan & menunggu bayar (masuk kasir). Jika Anda mau "disajikan" = status terpisah sebelum bayar, perlu tambah konstanta `STATUS_DISAJIKAN` di `Order.php` + adjust TRANSITIONS — beri tahu saya.
- **Seeder kategori**: pastikan seeder MenuCategory mengisi `type` (food/beverage) agar routing jalan. Cek `database/seeders`.
- **KDS/Bar sharing controller**: memakai `KdsController` untuk Bar demi DRY (param `dest`). Bisa juga pecah `BarController` jika Anda mau eksplisit.
