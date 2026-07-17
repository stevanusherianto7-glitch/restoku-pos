#!/usr/bin/env bash
# scripts/debug-searchpath.sh
# Debug lokal: cek apakah search_path benar-benar ter-set + migrate jatuh ke schema benar
set -euo pipefail

PG_CONTAINER=restoku_pg_dbg
PG_PORT=55433

echo "==> Spin Postgres 16"
docker rm -f "$PG_CONTAINER" 2>/dev/null || true
docker run -d --name "$PG_CONTAINER" \
  -e POSTGRES_PASSWORD=secret -e POSTGRES_DB=restoku \
  -p "$PG_PORT:5432" postgres:16-alpine

echo "==> Tunggu Postgres"
for i in $(seq 1 30); do
  if docker exec "$PG_CONTAINER" pg_isready -U postgres >/dev/null 2>&1; then echo "up"; break; fi
  sleep 2
done

docker run --rm --network host \
  -v "$PWD":/app -w /app \
  -e DB_CONNECTION=pgsql \
  -e DB_HOST=127.0.0.1 -e DB_PORT="$PG_PORT" \
  -e DB_DATABASE=restoku -e DB_USERNAME=postgres -e DB_PASSWORD=secret \
  -e DB_SHARDING_ENABLED=true \
  php:8.4-cli bash -c "
    set -e
    apt-get update -qq
    apt-get install -y -qq libpq-dev unzip >/dev/null 2>&1
    docker-php-ext-install pdo_pgsql pgsql >/dev/null 2>&1
    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer
    composer install --no-interaction --prefer-dist --optimize-autoloader
    php artisan key:generate
    mkdir -p storage/framework/views storage/framework/cache/data storage/framework/sessions storage/logs
    php artisan migrate --force
    php scripts/debug-sharding.php
  "

echo "==> Stop Postgres"
docker rm -f "$PG_CONTAINER" 2>/dev/null || true
echo "==> DONE"
