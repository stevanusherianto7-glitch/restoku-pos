import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

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
        },
    }));
    // stub fetch (cashier-queue + loadOrder)
    vi.stubGlobal(
        'fetch',
        vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({ queue: [] }) })) as any,
    );
});

describe('POS/Index', () => {
    it('renders POS with menu catalog', () => {
        render(<POSPage />);
        expect(screen.getByText('Nasi Goreng Spesial')).toBeInTheDocument();
        expect(screen.getByText('Es Teh Manis')).toBeInTheDocument();
    });

    it('adds an item to cart', () => {
        render(<POSPage />);
        fireEvent.click(screen.getByText('Nasi Goreng Spesial'));
        expect(mockCart.addItem).toHaveBeenCalledWith(
            expect.objectContaining({ name: 'Nasi Goreng Spesial', price: 25000 }),
        );
    });

    it('adds ad-hoc item', () => {
        render(<POSPage />);
        fireEvent.change(screen.getByPlaceholderText(/nama item/i), { target: { value: 'Item X' } });
        fireEvent.change(screen.getByPlaceholderText(/harga/i), { target: { value: '12000' } });
        fireEvent.click(screen.getByRole('button', { name: /tambah/i }));
        expect(mockCart.addItem).toHaveBeenCalledWith(expect.objectContaining({ name: 'Item X', price: 12000 }));
    });

    it('selects a payment method', () => {
        render(<POSPage />);
        fireEvent.click(screen.getByText(/Tunai|Cash/i));
        // payment state berubah (tidak crash)
        expect(screen.getByText('Nasi Goreng Spesial')).toBeInTheDocument();
    });

    it('filters menu by category', () => {
        render(<POSPage />);
        fireEvent.click(screen.getByText('Minuman'));
        expect(screen.getByText('Es Teh Manis')).toBeInTheDocument();
        expect(screen.queryByText('Nasi Goreng Spesial')).not.toBeInTheDocument();
    });
});
