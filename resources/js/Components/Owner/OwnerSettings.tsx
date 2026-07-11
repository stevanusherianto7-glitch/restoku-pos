import { useState, type ChangeEvent } from 'react';
import { Screen, Glass, Input, Button, useTenantSettings } from '../Shared';
import { UserIcon, BellIcon, SaveIcon, CheckSquareIcon, SquareIcon } from '../icons';

export function OwnerSettings() {
    const [profile, setProfile] = useState({
        name: 'Bambang Hartono',
        email: 'bambang@email.com',
        phone: '0812-3456-7890',
    });
    const { isLight } = useTenantSettings();

    const [notifications, setNotifications] = useState({
        dailyWa: true,
        stockWa: true,
        contractWa: false,
        monthlyEmail: false,
        dailyTime: '20:00',
    });

    const toggleNotif = (key: keyof typeof notifications) => {
        setNotifications((prev) => ({ ...prev, [key]: !prev[key] }));
    };

    return (
        <Screen title="Profil & Notifikasi">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 max-w-4xl">
                {/* Profile Settings */}
                <Glass className="p-6">
                    <h3
                        className={`text-lg font-semibold mb-6 flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}
                    >
                        <UserIcon className="size-5 text-amber-500" /> Profil Owner
                    </h3>

                    <div className="space-y-4">
                        <div>
                            <label
                                className={`block text-xs font-medium mb-1 ${isLight ? 'text-slate-700 font-bold' : 'text-slate-400'}`}
                            >
                                Nama Lengkap
                            </label>
                            <Input
                                value={profile.name}
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    setProfile({ ...profile, name: e.target.value })
                                }
                                className={
                                    isLight
                                        ? 'bg-white border-slate-300 text-slate-900 shadow-xs'
                                        : 'bg-white/5 border-white/10'
                                }
                            />
                        </div>
                        <div>
                            <label
                                className={`block text-xs font-medium mb-1 ${isLight ? 'text-slate-700 font-bold' : 'text-slate-400'}`}
                            >
                                Email
                            </label>
                            <Input
                                type="email"
                                value={profile.email}
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    setProfile({ ...profile, email: e.target.value })
                                }
                                className={
                                    isLight
                                        ? 'bg-white border-slate-300 text-slate-900 shadow-xs'
                                        : 'bg-white/5 border-white/10'
                                }
                            />
                        </div>
                        <div>
                            <label
                                className={`block text-xs font-medium mb-1 ${isLight ? 'text-slate-700 font-bold' : 'text-slate-400'}`}
                            >
                                No. HP / WhatsApp
                            </label>
                            <Input
                                value={profile.phone}
                                onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                    setProfile({ ...profile, phone: e.target.value })
                                }
                                className={
                                    isLight
                                        ? 'bg-white border-slate-300 text-slate-900 shadow-xs'
                                        : 'bg-white/5 border-white/10'
                                }
                            />
                        </div>

                        <div className={`pt-4 border-t ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                            <Button
                                variant="outline"
                                className={`w-full justify-center ${isLight ? 'border-slate-300 text-slate-700 hover:bg-slate-100 font-bold' : ''}`}
                            >
                                Ganti Password
                            </Button>
                        </div>
                    </div>
                </Glass>

                {/* Notification Settings */}
                <div className="space-y-6">
                    <Glass className="p-6">
                        <h3
                            className={`text-lg font-semibold mb-6 flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-white'}`}
                        >
                            <BellIcon className="size-5 text-amber-500" /> Pengaturan Notifikasi
                        </h3>

                        <div className="space-y-4">
                            <button
                                onClick={() => toggleNotif('dailyWa')}
                                className="flex items-center gap-3 w-full text-left group"
                            >
                                {notifications.dailyWa ? (
                                    <CheckSquareIcon className="size-5 text-emerald-500" />
                                ) : (
                                    <SquareIcon className="size-5 text-slate-500 group-hover:text-slate-400" />
                                )}
                                <div>
                                    <div
                                        className={`text-sm font-medium ${isLight ? 'text-slate-900 font-bold' : 'text-white'}`}
                                    >
                                        Laporan Harian via WhatsApp
                                    </div>
                                    <div className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                                        Kirim ringkasan omzet setiap hari
                                    </div>
                                </div>
                            </button>

                            {notifications.dailyWa && (
                                <div className="pl-8 flex items-center gap-3">
                                    <label
                                        className={`text-xs ${isLight ? 'text-slate-700 font-bold' : 'text-slate-400'}`}
                                    >
                                        Waktu Kirim:
                                    </label>
                                    <Input
                                        type="time"
                                        value={notifications.dailyTime}
                                        onChange={(e: ChangeEvent<HTMLInputElement>) =>
                                            setNotifications({ ...notifications, dailyTime: e.target.value })
                                        }
                                        className={`w-32 h-8 text-sm ${isLight ? 'bg-white border-slate-300 text-slate-900 shadow-xs' : 'bg-white/5 border-white/10'}`}
                                    />
                                </div>
                            )}

                            <button
                                onClick={() => toggleNotif('stockWa')}
                                className="flex items-center gap-3 w-full text-left group"
                            >
                                {notifications.stockWa ? (
                                    <CheckSquareIcon className="size-5 text-emerald-500" />
                                ) : (
                                    <SquareIcon className="size-5 text-slate-500 group-hover:text-slate-400" />
                                )}
                                <div>
                                    <div
                                        className={`text-sm font-medium ${isLight ? 'text-slate-900 font-bold' : 'text-white'}`}
                                    >
                                        Peringatan Stok Habis via WA
                                    </div>
                                    <div className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                                        Kirim notifikasi saat stok kritis
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => toggleNotif('contractWa')}
                                className="flex items-center gap-3 w-full text-left group"
                            >
                                {notifications.contractWa ? (
                                    <CheckSquareIcon className="size-5 text-emerald-500" />
                                ) : (
                                    <SquareIcon className="size-5 text-slate-500 group-hover:text-slate-400" />
                                )}
                                <div>
                                    <div
                                        className={`text-sm font-medium ${isLight ? 'text-slate-900 font-bold' : 'text-white'}`}
                                    >
                                        Peringatan Kontrak via WA
                                    </div>
                                    <div className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                                        Kirim notifikasi H-30 kontrak habis
                                    </div>
                                </div>
                            </button>

                            <button
                                onClick={() => toggleNotif('monthlyEmail')}
                                className="flex items-center gap-3 w-full text-left group"
                            >
                                {notifications.monthlyEmail ? (
                                    <CheckSquareIcon className="size-5 text-emerald-500" />
                                ) : (
                                    <SquareIcon className="size-5 text-slate-500 group-hover:text-slate-400" />
                                )}
                                <div>
                                    <div
                                        className={`text-sm font-medium ${isLight ? 'text-slate-900 font-bold' : 'text-white'}`}
                                    >
                                        Laporan Bulanan via Email
                                    </div>
                                    <div className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                                        Kirim PDF dan Excel laporan di akhir bulan
                                    </div>
                                </div>
                            </button>
                        </div>
                    </Glass>

                    <div className="flex justify-end">
                        <Button className="bg-amber-600 hover:bg-amber-700 gap-2 px-6 text-white font-bold">
                            <SaveIcon className="size-4" /> Simpan Pengaturan
                        </Button>
                    </div>
                </div>
            </div>
        </Screen>
    );
}
