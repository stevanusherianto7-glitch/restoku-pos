# Dev: QR Scan dari HP via ngrok (Opsi 2, Pre-VPS)

Script `dev-ngrok.sh` membuat tunnel publik ke `php artisan serve` lokal agar
tamu bisa scan QR buku menu dari HP (localhost tidak reachable dari HP).

## 1. Install ngrok (sekali)
```bash
winget install ngrok.ngrok
# atau: scoop install ngrok
# atau download manual: https://ngrok.com/download
```
Setelah install, **buka terminal baru** agar `ngrok` masuk PATH.

## 2. (Opsional tapi disarankan) Auth token
Tanpa auth, ngrok jalan tapi ada rate-limit. Dapatkan token gratis di
https://dashboard.ngrok.com → lalu:
```bash
ngrok config add-authtoken <TOKEN_ANDA>
```

## 3. Jalankan
Dari root project (`restoku backend`):
```bash
bash scripts/dev-ngrok.sh
```
Script akan:
1. Start `php artisan serve` (jika belum jalan)
2. Start `ngrok http 8000`
3. Ambil URL publik `https://xxxx.ngrok.io`
4. Tulis `MENU_BASE_URL=<url>` ke `.env` (QR jadi pakai domain publik)
5. Print URL untuk dibuka di HP

## 4. Tes di HP
- Buka `https://xxxx.ngrok.io/qrcode-meja` → generate QR → **scan dari HP**
- Atau langsung buka `https://xxxx.ngrok.io/m/<slug>` (e-Menu, no auth)
- Pastikan `MENU_BASE_URL` kebaca: restart `php artisan serve` jika sudah jalan
  sebelum script dijalankan (script otomatis start server sendiri).

## 5. Stop
`Ctrl+C` → ngrok + server di-stop, `MENU_BASE_URL` di-reset ke kosong.

## Catatan
- `MENU_BASE_URL` di `.env` **tidak di-commit** (gitignored).
- Di VPS produksi: `MENU_BASE_URL` dibiarkan kosong → QR otomatis pakai domain VPS.
- ngrok free = URL berubah tiap restart. Untuk domain stabil butuh paid/ngrok custom.
