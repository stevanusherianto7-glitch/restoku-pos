import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

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
            if (url.includes('/api/guest/daily-pin')) {
                return Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ pin: '7264' }),
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

    it('walks landing -> welcome -> howto flow', async () => {
        render(<CustomerView />);
        await act(async () => {
            await new Promise((r) => setTimeout(r, 50));
        });
        // landing modal
        expect(screen.getByText(/Cita rasa Jawa/i)).toBeInTheDocument();
        await act(async () => {
            fireEvent.click(screen.getByText(/Masuk ke Menu/i));
        });
        // welcome screen
        expect(screen.getByText(/Selamat Datang/i)).toBeInTheDocument();
        expect(screen.getByText(/Meja A3/)).toBeInTheDocument();
        await act(async () => {
            fireEvent.click(screen.getByText(/Lanjut/i));
        });
        // howto screen
        expect(screen.getByText(/Cara Memesan/i)).toBeInTheDocument();
        expect(screen.getByText(/Kirim Pesanan/i)).toBeInTheDocument();
    });

    it('reads table from ?t= param (QR generator format)', async () => {
        // Simulasikan URL QR: /m/slug?t=A1, lalu lewati landing -> welcome
        vi.stubGlobal('window', {
            ...window,
            location: { ...window.location, search: '?t=A1' },
        });
        render(<CustomerView />);
        await act(async () => {
            await new Promise((r) => setTimeout(r, 50));
        });
        // landing -> welcome
        fireEvent.click(screen.getByText(/Masuk ke Menu/i));
        await act(async () => {
            await new Promise((r) => setTimeout(r, 50));
        });
        expect(screen.getByText(/Meja A1/)).toBeInTheDocument();
        vi.unstubAllGlobals();
    });

    it('reads table from legacy ?table= param (backward-compat)', async () => {
        vi.stubGlobal('window', {
            ...window,
            location: { ...window.location, search: '?table=B2' },
        });
        render(<CustomerView />);
        await act(async () => {
            await new Promise((r) => setTimeout(r, 50));
        });
        fireEvent.click(screen.getByText(/Masuk ke Menu/i));
        await act(async () => {
            await new Promise((r) => setTimeout(r, 50));
        });
        expect(screen.getByText(/Meja B2/)).toBeInTheDocument();
        vi.unstubAllGlobals();
    });

    it('verifies dine-in with correct daily PIN (fetches from BE, not hardcoded)', async () => {
        vi.stubGlobal('window', {
            ...window,
            location: { ...window.location, pathname: '/m/pawon-salam-bandung', search: '' },
        });
        render(<CustomerView />);
        await act(async () => {
            await new Promise((r) => setTimeout(r, 150));
        });
        // landing -> welcome -> howto -> app
        fireEvent.click(screen.getByText(/Masuk ke Menu/i));
        await act(async () => {
            await new Promise((r) => setTimeout(r, 30));
        });
        fireEvent.click(screen.getByText(/Lanjut/i));
        await act(async () => {
            await new Promise((r) => setTimeout(r, 30));
        });
        fireEvent.click(screen.getByText(/Mulai Pesan Sekarang/i));
        await act(async () => {
            await new Promise((r) => setTimeout(r, 30));
        });

        // Modal verifikasi dine-in harus muncul
        expect(screen.getByText(/VERIFIKASI DINE-IN/i)).toBeInTheDocument();

        // Masukkan PIN harian dari BE (7264) via keypad
        for (const d of ['7', '2', '6', '4']) {
            fireEvent.click(screen.getByText(d, { selector: 'button' }));
        }
        fireEvent.click(screen.getByText(/VERIFIKASI PIN/i));
        await act(async () => {
            await new Promise((r) => setTimeout(r, 30));
        });

        // Modal harus tertutup (verifikasi sukses)
        expect(screen.queryByText(/VERIFIKASI DINE-IN/i)).not.toBeInTheDocument();
        vi.unstubAllGlobals();
    });

    it('rejects wrong daily PIN (modal stays open)', async () => {
        vi.stubGlobal('window', {
            ...window,
            location: { ...window.location, pathname: '/m/pawon-salam-bandung', search: '' },
        });
        render(<CustomerView />);
        await act(async () => {
            await new Promise((r) => setTimeout(r, 150));
        });
        fireEvent.click(screen.getByText(/Masuk ke Menu/i));
        await act(async () => {
            await new Promise((r) => setTimeout(r, 30));
        });
        fireEvent.click(screen.getByText(/Lanjut/i));
        await act(async () => {
            await new Promise((r) => setTimeout(r, 30));
        });
        fireEvent.click(screen.getByText(/Mulai Pesan Sekarang/i));
        await act(async () => {
            await new Promise((r) => setTimeout(r, 30));
        });

        expect(screen.getByText(/VERIFIKASI DINE-IN/i)).toBeInTheDocument();

        // PIN salah (0000, bukan 7264 dari BE)
        for (const d of ['0', '0', '0', '0']) {
            fireEvent.click(screen.getByText(d, { selector: 'button' }));
        }
        fireEvent.click(screen.getByText(/VERIFIKASI PIN/i));
        await act(async () => {
            await new Promise((r) => setTimeout(r, 30));
        });

        // Modal tetap terbuka
        expect(screen.getByText(/VERIFIKASI DINE-IN/i)).toBeInTheDocument();
        vi.unstubAllGlobals();
    });
});
