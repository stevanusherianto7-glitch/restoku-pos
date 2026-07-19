import { formatRupiah } from '../../../lib/formatters';

interface FloatingCheckoutProps {
    cartTotalItems: number;
    orderSuccess: boolean;
    guestVerified: boolean;
    cartTotalPrice: number;
    handleCheckout: () => void;
}

export function FloatingCheckout({
    cartTotalItems,
    orderSuccess,
    guestVerified,
    cartTotalPrice,
    handleCheckout,
}: FloatingCheckoutProps) {
    if (cartTotalItems === 0 || orderSuccess) return null;
    return (
        <div className="absolute bottom-5 inset-x-4 z-40">
            <button
                onClick={handleCheckout}
                disabled={!guestVerified}
                className={`w-full rounded-2xl py-4 px-5 text-sm font-extrabold flex justify-between items-center transition-all ${
                    guestVerified
                        ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 shadow-2xl shadow-emerald-950/50 hover:scale-[1.02] active:scale-[0.98]'
                        : 'bg-white/10 text-white/40 cursor-not-allowed'
                }`}
            >
                <span
                    className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${guestVerified ? 'bg-slate-950/20 text-slate-900' : 'bg-black/20 text-white/40'}`}
                >
                    {cartTotalItems} Item
                </span>
                <span>{guestVerified ? 'Kirim Pesanan Ke Dapur' : '🔒 Verifikasi Dulu'}</span>
                <span className="font-mono">{formatRupiah(cartTotalPrice * 1.1)}</span>
            </button>
        </div>
    );
}
