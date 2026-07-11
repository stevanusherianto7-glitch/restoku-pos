#!/usr/bin/env bash
#
# dev-lan.sh — Jalankan Restoku dev di LAN agar QR buku menu langsung ke e-Menu
# (Opsi 1: LAN IP). Tanpa ngrok → tamu HP tidak kena browser-warning interstitial.
#
# Cara pakai:
#   1. Pastikan HP di WiFi/YANMET yang SAMA dengan komputer ini.
#   2. Cari IP LAN: `ipconfig` → IPv4 (contoh 192.168.100.8)
#   3. Edit LAN_IP di bawah (atau script auto-detect via ipconfig).
#   4. bash scripts/dev-lan.sh
#
# Kelebihan vs ngrok: tidak ada "Visit Site" warning, langsung e-Menu.
# Kekurangan: hanya reachable dari LAN (WiFi sama), bukan internet publik.
#
# ── Konfigurasi ──────────────────────────────────────────────────────────────
PORT=8000
# Auto-detect IP LAN (ambil IPv4 pertama yang bukan loopback/172 docker).
LAN_IP=$(ipconfig 2>/dev/null | grep -oE '([0-9]{1,3}\.){3}[0-9]{1,3}' | grep -vE '^(127|172|169|10)\.' | head -1)
[ -z "$LAN_IP" ] && LAN_IP="192.168.100.8"  # fallback
BASE_URL="http://${LAN_IP}:${PORT}"
# ─────────────────────────────────────────────────────────────────────────────

set -uo pipefail

# ── Warna ─────────────────────────────────────────────────────────────────
CY='\033[0;36m'; YE='\033[1;33m'; GR='\033[0;32m'; RD='\033[0;31m'; NC='\033[0m'

cleanup() {
    echo -e "\n${YE}■ Menghentikan server...${NC}"
    # Kembalikan MENU_BASE_URL ke kosong (produksi pakai domain otomatis)
    if [ -f .env ]; then
        sed -i "s|^MENU_BASE_URL=.*|MENU_BASE_URL=|" .env
    fi
    [ -n "${SERVE_PID:-}" ] && kill "$SERVE_PID" 2>/dev/null
    exit 0
}
trap cleanup INT TERM

# ── 1. Stop server lama di PORT ─────────────────────────────────────────────
echo -e "${CY}▶ Membersihkan server lama di port ${PORT}...${NC}"
for pid in $(netstat -ano 2>/dev/null | grep ":${PORT}.*LISTENING" | awk '{print $5}'); do
    taskkill.exe /PID "$pid" /F >/dev/null 2>&1 || kill -9 "$pid" 2>/dev/null
done
sleep 1

# ── 2. Tulis MENU_BASE_URL ke .env (QR jadi pakai LAN IP) ───────────────────
echo -e "${CY}▶ Menulis MENU_BASE_URL=${BASE_URL} ke .env${NC}"
if [ -f .env ]; then
    if grep -q '^MENU_BASE_URL=' .env; then
        sed -i "s|^MENU_BASE_URL=.*|MENU_BASE_URL=${BASE_URL}|" .env
    else
        printf '\nMENU_BASE_URL=%s\n' "$BASE_URL" >> .env
    fi
else
    printf 'MENU_BASE_URL=%s\n' "$BASE_URL" > .env
fi

# ── 3. Start php artisan serve di 0.0.0.0 (reachable dari LAN) ──────────────
echo -e "${CY}▶ Memulai php artisan serve --host=0.0.0.0 --port=${PORT}...${NC}"
php artisan serve --host=0.0.0.0 --port="$PORT" > /tmp/restoku_serve.log 2>&1 &
SERVE_PID=$!
sleep 4
if ! kill -0 "$SERVE_PID" 2>/dev/null; then
    echo -e "${RD}✗ Server gagal start. Cek /tmp/restoku_serve.log${NC}"
    exit 1
fi

# ── 4. Print URL untuk HP ───────────────────────────────────────────────────
echo -e "${GR}"
echo "════════════════════════════════════════════════════════════"
echo "  BUKA DI HP (WiFi SAMA dengan komputer ini):"
echo "  • Dashboard : ${BASE_URL}/owner"
echo "  • QR Meja   : ${BASE_URL}/qrcode-meja   (generate + scan)"
echo "  • e-Menu    : ${BASE_URL}/m/<slug>      (langsung, no auth, NO warning)"
echo "════════════════════════════════════════════════════════════"
echo -e "${NC}"
echo -e "${YE}Tekan Ctrl+C untuk menghentikan (server di-stop + .env di-reset).${NC}"

wait "$SERVE_PID"
