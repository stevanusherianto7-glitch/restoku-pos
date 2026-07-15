import React from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { Glass, formatRupiah as formatRp } from '../../Components/Shared';
import { AlertCircleIcon } from '../../Components/icons';

interface VoidRow {
    id: number;
    item: string;
    qty: number;
    reason: string;
    cashier: string;
    amount: number;
    voided_at: string;
}

interface Props {
    voids: VoidRow[];
    is_stub?: boolean;
}

export default function LaporanVoid({ voids, is_stub }: Props) {
    return (
        <MainLayout>
            <Head title="Transaksi Void - Restoku" />
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight text-white">Transaksi Void</h1>
                <p className="text-slate-400 mt-1">Daftar void dengan alasan.</p>
                {is_stub && <p className="text-xs text-slate-500 mt-2 italic">* Data stub</p>}
            </div>

            <Glass className="p-6 overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-white/10 text-slate-400">
                            <th className="pb-3 font-medium">Item</th>
                            <th className="pb-3 font-medium">Qty</th>
                            <th className="pb-3 font-medium">Alasan</th>
                            <th className="pb-3 font-medium">Kasir</th>
                            <th className="pb-3 font-medium">Nominal</th>
                            <th className="pb-3 font-medium">Waktu</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {voids.map((v) => (
                            <tr key={v.id} className="hover:bg-white/[0.02]">
                                <td className="py-3 font-medium text-white">{v.item}</td>
                                <td className="py-3 text-slate-300">{v.qty}</td>
                                <td className="py-3 text-slate-300 flex items-center gap-2">
                                    <AlertCircleIcon className="size-4 text-red-400 shrink-0" /> {v.reason}
                                </td>
                                <td className="py-3 text-slate-300">{v.cashier}</td>
                                <td className="py-3 text-red-400">{formatRp(v.amount)}</td>
                                <td className="py-3 text-slate-400 text-xs">{v.voided_at}</td>
                            </tr>
                        ))}
                        {voids.length === 0 && (
                            <tr>
                                <td colSpan={6} className="py-6 text-center text-slate-500">
                                    Tidak ada void.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Glass>
        </MainLayout>
    );
}
