import { describe, it, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { GuestVerifyGate } from '../Components/GuestVerifyGate';

const geoStub = {
    latitude: -6.2,
    longitude: 106.816666,
    geo_radius_meters: 50,
};

const outletSlug = 'kedai-test';
const tableLabel = 'A1';

beforeEach(() => {
    localStorage.clear();
    vi.restoreAllMocks();
    // default: GPS within radius
    vi.stubGlobal('navigator', {
        geolocation: {
            getCurrentPosition: (cb: any) => cb({ coords: { latitude: -6.2, longitude: 106.816666, accuracy: 10 } }),
        },
    });
});

describe('GuestVerifyGate', () => {
    it('renders VERIFIKASI KEHADIRAN header + 2 PIN inputs', () => {
        render(<GuestVerifyGate slug={outletSlug} tableLabel={tableLabel} geo={geoStub} onVerified={() => {}} />);
        expect(screen.getByText('VERIFIKASI KEHADIRAN')).toBeInTheDocument();
        const pins = screen.getAllByPlaceholderText('••••');
        expect(pins).toHaveLength(2);
        expect(screen.getByText(/PIN Meja/)).toBeInTheDocument();
        expect(screen.getByText(/PIN Harian Restoran/)).toBeInTheDocument();
    });

    it('blocks verify when PIN not 4 digits', async () => {
        const fetchSpy = vi.fn();
        vi.stubGlobal('fetch', fetchSpy);
        render(<GuestVerifyGate slug={outletSlug} tableLabel={tableLabel} geo={geoStub} onVerified={() => {}} />);

        const inputs = screen.getAllByPlaceholderText('••••');
        await act(async () => {
            fireEvent.change(inputs[0], { target: { value: '12' } });
            fireEvent.change(inputs[1], { target: { value: '123' } });
        });
        await act(async () => {
            fireEvent.click(screen.getByText('Verifikasi & Buka Pesanan'));
        });

        expect(fetchSpy).not.toHaveBeenCalled();
        expect(screen.getByText(/Masukkan PIN Meja dan PIN Harian/)).toBeInTheDocument();
    });

    it('verifies successfully → calls onVerified with token', async () => {
        const onVerified = vi.fn();
        vi.stubGlobal(
            'fetch',
            vi.fn(() =>
                Promise.resolve({
                    ok: true,
                    json: () => Promise.resolve({ ok: true, token: 'signed-token-xyz' }),
                }),
            ),
        );
        render(<GuestVerifyGate slug={outletSlug} tableLabel={tableLabel} geo={geoStub} onVerified={onVerified} />);

        const inputs = screen.getAllByPlaceholderText('••••');
        await act(async () => {
            fireEvent.change(inputs[0], { target: { value: '6565' } });
            fireEvent.change(inputs[1], { target: { value: '8843' } });
        });
        await act(async () => {
            fireEvent.click(screen.getByText('Verifikasi & Buka Pesanan'));
        });

        expect(onVerified).toHaveBeenCalledWith('signed-token-xyz');
        expect(screen.getByText(/Terverifikasi/)).toBeInTheDocument();
    });

    it('shows error on wrong PIN (reason pin_table)', async () => {
        vi.stubGlobal(
            'fetch',
            vi.fn(() =>
                Promise.resolve({
                    ok: false,
                    status: 422,
                    json: () => Promise.resolve({ ok: false, reason: 'pin_table' }),
                }),
            ),
        );
        render(<GuestVerifyGate slug={outletSlug} tableLabel={tableLabel} geo={geoStub} onVerified={() => {}} />);

        const inputs = screen.getAllByPlaceholderText('••••');
        await act(async () => {
            fireEvent.change(inputs[0], { target: { value: '0000' } });
            fireEvent.change(inputs[1], { target: { value: '8843' } });
        });
        await act(async () => {
            fireEvent.click(screen.getByText('Verifikasi & Buka Pesanan'));
        });

        expect(screen.getByText(/PIN Meja salah/)).toBeInTheDocument();
    });

    it('blocks when GPS outside radius', async () => {
        vi.stubGlobal('navigator', {
            geolocation: {
                getCurrentPosition: (cb: any) => cb({ coords: { latitude: -7.0, longitude: 107.0, accuracy: 10 } }), // far
            },
        });
        const fetchSpy = vi.fn();
        vi.stubGlobal('fetch', fetchSpy);
        render(<GuestVerifyGate slug={outletSlug} tableLabel={tableLabel} geo={geoStub} onVerified={() => {}} />);

        const inputs = screen.getAllByPlaceholderText('••••');
        await act(async () => {
            fireEvent.change(inputs[0], { target: { value: '6565' } });
            fireEvent.change(inputs[1], { target: { value: '8843' } });
        });
        await act(async () => {
            fireEvent.click(screen.getByText('Verifikasi & Buka Pesanan'));
        });

        expect(fetchSpy).not.toHaveBeenCalled();
        expect(screen.getByText(/Lokasi Anda di luar area restoran/)).toBeInTheDocument();
    });
});
