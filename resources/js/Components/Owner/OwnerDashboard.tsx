import { Screen, Glass, formatRupiah as formatRp } from '../Shared';
import {
    TrendingUp,
    Users,
    DollarSign,
    PieChart,
    AlertCircle,
    CalendarClock,
    CreditCard,
    Activity,
} from 'lucide-react';

export function OwnerDashboard() {
    const kpis = [
        {
            label: 'Omzet Bulan Ini',
            value: 'Rp 45,8jt',
            icon: DollarSign,
            trend: '+12.3%',
            color: 'text-amber-400',
            bg: 'bg-amber-400/10',
        },
        {
            label: 'Total Pesanan',
            value: '1.250',
            icon: Activity,
            trend: '+8.7%',
            color: 'text-blue-400',
            bg: 'bg-blue-400/10',
        },
        {
            label: 'Rata-rata Order',
            value: 'Rp 36.650',
            icon: PieChart,
            trend: '+3.2%',
            color: 'text-emerald-400',
            bg: 'bg-emerald-400/10',
        },
        {
            label: 'Okupansi Meja',
            value: '68%',
            icon: Users,
            trend: '+2.0%',
            color: 'text-purple-400',
            bg: 'bg-purple-400/10',
        },
    ];

    // Mock data for the chart (30 days)
    const chartData = [
        30, 45, 60, 40, 50, 70, 85, 90, 75, 60, 55, 65, 80, 95, 100, 85, 70, 60, 50, 45, 65, 75, 90, 110, 120, 100, 80,
        70, 60, 85,
    ];
    const maxVal = Math.max(...chartData);

    return (
        <Screen title="Pantau Bisnis">
            {/* KPI Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
                {kpis.map((kpi, idx) => (
                    <Glass key={idx} className="p-5 flex items-center gap-4">
                        <div className={`p-3 rounded-xl ${kpi.bg}`}>
                            <kpi.icon className={`size-6 ${kpi.color}`} />
                        </div>
                        <div>
                            <p className="text-sm font-medium text-slate-400 mb-1">{kpi.label}</p>
                            <div className="flex items-baseline gap-2">
                                <h3 className="text-2xl font-bold text-white">{kpi.value}</h3>
                                <span className="text-xs font-semibold text-emerald-400">{kpi.trend}</span>
                            </div>
                        </div>
                    </Glass>
                ))}
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                {/* Main Chart */}
                <Glass className="lg:col-span-2 p-6 flex flex-col">
                    <div className="flex justify-between items-center mb-8">
                        <div>
                            <h3 className="text-lg font-semibold text-white">Grafik Omzet Harian</h3>
                            <p className="text-sm text-slate-400">Juli 2026</p>
                        </div>
                        <div className="text-right">
                            <div className="text-2xl font-bold text-amber-400">{formatRp(45823500)}</div>
                            <div className="text-sm text-emerald-400 font-medium flex items-center gap-1 justify-end">
                                <TrendingUp className="size-3" /> +12.3% vs bln lalu
                            </div>
                        </div>
                    </div>

                    {/* Simple CSS Bar Chart */}
                    <div className="flex-1 flex items-end gap-1 sm:gap-2 h-48 mt-auto pt-4 border-b border-white/10">
                        {chartData.map((val, idx) => (
                            <div key={idx} className="flex-1 flex flex-col items-center justify-end h-full group">
                                <div
                                    className="w-full bg-amber-500/80 hover:bg-amber-400 rounded-t-sm transition-all relative"
                                    style={{ height: `${(val / maxVal) * 100}%` }}
                                >
                                    <div className="absolute -top-8 left-1/2 -translate-x-1/2 bg-black/80 text-white text-[10px] py-1 px-2 rounded opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none whitespace-nowrap z-10">
                                        {formatRp(val * 20000)}
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                    <div className="flex justify-between mt-2 text-xs text-slate-500">
                        <span>1 Jul</span>
                        <span>15 Jul</span>
                        <span>30 Jul</span>
                    </div>
                </Glass>

                {/* Side Panels */}
                <div className="space-y-6">
                    {/* Breakdown */}
                    <Glass className="p-5">
                        <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                            <CreditCard className="size-4 text-amber-500" /> Metode Pembayaran
                        </h3>
                        <div className="space-y-4">
                            {[
                                { name: 'Tunai', pct: 42, color: 'bg-blue-500' },
                                { name: 'QRIS', pct: 28, color: 'bg-emerald-500' },
                                { name: 'GoPay', pct: 18, color: 'bg-purple-500' },
                                { name: 'Kartu', pct: 12, color: 'bg-amber-500' },
                            ].map((item) => (
                                <div key={item.name}>
                                    <div className="flex justify-between text-sm mb-1">
                                        <span className="text-slate-300">{item.name}</span>
                                        <span className="text-white font-medium">{item.pct}%</span>
                                    </div>
                                    <div className="w-full h-2 rounded-full bg-white/5">
                                        <div
                                            className={`h-full rounded-full ${item.color}`}
                                            style={{ width: `${item.pct}%` }}
                                        />
                                    </div>
                                </div>
                            ))}
                        </div>
                    </Glass>

                    {/* Alerts */}
                    <Glass className="p-5">
                        <h3 className="text-sm font-semibold text-white mb-4 uppercase tracking-wider flex items-center gap-2">
                            <AlertCircle className="size-4 text-red-400" /> Perhatian Khusus
                        </h3>
                        <div className="space-y-3">
                            <div className="p-3 rounded-lg bg-red-500/10 border border-red-500/20 flex gap-3 items-start">
                                <AlertCircle className="size-4 text-red-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-red-200">Stok Habis</p>
                                    <p className="text-xs text-red-300/70 mt-0.5">
                                        Nasi Putih, Daging Ayam (3 menu terpengaruh)
                                    </p>
                                </div>
                            </div>
                            <div className="p-3 rounded-lg bg-amber-500/10 border border-amber-500/20 flex gap-3 items-start">
                                <CalendarClock className="size-4 text-amber-400 shrink-0 mt-0.5" />
                                <div>
                                    <p className="text-sm font-medium text-amber-200">Kontrak Hampir Habis</p>
                                    <p className="text-xs text-amber-300/70 mt-0.5">2 karyawan (Sisa 15 hari)</p>
                                </div>
                            </div>
                        </div>
                    </Glass>
                </div>
            </div>
        </Screen>
    );
}
