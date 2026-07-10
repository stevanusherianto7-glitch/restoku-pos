import { Screen, Glass, Button, formatRupiah as formatRp } from '../Shared';
import { Download, FileText, FileSpreadsheet, FileJson, TrendingUp } from 'lucide-react';

export function FinancialReports() {
    const revenueBreakdown = [
        { label: 'Dine In', amount: 28500000, pct: 62 },
        { label: 'Takeaway', amount: 10200000, pct: 22 },
        { label: 'GoFood', amount: 4500000, pct: 10 },
        { label: 'GrabFood', amount: 2623500, pct: 6 },
    ];
    const totalRevenue = 45823500;

    const costBreakdown = [
        { label: 'Food Cost', amount: 17412930, pct: 38 },
        { label: 'Labor Cost', amount: 12830580, pct: 28 },
        { label: 'Operational', amount: 4582350, pct: 10 },
    ];
    const totalCost = 34825860;

    const netProfit = 15579990;
    const netProfitPct = 34;

    const taxes = [
        { label: 'PBJT 10%', amount: 4165773 },
        { label: 'Service Charge', amount: 2291175 },
    ];

    return (
        <Screen
            title="Laporan Keuangan"
            action={
                <div className="flex gap-2">
                    <Button variant="outline" className="gap-2 text-xs">
                        <FileText className="size-3" /> PDF
                    </Button>
                    <Button variant="outline" className="gap-2 text-xs">
                        <FileSpreadsheet className="size-3" /> Excel
                    </Button>
                    <Button variant="outline" className="gap-2 text-xs">
                        <FileJson className="size-3" /> CSV
                    </Button>
                </div>
            }
        >
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
                {/* Income / Revenue */}
                <Glass className="p-6 border-emerald-500/20">
                    <h3 className="text-lg font-semibold text-emerald-400 mb-6 flex items-center gap-2">
                        <TrendingUp className="size-5" /> Pendapatan (Revenue)
                    </h3>

                    <div className="space-y-4 mb-6">
                        {revenueBreakdown.map((item) => (
                            <div key={item.label}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-300">{item.label}</span>
                                    <div className="flex gap-4">
                                        <span className="text-white font-medium w-24 text-right">
                                            {formatRp(item.amount)}
                                        </span>
                                        <span className="text-slate-400 w-8 text-right">{item.pct}%</span>
                                    </div>
                                </div>
                                <div className="w-full h-1.5 rounded-full bg-white/5">
                                    <div
                                        className="h-full rounded-full bg-emerald-500/60"
                                        style={{ width: `${item.pct}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                        <span className="font-semibold text-white">Total Revenue</span>
                        <div className="flex gap-4 font-bold text-emerald-400">
                            <span className="w-24 text-right text-lg">{formatRp(totalRevenue)}</span>
                            <span className="w-8 text-right text-sm self-center">100%</span>
                        </div>
                    </div>
                </Glass>

                {/* Expenses / Costs */}
                <div className="space-y-6">
                    <Glass className="p-6 border-red-500/20">
                        <h3 className="text-lg font-semibold text-red-400 mb-6 flex items-center gap-2">
                            <TrendingUp className="size-5 rotate-180" /> Pengeluaran (Biaya)
                        </h3>

                        <div className="space-y-4 mb-6">
                            {costBreakdown.map((item) => (
                                <div key={item.label}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-300">{item.label}</span>
                                        <div className="flex gap-4">
                                            <span className="text-white font-medium w-24 text-right">
                                                {formatRp(item.amount)}
                                            </span>
                                            <span className="text-slate-400 w-8 text-right">{item.pct}%</span>
                                        </div>
                                    </div>
                                    <div className="w-full h-1.5 rounded-full bg-white/5">
                                        <div
                                            className="h-full rounded-full bg-red-500/60"
                                            style={{ width: `${item.pct}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>

                        <div className="pt-4 border-t border-white/10 flex justify-between items-center">
                            <span className="font-semibold text-white">Total Biaya</span>
                            <div className="flex gap-4 font-bold text-red-400">
                                <span className="w-24 text-right text-lg">{formatRp(totalCost)}</span>
                                <span className="w-8 text-right text-sm self-center">76%</span>
                            </div>
                        </div>
                    </Glass>

                    {/* Profit & Tax */}
                    <div className="grid grid-cols-2 gap-4">
                        <Glass className="p-5 border-amber-500/30 bg-amber-500/5">
                            <h4 className="text-xs font-semibold text-amber-500 uppercase tracking-wider mb-2">
                                Laba Bersih
                            </h4>
                            <div className="text-2xl font-bold text-amber-400 mb-1">{formatRp(netProfit)}</div>
                            <div className="text-sm text-slate-400">
                                Margin: <span className="text-amber-300 font-medium">{netProfitPct}%</span>
                            </div>
                        </Glass>

                        <Glass className="p-5">
                            <h4 className="text-xs font-semibold text-slate-400 uppercase tracking-wider mb-3">
                                Pajak Terkumpul
                            </h4>
                            <div className="space-y-2">
                                {taxes.map((tax) => (
                                    <div key={tax.label} className="flex justify-between text-sm">
                                        <span className="text-slate-400">{tax.label}</span>
                                        <span className="text-white font-medium">{formatRp(tax.amount)}</span>
                                    </div>
                                ))}
                            </div>
                        </Glass>
                    </div>
                </div>
            </div>
        </Screen>
    );
}
