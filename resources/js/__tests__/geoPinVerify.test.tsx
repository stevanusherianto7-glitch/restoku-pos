import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { GeoPinVerify } from '../Components/POS/GeoPinVerify';

const geoStub = {
    latitude: -6.2,
    longitude: 106.816666,
    geo_radius_meters: 50,
};

beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
});

describe('GeoPinVerify', () => {
    it('renders PIN input + Verifikasi button', () => {
        render(<GeoPinVerify geo={geoStub} />);
        expect(screen.getByPlaceholderText('PIN')).toBeInTheDocument();
        expect(screen.getByText('Verifikasi')).toBeInTheDocument();
        expect(screen.getByText(/Perlu Verifikasi/)).toBeInTheDocument();
    });

    it('rejects non-4-digit PIN before calling API', async () => {
        const fetchSpy = vi.fn();
        vi.stubGlobal('fetch', fetchSpy);
        render(<GeoPinVerify geo={geoStub} />);

        const input = screen.getByPlaceholderText('PIN');
        await act(async () => {
            fireEvent.change(input, { target: { value: '12' } });
        });
        await act(async () => {
            fireEvent.click(screen.getByText('Verifikasi'));
        });

        expect(fetchSpy).not.toHaveBeenCalled();
        expect(screen.getByText(/PIN harus 4 digit/)).toBeInTheDocument();
    });

    it('verifies with correct PIN (GPS within radius) → Terverifikasi', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn((_url: any, opts: any) => {
                const body = JSON.parse(opts.body);
                expect(body.pin).toBe('1234');
                return Promise.resolve({
                    ok: true,
                    json: () =>
                        Promise.resolve({
                            verified: true,
                            pin_ok: true,
                            gps_provided: true,
                            within_radius: true,
                            distance_m: 10,
                            method: 'GPS',
                        }),
                });
            }) as any,
        );

        const geoSuccess = vi.fn((success: any) =>
            success({ coords: { latitude: -6.19991, longitude: 106.816666, accuracy: 10 } }),
        );
        vi.stubGlobal('navigator', { geolocation: { getCurrentPosition: geoSuccess } });

        render(<GeoPinVerify geo={geoStub} verifyUrl="/api/cashier/verify-location" />);

        const input = screen.getByPlaceholderText('PIN');
        await act(async () => {
            fireEvent.change(input, { target: { value: '1234' } });
        });
        await act(async () => {
            fireEvent.click(screen.getByText('Verifikasi'));
        });
        await act(async () => {
            await new Promise((r) => setTimeout(r, 20));
        });

        expect(screen.getByText('Terverifikasi')).toBeInTheDocument();
        expect(screen.getByText(/10m/)).toBeInTheDocument();
    });

    it('fails with wrong PIN → Belum + error message', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ verified: false, pin_ok: false, message: 'PIN salah.' }),
                }),
            ) as any,
        );
        // GPS ditolak → fallback PIN saja
        vi.stubGlobal('navigator', {
            geolocation: { getCurrentPosition: (_s: any, err: any) => err({ code: 1 }) },
        });

        render(<GeoPinVerify geo={geoStub} verifyUrl="/api/cashier/verify-location" />);

        const input = screen.getByPlaceholderText('PIN');
        await act(async () => {
            fireEvent.change(input, { target: { value: '9999' } });
        });
        await act(async () => {
            fireEvent.click(screen.getByText('Verifikasi'));
        });
        await act(async () => {
            await new Promise((r) => setTimeout(r, 20));
        });

        expect(screen.getByText('Belum')).toBeInTheDocument();
        expect(screen.getByText(/PIN salah/)).toBeInTheDocument();
    });
});
