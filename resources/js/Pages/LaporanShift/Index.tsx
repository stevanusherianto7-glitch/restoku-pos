import React from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { Glass } from '../../Components/Shared';
import { UsersIcon, ClockIcon } from '../../Components/icons';

interface Shift {
    cashier: string;
    opened_at: string | null;
    closed_at: string | null;
    transactions: number;
    status: string;
}

interface Props {
    shifts: Shift[];
    is_stub?: boolean;
}

export default function LaporanShift({ shifts, is_stub }: Props) {
    return (
        <MainLayout>
            <Head title="Laporan Shift - Restoku" />
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight text-white">Laporan Shift & Kasir</h1>
                <p className="text-slate-400 mt-1">Daftar sesi kasir (buka/tutup, total transaksi, petugas).</p>
                {is_stub && (
                    <p className="text-xs text-slate-500 mt-2 italic">* Data stub (tabel cashier_sessions belum ada)</p>
                )}
            </div>

            <Glass className="p-6 overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-white/10 text-slate-400">
                            <th className="pb-3 font-medium">Kasir</th>
                            <th className="pb-3 font-medium">Buka</th>
                            <th className="pb-3 font-medium">Tutup</th>
                            <th className="pb-3 font-medium">Transaksi</th>
                            <th className="pb-3 font-medium">Status</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {shifts.map((s, i) => (
                            <tr key={i} className="hover:bg-white/[0.02]">
                                <td className="py-3 font-medium text-white flex items-center gap-2">
                                    <UsersIcon className="size-4 text-purple-400" /> {s.cashier}
                                </td>
                                <td className="py-3 text-slate-300">{s.opened_at ?? '-'}</td>
                                <td className="py-3 text-slate-300">{s.closed_at ?? '-'}</td>
                                <td className="py-3 text-slate-300">{s.transactions}</td>
                                <td className="py-3">
                                    <span
                                        className={`px-2 py-1 rounded-md text-xs font-medium ${s.status === 'open' ? 'bg-emerald-500/10 text-emerald-400' : 'bg-slate-500/10 text-slate-400'}`}
                                    >
                                        {s.status === 'open' ? 'Buka' : 'Tutup'}
                                    </span>
                                </td>
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Glass>
        </MainLayout>
    );
}
