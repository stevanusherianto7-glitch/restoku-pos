import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';

const mockUseTenantSettings = vi.hoisted(() => vi.fn());
vi.mock('@inertiajs/react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@inertiajs/react')>();
    return {
        ...actual,
        Head: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    };
});
vi.mock('../Components/Shared', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../Components/Shared')>();
    return { ...actual, useTenantSettings: mockUseTenantSettings };
});

import CustomerView from '../Pages/BukuMenuDigital/CustomerView';

beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    mockUseTenantSettings.mockReturnValue({
        tenantName: 'Restoku',
        screenMode: 'default',
        tenantLayout: 'default',
        renderLogo: () => null,
    });
    vi.stubGlobal(
        'fetch',
        vi.fn((input: any) => {
            const url = String(input);
            if (url.includes('/api/menu')) {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            menu: [
                                {
                                    id: 1,
                                    name: 'Nasi Goreng',
                                    price: 25000,
                                    category: { name: 'Makanan' },
                                    photo_url: null,
                                },
                                { id: 2, name: 'Es Teh', price: 5000, category: { name: 'Minuman' }, photo_url: null },
                            ],
                        }),
                });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        }) as any,
    );
});

describe('BukuMenuDigital/CustomerView', () => {
    it('renders fallback menu when API empty', async () => {
        // force fetch gagal supaya fallback muncul
        vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('offline'))) as any);
        render(<CustomerView />);
        await new Promise((r) => setTimeout(r, 50));
        expect(screen.getByText('Nasi Goreng Spesial')).toBeInTheDocument();
    });

    it('loads menu from API', async () => {
        render(<CustomerView />);
        await new Promise((r) => setTimeout(r, 50));
        expect(screen.getByText('Nasi Goreng')).toBeInTheDocument();
        // default kategori Makanan -> klik Minuman untuk lihat Es Teh
        fireEvent.click(screen.getByText('Minuman'));
        expect(screen.getByText('Es Teh')).toBeInTheDocument();
    });

    it('filters by category', async () => {
        render(<CustomerView />);
        await new Promise((r) => setTimeout(r, 50));
        fireEvent.click(screen.getByText('Minuman'));
        expect(screen.getByText('Es Teh')).toBeInTheDocument();
        expect(screen.queryByText('Nasi Goreng')).not.toBeInTheDocument();
    });

    it('shows cart and adds item', async () => {
        render(<CustomerView />);
        await new Promise((r) => setTimeout(r, 50));
        fireEvent.click(screen.getByText('Nasi Goreng'));
        // keranjang muncul (Pesan / cart badge)
        expect(screen.getAllByText(/Pesan|Keranjang|Cart/i).length).toBeGreaterThan(0);
    });
});
