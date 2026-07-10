import { useState, useMemo, useEffect } from 'react';
import { Link } from '@inertiajs/react';
import { Glass, Button } from '../Shared';
import {
    ChevronLeft,
    ChevronRight,
    Calendar,
    Download,
    Save,
    RefreshCw,
    User,
    Clock,
    ArrowLeft,
    Check,
    X,
    AlertCircle,
    ShieldAlert,
} from 'lucide-react';

// Shift Types and Styles
type ShiftType = 'P' | 'S' | 'M' | 'O';

const SHIFT_INFO = {
    P: { label: 'Pagi', bg: 'bg-blue-600/20 border-blue-500/30 text-blue-400', hex: '#3b82f6' },
    S: { label: 'Siang', bg: 'bg-emerald-600/20 border-emerald-500/30 text-emerald-400', hex: '#10b981' },
    M: { label: 'Malam', bg: 'bg-cyan-600/20 border-cyan-500/30 text-cyan-400', hex: '#06b6d4' },
    O: { label: 'Off', bg: 'bg-rose-600/20 border-rose-500/30 text-rose-400', hex: '#f43f5e' },
};

interface Employee {
    id: string;
    name: string;
    role: 'Kasir' | 'Waiter' | 'Chef';
    avatar: string;
}

const getStaffName = (role: string, defaultName: string) => {
    if (typeof window !== 'undefined') {
        const saved = localStorage.getItem(`tenant_staff_${role}`);
        if (saved) return saved.toUpperCase();
    }
    return defaultName.toUpperCase();
};

const getInitials = (name: string) => {
    return name.slice(0, 2).toUpperCase();
};

const loadEmployeesFromStorage = (): Employee[] => {
    if (typeof window !== 'undefined') {
        const raw = localStorage.getItem('tenant_employees');
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                if (Array.isArray(parsed) && parsed.length > 0) {
                    return parsed.map((e: any) => ({
                        id: `EMP-${e.id}`,
                        name: e.name.toUpperCase(),
                        role:
                            e.role === 'kasir'
                                ? 'Kasir'
                                : e.role === 'kitchen'
                                  ? 'Chef'
                                  : e.role === 'waiter'
                                    ? 'Waiter'
                                    : 'Chef',
                        avatar: e.name.slice(0, 2).toUpperCase(),
                    }));
                }
            } catch {}
        }
    }
    return [
        {
            id: 'EMP-01',
            name: getStaffName('kasir', 'BUDI HARTONO'),
            role: 'Kasir',
            avatar: getInitials(getStaffName('kasir', 'BUDI HARTONO')),
        },
        {
            id: 'EMP-02',
            name: getStaffName('waiter', 'SARI PERTIWI'),
            role: 'Waiter',
            avatar: getInitials(getStaffName('waiter', 'SARI PERTIWI')),
        },
        {
            id: 'EMP-03',
            name: getStaffName('kitchen', 'DEDI CAHYONO'),
            role: 'Chef',
            avatar: getInitials(getStaffName('kitchen', 'DEDI CAHYONO')),
        },
    ];
};

const EMPLOYEES: Employee[] = loadEmployeesFromStorage();

// Days of the month helper for July 2026 (including June 30 & 31 for calendar padding matching screenshot)
interface DateCell {
    dayNum: number;
    dayName: string;
    isWeekend: boolean;
    key: string;
}

const MONTH_DAYS: DateCell[] = [
    { dayNum: 30, dayName: 'Sen', isWeekend: false, key: 'prev-30' },
    { dayNum: 31, dayName: 'Sel', isWeekend: false, key: 'prev-31' },
    ...Array.from({ length: 31 }, (_, i) => {
        const day = i + 1;
        // July 2026: 1st is Wednesday.
        // 4th, 5th, 11th, 12th, 18th, 19th, 25th, 26th are weekends.
        const dayIndex = (i + 3) % 7; // 0: Sun, 1: Mon, 2: Tue, 3: Wed, etc.
        const dayNames = ['Min', 'Sen', 'Sel', 'Rab', 'Kam', 'Jum', 'Sab'];
        return {
            dayNum: day,
            dayName: dayNames[dayIndex],
            isWeekend: dayIndex === 0 || dayIndex === 6,
            key: `jul-${day}`,
        };
    }),
];

const WEEK_DAYS = [
    { name: 'SEN', key: 'sen' },
    { name: 'SEL', key: 'sel' },
    { name: 'RAB', key: 'rab' },
    { name: 'KAM', key: 'kam' },
    { name: 'JUM', key: 'jum' },
    { name: 'SAB', key: 'sab' },
    { name: 'MING', key: 'ming' },
];

export function StafShift() {
    const [viewType, setViewType] = useState<'monthly' | 'weekly'>('monthly');
    const [activeTab, setActiveTab] = useState<'shift' | 'karyawan'>('shift');
    const [selectedMonth, setSelectedMonth] = useState('Juli 2026');
    const [effectiveDate, setEffectiveDate] = useState('2026-07-01');
    const [savedSuccess, setSavedSuccess] = useState(false);
    const [activeRole, setActiveRole] = useState<string>('cashier');

    useEffect(() => {
        const raw = localStorage.getItem('activeKaryawan');
        if (raw) {
            try {
                const parsed = JSON.parse(raw);
                if (parsed.role) {
                    setActiveRole(parsed.role);
                }
            } catch (e) {
                // ignore
            }
        }
    }, []);

    const isReadOnly = activeRole !== 'manager' && activeRole !== 'owner';

    // Initial Monthly Shift Data
    const [monthlyShifts, setMonthlyShifts] = useState<Record<string, Record<string, ShiftType>>>(() => {
        const initial: Record<string, Record<string, ShiftType>> = {};
        EMPLOYEES.forEach((emp) => {
            initial[emp.id] = {};
            MONTH_DAYS.forEach((day) => {
                // Mock default patterns
                let shift: ShiftType = 'P';
                if (day.isWeekend) {
                    shift = 'O';
                } else if (emp.role === 'Waiter') {
                    shift = day.dayNum % 3 === 0 ? 'S' : 'P';
                } else if (emp.role === 'Chef') {
                    shift = day.dayNum % 2 === 0 ? 'M' : 'P';
                } else {
                    shift = day.dayNum % 4 === 0 ? 'S' : 'P';
                }
                initial[emp.id][day.key] = shift;
            });
        });
        return initial;
    });

    // Initial Weekly Shift Pattern Data
    const [weeklyShifts, setWeeklyShifts] = useState<Record<string, Record<string, ShiftType>>>(() => {
        const initial: Record<string, Record<string, ShiftType>> = {};
        EMPLOYEES.forEach((emp) => {
            initial[emp.id] = {};
            WEEK_DAYS.forEach((day) => {
                initial[emp.id][day.key] = emp.role === 'Kasir' ? 'P' : emp.role === 'Waiter' ? 'S' : 'M';
            });
        });
        return initial;
    });

    // Attendance Log state (Hadir, Sakit, Izin, Alpha)
    // Default all to check-in success (Hadir)
    const [attendanceLog, setAttendanceLog] = useState<Record<string, Record<number, 'H' | 'S' | 'I' | 'A'>>>(() => {
        const initial: Record<string, Record<number, 'H' | 'S' | 'I' | 'A'>> = {};
        EMPLOYEES.forEach((emp) => {
            initial[emp.id] = {};
            for (let d = 1; d <= 31; d++) {
                initial[emp.id][d] = 'H'; // Default Hadir
            }
        });
        return initial;
    });

    // Calculate Absence Alphas
    const absences = useMemo(() => {
        const counts: Record<string, number> = {};
        EMPLOYEES.forEach((emp) => {
            let alphaCount = 0;
            for (let d = 1; d <= 31; d++) {
                if (attendanceLog[emp.id][d] === 'A') {
                    alphaCount++;
                }
            }
            counts[emp.id] = alphaCount;
        });
        return counts;
    }, [attendanceLog]);

    // Rotates shift P -> S -> M -> O -> P
    const handleRotateMonthlyShift = (empId: string, dayKey: string) => {
        if (isReadOnly) return;
        setMonthlyShifts((prev) => {
            const empShifts = { ...prev[empId] };
            const current = empShifts[dayKey];
            const nextMap: Record<ShiftType, ShiftType> = { P: 'S', S: 'M', M: 'O', O: 'P' };
            empShifts[dayKey] = nextMap[current];
            return { ...prev, [empId]: empShifts };
        });
    };

    const handleRotateWeeklyShift = (empId: string, dayKey: string) => {
        if (isReadOnly) return;
        setWeeklyShifts((prev) => {
            const empShifts = { ...prev[empId] };
            const current = empShifts[dayKey];
            const nextMap: Record<ShiftType, ShiftType> = { P: 'S', S: 'M', M: 'O', O: 'P' };
            empShifts[dayKey] = nextMap[current];
            return { ...prev, [empId]: empShifts };
        });
    };

    // Toggle Attendance status H -> S -> I -> A -> H
    const handleToggleAttendance = (empId: string, dayNum: number) => {
        if (isReadOnly) return;
        setAttendanceLog((prev) => {
            const empLog = { ...prev[empId] };
            const current = empLog[dayNum];
            const nextMap: Record<'H' | 'S' | 'I' | 'A', 'H' | 'S' | 'I' | 'A'> = {
                H: 'S',
                S: 'I',
                I: 'A',
                A: 'H',
            };
            empLog[dayNum] = nextMap[current];
            return { ...prev, [empId]: empLog };
        });
    };

    // Apply weekly pattern to the whole monthly calendar
    const handleApplyPattern = () => {
        if (isReadOnly) return;
        setMonthlyShifts((prev) => {
            const updated = { ...prev };
            EMPLOYEES.forEach((emp) => {
                updated[emp.id] = { ...prev[emp.id] };
                MONTH_DAYS.forEach((day) => {
                    // Map day of week name to weekly pattern key
                    const dayNameUpper = day.dayName.toUpperCase();
                    let weekKey = 'sen';
                    if (dayNameUpper === 'SEN') weekKey = 'sen';
                    else if (dayNameUpper === 'SEL') weekKey = 'sel';
                    else if (dayNameUpper === 'RAB') weekKey = 'rab';
                    else if (dayNameUpper === 'KAM') weekKey = 'kam';
                    else if (dayNameUpper === 'JUM') weekKey = 'jum';
                    else if (dayNameUpper === 'SAB') weekKey = 'sab';
                    else if (dayNameUpper === 'MIN') weekKey = 'ming';

                    updated[emp.id][day.key] = weeklyShifts[emp.id][weekKey];
                });
            });
            return updated;
        });

        setSavedSuccess(true);
        setTimeout(() => setSavedSuccess(false), 3000);
    };

    const triggerDownloadPDF = () => {
        window.print();
    };

    return (
        <div className="space-y-6">
            {/* Top Header Navigation Tabs */}
            <div className="flex justify-between items-center border-b border-white/5 pb-4 print:hidden">
                <div className="flex gap-2">
                    {/* Daftar Karyawan tab: only visible to manager/owner */}
                    {!isReadOnly ? (
                        <Link
                            href="/admin/employees"
                            className="px-4 py-1.5 rounded-full text-xs font-semibold bg-white/5 text-slate-400 hover:bg-white/10 transition-colors"
                        >
                            DAFTAR KARYAWAN
                        </Link>
                    ) : (
                        <span
                            title="Hanya Manager atau Owner yang dapat mengakses Daftar Karyawan"
                            className="px-4 py-1.5 rounded-full text-xs font-semibold bg-white/[0.02] text-slate-600 border border-white/5 cursor-not-allowed select-none flex items-center gap-1.5"
                        >
                            <span>🔒</span> DAFTAR KARYAWAN
                        </span>
                    )}
                    <button
                        type="button"
                        className="px-4 py-1.5 rounded-full text-xs font-semibold bg-orange-500/20 text-orange-400 border border-orange-500/30"
                    >
                        JADWAL SHIFT
                    </button>
                </div>
                <div className="text-xs text-slate-400">Cabang Senopati</div>
            </div>

            {/* Main Shift Header Panel */}
            <div className="bg-[#1c1917]/80 rounded-2xl border border-white/5 p-6 print:bg-white print:text-black print:border-none print:shadow-none">
                <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
                    <div className="flex items-center gap-3">
                        <Link
                            href="/dashboard"
                            className="p-2 rounded-lg bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white transition-colors print:hidden"
                        >
                            <ArrowLeft className="size-4" />
                        </Link>
                        <div>
                            <h1 className="text-xl font-bold tracking-tight text-white print:text-black">
                                {viewType === 'monthly' ? 'JADWAL SHIFT' : 'POLA MINGGUAN'}
                            </h1>
                            <p className="text-xs text-slate-400 print:text-slate-600">
                                RENCANA & MANAJEMEN OPERASIONAL
                            </p>
                        </div>
                    </div>

                    {/* Month Selector */}
                    <div className="flex items-center gap-3 bg-black/30 rounded-xl px-4 py-2 border border-white/5 print:border-slate-300">
                        <button className="text-slate-400 hover:text-white print:hidden">
                            <ChevronLeft className="size-4" />
                        </button>
                        <span className="text-sm font-semibold text-slate-200 print:text-black flex items-center gap-2">
                            <Calendar className="size-4 text-emerald-400" /> {selectedMonth}
                        </span>
                        <button className="text-slate-400 hover:text-white print:hidden">
                            <ChevronRight className="size-4" />
                        </button>
                    </div>

                    {/* Weekly / Monthly Toggle Buttons */}
                    <div className="flex bg-black/40 rounded-xl p-1 border border-white/5 print:hidden">
                        <button
                            onClick={() => setViewType('monthly')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${viewType === 'monthly' ? 'bg-blue-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            MONTHLY
                        </button>
                        <button
                            onClick={() => setViewType('weekly')}
                            className={`px-4 py-1.5 rounded-lg text-xs font-semibold transition-colors ${viewType === 'weekly' ? 'bg-purple-600 text-white shadow-lg' : 'text-slate-400 hover:text-white'}`}
                        >
                            WEEKLY
                        </button>
                    </div>
                </div>

                {/* Legend Panel */}
                <div className="flex gap-4 mt-6 pt-4 border-t border-white/5 text-[11px] font-semibold text-slate-400 print:border-slate-300 print:text-slate-800">
                    <span className="flex items-center gap-1.5">
                        <span className="size-3 rounded-full flex items-center justify-center text-[9px] font-bold text-white bg-blue-600">
                            P
                        </span>{' '}
                        Pagi
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="size-3 rounded-full flex items-center justify-center text-[9px] font-bold text-white bg-emerald-600">
                            S
                        </span>{' '}
                        Siang
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="size-3 rounded-full flex items-center justify-center text-[9px] font-bold text-white bg-cyan-600">
                            M
                        </span>{' '}
                        Malam
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="size-3 rounded-full flex items-center justify-center text-[9px] font-bold text-white bg-rose-600">
                            O
                        </span>{' '}
                        Off
                    </span>
                </div>
            </div>

            {/* Read-Only Warning Banner */}
            {isReadOnly && (
                <div className="flex items-start gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-amber-400 text-xs leading-relaxed">
                    <ShieldAlert className="size-4 shrink-0 mt-0.5" />
                    <p>
                        <strong className="font-bold">⚠ Mode Baca Saja:</strong> Anda masuk sebagai staf biasa. Hanya{' '}
                        <strong>Manager</strong> atau <strong>Owner</strong> yang berwenang menyunting atau menyimpan
                        jadwal shift kerja.
                    </p>
                </div>
            )}

            {savedSuccess && (
                <div className="flex items-center gap-2 bg-emerald-500/10 border border-emerald-500/20 rounded-xl p-4 text-emerald-400 text-sm">
                    <Check className="size-4" /> Pola jadwal shift mingguan berhasil diterapkan ke bulan ini!
                </div>
            )}

            {/* MONTHLY VIEW CONTENT */}
            {viewType === 'monthly' && (
                <div className="space-y-6">
                    {/* ABSENCE MATRIX */}
                    <Glass className="p-6">
                        <h3 className="text-xs font-extrabold tracking-wider text-slate-500 uppercase mb-4 flex items-center gap-2">
                            <AlertCircle className="size-4 text-rose-500" /> ABSENCE MATRIX (ALPHA)
                        </h3>
                        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                            {EMPLOYEES.map((emp) => (
                                <div
                                    key={emp.id}
                                    className="flex items-center justify-between p-4 bg-white/[0.02] border border-white/5 rounded-xl"
                                >
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-full bg-slate-800 flex items-center justify-center font-bold text-slate-300 text-xs">
                                            {emp.avatar}
                                        </div>
                                        <div>
                                            <div className="text-sm font-semibold text-slate-200">{emp.name}</div>
                                            <div className="text-[10px] text-slate-500">{emp.role}</div>
                                        </div>
                                    </div>
                                    <div className="text-right">
                                        <div className="text-lg font-bold text-rose-400">{absences[emp.id]}</div>
                                        <div className="text-[9px] text-slate-500 font-medium">ALPHA / ABSENT</div>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Glass>

                    {/* MONTHLY CALENDAR GRID */}
                    <Glass className="p-0 overflow-hidden border border-white/5">
                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-black/20">
                                        <th className="p-4 text-left text-xs font-semibold text-slate-400 w-[180px] sticky left-0 bg-[#0c0a09] z-10">
                                            KARYAWAN
                                        </th>
                                        {MONTH_DAYS.map((day) => (
                                            <th
                                                key={day.key}
                                                className={`p-2 text-center text-[10px] font-semibold min-w-[36px] ${day.isWeekend ? 'bg-rose-500/5 text-rose-400' : 'text-slate-400'}`}
                                            >
                                                <div className="opacity-60">{day.dayName}</div>
                                                <div className="text-xs font-bold mt-0.5">{day.dayNum}</div>
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {EMPLOYEES.map((emp) => (
                                        <tr key={emp.id} className="border-b border-white/5 hover:bg-white/[0.01]">
                                            <td className="p-4 font-semibold text-slate-200 text-xs sticky left-0 bg-[#0c0a09] z-10 border-r border-white/5">
                                                <div className="font-bold">{emp.name}</div>
                                                <div className="text-[10px] text-slate-500 font-medium">{emp.role}</div>
                                            </td>
                                            {MONTH_DAYS.map((day) => {
                                                const shift = monthlyShifts[emp.id]?.[day.key] || 'O';
                                                const shiftStyle = SHIFT_INFO[shift];
                                                return (
                                                    <td
                                                        key={day.key}
                                                        className={`p-1.5 text-center ${day.isWeekend ? 'bg-rose-500/5' : ''}`}
                                                    >
                                                        <button
                                                            onClick={() => handleRotateMonthlyShift(emp.id, day.key)}
                                                            className={`size-7 rounded-full flex items-center justify-center text-[10px] font-bold border transition-all hover:scale-110 active:scale-95 ${shiftStyle.bg}`}
                                                        >
                                                            {shift}
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Glass>

                    {/* UNDUH BUTTON */}
                    <Button
                        className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/10 gap-2 print:hidden"
                        onClick={triggerDownloadPDF}
                    >
                        <Download className="size-4" /> UNDUH JADWAL BULANAN (PDF)
                    </Button>

                    {/* LOG PRESENSI KEHADIRAN */}
                    <Glass className="p-6">
                        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
                            <div>
                                <h3 className="text-sm font-bold text-slate-200">LOG PRESENSI KEHADIRAN</h3>
                                <p className="text-xs text-slate-500">Rekaman clock-in harian karyawan di outlet.</p>
                            </div>
                            <div className="flex gap-3 text-[10px] font-semibold text-slate-400">
                                <span className="flex items-center gap-1">
                                    <span className="size-2 rounded-full bg-emerald-500"></span> HADIR
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="size-2 rounded-full bg-blue-500"></span> SAKIT
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="size-2 rounded-full bg-amber-500"></span> IZIN
                                </span>
                                <span className="flex items-center gap-1">
                                    <span className="size-2 rounded-full bg-rose-500"></span> ALPHA
                                </span>
                            </div>
                        </div>

                        <div className="overflow-x-auto custom-scrollbar">
                            <table className="w-full border-collapse">
                                <thead>
                                    <tr className="border-b border-white/5 bg-black/20">
                                        <th className="p-3 text-left text-xs font-semibold text-slate-400 w-[180px] sticky left-0 bg-[#0c0a09] z-10">
                                            KARYAWAN
                                        </th>
                                        {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => (
                                            <th
                                                key={day}
                                                className="p-2 text-center text-[10px] font-semibold min-w-[32px] text-slate-400"
                                            >
                                                {day.toString().padStart(2, '0')}
                                            </th>
                                        ))}
                                    </tr>
                                </thead>
                                <tbody>
                                    {EMPLOYEES.map((emp) => (
                                        <tr key={emp.id} className="border-b border-white/5 hover:bg-white/[0.01]">
                                            <td className="p-3 font-semibold text-slate-200 text-xs sticky left-0 bg-[#0c0a09] z-10 border-r border-white/5">
                                                {emp.name}
                                            </td>
                                            {Array.from({ length: 31 }, (_, i) => i + 1).map((day) => {
                                                const status = attendanceLog[emp.id]?.[day] || 'H';
                                                let statusColor =
                                                    'bg-emerald-500/10 text-emerald-400 border-emerald-500/20';
                                                if (status === 'S')
                                                    statusColor = 'bg-blue-500/10 text-blue-400 border-blue-500/20';
                                                else if (status === 'I')
                                                    statusColor = 'bg-amber-500/10 text-amber-400 border-amber-500/20';
                                                else if (status === 'A')
                                                    statusColor = 'bg-rose-500/10 text-rose-400 border-rose-500/20';

                                                return (
                                                    <td key={day} className="p-1.5 text-center">
                                                        <button
                                                            onClick={() => handleToggleAttendance(emp.id, day)}
                                                            className={`size-6 rounded-lg border flex items-center justify-center text-[9px] font-extrabold transition-all hover:scale-110 active:scale-95 ${statusColor}`}
                                                        >
                                                            {status === 'H' && <Check className="size-3" />}
                                                            {status === 'S' && 'S'}
                                                            {status === 'I' && 'I'}
                                                            {status === 'A' && <X className="size-3" />}
                                                        </button>
                                                    </td>
                                                );
                                            })}
                                        </tr>
                                    ))}
                                </tbody>
                            </table>
                        </div>
                    </Glass>
                </div>
            )}

            {/* WEEKLY VIEW CONTENT */}
            {viewType === 'weekly' && (
                <div className="space-y-6">
                    {/* Info Alert Box */}
                    <div className="flex gap-3 bg-amber-500/10 border border-amber-500/20 rounded-xl p-4 text-amber-400 text-xs leading-relaxed">
                        <AlertCircle className="size-4 shrink-0" />
                        <p>
                            <strong>ATUR JADWAL STANDAR UNTUK 1 MINGGU.</strong> POLA INI AKAN DIULANG SETIAP MINGGU.
                            DALAM SEBULAN SETIAP SENIN AKAN MENDAPAT POLA SENIN, DST. UNTUK MEMPERCEPAT PENGISIAN
                            JADWAL.
                        </p>
                    </div>

                    {/* WEEKLY SHIFT GRID */}
                    <Glass className="p-0 overflow-hidden border border-white/5">
                        <table className="w-full border-collapse">
                            <thead>
                                <tr className="border-b border-white/5 bg-black/20">
                                    <th className="p-4 text-left text-xs font-semibold text-slate-400 w-[200px]">
                                        KARYAWAN
                                    </th>
                                    {WEEK_DAYS.map((day) => (
                                        <th
                                            key={day.key}
                                            className="p-4 text-center text-xs font-semibold text-slate-400"
                                        >
                                            {day.name}
                                        </th>
                                    ))}
                                </tr>
                            </thead>
                            <tbody>
                                {EMPLOYEES.map((emp) => (
                                    <tr key={emp.id} className="border-b border-white/5 hover:bg-white/[0.01]">
                                        <td className="p-4 font-semibold text-slate-200 text-xs">
                                            <div className="font-bold">{emp.name}</div>
                                            <div className="text-[10px] text-slate-500 font-medium">{emp.role}</div>
                                        </td>
                                        {WEEK_DAYS.map((day) => {
                                            const shift = weeklyShifts[emp.id]?.[day.key] || 'O';
                                            const shiftStyle = SHIFT_INFO[shift];
                                            return (
                                                <td key={day.key} className="p-4 text-center">
                                                    <button
                                                        onClick={() => handleRotateWeeklyShift(emp.id, day.key)}
                                                        className={`mx-auto size-8 rounded-full flex items-center justify-center text-xs font-bold border transition-all hover:scale-110 active:scale-95 ${shiftStyle.bg}`}
                                                    >
                                                        {shift}
                                                    </button>
                                                </td>
                                            );
                                        })}
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </Glass>

                    {/* Simpan & Terapkan Actions Card — Manager / Owner only */}
                    {!isReadOnly && (
                        <Glass className="p-6 space-y-5">
                            <div className="flex gap-4">
                                <Button
                                    variant="outline"
                                    className="bg-white/5 border-white/10 hover:bg-white/10 text-white font-semibold py-2.5 px-6 rounded-lg gap-2"
                                    onClick={() => {
                                        setSavedSuccess(true);
                                        setTimeout(() => setSavedSuccess(false), 2000);
                                    }}
                                >
                                    <Save className="size-4" /> SIMPAN POLA
                                </Button>
                                <Button
                                    className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-2.5 px-6 rounded-lg gap-2"
                                    onClick={handleApplyPattern}
                                >
                                    <RefreshCw className="size-4" /> TERAPKAN KE BULAN INI
                                </Button>
                            </div>

                            {/* Effective Starting Date Picker */}
                            <div className="space-y-2 max-w-sm">
                                <label className="text-xs font-semibold text-slate-400 flex items-center gap-1.5">
                                    <Calendar className="size-3.5" /> BERLAKU MULAI TANGGAL
                                </label>
                                <input
                                    type="date"
                                    value={effectiveDate}
                                    onChange={(e) => setEffectiveDate(e.target.value)}
                                    className="w-full bg-[#1c1917] border border-white/10 rounded-lg p-2.5 text-sm text-slate-200 outline-none focus:border-emerald-500/30 transition-colors font-mono"
                                />
                            </div>
                        </Glass>
                    )}

                    {/* WEEKLY PDF DOWNLOAD */}
                    <Button
                        className="w-full bg-slate-900 hover:bg-slate-800 text-slate-200 border border-white/10 font-bold py-3.5 rounded-xl shadow-lg gap-2 print:hidden"
                        onClick={triggerDownloadPDF}
                    >
                        <Download className="size-4" /> UNDUH POLA MINGGUAN (PDF)
                    </Button>
                </div>
            )}

            {/* Print-Only Custom Layout stylesheet */}
            <style>{`
        @media print {
          body {
            background: white !important;
            color: black !important;
          }
          aside, header, nav, button, .print\\:hidden {
            display: none !important;
          }
          table {
            border: 1px solid #cbd5e1 !important;
            color: black !important;
          }
          th, td {
            border: 1px solid #e2e8f0 !important;
            color: black !important;
            background: transparent !important;
          }
          .glass-container, .bg-white\\/\\[0\\.02\\] {
            background: transparent !important;
            border: none !important;
            box-shadow: none !important;
          }
          .text-slate-400, .text-slate-500, .text-slate-200 {
            color: black !important;
          }
          h1, h2, h3 {
            color: black !important;
            font-weight: bold !important;
          }
        }
      `}</style>
        </div>
    );
}
