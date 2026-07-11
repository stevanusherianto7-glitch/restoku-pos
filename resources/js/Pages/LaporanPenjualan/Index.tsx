import { useState } from 'react';
import { Head } from '@inertiajs/react';

import MainLayout from '../../Layouts/MainLayout';
import { Screen, Glass, Badge, formatRupiah, TAX_LABELS } from '../../Components/Shared';
import { Download } from 'lucide-react';

import { RoleGuard } from '../../Components/RoleGuard';

function LaporanPenjualanInner() {
    const [startDate, setStartDate] = useState('2026-07-01');
    const [endDate, setEndDate] = useState('2026-07-07');

    const summary: Array<{ label: string; value: string; delta: string; tone: Tone }> = [
        { label: 'Total Penjualan', value: formatRupiah(87500000), delta: '+15.2%', tone: 'emerald' },
        { label: 'Jumlah Transaksi', value: '1.842 order', delta: '+8.7%', tone: 'blue' },
        { label: 'Rata-rata per Order', value: formatRupiah(47500), delta: '+6.0%', tone: 'violet' },
        { label: 'Dine In vs Takeaway', value: '68% / 32%', delta: 'Stabil', tone: 'amber' },
    ];
    const rows = [
        { date: '06 Jul', orders: 284, revenue: 13500000, food_cost: 3780000, pbjt: 1350000 },
        { date: '05 Jul', orders: 261, revenue: 12400000, food_cost: 3472000, pbjt: 1240000 },
        { date: '04 Jul', orders: 298, revenue: 14200000, food_cost: 3976000, pbjt: 1420000 },
        { date: '03 Jul', orders: 245, revenue: 11650000, food_cost: 3262000, pbjt: 1165000 },
        { date: '02 Jul', orders: 272, revenue: 12900000, food_cost: 3612000, pbjt: 1290000 },
        { date: '01 Jul', orders: 251, revenue: 11900000, food_cost: 3332000, pbjt: 1190000 },
        { date: '30 Jun', orders: 231, revenue: 10950000, food_cost: 3066000, pbjt: 1095000 },
    ];
    return (
        <MainLayout>
            <Head title="Laporan Penjualan" />
            <Screen
                title="Laporan Penjualan"
                action={
                    <div className="flex items-center gap-3 no-print">
                        <div className="flex items-center gap-2 bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 shadow-sm">
                            <span className="text-[9px] font-black text-slate-500 uppercase tracking-widest">
                                Periode:
                            </span>
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
                            onClick={() => window.print()}
                            className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2 text-sm font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center gap-2"
                        >
                            <Download className="size-4" />
                            Cetak PDF
                        </button>
                        <button className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition-colors flex items-center gap-2">
                            <Download className="size-4" />
                            Export Excel
                        </button>
                    </div>
                }
            >
                <style
                    dangerouslySetInnerHTML={{
                        __html: `
        @media print {
          aside, nav, header, button, select, input, .no-print, [role="navigation"] {
            display: none !important;
          }
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
            grid-template-cols: repeat(4, 1fr) !important;
            gap: 15px !important;
          }
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

                {/* Print-only Header */}
                <div className="hidden print:block mb-8 border-b border-white/10 pb-4">
                    <h1 className="text-2xl font-bold text-white">LAPORAN PENJUALAN OUTLET</h1>
                    <p className="text-slate-400 text-xs mt-1">
                        Periode: {startDate} s/d {endDate} � Cetak: {new Date().toLocaleDateString('id-ID')}
                    </p>
                </div>

                <div className="space-y-5">
                    <div className="grid grid-cols-4 gap-5">
                        {summary.map((s) => (
                            <Glass className="p-5" key={s.label}>
                                <p className="text-sm text-slate-400 mb-2">{s.label}</p>
                                <p className="text-xl font-semibold text-slate-100">{s.value}</p>
                                <Badge tone={s.tone} className="mt-2">
                                    {s.delta}
                                </Badge>
                            </Glass>
                        ))}
                    </div>
                    <Glass className="p-5">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-medium text-slate-200">Rincian per Hari</h2>
                            <div className="flex gap-2 no-print">
                                {['7 Hari', '30 Hari', 'Bulan Ini'].map((p) => (
                                    <button
                                        key={p}
                                        className={`px-3 py-1.5 text-xs font-medium rounded-lg transition-colors border ${p === '7 Hari' ? 'bg-white/10 text-white border-white/20' : 'bg-white/5 text-slate-400 border-white/10 hover:bg-white/10'}`}
                                    >
                                        {p}
                                    </button>
                                ))}
                            </div>
                        </div>
                        <div className="grid grid-cols-[100px_1fr_1fr_1fr_1fr] border-b border-white/5 pb-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
                            <span>Tanggal</span>
                            <span>Jumlah Order</span>
                            <span>Pendapatan</span>
                            <span>Food Cost</span>
                            <span>{TAX_LABELS.pbjt}</span>
                        </div>
                        {rows.map((r) => (
                            <div
                                key={r.date}
                                className="grid grid-cols-[100px_1fr_1fr_1fr_1fr] items-center border-b border-white/5 py-3.5 text-sm"
                            >
                                <span className="font-medium text-slate-300">{r.date}</span>
                                <span className="font-mono text-slate-400">{r.orders} order</span>
                                <span className="font-mono font-medium text-slate-200">{formatRupiah(r.revenue)}</span>
                                <span className="font-mono text-amber-400">{formatRupiah(r.food_cost)}</span>
                                <span className="font-mono text-slate-400">{formatRupiah(r.pbjt)}</span>
                            </div>
                        ))}
                    </Glass>
                </div>
            </Screen>
        </MainLayout>
    );
}

// --- Role Guard Wrapper -------------------------------------------------------
export default function LaporanPenjualan() {
    return (
        <RoleGuard allowedRoles={['manager', 'owner']} pageName="Laporan Penjualan" allowedRoleLabel="Manager, Owner">
            <LaporanPenjualanInner />
        </RoleGuard>
    );
}
