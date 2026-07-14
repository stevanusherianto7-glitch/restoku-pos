import React from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { Glass } from '../../Components/Shared';
import { CalendarIcon, ClockIcon } from '../../Components/icons';

interface ScheduleRow {
    name: string;
    mon: string;
    tue: string;
    wed: string;
    thu: string;
    fri: string;
    sat: string;
    sun: string;
}

interface Props {
    schedule: ScheduleRow[];
    is_stub?: boolean;
}

const DAYS = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'] as const;
const DAY_LABELS = ['Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab', 'Min'];

export default function JadwalShift({ schedule, is_stub }: Props) {
    return (
        <MainLayout>
            <Head title="Jadwal Shift - Restoku" />
            <div className="mb-8">
                <h1 className="text-3xl font-extrabold tracking-tight text-white">Jadwal Shift Mingguan</h1>
                <p className="text-slate-400 mt-1">Rotasi shift karyawan per hari.</p>
                {is_stub && <p className="text-xs text-slate-500 mt-2 italic">* Data stub</p>}
            </div>

            <Glass className="p-6 overflow-x-auto">
                <table className="w-full text-left text-sm">
                    <thead>
                        <tr className="border-b border-white/10 text-slate-400">
                            <th className="pb-3 font-medium">Karyawan</th>
                            {DAY_LABELS.map((d) => (
                                <th key={d} className="pb-3 font-medium text-center">
                                    {d}
                                </th>
                            ))}
                        </tr>
                    </thead>
                    <tbody className="divide-y divide-white/5">
                        {schedule.map((s, i) => (
                            <tr key={i} className="hover:bg-white/[0.02]">
                                <td className="py-3 font-medium text-white flex items-center gap-2">
                                    <CalendarIcon className="size-4 text-blue-400" /> {s.name}
                                </td>
                                {DAYS.map((d) => {
                                    const v = (s as any)[d];
                                    const isOff = v === 'Libur';
                                    return (
                                        <td key={d} className="py-3 text-center">
                                            <span
                                                className={`px-2 py-1 rounded-md text-xs ${isOff ? 'bg-slate-500/10 text-slate-500' : 'bg-blue-500/10 text-blue-300'}`}
                                            >
                                                {v}
                                            </span>
                                        </td>
                                    );
                                })}
                            </tr>
                        ))}
                    </tbody>
                </table>
            </Glass>
        </MainLayout>
    );
}
