import { useState, useEffect } from 'react';
import { Head, Link } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { Screen, Glass, Badge } from '../../Components/Shared';
import {
    ShoppingBagIcon,
    ClockIcon,
    UtensilsIcon,
    RefreshCwIcon,
    LayersIcon,
    CreditCardIcon,
    GlassWaterIcon,
} from '../../Components/icons';

interface Order {
    id: string;
    table: string;
    status: string;
    tone: string;
    time: number;
    items: string[];
}

export default function MonitorPesanan() {
    const [orders, setOrders] = useState<Order[]>([]);
    const [filterType, setFilterType] = useState<'all' | 'dine_in' | 'take_away'>('all');
    const [isRefreshing, setIsRefreshing] = useState(false);

    const fetchOrders = async () => {
        try {
            const response = await fetch('/api/orders/payment-queue');
            if (response.ok) {
                const data = await response.json();
                // payment-queue mengembalikan { grouped: { 'Siap Bayar': [...] }, orders: [...] }
                const flatOrders: Order[] = data.orders ?? [];
                if (flatOrders.length === 0 && data.grouped) {
                    Object.values(data.grouped).forEach((groupList: Order[]) => {
                        flatOrders.push(...groupList);
                    });
                }
                setOrders(flatOrders);
            }
        } catch (err) {
            console.error('Gagal mengambil data pesanan', err);
        }
    };

    useEffect(() => {
        fetchOrders();
        const interval = setInterval(fetchOrders, 3000);
        return () => clearInterval(interval);
    }, []);

    const handleRefresh = async () => {
        setIsRefreshing(true);
        await fetchOrders();
        setIsRefreshing(false);
    };

    const filteredOrders = orders.filter((o) => {
        const isTakeaway = o.table.toLowerCase().includes('takeaway');
        if (filterType === 'dine_in') return !isTakeaway;
        if (filterType === 'take_away') return isTakeaway;
        return true;
    });

    return (
        <MainLayout>
            <Head title="Monitor Pesanan - Kasir" />
            <Screen
                title="Antrean Pembayaran Kasir"
                description="Pesanan yang sudah disajikan waiter ke meja (siap bayar). Akan tetap di layar ini sampai kasir memproses pembayaran."
                action={
                    <div className="flex items-center gap-3">
                        <Link
                            href="/waiter-bar"
                            className="flex items-center gap-2 px-4 py-2 bg-amber-500/10 border border-amber-500/20 hover:bg-amber-500/20 text-amber-300 rounded-xl text-xs font-bold transition-all"
                        >
                            <GlassWaterIcon className="size-3.5 text-amber-400" /> Monitor Minuman (Waiter/Bar)
                        </Link>
                        <button
                            onClick={handleRefresh}
                            className="flex items-center gap-2 px-4 py-2 bg-white/5 border border-white/10 hover:bg-white/10 text-slate-200 rounded-xl text-xs font-bold transition-all"
                        >
                            <RefreshCwIcon className={`size-3.5 ${isRefreshing ? 'animate-spin' : ''}`} /> Muat Ulang
                        </button>
                    </div>
                }
            >
                {/* Statistics Widgets */}
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-5 mb-6">
                    <Glass className="p-5 flex items-center justify-between border-l-4 border-l-amber-500">
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Antrean Pembayaran
                            </p>
                            <h3 className="text-2xl font-black text-slate-100 mt-1">{orders.length}</h3>
                        </div>
                        <LayersIcon className="size-8 text-amber-500/20" />
                    </Glass>
                    <Glass className="p-5 flex items-center justify-between border-l-4 border-l-blue-500">
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Makan Di Sini (Dine In)
                            </p>
                            <h3 className="text-2xl font-black text-slate-100 mt-1">
                                {orders.filter((o) => !o.table.toLowerCase().includes('takeaway')).length}
                            </h3>
                        </div>
                        <UtensilsIcon className="size-8 text-blue-500/20" />
                    </Glass>
                    <Glass className="p-5 flex items-center justify-between border-l-4 border-l-emerald-500">
                        <div>
                            <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider">
                                Bawa Pulang (Take Away)
                            </p>
                            <h3 className="text-2xl font-black text-slate-100 mt-1">
                                {orders.filter((o) => o.table.toLowerCase().includes('takeaway')).length}
                            </h3>
                        </div>
                        <ShoppingBagIcon className="size-8 text-emerald-500/20" />
                    </Glass>
                </div>

                {/* Tab Filters */}
                <div className="flex gap-2 mb-6">
                    {(['all', 'dine_in', 'take_away'] as const).map((tab) => (
                        <button
                            key={tab}
                            onClick={() => setFilterType(tab)}
                            className={`px-5 py-2.5 rounded-full text-xs font-extrabold transition-all border ${
                                filterType === tab
                                    ? 'bg-white/10 text-white border-white/20 shadow-lg'
                                    : 'bg-white/[0.02] border-white/5 text-slate-400 hover:text-slate-200 hover:bg-white/5'
                            }`}
                        >
                            {tab === 'all'
                                ? 'Semua Pesanan'
                                : tab === 'dine_in'
                                  ? 'Makan Di Sini (Dine In)'
                                  : 'Bawa Pulang (Take Away)'}
                        </button>
                    ))}
                </div>

                {/* Orders Grid */}
                {filteredOrders.length > 0 ? (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                        {filteredOrders.map((order) => {
                            const isTakeaway = order.table.toLowerCase().includes('takeaway');
                            return (
                                <Glass
                                    key={order.id}
                                    className={`flex flex-col justify-between overflow-hidden border transition-all ${
                                        isTakeaway
                                            ? 'border-emerald-500/10 hover:border-emerald-500/30'
                                            : 'border-blue-500/10 hover:border-blue-500/30'
                                    }`}
                                >
                                    <div className="p-5">
                                        {/* Header */}
                                        <div className="flex items-start justify-between mb-4">
                                            <div>
                                                <span className="text-[10px] font-mono text-slate-500 uppercase tracking-wider">
                                                    {order.id}
                                                </span>
                                                <h4 className="text-lg font-black text-white mt-0.5">{order.table}</h4>
                                            </div>
                                            <Badge tone={order.tone}>{order.status}</Badge>
                                        </div>

                                        {/* Items List */}
                                        <div className="space-y-2 border-y border-white/5 py-4 my-4 max-h-48 overflow-y-auto pr-1">
                                            {order.items.map((item, idx) => {
                                                // items bisa STRING (legacy) atau OBJECT (refactor 5-stage)
                                                const isObj = item && typeof item === 'object';
                                                const isNote = isObj
                                                    ? !!item.notes &&
                                                      typeof item.notes === 'string' &&
                                                      item.notes.startsWith('+')
                                                    : typeof item === 'string' && item.startsWith('+');
                                                const label = isObj
                                                    ? isNote
                                                        ? item.notes
                                                        : `${item.qty > 1 ? item.qty + 'x ' : ''}${item.name}`
                                                    : item;
                                                return (
                                                    <div
                                                        key={idx}
                                                        className={`text-xs ${isNote ? 'text-amber-400 italic pl-3' : 'text-slate-200'}`}
                                                    >
                                                        {label}
                                                    </div>
                                                );
                                            })}
                                        </div>

                                        {/* Time Counter */}
                                        <div className="flex items-center gap-1.5 text-xs text-slate-400">
                                            <ClockIcon className="size-3.5" />
                                            <span>Masuk {order.time} mnt lalu</span>
                                        </div>
                                    </div>

                                    {/* Actions Bar */}
                                    <div className="p-4 bg-white/[0.02] border-t border-white/5 flex gap-2">
                                        <Link
                                            href={`/pos?loadOrder=${order.id}`}
                                            className="flex-1 flex items-center justify-center gap-2 py-2.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition-all shadow-md shadow-emerald-500/10"
                                        >
                                            <CreditCardIcon className="size-4" /> Proses Pembayaran
                                        </Link>
                                    </div>
                                </Glass>
                            );
                        })}
                    </div>
                ) : (
                    <Glass className="py-20 text-center flex flex-col items-center justify-center">
                        <LayersIcon className="size-16 text-slate-700 mb-4 animate-pulse" />
                        <h4 className="text-base font-bold text-slate-300">Belum Ada Pesanan Masuk</h4>
                        <p className="text-xs text-slate-500 mt-1 max-w-xs">
                            Antrean pembayaran akan otomatis muncul di sini ketika tamu melakukan pemesanan via buku
                            menu digital.
                        </p>
                    </Glass>
                )}
            </Screen>
        </MainLayout>
    );
}
