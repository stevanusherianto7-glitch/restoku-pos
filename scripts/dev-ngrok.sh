#!/usr/bin/env bash
#
# dev-ngrok.sh — Jalankan Restoku dev + ngrok agar QR buku menu bisa di-scan dari HP
# (Opsi 2: ngrok tunnel). Pre-VPS hanya untuk testing scan tamu.
#
# Cara pakai:
#   1. Install ngrok (sekali): https://ngrok.com/download  -> letakkan ngrok.exe di PATH
#      (atau di Windows: winget install ngrok.ngrok  /  scoop install ngrok)
#   2. (Opsional) login ngrok: ngrok config add-authtoken <TOKEN_DARI_DASHBOARD>
#      -> tanpa auth, ngrok tetap jalan tapi limit rate/throttle.
#   3. Jalankan: bash scripts/dev-ngrok.sh
#   4. Buka dashboard di HP via URL yang di-print (atau scan QR dari halaman QRCodeMeja).
#   5. Ctrl+C untuk berhenti (ngrok + server di-stop bersih).
#
# Apa yang dilakukan script:
#   - Start `php artisan serve --host=127.0.0.1 --port=8000` (jika belum jalan)
#   - Start `ngrok http 8000` (background)
#   - Poll ngrok local API (127.0.0.1:4040) untuk ambil public HTTPS URL
#   - Tulis MENU_BASE_URL=<ngrok-url> ke .env (supaya QR pakai domain publik)
#   - Print URL untuk dibuka di HP
#
set -euo pipefail

cd "$(dirname "$0")/.."   # pindah ke root project (restoku backend)

PORT=8000
NGROK_API="http://127.0.0.1:4040/api/tunnels"
ENV_FILE=".env"

# 1. Pastikan php artisan serve jalan di background
if ! curl -s -o /dev/null "http://127.0.0.1:$PORT"; then
  echo "▶ Memulai php artisan serve (port $PORT)..."
  php artisan serve --host=127.0.0.1 --port="$PORT" >/tmp/restoku_serve.log 2>&1 &
  SERVE_PID=$!
  # tunggu server ready
  for i in $(seq 1 30); do
    if curl -s -o /dev/null "http://127.0.0.1:$PORT"; then break; fi
    sleep 1
  done
else
  SERVE_PID=""
  echo "• php artisan serve sudah jalan di port $PORT"
fi

# 2. Start ngrok
echo "▶ Memulai ngrok tunnel (http://localhost:$PORT)..."
ngrok http "$PORT" --log=stdout >/tmp/restoku_ngrok.log 2>&1 &
NGROK_PID=$!

# 3. Poll ngrok API untuk public URL
echo "• Menunggu ngrok public URL..."
PUBLIC_URL=""
for i in $(seq 1 30); do
  URLS=$(curl -s "$NGROK_API" 2>/dev/null || true)
  if [ -n "$URLS" ]; then
    # ambil https public_url pertama
    PUBLIC_URL=$(printf '%s' "$URLS" | grep -oE 'https://[a-zA-Z0-9._-]+\.ngrok(-free)?\.[a-z]+' | head -1 || true)
    if [ -n "$PUBLIC_URL" ]; then break; fi
  fi
  sleep 1
done

if [ -z "$PUBLIC_URL" ]; then
  echo "✗ Gagal ambil ngrok URL. Cek: ngrok authtoken sudah di-set? (lihat /tmp/restoku_ngrok.log)"
  kill "$NGROK_PID" 2>/dev/null || true
  [ -n "$SERVE_PID" ] && kill "$SERVE_PID" 2>/dev/null || true
  exit 1
fi

# 4. Tulis MENU_BASE_URL ke .env
if grep -q '^MENU_BASE_URL=' "$ENV_FILE"; then
  # pakai sed portable (MSYS/GNU)
  sed -i "s|^MENU_BASE_URL=.*|MENU_BASE_URL=$PUBLIC_URL|" "$ENV_FILE"
else
  printf '\nMENU_BASE_URL=%s\n' "$PUBLIC_URL" >> "$ENV_FILE"
fi
echo "✓ MENU_BASE_URL=$PUBLIC_URL (ditulis ke .env)"

# 5. Print info untuk HP
echo ""
echo "════════════════════════════════════════════════════════════"
echo "  BUKA DI HP ANDA:"
echo "  • Dashboard : $PUBLIC_URL/owner"
echo "  • QR Meja   : $PUBLIC_URL/qrcode-meja   (generate + scan)"
echo "  • e-Menu    : $PUBLIC_URL/m/<slug>      (langsung, no auth)"
echo "════════════════════════════════════════════════════════════"
echo ""
echo "Tekan Ctrl+C untuk menghentikan (ngrok + server di-stop)."

# 6. Trap Ctrl+C -> cleanup
cleanup() {
  echo ""
  echo "■ Menghentikan ngrok + server..."
  kill "$NGROK_PID" 2>/dev/null || true
  [ -n "$SERVE_PID" ] && kill "$SERVE_PID" 2>/dev/null || true
  # reset MENU_BASE_URL ke kosong (kembali ke mode produksi/localhost)
  sed -i 's|^MENU_BASE_URL=.*|MENU_BASE_URL=|' "$ENV_FILE"
  echo "✓ .env MENU_BASE_URL di-reset ke kosong."
  exit 0
}
trap cleanup INT TERM

# tunggu selamanya
wait
