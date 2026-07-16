#!/usr/bin/env bash
# ─── Restoku: Cloudflared Public Tunnel + MENU_BASE_URL sync ───────────────
# Jalankan dari root project "restoku backend".
# Start quick tunnel ke localhost:8000, lalu tulis URL publik ke .env
# (MENU_BASE_URL) supaya QR meja otomatis pakai link publik (HP bisa scan).
#
# Usage:  bash scripts/dev-cloudflared-live.sh
#
# CATATAN:
# - Quick tunnel (account-less) -> URL ACAK & berubah tiap restart. Cocok UAT/preview.
# - Production tetap VPS sewaan (Vercel TIDAK bisa jalanin Laravel).
# - Setelah .env berubah, restart `php artisan serve` biar baca env baru.
# - Frontend baca base URL dari props.menu_base_url (server inject), BUKAN VITE bake,
#   jadi TIDAK perlu npm run build ulang.

set -euo pipefail
cd "$(dirname "$0")/.." || exit 1

PORT="${PORT:-8000}"
CLOUDFLARED_BIN="${CLOUDFLARED_BIN:-cloudflared}"

echo "▶ Mengecek cloudflared..."
if ! command -v "$CLOUDFLARED_BIN" >/dev/null 2>&1; then
  echo "✗ cloudflared tidak ditemukan di PATH."
  echo "  Install: download cloudflared-windows-amd64.exe dari GitHub release,"
  echo "  lalu symlink ke ~/bin atau tambah ke PATH."
  exit 1
fi

# Pastikan server lokal jalan
echo "▶ Mengecek localhost:$PORT ..."
if ! curl -s -o /dev/null "http://localhost:$PORT/"; then
  echo "✗ Server localhost:$PORT tidak merespons. Jalankan: php artisan serve --port=$PORT"
  exit 1
fi

echo "▶ Memulai cloudflared tunnel (background)..."
# Jalankan tunnel, capture URL dari stdout
TUNNEL_LOG="$(mktemp)"
"$CLOUDFLARED_BIN" tunnel --url "http://localhost:$PORT" --metrics 127.0.0.1:9091 > "$TUNNEL_LOG" 2>&1 &
TUNNEL_PID=$!
echo "  tunnel pid=$TUNNEL_PID (log: $TUNNEL_LOG)"

# Tunggu URL muncul (baris '|  https://....trycloudflare.com ... |')
TUNNEL_URL=""
for i in $(seq 1 20); do
  TUNNEL_URL="$(grep -oE 'https://[a-z0-9-]+\.trycloudflare\.com' "$TUNNEL_LOG" | head -1 || true)"
  [ -n "$TUNNEL_URL" ] && break
  sleep 1
done

if [ -z "$TUNNEL_URL" ]; then
  echo "✗ Tunnel gagal start. Lihat log: $TUNNEL_LOG"
  kill "$TUNNEL_PID" 2>/dev/null || true
  exit 1
fi

echo "✓ Tunnel publik: $TUNNEL_URL"

# ── Tulis ke .env ──────────────────────────────────────────────────────────
set_env() {
  local key="$1" val="$2"
  if grep -q "^${key}=" .env; then
    sed -i "s|^${key}=.*|${key}=${val}|" .env
  else
    printf '\n%s=%s\n' "$key" "$val" >> .env
  fi
  echo "  ${key} -> ${val}"
}

echo "▶ Menulis MENU_BASE_URL ke .env..."
set_env "MENU_BASE_URL" "$TUNNEL_URL"

echo "▶ Restart php artisan serve agar baca .env baru..."
pkill -f "php artisan serve" 2>/dev/null || true
sleep 2
php artisan serve --port="$PORT" > /tmp/restoku_serve.log 2>&1 &
echo "  serve pid=$!"

# Verifikasi prop menu_base_url ter-inject
sleep 4
echo "▶ Verifikasi prop menu_base_url (via /login)..."
PROP="$(curl -s "http://localhost:$PORT/login" | grep -o '"menu_base_url":"[^"]*"' | head -1 || true)"
echo "  $PROP"

echo ""
echo "══════════════════════════════════════════════════════════════════"
echo "  URL PUBLIK : $TUNNEL_URL"
echo "  Buku Menu   : $TUNNEL_URL/m/{slug}?t={meja}"
echo "  QR Meja     : /qrcode-meja  (otomatis pakai URL publik di atas)"
echo "══════════════════════════════════════════════════════════════════"
echo "Tekan Ctrl+C di terminal tunnel untuk menghentikan (URL akan berubah saat restart)."
wait "$TUNNEL_PID"
