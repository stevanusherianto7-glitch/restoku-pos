# Plan Migrasi Skalabilitas — Restoku (5.000 tenant × ratusan outlet)

**Tujuan:** Restoku mampu menahan 5.000 tenant, masing-masing hingga ratusan outlet
(~500.000 outlet) tanpa degradasi, dengan tetap menjaga isolasi data & fitur yang sudah jalan.

**Konteks arsitektur saat ini (fakta dari kode):**
- Multi-tenancy = **shared-DB, shared-schema**. Satu MySQL, kolom `tenant_id` di tiap tabel.
- Isolasi via `app/Models/Scopes/TenantScope.php` + `app/Services/TenantContext.php` (singleton per request).
- Resolusi tenant publik (`/api/orders`, `/api/reservations`) → `Outlet::findOrFail($outlet_id)` → ambil `tenant_id`, **tanpa auth & tanpa cache** (OrderController `submitOrder`).
- `Outlet` **TIDAK punya kolom `slug`** & tidak di-index. Route `/m/senopati` di-hardcode di `routes/web.php:26`.
- Index sudah benar: `tenant_id` di orders/order_items/menu_items/reservations; composite `(tenant_id, outlet_id, created_at)` di orders; `(tenant_id, is_available)` di menu_items.
- DB driver: MySQL/MariaDB (default sqlite di env lokal).

**Keputusan platform (dari klarifikasi user):**
- Kasir = **web** ✅ (sudah ada)
- Owner = **web** (butuh "semuanya": dashboard/laporan) ✅
- Tamu = **web/PWA read-only** (`CustomerView`) ✅ — tamu HANYA lihat menu, jadi tidak butuh native Android.
- **Tidak ada repo native Android.** Semua web.

**Model QR Code Buku Menu (Keputusan):**
- **QR per-MEJA**: tiap meja punya QR berbeda (Meja A, B, ...). URL encode `outlet_slug` + `table`.
- **Owner self-serve**: Restoku hanya sediakan **QR generator** (tool di dashboard owner). Outlet yang tentukan setup (per-meja / per-outlet / jumlah stiker) sesuai kebutuhan mereka.
- **Generate-time, bukan runtime**: QR dibuat sekali (saat owner cetak stiker), lalu statis. Tamu scan → request ke web. Kita TIDAK generate QR tiap scan.
- **URL scheme**: `https://{base}/m/{outlet_slug}?t={table}` (atau `?t=` opsional jika owner mau 1 QR umum).
  - Contoh: `https://restoku.id/m/senopati?t=A07`
- **Skalabilitas QR**: beban ada di (a) generate stiker (jarang, owner-side) dan (b) request `/m/{slug}` (read-only, cacheable). Keduanya tidak ada di hot write path.

**Tenant Tanpa Outlet (Pemula / Belum Cabang):**
- Fakta: `outlets.tenant_id` NOT NULL; semua endpoint tamu wajib `outlet_id exists` (`OrderController` `findOrFail` → 404 kalau 0 outlet). Jadi tenant tanpa outlet = QR/menu tamu TIDAK bisa jalan.
- **Aturan wajib**: saat tenant dibuat (registrasi), **otomatis buat 1 outlet default** (nama = nama bisnis / "Outlet Utama", `slug` auto). Ini jaminan bahwa URL `/m/{slug}` SELALU punya target.
  - Migration/seed: `TenantCreated` listener → `Outlet::create([tenant_id, name:'Outlet Utama', slug: slugify(name)+rand])`.
- **QR generator graceful**: jika owner belum ubah nama/setup, tetap bisa generate QR dari outlet default. Tidak ada dead-end "belum ada outlet".
- **Multi-outlet**: owner tinggal tambah outlet di dashboard; tiap outlet dapat `slug` sendiri → QR terpisah per outlet.
- **Input "Jumlah Outlet Cabang" (bulk create)**: owner isi angka N di dashboard → sistem buat N outlet sekaligus.
  - Nama default: `Cabang 1`, `Cabang 2`, ... `Cabang N` (owner bisa rename nanti).
  - `slug` auto: `slugify(nama)+rand` (unik per tenant, lihat migrasi slug).
  - Tiap outlet langsung dapat halaman `/m/{slug}` + QR generator sendiri.
  - Validasi: `integer, min:1, max:500` (sesuai batas ratusan outlet per tenant).
  - Idempoten: tombol "Tambah N Cabang" menambah, bukan overwrite yang sudah ada (owner tetap punya kontrol manual per-outlet).
- **UI manajemen outlet**: tabel outlet (nama, slug, jumlah meja, aksi Cetak QR / Rename / Hapus). Input jumlah = shortcut bulk-add di atas tabel.
- **Menu tanpa item**: `CustomerView` harus render "Menu segera hadir" (bukan error) jika `menu_items` kosong — tamu tetap bisa lihat info outlet & QR pesan kosong.
- **Caching aman**: `menu:tenant:{tid}:outlet:{oid}` di-invalidate saat outlet/menu berubah; kalau 0 item, cache tetap valid (konten "segera hadir").

**Implementasi QR generator (Fase 0 tambahan):**
- [ ] `buildMenuUrl(base, slug, table?)` di `resources/js/lib/menuUrl.ts` → `{base}/m/{slug}?t={table}`.
- [ ] Endpoint `/owner/outlet/{id}/qr` (BARU, auth+tenant) → render halaman cetak: N stiker QR (pakai lib `qrcode`/`endroid/qr-code`), tiap QR = `buildMenuUrl(env('APP_URL'), outlet.slug, mejaKe-n)`.
- [ ] **Input label meja = BEBAS (variable owner)**: owner isi nama meja sendiri — `A1`, `01`, `Meja 7`, `VIP-2`, dsb.
  - UI: **textarea, 1 label per baris** (owner bisa paste daftar meja dari Excel) + field "tambah manual".
  - Validasi longgar: trim, max 20 char, unique per outlet (biarkan owner yang atur; tidak kita paksa format).
  - Tiap label → 1 stiker QR berisi `buildMenuUrl(base, slug, label)`.
- [ ] `orders.table_number` SUDAH `string` (nullable) → menampung label bebas tamu (sudah dipakai `submitOrder`). Tidak perlu migrasi kolom.
- [ ] **Tidak perlu tabel `tables`** di DB: QR generator murni tool owner-side; label hanya lewat URL `?t=` → tersimpan di `orders.table_number` saat tamu pesan. (Jika nanti butuh kapasitas stiker tersimpan, baru tambah `outlet_tables`.)
- [ ] `Outlet` butuh `slug` (lihat Fase 0 migrasi slug di bawah) sebagai basis URL.

**Contoh flow owner:**
1. Buka Dashboard Owner → Outlet → "Cetak QR Meja".
2. Isi textarea: `A1`, `A2`, `B1`, `01`, `VIP` (bebas, 1 per baris).
3. Klik "Generate" → halaman cetak N stiker, masing-masing QR = `https://restoku.id/m/senopati?t=A1` dst.
4. Owner cetak & tempel ke meja. Tamu scan → buka menu outlet, pesan otomatis ke `table_number = A1`.

---

## 1. Target State (Arsitektur Skala Besar)

```
                    ┌─────────────┐
   Tamu (QR scan) → │ Edge / CDN  │  menu JSON per-outlet (cache, read-only)
                    └──────┬──────┘
                           │ cache miss (jarang)
        ┌──────────────────┼───────────────────────┐
        │                  │                        │
   Kasir (web)        Owner (web)            Tamu API (/api/orders)
   write path         read-heavy             (write, terisolasi)
        │                  │                        │
   ┌────┴─────┐     ┌──────┴──────┐          ┌──────┴──────┐
   │ TenantDB │     │ Replica DB  │          │ TenantDB   │
   │ (per-    │     │ (analitik)  │          │ (per-      │
   │  tenant) │     └─────────────┘          │  tenant)   │
   └──────────┘                              └────────────┘
        ▲                  ▲                        ▲
        └──────── Tenant Router (resolusi DB per tenant) ┘
                  └─ metadata DB (tenant → kredensial DB)
```

**Pilar:**
1. **Database-per-tenant** (atau schema-per-tenant) — hilangkan write-contention di tabel `orders` panas.
2. **Cache agresif untuk path tamu** (read-only) — Redis + edge/CDN, karena tamu hanya baca.
3. **Read replica** untuk dashboard owner/analitik lintas outlet.
4. **Slug outlet + index** — enable `/m/{slug}` per-outlet yang scalable.
5. **Partisi/arsip** tabel `orders` — tabel panas tetap kecil.

---

## 2. Phasing (bertahap, tanpa break fitur)

### Fase 0 — Fondasi & Pengukuran (1–2 minggu)
- [ ] **Tambah `slug` ke `outlets`** + index unik per tenant.
  - Migration: `add_slug_to_outlets` → `$table->string('slug')->nullable()`; `unique(['tenant_id','slug'])` setelah backfill.
  - Backfill: script artisan isi slug dari nama outlet (slugify).
- [ ] **Cache resolusi tenant publik** (Redis): `outlet:{id} → {tenant_id, slug, is_active}` TTL 1 jam.
  - Di `OrderController::submitOrder` ganti `Outlet::findOrFail` → `Cache::remember(...)`.
- [ ] **Pre-render menu tamu ke JSON cache**: `menu:tenant:{tid}:outlet:{oid}` (menu_categories + menu_items available + outlet_setting) TTL 5 menit, invalidate saat menu berubah.
- [ ] Pasang **tracing/metrics** (query count per request, p95 latency) sebelum refactor, jadi ada baseline.
- **Verifikasi:** `php artisan test` masih hijau; benchmark endpoint `/api/orders` & `/m/{slug}` sebelum/sesudah cache.

### Fase 1 — Read Path Tamu ke Edge (2–3 minggu) ← dampak terbesar, risiko rendah
- [ ] `CustomerView` + `/api/menu/{slug}` (BARU) mengembalikan JSON dari cache Redis, bukan query langsung.
  - Route: `GET /m/{slug}` → resolve outlet via `slug` (indexed) → serve menu JSON.
  - Hapus hardcode `/m/senopati`.
- [ ] **CDN/edge cache** untuk response menu tamu (public, immutable per TTL). Tamu = read-only → bisa di-cache di edge (Cloudflare/Varnish).
- [ ] `/api/orders` (submit) tamu TETAP ke DB (write), tapi baca `menu_item` dari cache.
- **Verifikasi:** load test simulasi 5.000 tenant × scan QR → DB hit mendekati 0 (semua dari cache/edge).

### Fase 2 — Database-per-Tenant (4–8 minggu) ← inti skalabilitas
- [ ] Pilih strategi: **schema-per-tenant** (1 DB, banyak schema — lebih mudah backup/restore massal) vs **DB-per-tenant** (isolasi penuh). Rekomendasi: **schema-per-tenant** di MySQL (manageable di 5.000 tenant).
- [ ] `TenantContext` diperkaya: selain `tenant_id`, simpan **koneksi DB/schema** tenant.
- [ ] `TenantScope` tetap jalan di level aplikasi (defense-in-depth) meski sudah terpisah schema.
- [ ] **Tenant Router**: middleware `EnsureTenantContext` + bootstrap koneksi schema tenant dari **metadata DB** (terpisah, berisi mapping tenant → schema).
- [ ] Migration tool: script artisan `tenancy:migrate` jalanin migrasi ke semua schema; `tenancy:seed`.
- [ ] **Dual-write transition**: tulis ke schema lama & baru bersamaan seminggu, lalu switch read ke schema baru, lalu stop tulis ke lama.
- **Verifikasi:** integration test login kasir + submit order + owner dashboard di tenant A tidak sentuh data tenant B (isolasi schema); benchmark write 290 order/dtk.

### Fase 3 — Read Replica & Analitik Owner (2–3 minggu)
- [ ] Replika DB (read-only) untuk `OwnerDashboardController`, laporan, grafik.
- [ ] **Materialized daily aggregate**: tabel `daily_sales` per tenant (diisi cron malam) → owner buka dashboard tidak query `orders` mentah (ratusan juta row).
- [ ] Owner lintas-outlet: agregat per schema di-rollup ke tabel ringkas di metadata DB.
- **Verifikasi:** owner dashboard < 300 ms walau 100 outlet.

### Fase 4 — Partisi & Operasional (berkelanjutan)
- [ ] Partisi tabel `orders` per bulan (atau archive ke cold storage > 90 hari).
- [ ] Backup per-schema (paralel), bukan 1 DB raksasa.
- [ ] **Noisy-neighbor guard**: rate-limit per tenant di API gateway; resource quota per plan (`RequiresPlan` sudah ada).
- [ ] Auto-scaling aplikasi (stateless PHP-FPM behind load balancer; Redis terpisah).

---

## 3. Perubahan Kode Konkret (pointer)

| File | Perubahan |
|---|---|
| `database/migrations/*_outlets` | +`slug` (unique per tenant), index |
| `app/Models/Outlet.php` | +`slug` fillable; `scopeBySlug()` |
| `routes/web.php:26` | Ganti hardcode `/m/senopati` → `GET /m/{slug}` |
| `app/Http/Controllers/OrderController.php` | `submitOrder`: `Outlet::findOrFail` → `Cache::remember`; baca menu dari cache |
| `app/Http/Controllers/BukuMenuDigital/*` (BARU) | `showMenu($slug)` → serve menu JSON dari cache/edge |
| `app/Services/TenantContext.php` | +koneksi schema tenant |
| `app/Models/Scopes/TenantScope.php` | tetap (defense-in-depth) |
| `config/database.php` | +koneksi `tenant` dinamis (resolusi schema) |
| `app/Console/Commands/TenancyMigrate.php` (BARU) | migrasi ke semua schema |
| `app/Console/Commands/DailySalesRollup.php` (BARU) | agregat harian owner |

---

## 4. Risiko & Mitigasi

| Risiko | Mitigasi |
|---|---|
| Dual-write Fase 2 gagal → data mismatch | Tulis ke 2 schema, verifikasi count tiap jam, rollback otomatis ke lama jika selisih |
| Cache menu tamu stale (menu berubah tapi tamu lihat lama) | Invalidate cache saat `MenuItem`/`MenuCategory`/`OutletSetting` berubah (event listener) |
| Metadata DB jadi SPOF | Metadata DB kecil & bisa di-replica; fallback: cache mapping di Redis |
| 5.000 schema sulit di-manage | Schema-per-tenant + script `tenancy:*` terpusat; monitor otomatis |
| Biaya infra (5.000 schema) | Schema-per-tenant di 1 instance MySQL besar + read replica jauh lebih murah dari 5.000 DB terpisah |

---

## 5. Perhitungan Beban (referensi)

- 5.000 × 100 outlet = **500.000 outlet**.
- 50 order/outlet/hari → **25 juta order/hari** → ~290 order/dtk rata-rata (lonjak 3–5× saat makan).
- Tanpa DB-per-tenant: semua tulis ke 1 tabel `orders` → write-contention + backup GB-scale. **Tidak viable.**
- Dengan schema-per-tenant + cache tamu: write terdistribusi per schema; baca tamu ~100% dari edge/cache. **Viable di 1–2 instance MySQL + Redis + CDN.**

---

## 6. Acceptance Criteria (selesai bila)

- [ ] Tamu buka `/m/{slug}` dari cache/edge, DB hit ≈ 0 pada path read.
- [ ] 5.000 tenant terisolasi di schema masing-masing (test cross-tenant = fail).
- [ ] Submit order kasir tetap hijau di 290 order/dtk (load test).
- [ ] Owner dashboard < 300 ms walau 100 outlet (pakai daily rollup + replica).
- [ ] Backup per-schema jalan paralel < 30 menit total.
- [ ] `php artisan test` + `vitest` masih hijau di tiap fase.

---

**Catatan:** Plan ini mengasumsikan owner = web dashboard (desktop/tablet). Jika owner juga mau native Android, itu repo terpisah yang consume API yang sama — tidak mengubah plan backend di atas.
