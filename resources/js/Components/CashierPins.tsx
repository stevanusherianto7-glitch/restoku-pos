import { useEffect, useState } from 'react';
import { usePage } from '@inertiajs/react';
import { KeyIcon, MapPinIcon, ChevronDownIcon } from './icons';

interface TableRow {
    id: number;
    label: string;
    pin: string;
}

/**
 * CashierPins — PIN Harian + PIN Meja di pojok kanan atas dashboard kasir,
 * berdampingan dengan badge "Live".
 *
 * - PIN Harian di-fetch dari /owner/outlet/daily-pin (route terproteksi, sama
 *   seperti DailyPinBadge).
 * - PIN Meja: klik "PIN Meja ▾" buka popover grid SEMUA meja outlet
 *   (fetch /api/outlet-tables/{outlet}). Waiter tinggal sebut label meja →
 *   kasir baca PIN-nya, lalu disampaikan ke tamu saat verifikasi dine-in.
 *
 * Guard: hanya render kalau outlet terdeteksi (semua layar staff punya outlet).
 */
export default function CashierPins() {
    const { outlet } = usePage<{ outlet?: { id: number; name: string } }>().props;
    const outletId = outlet?.id;

    const [dailyPin, setDailyPin] = useState<string | null>(null);
    const [dailyErr, setDailyErr] = useState(false);

    const [tables, setTables] = useState<TableRow[]>([]);
    const [open, setOpen] = useState(false);
    const [tblErr, setTblErr] = useState(false);

    // PIN Harian (rotate harian, refresh tiap 60s).
    useEffect(() => {
        let alive = true;
        const loadDaily = async () => {
            try {
                const res = await fetch('/owner/outlet/daily-pin');
                if (!res.ok) {
                    if (alive) setDailyErr(true);
                    return;
                }
                const data = await res.json();
                if (alive) setDailyPin(data.pin ?? null);
            } catch {
                if (alive) setDailyErr(true);
            }
        };
        loadDaily();
        const t = setInterval(loadDaily, 60_000);
        return () => {
            alive = false;
            clearInterval(t);
        };
    }, []);

    // PIN Meja — hanya fetch saat popover dibuka.
    useEffect(() => {
        if (!open || !outletId) return;
        let alive = true;
        const loadTables = async () => {
            try {
                const res = await fetch(`/api/outlet-tables/${outletId}`, {
                    headers: { Accept: 'application/json', 'X-Inertia': 'false' },
                });
                if (!res.ok) {
                    if (alive) setTblErr(true);
                    return;
                }
                const data = await res.json();
                if (alive) setTables(Array.isArray(data.tables) ? data.tables : []);
            } catch {
                if (alive) setTblErr(true);
            }
        };
        loadTables();
        return () => {
            alive = false;
        };
    }, [open, outletId]);

    if (!outletId) return null;

    return (
        <div className="relative flex items-center gap-2">
            {/* PIN Harian */}
            <span
                className="flex items-center gap-1.5 rounded-xl border border-amber-500/30 bg-amber-500/10 px-3 py-2 text-xs font-bold text-amber-200"
                title="PIN verifikasi harian untuk tamu (dine-in)"
            >
                <KeyIcon className="size-3.5 text-amber-400" />
                <span className="text-amber-400/70">PIN Harian</span>
                <span className="font-mono tracking-[0.2em] text-sm text-amber-100">
                    {dailyErr ? '?' : (dailyPin ?? '····')}
                </span>
            </span>

            {/* PIN Meja — dropdown */}
            <button
                type="button"
                onClick={() => setOpen((o) => !o)}
                className="flex items-center gap-1.5 rounded-xl border border-white/10 bg-white/[0.03] px-3 py-2 text-xs font-bold text-slate-200 transition-colors hover:bg-white/[0.08]"
                aria-label="Tampilkan PIN Meja"
                aria-expanded={open}
            >
                <MapPinIcon className="size-3.5 text-emerald-400" />
                <span className="text-slate-400/70">PIN Meja</span>
                <ChevronDownIcon className={`size-3.5 transition-transform ${open ? 'rotate-180' : ''}`} />
            </button>

            {open && (
                <div className="absolute right-0 top-full z-50 mt-2 w-64 rounded-2xl border border-white/10 bg-[#0c0d12] p-3 shadow-2xl">
                    <div className="mb-2 flex items-center justify-between">
                        <span className="text-[11px] font-semibold uppercase tracking-wider text-slate-400">
                            PIN per Meja
                        </span>
                        <span className="text-[10px] text-slate-500">{tables.length} meja</span>
                    </div>

                    {tblErr ? (
                        <p className="text-xs text-rose-400">Gagal memuat daftar meja.</p>
                    ) : tables.length === 0 ? (
                        <p className="text-xs text-slate-500">Memuat…</p>
                    ) : (
                        <div className="grid max-h-64 grid-cols-2 gap-1.5 overflow-y-auto">
                            {tables.map((t) => (
                                <div
                                    key={t.id}
                                    className="flex items-center justify-between rounded-lg border border-white/5 bg-white/[0.02] px-2.5 py-1.5"
                                >
                                    <span className="text-xs text-slate-300">{t.label}</span>
                                    <span className="font-mono text-sm tracking-wider text-emerald-300">{t.pin}</span>
                                </div>
                            ))}
                        </div>
                    )}

                    <p className="mt-2 text-[10px] leading-tight text-slate-500">
                        Waiter: sebutkan label meja → PIN ini diberikan ke tamu saat verifikasi.
                    </p>
                </div>
            )}
        </div>
    );
}
