# Lapisan 3 — Real Data untuk Stub (Restoku Owner Reporting)

> **For Hermes:** Execute task-by-task (no subagent — user delegated architecture to assistant). TDD where feasible.

**Goal:** Ganti 5 halaman stub Lapisan 2 menjadi data NYATA dari schema Restoku (order_type, stok menu, sesi kasir, absensi, jadwal shift) + perkuat Laporan Meja & Void yang sudah bisa di-query dari `orders`.

**Architecture:**
- Tambah 5 migration kecil: `orders.order_type`, `menu_items.stock` (+threshold), `cashier_sessions`, `attendances`, `shift_schedules`.
- Tambah model + relasi tenant-scoped.
- Update `OwnerDashboardService` method stub → query nyata.
- Update 7 FE page (LaporanShift, LaporanMeja, LaporanVoid, Kehadiran, JadwalShift, + dashboard widgets Tipe Transaksi & Alert Stok yang pakai stub).
- Biaya Operasional & Laba Rugi & Produk SUDAH nyata — tidak diubah (kecuali minor: Laba Rugi bisa kurangi expenses nyata).

**Tech Stack:** Laravel 13 (SQLite test / MySQL prod), Inertia/React/TS, Tailwind.

**Fakta kode terkonfirmasi (2026-07-14):**
- `orders` SUDAH punya: `table_number` (nullable), `void_reason` (nullable), `payment_status` enum `['unpaid','paid','refunded','void']`. **TIDAK punya `order_type`.**
- `menu_items` TIDAK punya `stock`.
- `order_items` ada (menu_item_id, qty, dll) → top products OK.
- `Order` status const: `STATUS_SELESAI='selesai'`, `STATUS_DIBATALKAN='dibatalkan'`.
- Void = `orders.payment_status='void'` (sudah ada, TIDAK perlu tabel baru).
- Meja revenue = aggregate `orders` by `table_number` (TIDAK perlu tabel baru).
- `Expense` model + `expenses` table SUDAH ada (L2).

---

## Task 1: Migration `orders.order_type`
**Objective:** Tambah kolom `order_type` (dine_in/take_away/delivery) ke `orders`.

**Files:**
- Create: `database/migrations/2026_07_14_200001_add_order_type_to_orders_table.php`

**Step:** Tulis migration:
```php
Schema::table('orders', function (Blueprint $table) {
    $table->enum('order_type', ['dine_in', 'take_away', 'delivery'])->default('dine_in')->after('source');
    $table->index(['tenant_id', 'order_type']);
});
```
down(): `$table->dropColumn('order_type');`

**Verify:** `php artisan migrate` → DONE. `php artisan test --filter Lapisan2` masih hijau.

---

## Task 2: Migration `menu_items.stock`
**Objective:** Tambah `stock` + `stock_threshold` ke menu_items untuk alert stok.

**Files:**
- Create: `database/migrations/2026_07_14_200002_add_stock_to_menu_items_table.php`

**Step:** Tulis migration:
```php
Schema::table('menu_items', function (Blueprint $table) {
    $table->integer('stock')->default(0)->after('price');
    $table->integer('stock_threshold')->default(10)->after('stock');
    $table->boolean('track_stock')->default(false)->after('stock_threshold');
});
```
down(): drop 3 kolom.

**Verify:** `php artisan migrate` → DONE.

---

## Task 3: Migration `cashier_sessions`
**Objective:** Tabel sesi kasir untuk Laporan Shift nyata.

**Files:**
- Create: `database/migrations/2026_07_14_200003_create_cashier_sessions_table.php`

**Step:**
```php
Schema::create('cashier_sessions', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('tenant_id');
    $table->unsignedBigInteger('outlet_id')->nullable();
    $table->unsignedBigInteger('user_id'); // kasir
    $table->timestamp('opened_at');
    $table->timestamp('closed_at')->nullable();
    $table->decimal('opening_balance', 14, 2)->default(0);
    $table->decimal('closing_balance', 14, 2)->nullable();
    $table->integer('transaction_count')->default(0);
    $table->decimal('total_sales', 14, 2)->default(0);
    $table->timestamps();
    $table->index(['tenant_id', 'opened_at']);
});
```
down(): dropIfExists.

**Verify:** `php artisan migrate` → DONE.

---

## Task 4: Migration `attendances` + `shift_schedules`
**Objective:** Dua tabel untuk Kehadiran & Jadwal Shift nyata.

**Files:**
- Create: `database/migrations/2026_07_14_200004_create_attendances_table.php`
- Create: `database/migrations/2026_07_14_200005_create_shift_schedules_table.php`

**Step attendances:**
```php
Schema::create('attendances', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('tenant_id');
    $table->unsignedBigInteger('user_id');
    $table->date('attendance_date');
    $table->enum('status', ['present', 'late', 'absent', 'leave'])->default('present');
    $table->time('check_in')->nullable();
    $table->time('check_out')->nullable();
    $table->timestamps();
    $table->unique(['tenant_id', 'user_id', 'attendance_date']);
});
```
**Step shift_schedules:**
```php
Schema::create('shift_schedules', function (Blueprint $table) {
    $table->id();
    $table->unsignedBigInteger('tenant_id');
    $table->unsignedBigInteger('user_id');
    $table->tinyInteger('day_of_week'); // 0=Sen .. 6=Min
    $table->time('shift_start');
    $table->time('shift_end');
    $table->timestamps();
    $table->index(['tenant_id', 'day_of_week']);
});
```
down(): dropIfExists kedua.

**Verify:** `php artisan migrate` → DONE.

---

## Task 5: Model + relasi
**Objective:** Buat model `CashierSession`, `Attendance`, `ShiftSchedule` + accessor `is_low_stock` di `MenuItem`.

**Files:**
- Create: `app/Models/CashierSession.php`
- Create: `app/Models/Attendance.php`
- Create: `app/Models/ShiftSchedule.php`
- Modify: `app/Models/MenuItem.php` (tambah `stock` ke fillable/casts + accessor `is_low_stock`)

**Step MenuItem:**
```php
protected $fillable = [..., 'stock', 'stock_threshold', 'track_stock']; // $guarded=['id'] jadi cukup cast
protected $casts = [..., 'stock' => 'integer', 'stock_threshold' => 'integer', 'track_stock' => 'boolean'];

public function getIsLowStockAttribute(): bool
{
    return $this->track_stock && $this->stock <= $this->stock_threshold;
}
```
Model lain: `$fillable` standar + `tenant_id`.

**Verify:** `php artisan test` tidak naik fail (model baru).

---

## Task 6: Service query nyata (ganti stub)
**Objective:** Update `OwnerDashboardService` method stub → query nyata dari schema.

**Files:**
- Modify: `app/Services/OwnerDashboardService.php`

**Step (method yang diubah):**
- `getTransactionTypes()` → query `orders` group by `order_type` (count). Hapus stub.
- `getStockAlerts()` → query `menu_items` where `track_stock` & `stock <= threshold`. Hapus stub.
- `getShiftPerformance()` → query `cashier_sessions` by tenant. Hapus stub.
- `getPeakHours/getPeakDays/getTopProducts` → sudah nyata, biarkan.
- `laporanMeja` controller → query `orders` group by `table_number` sum total where selesai. (ubah di controller)
- `laporanVoid` controller → query `orders` where `payment_status='void'` select item via order_items + void_reason. (ubah di controller)
- `kehadiran` controller → query `attendances` aggregate per user. (ubah di controller)
- `jadwalShift` controller → query `shift_schedules` per user per day. (ubah di controller)

**Verify:** Tulis test unit service `OwnerDashboardServiceTest` untuk `getTransactionTypes`, `getStockAlerts`, `getShiftPerformance` dengan seed data → assert tidak stub.

---

## Task 7: Controller ganti stub → query
**Objective:** Update `OwnerDashboardController` 5 method (laporanMeja, laporanVoid, laporanShift, kehadiran, jadwalShift) ke query nyata.

**Files:**
- Modify: `app/Http/Controllers/OwnerDashboardController.php`

**Step:** Ganti array stub dengan:
- `laporanMeja`: `Order::byTenant($tid)->where('status', selesai)->selectRaw('table_number, count(*) orders, sum(total) revenue')->groupBy('table_number')->get()`
- `laporanVoid`: `Order::byTenant($tid)->where('payment_status','void')->with('items')->get()` (map ke item name + void_reason + kasir)
- `laporanShift`: `CashierSession::where('tenant_id',$tid)->orderByDesc('opened_at')->get()`
- `kehadiran`: `Attendance::where('tenant_id',$tid)->with('user')->get()` aggregate
- `jadwalShift`: `ShiftSchedule::where('tenant_id',$tid)->with('user')->get()` pivot per day

**Verify:** `php artisan test --filter Lapisan2RoutesTest` → masih 200 (sekarang data nyata, bukan stub flag).

---

## Task 8: FE pages ganti stub → props nyata
**Objective:** Update 5 FE page untuk render props dari controller (bukan hardcode stub).

**Files:**
- Modify: `resources/js/Pages/LaporanShift/Index.tsx` (props `shifts` dari CashierSession)
- Modify: `resources/js/Pages/LaporanMeja/Index.tsx` (props `tables` dari orders)
- Modify: `resources/js/Pages/LaporanVoid/Index.tsx` (props `voids` dari orders)
- Modify: `resources/js/Pages/Owner/Kehadiran.tsx` (props `attendance` dari attendances)
- Modify: `resources/js/Pages/Owner/JadwalShift.tsx` (props `schedule` dari shift_schedules)
- Modify: `resources/js/Pages/Dashboard/OwnerDashboard.tsx` (widget Tipe Transaksi & Alert Stok sudah pakai props `transactionTypes`/`stockAlerts` — pastikan controller index pass data nyata, hapus flag stub di UI)

**Step:** Ganti struktur props interface kebentuk nyata (cashier_session punya opened_at/closed_at/transactions; void punya item/reason/cashier/amount; dst). Hapus badge "Data stub" / `is_stub` prop.

**Verify:** `npm run build` GREEN. `npx vitest run` tidak naik fail.

---

## Task 9: Seeder untuk dev (opsional tapi disarankan)
**Objective:** Isi data contoh supaya owner bisa lihat L3 berisi (bukan kosong).

**Files:**
- Modify: `database/seeders/DatabaseSeeder.php` (panggil seeder baru) atau buat `Lapisan3Seeder.php`

**Step:** Seed `cashier_sessions` (2 baris), `attendances` (beberapa user x hari), `shift_schedules` (2 user x 7 hari), `menu_items.stock` (update sebagian jadi rendah), `orders.order_type` (random per order).

**Verify:** `php artisan db:seed` sukses.

---

## Task 10: Final verification + commit
**Verify:**
```bash
php artisan migrate --force
php artisan db:seed
npm run build
php artisan test --filter "Lapisan2RoutesTest|OwnerDashboard"
npx vitest run
```
Expected: build GREEN, PHPUnit L2 + Dashboard hijau, Vitest 229/4 (baseline).
Commit: `git commit -m "feat(l3): real data untuk 5 halaman stub — order_type, stok menu, cashier_sessions, attendances, shift_schedules; void & meja dari orders nyata"`

---

## Risiko / Catatan
- **Cross-tenant:** semua query pakai `byTenant($tenantId)` atau `where('tenant_id', $tid)` — wajib (aturan 0 cross-tenant leak).
- **SQLite vs MySQL:** hindari `HOUR()` / `GROUP_CONCAT` MySQL-specific (sudah terbukti fail di test). Pakai collection post-filter atau `selectRaw` sederhana yang kompatibel.
- **Void:** memakai `payment_status='void'` yang SUDAH ada — jangan buat tabel `voids` baru.
- **Meja:** aggregate dari `orders.table_number` — jangan buat tabel baru.
- **Backward-compat:** `order_type` default `dine_in` supaya order lama tetap valid.
- **FE:** hapus semua `is_stub` flag & badge "Data stub" di L3.

## Open Questions (default yang akan diambil kalau user diam)
- Q: Apakah seeder L3 dijalankan otomatis di `DatabaseSeeder`? **Default: YA** (biar owner lihat data).
- Q: Apakah `track_stock` default false (stok opt-in)? **Default: YA** (biar tidak false-alarm alert).
