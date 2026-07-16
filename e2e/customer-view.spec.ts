import { test, expect } from '@playwright/test';

/**
 * E2E — Buku Menu Digital (CustomerView) + Verifikasi Dine-In
 *
 * Menguji alur tamu nyata di browser:
 *  - Menu dari DB (photo_url Cloudinary) tampil
 *  - Foto menu reference ke res.cloudinary.com/dwdaydzsh
 *  - Alur landing -> welcome (Meja A1) -> howto -> app -> GuestVerifyGate
 *  - GuestVerifyGate (verifikasi kehadiran) muncul di stage app, daily PIN
 *    otomatis ter-load dari endpoint publik /api/guest/daily-pin.
 *
 * Catatan: submit verifikasi (PIN + GPS) di-cover oleh unit test
 * guestVerifyGate.test.tsx (butuh GPS yang tidak ada di headless CI),
 * sehingga E2E hanya memvalidasi render + autofill agar tidak flaky.
 */

const SLUG = 'pawon-salam-bandung';
const MENU_URL = `/m/${SLUG}?t=A1`;

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

    test('CV2 — alur landing -> welcome -> app -> cart menampilkan GuestVerifyGate', async ({ page }) => {
        await page.goto(MENU_URL);

        // landing -> welcome
        await page.getByText(/Masuk ke Menu/i).click();
        await expect(page.getByText('Meja A1')).toBeVisible({ timeout: 5000 });

        // welcome -> howto
        await page.getByText(/Lanjut/i).click();
        await expect(page.getByText(/Mulai Pesan Sekarang/i)).toBeVisible({ timeout: 5000 });

        // howto -> app (stage menu)
        await page.getByText(/Mulai Pesan Sekarang/i).click();
        await expect(page.getByText('Ayam Goreng Penyet Semarang')).toBeVisible({ timeout: 5000 });

        // GuestVerifyGate di-render di tab Keranjang (cart), bukan di menu.
        await page.getByTestId('cart-tab').click();
        await expect(page.getByText('VERIFIKASI KEHADIRAN')).toBeVisible({ timeout: 5000 });

        // Field PIN Harian Restoran ada (autofill dari endpoint publik BE)
        await expect(page.getByText('PIN Harian Restoran')).toBeVisible({ timeout: 5000 });

        // Input PIN Meja (untuk meja A1) menerima input
        const tablePin = page.getByPlaceholder('••••').first();
        await tablePin.fill('1234');
        await expect(tablePin).toHaveValue('1234');
    });

    test('CV3 — GuestVerifyGate daily PIN ter-autofill dari BE', async ({ page }) => {
        await page.goto(MENU_URL);

        await page.getByText(/Masuk ke Menu/i).click();
        await expect(page.getByText('Meja A1')).toBeVisible({ timeout: 5000 });
        await page.getByText(/Lanjut/i).click();
        await page.getByText(/Mulai Pesan Sekarang/i).click();
        await expect(page.getByText('Ayam Goreng Penyet Semarang')).toBeVisible({ timeout: 5000 });

        // Buka tab Keranjang -> GuestVerifyGate
        await page.getByTestId('cart-tab').click();
        await expect(page.getByText('VERIFIKASI KEHADIRAN')).toBeVisible({ timeout: 5000 });

        // Daily PIN otomatis terisi dari /api/guest/daily-pin (badge OTOMATIS muncul)
        await expect(page.getByText('OTOMATIS')).toBeVisible({ timeout: 8000 });
    });
});
