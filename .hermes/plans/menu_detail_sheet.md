# Plan: Detail Menu Sheet (CustomerView) — pola Alexa Recipe

## Tujuan
Saat tamu klik kartu menu di Buku Menu Digital, buka **detail sheet** (bottom sheet / modal) dengan pola dari mockup `mockup_menu_detail.html`:
- Hero foto menu (Cloudinary `item.photo_url` via `ProductImage`)
- Badge "Favorit" (jika `isPopular`) + harga di pojok hero
- Judul + nama outlet (tenant) + metadata (rating/waktu/porsi — opsional, fallback)
- Tabs: Deskripsi | Combo | Ulasan (aktif = cabe #FF5B35)
- Numbered steps penyajian (opsional, fallback 3 langkah default)
- CTA "Tambah ke Pesanan · Rp X" (panggil `addToCart`)

## Scope
- Hanya `CustomerView.tsx` (Buku MenuDigital / tamu). Tidak ubah POS/owner.
- Mockup `mockup_menu_detail.html` dihapus sebelum commit.

## Langkah
1. **MenuItem interface** — tambah field opsional: `rating?`, `cookTime?`, `servings?`, `steps?: string[]`, `combo?`, `reviews?`. Fallback aman di render.
2. **State** — `const [detailItem, setDetailItem] = useState<MenuItem | null>(null)`.
3. **Klik kartu** — `onClick={() => setDetailItem(item)}` di wrapper kartu (line ~639); tombol Tambah tetap `addToCart` tanpa buka sheet.
4. **Detail Sheet** — komponen inline `<MenuDetailSheet item={detailItem} onClose={...} onAdd={addToCart} />`:
   - Overlay fixed + panel bawah (max-w mobile, rounded-top, scroll).
   - Hero `ProductImage` + badge + harga.
   - Nama + outlet (`tenantName` dari `useTenantSettings`) + meta (rating/cookTime/servings, `??` default).
   - Tabs state lokal (`'desc' | 'combo' | 'reviews'`) — konten: desc=item.description + steps; combo=item.combo ?? "Belum ada combo"; reviews=item.reviews ?? fallback.
   - CTA fixed bottom: "Tambah ke Pesanan · Rp {price}" → `onAdd(item.id)` + `onClose()`.
5. **Render** — `{detailItem && <MenuDetailSheet ... />}` sebelum closing `</div>` utama.

## Palet
- Cabe `#FF5B35` (aktif tab, CTA, badge harga), krem `#FAF5EE` (panel light mode) — tapi CustomerView saat ini dark. Sheet pakai surface gelap `bg-[#1c1917]` + aksen cabe, konsisten dengan mockup tapi adaptif ke dark mode app.
- Icon: HINDARI lucide di area utama (sesuai preferensi) — pakai emoji/teks minimal; Plus/Minus di CTA tetap lucide (sudah ada).

## Verifikasi
- `npm run build` hijau, `npx vitest run` 43 pass.
- `browser_vision` mockup (sudah lolos) + snapshot CustomerView buka sheet (inject localStorage branding, navigasi ke /m/{slug}?t=, klik kartu).
- Hapus `mockup_menu_detail.html`.

## Catatan
- Tidak ubah `addToCart`/cart logic — sheet hanya memanggilnya.
- Data `photo_url` sudah di-map ke `image` (line 126) → `ProductImage` handle Cloudinary.
- Karena dashboard butuh auth tapi CustomerView publik (/m/...), verifikasi browser bisa langsung ke route tamu.
