import React from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { Glass, formatRupiah } from '../../Components/Shared';
import { Users, AlertTriangle, Briefcase, ChefHat, Calculator, UserCheck, ShieldAlert } from 'lucide-react';

export default function Employees() {
    // Mock Data based on Spec
    const overview = {
        total_employees: 15,
        total_salary: 12830580,
        labor_cost_percentage: 28, // dari revenue
    };

    const departments = [
        {
            name: 'Service (Waiter)',
            head_count: 5,
            salary: 4200000,
            icon: UserCheck,
            color: 'text-blue-400',
            bg: 'bg-blue-500/20',
        },
        {
            name: 'Kitchen',
            head_count: 7,
            salary: 6500000,
            icon: ChefHat,
            color: 'text-emerald-400',
            bg: 'bg-emerald-500/20',
        },
        {
            name: 'Cashier',
            head_count: 2,
            salary: 1400000,
            icon: Calculator,
            color: 'text-amber-400',
            bg: 'bg-amber-500/20',
        },
        {
            name: 'Management',
            head_count: 1,
            salary: 730580,
            icon: Briefcase,
            color: 'text-purple-400',
            bg: 'bg-purple-500/20',
        },
    ];

    return (
        <MainLayout>
            <Head title="Ringkasan Karyawan - Restoku" />

            <div className="flex justify-between items-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white">Ringkasan Karyawan</h1>
                    <p className="text-slate-400 mt-1">Pantauan total sumber daya manusia dan biaya tenaga kerja.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
                <Glass className="p-6 flex flex-col items-center justify-center text-center">
                    <div className="p-4 rounded-full bg-blue-500/10 mb-4 border border-blue-500/20">
                        <Users className="size-8 text-blue-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-1">Total Karyawan</p>
                    <p className="text-4xl font-black text-white">
                        {overview.total_employees} <span className="text-lg font-medium text-slate-500">Orang</span>
                    </p>
                </Glass>

                <Glass className="p-6 flex flex-col items-center justify-center text-center">
                    <div className="p-4 rounded-full bg-emerald-500/10 mb-4 border border-emerald-500/20">
                        <Calculator className="size-8 text-emerald-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-1">
                        Total Gaji Bulan Ini
                    </p>
                    <p className="text-3xl font-black text-white">{formatRupiah(overview.total_salary)}</p>
                </Glass>

                <Glass className="p-6 flex flex-col items-center justify-center text-center relative overflow-hidden">
                    <div className="absolute -right-4 -bottom-4 text-amber-500/5">
                        <Users className="size-48" />
                    </div>
                    <div className="p-4 rounded-full bg-amber-500/10 mb-4 border border-amber-500/20 relative z-10">
                        <Briefcase className="size-8 text-amber-400" />
                    </div>
                    <p className="text-sm font-medium text-slate-400 uppercase tracking-widest mb-1 relative z-10">
                        Labor Cost
                    </p>
                    <p className="text-4xl font-black text-amber-400 relative z-10">
                        {overview.labor_cost_percentage}%{' '}
                        <span className="text-sm font-medium text-slate-500 block mt-1">dari Revenue</span>
                    </p>
                </Glass>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Glass className="lg:col-span-2 p-8">
                    <h3 className="text-xl font-bold text-white mb-6">Distribusi per Departemen</h3>

                    <div className="space-y-4">
                        {departments.map((dept, i) => (
                            <div
                                key={i}
                                className="flex items-center justify-between p-4 rounded-2xl bg-white/5 border border-white/5 hover:bg-white/10 transition-colors"
                            >
                                <div className="flex items-center gap-4">
                                    <div className={`p-3 rounded-xl ${dept.bg}`}>
                                        <dept.icon className={`size-6 ${dept.color}`} />
                                    </div>
                                    <div>
                                        <h4 className="font-semibold text-white text-lg">{dept.name}</h4>
                                        <p className="text-sm text-slate-400">{dept.head_count} Karyawan</p>
                                    </div>
                                </div>
                                <div className="text-right">
                                    <p className="text-sm text-slate-500 mb-0.5">Total Gaji</p>
                                    <p className="font-bold text-slate-200">{formatRupiah(dept.salary)}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                </Glass>

                <div className="space-y-6">
                    <Glass className="p-6 border-t-2 border-amber-500/50 relative overflow-hidden">
                        <div className="absolute inset-0 bg-amber-500/5" />
                        <div className="relative z-10">
                            <h3 className="text-lg font-bold text-amber-400 flex items-center gap-2 mb-4">
                                <ShieldAlert className="size-5" /> Peringatan Kontrak
                            </h3>

                            <div className="p-4 bg-black/40 rounded-xl border border-white/10">
                                <p className="text-white font-medium mb-1">2 Karyawan</p>
                                <p className="text-sm text-slate-400 leading-relaxed">
                                    Kontrak kerja akan habis dalam waktu kurang dari 30 hari. Hubungi Admin HR untuk
                                    perpanjangan atau evaluasi.
                                </p>
                            </div>
                        </div>
                    </Glass>

                    <div className="p-4 border border-blue-500/20 bg-blue-500/10 rounded-2xl text-blue-200 text-sm flex gap-3 items-start">
                        <AlertTriangle className="size-5 text-blue-400 shrink-0 mt-0.5" />
                        <p>
                            <strong>Status Read-only:</strong> Sebagai Owner, Anda hanya dapat melihat rekap data
                            karyawan. Untuk manajemen data, penambahan staf, atau *approval* cuti, silakan hubungi tim
                            Admin Operasional.
                        </p>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
