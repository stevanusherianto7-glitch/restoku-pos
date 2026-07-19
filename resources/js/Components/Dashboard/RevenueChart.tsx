import { useState } from 'react';
import { Screen, Glass, formatRupiah } from '../../Components/Shared';
import { CalendarIcon } from '../../Components/icons';

export type Timeframe = 'today' | 'weekly' | 'semester' | 'yearly';

export function RevenueChart({
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

    const activePointIdx = activeIdx !== null && activeIdx < data.length ? activeIdx : Math.floor(data.length / 2);
    const activePoint = data[activePointIdx];

    const paddingX = 60;
    const chartWidth = 620;
    const xPositions = data.map((_, i) => paddingX + (i * chartWidth) / (data.length - 1));

    const pts = data.map((d, i) => `${xPositions[i]},${d.y}`).join(' ');

    let grids: Array<{ y: number; label: string }>;
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
            <div
                className={`flex flex-wrap items-center justify-between px-3 py-2 rounded-xl mb-3 text-xs border ${
                    isNanoBanana
                        ? 'bg-amber-500/10 border-amber-500/30 text-amber-200'
                        : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-200'
                }`}
            >
                <div className="flex items-center gap-2">
                    <CalendarIcon className="size-3.5 text-amber-400" />
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

                    {data.map((d, i) => {
                        const x = xPositions[i];
                        const isSelected = activePointIdx === i;
                        return (
                            <g key={i} className="cursor-pointer group/point" onClick={() => setActiveIdx(i)}>
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
                                <circle
                                    cx={x}
                                    cy={d.y}
                                    r={isSelected ? '6' : '4'}
                                    fill={isSelected ? (isNanoBanana ? '#FACC15' : '#10B981') : '#09090b'}
                                    stroke={isNanoBanana ? '#FACC15' : '#3B82F6'}
                                    strokeWidth={isSelected ? '3' : '2'}
                                    className="transition-all duration-200"
                                />
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
