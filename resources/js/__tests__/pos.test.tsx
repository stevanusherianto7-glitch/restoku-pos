import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

const mockUsePage = vi.hoisted(() => vi.fn());
const mockUseTenantSettings = vi.hoisted(() => vi.fn());
const mockCart = vi.hoisted(() => ({
    items: [] as any[],
    addItem: vi.fn(),
    removeItem: vi.fn(),
    updateQty: vi.fn(),
    clear: vi.fn(),
    loadCartItems: vi.fn(),
    total: 0,
}));
vi.mock('@inertiajs/react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@inertiajs/react')>();
    return {
        ...actual,
        Head: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        usePage: mockUsePage,
    };
});
vi.mock('../Components/Shared', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../Components/Shared')>();
    return { ...actual, useTenantSettings: mockUseTenantSettings };
});
vi.mock('../Hooks/useCart', () => ({
    useCart: () => mockCart,
}));
vi.mock('../Components/POS/ReceiptPreview', () => ({
    ReceiptPreview: () => <div data-testid="receipt">Receipt</div>,
}));
vi.mock('../Components/POS/GeminiCopilotWidget', () => ({ default: () => null }));
vi.mock('../Components/RoleGuard', () => ({
    RoleGuard: ({ children }: any) => <>{children}</>,
}));

import POSPage from '../Pages/POS/Index';

const MENU = [
    { id: 1, name: 'Nasi Goreng Spesial', price: 25000, category: 'Makanan', photo_url: null },
    { id: 2, name: 'Es Teh Manis', price: 5000, category: 'Minuman', photo_url: null },
];

beforeEach(() => {
    localStorage.clear();
    // POS gating: butuh sesi kasir buka supaya menu tampil (lihat CashierSession).
    localStorage.setItem('kasir_shift_open', 'true');
    vi.clearAllMocks();
    mockCart.items = [];
    mockCart.addItem.mockImplementation((it: any) => mockCart.items.push(it));
    mockUseTenantSettings.mockReturnValue({ screenMode: 'default' });
    mockUsePage.mockImplementation(() => ({
        props: {
            auth: { user: { role: 'kasir', name: 'Kasir' } },
            outlet_settings: { tax_type: 'pbjt', is_tax_active: true, tax_rate: 10, service_charge: 5 },
            posMenu: [
                { id: 1, name: 'Nasi Goreng Spesial', price: 25000, category: 'Makanan', photo_url: null },
                { id: 2, name: 'Es Teh Manis', price: 5000, category: 'Minuman', photo_url: null },
            ],
        },
    }));
    // stub fetch: queue + order load + print + delete + reservations
    vi.stubGlobal(
        'fetch',
        vi.fn((input: any) => {
            const url = String(input);
            if (url.includes('/api/cashier-queue') && !url.includes('/api/cashier-queue/')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ queue: [] }) });
            }
            if (url.includes('/api/orders/')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ order: { items: [] }, items: [] }) });
            }
            if (url.includes('/api/print-receipt')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ ok: true }) });
            }
            if (url.includes('reservation')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve([]) });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        }) as any,
    );
});

describe('POS/Index', () => {
    it('renders POS with menu catalog', () => {
        render(<POSPage posMenu={MENU} />);
        expect(screen.getByText(/Nasi Goreng/i)).toBeInTheDocument();
        expect(screen.getByText(/Es Teh/i)).toBeInTheDocument();
    });

    it('adds an item to cart', () => {
        render(<POSPage posMenu={MENU} />);
        fireEvent.click(screen.getByText(/Nasi Goreng/i));
        expect(mockCart.addItem).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'Nasi Goreng Spesial', price: 25000 }),
        );
    });

    it('adds ad-hoc item', () => {
        render(<POSPage posMenu={MENU} />);
        fireEvent.change(screen.getByPlaceholderText(/nama item/i), { target: { value: 'Item X' } });
        fireEvent.change(screen.getByPlaceholderText(/harga/i), { target: { value: '12000' } });
        fireEvent.click(screen.getByRole('button', { name: /tambah/i }));
        expect(mockCart.addItem).toHaveBeenCalledWith(expect.objectContaining({ name: 'Item X', price: 12000 }));
    });

    it('selects a payment method', () => {
        render(<POSPage posMenu={MENU} />);
        fireEvent.click(screen.getByText(/Tunai|Cash/i));
        // payment state berubah (tidak crash)
        expect(screen.getByText(/Nasi Goreng/i)).toBeInTheDocument();
    });

    it('has two tab navigations: Display Menu and Antrean Siap Bayar', () => {
        render(<POSPage posMenu={MENU} />);
        expect(screen.getByRole('button', { name: /Display Menu/i })).toBeInTheDocument();
        const queueTab = screen.getByRole('button', { name: /Antrean Siap Bayar/i });
        expect(queueTab).toBeInTheDocument();
        // default tab = menu (Nasi Goreng tampil)
        expect(screen.getByText(/Nasi Goreng/i)).toBeInTheDocument();
        // klik tab antrean → menu grid disembunyi, tampil pesan kosong antrean
        fireEvent.click(queueTab);
        expect(screen.getByText(/Belum ada meja yang siap bayar/i)).toBeInTheDocument();
    });

    it('shows served queue tables in Antrean tab', async () => {
        const queue = [
            {
                id: 'ORD-1',
                table: 'A1',
                status: 'Siap Bayar',
                tone: 'emerald',
                time: 5,
                items: ['2x Nasi Goreng', '1x Es Teh'],
            },
        ];
        vi.stubGlobal(
            'fetch',
            vi.fn((input: any) => {
                const url = String(input);
                if (url.includes('/api/cashier-queue') && !url.includes('/api/cashier-queue/')) {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve({ queue }) });
                }
                if (url.includes('/api/orders/')) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({ order: { items: [] }, items: [] }),
                    });
                }
                return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
            }) as any,
        );
        render(<POSPage posMenu={MENU} />);
        fireEvent.click(screen.getByRole('button', { name: /Antrean Siap Bayar/i }));
        await waitFor(() => expect(screen.getByText(/A1/)).toBeInTheDocument());
        expect(screen.getByText(/2x Nasi Goreng/)).toBeInTheDocument();
    });

    it('handles queue tables with null table or takeaway table name safely', async () => {
        const queue = [
            {
                id: 'ORD-T1',
                table: 'Meja TakeAway 1',
                status: 'Siap Bayar',
                tone: 'emerald',
                time: 3,
                items: ['1x Es Teh'],
            },
            {
                id: 'ORD-T2',
                table: null as any,
                status: 'Siap Bayar',
                tone: 'emerald',
                time: 4,
                items: ['1x Nasi Goreng'],
            },
        ];
        vi.stubGlobal(
            'fetch',
            vi.fn((input: any) => {
                const url = String(input);
                if (url.includes('/api/cashier-queue')) {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve({ queue }) });
                }
                return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
            }) as any,
        );
        render(<POSPage posMenu={MENU} />);
        fireEvent.click(screen.getByRole('button', { name: /Antrean Siap Bayar/i }));
        await waitFor(() => expect(screen.getByText(/Take Away/i)).toBeInTheDocument());
        expect(screen.getByText(/1x Nasi Goreng/)).toBeInTheDocument();
    });
});
