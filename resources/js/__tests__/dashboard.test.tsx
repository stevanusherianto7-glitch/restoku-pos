import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import Dashboard from '../Pages/Dashboard/Index';

const mockUsePage = vi.hoisted(() => vi.fn());
vi.mock('@inertiajs/react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@inertiajs/react')>();
    return { ...actual, Head: ({ children }: { children: React.ReactNode }) => <>{children}</>, usePage: mockUsePage };
});

// Dashboard membaca outlet name via usePage().props.outlet.name di Screen
beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockUsePage.mockImplementation(() => ({
        props: { outlet: { name: 'Cabang A' }, auth: { user: { role: 'owner' } } },
    }));
    vi.stubGlobal('fetch', vi.fn().mockResolvedValue({ ok: true, json: async () => [] }));
});

describe('Dashboard/Index', () => {
    it('renders dashboard title and key widgets', async () => {
        render(<Dashboard />);
        await waitFor(() => expect(screen.getAllByText(/Dashboard/i).length).toBeGreaterThan(0));
        expect(screen.getAllByText(/Omset/i).length).toBeGreaterThan(0);
    });

    it('switches timeframe (Hari Ini)', async () => {
        render(<Dashboard />);
        await waitFor(() => expect(screen.getAllByText(/Dashboard/i).length).toBeGreaterThan(0));
        fireEvent.click(screen.getByText('Hari Ini'));
        expect(screen.getByText('Hari Ini')).toBeInTheDocument();
    });

    it('renders revenue chart SVG', async () => {
        render(<Dashboard />);
        await waitFor(() => expect(screen.getAllByText(/Omset/i).length).toBeGreaterThan(0));
        expect(document.querySelector('polyline')).not.toBeNull();
    });
});
