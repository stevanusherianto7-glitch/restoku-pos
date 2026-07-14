import React from 'react';
import { Head, router } from '@inertiajs/react';
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

interface ProfitMetrics {
    gross_profit: number;
    net_profit: number;
    operational_expenses: number;
    gross_margin_pct: number;
    is_estimate?: boolean;
}

interface PeakBucket {
    hour?: string;
    day?: string;
    orders: number;
}

interface TopProduct {
    name: string;
    qty_sold: number;
    revenue: number;
    progress: number;
}

interface TransactionType {
    type: string;
    count: number;
    percentage: number;
}

interface StockAlert {
    name: string;
    type: string;
    detail: string;
    severity: string;
}

interface ShiftPerformance {
    open_shifts: number;
    closed_shifts: number;
    active_cashiers: string[];
    total_transactions_today: number;
    is_stub?: boolean;
}

interface Props {
    metrics: Metrics;
    leaderboard: OutletPerformance[];
    menuPerformance: MenuPerformance;
    profitMetrics?: ProfitMetrics;
    peakHours?: PeakBucket[];
    peakDays?: PeakBucket[];
    topProducts?: TopProduct[];
    transactionTypes?: TransactionType[];
    stockAlerts?: StockAlert[];
    shiftPerformance?: ShiftPerformance;
    filters?: { date_range?: string };
}

const DATE_RANGES = [
    { value: 'today', label: 'Hari Ini' },
    { value: 'week', label: 'Minggu Ini' },
    { value: 'month', label: 'Bulan Ini' },
    { value: 'year', label: 'Tahun Ini' },
];

export default function OwnerDashboard({
    metrics,
    leaderboard,
    menuPerformance,
    profitMetrics,
    peakHours = [],
    peakDays = [],
    topProducts = [],
    transactionTypes = [],
    stockAlerts = [],
    shiftPerformance,
    filters,
}: Props) {
    const [range, setRange] = React.useState<string>(filters?.date_range ?? 'today');

    const onRangeChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
        const next = e.target.value;
        setRange(next);
        router.reload({
            only: [
                'metrics',
                'leaderboard',
                'menuPerformance',
                'profitMetrics',
                'peakHours',
                'peakDays',
                'topProducts',
                'transactionTypes',
                'stockAlerts',
                'shiftPerformance',
            ],
            data: { date_range: next },
            preserveScroll: true,
        });
    };

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

    // [L1] Row KPI baru — Laba Kotor / Bersih / Margin / Biaya Ops.
    const profitKpis = profitMetrics
        ? [
              {
                  label: 'Laba Kotor',
                  value: formatRp(profitMetrics.gross_profit),
                  icon: WalletIcon,
                  trend: '+12.3%',
                  color: 'text-emerald-400',
                  bg: 'bg-emerald-400/10',
                  border: 'border-emerald-400/20',
              },
              {
                  label: 'Laba Bersih',
                  value: formatRp(profitMetrics.net_profit),
                  icon: DollarSignIcon,
                  trend: '+9.8%',
                  color: 'text-blue-400',
                  bg: 'bg-blue-400/10',
                  border: 'border-blue-400/20',
              },
              {
                  label: 'Margin Kotor',
                  value: `${profitMetrics.gross_margin_pct}%`,
                  icon: TrendingUpIcon,
                  trend: 'Stabil',
                  color: 'text-amber-400',
                  bg: 'bg-amber-400/10',
                  border: 'border-amber-400/20',
              },
              {
                  label: 'Biaya Operasional',
                  value: formatRp(profitMetrics.operational_expenses),
                  icon: ReceiptIcon,
                  trend: '-3.1%',
                  color: 'text-red-400',
                  bg: 'bg-red-400/10',
                  border: 'border-red-400/20',
              },
          ]
        : [];

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
                    <select
                        value={range}
                        onChange={onRangeChange}
                        className="bg-white/5 border border-white/10 rounded-xl px-4 py-2.5 text-sm font-medium text-slate-200 focus:border-blue-500/50 outline-none backdrop-blur-md transition-colors hover:bg-white/10"
                    >
                        {DATE_RANGES.map((r) => (
                            <option key={r.value} value={r.value} className="bg-slate-900">
                                {r.label}
                            </option>
                        ))}
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

            {/* KPI Cards - Laba & Margin (L1) */}
            {profitKpis.length > 0 && (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                    {profitKpis.map((kpi, idx) => (
                        <Glass
                            key={`profit-${idx}`}
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
                                        className={`text-xs font-semibold ${kpi.trend?.includes('-') ? 'text-emerald-400' : 'text-emerald-400'}`}
                                    >
                                        {kpi.trend}
                                    </span>
                                </div>
                            </div>
                        </Glass>
                    ))}
                </div>
            )}

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

            {/* [L1] Widget Row: Jam Ramai, Hari Ramai, Tipe Transaksi */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Jam Ramai */}
                <Glass className="p-6">
                    <h3 className="text-sm font-semibold text-white mb-1 uppercase tracking-wider flex items-center gap-2">
                        <ActivityIcon className="size-4 text-blue-400" /> Jam Ramai
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">Distribusi order per jam (06:00–22:00).</p>
                    <div className="flex items-end gap-1 h-40 overflow-x-auto">
                        {peakHours.map((b, i) => {
                            const max = Math.max(1, ...peakHours.map((x) => x.orders));
                            const pct = (b.orders / max) * 100;
                            return (
                                <div
                                    key={i}
                                    className="flex-1 flex flex-col items-center justify-end gap-1 min-w-[14px]"
                                >
                                    <span className="text-[9px] text-slate-500">{b.orders}</span>
                                    <div
                                        className="w-full bg-gradient-to-t from-blue-600/40 to-blue-400/80 rounded-t-sm group relative"
                                        style={{ height: `${Math.max(pct, 3)}%` }}
                                    >
                                        <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] px-2 py-1 rounded opacity-0 group-hover:opacity-100 transition-opacity whitespace-nowrap z-10 border border-white/10">
                                            {b.hour}: {b.orders} order
                                        </div>
                                    </div>
                                    {i % 3 === 0 && (
                                        <span className="text-[8px] text-slate-600">{b.hour?.slice(0, 2)}</span>
                                    )}
                                </div>
                            );
                        })}
                    </div>
                </Glass>

                {/* Hari Ramai */}
                <Glass className="p-6">
                    <h3 className="text-sm font-semibold text-white mb-1 uppercase tracking-wider flex items-center gap-2">
                        <TrendingUpIcon className="size-4 text-emerald-400" /> Hari Ramai
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">Order per hari dalam seminggu.</p>
                    <div className="space-y-2">
                        {peakDays.map((d, i) => {
                            const max = Math.max(1, ...peakDays.map((x) => x.orders));
                            const pct = (d.orders / max) * 100;
                            return (
                                <div key={i} className="flex items-center gap-2">
                                    <div className="w-12 text-xs text-slate-400">{d.day}</div>
                                    <div className="flex-1 h-3 bg-white/5 rounded-full overflow-hidden">
                                        <div
                                            className="h-full bg-emerald-400/80 rounded-full"
                                            style={{ width: `${pct}%` }}
                                        />
                                    </div>
                                    <div className="w-8 text-right text-xs text-white font-medium">{d.orders}</div>
                                </div>
                            );
                        })}
                    </div>
                </Glass>

                {/* Tipe Transaksi */}
                <Glass className="p-6">
                    <h3 className="text-sm font-semibold text-white mb-1 uppercase tracking-wider flex items-center gap-2">
                        <PieChartIcon className="size-4 text-amber-400" /> Tipe Transaksi
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">Dine-In / Take Away / Delivery.</p>
                    <div className="space-y-4">
                        {transactionTypes
                            .filter((t) => !('is_stub' in t))
                            .map((t, i) => {
                                const colors = ['bg-emerald-400', 'bg-blue-400', 'bg-purple-400'];
                                return (
                                    <div key={i}>
                                        <div className="flex justify-between text-sm mb-1">
                                            <span className="text-slate-300">{t.type}</span>
                                            <span className="text-white font-medium">{t.percentage}%</span>
                                        </div>
                                        <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                            <div
                                                className={`h-full ${colors[i % 3]}`}
                                                style={{ width: `${t.percentage}%` }}
                                            />
                                        </div>
                                    </div>
                                );
                            })}
                        {transactionTypes.some((t) => 'is_stub' in t) && (
                            <p className="text-[10px] text-slate-500 italic">* Estimasi (belum ada kolom order_type)</p>
                        )}
                    </div>
                </Glass>
            </div>

            {/* [L1] Widget Row: Best Seller, Alert Stok, Performa Shift */}
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-6">
                {/* Best Seller */}
                <Glass className="p-6">
                    <h3 className="text-sm font-semibold text-white mb-1 uppercase tracking-wider flex items-center gap-2">
                        <AwardIcon className="size-4 text-amber-400" /> Best Seller (Top 10)
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">Produk terlaris periode ini.</p>
                    <div className="space-y-3">
                        {topProducts.slice(0, 5).map((p, i) => (
                            <div key={i}>
                                <div className="flex justify-between text-sm mb-1">
                                    <span className="text-slate-300 truncate">
                                        {i + 1}. {p.name}
                                    </span>
                                    <span className="text-white font-medium ml-2">{p.qty_sold}x</span>
                                </div>
                                <div className="h-2 w-full bg-white/5 rounded-full overflow-hidden">
                                    <div
                                        className="h-full bg-amber-400/80 rounded-full"
                                        style={{ width: `${p.progress}%` }}
                                    />
                                </div>
                            </div>
                        ))}
                        {topProducts.length === 0 && (
                            <p className="text-xs text-slate-500">Belum ada data penjualan.</p>
                        )}
                    </div>
                </Glass>

                {/* Alert Stok */}
                <Glass className="p-6">
                    <h3 className="text-sm font-semibold text-white mb-1 uppercase tracking-wider flex items-center gap-2">
                        <AlertCircleIcon className="size-4 text-red-400" /> Alert Stok Kritis
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">Bahan baku hampir habis / expired.</p>
                    <div className="space-y-2">
                        {stockAlerts.map((a, i) => {
                            const sev =
                                a.severity === 'high'
                                    ? 'text-red-400'
                                    : a.severity === 'medium'
                                      ? 'text-amber-400'
                                      : 'text-blue-400';
                            return (
                                <div key={i} className="flex gap-2 items-start text-sm">
                                    <AlertCircleIcon className={`size-4 shrink-0 mt-0.5 ${sev}`} />
                                    <div>
                                        <span className="text-slate-200 font-medium">{a.name}</span>
                                        <span className="text-slate-500 text-xs block">{a.detail}</span>
                                    </div>
                                </div>
                            );
                        })}
                        {stockAlerts.length === 0 && <p className="text-xs text-slate-500">Stok aman.</p>}
                    </div>
                </Glass>

                {/* Performa Shift */}
                <Glass className="p-6">
                    <h3 className="text-sm font-semibold text-white mb-1 uppercase tracking-wider flex items-center gap-2">
                        <UsersIcon className="size-4 text-purple-400" /> Performa Shift
                    </h3>
                    <p className="text-xs text-slate-400 mb-4">Ringkasan sesi kasir hari ini.</p>
                    {shiftPerformance && (
                        <div className="space-y-3">
                            <div className="grid grid-cols-2 gap-3">
                                <div className="bg-white/5 rounded-xl p-3">
                                    <div className="text-2xl font-bold text-emerald-400">
                                        {shiftPerformance.open_shifts}
                                    </div>
                                    <div className="text-xs text-slate-400">Sesi Buka</div>
                                </div>
                                <div className="bg-white/5 rounded-xl p-3">
                                    <div className="text-2xl font-bold text-slate-200">
                                        {shiftPerformance.closed_shifts}
                                    </div>
                                    <div className="text-xs text-slate-400">Sesi Tutup</div>
                                </div>
                            </div>
                            <div>
                                <div className="text-xs text-slate-400 mb-1">Kasir Aktif</div>
                                <div className="flex flex-wrap gap-1">
                                    {shiftPerformance.active_cashiers.map((c, i) => (
                                        <span
                                            key={i}
                                            className="text-xs bg-purple-400/10 text-purple-300 px-2 py-1 rounded-md border border-purple-400/20"
                                        >
                                            {c}
                                        </span>
                                    ))}
                                </div>
                            </div>
                            {shiftPerformance.is_stub && (
                                <p className="text-[10px] text-slate-500 italic">
                                    * Data stub (tabel cashier_sessions belum ada)
                                </p>
                            )}
                        </div>
                    )}
                </Glass>
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
