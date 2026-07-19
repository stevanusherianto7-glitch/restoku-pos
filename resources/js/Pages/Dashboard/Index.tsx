import { useState, type ElementType } from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { Screen, Glass, Badge, formatRupiah, toneMap, type Tone, useTenantSettings } from '../../Components/Shared';
import { RevenueChart, type Timeframe } from '../../Components/Dashboard/RevenueChart';
import { PeakOrderHours } from '../../Components/Dashboard/PeakOrderHours';
import {
    DollarSignIcon,
    UtensilsIcon,
    PackageIcon,
    UsersIcon,
    SparklesIcon,
    ClockIcon,
    AlertTriangleIcon,
    Building2Icon,
    ChevronRightIcon,
    AwardIcon,
    ShieldAlertIcon,
    BarChart3Icon,
} from '../../Components/icons';

// ─── Main Owner Dashboard ──────────────────────────────────────────────────────
export default function Dashboard() {
    const { screenMode } = useTenantSettings();
    const isNanoBanana = screenMode === 'nano-banana';
    const [selectedOutlet, setSelectedOutlet] = useState('Semua Outlet (Global)');
    const [timeframe, setTimeframe] = useState<Timeframe>('weekly');

    const isGlobal = selectedOutlet === 'Semua Outlet (Global)';

    // Dynamic values based on timeframe and mode (assigned in all branches below)
    let revenueValue: number;
    let revenueSub: string;
    let revenueDelta: string;

    let occupancyValue: string;
    let occupancySub: string;
    let occupancyDelta: string;

    let foodCostValue: string;
    let foodCostSub: string;
    let foodCostDelta: string;

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
            Icon: DollarSignIcon,
            tone: 'emerald',
            delta: revenueDelta,
        },
        {
            label: 'Okupansi & Rotasi Meja',
            value: occupancyValue,
            sub: occupancySub,
            Icon: UtensilsIcon,
            tone: 'emerald',
            delta: occupancyDelta,
        },
        {
            label: 'Consolidated Food Cost',
            value: foodCostValue,
            sub: foodCostSub,
            Icon: PackageIcon,
            tone: 'amber',
            delta: foodCostDelta,
        },
        {
            label: 'Kondisi Kesehatan Outlet',
            value: healthValue,
            sub: healthSub,
            Icon: Building2Icon,
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
            Icon: DollarSignIcon,
            tone: 'emerald',
            delta: revenueDelta,
        },
        {
            label: 'Meja Aktif Cabang',
            value: occupancyValue,
            sub: occupancySub,
            Icon: UtensilsIcon,
            tone: 'emerald',
            delta: occupancyDelta,
        },
        {
            label: 'Food Cost Cabang',
            value: foodCostValue,
            sub: foodCostSub,
            Icon: PackageIcon,
            tone: 'amber',
            delta: foodCostDelta,
        },
        {
            label: 'Kehadiran Staff Cabang',
            value: healthValue,
            sub: healthSub,
            Icon: UsersIcon,
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
                                    <SparklesIcon className="size-5 animate-pulse" />
                                ) : (
                                    <Building2Icon className="size-5" />
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
                                            <SparklesIcon className="size-4 text-amber-400" />
                                        ) : (
                                            <BarChart3Icon className="size-4 text-emerald-400" />
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
                                        <ClockIcon className="size-4 text-blue-400" />
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
                                            <AwardIcon className="size-4 text-amber-400" />
                                            Peringkat Kinerja Cabang Terbaik (Top Revenue Generators)
                                        </h2>
                                        <p className="text-xs text-slate-400">
                                            Cabang dengan kontribusi omset dan stabilitas operasional tertinggi pada
                                            periode ini.
                                        </p>
                                    </div>
                                    <span className="text-xs text-blue-400 font-semibold cursor-pointer hover:underline flex items-center gap-1">
                                        Lihat Semua 100 Cabang <ChevronRightIcon className="size-3.5" />
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
                                    <ShieldAlertIcon className="size-5 animate-bounce" />
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
                                                    <AlertTriangleIcon className="size-3.5 text-red-400" /> {a.name}
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
                                    {isNanoBanana && <SparklesIcon className="size-4 text-amber-400" />}
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
