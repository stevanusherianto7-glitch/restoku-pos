#!/usr/bin/env bash
# scripts/run-debug-sharding.sh — jalankan scripts/debug-sharding.php di Docker (reuse pg)
set -uo pipefail
PG_CONTAINER=restoku_pg_shard
PG_PORT=55434

docker run --rm --network host \
  -v "$PWD":/app -w /app \
  -e DB_CONNECTION=pgsql \
  -e DB_HOST=127.0.0.1 -e DB_PORT="$PG_PORT" \
  -e DB_DATABASE=restoku -e DB_USERNAME=postgres -e DB_PASSWORD=secret \
  -e DB_SHARDING_ENABLED=true \
  php:8.4-cli bash -c "
    apt-get update -qq 2>/dev/null
    apt-get install -y -qq libpq-dev unzip >/dev/null 2>&1
    docker-php-ext-install pdo_pgsql pgsql >/dev/null 2>&1
    curl -sS https://getcomposer.org/installer | php -- --install-dir=/usr/local/bin --filename=composer 2>/dev/null
    composer install --no-interaction --prefer-dist --optimize-autoloader 2>/dev/null
    php artisan key:generate 2>/dev/null || true
    mkdir -p storage/framework/views storage/framework/cache/data storage/framework/sessions storage/logs
    php scripts/debug-sharding.php
  "
echo "EXIT=$?"
