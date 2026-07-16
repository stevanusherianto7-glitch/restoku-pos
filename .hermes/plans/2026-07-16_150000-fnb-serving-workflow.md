# Workflow Penyajian F&B — 1 Order Utuh, 2 Aksi Saji per Kategori

> **For Hermes:** Plan-only. Eksekusi setelah user acc.

**Goal:** Tamu pesan 1 keranjang (makanan+minuman) = **1 order utuh**. Di layar Waiter/Bar, 1 kartu order menampilkan **2 aksi saji terpisah**: [SUDAH SAJIKAN MINUMAN] (di atas, amber pulse — disajikan duluan) dan [SUDAH SAJIKAN MAKANAN] (di bawah). Bill baru masuk kasir setelah **kedua bagian sudah disajikan**. CustomerView menampilkan 2 progress mini (Makanan/Minuman) dalam 1 kartu.

**Architecture:** Pertahankan 1 row `orders` (order-level, state machine `Order.php` tetap). Tambah tracking "bagian yang sudah disajikan" via **2 kolom timestamp** `food_served_at` & `drink_served_at` (nullable). Endpoint `serve-part` mengisi timestamp lalu, bila semua bagian relevan sudah disajikan, transisi `siap_sajikan → siap_bayar`. **Tidak ada split order, tidak ada perubahan KDS/Bar stream** (masih order-level).

---

## Alur End-to-End

```
[Tamu] QR → CustomerView (e-Menu)
   │ pilih makanan + minuman → "Pesan" (1 keranjang)
   ▼
[submitOrder] → 1 Order (destination = kds bila ada food, bar bila murni drink)
   │ items: [{makanan}, {minuman}]  (OrderItem.menu_item_id → category.type)
   ▼
[KDS]  order: antrian → dimasak → siap_sajikan
[Bar]  (bila murni drink) order: antrian → siap_sajikan
   │
   ▼
[WaiterBar] 1 kartu per order (siap_sajikan):
   ┌─ 🥤 [SUDAH SAJIKAN MINUMAN]   (ATAS, amber pulse)  → serve-part drink
   └─ 🍳 [SUDAH SAJIKAN MAKANAN]   (BAWAH)              → serve-part food
   setelah KEDUA terisi → order → siap_bayar (otomatis di backend)
   │
   ▼
[MonitorPesanan/Kasir] poll /api/orders/payment-queue → 1 baris per order
   ┌─ Bill Meja X (makanan+minuman, total) → [BAYAR]
   ▼
[Cashier] clearCashierQueueItem(order_code) → siap_bayar → selesai
   │
   ▼
[CustomerView] kartu: 2 progress mini Makanan+Minuman → step "Disajikan" hijau ✓
```

---

## Keputusan Desain (logika F&B)

- **1 meja = 1 order = 1 bill.** Tidak ada pemisahan transaksi.
- **Minuman disajikan duluan:** tombol minuman selalu di-render DI ATAS + `animate-pulse`; tombol makanan di bawah. Urutan visual dienforce, tapi tombol tidak saling mengunci (waiter fleksibel).
- **Transisi ke kasir:** order pindah `siap_sajikan → siap_bayar` **HANYA** bila semua bagian yang ada sudah disajikan:
  - order only-food → begitu `food_served_at` terisi.
  - order only-drink → begitu `drink_served_at` terisi.
  - order campur → setelah `food_served_at` DAN `drink_served_at` terisi.
- **Backward-compat:** order lama tanpa `food/drink_served_at` kolom → migrasi tambah nullable; order single-type tetap 1 tombol efektif (tombol tipe lain tidak tampil bila order tidak punya item tipe itu).

---

## Task List

### Task 1: Migrasi `food_served_at` + `drink_served_at`
**Files:** Create `database/migrations/2026_07_16_150000_add_served_parts_to_orders.php`
```php
Schema::table('orders', function (Blueprint $t) {
    $t->timestamp('food_served_at')->nullable()->after('destination');
    $t->timestamp('drink_served_at')->nullable()->after('food_served_at');
});
```
**Verify:** `php artisan migrate` exit 0.

### Task 2: Helper deteksi tipe item di Order
**Objective:** Tahu order punya item food/drink.
**Files:** Modify `app/Models/Order.php` — tambah:
```php
public function hasFood(): bool {
    return $this->items->contains(fn($i) => ($i->menuItem?->category?->type ?? 'food') === MenuCategory::TYPE_FOOD);
}
public function hasDrink(): bool {
    return $this->items->contains(fn($i) => ($i->menuItem?->category?->type ?? 'food') === MenuCategory::TYPE_BEVERAGE);
}
public function allServed(): bool {
    if ($this->hasFood() && !$this->food_served_at) return false;
    if ($this->hasDrink() && !$this->drink_served_at) return false;
    return true;
}
```
**Test:** `tests/Unit/OrderServedPartsTest.php` — assert hasFood/hasDrink/allServed.

### Task 3: Endpoint `serve-part`
**Objective:** Waiter tandai 1 bagian sudah disajikan; auto-transition bila lengkap.
**Files:** Modify `app/Http/Controllers/KdsController.php` — add `servePart(Request $request, $id)`:
- validate `part` in: food, drink.
- `$order->items->load('menuItem.category')` (pastikan eager).
- set `food_served_at`/`drink_served_at = now()`.
- bila `allServed()` && `canTransitionTo(siap_bayar)` → `transitionTo(siap_bayar)`.
- return `{success, food_served_at, drink_served_at, status}`.
- Route `PUT /api/orders/{id}/serve-part` (web.php ~line 224).
**Test:** `tests/Feature/ServePartTest.php`:
  - campur: serve drink → status tetap siap_sajikan; serve food → status siap_bayar.
  - only-food: serve food → siap_bayar.
**Verify:** `php artisan test --filter ServePartTest` PASS.

### Task 4: CustomerView — 2 progress mini per kartu
**Objective:** Tamu lihat progres makanan & minuman terpisah.
**Files:** Modify `resources/js/Pages/BukuMenuDigital/CustomerView.tsx` (orders map ~1557-1614):
- Untuk tiap order, bagi items by `type` (butuh `type` di payload status — lihat Task 5).
- Render 2 mini-tracker: 🥤 Minuman (step dari drink_served_at) + 🍳 Makanan (step dari food_served_at). Bila order single-type, hanya 1 yang tampil.
- Step mapping: belum saji = 3 (Siap), sudah saji = 4 (Disajikan).
**Test:** `customerView.test.tsx` — assert 2 sub-progress saat order punya food+drink.

### Task 5: Payload status sertakan part info
**Objective:** FE tahu mana yang sudah disajikan.
**Files:** Modify `PublicOrderController::getOrderStatus` (line 206-236) return tambahan:
```php
'food_served_at' => $order->food_served_at,
'drink_served_at' => $order->drink_served_at,
'has_food' => $order->hasFood(),
'has_drink' => $order->hasDrink(),
```
Plus `KdsController::buildKdsGroups` & `paymentQueue` sertakan `food_served_at`, `drink_served_at`, `has_food`, `has_drink` di tiap item list (untuk WaiterBar render 2 tombol kondisional).
**Test:** `KdsControllerTest` assert json punya field baru.

### Task 6: WaiterBar — 1 kartu, 2 tombol
**Objective:** Tampil 2 aksi saji dalam 1 kartu order.
**Files:** Modify `resources/js/Pages/WaiterBar/Index.tsx`:
- `fetchOrders`: fetch `/api/orders`+`/api/bar/orders`, flat, filter `siap_sajikan` (sudah ada).
- Render kartu: 
  - bila `has_drink` → tombol 🥤 SUDAH SAJIKAN MINUMAN (ATAS, pulse), disabled bila `drink_served_at` sudah ada.
  - bila `has_food` → tombol 🍳 SUDAH SAJIKAN MAKANAN (BAWAH), disabled bila `food_served_at` sudah ada.
  - klik → `PUT /api/orders/{id}/serve-part {part}`.
**Test:** `waiterBar.test.tsx` — mock 1 order campur siap_sajikan → assert 2 tombol, minuman di atas, klik drink → serve-part drink.

### Task 7: MonitorPesanan — already correct
**Files:** `MonitorPesanan/Index.tsx` (sudah di-fix ke payment-queue Task sebelumnya). Verifikasi masih 1 baris per order. Tidak ada perubahan unless aggregasi diperlukan (1 order = 1 bill, sudah benar).
**Verify:** `npx vitest run monitorPesanan` PASS.

### Task 8: Build + full test
**Verify:** `npm run build` exit 0; `npx vitest run` all pass; `php artisan test` all pass.

### Task 9: Commit
```bash
git add -A
git commit -m "feat(fnb): 1-order + 2 aksi saji per kategori (minuman duluan), bill kasir setelah lengkap"
```

---

## Risks / Trade-offs
- **OrderItem tidak simpan `type`** → butuh `menuItem.category.type` (eager load). Aman asal relasi ada.
- **Tidak ubah state machine** → transisi `siap_sajikan→siap_bayar` tetap valid (`Order.php:52-53`). `serve-part` hanya menambah guard "hanya bila allServed".
- **Alternative DITOLAK:** split order (rancangan sebelumnya) — user sudah pilih 1 order utuh.

## Open Questions (non-blocker)
- Apakah kasir boleh "BAYAR" meski waiter belum tandai saji (mis. tamu minta bill cepat)? Default: tidak (allServed wajib). Bisa dibuat override bila perlu.
