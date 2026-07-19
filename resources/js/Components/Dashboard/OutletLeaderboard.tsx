import { Glass, Badge, formatRupiah } from '../../Components/Shared';
import { AwardIcon, ChevronRightIcon, ShieldAlertIcon, AlertTriangleIcon } from '../../Components/icons';

type OutletRank = { rank: number; name: string; city: string; rev: number; growth: string; status: string };
type AlertOutlet = { name: string; issue: string; type: 'fraud' | 'revenue' };

export function OutletLeaderboard({
    topOutlets,
    alertOutlets,
}: {
    topOutlets: OutletRank[];
    alertOutlets: AlertOutlet[];
}) {
    return (
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            <Glass className="p-6 lg:col-span-2 border-white/10" hover>
                <div className="flex justify-between items-center mb-4">
                    <div>
                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                            <AwardIcon className="size-4 text-amber-400" />
                            Peringkat Kinerja Cabang Terbaik (Top Revenue Generators)
                        </h2>
                        <p className="text-xs text-slate-400">
                            Cabang dengan kontribusi omset dan stabilitas operasional tertinggi pada periode ini.
                        </p>
                    </div>
                    <span className="text-xs text-blue-400 font-semibold cursor-pointer hover:underline flex items-center gap-1">
                        Lihat Semua 100 Cabang <ChevronRightIcon className="size-3.5" />
                    </span>
                </div>
                <div className="space-y-3">
                    {topOutlets.map((o) => (
                        <div
                            key={o.rank}
                            className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all"
                        >
                            <div className="flex items-center gap-3.5">
                                <div
                                    className={`size-8 rounded-lg flex items-center justify-center font-extrabold text-sm ${
                                        o.rank === 1
                                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_12px_rgba(234,179,8,0.25)]'
                                            : 'bg-white/10 text-slate-300'
                                    }`}
                                >
                                    #{o.rank}
                                </div>
                                <div>
                                    <p className="text-sm font-bold text-white">{o.name}</p>
                                    <p className="text-xs text-slate-400">{o.city}</p>
                                </div>
                            </div>
                            <div className="text-right">
                                <p className="text-sm font-bold font-mono text-emerald-400">{formatRupiah(o.rev)}</p>
                                <p className="text-xs text-slate-400 flex items-center justify-end gap-1.5">
                                    <span className="text-emerald-400 font-semibold">{o.growth}</span> vs periode lalu
                                </p>
                            </div>
                        </div>
                    ))}
                </div>
            </Glass>

            <Glass className="p-6 border-red-500/30 bg-red-500/[0.03]" hover>
                <div className="flex items-center gap-2 text-red-400 mb-2">
                    <ShieldAlertIcon className="size-5 animate-bounce" />
                    <h2 className="text-base font-bold text-white">Radar Audit & Peringatan Cabang</h2>
                </div>
                <p className="text-xs text-slate-400 mb-4">
                    Deteksi anomali finansial, lonjakan void, dan penurunan omset ekstrem di cabang.
                </p>
                <div className="space-y-3">
                    {alertOutlets.map((a, i) => (
                        <div key={i} className="p-3.5 rounded-xl bg-black/40 border border-red-500/30 space-y-1">
                            <div className="flex items-center justify-between">
                                <span className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                                    <AlertTriangleIcon className="size-3.5 text-red-400" /> {a.name}
                                </span>
                                <Badge tone="red">{a.type === 'fraud' ? 'AUDIT REQUIRED' : 'UNDERPERFORMING'}</Badge>
                            </div>
                            <p className="text-xs text-slate-300 pt-1 leading-relaxed">{a.issue}</p>
                        </div>
                    ))}
                </div>
            </Glass>
        </div>
    );
}
