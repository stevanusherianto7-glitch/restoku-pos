import React from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { Glass, formatRupiah as formatRp } from '../../Components/Shared';
import { ShoppingCartIcon } from '../../Components/icons';

interface TableRow {
    table: string;
    orders: number;
    revenue: number;
}

interface Props {
    tables: TableRow[];
    is_stub?: boolean;
}

export default function LaporanMeja({ tables, is_stub }: Props) {
    const max = Math.max(1, ...tables.map((t) => t.revenue));
    return (
        <MainLayout>
            <Head title="Laporan Meja - Restoku" />
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight text-white">Laporan Meja</h1>
                <p className="text-slate-400 mt-1">Revenue per meja.</p>
                {is_stub && (
                    <p className="text-xs text-slate-500 mt-2 italic">* Data stub (agregasi per-meja belum aktif)</p>
                )}
            </div>

            <Glass className="p-6">
                <div className="space-y-3">
                    {tables.map((t, i) => (
                        <div key={i} className="flex items-center gap-4">
                            <div className="w-12 text-sm font-medium text-slate-200">{t.table}</div>
                            <div className="flex-1">
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-400">{t.orders} order</span>
                                    <span className="text-white font-medium">{formatRp(t.revenue)}</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-blue-400/80 rounded-full"
                                        style={{ width: `${(t.revenue / max) * 100}%` }}
                                    />
                                </div>
                            </div>
                        </div>
                    ))}
                </div>
            </Glass>
        </MainLayout>
    );
}
