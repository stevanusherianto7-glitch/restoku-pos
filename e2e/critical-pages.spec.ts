import { test, expect } from '@playwright/test';

/**
 * E2E Tests — Halaman Kritis (authenticated pages)
 *
 * Menguji rendering React di browser nyata untuk halaman-halaman
 * yang paling sering diakses dan paling kritis secara bisnis.
 * Server menggunakan session auth otomatis (dev bypass / seeded user).
 */

// ─── Helper: cek tidak ada React error ─────────────────────────────────────
async function expectNoReactCrash(page: import('@playwright/test').Page, url: string) {
    const errors: string[] = [];
    page.on('pageerror', err => errors.push(err.message));
    page.on('console', msg => {
        if (msg.type() === 'error') errors.push(msg.text());
    });

    await page.goto(url);

    // Tidak ada React Error Boundary
    await expect(page.getByText('Something went wrong')).not.toBeVisible({ timeout: 4000 });

    // Tidak ada TypeError di console
    const typeErrors = errors.filter(e => e.includes('TypeError'));
    expect(typeErrors, `TypeError found on ${url}: ${typeErrors.join(', ')}`).toHaveLength(0);
}

// ═══════════════════════════════════════════════════════════════════════════
// KELOMPOK D: Dashboard
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Dashboard Page', () => {

    test('D1 — /dashboard render tanpa React Error boundary', async ({ page }) => {
        await expectNoReactCrash(page, '/dashboard');
    });

    test('D2 — /dashboard punya title yang valid', async ({ page }) => {
        await page.goto('/dashboard');
        await expect(page).toHaveTitle(/.+/);
    });

    test('D3 — /laporan-keuangan render tanpa crash', async ({ page }) => {
        await expectNoReactCrash(page, '/laporan-keuangan');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// KELOMPOK E: POS (Point of Sale) — halaman paling kritis operasional
// ═══════════════════════════════════════════════════════════════════════════
test.describe('POS Page', () => {

    test('E1 — /pos render tanpa React Error boundary', async ({ page }) => {
        await expectNoReactCrash(page, '/pos');
    });

    test('E2 — /pos punya title yang valid', async ({ page }) => {
        await page.goto('/pos');
        await expect(page).toHaveTitle(/.+/);
    });

    test('E3 — /monitor-pesanan render tanpa crash', async ({ page }) => {
        await expectNoReactCrash(page, '/monitor-pesanan');
    });

    test('E4 — /monitor-reservasi render tanpa crash', async ({ page }) => {
        await expectNoReactCrash(page, '/monitor-reservasi');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// KELOMPOK F: KDS (Kitchen Display System)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('KDS Page', () => {

    test('F1 — /kds render tanpa React Error boundary', async ({ page }) => {
        await expectNoReactCrash(page, '/kds');
    });

    test('F2 — /kds punya title yang valid', async ({ page }) => {
        await page.goto('/kds');
        await expect(page).toHaveTitle(/.+/);
    });

    test('F3 — /waiter-bar render tanpa crash', async ({ page }) => {
        await expectNoReactCrash(page, '/waiter-bar');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// KELOMPOK G: Google Review & Complaint Hub (Owner)
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Google Reviews Page', () => {

    test('G1 — /owner/google-reviews render tanpa React Error boundary', async ({ page }) => {
        await expectNoReactCrash(page, '/owner/google-reviews');
    });

    test('G2 — /owner/google-reviews punya title yang valid', async ({ page }) => {
        await page.goto('/owner/google-reviews');
        await expect(page).toHaveTitle(/.+/);
    });

    test('G3 — /owner/dashboard render tanpa crash', async ({ page }) => {
        await expectNoReactCrash(page, '/owner/dashboard');
    });

    test('G4 — /owner/settings render tanpa crash', async ({ page }) => {
        await expectNoReactCrash(page, '/owner/settings');
    });
});

// ═══════════════════════════════════════════════════════════════════════════
// KELOMPOK H: Pengaturan & Inventaris
// ═══════════════════════════════════════════════════════════════════════════
test.describe('Settings & Inventory Pages', () => {

    test('H1 — /pengaturan-outlet render tanpa crash', async ({ page }) => {
        await expectNoReactCrash(page, '/pengaturan-outlet');
    });

    test('H2 — /inventory render tanpa crash', async ({ page }) => {
        await expectNoReactCrash(page, '/inventory');
    });

    test('H3 — /laporan-penjualan render tanpa crash', async ({ page }) => {
        await expectNoReactCrash(page, '/laporan-penjualan');
    });

    test('H4 — /whatsapp-integration render tanpa crash', async ({ page }) => {
        await expectNoReactCrash(page, '/whatsapp-integration');
    });
});
