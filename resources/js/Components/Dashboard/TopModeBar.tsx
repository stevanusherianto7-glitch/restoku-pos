import { type ElementType } from 'react';
import { Screen, Glass } from '../../Components/Shared';
import { SparklesIcon, Building2Icon } from '../../Components/icons';

export function TopModeBar({
    isNanoBanana,
    isGlobal,
    selectedOutlet,
    onSelectOutlet,
}: {
    isNanoBanana: boolean;
    isGlobal: boolean;
    selectedOutlet: string;
    onSelectOutlet: (value: string) => void;
}) {
    return (
        <div
            className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl gap-4 transition-all ${
                isNanoBanana
                    ? 'bg-amber-500/10 border border-amber-500/30 shadow-[0_0_25px_rgba(234,179,8,0.15)]'
                    : 'bg-emerald-500/10 border border-emerald-500/20'
            }`}
        >
            <div className="flex items-center gap-3.5">
                <div
                    className={`grid size-11 place-items-center rounded-xl border ${
                        isNanoBanana
                            ? 'bg-amber-500/20 border-amber-500/40 text-amber-300'
                            : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'
                    }`}
                >
                    {isNanoBanana ? (
                        <SparklesIcon className="size-5 animate-pulse" />
                    ) : (
                        <Building2Icon className="size-5" />
                    )}
                </div>
                <div>
                    <h3
                        className={`text-base font-bold flex items-center gap-2 ${isNanoBanana ? 'text-amber-300' : 'text-emerald-200'}`}
                    >
                        {isGlobal ? 'Dasbor Konsolidasi Multi-Outlet' : 'Dasbor Analisis Cabang'}
                        {isGlobal && (
                            <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-mono">
                                100 OUTLETS CONNECTED
                            </span>
                        )}
                    </h3>
                    <p className={`text-xs ${isNanoBanana ? 'text-amber-200/70' : 'text-emerald-300/70'}`}>
                        {isGlobal
                            ? 'Pemantauan real-time performa penjualan, tingkat okupansi meja, dan kontrol operasional di seluruh cabang.'
                            : `Laporan detail metrik operasional, transaksi harian, dan analisis produk terlaris untuk ${selectedOutlet}.`}
                    </p>
                </div>
            </div>
            <div className="flex items-center gap-2">
                <select
                    value={selectedOutlet}
                    onChange={(e) => onSelectOutlet(e.target.value)}
                    className="bg-black/60 border border-white/20 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-amber-500 transition-all shadow-inner"
                >
                    <option>Semua Outlet (Global)</option>
                    <option>Restoku Pusat (Jakarta)</option>
                    <option>Restoku Cabang (Bandung)</option>
                </select>
            </div>
        </div>
    );
}
