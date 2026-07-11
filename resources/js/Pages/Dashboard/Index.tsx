import { useState, type ElementType } from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { Screen, Glass, Badge, formatRupiah, toneMap, type Tone, useTenantSettings } from '../../Components/Shared';
import {
    DollarSign,
    Utensils,
    Package,
    Users,
    Sparkles,
    Clock,
    TrendingUp,
    AlertTriangle,
    Building2,
    ChevronRight,
    Award,
    ShieldAlert,
    BarChart3,
    Calendar,
} from 'lucide-react';

type Timeframe = 'today' | 'weekly' | 'semester' | 'yearly';

// ─── Interactive Revenue Chart with Dates & Hover ──────────────────────────────
function RevenueChart({
    isNanoBanana = false,
    mode = 'global',
    timeframe = 'weekly',
}: {
    isNanoBanana?: boolean;
    mode: string;
    timeframe: Timeframe;
}) {
    const [activeIdx, setActiveIdx] = useState<number | null>(null);

    const globalToday = [
        {
            day: '08:00',
            date: 'Hari Ini',
            fullDate: 'Hari Ini, 08:00 WIB',
            value: 3200000,
            orders: 45,
            avgTicket: 71111,
            y: 170,
        },
        {
            day: '10:00',
            date: 'Hari Ini',
            fullDate: 'Hari Ini, 10:00 WIB',
            value: 6500000,
            orders: 90,
            avgTicket: 72222,
            y: 145,
        },
        {
            day: '12:00',
            date: 'Hari Ini',
            fullDate: 'Hari Ini, 12:00 WIB',
            value: 24500000,
            orders: 340,
            avgTicket: 72058,
            y: 70,
        },
        {
            day: '14:00',
            date: 'Hari Ini',
            fullDate: 'Hari Ini, 14:00 WIB',
            value: 12800000,
            orders: 180,
            avgTicket: 71111,
            y: 110,
        },
        {
            day: '16:00',
            date: 'Hari Ini',
            fullDate: 'Hari Ini, 16:00 WIB',
            value: 9200000,
            orders: 130,
            avgTicket: 70769,
            y: 130,
        },
        {
            day: '18:00',
            date: 'Hari Ini',
            fullDate: 'Hari Ini, 18:00 WIB',
            value: 28500000,
            orders: 390,
            avgTicket: 73076,
            y: 55,
        },
        {
            day: '20:00',
            date: 'Hari Ini',
            fullDate: 'Hari Ini, 20:00 WIB',
            value: 34000000,
            orders: 460,
            avgTicket: 73913,
            y: 35,
        },
        {
            day: '22:00',
            date: 'Hari Ini',
            fullDate: 'Hari Ini, 22:00 WIB',
            value: 8500000,
            orders: 115,
            avgTicket: 73913,
            y: 150,
        },
    ];

    const singleToday = [
        {
            day: '08:00',
            date: 'Hari Ini',
            fullDate: 'Hari Ini, 08:00 WIB',
            value: 150000,
            orders: 5,
            avgTicket: 30000,
            y: 175,
        },
        {
            day: '10:00',
            date: 'Hari Ini',
            fullDate: 'Hari Ini, 10:00 WIB',
            value: 350000,
            orders: 10,
            avgTicket: 35000,
            y: 155,
        },
        {
            day: '12:00',
            date: 'Hari Ini',
            fullDate: 'Hari Ini, 12:00 WIB',
            value: 1850000,
            orders: 53,
            avgTicket: 34905,
            y: 90,
        },
        {
            day: '14:00',
            date: 'Hari Ini',
            fullDate: 'Hari Ini, 14:00 WIB',
            value: 820000,
            orders: 24,
            avgTicket: 34166,
            y: 130,
        },
        {
            day: '16:00',
            date: 'Hari Ini',
            fullDate: 'Hari Ini, 16:00 WIB',
            value: 580000,
            orders: 17,
            avgTicket: 34117,
            y: 145,
        },
        {
            day: '18:00',
            date: 'Hari Ini',
            fullDate: 'Hari Ini, 18:00 WIB',
            value: 2150000,
            orders: 60,
            avgTicket: 35833,
            y: 70,
        },
        {
            day: '20:00',
            date: 'Hari Ini',
            fullDate: 'Hari Ini, 20:00 WIB',
            value: 2650000,
            orders: 74,
            avgTicket: 35810,
            y: 40,
        },
        {
            day: '22:00',
            date: 'Hari Ini',
            fullDate: 'Hari Ini, 22:00 WIB',
            value: 450000,
            orders: 13,
            avgTicket: 34615,
            y: 160,
        },
    ];

    const globalWeekly = [
        {
            day: 'Sen',
            date: '08 Jul',
            fullDate: 'Senin, 8 Juli 2026',
            value: 22400000,
            orders: 320,
            avgTicket: 70000,
            y: 160,
        },
        {
            day: 'Sel',
            date: '09 Jul',
            fullDate: 'Selasa, 9 Juli 2026',
            value: 25100000,
            orders: 364,
            avgTicket: 68956,
            y: 135,
        },
        {
            day: 'Rab',
            date: '10 Jul',
            fullDate: 'Rabu, 10 Juli 2026',
            value: 28500000,
            orders: 412,
            avgTicket: 69174,
            y: 105,
        },
        {
            day: 'Kam',
            date: '11 Jul',
            fullDate: 'Kamis, 11 Juli 2026',
            value: 26800000,
            orders: 390,
            avgTicket: 68717,
            y: 120,
        },
        {
            day: 'Jum',
            date: '12 Jul',
            fullDate: 'Jumat, 12 Juli 2026',
            value: 31200000,
            orders: 450,
            avgTicket: 69333,
            y: 80,
        },
        {
            day: 'Sab',
            date: '13 Jul',
            fullDate: 'Sabtu, 13 Juli 2026',
            value: 36500000,
            orders: 520,
            avgTicket: 70192,
            y: 35,
        },
        {
            day: 'Min',
            date: '14 Jul',
            fullDate: 'Minggu, 14 Juli 2026',
            value: 34000000,
            orders: 485,
            avgTicket: 70103,
            y: 55,
        },
    ];

    const singleWeekly = [
        {
            day: 'Sen',
            date: '08 Jul',
            fullDate: 'Senin, 8 Juli 2026',
            value: 1450000,
            orders: 42,
            avgTicket: 34523,
            y: 165,
        },
        {
            day: 'Sel',
            date: '09 Jul',
            fullDate: 'Selasa, 9 Juli 2026',
            value: 1680000,
            orders: 48,
            avgTicket: 35000,
            y: 140,
        },
        {
            day: 'Rab',
            date: '10 Jul',
            fullDate: 'Rabu, 10 Juli 2026',
            value: 1850000,
            orders: 55,
            avgTicket: 33636,
            y: 120,
        },
        {
            day: 'Kam',
            date: '11 Jul',
            fullDate: 'Kamis, 11 Juli 2026',
            value: 1720000,
            orders: 50,
            avgTicket: 34400,
            y: 132,
        },
        {
            day: 'Jum',
            date: '12 Jul',
            fullDate: 'Jumat, 12 Juli 2026',
            value: 2150000,
            orders: 62,
            avgTicket: 34677,
            y: 90,
        },
        {
            day: 'Sab',
            date: '13 Jul',
            fullDate: 'Sabtu, 13 Juli 2026',
            value: 2650000,
            orders: 75,
            avgTicket: 35333,
            y: 40,
        },
        {
            day: 'Min',
            date: '14 Jul',
            fullDate: 'Minggu, 14 Juli 2026',
            value: 2450000,
            orders: 68,
            avgTicket: 36029,
            y: 60,
        },
    ];

    const globalSemester = [
        {
            day: 'Jan',
            date: 'Sem 1',
            fullDate: 'Januari 2026',
            value: 680000000,
            orders: 9500,
            avgTicket: 71578,
            y: 150,
        },
        {
            day: 'Feb',
            date: 'Sem 1',
            fullDate: 'Februari 2026',
            value: 720000000,
            orders: 10100,
            avgTicket: 71287,
            y: 130,
        },
        {
            day: 'Mar',
            date: 'Sem 1',
            fullDate: 'Maret 2026',
            value: 780000000,
            orders: 10900,
            avgTicket: 71559,
            y: 100,
        },
        { day: 'Apr', date: 'Sem 1', fullDate: 'April 2026', value: 890000000, orders: 12300, avgTicket: 72357, y: 60 },
        { day: 'Mei', date: 'Sem 1', fullDate: 'Mei 2026', value: 950000000, orders: 13000, avgTicket: 73076, y: 35 },
        { day: 'Jun', date: 'Sem 1', fullDate: 'Juni 2026', value: 920000000, orders: 12600, avgTicket: 73015, y: 45 },
    ];

    const singleSemester = [
        {
            day: 'Jan',
            date: 'Sem 1',
            fullDate: 'Januari 2026',
            value: 45000000,
            orders: 1250,
            avgTicket: 36000,
            y: 155,
        },
        {
            day: 'Feb',
            date: 'Sem 1',
            fullDate: 'Februari 2026',
            value: 48000000,
            orders: 1350,
            avgTicket: 35555,
            y: 140,
        },
        { day: 'Mar', date: 'Sem 1', fullDate: 'Maret 2026', value: 52000000, orders: 1460, avgTicket: 35616, y: 120 },
        { day: 'Apr', date: 'Sem 1', fullDate: 'April 2026', value: 61000000, orders: 1720, avgTicket: 35465, y: 80 },
        { day: 'Mei', date: 'Sem 1', fullDate: 'Mei 2026', value: 68000000, orders: 1900, avgTicket: 35789, y: 45 },
        { day: 'Jun', date: 'Sem 1', fullDate: 'Juni 2026', value: 65000000, orders: 1820, avgTicket: 35714, y: 60 },
    ];

    const globalYearly = [
        { day: 'Jul', date: "'25", fullDate: 'Juli 2025', value: 510000000, orders: 7200, avgTicket: 70833, y: 170 },
        { day: 'Ags', date: "'25", fullDate: 'Agustus 2025', value: 540000000, orders: 7600, avgTicket: 71052, y: 160 },
        {
            day: 'Sep',
            date: "'25",
            fullDate: 'September 2025',
            value: 580000000,
            orders: 8100,
            avgTicket: 71604,
            y: 145,
        },
        { day: 'Okt', date: "'25", fullDate: 'Oktober 2025', value: 620000000, orders: 8700, avgTicket: 71264, y: 130 },
        {
            day: 'Nov',
            date: "'25",
            fullDate: 'November 2025',
            value: 600000000,
            orders: 8400,
            avgTicket: 71428,
            y: 138,
        },
        {
            day: 'Des',
            date: "'25",
            fullDate: 'Desember 2025',
            value: 750000000,
            orders: 10200,
            avgTicket: 73529,
            y: 95,
        },
        { day: 'Jan', date: "'26", fullDate: 'Januari 2026', value: 680000000, orders: 9500, avgTicket: 71578, y: 115 },
        {
            day: 'Feb',
            date: "'26",
            fullDate: 'Februari 2026',
            value: 720000000,
            orders: 10100,
            avgTicket: 71287,
            y: 105,
        },
        { day: 'Mar', date: "'26", fullDate: 'Maret 2026', value: 780000000, orders: 10900, avgTicket: 71559, y: 85 },
        { day: 'Apr', date: "'26", fullDate: 'April 2026', value: 890000000, orders: 12300, avgTicket: 72357, y: 50 },
        { day: 'Mei', date: "'26", fullDate: 'Mei 2026', value: 950000000, orders: 13000, avgTicket: 73076, y: 30 },
        { day: 'Jun', date: "'26", fullDate: 'Juni 2026', value: 920000000, orders: 12600, avgTicket: 73015, y: 40 },
    ];

    const singleYearly = [
        { day: 'Jul', date: "'25", fullDate: 'Juli 2025', value: 34000000, orders: 980, avgTicket: 34693, y: 175 },
        { day: 'Ags', date: "'25", fullDate: 'Agustus 2025', value: 36000000, orders: 1020, avgTicket: 35294, y: 165 },
        {
            day: 'Sep',
            date: "'25",
            fullDate: 'September 2025',
            value: 38000000,
            orders: 1090,
            avgTicket: 34862,
            y: 155,
        },
        { day: 'Okt', date: "'25", fullDate: 'Oktober 2025', value: 41000000, orders: 1180, avgTicket: 34745, y: 140 },
        { day: 'Nov', date: "'25", fullDate: 'November 2025', value: 39000000, orders: 1120, avgTicket: 34821, y: 148 },
        { day: 'Des', date: "'25", fullDate: 'Desember 2025', value: 49000000, orders: 1380, avgTicket: 35507, y: 110 },
        { day: 'Jan', date: "'26", fullDate: 'Januari 2026', value: 45000000, orders: 1250, avgTicket: 36000, y: 125 },
        { day: 'Feb', date: "'26", fullDate: 'Februari 2026', value: 48000000, orders: 1350, avgTicket: 35555, y: 115 },
        { day: 'Mar', date: "'26", fullDate: 'Maret 2026', value: 52000000, orders: 1460, avgTicket: 35616, y: 100 },
        { day: 'Apr', date: "'26", fullDate: 'April 2026', value: 61000000, orders: 1720, avgTicket: 35465, y: 65 },
        { day: 'Mei', date: "'26", fullDate: 'Mei 2026', value: 68000000, orders: 1900, avgTicket: 35789, y: 40 },
        { day: 'Jun', date: "'26", fullDate: 'Juni 2026', value: 65000000, orders: 1820, avgTicket: 35714, y: 50 },
    ];

    const data =
        timeframe === 'today'
            ? mode === 'global'
                ? globalToday
                : singleToday
            : timeframe === 'weekly'
              ? mode === 'global'
                  ? globalWeekly
                  : singleWeekly
              : timeframe === 'semester'
                ? mode === 'global'
                    ? globalSemester
                    : singleSemester
                : mode === 'global'
                  ? globalYearly
                  : singleYearly;

    // Safely clamp active index when data length changes
    const activePointIdx = activeIdx !== null && activeIdx < data.length ? activeIdx : Math.floor(data.length / 2);
    const activePoint = data[activePointIdx];

    const paddingX = 60;
    const chartWidth = 620; // 680 - 60
    const xPositions = data.map((_, i) => paddingX + (i * chartWidth) / (data.length - 1));

    const pts = data.map((d, i) => `${xPositions[i]},${d.y}`).join(' ');

    let grids: Array<{ y: number; label: string }> = [];
    if (mode === 'global') {
        if (timeframe === 'today') {
            grids = [
                { y: 35, label: '40M' },
                { y: 80, label: '30M' },
                { y: 125, label: '20M' },
                { y: 170, label: '10M' },
            ];
        } else if (timeframe === 'weekly') {
            grids = [
                { y: 35, label: '35M' },
                { y: 80, label: '28M' },
                { y: 125, label: '21M' },
                { y: 170, label: '14M' },
            ];
        } else {
            grids = [
                { y: 35, label: '1.0B' },
                { y: 80, label: '800jt' },
                { y: 125, label: '600jt' },
                { y: 170, label: '400jt' },
            ];
        }
    } else {
        if (timeframe === 'today') {
            grids = [
                { y: 35, label: '3M' },
                { y: 80, label: '2.2M' },
                { y: 125, label: '1.5M' },
                { y: 170, label: '750rb' },
            ];
        } else if (timeframe === 'weekly') {
            grids = [
                { y: 35, label: '2.6M' },
                { y: 80, label: '2.0M' },
                { y: 125, label: '1.4M' },
                { y: 170, label: '800rb' },
            ];
        } else {
            grids = [
                { y: 35, label: '70jt' },
                { y: 80, label: '50jt' },
                { y: 125, label: '35jt' },
                { y: 170, label: '20jt' },
            ];
        }
    }

    return (
        <div className="flex flex-col h-full">
            {/* Active Detail Bar */}
            <div
                className={`flex flex-wrap items-center justify-between px-3 py-2 rounded-xl mb-3 text-xs border ${
                    isNanoBanana
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                }`}
            >
                <div className="flex items-center gap-2">
                    <Calendar className="size-3.5 text-amber-400" />
                    <span className="font-semibold">{activePoint.fullDate}</span>
                </div>
                <div className="flex items-center gap-4">
                    <div>
                        Omset: <span className="font-bold text-white">{formatRupiah(activePoint.value)}</span>
                    </div>
                    <div>
                        Transaksi: <span className="font-bold text-white">{activePoint.orders} Struk</span>
                    </div>
                    <div>
                        Avg Ticket: <span className="font-bold text-white">{formatRupiah(activePoint.avgTicket)}</span>
                    </div>
                </div>
            </div>

            {/* SVG Chart */}
            <div className="flex-1 relative min-h-[160px]">
                <svg viewBox="0 0 720 200" className="w-full h-full overflow-visible">
                    <defs>
                        <linearGradient id="lineGrad" x1="0" x2="1">
                            <stop stopColor={isNanoBanana ? '#EAB308' : '#3B82F6'} />
                            <stop offset="1" stopColor={isNanoBanana ? '#FACC15' : '#10B981'} />
                        </linearGradient>
                        <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
                            <stop
                                offset="0%"
                                stopColor={isNanoBanana ? 'rgba(234,179,8,0.25)' : 'rgba(16,185,129,0.25)'}
                            />
                            <stop
                                offset="100%"
                                stopColor={isNanoBanana ? 'rgba(234,179,8,0.0)' : 'rgba(16,185,129,0.0)'}
                            />
                        </linearGradient>
                    </defs>

                    {/* Y-Axis Grid & Labels */}
                    {grids.map((grid, i) => (
                        <g key={i}>
                            <line
                                x1="45"
                                y1={grid.y}
                                x2="690"
                                y2={grid.y}
                                stroke="rgba(255,255,255,0.06)"
                                strokeDasharray="4 4"
                            />
                            <text
                                x="35"
                                y={grid.y + 4}
                                fill="rgba(255,255,255,0.4)"
                                fontSize="9"
                                textAnchor="end"
                                className="font-mono"
                            >
                                {grid.label}
                            </text>
                        </g>
                    ))}

                    {/* Area Fill & Line */}
                    <polyline
                        points={`${paddingX},190 ${pts} ${xPositions[xPositions.length - 1]},190`}
                        fill="url(#fillGrad)"
                    />
                    <polyline
                        points={pts}
                        fill="none"
                        stroke="url(#lineGrad)"
                        strokeWidth="3"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                    />

                    {/* Interactive Data Dots & X-Axis Labels */}
                    {data.map((d, i) => {
                        const x = xPositions[i];
                        const isSelected = activePointIdx === i;
                        return (
                            <g key={i} className="cursor-pointer group/point" onClick={() => setActiveIdx(i)}>
                                {/* Vertical hover guide */}
                                <line
                                    x1={x}
                                    y1="30"
                                    x2={x}
                                    y2="190"
                                    stroke={
                                        isSelected
                                            ? isNanoBanana
                                                ? 'rgba(234,179,8,0.4)'
                                                : 'rgba(16,185,129,0.4)'
                                            : 'transparent'
                                    }
                                    strokeWidth="1"
                                    strokeDasharray="2 2"
                                />

                                {/* Dot */}
                                <circle
                                    cx={x}
                                    cy={d.y}
                                    r={isSelected ? '6' : '4'}
                                    fill={isSelected ? (isNanoBanana ? '#FACC15' : '#10B981') : '#09090b'}
                                    stroke={isNanoBanana ? '#FACC15' : '#3B82F6'}
                                    strokeWidth={isSelected ? '3' : '2'}
                                    className="transition-all duration-200"
                                />

                                {/* X-Axis Day & Date */}
                                <text
                                    x={x}
                                    y="196"
                                    fill={isSelected ? '#ffffff' : 'rgba(255,255,255,0.5)'}
                                    fontSize="10"
                                    textAnchor="middle"
                                    fontWeight={isSelected ? 'bold' : 'normal'}
                                >
                                    {d.day}
                                </text>
                                {timeframe !== 'today' && (
                                    <text
                                        x={x}
                                        y="207"
                                        fill={
                                            isSelected
                                                ? isNanoBanana
                                                    ? '#FACC15'
                                                    : '#34D399'
                                                : 'rgba(255,255,255,0.35)'
                                        }
                                        fontSize="8"
                                        textAnchor="middle"
                                        className="font-mono"
                                    >
                                        {d.date}
                                    </text>
                                )}
                            </g>
                        );
                    })}
                </svg>
            </div>
        </div>
    );
}

// ─── Peak Order Hours Heatmap & Bar Chart ──────────────────────────────────────
function PeakOrderHours({ isNanoBanana = false }: { isNanoBanana?: boolean }) {
    const hours = [
        { hour: '08:00', orders: 12, label: 'Pagi', rush: false },
        { hour: '10:00', orders: 28, label: 'Pagi', rush: false },
        { hour: '11:30', orders: 85, label: 'Lunch Rush', rush: true },
        { hour: '12:30', orders: 94, label: 'Lunch Rush', rush: true },
        { hour: '14:00', orders: 42, label: 'Siang', rush: false },
        { hour: '16:00', orders: 55, label: 'Sore', rush: false },
        { hour: '18:30', orders: 98, label: 'Dinner Rush', rush: true },
        { hour: '19:30', orders: 105, label: 'Peak Dinner', rush: true },
        { hour: '21:00', orders: 60, label: 'Malam', rush: false },
    ];

    const maxOrders = 105;

    return (
        <div className="space-y-4">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between text-xs text-slate-400 gap-2">
                <span className="flex items-center gap-2">
                    <Clock className="size-3.5 text-blue-400 shrink-0" /> Distribusi Pesanan (Hari Ini)
                </span>
                <span className="flex items-center gap-3 font-mono text-[10px] shrink-0">
                    <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-amber-400"></span> Jam Ramai
                    </span>
                    <span className="flex items-center gap-1.5">
                        <span className="size-2 rounded-full bg-slate-600"></span> Normal
                    </span>
                </span>
            </div>

            {/* Horizontal Scrollable Container to prevent squeezing */}
            <div className="overflow-x-auto pb-2 pr-1 scrollbar-thin">
                <div className="grid grid-cols-9 gap-3 items-end h-32 pt-4 border-b border-white/5 pb-2 min-w-[380px] md:min-w-0">
                    {hours.map((h, i) => {
                        const heightPct = Math.round((h.orders / maxOrders) * 100);
                        return (
                            <div key={i} className="flex flex-col items-center gap-1 group relative">
                                {/* Tooltip */}
                                <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/90 text-white text-[10px] px-2 py-1 rounded border border-white/10 opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-20 pointer-events-none shadow-xl">
                                    <p className="font-bold">{h.hour} WIB</p>
                                    <p className="text-slate-300">{h.orders} Transaksi/Jam</p>
                                </div>

                                {/* Bar */}
                                <div
                                    style={{ height: `${heightPct}%` }}
                                    className={`w-full rounded-t-md transition-all duration-300 ${
                                        h.rush
                                            ? isNanoBanana
                                                ? 'bg-gradient-to-t from-amber-600 to-amber-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]'
                                                : 'bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]'
                                            : 'bg-white/10 group-hover:bg-white/20'
                                    }`}
                                />

                                {/* Hour text */}
                                <span
                                    className={`text-[10px] font-mono mt-1 ${h.rush ? (isNanoBanana ? 'text-amber-400 font-bold' : 'text-emerald-400 font-bold') : 'text-slate-500'}`}
                                >
                                    {h.hour}
                                </span>
                            </div>
                        );
                    })}
                </div>
            </div>

            {/* 3-Line Vertical Center Aligned Cards */}
            <div className="grid grid-cols-3 gap-2 pt-1">
                <div className="bg-white/[0.02] border border-white/5 p-2 rounded-xl flex flex-col items-center justify-center text-center space-y-0.5 min-w-0">
                    <span className="text-[10px] text-slate-400 font-semibold truncate w-full">Puncak Lunch</span>
                    <span className="text-xs font-bold text-white">12:30 WIB</span>
                    <span className="text-[9px] text-slate-400 font-bold">(94 Order)</span>
                </div>
                <div className="bg-white/[0.02] border border-white/5 p-2 rounded-xl flex flex-col items-center justify-center text-center space-y-0.5 min-w-0">
                    <span className="text-[10px] text-slate-400 font-semibold truncate w-full">Puncak Dinner</span>
                    <span className="text-xs font-bold text-amber-400">19:30 WIB</span>
                    <span className="text-[9px] text-amber-500/80 font-bold">(105 Order)</span>
                </div>
                <div className="bg-white/[0.02] border border-white/5 p-2 rounded-xl flex flex-col items-center justify-center text-center space-y-0.5 min-w-0">
                    <span className="text-[10px] text-slate-400 font-semibold truncate w-full">Rata-rata Saji</span>
                    <span className="text-xs font-bold text-emerald-400">14 Menit</span>
                    <span className="text-[9px] text-emerald-500/80 font-bold">(KDS Lead)</span>
                </div>
            </div>
        </div>
    );
}

// ─── Main Owner Dashboard ──────────────────────────────────────────────────────
export default function Dashboard() {
    const { screenMode } = useTenantSettings();
    const isNanoBanana = screenMode === 'nano-banana';
    const [selectedOutlet, setSelectedOutlet] = useState('Semua Outlet (Global)');
    const [timeframe, setTimeframe] = useState<Timeframe>('weekly');

    const isGlobal = selectedOutlet === 'Semua Outlet (Global)';

    // Dynamic values based on timeframe and mode
    let revenueValue = 184500000;
    let revenueSub = '100 Cabang Aktif (Mtd)';
    let revenueDelta = '+14.8%';

    let occupancyValue = '3.240 / 4.100';
    let occupancySub = '79% Kapasitas Terisi Global';
    let occupancyDelta = '42 mnt/meja';

    let foodCostValue = '28.2%';
    let foodCostSub = 'Target Ideal < 30.0%';
    let foodCostDelta = '-0.8% YoY';

    let healthValue = '98 / 100';
    let healthSub = '2 Butuh Audit & Perhatian';
    let healthDelta = '98% Normal';

    if (isGlobal) {
        if (timeframe === 'today') {
            revenueValue = 34000000;
            revenueSub = 'Konsolidasi Hari Ini (Real-time)';
            revenueDelta = '+18.2%';
            occupancyValue = '3.420 / 4.100';
            occupancySub = '83% Kapasitas Terisi Hari Ini';
            occupancyDelta = '38 mnt/meja';
            foodCostValue = '27.8%';
            foodCostSub = 'Pemakaian Harian Pusat & Cabang';
            foodCostDelta = '-1.2%';
        } else if (timeframe === 'weekly') {
            revenueValue = 184500000;
            revenueSub = '100 Cabang Aktif (7 Hari Terakhir)';
            revenueDelta = '+14.8%';
            occupancyValue = '3.240 / 4.100';
            occupancySub = '79% Kapasitas Terisi Global';
            occupancyDelta = '42 mnt/meja';
            foodCostValue = '28.2%';
            foodCostSub = 'Target Ideal < 30.0%';
            foodCostDelta = '-0.8%';
        } else if (timeframe === 'semester') {
            revenueValue = 4940000000;
            revenueSub = 'Total Konsolidasi Semester Ini (6Bln)';
            revenueDelta = '+16.5%';
            occupancyValue = '3.150 / 4.100';
            occupancySub = '76% Rata-rata Okupansi Semester';
            occupancyDelta = '45 mnt/meja';
            foodCostValue = '28.4%';
            foodCostSub = 'Konsolidasi HPP Semester 1';
            foodCostDelta = '-0.5%';
        } else {
            revenueValue = 8490000000;
            revenueSub = 'Total Konsolidasi 1 Tahun Terakhir';
            revenueDelta = '+15.2%';
            occupancyValue = '3.080 / 4.100';
            occupancySub = '75% Rata-rata Okupansi 12 Bulan';
            occupancyDelta = '46 mnt/meja';
            foodCostValue = '28.6%';
            foodCostSub = 'Konsolidasi HPP Tahunan';
            foodCostDelta = '-0.3%';
        }
    } else {
        // Single Outlet View
        healthValue = '95%';
        healthSub = '19 dari 20 Staff Hadir';
        healthDelta = '+2%';
        if (timeframe === 'today') {
            revenueValue = 2450000;
            revenueSub = 'Hari Ini (Real-time)';
            revenueDelta = '+10.5%';
            occupancyValue = '22 / 25 Meja';
            occupancySub = '88% Kapasitas Terisi Hari Ini';
            occupancyDelta = '+4 Meja';
            foodCostValue = '28.0%';
            foodCostSub = 'HPP Pemakaian Hari Ini';
            foodCostDelta = '-1.5%';
        } else if (timeframe === 'weekly') {
            revenueValue = 12500000;
            revenueSub = '7 Hari Terakhir (Real-time)';
            revenueDelta = '+12.4%';
            occupancyValue = '18 / 25 Meja';
            occupancySub = '72% Kapasitas Terisi';
            occupancyDelta = '+3 Meja';
            foodCostValue = '28.5%';
            foodCostSub = 'HPP vs Harga Jual Mingguan';
            foodCostDelta = '-1.2%';
        } else if (timeframe === 'semester') {
            revenueValue = 339000000;
            revenueSub = 'Semester Ini (Real-time)';
            revenueDelta = '+11.8%';
            occupancyValue = '17 / 25 Meja';
            occupancySub = '68% Rata-rata Kapasitas Semester';
            occupancyDelta = 'Stable';
            foodCostValue = '28.3%';
            foodCostSub = 'Rata-rata HPP Semester Ini';
            foodCostDelta = '-0.9%';
        } else {
            revenueValue = 589000000;
            revenueSub = '1 Tahun Terakhir (Real-time)';
            revenueDelta = '+13.1%';
            occupancyValue = '16 / 25 Meja';
            occupancySub = '64% Rata-rata Kapasitas Tahunan';
            occupancyDelta = 'Stable';
            foodCostValue = '28.8%';
            foodCostSub = 'Rata-rata HPP 12 Bulan';
            foodCostDelta = '-0.6%';
        }
    }

    const globalMetrics: Array<{
        label: string;
        value: string | number;
        sub: string;
        Icon: ElementType;
        tone: Tone;
        delta: string;
    }> = [
        {
            label: 'Total Pendapatan Global',
            value: formatRupiah(revenueValue),
            sub: revenueSub,
            Icon: DollarSign,
            tone: 'emerald',
            delta: revenueDelta,
        },
        {
            label: 'Okupansi & Rotasi Meja',
            value: occupancyValue,
            sub: occupancySub,
            Icon: Utensils,
            tone: 'emerald',
            delta: occupancyDelta,
        },
        {
            label: 'Consolidated Food Cost',
            value: foodCostValue,
            sub: foodCostSub,
            Icon: Package,
            tone: 'amber',
            delta: foodCostDelta,
        },
        {
            label: 'Kondisi Kesehatan Outlet',
            value: healthValue,
            sub: healthSub,
            Icon: Building2,
            tone: 'violet',
            delta: healthDelta,
        },
    ];

    const singleMetrics: Array<{
        label: string;
        value: string | number;
        sub: string;
        Icon: ElementType;
        tone: Tone;
        delta: string;
    }> = [
        {
            label: 'Total Penjualan Cabang',
            value: formatRupiah(revenueValue),
            sub: revenueSub,
            Icon: DollarSign,
            tone: 'emerald',
            delta: revenueDelta,
        },
        {
            label: 'Meja Aktif Cabang',
            value: occupancyValue,
            sub: occupancySub,
            Icon: Utensils,
            tone: 'emerald',
            delta: occupancyDelta,
        },
        {
            label: 'Food Cost Cabang',
            value: foodCostValue,
            sub: foodCostSub,
            Icon: Package,
            tone: 'amber',
            delta: foodCostDelta,
        },
        {
            label: 'Kehadiran Staff Cabang',
            value: healthValue,
            sub: healthSub,
            Icon: Users,
            tone: 'violet',
            delta: healthDelta,
        },
    ];

    const metrics = isGlobal ? globalMetrics : singleMetrics;

    const topOutlets = [
        {
            rank: 1,
            name: 'Kedai Nusantara - Sudirman',
            city: 'Jakarta Selatan',
            rev:
                timeframe === 'today'
                    ? 4200000
                    : timeframe === 'weekly'
                      ? 32500000
                      : timeframe === 'semester'
                        ? 820000000
                        : 1580000000,
            growth: '+18.2%',
            status: 'Sangat Baik',
        },
        {
            rank: 2,
            name: 'Pawon Salam - Bandung',
            city: 'Jakarta Selatan',
            rev:
                timeframe === 'today'
                    ? 3800000
                    : timeframe === 'weekly'
                      ? 28400000
                      : timeframe === 'semester'
                        ? 710000000
                        : 1390000000,
            growth: '+14.5%',
            status: 'Sangat Baik',
        },
        {
            rank: 3,
            name: 'Kedai Nusantara - PIK 2',
            city: 'Jakarta Utara',
            rev:
                timeframe === 'today'
                    ? 3100000
                    : timeframe === 'weekly'
                      ? 24100000
                      : timeframe === 'semester'
                        ? 640000000
                        : 1210000000,
            growth: '+11.0%',
            status: 'Stabil',
        },
    ];

    const alertOutlets = [
        { name: 'Cabang Kelapa Gading', issue: 'Lonjakan Void & Refund Abnormal (11.2% dari omset)', type: 'fraud' },
        { name: 'Cabang Depok Margonda', issue: 'Penurunan Omset Mingguan -18.4% (Cek promosi/staf)', type: 'revenue' },
    ];

    const products = [
        {
            name: 'Nasi Goreng Spesial',
            cat: 'Makanan',
            sold: isGlobal ? (timeframe === 'today' ? 412 : 3420) : timeframe === 'today' ? 28 : 312,
            rev: isGlobal ? (timeframe === 'today' ? 10300000 : 85500000) : timeframe === 'today' ? 700000 : 7800000,
        },
        {
            name: 'Ribeye Sambal Matah',
            cat: 'Main Course',
            sold: isGlobal ? (timeframe === 'today' ? 290 : 2810) : timeframe === 'today' ? 18 : 258,
            rev: isGlobal ? (timeframe === 'today' ? 14500000 : 140500000) : timeframe === 'today' ? 900000 : 12900000,
        },
        {
            name: 'Es Kopi Restoku',
            cat: 'Minuman',
            sold: isGlobal ? (timeframe === 'today' ? 580 : 4500) : timeframe === 'today' ? 34 : 204,
            rev: isGlobal ? (timeframe === 'today' ? 6960000 : 81000000) : timeframe === 'today' ? 408000 : 2448000,
        },
        {
            name: 'Sate Ayam Truffle',
            cat: 'Signature',
            sold: isGlobal ? (timeframe === 'today' ? 210 : 1820) : timeframe === 'today' ? 12 : 150,
            rev: isGlobal ? (timeframe === 'today' ? 10500000 : 91000000) : timeframe === 'today' ? 600000 : 7500000,
        },
    ];

    const timeframeLabels: Record<Timeframe, string> = {
        today: 'Hari Ini',
        weekly: 'Minggu Ini',
        semester: 'Per Semester',
        yearly: '1 Tahun',
    };

    return (
        <MainLayout>
            <Head title="Owner Dashboard & Analytics" />
            <Screen title="Owner Dashboard & Analytics">
                <div className="space-y-6">
                    {/* Top Mode Bar */}
                    <div
                        className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl gap-4 transition-all ${
                            isNanoBanana
                                ? 'bg-amber-500/10 border border-amber-500/30 shadow-[0_0_25px_rgba(234,179,8,0.15)]'
                                : 'bg-emerald-500/10 border border-emerald-500/20'
                        }`}
                    >
                        <div className="flex items-center gap-3.5">
                            <div
                                className={`grid size-11 place-items-center rounded-xl border ${isNanoBanana ? 'bg-amber-500/20 border-amber-500/40 text-amber-300' : 'bg-emerald-500/20 border-emerald-500/40 text-emerald-300'}`}
                            >
                                {isNanoBanana ? (
                                    <Sparkles className="size-5 animate-pulse" />
                                ) : (
                                    <Building2 className="size-5" />
                                )}
                            </div>
                            <div>
                                <h3
                                    className={`text-base font-bold flex items-center gap-2 ${isNanoBanana ? 'text-amber-300' : 'text-emerald-200'}`}
                                >
                                    {isGlobal ? 'Dasbor Konsolidasi Multi-Outlet' : 'Dasbor Analisis Cabang'}
                                    {isGlobal && (
                                        <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-mono">
                                            100 OUTLETS CONNECTED
                                        </span>
                                    )}
                                </h3>
                                <p className={`text-xs ${isNanoBanana ? 'text-amber-200/70' : 'text-emerald-300/70'}`}>
                                    {isGlobal
                                        ? 'Pemantauan real-time performa penjualan, tingkat okupansi meja, dan kontrol operasional di seluruh cabang.'
                                        : `Laporan detail metrik operasional, transaksi harian, dan analisis produk terlaris untuk ${selectedOutlet}.`}
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            <select
                                value={selectedOutlet}
                                onChange={(e) => setSelectedOutlet(e.target.value)}
                                className="bg-black/60 border border-white/20 rounded-xl px-4 py-2.5 text-sm font-semibold text-white focus:outline-none focus:border-amber-500 transition-all shadow-inner"
                            >
                                <option>Semua Outlet (Global)</option>
                                <option>Restoku Pusat (Jakarta)</option>
                                <option>Restoku Cabang (Bandung)</option>
                            </select>
                        </div>
                    </div>

                    {/* KPI Metrics */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
                        {metrics.map(({ label, value, sub, Icon, tone, delta }, idx) => (
                            <Glass className="p-5 flex flex-col justify-between border-white/10" hover key={label}>
                                <div>
                                    <div className="flex items-center justify-between mb-3">
                                        <div
                                            className={`grid size-10 place-items-center rounded-xl border ${toneMap[tone]} ${isNanoBanana && idx === 0 ? 'border-amber-500/40 bg-amber-500/15 text-amber-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]' : ''}`}
                                        >
                                            <Icon className="size-4.5" />
                                        </div>
                                        <span
                                            className={`font-semibold text-[11px] px-2.5 py-1 rounded-full ${delta.startsWith('+') || delta.includes('Normal') || delta.includes('mnt') || delta.includes('Stable') ? 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/30' : 'bg-amber-500/15 text-amber-400 border border-amber-500/30'}`}
                                        >
                                            {delta}
                                        </span>
                                    </div>
                                    <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                                        {label}
                                    </p>
                                    <div
                                        className={`text-2xl lg:text-3xl font-bold tracking-tight mt-1 ${
                                            isNanoBanana && idx === 0
                                                ? 'bg-gradient-to-r from-yellow-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent'
                                                : 'text-white'
                                        }`}
                                    >
                                        {value}
                                    </div>
                                </div>
                                <p className="mt-3 text-[11px] text-slate-500 border-t border-white/5 pt-2.5">{sub}</p>
                            </Glass>
                        ))}
                    </div>

                    {/* Revenue Chart + Peak Hours Grid */}
                    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                        <Glass className="p-6 lg:col-span-2 flex flex-col border-white/10" hover>
                            <div className="mb-4 flex flex-wrap justify-between items-center gap-3">
                                <div>
                                    <h2 className="text-base font-bold text-white flex items-center gap-2">
                                        {isNanoBanana ? (
                                            <Sparkles className="size-4 text-amber-400" />
                                        ) : (
                                            <BarChart3 className="size-4 text-emerald-400" />
                                        )}
                                        Tren Pendapatan & Volume Transaksi ({timeframeLabels[timeframe]})
                                    </h2>
                                    <p className="text-xs text-slate-400 mt-0.5">
                                        Klik pada titik data di bawah untuk melihat rincian omset & rata-rata transaksi.
                                    </p>
                                </div>

                                {/* Timeframe selector tabs */}
                                <div className="flex bg-black/40 border border-white/10 rounded-xl p-1 shrink-0">
                                    {(['today', 'weekly', 'semester', 'yearly'] as const).map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setTimeframe(t)}
                                            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                                                timeframe === t
                                                    ? isNanoBanana
                                                        ? 'bg-amber-500 text-black shadow-lg'
                                                        : 'bg-emerald-500 text-black shadow-lg'
                                                    : 'text-slate-400 hover:text-white'
                                            }`}
                                        >
                                            {timeframeLabels[t]}
                                        </button>
                                    ))}
                                </div>
                            </div>
                            <div className="flex-1 min-h-[260px]">
                                <RevenueChart
                                    isNanoBanana={isNanoBanana}
                                    mode={isGlobal ? 'global' : 'single'}
                                    timeframe={timeframe}
                                />
                            </div>
                        </Glass>

                        <Glass className="p-6 flex flex-col border-white/10 h-full justify-between" hover>
                            <div className="flex-1 overflow-y-auto pr-1 scrollbar-thin space-y-4">
                                <div>
                                    <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                                        <Clock className="size-4 text-blue-400" />
                                        Jam Ramai Order (Peak Hours)
                                    </h2>
                                    <p className="text-xs text-slate-400">
                                        Analisa trafik pemesanan berdasarkan jam operasional dapur & meja.
                                    </p>
                                </div>
                                <PeakOrderHours isNanoBanana={isNanoBanana} />
                            </div>
                        </Glass>
                    </div>

                    {/* Multi-Outlet Leaderboard & Fraud Radar (Only Visible when Global mode is on) */}
                    {isGlobal && (
                        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                            <Glass className="p-6 lg:col-span-2 border-white/10" hover>
                                <div className="flex justify-between items-center mb-4">
                                    <div>
                                        <h2 className="text-base font-bold text-white flex items-center gap-2">
                                            <Award className="size-4 text-amber-400" />
                                            Peringkat Kinerja Cabang Terbaik (Top Revenue Generators)
                                        </h2>
                                        <p className="text-xs text-slate-400">
                                            Cabang dengan kontribusi omset dan stabilitas operasional tertinggi pada
                                            periode ini.
                                        </p>
                                    </div>
                                    <span className="text-xs text-blue-400 font-semibold cursor-pointer hover:underline flex items-center gap-1">
                                        Lihat Semua 100 Cabang <ChevronRight className="size-3.5" />
                                    </span>
                                </div>
                                <div className="space-y-3">
                                    {topOutlets.map((o) => (
                                        <div
                                            key={o.rank}
                                            className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all"
                                        >
                                            <div className="flex items-center gap-3.5">
                                                <div
                                                    className={`size-8 rounded-lg flex items-center justify-center font-extrabold text-sm ${
                                                        o.rank === 1
                                                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_12px_rgba(234,179,8,0.25)]'
                                                            : 'bg-white/10 text-slate-300'
                                                    }`}
                                                >
                                                    #{o.rank}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-white">{o.name}</p>
                                                    <p className="text-xs text-slate-400">{o.city}</p>
                                                </div>
                                            </div>
                                            <div className="text-right">
                                                <p className="text-sm font-bold font-mono text-emerald-400">
                                                    {formatRupiah(o.rev)}
                                                </p>
                                                <p className="text-xs text-slate-400 flex items-center justify-end gap-1.5">
                                                    <span className="text-emerald-400 font-semibold">{o.growth}</span>{' '}
                                                    vs periode lalu
                                                </p>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                            </Glass>

                            <Glass className="p-6 border-red-500/30 bg-red-500/[0.03]" hover>
                                <div className="flex items-center gap-2 text-red-400 mb-2">
                                    <ShieldAlert className="size-5 animate-bounce" />
                                    <h2 className="text-base font-bold text-white">Radar Audit & Peringatan Cabang</h2>
                                </div>
                                <p className="text-xs text-slate-400 mb-4">
                                    Deteksi anomali finansial, lonjakan void, dan penurunan omset ekstrem di cabang.
                                </p>

                                <div className="space-y-3">
                                    {alertOutlets.map((a, i) => (
                                        <div
                                            key={i}
                                            className="p-3.5 rounded-xl bg-black/40 border border-red-500/30 space-y-1"
                                        >
                                            <div className="flex items-center justify-between">
                                                <span className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                                                    <AlertTriangle className="size-3.5 text-red-400" /> {a.name}
                                                </span>
                                                <Badge tone="red">
                                                    {a.type === 'fraud' ? 'AUDIT REQUIRED' : 'UNDERPERFORMING'}
                                                </Badge>
                                            </div>
                                            <p className="text-xs text-slate-300 pt-1 leading-relaxed">{a.issue}</p>
                                        </div>
                                    ))}
                                </div>
                            </Glass>
                        </div>
                    )}

                    {/* Produk Terlaris Table */}
                    <Glass className="p-6 border-white/10" hover>
                        <div className="flex justify-between items-center mb-4">
                            <div>
                                <h2 className="text-base font-bold text-white flex items-center gap-2">
                                    {isNanoBanana && <Sparkles className="size-4 text-amber-400" />}
                                    Produk Terlaris {isGlobal ? '(Akumulasi 100 Cabang)' : `(${selectedOutlet})`}
                                </h2>
                                <p className="text-xs text-slate-400">
                                    Kontributor pendapatan utama berdasarkan volume penjualan item.
                                </p>
                            </div>
                        </div>
                        <div className="grid grid-cols-[1.6fr_1fr_.8fr_1fr] border-b border-white/10 pb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
                            <span>Nama Produk</span>
                            <span>Kategori</span>
                            <span>Terjual</span>
                            <span>Total Pendapatan</span>
                        </div>
                        <div className="divide-y divide-white/5">
                            {products.map((p, i) => (
                                <div
                                    className="grid grid-cols-[1.6fr_1fr_.8fr_1fr] items-center py-3.5 text-sm hover:bg-white/[0.03] px-2 rounded-lg transition-colors group"
                                    key={p.name}
                                >
                                    <span className="flex items-center gap-3 text-slate-200 font-semibold">
                                        <span
                                            className={`size-8 rounded-lg border flex items-center justify-center text-xs font-bold ${
                                                isNanoBanana && i === 0
                                                    ? 'bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(234,179,8,0.2)]'
                                                    : 'bg-white/5 border-white/10 text-slate-400 group-hover:border-white/20'
                                            }`}
                                        >
                                            {i + 1}
                                        </span>
                                        {p.name}
                                    </span>
                                    <span className="text-slate-400">{p.cat}</span>
                                    <span className="font-mono font-semibold text-slate-300">
                                        {p.sold.toLocaleString('id-ID')} Porsi
                                    </span>
                                    <span
                                        className={`font-bold font-mono ${isNanoBanana ? 'text-amber-400' : 'text-emerald-400'}`}
                                    >
                                        {formatRupiah(p.rev)}
                                    </span>
                                </div>
                            ))}
                        </div>
                    </Glass>
                </div>
            </Screen>
        </MainLayout>
    );
}
