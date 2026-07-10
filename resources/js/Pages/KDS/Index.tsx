import { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { Screen, Glass, Badge, cardToneMap, type Tone } from '../../Components/Shared';
import { Clock3, CheckCheck, Volume2, VolumeX, ChefHat, Utensils, Flame, ShieldAlert } from 'lucide-react';

type KdsOrder = { id: string; table: string; status: string; tone: Tone; time: number; items: string[] };

const AUTHORIZED_ROLES = ['kitchen', 'waiter', 'manager', 'owner'];

export default function KDS() {
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
                <Head title="Akses Ditolak — KDS" />
                <div className="flex flex-col items-center justify-center min-h-[60vh] text-center gap-6">
                    <div className="p-5 rounded-full bg-red-500/10 border border-red-500/20">
                        <ShieldAlert className="size-12 text-red-400" />
                    </div>
                    <div className="space-y-2">
                        <h1 className="text-2xl font-bold text-white">Akses Ditolak</h1>
                        <p className="text-slate-400 text-sm max-w-sm">
                            Halaman <strong>Dapur / KDS</strong> hanya dapat diakses oleh{' '}
                            <strong className="text-red-400">Kitchen Staff</strong>,{' '}
                            <strong className="text-emerald-400">Waiter</strong>, atau{' '}
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

    return <KDSContent />;
}

function KDSContent() {
    const [isTtsEnabled, setIsTtsEnabled] = useState(true);
    const [groupedOrders, setGroupedOrders] = useState<Record<string, KdsOrder[]>>({
        'Antrian Masuk': [],
        'Sedang Dimasak': [],
        'Siap Sajikan': [],
    });

    const speakText = (text: string) => {
        if (!isTtsEnabled) return;
        try {
            const utterance = new SpeechSynthesisUtterance(text);
            utterance.lang = 'id-ID';
            utterance.rate = 0.9;
            window.speechSynthesis.speak(utterance);
        } catch (err) {
            console.error('Text-To-Speech failed', err);
        }
    };

    const fetchOrders = async () => {
        try {
            const response = await fetch('/api/orders');
            if (response.ok) {
                const data = await response.json();
                setGroupedOrders(data.grouped);

                // If there is a new order TTS text returned by the server, speak it!
                if (data.ttsText) {
                    speakText(data.ttsText);
                }
            }
        } catch (err) {
            console.error('Failed to fetch KDS orders', err);
        }
    };

    // Poll for active orders every 3 seconds
    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 3000);
        return () => clearInterval(interval);
    }, [isTtsEnabled]);

    const updateStatus = async (orderId: string, nextStatus: string) => {
        try {
            const response = await fetch(`/api/orders/${orderId}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: nextStatus }),
            });
            if (response.ok) {
                fetchOrders();
            }
        } catch (err) {
            console.error('Failed to update KDS order status', err);
        }
    };

    const getAggregatedItems = () => {
        const counts: Record<string, number> = {};
        const allOrders = [...(groupedOrders['Antrian Masuk'] || []), ...(groupedOrders['Sedang Dimasak'] || [])];

        allOrders.forEach((o) => {
            o.items.forEach((itemStr: string) => {
                if (itemStr.startsWith('+')) return; // Skip notes
                const match = itemStr.match(/^(\d+)x\s+(.+)$/);
                const qty = match ? parseInt(match[1]) : 1;
                const name = match ? match[2].trim() : itemStr.trim();
                counts[name] = (counts[name] || 0) + qty;
            });
        });

        return Object.entries(counts).filter(([_, qty]) => qty > 0);
    };

    const columns = [
        { title: 'Antrian Masuk', tone: 'amber' as Tone, status: 'Antrian Masuk', nextStatus: 'Sedang Dimasak' },
        { title: 'Sedang Dimasak', tone: 'blue' as Tone, status: 'Sedang Dimasak', nextStatus: 'Selesai' },
    ];

    return (
        <MainLayout>
            <Head title="Kitchen Display System" />
            <Screen
                title="Kitchen Display System"
                action={
                    <button
                        onClick={() => setIsTtsEnabled(!isTtsEnabled)}
                        className={`flex items-center gap-2 px-4 py-2 rounded-xl border transition-colors ${
                            isTtsEnabled
                                ? 'bg-blue-500/20 text-blue-300 border-blue-500/30 hover:bg-blue-500/30'
                                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-200'
                        }`}
                    >
                        {isTtsEnabled ? <Volume2 className="size-5" /> : <VolumeX className="size-5" />}
                        <span className="text-sm font-medium pr-1">Suara Pesanan (TTS)</span>
                    </button>
                }
            >
                {/* Kitchen Aggregated Cooking Guide */}
                {getAggregatedItems().length > 0 && (
                    <div className="mb-6 bg-slate-950/40 border border-white/5 rounded-3xl p-5 flex items-center justify-between font-mono">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400">
                                <Flame className="size-5 animate-pulse" />
                            </div>
                            <div>
                                <h3 className="text-sm font-black text-slate-200 uppercase tracking-wider">
                                    PANDUAN MASAK SEKALIGUS
                                </h3>
                                <p className="text-xs text-slate-500 mt-0.5">
                                    Total porsi menu yang sama di seluruh antrean aktif.
                                </p>
                            </div>
                        </div>
                        <div className="flex flex-wrap gap-2 justify-end">
                            {getAggregatedItems().map(([name, qty]) => (
                                <div
                                    key={name}
                                    className="flex items-center gap-2.5 bg-white/5 border border-white/10 px-4 py-2 rounded-2xl"
                                >
                                    <span className="text-xl font-black text-amber-400">{qty}x</span>
                                    <span className="text-xs font-bold text-slate-300">{name}</span>
                                </div>
                            ))}
                        </div>
                    </div>
                )}

                <div className="grid grid-cols-2 gap-5 items-start font-mono">
                    {columns.map(({ title, tone, status, nextStatus }) => {
                        const orders = groupedOrders[status] || [];
                        return (
                            <Glass className="p-6" key={title}>
                                <div className="mb-6 flex items-center justify-between">
                                    <h2 className="text-xl font-bold text-slate-200">{title}</h2>
                                    <Badge tone={tone}>{orders.length} order</Badge>
                                </div>
                                <div className="space-y-4">
                                    {orders.map((o) => (
                                        <div key={o.id} className={`rounded-2xl border p-5 ${cardToneMap[tone]}`}>
                                            <div className="mb-4 flex justify-between items-start">
                                                <div>
                                                    <b className="text-6xl font-bold tracking-tight block text-slate-100">
                                                        {o.table}
                                                    </b>
                                                    <p className="text-xl opacity-70 mt-2 font-medium">{o.id}</p>
                                                    <div className="mt-3">
                                                        {o.table.toLowerCase().includes('takeaway') ? (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-orange-500/10 border border-orange-500/20 text-orange-400 text-xs font-black uppercase tracking-wider">
                                                                🛍️ TAKE AWAY{' '}
                                                                <span className="text-[10px] font-normal lowercase text-slate-400">
                                                                    (Siapkan Box & Paperbag)
                                                                </span>
                                                            </span>
                                                        ) : (
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-blue-500/10 border border-blue-500/20 text-blue-400 text-xs font-black uppercase tracking-wider">
                                                                🍽️ DINE IN
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="font-mono text-4xl opacity-90 flex items-center gap-2 font-bold bg-black/20 px-3 py-2 rounded-xl">
                                                    <Clock3 className="size-8" />
                                                    {o.time}'
                                                </span>
                                            </div>
                                            <div className="space-y-2 text-3xl font-medium mt-6 border-t border-white/10 pt-4">
                                                {o.items.map((item, i) => {
                                                    const isNote = item.startsWith('+');
                                                    return (
                                                        <p
                                                            key={i}
                                                            className={
                                                                isNote
                                                                    ? 'text-2xl opacity-70 font-normal italic pl-4'
                                                                    : 'text-slate-200'
                                                            }
                                                        >
                                                            {item}
                                                        </p>
                                                    );
                                                })}
                                            </div>
                                            {tone === 'emerald' && (
                                                <button
                                                    onClick={() => updateStatus(o.id, nextStatus)}
                                                    className="mt-6 w-full rounded-xl bg-emerald-500/20 hover:bg-emerald-500/30 border border-emerald-500/30 py-4 text-2xl font-bold text-emerald-200 transition-colors flex items-center justify-center gap-3 active:scale-95 duration-200"
                                                >
                                                    <CheckCheck className="size-6" /> KONFIRMASI SAJIKAN
                                                </button>
                                            )}
                                            {tone === 'blue' && (
                                                <button
                                                    onClick={() => updateStatus(o.id, nextStatus)}
                                                    className="mt-6 w-full rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 py-4 text-2xl font-bold text-blue-200 transition-colors flex items-center justify-center gap-3 active:scale-95 duration-200"
                                                >
                                                    <Utensils className="size-6" /> SELESAI MASAK
                                                </button>
                                            )}
                                            {tone === 'amber' && (
                                                <button
                                                    onClick={() => updateStatus(o.id, nextStatus)}
                                                    className="mt-6 w-full rounded-xl bg-blue-500/20 hover:bg-blue-500/30 border border-blue-500/30 py-4 text-2xl font-bold text-blue-200 transition-colors flex items-center justify-center gap-3 active:scale-95 duration-200"
                                                >
                                                    <ChefHat className="size-6" /> MULAI MASAK
                                                </button>
                                            )}
                                        </div>
                                    ))}
                                </div>
                            </Glass>
                        );
                    })}
                </div>
            </Screen>
        </MainLayout>
    );
}
