# Aktivasi Schema-Per-Tenant: CI Job Postgres + tenant:migrate + Test Isolasi Schema-Nyata

> **Goal:** Membuat code-path schema-per-tenant (Fase 2) benar-benar **dieksekusi & terbukti** di environment yang mendukungnya (Postgres), lewat: (1) melengkapi migrasi per-tenant, (2) memverifikasi `tenant:migrate`, (3) test isolasi schema-FISIK (bukan cuma TenantScope), (4) job CI Postgres. Test lokal sqlite TIDAK diubah (tetap 469 hijau).

**Architecture:** Lokal/unit test tetap sqlite + `TenantScope` (cepat, sudah teruji). Jalur schema-per-tenant dijalankan di Postgres via job CI baru `sharding-postgres` + dibuktikan lokal via Docker (Postgres container + php-pgsql). Isolasi diuji dengan menulis data langsung ke schema `tenant_1` & `tenant_2`, lalu assert koneksi `tenant_1` HANYA melihat data tenant_1 (isolasi fisik, tanpa TenantScope).

**Tech Stack:** Laravel 13, PHPUnit, Postgres 16, Docker, GitHub Actions.

---

## Current Context / Assumptions (verified ke kode)

| Komponen | Status | Bukti |
|---|---|---|
| `TenantConnection.php` | ✅ ada, `isSharded()` false di sqlite | L45-54 |
| `UsesTenantConnection` trait | ✅ ada, dipakai 15 model | grep |
| `TenantMigrateCommand` | ✅ ada, pakai `--path=database/migrations/tenant` | L62-66 |
| `TenantBackfillCommand` | ✅ ada, idempoten copy by id | L69-92 |
| `config/database.php` | ✅ ada `sys`, `tenant_template`, `sharding_enabled` | L117-166 |
| `database/migrations/tenant/` | ⚠️ **cuma 1 file** (orders partitioned) | ls |
| Test isolasi sharded | ❌ **NOL** — 0 test eksekusi `isSharded()=true` | grep |
| CI Postgres job | ❌ belum ada | ci.yml |
| pgsql PHP ext lokal | ❌ tidak ada | `php -m` |
| Docker lokal | ✅ v29.6.1 | `docker --version` |

**Keputusan arsitek:**
- sqlite `:memory:` TIDAK bisa schema-per-tenant (tak ada search_path/DB terpisah) → `isSharded()` tetap `false` di sqlite. BENAR, jangan diubah.
- Bukti nyata schema-level HARUS di Postgres. Dua kanal: (a) job CI `sharding-postgres`, (b) Docker lokal untuk bukti sebelum push.
- Migrasi per-tenant harus lengkap (semua tabel tenant-scoped), bukan cuma orders.

---

## Step-by-Step Plan

### Task 1: Inventaris tabel tenant-scoped + tabel shared (sys)
**Objective:** Tentukan tabel mana masuk schema tenant vs schema sys.
**Files:** read-only — `database/migrations/*.php`, model dengan `UsesTenantConnection`.

- Tenant-scoped (ke `database/migrations/tenant/`): outlets, menu_categories, menu_items, orders, order_items, reservations, google_reviews, google_bp_tokens, receipt_configs, print_jobs, audit_logs, sales_daily_rollups, sales_monthly_rollups, order_archives, outlet_settings, outlet_tables.
- Shared/sys (tetap di `database/migrations/`): tenants, users, subscriptions, tenant_settings, migrations, jobs, cache, sessions.
- **Verifikasi:** daftar final ditulis sebagai komentar di `database/migrations/tenant/README.md`.

### Task 2: Buat set migrasi per-tenant lengkap
**Objective:** `database/migrations/tenant/` berisi SEMUA tabel tenant-scoped agar `tenant:migrate` membangun schema utuh.
**Files:**
- Create: `database/migrations/tenant/2026_07_17_000001_create_tenant_schema.php` (satu migration konsolidasi membuat semua tabel tenant-scoped TANPA kolom `tenant_id` — karena isolasi kini via schema fisik).

**Catatan desain:** Di schema-per-tenant, kolom `tenant_id` menjadi redundan (schema = tenant). Tapi untuk backward-compat backfill (yang copy row lengkap termasuk tenant_id), pertahankan `tenant_id` sebagai kolom nullable di tenant schema pada fase transisi. **Keputusan:** simpan `tenant_id` demi idempotensi backfill; drop di fase cleanup terpisah.

- **Verifikasi:** `php artisan tenant:migrate --dry` list schema; di Docker Postgres, `\dt` di schema tenant_1 menampilkan semua tabel.

### Task 3: Izinkan sharding di test Postgres (config)
**Objective:** `isSharded()` bisa `true` saat driver pgsql di test, dikendalikan env.
**Files:**
- Modify: `app/Services/TenantConnection.php:45-54` — tetap `false` untuk sqlite; untuk pgsql baca `sharding_enabled` (sudah begitu). Tidak perlu ubah logika, hanya pastikan test set `DB_SHARDING_ENABLED=true`.
- Modify: `config/database.php` `tenant_template` — pastikan saat test pgsql, host/port/user dari env CI.

- **Verifikasi:** unit kecil `isSharded()` true saat `database.default=pgsql` + `sharding_enabled=true`.

### Task 4: Test isolasi schema-FISIK (PHPUnit, skip di sqlite)
**Objective:** Bukti: data di schema tenant_1 TIDAK terlihat dari koneksi tenant_2 tanpa TenantScope.
**Files:**
- Create: `tests/Feature/Sharding/SchemaIsolationTest.php`

```php
<?php
namespace Tests\Feature\Sharding;

use App\Services\TenantConnection;
use App\Services\TenantContext;
use Illuminate\Support\Facades\Config;
use Illuminate\Support\Facades\DB;
use Tests\TestCase;

class SchemaIsolationTest extends TestCase
{
    protected function setUp(): void
    {
        parent::setUp();
        if (Config::get('database.default') !== 'pgsql' || ! Config::get('database.sharding_enabled')) {
            $this->markTestSkipped('Schema-per-tenant hanya berlaku di Postgres + sharding aktif.');
        }
    }

    public function test_data_terisolasi_secara_fisik_antar_schema(): void
    {
        $conn = app(TenantConnection::class);

        // Bangun 2 schema tenant + migrate
        foreach ([1, 2] as $tid) {
            DB::statement("CREATE SCHEMA IF NOT EXISTS tenant_{$tid}");
            $conn->resolveForTenant($tid);
            \Artisan::call('migrate', ['--database' => "tenant_{$tid}", '--path' => 'database/migrations/tenant', '--force' => true]);
        }

        // Tulis 1 outlet ke schema tenant_1 saja
        DB::connection('tenant_1')->table('outlets')->insert([
            'name' => 'Outlet T1', 'slug' => 'outlet-t1', 'is_active' => true,
            'created_at' => now(), 'updated_at' => now(),
        ]);

        // ASSERT isolasi fisik: koneksi tenant_2 TIDAK melihat data tenant_1
        $this->assertSame(1, DB::connection('tenant_1')->table('outlets')->count());
        $this->assertSame(0, DB::connection('tenant_2')->table('outlets')->count());
    }
}
```

- **Verifikasi:** di sqlite → SKIPPED (suite tetap 469 hijau). Di Postgres → PASS.

### Task 5: Test command tenant:migrate (skip di sqlite)
**Objective:** `tenant:migrate` mendaftarkan koneksi & migrate tiap tenant.
**Files:**
- Create: `tests/Feature/Sharding/TenantMigrateCommandTest.php` — buat 2 tenant, jalankan `tenant:migrate`, assert tabel `outlets` ada di schema tiap tenant. Skip di sqlite.

- **Verifikasi:** Postgres → PASS; sqlite → SKIPPED.

### Task 6: Bukti lokal via Docker (Postgres + php-pgsql)
**Objective:** Jalankan Task 4 & 5 dengan Postgres asli sebelum push (golden rule: bukti nyata).
**Files:**
- Create: `scripts/test-sharding-local.sh`

```bash
#!/usr/bin/env bash
set -euo pipefail
# Spin Postgres, jalankan test sharding di dalam container php:8.4 + pdo_pgsql.
docker rm -f restoku_pg_test 2>/dev/null || true
docker run -d --name restoku_pg_test -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=restoku -p 55432:5432 postgres:16-alpine
sleep 6
docker run --rm --network host -v "$PWD":/app -w /app \
  -e DB_CONNECTION=pgsql -e DB_HOST=127.0.0.1 -e DB_PORT=55432 \
  -e DB_DATABASE=restoku -e DB_USERNAME=postgres -e DB_PASSWORD=secret \
  -e DB_SHARDING_ENABLED=true \
  php:8.4-cli bash -c "
    apt-get update -qq && apt-get install -y -qq libpq-dev unzip git >/dev/null &&
    docker-php-ext-install pdo_pgsql pgsql >/dev/null &&
    php artisan migrate --force &&
    php artisan test --filter=Sharding
  "
docker rm -f restoku_pg_test
```

- **Verifikasi:** `bash scripts/test-sharding-local.sh` → test Sharding PASS dengan Postgres asli.

### Task 7: Job CI `sharding-postgres`
**Objective:** CI mengeksekusi test sharding tiap push/PR (mengaktifkan schema-level di CI).
**Files:**
- Modify: `.github/workflows/ci.yml` — tambah job:

```yaml
  sharding-postgres:
    name: "Schema-per-Tenant (Postgres)"
    runs-on: ubuntu-latest
    services:
      postgres:
        image: postgres:16-alpine
        env:
          POSTGRES_PASSWORD: secret
          POSTGRES_DB: restoku
        ports: [ "5432:5432" ]
        options: >-
          --health-cmd "pg_isready -U postgres"
          --health-interval 10s --health-timeout 5s --health-retries 5
    steps:
      - uses: actions/checkout@v4
      - uses: shivammathur/setup-php@v2
        with:
          php-version: "8.4"
          extensions: dom, curl, libxml, mbstring, zip, pdo, pgsql, pdo_pgsql, bcmath
          coverage: none
      - run: composer install --no-interaction --prefer-dist --optimize-autoloader
      - run: |
          cp .env.example .env
          php artisan key:generate
          mkdir -p storage/framework/{views,cache/data,sessions} storage/logs
      - name: Run schema-per-tenant isolation tests
        env:
          DB_CONNECTION: pgsql
          DB_HOST: 127.0.0.1
          DB_PORT: 5432
          DB_DATABASE: restoku
          DB_USERNAME: postgres
          DB_PASSWORD: secret
          DB_SHARDING_ENABLED: "true"
        run: |
          php artisan migrate --force
          php artisan test --filter=Sharding
```

- **Verifikasi:** push → job `Schema-per-Tenant (Postgres)` hijau di GitHub Actions.

### Task 8: Update dokumen
**Objective:** PRD/README/GOLDEN_RULES mencerminkan status "schema-level TERUJI di CI Postgres".
**Files:**
- Modify: `PRD.md`, `README.md` — Fase 2 status: "code-ready + TERUJI di CI Postgres (job sharding-postgres); AKTIF di prod Postgres, fallback shared-schema di sqlite/test lokal".

### Task 9: Gate lengkap + commit
- `php artisan test` (sqlite) → 469 + test Sharding SKIPPED, semua hijau.
- `bash scripts/test-sharding-local.sh` → Sharding PASS (Postgres asli).
- `npm run build` hijau (tidak ada perubahan FE, sanity).
- Commit + push; verifikasi job CI baru hijau.

---

## Files Likely to Change
- Create: `database/migrations/tenant/2026_07_17_000001_create_tenant_schema.php`
- Create: `database/migrations/tenant/README.md`
- Create: `tests/Feature/Sharding/SchemaIsolationTest.php`
- Create: `tests/Feature/Sharding/TenantMigrateCommandTest.php`
- Create: `scripts/test-sharding-local.sh`
- Modify: `.github/workflows/ci.yml` (job baru)
- Modify: `config/database.php` (jika perlu env test)
- Modify: `PRD.md`, `README.md`

## Risks / Tradeoffs
- **R1:** Migrasi konsolidasi tenant harus konsisten dengan skema shared. Mitigasi: derive dari migrasi root yang ada.
- **R2:** Backfill copy `tenant_id` → pertahankan kolom di tenant schema fase ini.
- **R3:** Docker php:8.4-cli install ext tiap run (lambat ~1-2 mnt). Dapat diterima untuk bukti lokal sekali jalan.
- **R4:** CI menambah 1 job (waktu + minit). Worth it: satu-satunya bukti runtime Fase 2.

## Open Questions
- Q1: Apakah `tenant_id` di-drop dari tenant schema sekarang atau fase cleanup? → **Default arsitek: pertahankan (nullable) fase ini**, drop terpisah.
- Q2: Migrasi tenant = 1 file konsolidasi atau mirror per-tabel? → **Default: 1 file konsolidasi** (lebih mudah dijaga sinkron).
