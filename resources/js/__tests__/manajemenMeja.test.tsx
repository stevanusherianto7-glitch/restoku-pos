import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, within } from '@testing-library/react';
import TableManagement from '../Pages/ManajemenMeja/Index';

// --- Mock @inertiajs/react (Head butuh provider asli; kita no-op, usePage dipakai Screen) ---
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
});

describe('ManajemenMeja/Index', () => {
    it('renders title and all tables', () => {
        render(<TableManagement />);
        expect(screen.getByText('Manajemen Meja & QR')).toBeInTheDocument();
        // 8 meja dari state awal
        expect(screen.getByText('Meja 1')).toBeInTheDocument();
        expect(screen.getByText('VIP 2')).toBeInTheDocument();
    });

    it('renders status labels for every status branch', () => {
        render(<TableManagement />);
        expect(screen.getAllByText('Tersedia').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Terisi').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Dipesan').length).toBeGreaterThan(0);
        expect(screen.getAllByText('Kotor').length).toBeGreaterThan(0);
    });

    it('opens QR modal when a table is clicked', () => {
        render(<TableManagement />);
        // Klik kartu "Meja 1"
        const card = screen.getByText('Meja 1').closest('div[class*="rounded-2xl"]') as HTMLElement;
        fireEvent.click(card);
        // Modal muncul berisi nama meja + tombol Cetak/Unduh
        expect(screen.getByText('QR Code Meja 1')).toBeInTheDocument();
        expect(screen.getByText('Cetak')).toBeInTheDocument();
        expect(screen.getByText('Unduh PNG')).toBeInTheDocument();
    });

    it('closes QR modal via the close button', () => {
        render(<TableManagement />);
        const card = screen.getByText('Meja 3').closest('div[class*="rounded-2xl"]') as HTMLElement;
        fireEvent.click(card);
        expect(screen.getByText('QR Code Meja 3')).toBeInTheDocument();
        // Tombol ✕ di modal
        const closeBtn = screen.getByText('✕');
        fireEvent.click(closeBtn);
        expect(screen.queryByText('QR Code Meja 3')).not.toBeInTheDocument();
    });

    it('shows table capacity', () => {
        render(<TableManagement />);
        // VIP 2 capacity 12
        const vip2 = screen.getByText('VIP 2').closest('div[class*="rounded-2xl"]') as HTMLElement;
        expect(within(vip2).getByText('12')).toBeInTheDocument();
    });
});
