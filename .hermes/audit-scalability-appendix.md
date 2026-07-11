# LAMPIRAN A — TEMUAN ARSITEKTUR SKALABILITAS (Shared-Schema Multi-Tenancy)

**Audit:** Restoku General Audit · L4 Architecture
**Tanggal:** 2026-07-09 · **Skala target:** 5.000 tenant × hingga ratusan outlet (~500.000 outlet)

---

## A.1 STATUS SAAT INI (Fakta Kode)

| Dimensi | Temuan | Bukti |
|---|---|---|
| **Pola tenancy** | Shared-DB, **shared-schema** (1 MySQL, kolom `tenant_id` di tiap tabel) | `TenantScope`, `app/Models/*` pakai scope per `tenant_id` |
| **Isolasi** | Global scope `TenantScope` + `TenantContext` singleton | `app/Models/Scopes/TenantScope.php`, `app/Services/TenantContext.php` |
| **Resolusi** | `EnsureTenantContext` (setelah `auth`) mengisi `tenant.id` ke container | `app/Http/Middleware/EnsureTenantContext.php` |
| **Index** | ✅ `tenant_id` di-index (orders, order_items, menu_items, reservations); composite `(tenant_id, outlet_id, created_at)` di orders | migrations `2026_07_08_*` |
| **Session** | ❌ `SESSION_DRIVER=file` (bottleneck + tidak share antar server) | `.env` |
| **DB** | MySQL/MariaDB (default sqlite di env lokal) | `config/database.php` |
| **Bulk write tamu** | ⚠️ `withoutGlobalScope(TenantScope)` ×12 di `OrderController` (fragile tapi aman: tenant di-lock dari `outlet_id`) | grep |
| **QR / menu tamu** | Public, read-heavy, cacheable per `outlet` | `routes/web.php` `/m/`, `/api/orders` |

---

## A.2 APakah SHARED-SCHEMA MAMPU 5.000 × RATUSAN?

**Singkat: TIDAK, tidak pada skala penuh tanpa refactor.** Shared-schema menempatkan
semua tenant ke **tabel fisik yang sama**. Dampak:

1. **Write contention** — 25 juta order/hari (~290 write/dtk rata-rata, lonjak 3–5× saat
   makan) semua menulis ke **1 tabel `orders`**. Index membesar, lock meningkat.
2. **Noisy-neighbor** — 1 tenant dengan traffic tinggi melambatkan SEMUA tenant.
3. **Operasional** — backup/restore = 1 tabel raksasa (tens of GB). Migrasi skema =
   lock global.
4. **Isolasi resource** — tidak bisa batasi quota DB per tenant.

Shared-schema **ideal untuk puluhan–ratusan tenant** (SMB warung). Di 5.000 × ratusan,
butuh pemisahan fisik.

---

## A.3 REKOMENDASI TRANSISI (bertahap, tanpa break fitur)

### A.3.1 JANGKA PENDEK (LOW-RISK, langsung nilai)
- [x] **Pindahkan session/cache ke Redis** (`SESSION_DRIVER=redis`, `CACHE_DRIVER=redis`).
      File session tidak bisa horizontal-scale. (H2 di audit utama.)
- [x] **Auto-create 1 outlet default** saat tenant register → jaminan `/m/{slug}` selalu
      punya target (tenant tanpa outlet = dead-end saat ini).
- [x] **Cache resolusi tenant publik** (Redis): `outlet:{id} → {tenant_id, slug}`.
- [x] **Pre-render menu tamu ke JSON cache** (per outlet, TTL 5 mnt, invalidate saat menu berubah).
- [x] **Slug outlet + index** → enable `/m/{slug}` per-outlet yang scalable.

### A.3.2 JANGKA MENENGAH — Schema-per-Tenant (REKOMENDASI)
Ganti shared-schema → **schema-per-tenant** di 1 instance MySQL:
- Tiap tenant dapat schema sendiri (`tenant_0001`, `tenant_0002`, ...).
- `TenantContext` diperkaya: simpan **nama schema** selain `tenant_id`.
- `TenantScope` tetap jalan (defense-in-depth) meski sudah terpisah schema.
- **Tenant Router**: middleware resolve schema dari metadata-DB (terpisah, kecil, bisa replica).
- **Dual-write transition**: tulis ke schema lama + baru seminggu, lalu switch read.
- **Keuntungan vs DB-per-tenant murni**: 5.000 DB terpisah terlalu mahal & sulit di-manage;
  1 instance + 5.000 schema + read-replica jauh lebih masuk akal biaya & operasional.

### A.3.3 JANGKA PANJANG — Read Replica + Rollup
- [ ] Read replica untuk dashboard owner / laporan (query berat dipisah dari write path).
- [ ] **Daily sales rollup** (`daily_sales` per tenant) → owner buka dashboard tanpa query
      `orders` mentah (ratusan juta row).
- [ ] Partisi `orders` per bulan / archive > 90 hari ke cold storage.
- [ ] Backup **per-schema** paralel (bukan 1 DB raksasa).
- [ ] Noisy-neighbor guard: rate-limit per tenant di API gateway + resource quota per plan
      (`RequiresPlan` sudah ada).

---

## A.4 PERHITUNGAN BEBAN (referensi)

| Metrik | Estimasi |
|---|---|
| Outlet total | 5.000 × 100 = **500.000** |
| Order/hari | 500.000 × 50 = **25 juta** |
| Order/dtk (avg) | ~290 (lonjak 3–5× saat makan) |
| Write path | Kasir (web) + tamu (`/api/orders`) |
| Read path tamu | `/m/{slug}` read-only, **cacheable di edge** → ~0 DB hit |

**Kesimpulan:** Dengan schema-per-tenant + cache tamu agresif + Redis session,
skala 5.000 × ratusan **viable di 1–2 instance MySQL + Redis + CDN**.
Tanpa pemisahan schema, **tidak viable** pada skala penuh.

---

## A.5 CELAH TERKAIT (cross-ref audit utama)
- **H2** (session file) → A.3.1.
- **M3** (`withoutGlobalScope` ×12) → ganti `Order::forOutlet($outletId)` wrapper yang
  tetap lock `tenant_id` (A.3.2 defense-in-depth).
- **Tenant tanpa outlet** → auto-outlet default (A.3.1) — sudah masuk plan migrasi.

---

**Verdict arsitektur:** Fondasi isolation **benar & teruji** (test isolation PASS).
Bottleneck bukan security, tapi **skalabilitas fisik shared-schema** + session file.
Transisi schema-per-tenant adalah prasyarat produksi di skala 5.000 tenant.
