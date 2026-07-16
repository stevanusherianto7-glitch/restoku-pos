import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import KDS from '../Pages/KDS/Index';

const mockUsePage = vi.hoisted(() => vi.fn());
vi.mock('@inertiajs/react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@inertiajs/react')>();
    return { ...actual, Head: ({ children }: { children: any }) => <>{children}</>, usePage: mockUsePage };
});

const setAuth = (role: string) => {
    mockUsePage.mockImplementation(() => ({ props: { outlet: { name: 'Cabang A' }, auth: { user: { role } } } }));
};

const grouped = {
    'Antrian Masuk': [
        {
            id: 'ORD-1',
            table: 'A1',
            status: 'Antrian Masuk',
            tone: 'amber',
            time: 5,
            items: [
                {
                    id: 'IT-1',
                    name: 'Nasi Goreng',
                    qty: 2,
                    notes: 'pedas',
                    cook_status: 'dikonfirmasi',
                    cook_label: 'dikonfirmasi',
                    cook_step: 1,
                },
            ],
        },
    ],
    Diterima: [],
    'Sedang Dimasak': [],
    'Selesai Masak': [],
    'Siap Sajikan': [],
};

beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    setAuth('owner');
    vi.stubGlobal('fetch', (input: any, init?: any) => {
        if (String(input).includes('/api/reservations')) {
            return Promise.resolve({ ok: true, json: async () => [] });
        }
        return Promise.resolve({ ok: true, json: async () => ({ grouped }) });
    });
    // jsdom lacks speechSynthesis; stub it
    Object.defineProperty(window, 'speechSynthesis', { value: { speak: vi.fn() }, configurable: true });
});

describe('KDS/Index', () => {
    it('allows owner and renders KDS board', async () => {
        render(<KDS />);
        await waitFor(() => expect(screen.getByText('Kitchen Display System')).toBeInTheDocument());
        expect(screen.getByText('ORD-1')).toBeInTheDocument();
        expect(screen.getByText('A1')).toBeInTheDocument();
    });

    it('allows kitchen staff via activeKaryawan', async () => {
        setAuth('kasir');
        localStorage.setItem('activeKaryawan', JSON.stringify({ name: 'Joko', role: 'kitchen' }));
        render(<KDS />);
        await waitFor(() => expect(screen.getByText('Kitchen Display System')).toBeInTheDocument());
    });

    it('denies unauthorized role', async () => {
        setAuth('kasir');
        localStorage.setItem('activeKaryawan', JSON.stringify({ name: 'Sari', role: 'kasir' }));
        render(<KDS />);
        await waitFor(() => expect(screen.getByText('Akses Ditolak')).toBeInTheDocument());
    });

    it('advances item cook status via PUT', async () => {
        const putMock = vi
            .fn()
            .mockResolvedValue({ ok: true, json: async () => ({ success: true, cook_status: 'sedang_dimasak' }) });
        vi.stubGlobal('fetch', (input: any, init?: any) => {
            if (String(input).includes('/order-items/') && init?.method === 'PUT') return putMock();
            if (String(input).includes('/api/reservations')) return Promise.resolve({ ok: true, json: async () => [] });
            // fetchOrders setelah PUT → /api/orders
            return Promise.resolve({ ok: true, json: async () => ({ grouped }) });
        });
        render(<KDS />);
        await waitFor(() => expect(screen.getByText('SEDANG DIMASAK')).toBeInTheDocument());
        fireEvent.click(screen.getByText('SEDANG DIMASAK'));
        await waitFor(() => expect(putMock).toHaveBeenCalled());
    });

    it('toggles TTS sound', async () => {
        render(<KDS />);
        await waitFor(() => expect(screen.getByText(/Suara Pesanan/)).toBeInTheDocument());
        fireEvent.click(screen.getByText(/Suara Pesanan/));
        expect(screen.getByText(/Suara Pesanan/)).toBeInTheDocument();
    });
});
