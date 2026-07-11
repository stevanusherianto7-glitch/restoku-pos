# Plan: Global-Unique Outlet Slug (celewatan QR lintas tenant)

**Tanggal:** 2026-07-10
**Penulis:** Hermes (Principal SWE / SaaS Security Architect)
**Status:** DRAFT — menunggu konfirmasi user sebelum eksekusi
**Prioritas:** P0 (blocker sebelum tenant ke-2 daftar; bukan nunggu 5000)

---

## 1. Konteks & Masalah (hasil audit, bukan asumsi)

QR Code Meja **diproduksi di sisi dashboard owner** (Buku Menu Digital e-Menu +
QR Code Meja, role owner/manager), sesuai keputusan user. Tiap tenant dengan N
cabang outlet memproduksi QR per-outlet/per-meja sendiri. URL di balik QR:

```
/m/{slug}?t={label_meja}   →   encode oleh buildMenuUrl(origin, outlet.slug, meja)
```

### 1.1 Bug A — Collision lintas tenant (parah di skala 5000 tenant)
- Migration `2026_07_09_000001_add_slug_to_outlets_table.php:21`:
  `$table->unique(['tenant_id', 'slug'])` → **slug unik PER-TENANT**.
- Tapi route publik tamu **GLOBAL**: `web.php:38` `Route::get('/m/{slug}', ...)`
  dan `web.php:40` `GET /api/menu/{slug}`.
- Lookup `OrderController::getPublicMenu()` line 36:
  `$outlet = Outlet::where('slug', $slug)->first();` → ambil **outlet PERTAMA**
  yang match slug di SELURUH DB (saat scope nonaktif di local).
- Akibat: Tenant A "Kedai Nusantara" → `kedai-nusantara`, Tenant B "Kedai Nusantara"
  → `kedai-nusantara` (LEGAL per-tenant). Tamu scan QR Tenant B → menu **Tenant A**
  (cross-tenant data leak + QR rusak). Di 5000 tenant dengan nama outlet umum
  ("Warung Kopi", "Sate Pak Kumis", "Outlet Utama") → **hampir pasti terjadi**.

### 1.2 Bug B — 500 di PRODUCTION untuk semua tamu (P0 blocker)
- `getPublicMenu` line 36 **TIDAK** pakai `withoutGlobalScope(TenantScope::class)`.
- Route `/api/menu/{slug}` ada di **Public routes** (`web.php:13-49`), TIDAK masuk
  grup `['auth','tenant']` → `EnsureTenantContext` TIDAK jalan → `tenant.id`
  tidak ter-bound.
- `TenantScope::apply()` line 40-42: kalau `app()->environment('production')` dan
  `tenant.id` tidak bound → `abort(500)`. Maka **DI PRODUCTION, semua tamu dapat
  500** saat buka e-menu. Buku menu tamu MATI total.
- Kontras: `submitOrder` (line 134) SUDAH benar pakai `withoutGlobalScope` +
  bind manual (BUG-006). Inkonsisten.

### 1.3 Bug C — Titik collision kedua: jam operasional
- `getOutletOperatingHours()` line 512-514:
  `Outlet::withoutGlobalScope(TenantScope::class)->where('slug',$outletParam)->orWhere('id',...)->first()`
  → query GLOBAL tanpa guard tenant. Tamu outlet Tenant B bisa dapat jam operasional
  Tenant A.

### 1.4 Sumber collision otomatis
- `Tenant::created` (Tenant.php:32-39): auto-buat "Outlet Utama" →
  `setNameAttribute` isi slug dari brand_name. Di 5000 tenant dgn brand sama →
  collision massal pada outlet default.

---

## 2. Solusi (disetujui arahan user: QR dari dashboard owner, per-tenant)

Jadikan **`slug` global-unique** agar `/m/{slug}` unambiguous. Dua lapis:

### Lapisan 1 — Constraint DB: `unique('slug')` (global)
Ganti `unique(['tenant_id','slug'])` → `unique('slug')`.

### Lapisan 2 — Generator slug collision-free
Saat slug dibuat (model `setNameAttribute` + auto-outlet Tenant::created + backfill
existing), cegah dup global dengan suffix deterministik:
- Coba `base = Str::slug(name)`.
- Jika `Outlet::where('slug', base)->exists()` → `base . '-' . $tenantId` (tenant id
  unik globally → guarantee unik). Fallback `base . '-' . Str::random(4)` kalau tetap
  bentrok (sangat jarang).

### Lapisan 3 — Lookup tamu tanpa TenantScope + guard 404
- `getPublicMenu` line 36 → tambah `withoutGlobalScope(TenantScope::class)`.
- `getOutletOperatingHours` line 512 → sudah `withoutGlobalScope`, tapi TAMBAH guard:
  kalau ketemu tapi slug bukan milik outlet yang dimaksud, tetap aman karena slug
  sudah global-unik (first() unambiguous). Cukup pastikan tidak `orWhere('id',...)`
  menimpa slug match (lihat risiko 4.2).

---

## 3. Rencana Eksekusi (urutan aman)

### Step 1 — Migration baru (JANGAN drop constraint lama sembarangan)
File: `database/migrations/2026_07_10_000001_make_outlet_slug_globally_unique.php`
```php
public function up(): void {
    Schema::table('outlets', function (Blueprint $t) {
        $t->dropUnique(['tenant_id','slug']);   // hapus per-tenant
        $t->unique('slug');                      // global unique
    });
}
public function down(): void {
    Schema::table('outlets', function (Blueprint $t) {
        $t->dropUnique(['slug']);
        $t->unique(['tenant_id','slug']);
    });
}
```
Catatan: migration lama (`..._add_slug_to_outlets_table`) punya `down()` yang
`dropColumn('slug')` — jangan jalankan `migrate:rollback` ke bawahnya tanpa care.

### Step 2 — Helper slug global (service/function)
File baru: `app/Services/OutletSlug.php`
```php
public static function unique(string $name, int $tenantId): string {
    $base = Str::slug($name) ?: 'outlet';
    if (! Outlet::withoutGlobalScope(TenantScope::class)->where('slug',$base)->exists())
        return $base;
    $candidate = $base.'-'.$tenantId;
    if (! Outlet::withoutGlobalScope(TenantScope::class)->where('slug',$candidate)->exists())
        return $candidate;
    return $base.'-'.Str::random(6);
}
```

### Step 3 — Pakai helper di 3 titik pembuatan slug
- `Outlet::setNameAttribute` (Outlet.php:61-67): ganti
  `$this->attributes['slug'] = Str::slug($value) ?: 'outlet';`
  → `$this->attributes['slug'] = OutletSlug::unique($value, $this->tenant_id ?? 0);`
  (perlu akses tenant_id; kalau null, fallback random).
- `Tenant::created` (Tenant.php:34-37): saat `outlets()->create([...])`, isi
  `'slug' => OutletSlug::unique($nama, $tenant->id)` eksplisit (jangan andalkan
  setNameAttribute yang mungkin belum punya tenant_id ter-bound).
- Backfill data existing (kalau ada): script `artisan` satu kali, iterasi semua
  outlet, re-slug yang bentrok.

### Step 4 — Patch lookup tamu (Bug B & C)
- `OrderController::getPublicMenu` line 36:
  `$outlet = Outlet::withoutGlobalScope(TenantScope::class)->where('slug',$slug)->first();`
- `getOutletOperatingHours` line 512-514: ubah urutan → cari by slug DULU
  (global-unique sudah guarantee), baru by id HANYA kalau slug kosong:
  ```php
  $outlet = Outlet::withoutGlobalScope(TenantScope::class)
      ->when($outletParam !== '', fn($q) => $q->where('slug',$outletParam))
      ->when($outletParam === '' && is_numeric($outletParam), fn($q)=>$q->where('id',(int)$outletParam))
      ->first();
  ```
  (Hapus `orWhere` agar slug tidak bisa ditimpa oleh id orang lain.)

### Step 5 — Guard 404 eksplisit (sudah ada di getPublicMenu line 37-39; pastikan
getOutletOperatingHours return default HANYA kalau benar tidak ketemu, bukan
karena collision).

---

## 4. Risiko & Mitigasi

### 4.1 QR yang SUDAH tercetak
- Sebelum fix: belum ada tenant produksi (masih dev). Jadi belum ada QR fisik
  tercetak yang rusak. Aman dilakukan SEKARANG.
- Sesudah fix: slug global-unik stabil. QR per-outlet/per-meja dari dashboard owner
  tetap valid selama slug tidak diubah. (Catatan: fitur "edit slug" belum ada, jadi
  slug immutable de facto — aman.)

### 4.2 Jangan pecah `orWhere('id')` di operating-hours
- `orWhere('id',...)` saat ini bisa membuat tamu passing `outlet=123` (id outlet
  tenant lain) dapat jam operasional tenant lain. Setelah fix, batasi by id HANYA
  sebagai fallback internal (bukan dari user input sembarangan). Mitigasi di Step 4.

### 4.3 Migration di environment produksi
- `dropUnique` + `unique` butuh lock table. Di 500k outlet tetap cepat (index op).
- Jalankan saat low-traffic. Test di staging dulu.

### 4.4 `setNameAttribute` akses tenant_id
- Saat model baru dibuat lewat `outlets()->create()`, `tenant_id` sudah terisi
  (relasi). Tapi `setNameAttribute` jalan SEBELUM save — `tenant_id` mungkin belum
  di-attributes. Mitigasi: isi slug eksplisit di `Tenant::created` (Step 3), dan di
  `setNameAttribute` pakai `($this->tenant_id ?? 0)` + fallback random.

---

## 5. Verifikasi (wajib, sesuai standar user: REAL evidence)

### 5.1 PHPUnit (backend)
- Test baru `tests/Feature/OutletSlugUniqueTest.php`:
  - 2 tenant, masing-masing outlet "Kedai Nusantara" → slug BEDA (tenantId suffix).
  - `getPublicMenu` by slug Tenant A tidak kembalikan outlet Tenant B.
  - `getOutletOperatingHours` by slug Tenant A tidak kembalikan jam Tenant B.
- Jalankan: `php artisan test --filter=OutletSlug`
- Pastikan backend existing tetap hijau: `php artisan test` (90 passed baseline).

### 5.2 Frontend (vitest)
- Tidak ada perubahan komponen; pastikan `npm run build` + `npx vitest run` tetap
  43 passed (regresi check).

### 5.3 Manual (staging, butuh login owner)
- Buka Buku Menu Digital → generator QR → scan hasil → buka `/m/{slug}` →
  pastikan menu cocok outlet yang dipilih (bukan tenant lain).
- Cetak 2 tenant dgn outlet nama sama → 2 URL beda.

---

## 6. Out of Scope (tidak dikerjakan di plan ini)
- Perubahan skema ke schema-per-tenant (Fase 2 PRD) — terpisah.
- Fitur edit/rename slug outlet (belum ada; kalau nanti ada, harus re-generate QR).
- Bulk PDF export QR (belum diminta).
- CustomerView rendering (sudah benar; cuma lookup di belakangnya yang di-fix).

---

## 7. Checklist Commit (per commit kecil, mudah review)
- [ ] Migration global-unique + down()
- [ ] `OutletSlug` helper
- [ ] Patch `setNameAttribute` + `Tenant::created` pakai helper
- [ ] Patch `getPublicMenu` (withoutGlobalScope)
- [ ] Patch `getOutletOperatingHours` (hapus orWhere id leak)
- [ ] Test PHPUnit + jalankan full suite
- [ ] Build + vitest frontend
- [ ] Verifikasi manual staging

---

## 8. Ringkasan untuk User
QR Code Meja **sudah benar dibuat di dashboard owner** (Buku Menu Digital + QR Code
Meja), per keputusan Anda. Masalahnya BUKAN di mana QR dibuat, tapi **URL di balik
QR** (`/m/{slug}`) bisa bentrok antar tenant karena slug cuma unik per-tenant padahal
route-nya global. Plan ini membuat slug **global-uniqu**e + meluruskan lookup tamu
supaya tiap tenant (dan tiap cabang/outlet mereka) punya QR yang benar-benar
mengarah ke menu sendiri — aman sampai 5000 tenant. Plus memperbaiki bug 500 di
production untuk semua tamu.
