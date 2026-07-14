import React from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { Glass, formatRupiah as formatRp } from '../../Components/Shared';
import { WalletIcon, TrendingUpIcon, ReceiptIcon, FileTextIcon } from '../../Components/icons';

interface Financials {
    gross_profit: number;
    cogs_estimate: number;
    operational_expenses_estimate: number;
    net_profit_estimate: number;
    cash_in: number;
    cash_out: number;
    is_estimate?: boolean;
    note?: string;
}

interface Props {
    financials: Financials;
    filters?: { date_range?: string };
}

export default function LaporanLabaRugi({ financials, filters }: Props) {
    const rows = [
        {
            label: 'Pendapatan Kotor (Gross)',
            value: financials.gross_profit,
            icon: WalletIcon,
            color: 'text-emerald-400',
        },
        { label: 'HPP (COGS 35%)', value: financials.cogs_estimate, icon: ReceiptIcon, color: 'text-red-400' },
        {
            label: 'Biaya Operasional (20%)',
            value: financials.operational_expenses_estimate,
            icon: TrendingUpIcon,
            color: 'text-amber-400',
        },
        {
            label: 'Laba Bersih (Net)',
            value: financials.net_profit_estimate,
            icon: FileTextIcon,
            color: 'text-blue-400',
        },
    ];

    return (
        <MainLayout>
            <Head title="Laba & Rugi - Restoku" />
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight text-white">Laba & Rugi</h1>
                <p className="text-slate-400 mt-1">Ringkasan P&L per periode (estimasi benchmark industri).</p>
                {financials.is_estimate && <p className="text-xs text-slate-500 mt-2 italic">{financials.note}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                {rows.map((r, i) => (
                    <Glass key={i} className="p-6 flex items-center gap-4">
                        <div className={`p-3 rounded-xl bg-white/5`}>
                            <r.icon className={`size-6 ${r.color}`} />
                        </div>
                        <div>
                            <p className="text-sm text-slate-400">{r.label}</p>
                            <h3 className="text-2xl font-bold text-white">{formatRp(r.value)}</h3>
                        </div>
                    </Glass>
                ))}
            </div>

            <Glass className="p-6">
                <h3 className="text-lg font-semibold text-white mb-4">Arus Kas</h3>
                <div className="grid grid-cols-2 gap-4">
                    <div className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4">
                        <div className="text-sm text-emerald-400">Kas Masuk</div>
                        <div className="text-xl font-bold text-white">{formatRp(financials.cash_in)}</div>
                    </div>
                    <div className="bg-red-500/10 border border-red-500/20 rounded-xl p-4">
                        <div className="text-sm text-red-400">Kas Keluar</div>
                        <div className="text-xl font-bold text-white">{formatRp(financials.cash_out)}</div>
                    </div>
                </div>
            </Glass>
        </MainLayout>
    );
}
