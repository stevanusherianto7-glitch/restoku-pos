import { GuestVerifyGate } from '../../../Components/GuestVerifyGate';
import { ProductImage } from '../../../Components/ProductImage';
import { formatRupiah } from '../../../lib/formatters';
import { ShoppingBagIcon, ShoppingCartIcon, MinusIcon, PlusIcon } from '../../../Components/icons';
import { type MenuItem } from '../../CustomerView';

interface CartPanelProps {
    outletSlug: string;
    tableNumber: string | null;
    outletGeo: { lat: number; lng: number } | null;
    onVerified: (token: string) => void;
    cartTotalItems: number;
    cart: Record<string, number>;
    menuItems: MenuItem[];
    addToCart: (id: number) => void;
    removeFromCart: (id: number) => void;
    orderType: 'dine_in' | 'take_away';
    setOrderType: (t: 'dine_in' | 'take_away') => void;
    chefNotes: string;
    setChefNotes: (v: string) => void;
    cartTotalPrice: number;
    setActiveTab: (t: string) => void;
}

export function CartPanel(props: CartPanelProps) {
    const {
        outletSlug,
        tableNumber,
        outletGeo,
        onVerified,
        cartTotalItems,
        cart,
        menuItems,
        addToCart,
        removeFromCart,
        orderType,
        setOrderType,
        chefNotes,
        setChefNotes,
        cartTotalPrice,
        setActiveTab,
    } = props;
    return (
        <main className="flex-1 p-5 pb-28 flex flex-col justify-between">
            <div className="space-y-4">
                <h2 className="text-base font-extrabold text-white flex items-center gap-2 mb-2">
                    <ShoppingBagIcon className="size-5 text-emerald-400" /> Ringkasan Pesanan
                </h2>

                {/* Anti-fraud: verifikasi kehadiran tamu (GPS + PIN) */}
                <GuestVerifyGate
                    slug={outletSlug}
                    tableLabel={tableNumber}
                    geo={outletGeo}
                    onVerified={(token: string) => onVerified(token)}
                />

                {cartTotalItems > 0 ? (
                    <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                        {/* Dine In / Take Away Segmented Selector */}
                        <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 mb-4">
                            <button
                                onClick={() => setOrderType('dine_in')}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                    orderType === 'dine_in'
                                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                                        : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                Dine In
                            </button>
                            <button
                                onClick={() => setOrderType('take_away')}
                                className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                    orderType === 'take_away'
                                        ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                                        : 'text-slate-400 hover:text-slate-200'
                                }`}
                            >
                                Take Away
                            </button>
                        </div>

                        {Object.entries(cart).map(([idStr, qty]) => {
                            const id = parseInt(idStr);
                            const item = menuItems.find((i) => i.id === id);
                            if (!item) return null;
                            return (
                                <div
                                    key={id}
                                    className="flex items-center gap-3 bg-white/[0.02] p-3 rounded-2xl border border-white/5"
                                >
                                    <ProductImage
                                        src={item.image}
                                        alt={item.name}
                                        variant="small"
                                        className="size-12 rounded-xl object-cover"
                                    />
                                    <div className="flex-1 min-w-0">
                                        <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                                        <p className="text-[10px] text-emerald-400 font-mono mt-0.5">
                                            {formatRupiah(item.price)}
                                        </p>
                                    </div>
                                    <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-0.5">
                                        <button
                                            onClick={() => removeFromCart(id)}
                                            className="size-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold"
                                        >
                                            <MinusIcon className="size-2.5" />
                                        </button>
                                        <span className="w-6 text-center text-xs font-bold text-white">{qty}</span>
                                        <button
                                            onClick={() => addToCart(id)}
                                            className="size-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold"
                                        >
                                            <PlusIcon className="size-2.5" />
                                        </button>
                                    </div>
                                </div>
                            );
                        })}

                        {/* Chef Notes Textarea */}
                        <div className="space-y-2 mt-4">
                            <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                Catatan untuk Chef / Dapur (opsional)
                            </label>
                            <textarea
                                placeholder="contoh: Tanpa bawang, kuah pisah, extra pedas, dll."
                                value={chefNotes}
                                onChange={(e) => setChefNotes(e.target.value)}
                                className="w-full h-16 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/25 transition-all resize-none placeholder:text-slate-600"
                            />
                        </div>

                        {/* Bill details */}
                        <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 space-y-2 mt-4">
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>Subtotal</span>
                                <span className="font-mono text-slate-300">{formatRupiah(cartTotalPrice)}</span>
                            </div>
                            <div className="flex justify-between text-xs text-slate-400">
                                <span>Pajak Restoran PBJT (10%)</span>
                                <span className="font-mono text-slate-300">{formatRupiah(cartTotalPrice * 0.1)}</span>
                            </div>
                            <div className="h-px bg-white/5 my-2" />
                            <div className="flex justify-between text-sm font-bold text-white">
                                <span>Total Pembayaran</span>
                                <span className="font-mono text-emerald-400">{formatRupiah(cartTotalPrice * 1.1)}</span>
                            </div>
                        </div>
                    </div>
                ) : (
                    <div className="py-24 text-center text-slate-500">
                        <ShoppingCartIcon className="size-16 mx-auto text-slate-700 mb-3" />
                        <p className="text-sm font-bold">Keranjang Anda Kosong</p>
                        <p className="text-xs text-slate-500 mt-1">
                            Kembali ke tab menu untuk memilih hidangan terbaik kami.
                        </p>
                        <button
                            onClick={() => setActiveTab('menu')}
                            className="mt-5 px-5 py-2.5 bg-emerald-500 text-slate-950 rounded-xl text-xs font-bold hover:bg-emerald-400 shadow-lg shadow-emerald-500/10"
                        >
                            Lihat Daftar Menu
                        </button>
                    </div>
                )}
            </div>
        </main>
    );
}
