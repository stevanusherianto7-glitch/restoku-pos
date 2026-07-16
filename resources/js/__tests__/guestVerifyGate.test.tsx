import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, waitFor } from '@testing-library/react';

// Mock react inertia Head (jika dipakai) — GuestVerifyGate tidak pakai, tapi amankan.
vi.mock('@inertiajs/react', async (importOriginal) => {
    const actual = await importOriginal<typeof import('@inertiajs/react')>();
    return { ...actual, Head: ({ children }: { children: React.ReactNode }) => <>{children}</> };
});

import { GuestVerifyGate } from '../Components/GuestVerifyGate';

beforeEach(() => {
    localStorage.clear();
    vi.clearAllMocks();
});

describe('GuestVerifyGate — autofill PIN Harian', () => {
    it('otomatis mengisi PIN Harian dari /api/guest/daily-pin', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn((input: any) => {
                const url = String(input);
                if (url.includes('/api/guest/daily-pin')) {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve({ pin: '7264' }) });
                }
                return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
            }) as any,
        );

        render(<GuestVerifyGate slug="pawon-salam" tableLabel="A3" onVerified={() => {}} />);

        await waitFor(() => expect(screen.getByDisplayValue('7264')).toBeInTheDocument());
        // Badge OTOMATIS muncul
        expect(screen.getByText('OTOMATIS')).toBeInTheDocument();
    });

    it('tetap bisa diisi manual kalau API gagal (tanpa crash)', async () => {
        vi.stubGlobal('fetch', vi.fn(() => Promise.reject(new Error('network'))) as any);

        render(<GuestVerifyGate slug="pawon-salam" tableLabel="A3" onVerified={() => {}} />);

        // Tidak ada badge OTOMATIS, input tetap bisa diketik
        await waitFor(() => expect(screen.queryByText('OTOMATIS')).toBeNull());
        // ada 2 input PIN (Meja + Harian), keduanya placeholder ••••
        const inputs = screen.getAllByPlaceholderText('••••');
        expect(inputs.length).toBe(2);
    });

    it('setelah verify sukses, menyimpan table_session & memulai poll', async () => {
        const onVerified = vi.fn();
        // jsdom tidak punya geolocation -> stub supaya gpsStatus='ok'
        Object.defineProperty(navigator, 'geolocation', {
            value: { getCurrentPosition: (cb: any) => cb({ coords: { latitude: 0, longitude: 0, accuracy: 10 } }) },
            configurable: true,
        });
        vi.stubGlobal(
            'fetch',
            vi.fn((input: any, init?: any) => {
                const url = String(input);
                if (url.includes('/api/guest/daily-pin')) {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve({ pin: '7264' }) });
                }
                if (url.includes('/api/guest/verify')) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({ ok: true, token: 'tok123', table_session: 'sess-abc' }),
                    });
                }
                if (url.includes('/api/guest/table-session')) {
                    // token masih sama -> sesi valid (tidak expire)
                    return Promise.resolve({ ok: true, json: () => Promise.resolve({ table_session: 'sess-abc' }) });
                }
                return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
            }) as any,
        );

        render(<GuestVerifyGate slug="pawon-salam" tableLabel="A3" onVerified={onVerified} />);

        await waitFor(() => expect(screen.getByDisplayValue('7264')).toBeInTheDocument());

        // isi PIN Meja via native setter + input event
        const pins = screen.getAllByPlaceholderText('••••');
        const tablePin = pins[0] as HTMLInputElement;
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
        setter.call(tablePin, '6565');
        tablePin.dispatchEvent(new Event('input', { bubbles: true }));

        await waitFor(() => expect(screen.getByText('Verifikasi & Buka Pesanan')).toBeInTheDocument());

        // klik tombol verify (wrap dalam act via fireEvent)
        const { fireEvent } = await import('@testing-library/react');
        fireEvent.click(screen.getByText('Verifikasi & Buka Pesanan'));

        await waitFor(() => expect(onVerified).toHaveBeenCalledWith('tok123'));
        // localStorage menyimpan table_session
        const saved = JSON.parse(localStorage.getItem('restoku_guest_verify')!);
        expect(saved.table_session).toBe('sess-abc');
    });

    it('poll mendeteksi token meja berubah (tamu baru) -> sesi kedaluwarsa', async () => {
        const onVerified = vi.fn();
        vi.stubGlobal(
            'fetch',
            vi.fn((input: any) => {
                const url = String(input);
                if (url.includes('/api/guest/daily-pin')) {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve({ pin: '7264' }) });
                }
                if (url.includes('/api/guest/verify')) {
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({ ok: true, token: 'tokX', table_session: 'sess-OLD' }),
                    });
                }
                if (url.includes('/api/guest/table-session')) {
                    // tamu baru scan -> token BERUBAH
                    return Promise.resolve({ ok: true, json: () => Promise.resolve({ table_session: 'sess-NEW' }) });
                }
                return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
            }) as any,
        );

        // pre-seed localStorage supaya komponen restore ke status ok lalu poll
        localStorage.setItem(
            'restoku_guest_verify',
            JSON.stringify({
                slug: 'pawon-salam',
                table: 'A3',
                token: 'tokX',
                table_session: 'sess-OLD',
                exp: Date.now() + 6 * 3600 * 1000,
            }),
        );

        render(<GuestVerifyGate slug="pawon-salam" tableLabel="A3" onVerified={onVerified} />);

        // poll interval 10s — kita tidak bisa menunggu, tapi fetch pertama (poll()) langsung dipanggil
        await waitFor(() => expect(screen.getByText(/meja diakses tamu lain/)).toBeInTheDocument(), { timeout: 4000 });
    });

    it('double-submit verify tidak memicu false-invalidate (race aman)', async () => {
        let verifyCount = 0;
        const onVerified = vi.fn();
        vi.stubGlobal(
            'fetch',
            vi.fn((input: any) => {
                const url = String(input);
                if (url.includes('/api/guest/daily-pin')) {
                    return Promise.resolve({ ok: true, json: () => Promise.resolve({ pin: '7264' }) });
                }
                if (url.includes('/api/guest/verify')) {
                    verifyCount++;
                    // tiap verify return token BEDA (simulasi race 2 klik)
                    const tok = verifyCount === 1 ? 'tok-A' : 'tok-B';
                    const sess = verifyCount === 1 ? 'sess-A' : 'sess-B';
                    return Promise.resolve({
                        ok: true,
                        json: () => Promise.resolve({ ok: true, token: tok, table_session: sess }),
                    });
                }
                if (url.includes('/api/guest/table-session')) {
                    // DB pakai token verify terakhir (tokenA, karena busyRef cegah double verify)
                    return Promise.resolve({ ok: true, json: () => Promise.resolve({ table_session: 'sess-A' }) });
                }
                return Promise.resolve({ ok: true, json: () => Promise.resolve({}) });
            }) as any,
        );
        Object.defineProperty(navigator, 'geolocation', {
            value: { getCurrentPosition: (cb: any) => cb({ coords: { latitude: 0, longitude: 0, accuracy: 10 } }) },
            configurable: true,
        });

        render(<GuestVerifyGate slug="pawon-salam" tableLabel="A3" onVerified={onVerified} />);
        await waitFor(() => expect(screen.getByDisplayValue('7264')).toBeInTheDocument());

        const pins = screen.getAllByPlaceholderText('••••');
        const tablePin = pins[0] as HTMLInputElement;
        const setter = Object.getOwnPropertyDescriptor(window.HTMLInputElement.prototype, 'value')!.set!;
        setter.call(tablePin, '6565');
        tablePin.dispatchEvent(new Event('input', { bubbles: true }));
        await waitFor(() => expect(screen.getByText('Verifikasi & Buka Pesanan')).toBeInTheDocument());

        const { fireEvent } = await import('@testing-library/react');
        const btn = screen.getByText('Verifikasi & Buka Pesanan');
        // 2x klik cepat (race double-submit)
        fireEvent.click(btn);
        fireEvent.click(btn);

        // onVerified tetap terpanggil (status ok), TIDAK ada error kedaluwarsa
        await waitFor(() => expect(onVerified).toHaveBeenCalled());
        await new Promise((r) => setTimeout(r, 200));
        expect(screen.queryByText(/meja diakses tamu lain/)).toBeNull();
    });
});
