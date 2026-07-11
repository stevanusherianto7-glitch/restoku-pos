import React from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { Glass, formatRupiah as formatRp } from '../../Components/Shared';
import {
    DollarSignIcon,
    TrendingUpIcon,
    UsersIcon,
    AwardIcon,
    AlertCircleIcon,
    PieChartIcon,
    ActivityIcon,
    WalletIcon,
    ReceiptIcon,
    ShoppingCartIcon,
} from '../../Components/icons';

interface Metrics {
    total_revenue: number;
    total_transactions: number;
    average_order_value: number;
    revenue_growth: string;
}

interface OutletPerformance {
    id: number;
    name: string;
    revenue: number;
    profit: number;
    food_cost_percentage: number;
}

interface MenuItem {
    name: string;
    qty_sold: number;
    revenue: number;
}

interface MenuPerformance {
    top_performers: MenuItem[];
    slow_movers: MenuItem[];
}

interface Props {
    metrics: Metrics;
    leaderboard: OutletPerformance[];
    menuPerformance: MenuPerformance;
}

export default function OwnerDashboard({ metrics, leaderboard, menuPerformance }: Props) {
    const kpis = [
        {
            label: 'Total Pendapatan',
            value: formatRp(metrics.total_revenue),
            icon: DollarSignIcon,
            trend: metrics.revenue_growth,
            color: 'text-amber-400',
            bg: 'bg-amber-400/10',
            border: 'border-amber-400/20',
        },
        {
            label: 'Total Transaksi',
            value: metrics.total_transactions.toString(),
            icon: ActivityIcon,
            trend: '+5.2%',
            color: 'text-blue-400',
            bg: 'bg-blue-400/10',
            border: 'border-blue-400/20',
        },
        {
            label: 'Rata-rata Order',
            value: formatRp(metrics.average_order_value),
            icon: PieChartIcon,
            trend: '+1.5%',
            color: 'text-emerald-400',
            bg: 'bg-emerald-400/10',
            border: 'border-emerald-400/20',
        },
        {
            label: 'Total Outlet Aktif',
            value: leaderboard.length.toString(),
            icon: UsersIcon,
            trend: 'Tetap',
            color: 'text-purple-400',
            bg: 'bg-purple-400/10',
            border: 'border-purple-400/20',
        },
    ];

    // Mock Data for Charts
    const dailyChart = [
        40, 60, 45, 80, 50, 90, 75, 40, 60, 45, 80, 50, 90, 75, 40, 60, 45, 80, 50, 90, 75, 40, 60, 45, 80, 50, 90, 75,
        100, 65,
    ];

    const paymentMethods = [
        { name: 'Tunai', percentage: 42, color: 'bg-emerald-400' },
        { name: 'QRIS', percentage: 28, color: 'bg-blue-400' },
        { name: 'GoPay', percentage: 18, color: 'bg-amber-400' },
        { name: 'Kartu Kredit', percentage: 12, color: 'bg-purple-400' },
    ];

    const categorySales = [
        { name: 'Makanan Utama', percentage: 58, color: 'bg-amber-500' },
        { name: 'Minuman', percentage: 32, color: 'bg-blue-500' },
        { name: 'Cemilan/Dessert', percentage: 10, color: 'bg-emerald-500' },
    ];

    const costVsRevenue = [
        { name: 'Revenue', percentage: 100, color: 'bg-emerald-400' },
        { name: 'Food Cost', percentage: 38, color: 'bg-red-400' },
        { name: 'Labor Cost', percentage: 28, color: 'bg-orange-400' },
        { name: 'Net Profit', percentage: 34, color: 'bg-blue-400' },
    ];

    const alerts = [
        { type: 'stok', msg: 'Stok Habis: Nasi Putih, Minyak Goreng', icon: AlertCircleIcon, color: 'text-red-400' },
        { type: 'kontrak', msg: 'Kontrak Habis (15 hari): Budi, Siti', icon: UsersIcon, color: 'text-amber-400' },
        { type: 'cuti', msg: 'Karyawan Cuti Hari Ini: 2 Orang', icon: UsersIcon, color: 'text-blue-400' },
    ];

    return (
        <MainLayout>
            <Head title="Owner Dashboard - Restoku" />

            <div className="flex justify-between items-center mb-8 animate-in fade-in slide-in-from-bottom-4 duration-700 ease-out">
                <div>
                    <h1 className="text-3xl font-extrabold tracking-tight text-white">Owner Dashboard</h1>
                    <p className="text-slate-400 mt-1">Ringkasan performa multi-outlet Anda secara real-time.</p>
                </div>
                <div className="flex gap-2">
                    <select className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-200 focus:border-blue-500/50 outline-none backdrop-blur-md transition-colors hover:bg-white/10">
                        <option value="today" className="bg-slate-900">
                            Hari Ini
                        </option>
                        <option value="week" className="bg-slate-900">
                            Minggu Ini
                        </option>
                        <option value="month" className="bg-slate-900">
                            Bulan Ini
                        </option>
                    </select>
                </div>
            </div>

            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {kpis.map((kpi, idx) => (
                    <Glass
                        key={idx}
                        className={`p-5 flex items-center gap-4 hover:-translate-y-1 hover:shadow-2xl transition-all duration-300 border-t-2 ${kpi.border}`}
                    >
                        <div className={`p-3 rounded-xl ${kpi.bg}`}>
                            <kpi.icon className={`size-6 ${kpi.color}`} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-400 mb-1">{kpi.label}</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-bold text-white">{kpi.value}</h3>
                                <span
                                    className={`text-xs font-semibold ${kpi.trend?.includes('-') ? 'text-red-400' : 'text-emerald-400'}`}
                                >
                                    {kpi.trend}
                                </span>
                            </div>
                        </div>
                    </Glass>
                ))}
            </div>

            {/* Grafik Omzet Harian */}
            <Glass className="p-6 mb-6">
                <div className="flex justify-between items-center mb-6">
                    <div>
                        <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                            <TrendingUpIcon className="size-5 text-blue-400" /> Grafik Omzet Harian
                        </h3>
                        <p className="text-sm text-slate-400 mt-1">Pergerakan omzet selama 30 hari terakhir.</p>
                    </div>
                    <div className="text-right">
                        <div className="text-2xl font-bold text-white">{formatRp(metrics.total_revenue)}</div>
                        <div className="text-sm text-emerald-400 font-medium">+12.3% vs bulan lalu</div>
                    </div>
                </div>

                <div className="h-48 w-full flex items-end gap-1.5 mt-4">
                    {dailyChart.map((val, i) => (
                        <div
                            key={i}
                            className="flex-1 bg-white/5 hover:bg-blue-500/30 transition-colors rounded-t-sm relative group cursor-pointer"
                            style={{ height: `${val}%` }}
                        >
                            <div className="absolute -top-10 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10 border border-white/10">
                                Tgl {i + 1}: {formatRp(val * 100000)}
                            </div>
                        </div>
                    ))}
                </div>
                <div className="flex justify-between text-xs text-slate-500 mt-2 px-1">
                    <span>1</span>
                    <span>15</span>
                    <span>30</span>
                </div>
            </Glass>

            {/* 3 Column Grid: Pembayaran, Kategori, Alert/Cost */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Metode Pembayaran */}
                <Glass className="p-6">
                    <h3 className="text-sm font-semibold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                        <WalletIcon className="size-4 text-emerald-400" /> Metode Pembayaran
                    </h3>
                    <div className="space-y-4">
                        {paymentMethods.map((pm, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-300">{pm.name}</span>
                                    <span className="text-white font-medium">{pm.percentage}%</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${pm.color} rounded-full`}
                                        style={{ width: `${pm.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Glass>

                {/* Penjualan Kategori */}
                <Glass className="p-6">
                    <h3 className="text-sm font-semibold text-white mb-6 uppercase tracking-wider flex items-center gap-2">
                        <ShoppingCartIcon className="size-4 text-amber-400" /> Penjualan per Kategori
                    </h3>
                    <div className="space-y-4">
                        {categorySales.map((cat, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-300">{cat.name}</span>
                                    <span className="text-white font-medium">{cat.percentage}%</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className={`h-full ${cat.color} rounded-full`}
                                        style={{ width: `${cat.percentage}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                    </div>
                </Glass>

                {/* Biaya vs Revenue & Alerts */}
                <div className="space-y-6 flex flex-col">
                    <Glass className="p-5 flex-1">
                        <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                            <ReceiptIcon className="size-4 text-red-400" /> Biaya vs Revenue
                        </h3>
                        <div className="space-y-3">
                            {costVsRevenue.map((item, i) => (
                                <div key={i} className="flex items-center gap-3">
                                    <div className="w-24 text-xs text-slate-400 truncate">{item.name}</div>
                                    <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden relative">
                                        <div
                                            className={`h-full ${item.color} rounded-full`}
                                            style={{ width: `${item.percentage}%` }}
                                        />
                                    </div>
                                    <div className="w-10 text-right text-xs text-white font-medium">
                                        {item.percentage}%
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Glass>

                    <Glass className="p-5">
                        <h3 className="text-sm font-semibold text-white mb-3 uppercase tracking-wider flex items-center gap-2">
                            <AlertCircleIcon className="size-4 text-red-400" /> Peringatan
                        </h3>
                        <div className="space-y-2">
                            {alerts.map((alert, i) => (
                                <div key={i} className="flex gap-2 items-start text-sm">
                                    <alert.icon className={`size-4 shrink-0 mt-0.5 ${alert.color}`} />
                                    <span className="text-slate-300">{alert.msg}</span>
                                </div>
                            ))}
                        </div>
                    </Glass>
                </div>
            </div>

            {/* Leaderboard & Menu Performance */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Leaderboard Outlet */}
                <Glass className="p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-6">
                        <div>
                            <h3 className="text-lg font-semibold text-white flex items-center gap-2">
                                <AwardIcon className="size-5 text-amber-400" /> Leaderboard Outlet
                            </h3>
                            <p className="text-sm text-slate-400 mt-1">Peringkat cabang berdasarkan pendapatan.</p>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-left text-sm">
                            <thead>
                                <tr className="border-b border-white/10 text-slate-400">
                                    <th className="pb-3 font-medium">Outlet</th>
                                    <th className="pb-3 font-medium">Omset</th>
                                    <th className="pb-3 font-medium">Food Cost</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-white/5">
                                {leaderboard.map((outlet, index) => (
                                    <tr key={outlet.id} className="group hover:bg-white/[0.02] transition-colors">
                                        <td className="py-4 font-medium text-white flex items-center gap-2">
                                            {index === 0 && <span className="text-amber-400">👑</span>}
                                            {outlet.name}
                                        </td>
                                        <td className="py-4 text-emerald-400 font-medium">
                                            {formatRp(outlet.revenue)}
                                        </td>
                                        <td className="py-4">
                                            <span
                                                className={`inline-flex px-2 py-1 rounded-md text-xs font-medium border ${
                                                    outlet.food_cost_percentage <= 35
                                                        ? 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20'
                                                        : outlet.food_cost_percentage <= 45
                                                          ? 'bg-amber-500/10 text-amber-400 border-amber-500/20'
                                                          : 'bg-red-500/10 text-red-400 border-red-500/20'
                                                }`}
                                            >
                                                {outlet.food_cost_percentage}%
                                            </span>
                                        </td>
                                    </tr>
                                ))}
                                {leaderboard.length === 0 && (
                                    <tr>
                                        <td colSpan={3} className="py-8 text-center text-slate-500">
                                            Belum ada data outlet.
                                        </td>
                                    </tr>
                                )}
                            </tbody>
                        </table>
                    </div>
                </Glass>

                {/* Top Performers */}
                <Glass className="p-6">
                    <h3 className="text-lg font-semibold text-white mb-1 flex items-center gap-2">
                        <TrendingUpIcon className="size-5 text-emerald-400" /> Menu Terlaris
                    </h3>
                    <p className="text-sm text-slate-400 mb-6">Menu dengan pendapatan tertinggi bulan ini.</p>
                    <div className="space-y-4">
                        {menuPerformance.top_performers.map((item, i) => (
                            <div
                                key={i}
                                className="flex justify-between items-center group p-3 rounded-xl hover:bg-white/5 transition-colors border border-transparent hover:border-white/10"
                            >
                                <div className="flex items-center gap-3">
                                    <div className="size-8 rounded-full bg-emerald-500/10 text-emerald-400 font-bold flex items-center justify-center text-xs">
                                        #{i + 1}
                                    </div>
                                    <div>
                                        <p className="font-medium text-slate-200 group-hover:text-white transition-colors">
                                            {item.name}
                                        </p>
                                        <p className="text-xs text-slate-500">{item.qty_sold} porsi terjual</p>
                                    </div>
                                </div>
                                <div className="text-right font-semibold text-emerald-400">
                                    {formatRp(item.revenue)}
                                </div>
                            </div>
                        ))}
                    </div>
                </Glass>
            </div>
        </MainLayout>
    );
}
