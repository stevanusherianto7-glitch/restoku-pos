# Migrasi Per-Tenant (Fase 2 — Schema-per-Tenant)

Folder ini berisi migrasi yang **hanya** dijalankan lewat `php artisan tenant:migrate`
(koneksi schema/DB terpisah `tenant_{id}`), BUKAN oleh `php artisan migrate` biasa.

## Daftar tabel tenant-scoped (dibangun per schema)

- `outlets` — slug GLOBAL-unique, logo, operating_hours, geo
- `menu_categories` — +`type` (food|beverage)
- `menu_items` — +`outlet_id`, `is_popular`, `stock*`, `image_public_id`, `track_stock`
- `orders` — partitioned (Postgres) / biasa (MySQL); `status` string, `destination`, `food/drink_served_at`
- `order_items` — +`cook_status` per-item 5-stage
- `reservations`, `outlet_settings`, `receipt_configs`, `print_jobs`
- `outlet_tables` — +`is_queue`, `qr_type`, `last_scan_token`
- `outlet_daily_pins`, `google_reviews` (+`source`), `google_bp_tokens`
- `sales_daily_rollups`, `sales_monthly_rollups`
- `orders_archive`, `audit_logs`, `expenses`, `cashier_sessions`, `attendances`, `shift_schedules`
- `agent_conversations`, `agent_conversation_messages`

## Catatan desain (opsi A)

- Kolom `tenant_id` **dipertahankan** (nullable) di tenant schema agar
  `TenantBackfillCommand` idempoten. Akan di-drop di fase cleanup saat backfill selesai.
- **Tidak ada FK** ke tabel shared (`users`, `tenants`) — schema fisik terpisah.
  FK hanya antar tabel dalam schema tenant yang sama.

## Menjalankan

```bash
# Semua tenant
php artisan tenant:migrate
# Satu tenant
php artisan tenant:migrate --tenant=3
# Dry run
php artisan tenant:migrate --dry
```

## Verifikasi isolasi (test)

```bash
# Lokal via Docker Postgres (bukti nyata, timeout keras anti-hang)
bash scripts/run-shard-test.sh Sharding
# Filter 1 class saja (debug cepat):
bash scripts/run-shard-test.sh SchemaIsolationTest

# Atau CI job `sharding-postgres` di .github/workflows/ci.yml
```

**Bukti (2026-07-17, Docker Postgres 16):** `SchemaIsolationTest` 2/2 PASS,
`TenantMigrateCommandTest` 2/2 PASS, `TenantShardingTest` 3 passed (postgres) +
2 skipped (sqlite-only) → **7 passed, 2 skipped, 0 failed**.

Test di `tests/Feature/Sharding/*` di-SKIP otomatis di sqlite/test lokal
(`TenantConnection::isSharded()` = false), dan hanya aktif di Postgres + `DB_SHARDING_ENABLED=true`.
