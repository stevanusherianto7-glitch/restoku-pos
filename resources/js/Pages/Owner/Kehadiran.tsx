import React from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { Glass } from '../../Components/Shared';
import { UsersIcon, CalendarIcon } from '../../Components/icons';

interface Attendance {
    name: string;
    present: number;
    late: number;
    absent: number;
    leave: number;
}

interface Props {
    attendance: Attendance[];
    is_stub?: boolean;
}

export default function Kehadiran({ attendance, is_stub }: Props) {
    return (
        <MainLayout>
            <Head title="Kehadiran - Restoku" />
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight text-white">Kehadiran Karyawan</h1>
                <p className="text-slate-400 mt-1">Rekap absensi per karyawan (bulan berjalan).</p>
                {is_stub && (
                    <p className="text-xs text-slate-500 mt-2 italic">* Data stub (modul absensi belum aktif)</p>
                )}
            </div>

            <Glass className="p-6 overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-white/10 text-slate-400">
                            <th className="pb-3 font-medium">Karyawan</th>
                            <th className="pb-3 font-medium">Hadir</th>
                            <th className="pb-3 font-medium">Terlambat</th>
                            <th className="pb-3 font-medium">Absen</th>
                            <th className="pb-3 font-medium">Izin</th>
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {attendance.map((a, i) => (
                            <tr key={i} className="hover:bg-white/[0.02]">
                                <td className="py-3 font-medium text-white flex items-center gap-2">
                                    <UsersIcon className="size-4 text-purple-400" /> {a.name}
                                </td>
                                <td className="py-3 text-emerald-400">{a.present} hari</td>
                                <td className="py-3 text-amber-400">{a.late} hari</td>
                                <td className="py-3 text-red-400">{a.absent} hari</td>
                                <td className="py-3 text-slate-400">{a.leave ?? 0} hari</td>
                            </tr>
                        ))}
                        {attendance.length === 0 && (
                            <tr>
                                <td colSpan={5} className="py-6 text-center text-slate-500">
                                    Belum ada data absensi.
                                </td>
                            </tr>
                        )}
                    </tbody>
                </table>
            </Glass>
        </MainLayout>
    );
}
