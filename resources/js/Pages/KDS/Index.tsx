import { useState, useEffect, Fragment } from 'react';
import { Head, Link, usePage } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { Screen, Glass, Badge, cardToneMap, type Tone } from '../../Components/Shared';
import {
    ClockIcon,
    CheckCheckIcon,
    VolumeIcon,
    VolumeMuteIcon,
    ChefHatIcon,
    UtensilsIcon,
    FlameIcon,
    ShieldAlertIcon,
} from '../../Components/icons';

type KdsOrder = { id: string; table: string; status: string; tone: Tone; time: number; items: OrderItem[] };

const AUTHORIZED_ROLES = ['kitchen', 'waiter', 'manager', 'owner'];

export default function KDS() {
    const { auth } = usePage<{ auth: { user: { role: string } } }>().props;
    const [roleChecked, setRoleChecked] = useState(false);
    const [authorized, setAuthorized] = useState(false);

    useEffect(() => {
        // Owner selalu diizinkan (lihat dashboard KDS dari Owner View).
        if (auth?.user?.role === 'owner') {
            setAuthorized(true);
            setRoleChecked(true);
            return;
        }
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
                        <ShieldAlertIcon className="size-12 text-red-400" />
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
        Diterima: [],
        'Sedang Dimasak': [],
        'Selesai Masak': [],
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

    const updateItemCook = async (itemId: string, nextLabel: string) => {
        try {
            const response = await fetch(`/api/order-items/${itemId}/cook-status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: nextLabel }),
            });
            if (response.ok) {
                fetchOrders();
            }
        } catch (err) {
            console.error('Failed to update item cook status', err);
        }
    };
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
        const allOrders = [
            ...(groupedOrders['Antrian Masuk'] || []),
            ...(groupedOrders['Diterima'] || []),
            ...(groupedOrders['Sedang Dimasak'] || []),
            ...(groupedOrders['Selesai Masak'] || []),
        ];

        allOrders.forEach((o) => {
            (o.items || []).forEach((it: OrderItem) => {
                const name = it?.name || (typeof it === 'string' ? it.replace(/^\+\s*/, '') : '');
                const qty = typeof it === 'string' ? parseInt((it.match(/^(\d+)x\s+/) || [])[1]) || 1 : it?.qty || 1;
                if (!name) return; // skip notes / kosong
                counts[name] = (counts[name] || 0) + qty;
            });
        });

        return Object.entries(counts).filter(([_, qty]) => qty > 0);
    };

    const columns = [
        { title: 'Antrian Masuk', tone: 'amber' as Tone, status: 'Antrian Masuk', nextStatus: 'Diterima' },
        { title: 'Diterima', tone: 'amber' as Tone, status: 'Diterima', nextStatus: 'Sedang Dimasak' },
        { title: 'Sedang Dimasak', tone: 'blue' as Tone, status: 'Sedang Dimasak', nextStatus: 'Selesai Masak' },
        { title: 'Selesai Masak', tone: 'blue' as Tone, status: 'Selesai Masak', nextStatus: 'Siap Sajikan' },
        { title: 'Siap Sajikan', tone: 'emerald' as Tone, status: 'Siap Sajikan', nextStatus: 'Selesai' },
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
                                ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] border-[var(--color-primary)]/30 hover:bg-[var(--color-primary)]/30'
                                : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10 hover:text-slate-200'
                        }`}
                    >
                        {isTtsEnabled ? <VolumeIcon className="size-5" /> : <VolumeMuteIcon className="size-5" />}
                        <span className="text-sm font-medium pr-1">Suara Pesanan (TTS)</span>
                    </button>
                }
            >
                {/* Kitchen Aggregated Cooking Guide */}
                {getAggregatedItems().length > 0 && (
                    <div className="mb-6 bg-slate-950/40 border border-white/5 rounded-3xl p-5 flex items-center justify-between font-mono">
                        <div className="flex items-center gap-3">
                            <div className="size-10 rounded-2xl bg-amber-500/10 flex items-center justify-center border border-amber-500/20 text-amber-400">
                                <FlameIcon className="size-5 animate-pulse" />
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
                                                        {(o.table || '').replace(/^meja\s+/i, '').toUpperCase()}
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
                                                            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-[var(--color-primary)]/10 border border-[var(--color-primary)]/20 text-[var(--color-primary)] text-xs font-black uppercase tracking-wider">
                                                                🍽️ DINE IN
                                                            </span>
                                                        )}
                                                    </div>
                                                </div>
                                                <span className="font-mono text-4xl opacity-90 flex items-center gap-2 font-bold bg-black/20 px-3 py-2 rounded-xl">
                                                    <ClockIcon className="size-8" />
                                                    {o.time}'
                                                </span>
                                            </div>
                                            <div className="space-y-3 text-3xl font-medium mt-6 border-t border-white/10 pt-4">
                                                {o.items.map((it) => {
                                                    // cook_status internal pakai underscore (cocok dgn backend);
                                                    // cook_step integer (1-5) dikirim API sbg sumber kebenaran.
                                                    const cookSteps = [
                                                        'dikonfirmasi',
                                                        'sedang_dimasak',
                                                        'selesai_masak',
                                                        'siap_sajikan',
                                                        'selesai',
                                                    ];
                                                    const cur =
                                                        typeof it.cook_step === 'number' &&
                                                        it.cook_step >= 1 &&
                                                        it.cook_step <= 5
                                                            ? it.cook_step - 1
                                                            : cookSteps.indexOf(it.cook_status) >= 0
                                                              ? cookSteps.indexOf(it.cook_status)
                                                              : 0;
                                                    const nextLabel =
                                                        cur < cookSteps.length - 1 ? cookSteps[cur + 1] : null;
                                                    return (
                                                        <div
                                                            key={it.id}
                                                            className="rounded-xl bg-black/20 border border-white/10 p-3"
                                                        >
                                                            <div className="flex items-center justify-between gap-3">
                                                                <p className="text-2xl font-bold text-slate-100">
                                                                    {it.qty}x {it.name}
                                                                    {it.notes ? (
                                                                        <span className="text-base font-normal italic opacity-60">
                                                                            {' '}
                                                                            ({it.notes})
                                                                        </span>
                                                                    ) : null}
                                                                </p>
                                                                <span className="text-sm font-black uppercase tracking-wider px-2.5 py-1 rounded-lg bg-amber-500/15 text-amber-300">
                                                                    {it.cook_label}
                                                                </span>
                                                            </div>
                                                            {/* 5-tahap tracker per-item */}
                                                            <div className="flex items-center justify-between mt-3 px-1">
                                                                {cookSteps.map((s, i) => {
                                                                    const n = i + 1;
                                                                    const st =
                                                                        n < cur + 1
                                                                            ? 'done'
                                                                            : n === cur + 1
                                                                              ? 'on'
                                                                              : 'off';
                                                                    const cls =
                                                                        st === 'done'
                                                                            ? 'bg-emerald-500 text-white'
                                                                            : st === 'on'
                                                                              ? 'bg-[var(--color-primary)] text-white animate-pulse'
                                                                              : 'bg-white/10 text-slate-500';
                                                                    return (
                                                                        <Fragment key={s}>
                                                                            <div className="flex flex-col items-center gap-1">
                                                                                <div
                                                                                    className={`size-7 rounded-full ${cls} grid place-items-center text-[11px] font-extrabold`}
                                                                                >
                                                                                    {n}
                                                                                </div>
                                                                                <span
                                                                                    className={`text-[8px] font-bold uppercase tracking-wide ${st === 'done' ? 'text-emerald-400' : st === 'on' ? 'text-[var(--color-primary)]' : 'text-slate-500'}`}
                                                                                >
                                                                                    {s}
                                                                                </span>
                                                                            </div>
                                                                            {n < 5 && (
                                                                                <div
                                                                                    className="h-0.5 flex-1 mx-1 -mt-4"
                                                                                    style={{
                                                                                        background:
                                                                                            n < cur + 1
                                                                                                ? '#0F8A4D'
                                                                                                : n === cur + 1
                                                                                                  ? 'var(--color-primary)'
                                                                                                  : 'rgba(255,255,255,0.1)',
                                                                                    }}
                                                                                />
                                                                            )}
                                                                        </Fragment>
                                                                    );
                                                                })}
                                                            </div>
                                                            {nextLabel && (
                                                                <button
                                                                    onClick={() => updateItemCook(it.id, nextLabel)}
                                                                    className="mt-3 w-full rounded-xl bg-[var(--color-primary)]/20 hover:bg-[var(--color-primary)]/30 border border-[var(--color-primary)]/30 py-3 text-xl font-bold text-[var(--color-primary)] transition-colors flex items-center justify-center gap-2 active:scale-95 duration-200"
                                                                >
                                                                    <ChefHatIcon className="size-5" />{' '}
                                                                    {nextLabel.replace(/_/g, ' ').toUpperCase()}
                                                                </button>
                                                            )}
                                                        </div>
                                                    );
                                                })}
                                            </div>
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
