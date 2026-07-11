import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import DiskonPajakPage from '../Pages/DiskonPajak/Index';

// --- Mock @inertiajs/react (Head no-op; usePage dipakai Screen via MainLayout) ---
const mockUsePage = vi.hoisted(() => vi.fn());
vi.mock('@inertiajs/react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@inertiajs/react')>();
    return {
        ...actual,
        Head: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        usePage: mockUsePage,
    };
});

const setPage = (outletName = 'Cabang A') => {
    mockUsePage.mockImplementation(() => ({ props: { outlet: { name: outletName } } }));
};

beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    setPage();
    // MainLayout mem-fetch /api/reservations untuk badge — stub di jsdom
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
});

describe('DiskonPajak/Index', () => {
    it('renders the placeholder page for authorized manager', () => {
        localStorage.setItem('activeKaryawan', JSON.stringify({ name: 'Budi', role: 'manager' }));
        render(<DiskonPajakPage />);
        expect(screen.getByText('Placeholder for DiskonPajak')).toBeInTheDocument();
    });

    it('denies access for non-authorized role', () => {
        localStorage.setItem('activeKaryawan', JSON.stringify({ name: 'Sari', role: 'kasir' }));
        render(<DiskonPajakPage />);
        expect(screen.getByText(/Akses Ditolak/i)).toBeInTheDocument();
    });
});
