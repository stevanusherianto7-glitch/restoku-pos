import { Screen, Glass, formatRupiah as formatRp } from '../Shared';
import { StoreIcon, TrendingUpIcon, TrendingDownIcon, MapPinIcon } from '../icons';

export function MultiOutletView() {
    const outlets = [
        { id: 1, name: 'Cabang A (Pusat)', revenue: 18200000, orders: 520, aov: 35000, growth: 8 },
        { id: 2, name: 'Cabang B (Selatan)', revenue: 15500000, orders: 410, aov: 37800, growth: 15 },
        { id: 3, name: 'Cabang C (Timur)', revenue: 12100000, orders: 320, aov: 37800, growth: -3 },
    ];

    const totalRevenue = outlets.reduce((acc, curr) => acc + curr.revenue, 0);

    return (
        <Screen title="Perbandingan Outlet">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {outlets.map((outlet) => (
                    <Glass
                        key={outlet.id}
                        className="p-6 relative overflow-hidden group hover:border-white/20 transition-colors"
                    >
                        <div className="flex justify-between items-start mb-4">
                            <div className="flex items-center gap-2">
                                <StoreIcon className="size-5 text-slate-400" />
                                <h3 className="font-semibold text-white">{outlet.name}</h3>
                            </div>
                            <div
                                className={`flex items-center gap-1 text-xs font-medium px-2 py-1 rounded-full ${
                                    outlet.growth >= 0
                                        ? 'bg-emerald-500/10 text-emerald-400'
                                        : 'bg-red-500/10 text-red-400'
                                }`}
                            >
                                {outlet.growth >= 0 ? (
                                    <TrendingUpIcon className="size-3" />
                                ) : (
                                    <TrendingDownIcon className="size-3" />
                                )}
                                {outlet.growth > 0 ? '+' : ''}
                                {outlet.growth}%
                            </div>
                        </div>

                        <div className="space-y-3">
                            <div>
                                <div className="text-xs text-slate-400 mb-1">Total Omzet</div>
                                <div className="text-2xl font-bold text-amber-400">{formatRp(outlet.revenue)}</div>
                            </div>
                            <div className="grid grid-cols-2 gap-4 pt-3 border-t border-white/5">
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Pesanan</div>
                                    <div className="font-medium text-white">{outlet.orders}</div>
                                </div>
                                <div>
                                    <div className="text-[10px] text-slate-500 uppercase tracking-wider">Avg Order</div>
                                    <div className="font-medium text-white">{formatRp(outlet.aov)}</div>
                                </div>
                            </div>
                        </div>
                    </Glass>
                ))}
            </div>

            <Glass className="p-6 max-w-4xl">
                <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                    <MapPinIcon className="size-5 text-blue-400" /> Kontribusi Omzet per Cabang
                </h3>

                <div className="space-y-6">
                    {outlets.map((outlet) => {
                        const pct = Math.round((outlet.revenue / totalRevenue) * 100);
                        return (
                            <div key={outlet.id}>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className="font-medium text-slate-200">{outlet.name}</span>
                                    <div className="flex gap-4">
                                        <span className="text-amber-400 font-semibold w-24 text-right">
                                            {formatRp(outlet.revenue)}
                                        </span>
                                        <span className="text-slate-400 w-10 text-right">{pct}%</span>
                                    </div>
                                </div>
                                <div className="w-full h-3 rounded-full bg-white/5 overflow-hidden">
                                    <div
                                        className="h-full rounded-full bg-gradient-to-r from-blue-500 to-indigo-500"
                                        style={{ width: `${pct}%` }}
                                    />
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Glass>
        </Screen>
    );
}
