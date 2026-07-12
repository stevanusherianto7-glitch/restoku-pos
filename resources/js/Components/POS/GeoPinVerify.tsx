import { useState, useEffect } from 'react';
import { MapPinIcon, ShieldAlertIcon, CheckCircle2Icon, LockIcon, XCircleIcon } from '../icons';

type Status = 'idle' | 'verifying' | 'ok' | 'fail';

interface OutletGeo {
    latitude: number | null;
    longitude: number | null;
    geo_radius_meters: number;
}

interface Props {
    geo?: OutletGeo | null;
    /** override endpoint (testing) */
    verifyUrl?: string;
}

// Haversine (mirror DailyPinService di BE, untuk estimasi jarak sisi client)
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const toRad = (x: number) => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

const STORAGE_KEY = 'restoku_geo_verify';

/**
 * Widget verifikasi geolokasi kasir (pojok kanan atas dashboard POS).
 * - Input PIN 4-digit + tombol Verifikasi.
 * - Verifikasi = PIN harian (BE) + (opsional) GPS dalam radius outlet.
 * - Hasil: badge status Terverifikasi / Belum. Tidak memblokir transaksi.
 */
export function GeoPinVerify({ geo, verifyUrl = '/api/cashier/verify-location' }: Props) {
    const [pin, setPin] = useState('');
    const [status, setStatus] = useState<Status>('idle');
    const [distance, setDistance] = useState<number | null>(null);
    const [within, setWithin] = useState<boolean | null>(null);
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);

    // Restore status sesi dari localStorage (kasir tidak verify tiap render)
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const parsed = JSON.parse(saved);
                setStatus(parsed.status ?? 'idle');
                setDistance(parsed.distance ?? null);
                setWithin(parsed.within ?? null);
            }
        } catch {
            /* ignore */
        }
    }, []);

    const persist = (s: Status, d: number | null, w: boolean | null) => {
        setStatus(s);
        setDistance(d);
        setWithin(w);
        try {
            localStorage.setItem(STORAGE_KEY, JSON.stringify({ status: s, distance: d, within: w }));
        } catch {
            /* ignore */
        }
    };

    const handleVerify = () => {
        if (pin.length !== 4 || !/^\d{4}$/.test(pin)) {
            setError('PIN harus 4 digit angka.');
            setStatus('fail');
            return;
        }
        setBusy(true);
        setError('');
        setStatus('verifying');

        const finish = (ok: boolean, dist: number | null, w: boolean | null, msg: string) => {
            setBusy(false);
            persist(ok ? 'ok' : 'fail', dist, w);
            if (!ok) setError(msg);
        };

        const callApi = (lat?: number, lng?: number, accuracy?: number) => {
            fetch(verifyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'X-Requested-With': 'XMLHttpRequest' },
                body: JSON.stringify({ pin, lat, lng, accuracy }),
            })
                .then(async (res) => {
                    const data = await res.json();
                    if (!res.ok || !data.verified) {
                        finish(
                            false,
                            data.distance_m ?? null,
                            data.within_radius ?? null,
                            data.message ?? 'Verifikasi gagal.',
                        );
                        return;
                    }
                    finish(true, data.distance_m ?? null, data.within_radius ?? null, '');
                })
                .catch(() => finish(false, null, null, 'Gagal menghubungi server.'));
        };

        // Coba GPS bila koordinat outlet tersedia
        if (geo?.latitude != null && geo?.longitude != null && navigator.geolocation) {
            let settled = false;
            const gpsTimeout = setTimeout(() => {
                if (!settled) {
                    settled = true;
                    callApi(); // GPS tidak respons → fallback PIN saja
                }
            }, 6000);

            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    if (settled) return;
                    settled = true;
                    clearTimeout(gpsTimeout);
                    const dist = haversine(pos.coords.latitude, pos.coords.longitude, geo.latitude!, geo.longitude!);
                    setDistance(Math.round(dist));
                    callApi(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
                },
                () => {
                    if (settled) return;
                    settled = true;
                    clearTimeout(gpsTimeout);
                    // GPS ditolak → fallback verifikasi PIN saja
                    callApi();
                },
                { enableHighAccuracy: true, timeout: 10000 },
            );
        } else {
            callApi();
        }
    };

    const badge = () => {
        if (status === 'ok')
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-emerald-500/15 px-2.5 py-1 text-[11px] font-semibold text-emerald-300">
                    <CheckCircle2Icon className="size-3.5" /> Terverifikasi
                </span>
            );
        if (status === 'fail')
            return (
                <span className="inline-flex items-center gap-1.5 rounded-full bg-rose-500/15 px-2.5 py-1 text-[11px] font-semibold text-rose-300">
                    <XCircleIcon className="size-3.5" /> Belum
                </span>
            );
        return (
            <span className="inline-flex items-center gap-1.5 rounded-full bg-white/10 px-2.5 py-1 text-[11px] font-semibold text-slate-300">
                <ShieldAlertIcon className="size-3.5" /> Perlu Verifikasi
            </span>
        );
    };

    return (
        <div className="flex items-center gap-3 rounded-xl border border-white/10 bg-white/5 px-3 py-2 backdrop-blur-md">
            <div className="flex items-center gap-2 text-slate-300">
                <MapPinIcon className="size-4 text-[var(--color-primary)]" />
                <span className="text-[11px] font-medium uppercase tracking-wide text-slate-400">Lokasi Kasir</span>
            </div>

            {badge()}

            <div className="flex items-center gap-1.5">
                <div className="relative">
                    <LockIcon className="pointer-events-none absolute left-2 top-1/2 size-3.5 -translate-y-1/2 text-slate-500" />
                    <input
                        value={pin}
                        onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                        inputMode="numeric"
                        placeholder="PIN"
                        maxLength={4}
                        className="w-20 rounded-lg border border-white/10 bg-black/30 py-1.5 pl-7 pr-2 text-center font-mono text-sm tracking-[0.3em] text-white outline-none focus:border-[var(--color-primary)]/50"
                    />
                </div>
                <button
                    onClick={handleVerify}
                    disabled={busy || status === 'verifying'}
                    className="rounded-lg bg-[var(--color-primary)] px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition-colors hover:bg-[var(--color-primary)]/90 disabled:opacity-50"
                >
                    {status === 'verifying' ? '...' : 'Verifikasi'}
                </button>
            </div>

            {distance != null && within != null && (
                <span className={`text-[10px] ${within ? 'text-emerald-400' : 'text-rose-400'}`}>
                    {Math.round(distance)}m {within ? '✓' : '✗'}
                </span>
            )}
            {error && <span className="text-[10px] text-rose-400">{error}</span>}
        </div>
    );
}
