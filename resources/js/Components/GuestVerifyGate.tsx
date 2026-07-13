import { useState, useEffect, useRef } from 'react';
import { MapPinIcon, ShieldAlertIcon, LockIcon, CheckCheckIcon, XIcon } from './icons';

type Status = 'idle' | 'verifying' | 'ok' | 'fail';

interface OutletGeo {
    latitude: number | null;
    longitude: number | null;
    geo_radius_meters: number;
}

interface Props {
    slug: string;
    tableLabel: string | null;
    geo?: OutletGeo | null;
    onVerified: (token: string) => void;
    verifyUrl?: string;
}

const STORAGE_KEY = 'restoku_guest_verify';

// Haversine (mirror DailyPinService) untuk estimasi jarak sisi client
function haversine(lat1: number, lng1: number, lat2: number, lng2: number): number {
    const R = 6371000;
    const toRad = (x: number) => (x * Math.PI) / 180;
    const dLat = toRad(lat2 - lat1);
    const dLng = toRad(lng2 - lng1);
    const a = Math.sin(dLat / 2) ** 2 + Math.cos(toRad(lat1)) * Math.cos(toRad(lat2)) * Math.sin(dLng / 2) ** 2;
    const c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a));
    return R * c;
}

/**
 * GuestVerifyGate — verifikasi kehadiran tamu (anti-fraud QR order).
 * Tamu wajib: GPS dalam radius + PIN Meja + PIN Harian Restoran.
 * Tombol "Kirim Pesanan" di CustomerView terkunci sampai onVerified terpanggil.
 */
export function GuestVerifyGate({ slug, tableLabel, geo, onVerified, verifyUrl = '/api/guest/verify' }: Props) {
    const [tablePin, setTablePin] = useState('');
    const [dailyPin, setDailyPin] = useState('');
    const [status, setStatus] = useState<Status>('idle');
    const [error, setError] = useState('');
    const [busy, setBusy] = useState(false);
    const [gps, setGps] = useState<{ lat: number; lng: number; accuracy: number } | null>(null);
    const [gpsStatus, setGpsStatus] = useState<'pending' | 'ok' | 'fail'>('pending');
    const [distance, setDistance] = useState<number | null>(null);
    const timer = useRef<number | null>(null);

    // Restore sesi (tamu tidak verify tiap render)
    useEffect(() => {
        try {
            const saved = localStorage.getItem(STORAGE_KEY);
            if (saved) {
                const p = JSON.parse(saved);
                if (p.slug === slug && p.table === tableLabel && p.exp > Date.now()) {
                    setStatus('ok');
                    onVerified(p.token);
                    return;
                }
                localStorage.removeItem(STORAGE_KEY);
            }
        } catch {
            /* ignore */
        }
        // GPS auto-detect (timeout 6s → manual)
        if (navigator.geolocation) {
            navigator.geolocation.getCurrentPosition(
                (pos) => {
                    setGps({ lat: pos.coords.latitude, lng: pos.coords.longitude, accuracy: pos.coords.accuracy });
                    evaluateGps(pos.coords.latitude, pos.coords.longitude, pos.coords.accuracy);
                },
                () => setGpsStatus('fail'),
                { enableHighAccuracy: true, timeout: 6000 },
            );
        } else {
            setGpsStatus('fail');
        }
        return () => {
            if (timer.current) window.clearTimeout(timer.current);
        };
    }, [slug, tableLabel]);

    function evaluateGps(lat: number, lng: number, accuracy: number) {
        if (!geo || geo.latitude === null || geo.longitude === null) {
            setGpsStatus('ok'); // outlet tanpa koordinat = dev mode, skip
            return;
        }
        const dist = haversine(lat, lng, geo.latitude, geo.longitude);
        setDistance(Math.round(dist));
        const radius = geo.geo_radius_meters || 50;
        const adjusted = accuracy > 20 ? radius * 1.5 : radius;
        setGpsStatus(dist <= adjusted ? 'ok' : 'fail');
    }

    async function handleVerify() {
        setError('');
        if (!tablePin || tablePin.length !== 4 || !dailyPin || dailyPin.length !== 4) {
            setError('Masukkan PIN Meja dan PIN Harian (masing-masing 4 digit).');
            return;
        }
        if (gpsStatus === 'fail') {
            setError('Lokasi Anda di luar area restoran. Pastikan Anda berada di restoran.');
            return;
        }
        setBusy(true);
        setStatus('verifying');
        try {
            const res = await fetch(verifyUrl, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    slug,
                    table: tableLabel ?? 'A1',
                    table_pin: tablePin,
                    daily_pin: dailyPin,
                    lat: gps?.lat ?? geo?.latitude ?? 0,
                    lng: gps?.lng ?? geo?.longitude ?? 0,
                    accuracy: gps?.accuracy,
                }),
            });
            const data = await res.json();
            if (data.ok && data.token) {
                localStorage.setItem(
                    STORAGE_KEY,
                    JSON.stringify({ slug, table: tableLabel, token: data.token, exp: Date.now() + 15 * 60 * 1000 }),
                );
                setStatus('ok');
                onVerified(data.token);
            } else {
                setStatus('fail');
                const reason = data.reason;
                setError(
                    reason === 'pin_table'
                        ? 'PIN Meja salah.'
                        : reason === 'pin_daily'
                          ? 'PIN Harian salah.'
                          : reason === 'gps'
                            ? 'Lokasi di luar radius restoran.'
                            : reason === 'table_not_found'
                              ? 'Meja tidak ditemukan.'
                              : 'Verifikasi gagal. Coba lagi.',
                );
            }
        } catch {
            setStatus('fail');
            setError('Gagal terhubung ke server. Coba lagi.');
        } finally {
            setBusy(false);
        }
    }

    if (status === 'ok') {
        return (
            <div className="rounded-2xl border border-emerald-200 bg-emerald-50 px-4 py-3 flex items-center gap-3">
                <CheckCheckIcon className="size-5 text-emerald-600" />
                <div className="text-sm font-semibold text-emerald-800">
                    Terverifikasi — Anda berada di restoran. Silakan kirim pesanan.
                </div>
            </div>
        );
    }

    return (
        <div className="relative rounded-2xl border-2 border-[#FF5B35] bg-[#FFF7F2] px-4 pt-5 pb-4">
            <span className="absolute -top-2.5 left-3 bg-[#FF5B35] px-2.5 py-1 rounded-lg text-[10.5px] font-extrabold tracking-wide text-white">
                VERIFIKASI KEHADIRAN
            </span>

            <div className="flex items-center gap-2 mb-1">
                <ShieldAlertIcon className="size-4 text-[#FF5B35]" />
                <span className="text-[15px] font-extrabold text-[#FF5B35]">Pastikan Anda di Restoran</span>
            </div>
            <p className="text-xs text-[#9A8676] mb-3 leading-relaxed">
                Waiter akan memberi tahu PIN verifikasi. GPS memastikan Anda berada di area restoran untuk mencegah
                pesanan bodong.
            </p>

            {/* GPS status */}
            <div
                className={`flex items-center gap-2.5 rounded-xl border px-3 py-2.5 mb-3 ${
                    gpsStatus === 'ok'
                        ? 'border-emerald-200 bg-white'
                        : gpsStatus === 'fail'
                          ? 'border-rose-200 bg-rose-50'
                          : 'border-[#EFE2D6] bg-white'
                }`}
            >
                <div
                    className={`size-7 rounded-lg flex items-center justify-center ${
                        gpsStatus === 'ok'
                            ? 'bg-emerald-100 text-emerald-600'
                            : gpsStatus === 'fail'
                              ? 'bg-rose-100 text-rose-600'
                              : 'bg-[#FCE3D6] text-[#FF5B35]'
                    }`}
                >
                    <MapPinIcon className="size-4" />
                </div>
                <div className="flex-1">
                    <div className="text-[13px] font-semibold text-[#3A2A1E]">
                        {gpsStatus === 'ok'
                            ? 'Lokasi terdeteksi'
                            : gpsStatus === 'fail'
                              ? 'Lokasi tidak terdeteksi'
                              : 'Mendeteksi lokasi…'}
                    </div>
                    <div
                        className={`text-[11px] font-bold ${
                            gpsStatus === 'ok'
                                ? 'text-emerald-600'
                                : gpsStatus === 'fail'
                                  ? 'text-rose-600'
                                  : 'text-[#9A8676]'
                        }`}
                    >
                        {gpsStatus === 'ok'
                            ? distance !== null
                                ? `Dalam radius restoran (${distance} m)`
                                : 'Dalam radius restoran'
                            : gpsStatus === 'fail'
                              ? 'Aktifkan GPS / izinkan lokasi'
                              : 'Mohon tunggu'}
                    </div>
                </div>
            </div>

            {/* PIN Meja */}
            <label className="block text-xs font-bold text-[#3A2A1E] mb-1">
                PIN Meja {tableLabel ? `(${tableLabel})` : ''}
            </label>
            <div className="relative mb-3">
                <LockIcon className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9A8676]" />
                <input
                    inputMode="numeric"
                    maxLength={4}
                    value={tablePin}
                    onChange={(e) => setTablePin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="w-full rounded-xl border border-[#EFE2D6] bg-white py-3 pl-9 pr-3 text-center text-lg font-bold tracking-[0.5em] text-[#3A2A1E] focus:border-[#FF5B35] focus:outline-none"
                />
            </div>

            {/* PIN Harian */}
            <label className="block text-xs font-bold text-[#3A2A1E] mb-1">PIN Harian Restoran</label>
            <div className="relative mb-3">
                <LockIcon className="size-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#9A8676]" />
                <input
                    inputMode="numeric"
                    maxLength={4}
                    value={dailyPin}
                    onChange={(e) => setDailyPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                    placeholder="••••"
                    className="w-full rounded-xl border border-[#EFE2D6] bg-white py-3 pl-9 pr-3 text-center text-lg font-bold tracking-[0.5em] text-[#3A2A1E] focus:border-[#FF5B35] focus:outline-none"
                />
            </div>

            {error && (
                <div className="flex items-center gap-1.5 mb-2 text-[12px] font-semibold text-rose-600">
                    <XIcon className="size-3.5" /> {error}
                </div>
            )}

            <button
                onClick={handleVerify}
                disabled={busy}
                className="w-full rounded-xl bg-[#FF5B35] py-3 text-sm font-extrabold text-white disabled:opacity-60 hover:bg-[#E04E2B] transition-colors"
            >
                {busy ? 'Memverifikasi…' : 'Verifikasi & Buka Pesanan'}
            </button>
            <p className="text-[10.5px] text-[#9A8676] text-center mt-2 leading-relaxed">
                Hanya pesanan dari tamu yang berada di lokasi yang diverifikasi yang diproses.
            </p>
        </div>
    );
}
