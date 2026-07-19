import { ClockIcon } from '../../Components/icons';

export function PeakOrderHours({ isNanoBanana = false }: { isNanoBanana?: boolean }) {
    const hours = [
        { hour: '08:00', orders: 12, label: 'Pagi', rush: false },
        { hour: '10:00', orders: 28, label: 'Pagi', rush: false },
        { hour: '11:30', orders: 85, label: 'Lunch Rush', rush: true },
        { hour: '12:30', orders: 94, label: 'Lunch Rush', rush: true },
        { hour: '14:00', orders: 42, label: 'Siang', rush: false },
        { hour: '16:00', orders: 55, label: 'Sore', rush: false },
        { hour: '18:30', orders: 98, label: 'Dinner Rush', rush: true },
        { hour: '19:30', orders: 105, label: 'Peak Dinner', rush: true },
        { hour: '21:00', orders: 60, label: 'Malam', rush: false },
    ];

    const maxOrders = 105;

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
                <span className="flex items-center gap-2">
                    <ClockIcon className="size-3.5 text-blue-400 shrink-0" /> Distribusi Pesanan (Hari Ini)
                </span>
                <span className="flex items-center gap-3 font-mono text-[10px] shrink-0">
                    <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-amber-400" /> Jam Ramai
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-slate-600" /> Normal
                    </span>
                </span>
            </div>

            <div className="overflow-x-auto pb-2 pr-1 scrollbar-thin">
                <div className="grid grid-cols-9 gap-3 items-end h-32 pt-4 border-b border-white/5 pb-2 min-w-[380px] md:min-w-0">
                    {hours.map((h, i) => {
                        const heightPct = Math.round((h.orders / maxOrders) * 100);
                        return (
                            <div key={i} className="flex flex-col items-center gap-1 group relative">
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-xl">
                                    <p className="font-bold">{h.hour} WIB</p>
                                    <p className="text-slate-300">{h.orders} Transaksi/Jam</p>
                                </div>

                                <div
                                    style={{ height: `${heightPct}%` }}
                                    className={`w-full rounded-t-md transition-all duration-300 ${
                                        h.rush
                                            ? isNanoBanana
                                                ? 'bg-gradient-to-t from-amber-600 to-amber-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]'
                                                : 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                            : 'bg-white/10 group-hover:bg-white/20'
                                    }`}
                                />

                                <span
                                    className={`text-[10px] font-mono mt-1 ${
                                        h.rush
                                            ? isNanoBanana
                                                ? 'text-amber-400 font-bold'
                                                : 'text-emerald-400 font-bold'
                                            : 'text-slate-500'
                                    }`}
                                >
                                    {h.hour}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="bg-white/[0.02] border border-white/5 p-2 rounded-xl flex flex-col items-center justify-center text-center space-y-0.5 min-w-0">
                    <span className="text-[10px] text-slate-400 font-semibold truncate w-full">Puncak Lunch</span>
                    <span className="text-xs font-bold text-white">12:30 WIB</span>
                    <span className="text-[9px] text-slate-400 font-bold">(94 Order)</span>
                </div>
                <div className="bg-white/[0.02] border border-white/5 p-2 rounded-xl flex flex-col items-center justify-center text-center space-y-0.5 min-w-0">
                    <span className="text-[10px] text-slate-400 font-semibold truncate w-full">Puncak Dinner</span>
                    <span className="text-xs font-bold text-amber-400">19:30 WIB</span>
                    <span className="text-[9px] text-amber-500/80 font-bold">(105 Order)</span>
                </div>
                <div className="bg-white/[0.02] border border-white/5 p-2 rounded-xl flex flex-col items-center justify-center text-center space-y-0.5 min-w-0">
                    <span className="text-[10px] text-slate-400 font-semibold truncate w-full">Rata-rata Saji</span>
                    <span className="text-xs font-bold text-emerald-400">14 Menit</span>
                    <span className="text-[9px] text-emerald-500/80 font-bold">(KDS Lead)</span>
                </div>
            </div>
        </div>
    );
}
