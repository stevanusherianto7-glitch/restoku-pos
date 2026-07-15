import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';

const mockUseTenantSettings = vi.hoisted(() => vi.fn());
vi.mock('@inertiajs/react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@inertiajs/react')>();
    return {
        ...actual,
        Head: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        usePage: () => ({
            props: { screen_mode: 'nano-banana', tenant_layout: 'default' },
        }),
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

    it('checkout locked "Verifikasi Dulu" before verify', async () => {
        // SEBELUM verify: guestVerified=false -> tombol terkunci
        vi.stubGlobal('window', {
            ...window,
            location: { ...window.location, pathname: '/m/pawon-salam', search: '?t=A3' },
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
        // add item
        fireEvent.click(screen.getByText('Nasi Goreng'));
        await act(async () => {
            await new Promise((r) => setTimeout(r, 30));
        });
        const addBtn = screen.queryByText(/Tambah ke Pesanan/i);
        if (addBtn) fireEvent.click(addBtn);
        await act(async () => {
            await new Promise((r) => setTimeout(r, 30));
        });
        // checkout bar harus terkunci
        expect(screen.getByText(/Verifikasi Dulu/i)).toBeInTheDocument();
        vi.unstubAllGlobals();
    });

    it('checkout active "Kirim Pesanan Ke Dapur" after guestVerified (localStorage restore)', async () => {
        // SETELAH verify: token di localStorage -> guestVerified=true -> langsung app
        localStorage.setItem(
            'restoku_guest_verify',
            JSON.stringify({ slug: 'pawon-salam', table: 'A3', token: 'TESTTOKEN', exp: Date.now() + 15 * 60 * 1000 }),
        );
        vi.stubGlobal('window', {
            ...window,
            location: { ...window.location, pathname: '/m/pawon-salam', search: '?t=A3' },
        });
        render(<CustomerView />);
        await act(async () => {
            await new Promise((r) => setTimeout(r, 150));
        });
        // guestVerified -> skip landing, langsung app
        fireEvent.click(screen.getByText('Nasi Goreng'));
        await act(async () => {
            await new Promise((r) => setTimeout(r, 30));
        });
        const addBtn = screen.queryByText(/Tambah ke Pesanan/i);
        if (addBtn) fireEvent.click(addBtn);
        await act(async () => {
            await new Promise((r) => setTimeout(r, 30));
        });
        // buka cart tab supaya button checkout (dalam cart section) ter-render
        const cartTab = screen.getByTestId('cart-tab');
        fireEvent.click(cartTab);
        await act(async () => {
            await new Promise((r) => setTimeout(r, 30));
        });
        // checkout sekarang aktif
        expect(screen.getByText(/Kirim Pesanan Ke Dapur/i)).toBeInTheDocument();
        vi.unstubAllGlobals();
    });

    it('GuestVerifyGate appears in cart tab when item added & unverified', async () => {
        vi.stubGlobal('window', {
            ...window,
            location: { ...window.location, pathname: '/m/pawon-salam', search: '?t=A3' },
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
        // add item
        fireEvent.click(screen.getByText('Nasi Goreng'));
        await act(async () => {
            await new Promise((r) => setTimeout(r, 30));
        });
        const addBtn = screen.queryByText(/Tambah ke Pesanan/i);
        if (addBtn) fireEvent.click(addBtn);
        await act(async () => {
            await new Promise((r) => setTimeout(r, 30));
        });
        // buka cart tab (data-testid=cart-tab)
        const cartTab = screen.getByTestId('cart-tab');
        fireEvent.click(cartTab);
        await act(async () => {
            await new Promise((r) => setTimeout(r, 30));
        });
        // GuestVerifyGate (satu-satunya gate) harus muncul
        expect(screen.getByText(/VERIFIKASI KEHADIRAN/i)).toBeInTheDocument();
        expect(screen.getByText(/PIN Meja/i)).toBeInTheDocument();
        expect(screen.getByText(/PIN Harian Restoran/i)).toBeInTheDocument();
        vi.unstubAllGlobals();
    });
});
