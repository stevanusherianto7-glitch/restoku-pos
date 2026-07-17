# RUNBOOK SMOKE TEST DEPLOY — RESTOKU (VPS Sewaan)

> Principal SE + SaaS Security Architect + QA Lead.
> Tujuan: verifikasi aplikasi READY deploy ke VPS dengan Postgres + Redis + Cloudinary.
> Catatan: session ini TIDAK punya akses VPS fisik. Berikut adalah runbook + hasil
> pre-flight check LOKAL yang SUDAH dibuktikan (lihat bagian "Pre-flight di lokal").

## Pre-flight di lokal (SUDAH dibuktikan, real evidence)
- [x] Backend test: **469 passed, 5 skipped, 0 failed** (`php artisan test`) — baseline 2026-07-17.
- [x] Frontend test: **242 passed** (`npm run test`) — scope terpilih.
- [x] **Psalm SAST**: `vendor/bin/psalm` exit 0, SARIF 0 alert.
- [x] Build: **success** (`npm run build`)
- [x] Routes publik/owner terdaftar: `api/menu/{slug}`, `api/orders`, `api/pos/menu`,
  `api/owner/sales-summary`, `api/owner/archived-orders`, `/m/{slug}`, `/pos`, `/katalog-menu`
- [x] Scheduler: `sales:rollup` (01:00), `orders:archive` (1/02:00) terdaftar
- [x] `tenant:migrate --dry` jalan (schema-per-tenant resolver OK) + **CI `sharding-postgres` GREEN** (9 bug fix, commit `eb1395e`)
- [x] `config:cache` / `config:clear` OK
- [x] Commands: `tenant:migrate`, `tenant:backfill`, `sales:rollup`, `orders:archive` terdaftar
- [x] CI: `ci.yml` 10 jobs GREEN (Secret Scan, PHP SAST/Psalm, PHPUnit, Vitest, Vite Build,
  Playwright x4, **Schema-per-Tenant Postgres**). CodeQL by design failure (repo private free).

## Langkah deploy di VPS (Forge opsional, atau manual)

### 1. Provinsi VPS
- OS: Ubuntu 24.04 LTS
- PHP 8.4 (fpm), Composer 2, Node 20, Postgres 16, Redis 7, Supervisor
- Firewall: 443 (HTTPS), 6379 (Redis bind localhost ONLY)

### 2. Environment
```bash
cp .env.example .env
# Isi:
DB_CONNECTION=pgsql
DB_SHARDING_ENABLED=true
DB_DATABASE=restoku
DB_HOST=127.0.0.1
CLOUDINARY_URL=cloudinary://KEY:SECRET@CLOUD
GOOGLE_PLACES_API_KEY=           # ulasan Google live (Places API by Place ID)
GROQ_API_KEY=                    # AI reply ulasan (wajib, no silent fallback)
MENU_BASE_URL=https://DOMAIN    # untuk QR generator (jangan localhost!)
SESSION_DRIVER=redis
CACHE_STORE=redis
QUEUE_CONNECTION=redis
REDIS_HOST=127.0.0.1
```

### 3. Install & migrate
```bash
composer install --no-dev --optimize-autoloader
npm ci --legacy-peer-deps && npm run build
php artisan key:generate
php artisan migrate
php artisan tenant:migrate          # buat schema tenant_{id}
php artisan tenant:backfill         # pindah data Fase 0/1 ke per-tenant
php artisan storage:link
php artisan config:cache && php artisan route:cache
```

### 4. Queue & Scheduler (Supervisor)
```ini
# /etc/supervisor/conf.d/restoku-queue.conf
[program:restoku-queue]
command=php /var/www/restoku/artisan queue:work --tries=3
autostart=true
autorestart=true
```
```bash
# crontab -e  (atau Forge scheduler)
* * * * * cd /var/www/restoku && php artisan schedule:run >> /dev/null 2>&1
```

### 5. Smoke test (curl dari VPS)
```bash
# A. Buku menu tamu (publik)
curl -s https://DOMAIN/m/cabang-pusat | grep -q "CustomerView" && echo "OK: landing tamu"

# B. API menu per slug
curl -s https://DOMAIN/api/menu/cabang-pusat | jq '.items' && echo "OK: menu API"

# C. Guest order (throttle 30,1)
curl -s -X POST https://DOMAIN/api/orders -H "Content-Type: application/json" \
  -d '{"outlet_id":1,"table_number":"A1","items":[{"id":1,"qty":2}]}' | jq '.id' && echo "OK: order"

# D. Rollup (owner, butuh auth token)
TOKEN=$(curl -s -X POST https://DOMAIN/login -d "email=owner@x&password=y" | jq -r '.token')
curl -s https://DOMAIN/api/owner/sales-summary -H "Authorization: Bearer $TOKEN" | jq '.total_orders'

# E. Health check Redis
redis-cli ping   # PONG
```

### 6. Post-deploy monitoring (rekomendasi)
- Redis: `redis-cli info` → alert bila `used_memory` > 80%
- Postgres: `pg_stat_activity` → alert bila connection > 80% max
- Cloudinary: dashboard quota → alert bila > 90%
- Laravel log: `tail -f storage/logs/laravel.log` + Sentry (opsional)

## Hasil ekspektasi (PASS criteria)
- [ ] `curl /api/menu/{slug}` → 200 JSON
- [ ] `curl -X POST /api/orders` → 200 (order id)
- [ ] `php artisan tenant:migrate` → semua schema `tenant_N` created
- [ ] `redis-cli ping` → PONG
- [ ] Scheduler `sales:rollup` jalan tiap 01:00 (cek `sales_daily_rollups`)

## Blockers
- 0 blocker kode. Prasyarat: VPS akses + Postgres + Redis + Cloudinary key (di luar scope session ini).

## Dev tunnel lokal (phone testing sebelum VPS)
- Untuk scan QR dari HP asli saat pre-VPS: `scripts/dev-cloudflared-live.sh` (cloudflared quick tunnel, bukan ngrok/ERR_NGROK_334).
- Set `MENU_BASE_URL` di `.env` = URL tunnel, restart `php artisan serve`, refresh dashboard sebelum regenerate QR.
- Kalau `MENU_BASE_URL` kosong → QR fallback `window.location.origin` (localhost) → HP tidak bisa reach = "route error" tapi sebenarnya URL salah.
- Windows Firewall blokir inbound `:8000` → pakai cloudflared (bukan LAN mode).
