/**
 * Vitest global setup file
 * Mengkonfigurasi @testing-library/jest-dom matchers untuk semua test.
 */
import '@testing-library/jest-dom';
import { vi, beforeEach } from 'vitest';

// jsdom tidak mengimplementasikan scrollIntoView (dipakai tab-switch PengaturanOutlet)
if (!Element.prototype.scrollIntoView) {
    Element.prototype.scrollIntoView = () => {};
}

// Default fetch aman: MainLayout & komponen melakukan background polling
// (/api/reservations expects array, lainnya object). Test boleh override via vi.stubGlobal.
beforeEach(() => {
    global.fetch = vi.fn((input: RequestInfo | URL) => {
        const url = String(input);
        const body = url.includes('/api/reservations') ? [] : {};
        return Promise.resolve({ ok: true, json: async () => body } as Response);
    }) as unknown as typeof fetch;
});
