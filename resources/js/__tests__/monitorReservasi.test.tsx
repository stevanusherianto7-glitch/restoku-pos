import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import MonitorReservasi from '../Pages/MonitorReservasi/Index';

const mockUsePage = vi.hoisted(() => vi.fn());
vi.mock('@inertiajs/react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@inertiajs/react')>();
    return { ...actual, Head: ({ children }: { children: React.ReactNode }) => <>{children}</>, usePage: mockUsePage };
});

const setAuth = (role: string) => {
    mockUsePage.mockImplementation(() => ({ props: { outlet: { name: 'Cabang A' }, auth: { user: { role } } } }));
};

// fetch mock cerdas: MainLayout fetch /api/reservations (butuh .filter), Page fetch /api/orders (grouped)
const makeFetch = (ordersGrouped: any) => {
    return vi.fn((input: any) => {
        const url = String(input);
        if (url.includes('/api/reservations')) {
            return Promise.resolve({ ok: true, json: async () => [] });
        }
        if (url.includes('/api/orders')) {
            return Promise.resolve({ ok: true, json: async () => ({ grouped: ordersGrouped }) });
        }
        return Promise.resolve({ ok: true, json: async () => ({}) });
    });
};

beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    setAuth('manager');
    localStorage.setItem('activeKaryawan', JSON.stringify({ name: 'Budi', role: 'manager' }));
});

describe('MonitorReservasi/Index', () => {
    it('renders reservations (falls back to mock when API returns empty)', async () => {
        // MainLayout fetch /api/reservations butuh array; Page fallback ke MOCK bila tidak ada .reservations
        vi.stubGlobal('fetch', (input: any) => {
            if (String(input).includes('/api/reservations')) return Promise.resolve({ ok: true, json: async () => [] });
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });
        render(<MonitorReservasi />);
        await waitFor(() => expect(screen.getByText('Budi Santoso')).toBeInTheDocument());
        expect(screen.getByText('Total Reservasi')).toBeInTheDocument();
    });

    it('filters by search query on mock data', async () => {
        vi.stubGlobal('fetch', (input: any) => {
            if (String(input).includes('/api/reservations')) return Promise.resolve({ ok: true, json: async () => [] });
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });
        render(<MonitorReservasi />);
        await waitFor(() => expect(screen.getByText('Budi Santoso')).toBeInTheDocument());
        fireEvent.change(screen.getByPlaceholderText(/Cari nama/), { target: { value: 'Dewi' } });
        expect(screen.getByText('Dewi Rahayu')).toBeInTheDocument();
        expect(screen.queryByText('Budi Santoso')).not.toBeInTheDocument();
    });

    it('confirms a pending reservation', async () => {
        const statusMock = vi.fn().mockResolvedValue({ ok: true });
        vi.stubGlobal('fetch', (input: any, init?: any) => {
            const url = String(input);
            if (url.includes('/status') && init?.method === 'PUT') return statusMock();
            if (url.includes('/api/reservations')) return Promise.resolve({ ok: true, json: async () => [] });
            return Promise.resolve({ ok: true, json: async () => ({}) });
        });
        render(<MonitorReservasi />);
        await waitFor(() => expect(screen.getAllByText('Konfirmasi').length).toBeGreaterThan(0));
        fireEvent.click(screen.getAllByText('Konfirmasi')[0]);
        await waitFor(() => expect(statusMock).toHaveBeenCalled());
    });

    it('denies access for unauthorized role', async () => {
        setAuth('kitchen');
        localStorage.setItem('activeKaryawan', JSON.stringify({ name: 'Joko', role: 'kitchen' }));
        render(<MonitorReservasi />);
        await waitFor(() => expect(screen.getByText('Akses Ditolak')).toBeInTheDocument());
    });
});
