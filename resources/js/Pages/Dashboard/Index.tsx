import { useState, type ElementType } from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { Screen, Glass, Badge, formatRupiah, toneMap, type Tone, useTenantSettings } from '../../Components/Shared';
import { RevenueChart, type Timeframe } from '../../Components/Dashboard/RevenueChart';
import { PeakOrderHours } from '../../Components/Dashboard/PeakOrderHours';
import { TopModeBar } from '../../Components/Dashboard/TopModeBar';
import { KpiMetrics } from '../../Components/Dashboard/KpiMetrics';
import { OutletLeaderboard } from '../../Components/Dashboard/OutletLeaderboard';
import { TopProductsTable } from '../../Components/Dashboard/TopProductsTable';
import {
    DollarSignIcon,
    UtensilsIcon,
    PackageIcon,
    UsersIcon,
    SparklesIcon,
    ClockIcon,
    Building2Icon,
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
                    <TopModeBar
                        isNanoBanana={isNanoBanana}
                        isGlobal={isGlobal}
                        selectedOutlet={selectedOutlet}
                        onSelectOutlet={setSelectedOutlet}
                    />

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

                    {isGlobal && <OutletLeaderboard topOutlets={topOutlets} alertOutlets={alertOutlets} />}

                    <TopProductsTable
                        products={products}
                        isNanoBanana={isNanoBanana}
                        isGlobal={isGlobal}
                        selectedOutlet={selectedOutlet}
                    />
                </div>
            </Screen>
        </MainLayout>
    );
}
