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

    it('shows correct advance button per cook_step', async () => {
        const grouped2 = {
            'Antrian Masuk': [
                {
                    id: 'ORD-STEP2',
                    table: 'Meja A1',
                    status: 'Sedang Dimasak',
                    tone: 'blue',
                    time: 10,
                    items: [
                        {
                            id: 'IT-2',
                            name: 'Soto',
                            qty: 1,
                            notes: null,
                            cook_status: 'sedang_dimasak',
                            cook_label: 'sedang dimasak',
                            cook_step: 2,
                        },
                    ],
                },
            ],
            Diterima: [],
            'Sedang Dimasak': [],
            'Selesai Masak': [],
            'Siap Sajikan': [],
        };
        vi.stubGlobal('fetch', (input: any, init?: any) => {
            if (String(input).includes('/api/reservations')) return Promise.resolve({ ok: true, json: async () => [] });
            return Promise.resolve({ ok: true, json: async () => ({ grouped: grouped2 }) });
        });
        render(<KDS />);
        // step 2 (sedang_dimasak) → tombol next = "SELESAI MASAK"
        await waitFor(() => expect(screen.getByText(/SELESAI MASAK/i)).toBeInTheDocument());
        // label meja dinormalisasi: "Meja A1" → "A1" (muncul di badge terpisah)
        // wrap dalam waitFor untuk hindari race di CI (render async)
        await waitFor(() => expect(screen.getByText('A1')).toBeInTheDocument());
    });

    it('advances item cook status via PUT', async () => {
        const putCalls: any[] = [];
        vi.stubGlobal('fetch', (input: any, init?: any) => {
            if (String(input).includes('/order-items/') && init?.method === 'PUT') {
                putCalls.push({ input, init });
                return Promise.resolve({
                    ok: true,
                    json: async () => ({ success: true, cook_status: 'sedang_dimasak' }),
                });
            }
            if (String(input).includes('/api/reservations')) return Promise.resolve({ ok: true, json: async () => [] });
            // fetchOrders setelah PUT → /api/orders
            return Promise.resolve({ ok: true, json: async () => ({ grouped }) });
        });
        render(<KDS />);
        await waitFor(() => expect(screen.getByRole('button', { name: /SEDANG DIMASAK/i })).toBeInTheDocument());
        fireEvent.click(screen.getByRole('button', { name: /SEDANG DIMASAK/i }));
        await waitFor(() => expect(putCalls.length).toBeGreaterThan(0));
        // PUT body harus berisi status underscore yg valid utk backend
        const calledBody = JSON.parse(putCalls[0].init.body);
        expect(calledBody.status).toBe('sedang_dimasak');
    });

    it('toggles TTS sound', async () => {
        render(<KDS />);
        await waitFor(() => expect(screen.getByText(/Suara Pesanan/)).toBeInTheDocument());
        fireEvent.click(screen.getByText(/Suara Pesanan/));
        expect(screen.getByText(/Suara Pesanan/)).toBeInTheDocument();
    });
});
