import React, { useState } from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { Glass } from '../../Components/Shared';
import { User, Bell, Mail, Smartphone, Save, Key, Lock, CheckCircle2 } from 'lucide-react';

export default function OwnerSettings() {
    // Mock State for Settings
    const [saved, setSaved] = useState(false);

    const handleSave = (e: React.FormEvent) => {
        e.preventDefault();
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    return (
        <MainLayout>
            <Head title="Pengaturan Owner - Restoku" />

            <div className="flex justify-between items-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white">Profil & Pengaturan</h1>
                    <p className="text-slate-400 mt-1">Kelola profil pribadi dan preferensi notifikasi sistem.</p>
                </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                {/* Kolom Kiri: Profil & Password */}
                <div className="lg:col-span-2 space-y-8">
                    <form onSubmit={handleSave}>
                        <Glass className="p-8">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <User className="size-5 text-blue-400" /> Profil Pribadi
                            </h2>

                            <div className="space-y-5">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">
                                        Nama Lengkap
                                    </label>
                                    <input
                                        type="text"
                                        defaultValue="Bambang Hartono"
                                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                    />
                                </div>
                                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">
                                            Alamat Email
                                        </label>
                                        <input
                                            type="email"
                                            defaultValue="bambang@restoku.com"
                                            className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                        />
                                    </div>
                                    <div>
                                        <label className="block text-sm font-medium text-slate-400 mb-2">
                                            Nomor WhatsApp
                                        </label>
                                        <div className="relative">
                                            <div className="absolute inset-y-0 left-0 pl-4 flex items-center pointer-events-none">
                                                <span className="text-slate-500">+62</span>
                                            </div>
                                            <input
                                                type="tel"
                                                defaultValue="81234567890"
                                                className="w-full bg-black/40 border border-white/10 rounded-xl pl-12 pr-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all"
                                            />
                                        </div>
                                    </div>
                                </div>
                            </div>
                        </Glass>

                        <Glass className="p-8 mt-8">
                            <h2 className="text-xl font-bold text-white mb-6 flex items-center gap-2">
                                <Bell className="size-5 text-amber-400" /> Preferensi Laporan & Notifikasi
                            </h2>

                            <div className="space-y-6">
                                <div className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                                    <div className="flex items-center h-6">
                                        <input
                                            id="notif-daily"
                                            type="checkbox"
                                            defaultChecked
                                            className="w-5 h-5 rounded border-white/20 bg-black/50 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label
                                            htmlFor="notif-daily"
                                            className="font-medium text-white cursor-pointer block"
                                        >
                                            Kirim laporan penjualan harian via WhatsApp
                                        </label>
                                        <p className="text-sm text-slate-400 mt-1">
                                            Ringkasan omzet, total transaksi, dan rata-rata pesanan harian.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                                    <div className="flex items-center h-6">
                                        <input
                                            id="notif-stock"
                                            type="checkbox"
                                            defaultChecked
                                            className="w-5 h-5 rounded border-white/20 bg-black/50 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label
                                            htmlFor="notif-stock"
                                            className="font-medium text-white cursor-pointer block"
                                        >
                                            Peringatan stok habis via WhatsApp
                                        </label>
                                        <p className="text-sm text-slate-400 mt-1">
                                            Notifikasi instan jika ada bahan baku kritikal yang habis total.
                                        </p>
                                    </div>
                                </div>

                                <div className="flex items-start gap-4 p-4 rounded-xl border border-white/5 bg-white/[0.02]">
                                    <div className="flex items-center h-6">
                                        <input
                                            id="notif-contract"
                                            type="checkbox"
                                            className="w-5 h-5 rounded border-white/20 bg-black/50 text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900"
                                        />
                                    </div>
                                    <div>
                                        <label
                                            htmlFor="notif-contract"
                                            className="font-medium text-slate-200 cursor-pointer block"
                                        >
                                            Peringatan kontrak karyawan via WhatsApp
                                        </label>
                                    </div>
                                </div>

                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">
                                        Waktu Pengiriman Laporan Harian
                                    </label>
                                    <input
                                        type="time"
                                        defaultValue="21:00"
                                        className="bg-black/40 border border-white/10 rounded-xl px-4 py-3 text-white focus:border-blue-500 focus:ring-1 focus:ring-blue-500 outline-none transition-all w-48"
                                    />
                                    <p className="text-xs text-slate-500 mt-2">
                                        Laporan akan dikirim otomatis setiap hari pada jam tersebut.
                                    </p>
                                </div>
                            </div>
                        </Glass>

                        <div className="mt-8 flex justify-end items-center gap-4">
                            {saved && (
                                <span className="flex items-center gap-2 text-emerald-400 text-sm font-medium animate-in fade-in">
                                    <CheckCircle2 className="size-4" /> Pengaturan berhasil disimpan
                                </span>
                            )}
                            <button
                                type="submit"
                                className="flex items-center gap-2 bg-gradient-to-r from-blue-600 to-blue-500 hover:from-blue-500 hover:to-blue-400 text-white px-8 py-3 rounded-xl font-bold shadow-lg shadow-blue-500/20 transition-all hover:scale-105 active:scale-95"
                            >
                                <Save className="size-5" /> Simpan Perubahan
                            </button>
                        </div>
                    </form>
                </div>

                {/* Kolom Kanan: Keamanan */}
                <div className="space-y-6">
                    <Glass className="p-6 border-t-2 border-emerald-500/30">
                        <h3 className="text-lg font-bold text-white mb-6 flex items-center gap-2">
                            <Lock className="size-5 text-emerald-400" /> Keamanan Akun
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Password Lama</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 outline-none transition-all"
                                />
                            </div>
                            <div>
                                <label className="block text-sm font-medium text-slate-400 mb-2">Password Baru</label>
                                <input
                                    type="password"
                                    placeholder="••••••••"
                                    className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-white focus:border-emerald-500 outline-none transition-all"
                                />
                            </div>
                            <button
                                type="button"
                                className="w-full flex justify-center items-center gap-2 bg-white/5 hover:bg-white/10 border border-white/10 text-white px-4 py-2.5 rounded-xl font-medium transition-colors mt-2"
                            >
                                <Key className="size-4" /> Ganti Password
                            </button>
                        </div>
                    </Glass>

                    <div className="p-5 bg-gradient-to-br from-emerald-900/40 to-blue-900/20 border border-emerald-500/20 rounded-2xl">
                        <div className="flex justify-center mb-4">
                            <Smartphone className="size-10 text-emerald-400" />
                        </div>
                        <h4 className="text-center font-bold text-white mb-2">Aplikasi Mobile Restoku</h4>
                        <p className="text-center text-sm text-slate-400 mb-4 leading-relaxed">
                            Pantau bisnis Anda dari mana saja. Unduh aplikasi khusus Owner di smartphone Anda.
                        </p>
                        <button
                            type="button"
                            className="w-full py-2 bg-white text-black font-bold rounded-lg hover:bg-slate-200 transition-colors"
                        >
                            Kirim Link Download
                        </button>
                    </div>
                </div>
            </div>
        </MainLayout>
    );
}
