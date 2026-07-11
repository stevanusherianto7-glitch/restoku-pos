import { useState, type ChangeEvent } from 'react';
import { Screen, Glass, Badge, Button, Input, formatRupiah as formatRp } from '../Shared';
import { Plus, Save, ChevronLeft, Trash2, AlertCircle } from 'lucide-react';

export function RecipeEditor() {
    const [sellingPrice, setSellingPrice] = useState(25000);

    const recipeItems = [
        { id: 1, name: 'Nasi Putih', qty: 0.3, unit: 'kg', cost: 3000 },
        { id: 2, name: 'Telur Ayam', qty: 2, unit: 'butir', cost: 4000 },
        { id: 3, name: 'Bawang Merah', qty: 0.02, unit: 'kg', cost: 600 },
        { id: 4, name: 'Bawang Putih', qty: 0.01, unit: 'kg', cost: 400 },
        { id: 5, name: 'Cabai Merah', qty: 0.01, unit: 'kg', cost: 500 },
    ];

    const totalCost = recipeItems.reduce((acc, item) => acc + item.cost, 0);
    const foodCostPct = ((totalCost / sellingPrice) * 100).toFixed(1);
    const grossProfit = sellingPrice - totalCost;

    return (
        <Screen
            title="Editor Resep & BOM"
            action={
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2">
                        <ChevronLeft className="size-4" /> Kembali
                    </Button>
                    <Button className="gap-2 bg-emerald-600 hover:bg-emerald-700">
                        <Save className="size-4" /> Simpan Resep
                    </Button>
                </div>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Left Col: Recipe Items */}
                <div className="lg:col-span-2 space-y-6">
                    <Glass className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div>
                                <h2 className="text-lg font-semibold text-white">Bahan Baku (BOM)</h2>
                                <p className="text-sm text-slate-400">
                                    Resep untuk menu: <strong className="text-white">Nasi Goreng Spesial</strong>
                                </p>
                            </div>
                            <Button className="gap-2">
                                <Plus className="size-4" /> Tambah Bahan
                            </Button>
                        </div>

                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-sm text-slate-300">
                                <thead className="text-xs text-slate-400 uppercase bg-white/5">
                                    <tr>
                                        <th className="px-4 py-3 rounded-tl-lg">Bahan Baku</th>
                                        <th className="px-4 py-3">Takaran</th>
                                        <th className="px-4 py-3">Satuan</th>
                                        <th className="px-4 py-3">Estimasi Biaya</th>
                                        <th className="px-4 py-3 text-center rounded-tr-lg">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-white/5">
                                    {recipeItems.map((item) => (
                                        <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                            <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                                            <td className="px-4 py-3">
                                                <Input
                                                    type="number"
                                                    defaultValue={item.qty}
                                                    className="w-24 text-right py-1 h-8"
                                                />
                                            </td>
                                            <td className="px-4 py-3 text-slate-400">{item.unit}</td>
                                            <td className="px-4 py-3">{formatRp(item.cost)}</td>
                                            <td className="px-4 py-3">
                                                <div className="flex items-center justify-center gap-2">
                                                    <button className="p-1 hover:bg-red-500/20 rounded-md transition-colors text-slate-400 hover:text-red-400">
                                                        <Trash2 className="size-4" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>

                        <div className="mt-4 p-4 rounded-lg bg-blue-500/10 border border-blue-500/20 flex gap-3">
                            <AlertCircle className="size-5 text-blue-400 shrink-0" />
                            <p className="text-sm text-blue-200">
                                Setiap kali menu ini terjual, stok bahan baku di atas akan otomatis dikurangi dari
                                inventaris berdasarkan takaran.
                            </p>
                        </div>
                    </Glass>
                </div>

                {/* Right Col: Calculations */}
                <div className="space-y-6">
                    <Glass className="p-6">
                        <h3 className="text-lg font-semibold text-white mb-4">Kalkulasi HPP & Laba</h3>

                        <div className="space-y-4">
                            <div className="flex justify-between items-center pb-4 border-b border-white/10">
                                <span className="text-slate-400 text-sm">Total Biaya Bahan (HPP)</span>
                                <span className="font-semibold text-white">{formatRp(totalCost)}</span>
                            </div>

                            <div className="flex justify-between items-center pb-4 border-b border-white/10">
                                <span className="text-slate-400 text-sm">Harga Jual Menu</span>
                                <div className="w-32">
                                    <Input
                                        type="number"
                                        value={sellingPrice}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                            setSellingPrice(Number(e.target.value))
                                        }
                                        className="text-right py-1 h-8"
                                    />
                                </div>
                            </div>

                            <div className="flex justify-between items-center pb-4 border-b border-white/10">
                                <span className="text-slate-400 text-sm">Food Cost %</span>
                                <Badge
                                    tone={
                                        parseFloat(foodCostPct) > 40
                                            ? 'red'
                                            : parseFloat(foodCostPct) > 30
                                              ? 'amber'
                                              : 'emerald'
                                    }
                                >
                                    {foodCostPct}%
                                </Badge>
                            </div>

                            <div className="flex justify-between items-center pt-2">
                                <span className="text-slate-300 font-medium">Estimasi Laba Kotor</span>
                                <span
                                    className={`text-xl font-bold ${grossProfit > 0 ? 'text-emerald-400' : 'text-red-400'}`}
                                >
                                    {formatRp(grossProfit)}
                                </span>
                            </div>
                        </div>

                        <div className="mt-6 text-xs text-slate-500 text-center">
                            Target Food Cost standar restoran umumnya adalah 25% - 35%.
                        </div>
                    </Glass>
                </div>
            </div>
        </Screen>
    );
}
