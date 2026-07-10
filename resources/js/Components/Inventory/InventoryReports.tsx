import { useState } from 'react';
import { Screen, Glass, Badge, Button, Input, formatRupiah as formatRp } from '../Shared';
import { Search, Filter, Download, FileText, TrendingUp, TrendingDown } from 'lucide-react';

export function InventoryReports() {
    const [activeTab, setActiveTab] = useState<'hpp' | 'mutasi'>('hpp');

    const hppReports = [
        { id: 1, menu: 'Nasi Goreng Spesial', price: 25000, cost: 8500, percentage: 34.0, profit: 16500 },
        { id: 2, menu: 'Ayam Geprek', price: 28000, cost: 11200, percentage: 40.0, profit: 16800 },
        { id: 3, menu: 'Es Teh Manis', price: 5000, cost: 500, percentage: 10.0, profit: 4500 },
        { id: 4, menu: 'Mie Goreng Seafood', price: 32000, cost: 12000, percentage: 37.5, profit: 20000 },
    ];

    const mutationReports = [
        { id: 1, date: '12 Jul 2026', item: 'Beras Premium', in: 50, out: 12, balance: 38, unit: 'kg' },
        { id: 2, date: '12 Jul 2026', item: 'Daging Ayam', in: 10, out: 8, balance: 2, unit: 'kg' },
        { id: 3, date: '12 Jul 2026', item: 'Minyak Goreng', in: 0, out: 5, balance: 5, unit: 'liter' },
    ];

    return (
        <Screen title="Laporan Inventaris & Stok">
            {/* Tabs */}
            <div className="flex gap-2 border-b border-white/10 mb-6 pb-px overflow-x-auto">
                <button
                    onClick={() => setActiveTab('hpp')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'hpp' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                >
                    <TrendingUp className="size-4" /> Laporan HPP & Food Cost
                </button>
                <button
                    onClick={() => setActiveTab('mutasi')}
                    className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'mutasi' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
                >
                    <FileText className="size-4" /> Laporan Mutasi Stok
                </button>
            </div>

            <Glass className="p-6">
                {/* Toolbar */}
                <div className="flex flex-col md:flex-row gap-4 mb-6 md:items-center justify-between">
                    <div className="flex gap-2 items-center">
                        <Input type="date" className="w-36 text-slate-400" defaultValue="2026-07-01" />
                        <span className="text-slate-500">-</span>
                        <Input type="date" className="w-36 text-slate-400" defaultValue="2026-07-12" />
                    </div>
                    <div className="flex gap-2">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
                            <Input placeholder={`Cari data...`} className="pl-9 w-full md:w-64" />
                        </div>
                        <Button variant="outline" className="gap-2">
                            <Download className="size-4" /> Export CSV
                        </Button>
                    </div>
                </div>

                {/* Tables */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left text-sm text-slate-300">
                        <thead className="text-xs text-slate-400 uppercase bg-white/5">
                            {activeTab === 'hpp' && (
                                <tr>
                                    <th className="px-4 py-3 rounded-tl-lg">Menu / Produk</th>
                                    <th className="px-4 py-3 text-right">Harga Jual</th>
                                    <th className="px-4 py-3 text-right">Biaya Bahan (HPP)</th>
                                    <th className="px-4 py-3 text-center">Food Cost %</th>
                                    <th className="px-4 py-3 text-right rounded-tr-lg">Laba Kotor</th>
                                </tr>
                            )}
                            {activeTab === 'mutasi' && (
                                <tr>
                                    <th className="px-4 py-3 rounded-tl-lg">Tanggal</th>
                                    <th className="px-4 py-3">Nama Bahan</th>
                                    <th className="px-4 py-3 text-center">Stok Masuk</th>
                                    <th className="px-4 py-3 text-center">Stok Keluar</th>
                                    <th className="px-4 py-3 text-center rounded-tr-lg">Saldo Akhir</th>
                                </tr>
                            )}
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {activeTab === 'hpp' &&
                                hppReports.map((item) => (
                                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 font-medium text-white">{item.menu}</td>
                                        <td className="px-4 py-3 text-right">{formatRp(item.price)}</td>
                                        <td className="px-4 py-3 text-right">{formatRp(item.cost)}</td>
                                        <td className="px-4 py-3 text-center">
                                            <Badge
                                                tone={
                                                    item.percentage > 35
                                                        ? 'red'
                                                        : item.percentage > 25
                                                          ? 'emerald'
                                                          : 'blue'
                                                }
                                            >
                                                {item.percentage}%
                                            </Badge>
                                        </td>
                                        <td className="px-4 py-3 text-right font-semibold text-emerald-400">
                                            {formatRp(item.profit)}
                                        </td>
                                    </tr>
                                ))}

                            {activeTab === 'mutasi' &&
                                mutationReports.map((item) => (
                                    <tr key={item.id} className="hover:bg-white/5 transition-colors">
                                        <td className="px-4 py-3 text-slate-400">{item.date}</td>
                                        <td className="px-4 py-3 font-medium text-white">{item.item}</td>
                                        <td className="px-4 py-3 text-center text-emerald-400 font-medium">
                                            +{item.in}{' '}
                                            <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-red-400 font-medium">
                                            -{item.out}{' '}
                                            <span className="text-xs font-normal text-slate-500">{item.unit}</span>
                                        </td>
                                        <td className="px-4 py-3 text-center text-white font-semibold">
                                            {item.balance}{' '}
                                            <span className="text-xs font-normal text-slate-500">{item.unit}</span>
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
