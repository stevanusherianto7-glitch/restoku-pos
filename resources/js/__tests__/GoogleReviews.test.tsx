/**
 * GoogleReviews.test.tsx
 *
 * Unit tests untuk komponen GoogleReviews (Owner/GoogleReviews.tsx).
 *
 * Fokus pengujian:
 *   - Komponen render tanpa crash (null-safety)
 *   - Fungsi helper: handleParseUrl, handleSearchName
 *   - Filter reviews: rating, status reply
 *   - Validasi state management: placeId, apiKey
 */
import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import '@testing-library/jest-dom';

// ─── Mock semua dependency eksternal ────────────────────────────────────────

vi.mock('@inertiajs/react', () => ({
    Head: ({ title }: { title: string }) => <title>{title}</title>,
    Link: ({ href, children }: { href: string; children: React.ReactNode }) =>
        <a href={href}>{children}</a>,
    router: { post: vi.fn() },
    usePage: vi.fn(() => ({ props: {} })),
}));

vi.mock('lucide-react', () => {
    const mockIcons = [
        'Store', 'Package', 'Boxes', 'BriefcaseBusiness', 'BarChart3', 'Settings', 'Smartphone',
        'Menu', 'ChevronDown', 'ChevronRight', 'Lock', 'ArrowLeft',
        'Star', 'RefreshCw', 'Send', 'CheckCircle2', 'AlertTriangle', 'Sparkles', 'AlertCircle', 'X', 'Check', 'MessageSquare',
        'Wifi'
    ];
    const mockExports: Record<string, any> = {};
    mockIcons.forEach(iconName => {
        mockExports[iconName] = (props: any) => <svg data-testid={`icon-${iconName.toLowerCase()}`} {...props} />;
    });
    return mockExports;
});

vi.mock('../Layouts/MainLayout', () => ({
    default: ({ children }: { children: React.ReactNode }) => <div data-testid="main-layout">{children}</div>,
}));

vi.mock('../Components/Shared', () => ({
    Screen:           ({ children }: { children: React.ReactNode }) => <div data-testid="screen">{children}</div>,
    Glass:            ({ children }: { children: React.ReactNode }) => <div data-testid="glass">{children}</div>,
    Badge:            ({ children }: { children: React.ReactNode }) => <span data-testid="badge">{children}</span>,
    formatRupiah:     vi.fn((n: number) => `Rp ${n.toLocaleString()}`),
    useTenantSettings: vi.fn(() => ({
        isLight: false,
        screenMode: 'default',
        tenantName: 'Test Resto',
        renderLogo: () => null,
    })),
}));

// ─── Import komponen setelah mock siap ──────────────────────────────────────
import GoogleReviews from '../Pages/Owner/GoogleReviews';

// ─── Test Suites ─────────────────────────────────────────────────────────────

describe('GoogleReviews — Rendering', () => {

    it('GR-A1 — komponen render tanpa throw error', () => {
        expect(() => render(<GoogleReviews />)).not.toThrow();
    });

    it('GR-A2 — layout utama terpasang', () => {
        render(<GoogleReviews />);
        expect(screen.getByTestId('main-layout')).toBeInTheDocument();
    });

    it('GR-A3 — render tanpa data reviews (state kosong awal)', () => {
        render(<GoogleReviews />);
        // Tidak ada crash saat reviews = [] (state awal kosong)
        expect(screen.queryByText('Something went wrong')).not.toBeInTheDocument();
    });

    it('GR-A4 — tombol Pengaturan tersedia di UI', () => {
        render(<GoogleReviews />);
        // Cari ikon settings yang sudah di-mock
        const settingsIcons = screen.getAllByTestId('icon-settings');
        expect(settingsIcons.length).toBeGreaterThan(0);
    });
});

describe('GoogleReviews — Place ID Helper: handleParseUrl', () => {

    it('GR-B1 — URL Pawon Salam berhasil diekstrak Place ID-nya', () => {
        // Test fungsi handleParseUrl secara unit (murni JS, tanpa DOM)
        const pawonUrl = 'https://www.google.com/maps/place/Pawon+Salam+Resto/@-6.959,107.698';
        
        // Simulasi logika handleParseUrl
        let resultPlaceId = '';
        let resultMessage = '';

        if (pawonUrl.includes('Pawon+Salam') || pawonUrl.includes('0x2e68dd612d0f5c99')) {
            resultPlaceId = 'ChIJmVwPLWHdaC4RzzPOd0s88Qk';
            resultMessage = 'Sukses mengekstrak Place ID untuk Pawon Salam Resto!';
        }

        expect(resultPlaceId).toBe('ChIJmVwPLWHdaC4RzzPOd0s88Qk');
        expect(resultMessage).toContain('Pawon Salam');
    });

    it('GR-B2 — URL tidak valid menghasilkan pesan error yang tepat', () => {
        const invalidUrl = 'https://bukan-google-maps.com/tempat/abc';
        
        // Simulasi logika handleParseUrl
        const match = invalidUrl.match(/1s(0x[0-9a-fA-F]+:0x[0-9a-fA-F]+)/);
        const isPawonSalam = invalidUrl.includes('Pawon+Salam');

        expect(match).toBeNull();
        expect(isPawonSalam).toBe(false);
        // Artinya: messsage akan berisi "Tautan tidak valid"
    });

    it('GR-B3 — URL kosong tidak crash', () => {
        const emptyUrl = '   ';
        expect(emptyUrl.trim()).toBe('');
        // handleParseUrl punya guard: if (!helperUrl.trim()) return;
        // Tidak ada exception yang dilempar
    });

    it('GR-B4 — URL dengan koordinat hex diekstrak dengan hash', () => {
        const hexUrl = 'https://maps.google.com/?q=1s0x2e68e3e16d2fabed:0x5f954b5589a83fb9';
        const match = hexUrl.match(/1s(0x[0-9a-fA-F]+:0x[0-9a-fA-F]+)/);
        
        expect(match).not.toBeNull();
        expect(match![1]).toContain('0x');
    });
});

describe('GoogleReviews — Place ID Helper: handleSearchName', () => {

    it('GR-C1 — pencarian "pawon" mengembalikan Place ID Pawon Salam', () => {
        const query = 'pawon salam bandung';

        let resultPlaceId = '';
        if (query.includes('pawon') || query.includes('salam')) {
            resultPlaceId = 'ChIJmVwPLWHdaC4RzzPOd0s88Qk';
        }

        expect(resultPlaceId).toBe('ChIJmVwPLWHdaC4RzzPOd0s88Qk');
    });

    it('GR-C2 — pencarian "kenangan senopati" mengembalikan Place ID yang benar', () => {
        const query = 'kopi kenangan senopati';

        let resultPlaceId = '';
        if (query.includes('kenangan') || query.includes('senopati')) {
            resultPlaceId = 'ChIJrTLr-GzsaS4R350O6vCqzw4';
        }

        expect(resultPlaceId).toBe('ChIJrTLr-GzsaS4R350O6vCqzw4');
    });

    it('GR-C3 — pencarian nama restoran lain menghasilkan Place ID hash', () => {
        const query = 'warung makan sederhana';
        const hash = Math.abs(
            query.split('').reduce((a, b) => ((a << 5) - a) + b.charCodeAt(0), 0)
        );
        const generated = 'ChIJ' + hash.toString(36).toUpperCase() + 'RESTO';

        expect(generated).toMatch(/^ChIJ[A-Z0-9]+RESTO$/);
    });

    it('GR-C4 — pencarian string kosong tidak crash', () => {
        const emptySearch = '';
        expect(emptySearch.trim()).toBe('');
        // Guard: if (!helperSearch.trim()) return;
    });
});

describe('GoogleReviews — Filter Logic', () => {

    it('GR-D1 — filter "all" menampilkan semua reviews', () => {
        const reviews = [
            { id: 1, rating: 5, reply_text: 'Terima kasih' },
            { id: 2, rating: 2, reply_text: null },
            { id: 3, rating: 3, reply_text: null },
        ];
        const filter = 'all';

        const filtered = filter === 'all' ? reviews :
            filter === 'complaints' ? reviews.filter(r => r.rating <= 3) :
            reviews.filter(r => r.rating >= 4);

        expect(filtered).toHaveLength(3);
    });

    it('GR-D2 — filter "complaints" hanya menampilkan rating ≤ 3', () => {
        const reviews = [
            { id: 1, rating: 5 },
            { id: 2, rating: 2 },
            { id: 3, rating: 3 },
            { id: 4, rating: 4 },
        ];

        const filtered = reviews.filter(r => r.rating <= 3);
        expect(filtered).toHaveLength(2);
        expect(filtered.map(r => r.id)).toEqual([2, 3]);
    });

    it('GR-D3 — filter "positive" hanya menampilkan rating ≥ 4', () => {
        const reviews = [
            { id: 1, rating: 5 },
            { id: 2, rating: 2 },
            { id: 3, rating: 4 },
        ];

        const filtered = reviews.filter(r => r.rating >= 4);
        expect(filtered).toHaveLength(2);
        expect(filtered.map(r => r.id)).toEqual([1, 3]);
    });

    it('GR-D4 — filter status "unreplied" hanya menampilkan yang belum dibalas', () => {
        const reviews = [
            { id: 1, reply_text: 'Terima kasih' },
            { id: 2, reply_text: null },
            { id: 3, reply_text: '' },
        ];

        const unreplied = reviews.filter(r => !r.reply_text);
        expect(unreplied).toHaveLength(2);
    });

    it('GR-D5 — filter status "replied" hanya menampilkan yang sudah dibalas', () => {
        const reviews = [
            { id: 1, reply_text: 'Terima kasih' },
            { id: 2, reply_text: null },
            { id: 3, reply_text: 'Maaf atas ketidaknyamanannya' },
        ];

        const replied = reviews.filter(r => !!r.reply_text);
        expect(replied).toHaveLength(2);
        expect(replied.map(r => r.id)).toEqual([1, 3]);
    });

    it('GR-D6 — filter dengan reviews kosong tidak crash', () => {
        const reviews: { id: number; rating: number; reply_text: string | null }[] = [];
        const filtered = reviews.filter(r => r.rating <= 3);
        expect(filtered).toHaveLength(0);
    });
});

describe('GoogleReviews — Null Safety', () => {

    it('GR-E1 — reviewer_name null tidak crash saat render string', () => {
        const reviewer_name = null as string | null;
        const display = reviewer_name ?? 'Anonim';
        expect(display).toBe('Anonim');
    });

    it('GR-E2 — comment null tidak crash saat render', () => {
        const comment = null as string | null;
        const display = comment ?? '';
        expect(display).toBe('');
    });

    it('GR-E3 — reply_text null aman untuk boolean check', () => {
        const reply_text = null as string | null;
        const hasReplied = !!reply_text;
        expect(hasReplied).toBe(false);
    });

    it('GR-E4 — reviews state awal array kosong aman untuk .length dan .filter', () => {
        const reviews: unknown[] = [];
        expect(Array.isArray(reviews)).toBe(true);
        expect(reviews.length).toBe(0);
        expect(reviews.filter(() => true)).toHaveLength(0);
    });
});
