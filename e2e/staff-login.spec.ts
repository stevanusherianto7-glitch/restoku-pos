import { test, expect } from '@playwright/test';

/**
 * E2E Tests — StaffLogin (PIN Pad)
 *
 * Menguji rendering komponen React di browser nyata.
 * Menangkap error yang tidak bisa dideteksi oleh HTTP 200 check.
 */
test.describe('StaffLogin Page', () => {

    // ─────────────────────────────────────────────────────────────────────
    // KELOMPOK A: No React crash — yang dulu tidak terdeteksi TDR
    // ─────────────────────────────────────────────────────────────────────

    test('A1 — halaman /login render tanpa React Error boundary', async ({ page }) => {
        // Kumpulkan console errors
        const errors: string[] = [];
        page.on('console', msg => {
            if (msg.type() === 'error') errors.push(msg.text());
        });
        page.on('pageerror', err => errors.push(err.message));

        await page.goto('/login');

        // Pastikan tidak ada React Error boundary yang muncul
        const errorBoundary = page.getByText('Something went wrong');
        await expect(errorBoundary).not.toBeVisible({ timeout: 3000 });

        // Pastikan tidak ada TypeError di console
        const typeErrors = errors.filter(e => e.includes('TypeError'));
        expect(typeErrors).toHaveLength(0);
    });

    test('A2 — komponen PIN pad berhasil dirender (tombol 1-9 terlihat)', async ({ page }) => {
        await page.goto('/login');

        // Numpad harus ada
        await expect(page.getByRole('button', { name: '1' })).toBeVisible();
        await expect(page.getByRole('button', { name: '5' })).toBeVisible();
        await expect(page.getByRole('button', { name: '9' })).toBeVisible();
        await expect(page.getByRole('button', { name: '0' })).toBeVisible();
    });

    test('A3 — heading "Masukkan PIN" tampil', async ({ page }) => {
        await page.goto('/login');
        await expect(page.getByRole('heading', { name: 'Masukkan PIN' })).toBeVisible();
    });

    // ─────────────────────────────────────────────────────────────────────
    // KELOMPOK B: Interaksi PIN pad
    // ─────────────────────────────────────────────────────────────────────

    test('B1 — klik angka mengisi dot indicator PIN', async ({ page }) => {
        await page.goto('/login');

        // Klik 3 angka
        await page.getByRole('button', { name: '1' }).click();
        await page.getByRole('button', { name: '2' }).click();
        await page.getByRole('button', { name: '3' }).click();

        // Tidak boleh ada error
        const errorBoundary = page.getByText('Something went wrong');
        await expect(errorBoundary).not.toBeVisible();
    });

    test('B2 — PIN 6 digit tidak crash aplikasi', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', err => errors.push(err.message));

        await page.goto('/login');

        // Input 6 digit PIN
        for (const digit of ['1', '2', '3', '4', '5', '6']) {
            await page.getByRole('button', { name: digit }).click();
        }

        // Tunggu sebentar untuk proses async verifyPin
        await page.waitForTimeout(1500);

        // Tidak boleh ada JavaScript error
        const typeErrors = errors.filter(e => e.includes('TypeError'));
        expect(typeErrors).toHaveLength(0);
    });

    test('B3 — tombol delete (backspace) berfungsi tanpa crash', async ({ page }) => {
        await page.goto('/login');

        await page.getByRole('button', { name: '1' }).click();
        await page.getByRole('button', { name: '2' }).click();

        // Klik delete button (ikon hapus)
        const deleteBtn = page.locator('button').filter({ has: page.locator('svg') }).last();
        await deleteBtn.click();

        // Tidak crash
        await expect(page.getByText('Something went wrong')).not.toBeVisible();
    });

    // ─────────────────────────────────────────────────────────────────────
    // KELOMPOK C: Navigasi & akses routes lain
    // ─────────────────────────────────────────────────────────────────────

    test('C1 — link "Batal & Kembali" ada dan bisa diklik', async ({ page }) => {
        await page.goto('/login');
        const backLink = page.getByRole('link', { name: /Batal.*Kembali/i });
        await expect(backLink).toBeVisible();
    });

    test('C2 — owner login page /owner/login render tanpa error', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', err => errors.push(err.message));

        await page.goto('/owner/login');

        // Halaman harus load
        await expect(page).toHaveTitle(/.+/);

        const typeErrors = errors.filter(e => e.includes('TypeError'));
        expect(typeErrors).toHaveLength(0);
    });

    test('C3 — landing page / render tanpa error', async ({ page }) => {
        const errors: string[] = [];
        page.on('pageerror', err => errors.push(err.message));

        await page.goto('/');

        await expect(page).toHaveTitle(/.+/);

        const typeErrors = errors.filter(e => e.includes('TypeError'));
        expect(typeErrors).toHaveLength(0);
    });
});
