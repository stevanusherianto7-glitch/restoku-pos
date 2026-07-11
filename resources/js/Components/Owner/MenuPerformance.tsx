import { Screen, Glass, Badge, formatRupiah as formatRp } from '../Shared';
import { TrophyIcon, AlertTriangleIcon } from '../icons';

export function MenuPerformance() {
    const topMenu = [
        { id: 1, name: 'Nasi Goreng Spesial', sold: 520, revenue: 13000000, hpp: 4940000, foodCost: 38.0 },
        { id: 2, name: 'Es Teh Manis', sold: 450, revenue: 2250000, hpp: 292500, foodCost: 13.0 },
        { id: 3, name: 'Ayam Geprek', sold: 380, revenue: 11400000, hpp: 4788000, foodCost: 42.0 },
        { id: 4, name: 'Mie Goreng Seafood', sold: 320, revenue: 6400000, hpp: 2176000, foodCost: 34.0 },
        { id: 5, name: 'Kopi Hitam', sold: 290, revenue: 2900000, hpp: 580000, foodCost: 20.0 },
    ];

    return (
        <Screen title="Analisis Menu">
            <Glass className="p-6">
                <div className="flex items-center gap-3 mb-6">
                    <div className="p-2 bg-amber-500/10 rounded-lg border border-amber-500/20">
                        <TrophyIcon className="size-5 text-amber-400" />
                    </div>
                    <div>
                        <h3 className="text-lg font-semibold text-white">Top Menu Terlaris</h3>
                        <p className="text-sm text-slate-400">Juli 2026</p>
                    </div>
                </div>

                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="text-xs text-slate-400 uppercase bg-white/5 border-b border-white/10">
                            <tr>
                                <th className="px-4 py-3 rounded-tl-lg">Menu</th>
                                <th className="px-4 py-3 text-center">Terjual</th>
                                <th className="px-4 py-3 text-right">Revenue</th>
                                <th className="px-4 py-3 text-right">HPP (Estimasi)</th>
                                <th className="px-4 py-3 text-center rounded-tr-lg">Food Cost %</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {topMenu.map((item, idx) => (
                                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                    <td className="px-4 py-3 font-medium text-white flex items-center gap-3">
                                        <span className="text-slate-500 font-mono w-4">{idx + 1}.</span>
                                        {item.name}
                                    </td>
                                    <td className="px-4 py-3 text-center">{item.sold}</td>
                                    <td className="px-4 py-3 text-right text-emerald-400 font-medium">
                                        {formatRp(item.revenue)}
                                    </td>
                                    <td className="px-4 py-3 text-right">{formatRp(item.hpp)}</td>
                                    <td className="px-4 py-3 text-center">
                                        <div className="flex items-center justify-center gap-2">
                                            <Badge
                                                tone={
                                                    item.foodCost > 40
                                                        ? 'red'
                                                        : item.foodCost > 35
                                                          ? 'amber'
                                                          : 'emerald'
                                                }
                                            >
                                                {item.foodCost.toFixed(1)}%
                                            </Badge>
                                            {item.foodCost > 40 && (
                                                <span title="Food cost terlalu tinggi">
                                                    <AlertTriangleIcon
                                                        className="size-4 text-red-400"
                                                        aria-label="Food cost terlalu tinggi"
                                                    />
                                                </span>
                                            )}
                                        </div>
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>
            </Glass>
        </Screen>
    );
}
