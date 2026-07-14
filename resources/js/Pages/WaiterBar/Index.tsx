import { useState, useEffect, useRef } from 'react';
import { Head, Link } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { Screen, Glass } from '../../Components/Shared';
import {
    Clock3Icon,
    CheckCheckIcon,
    Volume2Icon,
    VolumeXIcon,
    GlassWaterIcon,
    BellRingIcon,
    ShieldAlertIcon,
} from '../../Components/icons';
import DailyPinBadge from '../../Components/DailyPinBadge';

type KdsOrder = {
    id: string;
    table: string;
    status: string;
    tone: 'amber' | 'blue' | 'emerald';
    time: number;
    items: string[];
};

const AUTHORIZED_ROLES = ['waiter', 'manager', 'owner'];

export default function WaiterBar() {
    const [roleChecked, setRoleChecked] = useState(false);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        const raw = localStorage.getItem('activeKaryawan');
        if (raw) {
            try {
                const { role } = JSON.parse(raw);
                setAuthorized(AUTHORIZED_ROLES.includes(role));
            } catch {
                setAuthorized(false);
            }
        } else {
            setAuthorized(false);
        }
        setRoleChecked(true);
    }, []);

    if (!roleChecked) return null;

    if (!authorized) {
        return (
            <MainLayout>
                <Head title="Akses Ditolak — Waiter Display" />
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
                    <div className="p-5 rounded-full bg-red-500/10 border border-red-500/20">
                        <ShieldAlertIcon className="size-12 text-red-400" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-white">Akses Ditolak</h1>
                        <p className="text-slate-400 text-sm max-w-sm">
                            Halaman <strong>Waiter / Bar Display</strong> hanya dapat diakses oleh{' '}
                            <strong className="text-emerald-400">Waiter</strong> atau{' '}
                            <strong className="text-amber-400">Manager</strong>.
                        </p>
                    </div>
                    <Link
                        href="/dashboard"
                        className="px-6 py-2.5 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 text-slate-200 text-sm font-semibold transition-colors"
                    >
                        ← Kembali ke Dashboard
                    </Link>
                </div>
            </MainLayout>
        );
    }

    return <WaiterBarContent />;
}

function WaiterBarContent() {
    const [orders, setOrders] = useState<KdsOrder[]>([]);
    const [isAudioEnabled, setIsAudioEnabled] = useState(true);
    const prevOrdersCount = useRef<number>(0);
    const audioContextRef = useRef<AudioContext | null>(null);

    // Play a beautiful notification chime
    const playNotificationSound = () => {
        if (!isAudioEnabled) return;
        try {
            if (!audioContextRef.current) {
                audioContextRef.current = new (window.AudioContext || (window as any).webkitAudioContext)();
            }
            const ctx = audioContextRef.current;
            if (ctx.state === 'suspended') {
                ctx.resume();
            }

            const now = ctx.currentTime;
            // Synthesize a premium double-beep chime
            const osc1 = ctx.createOscillator();
            const osc2 = ctx.createOscillator();
            const gainNode = ctx.createGain();

            osc1.type = 'sine';
            osc1.frequency.setValueAtTime(587.33, now); // D5
            osc1.frequency.exponentialRampToValueAtTime(880, now + 0.15); // A5

            osc2.type = 'triangle';
            osc2.frequency.setValueAtTime(880, now + 0.15);
            osc2.frequency.exponentialRampToValueAtTime(1174.66, now + 0.3); // D6

            gainNode.gain.setValueAtTime(0.15, now);
            gainNode.gain.exponentialRampToValueAtTime(0.01, now + 0.4);

            osc1.connect(gainNode);
            osc2.connect(gainNode);
            gainNode.connect(ctx.destination);

            osc1.start(now);
            osc1.stop(now + 0.15);
            osc2.start(now + 0.15);
            osc2.stop(now + 0.4);
        } catch (e) {
            console.warn('Audio Context blocked or not supported', e);
        }
    };

    const fetchOrders = async () => {
        try {
            const response = await fetch('/api/orders');
            if (response.ok) {
                const data = await response.json();
                const activeKdsOrders: KdsOrder[] = data.orders || [];

                // Filter orders that contain drink items (Minuman)
                // Standard drinks are: Es Teh Manis, Es Jeruk Peras, Kopi Susu Aren, Kopi Susu, Kopi Hitam, Es Jeruk, Jus Alpukat
                const drinkKeywords = ['teh', 'jeruk', 'kopi', 'jus', 'es', 'water', 'drink', 'minum'];

                const drinkOrders = activeKdsOrders
                    .map((o) => {
                        const drinkItems = o.items.filter((itemStr) => {
                            if (itemStr.startsWith('+')) return false; // Chef notes
                            const cleanItem = itemStr.toLowerCase();
                            return drinkKeywords.some((keyword) => cleanItem.includes(keyword));
                        });

                        // Keep notes if there are drink items
                        const notes = o.items.filter((itemStr) => itemStr.startsWith('+'));

                        return {
                            ...o,
                            items: [...drinkItems, ...notes],
                        };
                    })
                    // Only show orders that have actual drink items in them
                    .filter((o) => o.items.length > o.items.filter((i) => i.startsWith('+')).length);

                setOrders(drinkOrders);

                // Play sound if new drink order entered the queue
                if (drinkOrders.length > prevOrdersCount.current) {
                    playNotificationSound();
                }
                prevOrdersCount.current = drinkOrders.length;
            }
        } catch (err) {
            console.error('Gagal mengambil data orderan minuman', err);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 3000);
        return () => clearInterval(interval);
    }, [isAudioEnabled]);

    const handleServeDrinks = async (orderId: string) => {
        try {
            const response = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: 'Selesai' }),
            });
            if (response.ok) {
                fetchOrders();
            }
        } catch (err) {
            console.error('Failed to complete drink orders', err);
        }
    };

    return (
        <MainLayout>
            <Head title="Monitor Bar & Waiter" />
            <Screen
                title="Waiter & Bar Display"
                action={
                    <>
                        <button
                            onClick={() => {
                                setIsAudioEnabled(!isAudioEnabled);
                                playNotificationSound();
                            }}
                            className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${
                                isAudioEnabled
                                    ? 'bg-amber-500/20 text-amber-300 border-amber-500/30 hover:bg-amber-500/30'
                                    : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-200'
                            }`}
                        >
                            {isAudioEnabled ? <Volume2Icon className="size-5" /> : <VolumeXIcon className="size-5" />}
                            <span className="text-sm font-medium pr-1">Notifikasi Suara HP</span>
                        </button>
                        <DailyPinBadge />
                    </>
                }
            >
                {/* Dynamic header notification alert */}
                {orders.length > 0 && (
                    <div className="mb-6 bg-amber-500/10 border border-amber-500/20 rounded-3xl p-5 flex items-center justify-between font-mono animate-pulse">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-2xl bg-amber-500/15 flex items-center justify-center text-amber-400">
                                <BellRingIcon className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-amber-400 uppercase tracking-wider">
                                    ORDERAN MINUMAN MASUK!
                                </h3>
                                <p className="text-xs text-slate-400 mt-0.5">
                                    Segera siapkan minuman dan antarkan ke meja pelanggan.
                                </p>
                            </div>
                        </div>
                        <div className="text-xs font-bold text-slate-400 bg-white/5 border border-white/10 px-3 py-1.5 rounded-xl">
                            {orders.length} Antrean Aktif
                        </div>
                    </div>
                )}

                {orders.length === 0 ? (
                    <div className="flex flex-col items-center justify-center py-20 text-slate-500">
                        <div className="size-20 rounded-full bg-white/[0.02] border border-white/5 flex items-center justify-center mb-4">
                            <GlassWaterIcon className="size-10 text-slate-600" />
                        </div>
                        <p className="text-base font-bold text-slate-400">Antrean Minuman Kosong</p>
                        <p className="text-xs text-slate-500 mt-1">Belum ada orderan minuman masuk dari pelanggan.</p>
                    </div>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5 items-start font-mono">
                        {orders.map((o) => (
                            <Glass className="p-6 border-amber-500/10" key={o.id}>
                                <div className="mb-4 flex justify-between items-start">
                                    <div>
                                        <b className="text-5xl font-bold tracking-tight block text-slate-100">
                                            {o.table}
                                        </b>
                                        <p className="text-lg opacity-70 mt-1 font-medium">{o.id}</p>
                                    </div>
                                    <span className="font-mono text-2xl opacity-90 flex items-center gap-1.5 font-bold bg-black/20 px-2.5 py-1.5 rounded-xl">
                                        <Clock3Icon className="size-5" />
                                        {o.time}'
                                    </span>
                                </div>

                                <div className="space-y-2 text-2xl font-medium mt-6 border-t border-white/10 pt-4">
                                    {o.items.map((item, i) => {
                                        const isNote = item.startsWith('+');
                                        return (
                                            <p
                                                key={i}
                                                className={
                                                    isNote
                                                        ? 'text-xl opacity-70 font-normal italic pl-4 text-amber-400'
                                                        : 'text-slate-200'
                                                }
                                            >
                                                {item}
                                            </p>
                                        );
                                    })}
                                </div>

                                <button
                                    onClick={() => handleServeDrinks(o.id)}
                                    className="mt-6 w-full rounded-xl bg-amber-500/20 hover:bg-amber-500/30 border border-amber-500/30 py-4 text-xl font-bold text-amber-200 transition-colors flex items-center justify-center gap-2 active:scale-95 duration-200"
                                >
                                    <CheckCheckIcon className="size-5" /> SAJIKAN MINUMAN
                                </button>
                            </Glass>
                        ))}
                    </div>
                )}
            </Screen>
        </MainLayout>
    );
}
