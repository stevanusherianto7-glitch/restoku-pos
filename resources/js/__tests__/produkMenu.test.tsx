import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen } from '@testing-library/react';
import ProdukMenu from '../Pages/ProdukMenu/Index';

const mockUsePage = vi.hoisted(() => vi.fn());
vi.mock('@inertiajs/react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@inertiajs/react')>();
    return { ...actual, Head: ({ children }: { children: React.ReactNode }) => <>{children}</>, usePage: mockUsePage };
});

beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockUsePage.mockImplementation(() => ({
        props: { outlet: { name: 'Cabang A' }, auth: { user: { role: 'manager' } } },
    }));
    // RoleGuard untuk non-owner butuh session staff (PIN) di localStorage
    localStorage.setItem('activeKaryawan', JSON.stringify({ name: 'Budi', role: 'manager' }));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
});

describe('ProdukMenu/Index', () => {
    it('renders product table for manager', () => {
        render(<ProdukMenu />);
        expect(screen.getByText('Produk & Menu')).toBeInTheDocument();
        expect(screen.getByText('Nasi Goreng Spesial')).toBeInTheDocument();
        expect(screen.getByText('Sate Ayam Madura')).toBeInTheDocument();
        // margin badge computed
        expect(screen.getAllByText('Aktif').length).toBeGreaterThan(0);
    });

    it('denies access for kasir', () => {
        mockUsePage.mockImplementation(() => ({
            props: { outlet: { name: 'Cabang A' }, auth: { user: { role: 'kasir' } } },
        }));
        localStorage.setItem('activeKaryawan', JSON.stringify({ name: 'Sari', role: 'kasir' }));
        render(<ProdukMenu />);
        expect(screen.getByText('Akses Ditolak')).toBeInTheDocument();
    });
});
