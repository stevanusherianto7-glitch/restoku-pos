import { useEffect, useState } from 'react';
import { KeyIcon } from './icons';

/**
 * DailyPinBadge — menampilkan PIN verifikasi harian 4-digit di pojok kanan atas
 * dashboard Kasir / Pelayan (mirip badge notifikasi di referensi).
 * PIN di-fetch dari route terproteksi /owner/outlet/daily-pin (auth+tenant).
 * PIN rotate harian (DailyPinService) — bukan secret yang bisa dipakai tamu untuk login,
 * hanya untuk pelayan memberi tahu tamu saat verifikasi dine-in.
 */
export default function DailyPinBadge() {
    const [pin, setPin] = useState<string | null>(null);
    const [error, setError] = useState(false);

    useEffect(() => {
        let alive = true;
        const load = async () => {
            try {
                const res = await fetch('/owner/outlet/daily-pin');
                if (!res.ok) {
                    if (alive) setError(true);
                    return;
                }
                const data = await res.json();
                if (alive) setPin(data.pin ?? null);
            } catch {
                if (alive) setError(true);
            }
        };
        load();
        // Refresh tiap 60 detik (PIN rotate harian, tapi amankan kalau midnight lewat)
        const t = setInterval(load, 60_000);
        return () => {
            alive = false;
            clearInterval(t);
        };
    }, []);

    if (error) {
        return (
            <span
                className="flex items-center gap-1.5 rounded-xl border border-rose-500/30 bg-rose-500/10 px-3 py-2 text-xs font-bold text-rose-300"
                title="Gagal memuat PIN harian"
            >
                <KeyIcon className="size-3.5" /> PIN ?
            </span>
        );
    }

    return (
        <span
            className="flex items-center gap-2 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-200"
            title="PIN verifikasi harian untuk tamu (dine-in)"
        >
            <KeyIcon className="size-3.5 text-amber-400" />
            <span className="text-amber-400/70">PIN</span>
            <span className="font-mono tracking-[0.2em] text-amber-100 text-sm">{pin ?? '····'}</span>
        </span>
    );
}
