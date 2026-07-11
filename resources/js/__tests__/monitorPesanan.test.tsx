import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MonitorPesanan from '../Pages/MonitorPesanan/Index';

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
};

// fetch mock cerdas: MainLayout fetch /api/reservations (butuh array .filter); Page fetch /api/orders (grouped)
const makeFetch = (ordersGrouped: any) => {
    return vi.fn((input: any) => {
        const url = String(input);
        if (url.includes('/api/reservations')) return Promise.resolve({ ok: true, json: async () => [] });
        if (url.includes('/api/orders'))
            return Promise.resolve({ ok: true, json: async () => ({ grouped: ordersGrouped }) });
        return Promise.resolve({ ok: true, json: async () => ({}) });
    });
};

const sampleGrouped = {
    dine_in: [{ id: 'ORD-1', table: 'A1', status: 'Baru', tone: 'amber', time: 3, items: ['Nasi Goreng'] }],
    take_away: [{ id: 'ORD-2', table: 'TakeAway #1', status: 'Baru', tone: 'emerald', time: 1, items: ['Es Teh'] }],
};

beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    setAuth('manager');
});

describe('MonitorPesanan/Index', () => {
    it('renders orders from grouped API', async () => {
        vi.stubGlobal('fetch', makeFetch(sampleGrouped));
        render(<MonitorPesanan />);
        await waitFor(() => expect(screen.getByText('ORD-1')).toBeInTheDocument());
        expect(screen.getByText('ORD-2')).toBeInTheDocument();
    });

    it('filters dine_in only', async () => {
        vi.stubGlobal('fetch', makeFetch(sampleGrouped));
        render(<MonitorPesanan />);
        await waitFor(() => expect(screen.getByText('ORD-1')).toBeInTheDocument());
        fireEvent.click(screen.getAllByRole('button', { name: /Makan Di Sini \(Dine In\)/ })[0]);
        expect(screen.getByText('ORD-1')).toBeInTheDocument();
        expect(screen.queryByText('ORD-2')).not.toBeInTheDocument();
    });

    it('shows empty state when no orders', async () => {
        vi.stubGlobal('fetch', makeFetch({}));
        render(<MonitorPesanan />);
        await waitFor(() => expect(screen.getByText('Belum Ada Pesanan Masuk')).toBeInTheDocument());
    });

    it('refreshes on button click', async () => {
        const fetchMock = makeFetch(sampleGrouped);
        vi.stubGlobal('fetch', fetchMock);
        render(<MonitorPesanan />);
        await waitFor(() => expect(screen.getByText('ORD-1')).toBeInTheDocument());
        fireEvent.click(screen.getByText('Muat Ulang'));
        await waitFor(() => expect(fetchMock.mock.calls.length).toBeGreaterThan(1));
    });
});
