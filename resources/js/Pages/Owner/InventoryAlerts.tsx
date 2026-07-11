import React from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { Glass } from '../../Components/Shared';
import { AlertCircleIcon, AlertTriangleIcon, CheckCircle2Icon, InfoIcon, PackageXIcon } from '../../Components/icons';

export default function InventoryAlerts() {
    // Mock Data based on Spec
    const alerts = [
        { item: 'Nasi Putih', stock: '0 kg', status: 'HABIS', type: 'critical' },
        { item: 'Minyak Goreng', stock: '2 liter', status: 'Menipis', type: 'warning' },
        { item: 'Telur', stock: '5 butir', status: 'Menipis', type: 'warning' },
        { item: 'Ayam Potong', stock: '1 kg', status: 'Menipis', type: 'warning' },
    ];

    return (
        <MainLayout>
            <Head title="Peringatan Stok - Restoku" />

            <div className="flex justify-between items-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white">Peringatan Stok</h1>
                    <p className="text-slate-400 mt-1">Pantauan ketersediaan bahan baku secara real-time.</p>
                </div>
            </div>

            <div className="max-w-4xl">
                <Glass className="p-8 border-t-2 border-red-500/50">
                    <div className="flex items-center gap-3 mb-8">
                        <div className="p-3 bg-red-500/10 rounded-xl">
                            <AlertTriangleIcon className="size-6 text-red-500" />
                        </div>
                        <div>
                            <h2 className="text-xl font-bold text-white">Status Bahan Baku</h2>
                            <p className="text-sm text-slate-400">Beberapa item membutuhkan perhatian segera.</p>
                        </div>
                    </div>

                    <div className="space-y-4 mb-8">
                        {alerts.map((alert, i) => (
                            <div
                                key={i}
                                className={`flex items-center justify-between p-4 rounded-xl border ${alert.type === 'critical' ? 'bg-red-500/10 border-red-500/20' : 'bg-amber-500/10 border-amber-500/20'}`}
                            >
                                <div className="flex items-center gap-4">
                                    {alert.type === 'critical' ? (
                                        <PackageXIcon className="size-5 text-red-400" />
                                    ) : (
                                        <AlertCircleIcon className="size-5 text-amber-400" />
                                    )}
                                    <div>
                                        <h4 className="font-semibold text-white">{alert.item}</h4>
                                        <p
                                            className={`text-sm font-medium ${alert.type === 'critical' ? 'text-red-300' : 'text-amber-300'}`}
                                        >
                                            Sisa: {alert.stock}
                                        </p>
                                    </div>
                                </div>
                                <div>
                                    <span
                                        className={`px-3 py-1 rounded-md text-xs font-bold uppercase tracking-wider ${alert.type === 'critical' ? 'bg-red-500 text-white' : 'bg-amber-500 text-amber-950'}`}
                                    >
                                        {alert.status}
                                    </span>
                                </div>
                            </div>
                        ))}
                    </div>

                    <div className="flex items-center gap-4 p-4 rounded-xl bg-emerald-500/10 border border-emerald-500/20">
                        <CheckCircle2Icon className="size-5 text-emerald-400 shrink-0" />
                        <p className="text-emerald-300 font-medium text-sm">
                            Semua bahan baku lainnya (45 item) dalam kondisi aman dan tercukupi.
                        </p>
                    </div>
                </Glass>

                <div className="mt-6 flex items-start gap-3 p-4 bg-blue-500/5 border border-blue-500/10 rounded-xl">
                    <InfoIcon className="size-5 text-blue-400 shrink-0" />
                    <p className="text-sm text-slate-300">
                        Halaman ini bersifat <strong className="text-white">Read-only</strong>. Sebagai Owner, Anda
                        tidak dapat mengubah data stok secara langsung. Sistem secara otomatis telah mengirimkan
                        notifikasi *restock* ke tim Gudang dan Dapur.
                    </p>
                </div>
            </div>
        </MainLayout>
    );
}
