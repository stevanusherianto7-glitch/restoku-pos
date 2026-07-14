import { test, expect } from '@playwright/test';

/**
 * E2E — Buku Menu Digital (CustomerView) + Verifikasi Dine-In
 *
 * Menguji alur tamu nyata di browser:
 *  - Menu dari DB (photo_url Cloudinary) tampil
 *  - Foto menu reference ke res.cloudinary.com/dwdaydzsh
 *  - Alur verifikasi dine-in: landing -> welcome -> howto -> app -> modal PIN
 *  - PIN diambil dari endpoint publik (sama source dg badge Kasir) -> modal tertutup
 */

const SLUG = 'pawon-salam-bandung';
const MENU_URL = `/m/${SLUG}`;

test.describe('CustomerView / Buku Menu Digital', () => {
    test('CV1 — menu tampil dengan foto Cloudinary', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', (e) => errors.push(e.message));

        await page.goto(MENU_URL);

        // Nama menu asli dari seeder harus muncul
        await expect(page.getByText('Ayam Goreng Penyet Semarang')).toBeVisible({ timeout: 8000 });

        // Setidaknya satu img Produk menu reference ke Cloudinary dwdaydzsh
        const imgs = page.locator('img[src*="res.cloudinary.com/dwdaydzsh"]');
        await expect(imgs.first()).toBeVisible({ timeout: 8000 });

        // Tidak ada React crash
        expect(errors, errors.join('\n')).toHaveLength(0);
    });

    test('CV2 — verifikasi dine-in dengan PIN dari BE (modal tertutup)', async ({ page }) => {
        await page.goto(MENU_URL);

        // Ambil PIN harian dari endpoint publik (sumber yg sama dg badge Kasir)
        const pin = await page.evaluate(async (slug) => {
            const r = await fetch(`/api/guest/daily-pin?slug=${slug}`);
            const d = await r.json();
            return d.pin as string;
        }, SLUG);

        expect(pin, 'daily pin harus 4 digit').toMatch(/^\d{4}$/);

        // landing -> welcome
        await page.getByText(/Masuk ke Menu/i).click();
        await expect(page.getByText('Meja A1')).toBeVisible({ timeout: 5000 });

        // welcome -> howto
        await page.getByText(/Lanjut/i).click();
        await expect(page.getByText(/Mulai Pesan/i)).toBeVisible({ timeout: 5000 });

        // howto -> app (buka modal verifikasi dine-in)
        await page.getByText(/Mulai Pesan Sekarang/i).click();
        await expect(page.getByText(/VERIFIKASI DINE-IN/i)).toBeVisible({ timeout: 5000 });

        // Ketik PIN via keypad (cari button dg teks persis digit)
        for (const d of pin.split('')) {
            await page.locator('button', { hasText: new RegExp(`^${d}$`) }).first().click();
        }

        // Verifikasi
        await page.getByText(/VERIFIKASI PIN/i).click();
        await expect(page.getByText(/VERIFIKASI DINE-IN/i)).not.toBeVisible({ timeout: 5000 });
    });

    test('CV3 — PIN salah tidak menutup modal', async ({ page }) => {
        await page.goto(MENU_URL);

        await page.getByText(/Masuk ke Menu/i).click();
        await expect(page.getByText('Meja A1')).toBeVisible({ timeout: 5000 });
        await page.getByText(/Lanjut/i).click();
        await expect(page.getByText(/Mulai Pesan/i)).toBeVisible({ timeout: 5000 });
        await page.getByText(/Mulai Pesan Sekarang/i).click();
        await expect(page.getByText(/VERIFIKASI DINE-IN/i)).toBeVisible({ timeout: 5000 });

        // Ketik PIN salah 0000
        for (const d of ['0', '0', '0', '0']) {
            await page.locator('button', { hasText: new RegExp(`^${d}$`) }).first().click();
        }
        await page.getByText(/VERIFIKASI PIN/i).click();
        await expect(page.getByText(/VERIFIKASI DINE-IN/i)).toBeVisible({ timeout: 5000 });
    });
});
