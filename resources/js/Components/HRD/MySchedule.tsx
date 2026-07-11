import { useState } from 'react';
import { Screen, Glass, Button } from '../Shared';
import { CalendarIcon, ClockIcon, CheckCircle2Icon, ArrowRightLeftIcon, PlaneIcon } from '../icons';

export function MySchedule() {
    const [clockInStatus, setClockInStatus] = useState<'pending' | 'clocked_in' | 'clocked_out'>('pending');
    const [time, setTime] = useState('');

    const handleClockIn = () => {
        const now = new Date();
        setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setClockInStatus('clocked_in');
    };

    const handleClockOut = () => {
        const now = new Date();
        setTime(now.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }));
        setClockInStatus('clocked_out');
    };

    return (
        <Screen title="Jadwalku & Absensi">
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Kolom Kiri: Panel Absensi Hari Ini */}
                <div className="lg:col-span-1 space-y-6">
                    <Glass className="p-6 flex flex-col items-center text-center">
                        <h3 className="text-xl font-bold text-white mb-1">Shift Hari Ini</h3>
                        <p className="text-emerald-400 font-medium mb-6">Siang (15:00 - 22:00)</p>

                        <div className="w-48 h-48 rounded-full bg-slate-900 border-8 border-slate-800 flex flex-col items-center justify-center mb-6 shadow-inner relative overflow-hidden">
                            {clockInStatus === 'pending' && (
                                <div className="absolute inset-0 bg-emerald-500/10 flex flex-col items-center justify-center">
                                    <ClockIcon className="size-8 text-emerald-400 mb-2 opacity-50" />
                                    <span className="text-slate-400 text-sm">Menunggu</span>
                                </div>
                            )}
                            {clockInStatus === 'clocked_in' && (
                                <div className="absolute inset-0 bg-emerald-500/20 flex flex-col items-center justify-center">
                                    <CheckCircle2Icon className="size-8 text-emerald-400 mb-2" />
                                    <span className="text-emerald-400 text-sm font-bold">Tepat Waktu</span>
                                    <span className="text-white text-2xl font-mono mt-1">{time}</span>
                                </div>
                            )}
                            {clockInStatus === 'clocked_out' && (
                                <div className="absolute inset-0 bg-slate-800 flex flex-col items-center justify-center">
                                    <span className="text-slate-400 text-sm font-bold">ClockIcon Out</span>
                                    <span className="text-white text-xl font-mono mt-1">{time}</span>
                                </div>
                            )}
                        </div>

                        <div className="w-full space-y-3">
                            <Button
                                className="w-full bg-emerald-600 hover:bg-emerald-700 text-lg py-6 shadow-lg shadow-emerald-900/50"
                                onClick={handleClockIn}
                                disabled={clockInStatus !== 'pending'}
                            >
                                CLOCK IN SEKARANG
                            </Button>
                            <Button
                                variant="outline"
                                className="w-full py-4 border-white/20 text-slate-300"
                                onClick={handleClockOut}
                                disabled={clockInStatus !== 'clocked_in'}
                            >
                                CLOCK OUT
                            </Button>
                        </div>
                    </Glass>

                    <Glass className="p-6">
                        <h4 className="font-semibold text-white mb-4">Aksi Lainnya</h4>
                        <div className="space-y-3">
                            <Button variant="outline" className="w-full justify-start gap-3 bg-white/5 border-white/10">
                                <ArrowRightLeftIcon className="size-4 text-blue-400" /> Ajukan Tukar Shift
                            </Button>
                            <Button variant="outline" className="w-full justify-start gap-3 bg-white/5 border-white/10">
                                <PlaneIcon className="size-4 text-purple-400" /> Ajukan Cuti / Izin
                            </Button>
                        </div>
                    </Glass>
                </div>

                {/* Kolom Kanan: Jadwal 7 Hari */}
                <div className="lg:col-span-2">
                    <Glass className="p-6 h-full">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-white flex items-center gap-2">
                                <CalendarIcon className="size-5 text-emerald-400" /> Jadwal Mendatang
                            </h3>
                        </div>

                        <div className="space-y-4">
                            {[
                                { date: 'Senin, 6 Jul 2026', shift: 'Siang (15:00 - 22:00)', status: 'clocked_in' },
                                { date: 'Selasa, 7 Jul 2026', shift: 'Siang (15:00 - 22:00)', status: 'confirmed' },
                                { date: 'Rabu, 8 Jul 2026', shift: 'Libur', status: 'off' },
                                { date: 'Kamis, 9 Jul 2026', shift: 'Pagi (07:00 - 15:00)', status: 'pending_publish' },
                                {
                                    date: 'Jumat, 10 Jul 2026',
                                    shift: 'Pagi (07:00 - 15:00)',
                                    status: 'pending_publish',
                                },
                            ].map((item, idx) => (
                                <div
                                    key={idx}
                                    className={`p-4 rounded-xl border ${item.date.includes('6 Jul') ? 'bg-emerald-900/20 border-emerald-500/50' : 'bg-slate-900/50 border-white/10'} flex items-center justify-between`}
                                >
                                    <div>
                                        <div className="font-medium text-white mb-1">{item.date}</div>
                                        <div
                                            className={`text-sm ${item.status === 'off' ? 'text-slate-500' : 'text-slate-300'}`}
                                        >
                                            {item.shift}
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        {item.status === 'clocked_in' && (
                                            <span className="bg-emerald-500/20 text-emerald-400 px-3 py-1 text-xs rounded-full border border-emerald-500/30 flex items-center gap-1">
                                                <CheckCircle2Icon className="size-3" /> Sedang Berlangsung
                                            </span>
                                        )}
                                        {item.status === 'confirmed' && (
                                            <span className="text-emerald-400 text-xs flex items-center gap-1">
                                                <CheckCircle2Icon className="size-3" /> Terjadwal
                                            </span>
                                        )}
                                        {item.status === 'off' && (
                                            <span className="text-slate-500 text-xs font-medium bg-slate-800 px-3 py-1 rounded-full">
                                                Hari Libur
                                            </span>
                                        )}
                                        {item.status === 'pending_publish' && (
                                            <span className="text-yellow-500/80 text-xs flex items-center gap-1">
                                                <ClockIcon className="size-3" /> Menunggu Konfirmasi
                                            </span>
                                        )}
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Glass>
                </div>
            </div>
        </Screen>
    );
}
