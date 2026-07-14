import React from 'react';
import { Head, useForm } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { Glass, formatRupiah as formatRp } from '../../Components/Shared';
import { WalletIcon, ReceiptIcon } from '../../Components/icons';

interface ExpenseRow {
    id: number;
    category: string;
    description: string | null;
    amount: number;
    expense_date: string;
    is_recurring: boolean;
}

interface Props {
    expenses: { data: ExpenseRow[] };
    total_this_month: number;
    categories: string[];
}

export default function BiayaOperasional({ expenses, total_this_month, categories }: Props) {
    const { data, setData, post, processing, reset } = useForm({
        category: categories[0] ?? 'lainnya',
        description: '',
        amount: '',
        expense_date: new Date().toISOString().slice(0, 10),
        is_recurring: false as boolean,
    });

    const submit = (e: React.FormEvent) => {
        e.preventDefault();
        post('/biaya-operasional', {
            onSuccess: () => reset('description', 'amount'),
            preserveScroll: true,
        });
    };

    return (
        <MainLayout>
            <Head title="Biaya Operasional - Restoku" />
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight text-white">Biaya Operasional</h1>
                <p className="text-slate-400 mt-1">Input pengeluaran harian &amp; history.</p>
            </div>

            <Glass className="p-6 mb-6 flex items-center gap-4 bg-amber-400/5 border border-amber-400/20">
                <div className="p-3 rounded-xl bg-amber-400/10">
                    <WalletIcon className="size-6 text-amber-400" />
                </div>
                <div>
                    <p className="text-sm text-slate-400">Total Pengeluaran Bulan Ini</p>
                    <h3 className="text-2xl font-bold text-white">{formatRp(total_this_month)}</h3>
                </div>
            </Glass>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Glass className="p-6 lg:col-span-1">
                    <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
                        <ReceiptIcon className="size-5 text-emerald-400" /> Catat Pengeluaran
                    </h3>
                    <form onSubmit={submit} className="space-y-3">
                        <select
                            value={data.category}
                            onChange={(e) => setData('category', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200"
                        >
                            {categories.map((c) => (
                                <option key={c} value={c} className="bg-slate-900">
                                    {c}
                                </option>
                            ))}
                        </select>
                        <input
                            type="text"
                            placeholder="Keterangan"
                            value={data.description}
                            onChange={(e) => setData('description', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500"
                        />
                        <input
                            type="number"
                            placeholder="Nominal"
                            value={data.amount}
                            onChange={(e) => setData('amount', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200 placeholder:text-slate-500"
                        />
                        <input
                            type="date"
                            value={data.expense_date}
                            onChange={(e) => setData('expense_date', e.target.value)}
                            className="w-full bg-white/5 border border-white/10 rounded-xl px-3 py-2.5 text-sm text-slate-200"
                        />
                        <label className="flex items-center gap-2 text-sm text-slate-300">
                            <input
                                type="checkbox"
                                checked={data.is_recurring}
                                onChange={(e) => setData('is_recurring', e.target.checked)}
                            />
                            Pengeluaran berulang
                        </label>
                        <button
                            type="submit"
                            disabled={processing}
                            className="w-full bg-amber-500 hover:bg-amber-600 text-slate-900 font-semibold rounded-xl px-4 py-2.5 text-sm transition-colors disabled:opacity-50"
                        >
                            Simpan
                        </button>
                    </form>
                </Glass>

                <Glass className="p-6 lg:col-span-2 overflow-x-auto">
                    <h3 className="text-lg font-semibold text-white mb-4">History Pengeluaran</h3>
                    <table className="w-full text-left text-sm">
                        <thead>
                            <tr className="border-b border-white/10 text-slate-400">
                                <th className="pb-3 font-medium">Tanggal</th>
                                <th className="pb-3 font-medium">Kategori</th>
                                <th className="pb-3 font-medium">Keterangan</th>
                                <th className="pb-3 font-medium">Nominal</th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                            {expenses.data.map((e) => (
                                <tr key={e.id} className="hover:bg-white/[0.02]">
                                    <td className="py-3 text-slate-300">{e.expense_date}</td>
                                    <td className="py-3">
                                        <span className="px-2 py-1 rounded-md text-xs bg-white/5 text-slate-300">
                                            {e.category}
                                        </span>
                                        {e.is_recurring && <span className="ml-1 text-xs text-amber-400">↻</span>}
                                    </td>
                                    <td className="py-3 text-slate-300">{e.description ?? '-'}</td>
                                    <td className="py-3 text-red-400">{formatRp(e.amount)}</td>
                                </tr>
                            ))}
                            {expenses.data.length === 0 && (
                                <tr>
                                    <td colSpan={4} className="py-6 text-center text-slate-500">
                                        Belum ada pengeluaran.
                                    </td>
                                </tr>
                            )}
                        </tbody>
                    </table>
                </Glass>
            </div>
        </MainLayout>
    );
}
