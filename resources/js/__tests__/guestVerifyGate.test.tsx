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
});
