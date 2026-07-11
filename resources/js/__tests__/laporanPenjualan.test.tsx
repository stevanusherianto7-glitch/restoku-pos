import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import LaporanPenjualan from '../Pages/LaporanPenjualan/Index';

const mockUsePage = vi.hoisted(() => vi.fn());
vi.mock('@inertiajs/react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@inertiajs/react')>();
    return {
        ...actual,
        Head: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        usePage: mockUsePage,
    };
});

beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockUsePage.mockImplementation(() => ({
        props: { auth: { user: { role: 'owner', name: 'Owner' } } },
    }));
});

describe('LaporanPenjualan/Index', () => {
    it('renders title and summary cards', () => {
        render(<LaporanPenjualan />);
        expect(screen.getByText('Laporan Penjualan')).toBeInTheDocument();
        expect(screen.getByText('Total Penjualan')).toBeInTheDocument();
        expect(screen.getByText('Jumlah Transaksi')).toBeInTheDocument();
    });

    it('renders the daily report table rows', () => {
        render(<LaporanPenjualan />);
        // salah satu baris periode (format "DD Mon")
        expect(screen.getByText('06 Jul')).toBeInTheDocument();
        expect(screen.getByText('01 Jul')).toBeInTheDocument();
    });

    it('changes period via date inputs', () => {
        render(<LaporanPenjualan />);
        const start = screen.getByDisplayValue('2026-07-01') as HTMLInputElement;
        fireEvent.change(start, { target: { value: '2026-06-01' } });
        expect(start.value).toBe('2026-06-01');
    });
});
