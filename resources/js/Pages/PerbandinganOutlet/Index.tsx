import React from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { Glass, formatRupiah } from '../../Components/Shared';
import { MapPinIcon, TrendingUpIcon, TrendingDownIcon, StoreIcon, AwardIcon } from '../../Components/icons';
import { RoleGuard } from '../../Components/RoleGuard';

function PerbandinganOutletInner() {
    // Mock Data based on Spec
    const outlets = [
        {
            name: 'Cabang A',
            revenue: 18200000,
            orders: 520,
            aov: 35000,
            growth: 8,
            color: 'text-blue-400',
            bg: 'bg-blue-500',
            border: 'border-blue-500/30',
            icon: 'bg-blue-500/20',
        },
        {
            name: 'Cabang B',
            revenue: 15500000,
            orders: 410,
            aov: 37800,
            growth: 15,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500',
            border: 'border-emerald-500/30',
            icon: 'bg-emerald-500/20',
        },
        {
            name: 'Cabang C',
            revenue: 12100000,
            orders: 320,
            aov: 37800,
            growth: -3,
            color: 'text-amber-400',
            bg: 'bg-amber-500',
            border: 'border-amber-500/30',
            icon: 'bg-amber-500/20',
        },
    ];

    const totalRevenue = outlets.reduce((sum, o) => sum + o.revenue, 0);

    return (
        <MainLayout>
            <Head title="Perbandingan Outlet - Restoku" />

            <div className="flex justify-between items-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white">Perbandingan Outlet</h1>
                    <p className="text-slate-400 mt-1">Komparasi kinerja seluruh cabang restoran Anda.</p>
                </div>
                <div className="flex gap-3">
                    <select className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-200 focus:border-blue-500/50 outline-none backdrop-blur-md transition-colors hover:bg-white/10">
                        <option value="all" className="bg-slate-900">
                            Outlet: Semua
                        </option>
                        <option value="1" className="bg-slate-900">
                            Cabang A
                        </option>
                        <option value="2" className="bg-slate-900">
                            Cabang B
                        </option>
                        <option value="3" className="bg-slate-900">
                            Cabang C
                        </option>
                    </select>
                    <select className="bg-emerald-500/10 border border-emerald-500/20 rounded-xl px-4 py-2.5 text-sm font-medium text-emerald-400 focus:border-emerald-500/50 outline-none transition-colors hover:bg-emerald-500/20">
                        <option value="jul2026" className="bg-slate-900">
                            Juli 2026
                        </option>
                        <option value="jun2026" className="bg-slate-900">
                            Juni 2026
                        </option>
                    </select>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                {outlets.map((o) => (
                    <Glass
                        key={o.name}
                        className={`p-6 border-t-2 ${o.border} hover:-translate-y-1 transition-transform duration-300`}
                    >
                        <div className="flex justify-between items-start mb-6">
                            <div className="flex items-center gap-3">
                                <div className={`p-2.5 rounded-xl ${o.icon}`}>
                                    <StoreIcon className={`size-5 ${o.color}`} />
                                </div>
                                <div>
                                    <h3 className="font-semibold text-white text-lg">{o.name}</h3>
                                    <div
                                        className={`text-sm font-medium flex items-center gap-1 mt-0.5 ${o.growth >= 0 ? 'text-emerald-400' : 'text-red-400'}`}
                                    >
                                        {o.growth >= 0 ? (
                                            <TrendingUpIcon className="size-3" />
                                        ) : (
                                            <TrendingDownIcon className="size-3" />
                                        )}
                                        {o.growth > 0 ? '+' : ''}
                                        {o.growth}% vs bulan lalu
                                    </div>
                                </div>
                            </div>
                        </div>

                        <div className="space-y-4">
                            <div>
                                <p className="text-sm font-medium text-slate-400 mb-1">Omzet</p>
                                <p className={`text-2xl font-bold ${o.color}`}>{formatRupiah(o.revenue)}</p>
                            </div>
                            <div className="flex gap-4 pt-4 border-t border-white/5">
                                <div>
                                    <p className="text-xs font-medium text-slate-500 mb-1">Pesanan</p>
                                    <p className="text-white font-medium">{o.orders}</p>
                                </div>
                                <div>
                                    <p className="text-xs font-medium text-slate-500 mb-1">Rata-rata Order</p>
                                    <p className="text-white font-medium">{formatRupiah(o.aov)}</p>
                                </div>
                            </div>
                        </div>
                    </Glass>
                ))}
            </div>

            <Glass className="p-8 mb-8">
                <h3 className="text-lg font-semibold text-white mb-8 flex items-center gap-2">
                    <AwardIcon className="size-5 text-blue-400" /> Kontribusi Pendapatan per Outlet
                </h3>

                <div className="space-y-6">
                    {outlets.map((o) => {
                        const pct = Math.round((o.revenue / totalRevenue) * 100);
                        return (
                            <div key={o.name}>
                                <div className="flex justify-between items-center mb-2">
                                    <div className="flex items-center gap-3">
                                        <span className={`size-3 rounded-full ${o.bg}`}></span>
                                        <span className="text-base font-medium text-slate-200">{o.name}</span>
                                    </div>
                                    <div className="text-right">
                                        <span className="text-base font-bold text-white block">
                                            {formatRupiah(o.revenue)}
                                        </span>
                                        <span className={`text-xs font-semibold ${o.color}`}>{pct}% dari total</span>
                                    </div>
                                </div>
                                <div className="h-3 rounded-full bg-white/5 overflow-hidden">
                                    <div
                                        className={`h-full rounded-full ${o.bg} relative overflow-hidden`}
                                        style={{ width: `${pct}%` }}
                                    >
                                        <div className="absolute inset-0 bg-[linear-gradient(90deg,transparent_25%,rgba(255,255,255,0.2)_50%,transparent_75%)] bg-[length:250%_250%,100%_100%] animate-shimmer pointer-events-none" />
                                    </div>
                                </div>
                            </div>
                        );
                    })}
                </div>
            </Glass>

            <Glass className="p-6">
                <div className="flex items-center gap-4 bg-blue-500/10 border border-blue-500/20 p-4 rounded-xl text-blue-200">
                    <MapPinIcon className="size-6 shrink-0 text-blue-400" />
                    <p className="text-sm">
                        <strong className="text-blue-300 block mb-0.5">Analisis Lokasi:</strong>
                        Cabang B memiliki pertumbuhan tertinggi (+15%) bulan ini. Pertimbangkan untuk mereplikasi
                        strategi promosi Cabang B ke Cabang C yang sedang mengalami penurunan (-3%).
                    </p>
                </div>
            </Glass>
        </MainLayout>
    );
}

// --- Role Guard Wrapper -------------------------------------------------------
export default function PerbandinganOutlet() {
    return (
        <RoleGuard allowedRoles={['owner']} pageName="Perbandingan Outlet" allowedRoleLabel="Owner">
            <PerbandinganOutletInner />
        </RoleGuard>
    );
}
