import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';

// Mutable props supaya tiap test bisa ubah outlet tanpa vi.mock di-dalam test.
const pageProps: any = { outlet: { id: 7, name: 'Pawon Salam' }, screen_mode: 'nano-banana' };

vi.mock('@inertiajs/react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@inertiajs/react')>();
    return {
        ...actual,
        Head: ({ children }: { children: React.ReactNode }) => <>{children}</>,
        usePage: () => ({ props: pageProps }),
    };
});

vi.mock('../Components/Shared', async (importOriginal) => {
    const actual = await importOriginal<typeof import('../Components/Shared')>();
    return {
        ...actual,
        useTenantSettings: () => ({
            screenMode: 'default',
            renderLogo: () => null,
            tenantName: 'R',
            tenantLayout: 'default',
        }),
    };
});

import CashierPins from '../Components/CashierPins';

beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
    pageProps.outlet = { id: 7, name: 'Pawon Salam' };
});

describe('CashierPins', () => {
    it('menampilkan PIN Harian dari /owner/outlet/daily-pin', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn((input: any) => {
                const url = String(input);
                if (url.includes('/owner/outlet/daily-pin')) {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve({ pin: '7264' }) });
                }
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ tables: [] }) });
            }) as any,
        );

        render(<CashierPins />);
        await waitFor(() => expect(screen.getByText('7264')).toBeInTheDocument());
        expect(screen.getByText(/PIN Harian/i)).toBeInTheDocument();
    });

    it('PIN Meja dropdown fetch /api/outlet-tables/{outlet} saat diklik', async () => {
        const fetchMock = vi.fn((input: any) => {
            const url = String(input);
            if (url.includes('/owner/outlet/daily-pin')) {
                return Promise.resolve({ ok: true, json: () => Promise.resolve({ pin: '1111' }) });
            }
            if (url.includes('/api/outlet-tables/')) {
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            tables: [
                                { id: 1, label: 'A1', pin: '0188' },
                                { id: 2, label: 'A3', pin: '4271' },
                            ],
                        }),
                });
            }
            return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
        });
        vi.stubGlobal('fetch', fetchMock as any);

        render(<CashierPins />);
        const btn = await screen.findByText(/PIN Meja/i);
        fireEvent.click(btn);

        await waitFor(() => expect(screen.getByText('A3')).toBeInTheDocument());
        expect(screen.getByText('4271')).toBeInTheDocument(); // PIN A3
        expect(screen.getByText('0188')).toBeInTheDocument(); // PIN A1
        // Hanya 1 fetch outlet-tables (saat dibuka).
        expect(fetchMock.mock.calls.filter((c) => String(c[0]).includes('/api/outlet-tables/')).length).toBe(1);
    });

    it('tidak render kalau outlet tidak ada', () => {
        pageProps.outlet = undefined;
        vi.stubGlobal('fetch', vi.fn(() => Promise.resolve({ ok: true, json: () => Promise.resolve({}) })) as any);

        const { container } = render(<CashierPins />);
        expect(container.querySelector('button')).toBeNull();
    });
});
