import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import WaiterBar from '../Pages/WaiterBar/Index';

const mockUsePage = vi.hoisted(() => vi.fn());
vi.mock('@inertiajs/react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@inertiajs/react')>();
    return {
        ...actual,
        Head: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        Link: ({ children, href }: { children: React.ReactNode; href: string }) => <a href={href}>{children}</a>,
        usePage: mockUsePage,
    };
});

const setAuth = (role: string) => {
    mockUsePage.mockImplementation(() => ({ props: { outlet: { name: 'Cabang A' }, auth: { user: { role } } } }));
    localStorage.setItem('activeKaryawan', JSON.stringify({ role }));
};

// Mock cerdas: MainLayout fetch /api/reservations; WaiterBar fetch /api/orders + /api/bar/orders
const makeFetch = (ordersList: any[]) => {
    return vi.fn((input: any) => {
        const url = String(input);
        if (url.includes('/api/reservations')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.includes('/api/bar/orders'))
            // Order campur (food+drink) masuk KDS (dest=kds); bar kosong di skenario ini.
            return Promise.resolve({ ok: true, json: async () => ({ grouped: {}, orders: [] }) });
        if (url.includes('/api/orders'))
            return Promise.resolve({
                ok: true,
                json: async () => ({ grouped: { 'Siap Sajikan': ordersList }, orders: ordersList }),
            });
        if (url.includes('/serve-part')) return Promise.resolve({ ok: true, json: async () => ({ success: true }) });
        return Promise.resolve({ ok: true, json: async () => ({}) });
    });
};

const mixedOrder = {
    id: 'ORD-1',
    table: 'Meja A1',
    status: 'Siap Sajikan',
    tone: 'emerald',
    time: 2,
    items: ['1x Nasi Goreng', '1x Es Teh'],
    has_food: true,
    has_drink: true,
    food_served_at: null,
    drink_served_at: null,
};

beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    setAuth('waiter');
});

describe('WaiterBar/Index', () => {
    it('shows 2 serve buttons (minuman atop, makanan below) for mixed order', async () => {
        vi.stubGlobal('fetch', makeFetch([mixedOrder]));
        render(<WaiterBar />);
        await waitFor(() => expect(screen.getByText('SUDAH SAJIKAN MINUMAN')).toBeInTheDocument());

        const drinkBtn = screen.getByText('SUDAH SAJIKAN MINUMAN');
        const foodBtn = screen.getByText('SUDAH SAJIKAN MAKANAN');
        expect(drinkBtn).toBeInTheDocument();
        expect(foodBtn).toBeInTheDocument();

        // minuman di-render sebelum makanan (urutan DOM)
        const drinkIdx = (drinkBtn.closest('button') as HTMLElement).compareDocumentPosition(
            foodBtn.closest('button') as HTMLElement,
        );
        expect(drinkIdx & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy();
    });

    it('clicking minuman calls serve-part with part=drink', async () => {
        const fetchMock = makeFetch([mixedOrder]);
        vi.stubGlobal('fetch', fetchMock);
        render(<WaiterBar />);
        await waitFor(() => expect(screen.getByText('SUDAH SAJIKAN MINUMAN')).toBeInTheDocument());

        fireEvent.click(screen.getByText('SUDAH SAJIKAN MINUMAN'));
        await waitFor(() => {
            const calls = fetchMock.mock.calls.filter((c) => String(c[0]).includes('/serve-part'));
            expect(calls.length).toBeGreaterThan(0);
            expect(String(calls[0][1].body)).toContain('"part":"drink"');
        });
    });

    it('only shows minuman button for drink-only order', async () => {
        vi.stubGlobal('fetch', makeFetch([{ ...mixedOrder, items: ['1x Es Teh'], has_food: false, has_drink: true }]));
        render(<WaiterBar />);
        await waitFor(() => expect(screen.getByText('SUDAH SAJIKAN MINUMAN')).toBeInTheDocument());
        expect(screen.queryByText('SUDAH SAJIKAN MAKANAN')).not.toBeInTheDocument();
    });
});
