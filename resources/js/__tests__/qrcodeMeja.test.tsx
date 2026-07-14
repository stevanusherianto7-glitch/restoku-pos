import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import QRCodeMeja from '../Pages/QRCodeMeja/Index';

// --- Mock @inertiajs/react ---
const mockUsePage = vi.hoisted(() => vi.fn());
vi.mock('@inertiajs/react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@inertiajs/react')>();
    return {
        ...actual,
        Head: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        usePage: mockUsePage,
    };
});

const outlets = [
    { id: 1, name: 'Cabang A', slug: 'cabang-a', is_active: true },
    { id: 2, name: 'Cabang B', slug: 'cabang-b', is_active: true },
];

const setPage = (extra = {}) => {
    mockUsePage.mockImplementation(() => ({
        props: {
            outlet: { name: 'Cabang A' },
            outlets,
            menu_base_url: 'https://restoku.test',
            auth: { user: { role: 'manager' } },
            ...extra,
        },
    }));
};

beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    // RoleGuard allow=['owner','manager','admin'] → butuh session manager/owner
    localStorage.setItem('activeKaryawan', JSON.stringify({ name: 'Budi', role: 'manager' }));
    setPage();
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
    vi.spyOn(window, 'print').mockImplementation(() => {});
});

describe('QRCodeMeja/Index', () => {
    it('renders QR grid for default table labels', () => {
        render(<QRCodeMeja />);
        // Default tableInput = A1,A2,B1,B2,C1 → grid generate URL per meja.
        // (Label "Meja A1" ada di print-area yang hidden di screen; cek preview URL sebagai bukti.)
        expect(screen.getByText('https://restoku.test/m/cabang-a?t=A1')).toBeInTheDocument();
        expect(screen.getByText('https://restoku.test/m/cabang-a?t=C1')).toBeInTheDocument();
    });

    it('shows preview URL built from selected outlet slug', () => {
        render(<QRCodeMeja />);
        const url = 'https://restoku.test/m/cabang-a?t=A1';
        expect(screen.getByText(url)).toBeInTheDocument();
    });

    it('regenerates QR when outlet changes', () => {
        render(<QRCodeMeja />);
        const select = screen.getByDisplayValue('Cabang A') as HTMLSelectElement;
        fireEvent.change(select, { target: { value: '2' } });
        const url = 'https://restoku.test/m/cabang-b?t=A1';
        expect(screen.getByText(url)).toBeInTheDocument();
    });

    it('prints all when Cetak Semua clicked', () => {
        render(<QRCodeMeja />);
        fireEvent.click(screen.getByText('Cetak Semua'));
        expect(window.print).toHaveBeenCalled();
    });

    it('shows empty-state when no outlets', () => {
        setPage({ outlets: [] });
        render(<QRCodeMeja />);
        expect(screen.getByText(/Belum ada outlet/i)).toBeInTheDocument();
    });
});
