#!/usr/bin/env bash
# dev-cloudflared.sh — jalankan Laravel + cloudflared tunnel (FREE, tanpa warning page).
# HP tamu scan QR -> langsung e-Menu, tidak ada "Visit Site" (beda dengan ngrok free).
set -uo pipefail

cd "$(dirname "$0")/.." || exit 1

LOG_SERVE=/tmp/restoku_serve.log
LOG_CF=/tmp/restoku_cf.log
PID_SERVE=; PID_CF=

cleanup() {
  echo ""
  echo "==> Menghentikan tunnel + server..."
  [ -n "${PID_CF:-}" ] && kill "$PID_CF" 2>/dev/null
  [ -n "${PID_SERVE:-}" ] && kill "$PID_SERVE" 2>/dev/null
  # best-effort kill sisa
  cmd.exe /c "tasklist | findstr /i cloudflared" 2>/dev/null | awk '{print $2}' | while read -r p; do taskkill.exe /PID "$p" /F >/dev/null 2>&1; done
  exit 0
}
trap cleanup INT TERM

# 1. Start Laravel dev server (port 8000)
echo "==> Menyalakan php artisan serve (port 8000)..."
php artisan serve --host=127.0.0.1 --port=8000 >"$LOG_SERVE" 2>&1 &
PID_SERVE=$!

# Tunggu server siap
for i in $(seq 1 20); do
  if curl -s -o /dev/null http://127.0.0.1:8000/; then break; fi
  sleep 1
done

# 2. Start cloudflared tunnel (quick tunnel, random URL, NO warning page)
echo "==> Membuka cloudflared tunnel (free, no 'Visit Site')..."
./cloudflared.exe tunnel --url http://127.0.0.1:8000 >"$LOG_CF" 2>&1 &
PID_CF=$!

# 3. Tunggu URL tunnel muncul di log
echo "==> Menunggu URL publik..."
TUNNEL_URL=""
for i in $(seq 1 30); do
  TUNNEL_URL=$(grep -oE 'https://[a-z0-9.-]+\.trycloudflare\.com' "$LOG_CF" 2>/dev/null | head -1)
  [ -n "$TUNNEL_URL" ] && break
  sleep 1
done

if [ -z "$TUNNEL_URL" ]; then
  echo "!! Gagal mendapatkan URL tunnel. Log:"
  tail -n 15 "$LOG_CF"
  cleanup
fi

# 4. Tulis MENU_BASE_URL ke .env (biar QR encode URL publik, bukan localhost)
sed -i "s|^MENU_BASE_URL=.*|MENU_BASE_URL=$TUNNEL_URL|" .env

echo ""
echo "==================================================="
echo "  Tunnel LIVE: $TUNNEL_URL"
echo "  MENU_BASE_URL -> $TUNNEL_URL (sudah di .env)"
echo ""
echo "  Buka di HP / browser:"
echo "    e-Menu : $TUNNEL_URL/m/pawon-salam-bandung?t=A1"
echo "    Owner  : $TUNNEL_URL/owner/login"
echo "    QR     : $TUNNEL_URL/qrcode-meja"
echo "==================================================="
echo "(Ctrl+C untuk berhenti)"

wait "$PID_CF"
