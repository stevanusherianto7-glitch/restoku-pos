import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { Glass, formatRupiah as formatRp } from '../../Components/Shared';
import {
    DownloadIcon,
    CalculatorIcon,
    FileTextIcon,
    ArrowUpRightIcon,
    ArrowDownRightIcon,
    WalletIcon,
    ReceiptIcon,
    PercentIcon,
} from '../../Components/icons';

interface Financials {
    gross_profit: number;
    cogs: number;
    operational_expenses: number;
    net_profit: number;
    cash_in: number;
    cash_out: number;
}

interface Props {
    financials: Financials;
}

export default function Reports({ financials }: Props) {
    const [startDate, setStartDate] = useState('2026-07-01');
    const [endDate, setEndDate] = useState('2026-07-31');

    const handleExportPDF = () => {
        window.print();
    };

    const revenueBreakdown = [
        { label: 'Dine In', amount: 28500000, percentage: 62, color: 'bg-emerald-400' },
        { label: 'Takeaway', amount: 10200000, percentage: 22, color: 'bg-blue-400' },
        { label: 'GoFood', amount: 4500000, percentage: 10, color: 'bg-red-500' },
        { label: 'GrabFood', amount: 2623500, percentage: 6, color: 'bg-green-500' },
    ];

    const costsBreakdown = [
        { label: 'Food Cost', amount: financials.cogs, percentage: 38, color: 'bg-orange-400' },
        { label: 'Labor Cost', amount: 12830580, percentage: 28, color: 'bg-amber-400' },
        { label: 'Operational', amount: financials.operational_expenses, percentage: 10, color: 'bg-purple-400' },
    ];

    const totalCosts = financials.cogs + 12830580 + financials.operational_expenses;
    const totalRevenue = financials.gross_profit;

    return (
        <MainLayout>
            <Head title="Laporan Keuangan - Restoku" />

            <style
                dangerouslySetInnerHTML={{
                    __html: `
                @media print {
                    /* Hide sidebar and navigation elements */
                    aside, nav, header, button, select, input, .no-print, [role="navigation"] {
                        display: none !important;
                    }
                    /* Layout reset */
                    body, html {
                        background: #000000 !important;
                        color: #ffffff !important;
                        font-size: 12px !important;
                    }
                    main {
                        padding: 0 !important;
                        margin: 0 !important;
                        background: transparent !important;
                    }
                    .grid {
                        display: grid !important;
                        grid-template-cols: 1fr 1fr !important;
                        gap: 20px !important;
                    }
                    /* Ensure P&L & Cash Flow print side-by-side or stacked cleanly */
                    .glass-card {
                        background: rgba(255, 255, 255, 0.03) !important;
                        border: 1px solid rgba(255, 255, 255, 0.1) !important;
                        box-shadow: none !important;
                        page-break-inside: avoid !important;
                        border-radius: 12px !important;
                        padding: 16px !important;
                    }
                }
            `,
                }}
            />

            <div className="flex justify-between items-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out no-print">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white">Laporan Keuangan</h1>
                    <p className="text-slate-400 mt-1">Laba-rugi dan Arus Kas tingkat eksekutif bulan ini.</p>
                </div>
                <div className="flex items-center gap-3">
                    {/* Glass Date Picker Range */}
                    <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 shadow-sm">
                        <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">Periode:</span>
                        <input
                            type="date"
                            value={startDate}
                            onChange={(e) => setStartDate(e.target.value)}
                            className="bg-transparent border-none text-white text-xs font-semibold focus:ring-0 outline-none cursor-pointer"
                        />
                        <span className="text-slate-500 text-xs">-</span>
                        <input
                            type="date"
                            value={endDate}
                            onChange={(e) => setEndDate(e.target.value)}
                            className="bg-transparent border-none text-white text-xs font-semibold focus:ring-0 outline-none cursor-pointer"
                        />
                    </div>

                    <button
                        onClick={handleExportPDF}
                        className="flex items-center gap-2 bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2 rounded-xl text-sm font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)]"
                    >
                        <DownloadIcon className="size-4" /> Export PDF
                    </button>
                </div>
            </div>

            {/* Print-only Header */}
            <div className="hidden print:block mb-8 border-b border-white/10 pb-4">
                <h1 className="text-2xl font-bold text-white">LAPORAN KEUANGAN RESTORAN</h1>
                <p className="text-slate-400 text-xs mt-1">
                    Periode: {startDate} s/d {endDate} • Cetak: {new Date().toLocaleDateString('id-ID')}
                </p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-8">
                {/* Laba Rugi (P&L) Detail */}
                <Glass className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <CalculatorIcon className="size-5 text-emerald-400" /> Ringkasan Laba & Rugi (P&L)
                    </h3>

                    {/* Pendapatan */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <WalletIcon className="size-4 text-emerald-400" />
                            <h4 className="font-semibold text-slate-200 uppercase tracking-widest text-xs">
                                Pendapatan
                            </h4>
                        </div>
                        <div className="space-y-3 pl-6 mb-4">
                            {revenueBreakdown.map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className={`size-2 rounded-full ${item.color}`} />
                                        <span className="text-slate-400">{item.label}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-white font-medium w-24 text-right">
                                            {formatRp(item.amount)}
                                        </span>
                                        <span className="text-slate-500 text-xs w-8 text-right">
                                            {item.percentage}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between items-center pl-6 py-3 border-t border-white/10 mt-2">
                            <span className="font-bold text-emerald-400">Total Revenue</span>
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-emerald-400 w-24 text-right">
                                    {formatRp(totalRevenue)}
                                </span>
                                <span className="text-emerald-500/50 font-bold text-xs w-8 text-right">100%</span>
                            </div>
                        </div>
                    </div>

                    {/* Biaya */}
                    <div className="mb-8">
                        <div className="flex items-center gap-2 mb-4">
                            <ReceiptIcon className="size-4 text-red-400" />
                            <h4 className="font-semibold text-slate-200 uppercase tracking-widest text-xs">Biaya</h4>
                        </div>
                        <div className="space-y-3 pl-6 mb-4">
                            {costsBreakdown.map((item, i) => (
                                <div key={i} className="flex justify-between items-center text-sm">
                                    <div className="flex items-center gap-2">
                                        <div className={`size-2 rounded-full ${item.color}`} />
                                        <span className="text-slate-400">{item.label}</span>
                                    </div>
                                    <div className="flex items-center gap-4">
                                        <span className="text-white font-medium w-24 text-right">
                                            {formatRp(item.amount)}
                                        </span>
                                        <span className="text-slate-500 text-xs w-8 text-right">
                                            {item.percentage}%
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div className="flex justify-between items-center pl-6 py-3 border-t border-white/10 mt-2">
                            <span className="font-bold text-red-400">Total Biaya</span>
                            <div className="flex items-center gap-4">
                                <span className="font-bold text-red-400 w-24 text-right">{formatRp(totalCosts)}</span>
                                <span className="text-red-500/50 font-bold text-xs w-8 text-right">76%</span>
                            </div>
                        </div>
                    </div>

                    <div className="my-6 border-t border-dashed border-white/20"></div>

                    {/* Net Profit */}
                    <div className="flex justify-between items-center p-5 bg-gradient-to-br from-emerald-500/20 to-emerald-600/10 border border-emerald-500/30 text-white rounded-xl shadow-[0_0_30px_rgba(16,185,129,0.15)] relative overflow-hidden">
                        <div className="absolute inset-0 bg-[linear-gradient(45deg,transparent_25%,rgba(255,255,255,0.05)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-shimmer pointer-events-none" />
                        <span className="text-lg font-bold text-emerald-300">Laba Bersih (Net Profit)</span>
                        <div className="flex items-baseline gap-3">
                            <span className="text-3xl font-extrabold text-emerald-400">
                                {formatRp(financials.net_profit)}
                            </span>
                            <span className="text-sm font-semibold text-emerald-500/70">34%</span>
                        </div>
                    </div>

                    {/* Pajak */}
                    <div className="mt-8">
                        <div className="flex items-center gap-2 mb-4">
                            <PercentIcon className="size-4 text-purple-400" />
                            <h4 className="font-semibold text-slate-200 uppercase tracking-widest text-xs">
                                Pajak & Titipan
                            </h4>
                        </div>
                        <div className="space-y-3 pl-6">
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">PBJT (Pajak Pembangunan 1) 10%</span>
                                <span className="text-white font-medium">{formatRp(4165773)}</span>
                            </div>
                            <div className="flex justify-between items-center text-sm">
                                <span className="text-slate-400">Service Charge 5%</span>
                                <span className="text-white font-medium">{formatRp(2291175)}</span>
                            </div>
                        </div>
                    </div>
                </Glass>

                {/* Arus Kas (Cash Flow) */}
                <Glass className="p-6 flex flex-col">
                    <h3 className="text-lg font-semibold text-white mb-6 flex items-center gap-2">
                        <FileTextIcon className="size-5 text-blue-400" /> Arus Kas (Cash Flow)
                    </h3>

                    <div className="flex gap-4 mb-8">
                        <div className="flex-1 p-5 rounded-2xl border border-emerald-500/20 bg-emerald-500/5 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-emerald-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-center gap-2 text-emerald-400 mb-3 relative z-10">
                                <div className="p-1.5 bg-emerald-500/20 rounded-lg">
                                    <ArrowDownRightIcon className="size-4" />
                                </div>
                                <span className="font-medium text-sm">Kas Masuk</span>
                            </div>
                            <div className="text-2xl font-bold text-white relative z-10">
                                {formatRp(financials.cash_in)}
                            </div>
                        </div>

                        <div className="flex-1 p-5 rounded-2xl border border-red-500/20 bg-red-500/5 relative overflow-hidden group">
                            <div className="absolute inset-0 bg-red-500/10 opacity-0 group-hover:opacity-100 transition-opacity" />
                            <div className="flex items-center gap-2 text-red-400 mb-3 relative z-10">
                                <div className="p-1.5 bg-red-500/20 rounded-lg">
                                    <ArrowUpRightIcon className="size-4" />
                                </div>
                                <span className="font-medium text-sm">Kas Keluar</span>
                            </div>
                            <div className="text-2xl font-bold text-white relative z-10">
                                {formatRp(financials.cash_out)}
                            </div>
                        </div>
                    </div>

                    <div className="p-6 rounded-2xl bg-black/40 border border-white/5 text-white flex-1 flex flex-col justify-center text-center">
                        <p className="text-slate-400 text-sm font-medium mb-2 uppercase tracking-widest">
                            Net Cash Flow
                        </p>
                        <h3
                            className={`text-5xl font-black mb-6 tracking-tight ${financials.cash_in - financials.cash_out >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                        >
                            {formatRp(financials.cash_in - financials.cash_out)}
                        </h3>

                        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-xl text-left">
                            <p className="text-[11px] text-blue-200/70 leading-relaxed">
                                <strong className="text-blue-300">Catatan Owner:</strong> Arus kas (Cash Flow) berbeda
                                dengan Laba Bersih (Net Profit) karena memperhitungkan perpindahan uang tunai aktual.
                                Saldo bisa lebih rendah akibat keterlambatan pencairan dana QRIS/GoFood, atau lebih
                                tinggi karena uang muka pesanan bulan depan.
                            </p>
                        </div>
                    </div>
                </Glass>
            </div>
        </MainLayout>
    );
}
