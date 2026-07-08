import { useState, type ElementType } from "react";
import { Head } from "@inertiajs/react";
import MainLayout from "../../Layouts/MainLayout";
import { Screen, Glass, Badge, formatRupiah, toneMap, type Tone, useTenantSettings } from "../../Components/Shared";
import { DollarSign, Utensils, Package, Users, Sparkles, Clock, TrendingUp, AlertTriangle, Building2, ChevronRight, Award, ShieldAlert, BarChart3, Calendar } from "lucide-react";

// ─── Interactive Revenue Chart with Dates & Hover ──────────────────────────────
function RevenueChart({ isNanoBanana = false, mode = "global" }: { isNanoBanana?: boolean; mode: string }) {
  const [activeIdx, setActiveIdx] = useState<number | null>(2); // Default to Wednesday 10 Juli

  const globalData = [
    { day: "Sen", date: "08 Jul", fullDate: "Senin, 8 Juli 2026", value: 22400000, orders: 320, avgTicket: 70000, y: 160 },
    { day: "Sel", date: "09 Jul", fullDate: "Selasa, 9 Juli 2026", value: 25100000, orders: 364, avgTicket: 68956, y: 135 },
    { day: "Rab", date: "10 Jul", fullDate: "Rabu, 10 Juli 2026", value: 28500000, orders: 412, avgTicket: 69174, y: 105 },
    { day: "Kam", date: "11 Jul", fullDate: "Kamis, 11 Juli 2026", value: 26800000, orders: 390, avgTicket: 68717, y: 120 },
    { day: "Jum", date: "12 Jul", fullDate: "Jumat, 12 Juli 2026", value: 31200000, orders: 450, avgTicket: 69333, y: 80 },
    { day: "Sab", date: "13 Jul", fullDate: "Sabtu, 13 Juli 2026", value: 36500000, orders: 520, avgTicket: 70192, y: 35 },
    { day: "Min", date: "14 Jul", fullDate: "Minggu, 14 Juli 2026", value: 34000000, orders: 485, avgTicket: 70103, y: 55 },
  ];

  const singleData = [
    { day: "Sen", date: "08 Jul", fullDate: "Senin, 8 Juli 2026", value: 1450000, orders: 42, avgTicket: 34523, y: 165 },
    { day: "Sel", date: "09 Jul", fullDate: "Selasa, 9 Juli 2026", value: 1680000, orders: 48, avgTicket: 35000, y: 140 },
    { day: "Rab", date: "10 Jul", fullDate: "Rabu, 10 Juli 2026", value: 1850000, orders: 55, avgTicket: 33636, y: 120 },
    { day: "Kam", date: "11 Jul", fullDate: "Kamis, 11 Juli 2026", value: 1720000, orders: 50, avgTicket: 34400, y: 132 },
    { day: "Jum", date: "12 Jul", fullDate: "Jumat, 12 Juli 2026", value: 2150000, orders: 62, avgTicket: 34677, y: 90 },
    { day: "Sab", date: "13 Jul", fullDate: "Sabtu, 13 Juli 2026", value: 2650000, orders: 75, avgTicket: 35333, y: 40 },
    { day: "Min", date: "14 Jul", fullDate: "Minggu, 14 Juli 2026", value: 2450000, orders: 68, avgTicket: 36029, y: 60 },
  ];

  const data = mode === "global" ? globalData : singleData;
  const xPositions = [60, 160, 260, 360, 460, 560, 660];
  const pts = data.map((d, i) => `${xPositions[i]},${d.y}`).join(" ");
  const activePoint = activeIdx !== null ? data[activeIdx] : data[2];

  return (
    <div className="flex flex-col h-full">
      {/* Active Detail Bar */}
      <div className={`flex flex-wrap items-center justify-between px-3 py-2 rounded-xl mb-3 text-xs border ${
        isNanoBanana ? "bg-amber-500/10 border-amber-500/30 text-amber-200" : "bg-emerald-500/10 border-emerald-500/20 text-emerald-200"
      }`}>
        <div className="flex items-center gap-2">
          <Calendar className="size-3.5 text-amber-400" />
          <span className="font-semibold">{activePoint.fullDate}</span>
        </div>
        <div className="flex items-center gap-4">
          <div>Omset: <span className="font-bold text-white">{formatRupiah(activePoint.value)}</span></div>
          <div>Transaksi: <span className="font-bold text-white">{activePoint.orders} Struk</span></div>
          <div>Avg Ticket: <span className="font-bold text-white">{formatRupiah(activePoint.avgTicket)}</span></div>
        </div>
      </div>

      {/* SVG Chart */}
      <div className="flex-1 relative min-h-[160px]">
        <svg viewBox="0 0 720 200" className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="lineGrad" x1="0" x2="1">
              <stop stopColor={isNanoBanana ? "#EAB308" : "#3B82F6"} />
              <stop offset="1" stopColor={isNanoBanana ? "#FACC15" : "#10B981"} />
            </linearGradient>
            <linearGradient id="fillGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor={isNanoBanana ? "rgba(234,179,8,0.25)" : "rgba(16,185,129,0.25)"} />
              <stop offset="100%" stopColor={isNanoBanana ? "rgba(234,179,8,0.0)" : "rgba(16,185,129,0.0)"} />
            </linearGradient>
          </defs>

          {/* Y-Axis Grid & Labels */}
          {[
            { y: 35, label: mode === "global" ? "35M" : "2.6M" },
            { y: 80, label: mode === "global" ? "28M" : "2.1M" },
            { y: 125, label: mode === "global" ? "21M" : "1.6M" },
            { y: 170, label: mode === "global" ? "14M" : "1.1M" },
          ].map((grid, i) => (
            <g key={i}>
              <line x1="45" y1={grid.y} x2="690" y2={grid.y} stroke="rgba(255,255,255,0.06)" strokeDasharray="4 4" />
              <text x="35" y={grid.y + 4} fill="rgba(255,255,255,0.4)" fontSize="9" textAnchor="end" className="font-mono">{grid.label}</text>
            </g>
          ))}

          {/* Area Fill & Line */}
          <polyline points={`60,190 ${pts} 660,190`} fill="url(#fillGrad)" />
          <polyline points={pts} fill="none" stroke="url(#lineGrad)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />

          {/* Interactive Data Dots & X-Axis Labels */}
          {data.map((d, i) => {
            const x = xPositions[i];
            const isSelected = activeIdx === i;
            return (
              <g key={i} className="cursor-pointer group/point" onClick={() => setActiveIdx(i)}>
                {/* Vertical hover guide */}
                <line x1={x} y1="30" x2={x} y2="190" stroke={isSelected ? (isNanoBanana ? "rgba(234,179,8,0.4)" : "rgba(16,185,129,0.4)") : "transparent"} strokeWidth="1" strokeDasharray="2 2" />
                
                {/* Dot */}
                <circle
                  cx={x}
                  cy={d.y}
                  r={isSelected ? "6" : "4"}
                  fill={isSelected ? (isNanoBanana ? "#FACC15" : "#10B981") : "#09090b"}
                  stroke={isNanoBanana ? "#FACC15" : "#3B82F6"}
                  strokeWidth={isSelected ? "3" : "2"}
                  className="transition-all duration-200"
                />

                {/* X-Axis Day & Date */}
                <text x={x} y="196" fill={isSelected ? "#ffffff" : "rgba(255,255,255,0.5)"} fontSize="10" textAnchor="middle" fontWeight={isSelected ? "bold" : "normal"}>
                  {d.day}
                </text>
                <text x={x} y="207" fill={isSelected ? (isNanoBanana ? "#FACC15" : "#34D399") : "rgba(255,255,255,0.35)"} fontSize="8" textAnchor="middle" className="font-mono">
                  {d.date}
                </text>
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
    { hour: "08:00", orders: 12, label: "Pagi", rush: false },
    { hour: "10:00", orders: 28, label: "Pagi", rush: false },
    { hour: "11:30", orders: 85, label: "Lunch Rush", rush: true },
    { hour: "12:30", orders: 94, label: "Lunch Rush", rush: true },
    { hour: "14:00", orders: 42, label: "Siang", rush: false },
    { hour: "16:00", orders: 55, label: "Sore", rush: false },
    { hour: "18:30", orders: 98, label: "Dinner Rush", rush: true },
    { hour: "19:30", orders: 105, label: "Peak Dinner", rush: true },
    { hour: "21:00", orders: 60, label: "Malam", rush: false },
  ];

  const maxOrders = 105;

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between text-xs text-slate-400">
        <span className="flex items-center gap-2">
          <Clock className="size-3.5 text-blue-400" /> Distribusi Pesanan Per Jam Operasional (Hari Ini)
        </span>
        <span className="flex items-center gap-3 font-mono">
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-amber-400"></span> Jam Ramai (Peak Rush)</span>
          <span className="flex items-center gap-1.5"><span className="size-2 rounded-full bg-slate-600"></span> Jam Normal</span>
        </span>
      </div>

      <div className="grid grid-cols-9 gap-2 items-end h-32 pt-4 border-b border-white/5 pb-2">
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
                    ? (isNanoBanana ? "bg-gradient-to-t from-amber-600 to-amber-400 shadow-[0_0_10px_rgba(234,179,8,0.3)]" : "bg-gradient-to-t from-emerald-600 to-emerald-400 shadow-[0_0_10px_rgba(16,185,129,0.3)]") 
                    : "bg-white/10 group-hover:bg-white/20"
                }`}
              />

              {/* Hour text */}
              <span className={`text-[10px] font-mono mt-1 ${h.rush ? (isNanoBanana ? "text-amber-400 font-bold" : "text-emerald-400 font-bold") : "text-slate-500"}`}>
                {h.hour}
              </span>
            </div>
          );
        })}
      </div>

      <div className="grid grid-cols-3 gap-3 pt-1">
        <div className="bg-white/[0.02] border border-white/5 p-2.5 rounded-xl text-xs flex items-center justify-between">
          <span className="text-slate-400">Puncak Lunch Rush</span>
          <span className="font-bold text-white">12:30 WIB (94 Order)</span>
        </div>
        <div className="bg-white/[0.02] border border-white/5 p-2.5 rounded-xl text-xs flex items-center justify-between">
          <span className="text-slate-400">Puncak Dinner Rush</span>
          <span className="font-bold text-amber-400">19:30 WIB (105 Order)</span>
        </div>
        <div className="bg-white/[0.02] border border-white/5 p-2.5 rounded-xl text-xs flex items-center justify-between">
          <span className="text-slate-400">Rata-rata Waktu Saji</span>
          <span className="font-bold text-emerald-400">14 Menit (KDS Lead Time)</span>
        </div>
      </div>
    </div>
  );
}

// ─── Main Owner Dashboard ──────────────────────────────────────────────────────
export default function Dashboard() {
  const { screenMode } = useTenantSettings();
  const isNanoBanana = screenMode === "nano-banana";
  const [selectedOutlet, setSelectedOutlet] = useState("Semua Outlet (Global)");

  const isGlobal = selectedOutlet === "Semua Outlet (Global)";

  const globalMetrics: Array<{ label: string; value: string; sub: string; Icon: ElementType; tone: Tone; delta: string }> = [
    { label: "Total Pendapatan Global", value: formatRupiah(184500000), sub: "100 Cabang Aktif (Mtd)", Icon: DollarSign, tone: "emerald", delta: "+14.8%" },
    { label: "Okupansi & Rotasi Meja", value: "3.240 / 4.100", sub: "79% Kapasitas Terisi Global", Icon: Utensils, tone: "emerald", delta: "42 mnt/meja" },
    { label: "Consolidated Food Cost", value: "28.2%", sub: "Target Ideal < 30.0%", Icon: Package, tone: "amber", delta: "-0.8% YoY" },
    { label: "Kondisi Kesehatan Outlet", value: "98 / 100", sub: "2 Butuh Audit & Perhatian", Icon: Building2, tone: "violet", delta: "98% Normal" },
  ];

  const singleMetrics: Array<{ label: string; value: string; sub: string; Icon: ElementType; tone: Tone; delta: string }> = [
    { label: "Total Penjualan Cabang", value: formatRupiah(12500000), sub: "Hari Ini (Real-time)", Icon: DollarSign, tone: "emerald", delta: "+12.4%" },
    { label: "Meja Aktif Cabang", value: "18 / 25 Meja", sub: "72% Kapasitas Terisi", Icon: Utensils, tone: "emerald", delta: "+3 Meja" },
    { label: "Food Cost Cabang", value: "28.5%", sub: "HPP vs Harga Jual", Icon: Package, tone: "amber", delta: "-1.2%" },
    { label: "Kehadiran Staff Cabang", value: "95%", sub: "19 dari 20 Staff Hadir", Icon: Users, tone: "violet", delta: "+2%" },
  ];

  const metrics = isGlobal ? globalMetrics : singleMetrics;

  const topOutlets = [
    { rank: 1, name: "Kedai Nusantara - Sudirman", city: "Jakarta Selatan", rev: 32500000, growth: "+18.2%", status: "Sangat Baik" },
    { rank: 2, name: "Kedai Nusantara - Senopati", city: "Jakarta Selatan", rev: 28400000, growth: "+14.5%", status: "Sangat Baik" },
    { rank: 3, name: "Kedai Nusantara - PIK 2", city: "Jakarta Utara", rev: 24100000, growth: "+11.0%", status: "Stabil" },
  ];

  const alertOutlets = [
    { name: "Cabang Kelapa Gading", issue: "Lonjakan Void & Refund Abnormal (11.2% dari omset)", type: "fraud" },
    { name: "Cabang Depok Margonda", issue: "Penurunan Omset Mingguan -18.4% (Cek promosi/staf)", type: "revenue" },
  ];

  const products = [
    { name: "Nasi Goreng Spesial", cat: "Makanan", sold: isGlobal ? 3420 : 312, rev: isGlobal ? 85500000 : 7800000 },
    { name: "Ribeye Sambal Matah", cat: "Main Course", sold: isGlobal ? 2810 : 258, rev: isGlobal ? 140500000 : 12900000 },
    { name: "Es Kopi Restoku", cat: "Minuman", sold: isGlobal ? 4500 : 204, rev: isGlobal ? 81000000 : 2448000 },
    { name: "Sate Ayam Truffle", cat: "Signature", sold: isGlobal ? 1820 : 150, rev: isGlobal ? 91000000 : 7500000 },
  ];

  return (
    <MainLayout>
      <Head title="Owner Dashboard & Analytics" />
      <Screen title="Owner Dashboard & Analytics">
        <div className="space-y-6">
          {/* Top Mode Bar */}
          <div className={`flex flex-col md:flex-row md:items-center justify-between p-4 rounded-xl gap-4 transition-all ${
            isNanoBanana 
              ? "bg-amber-500/10 border border-amber-500/30 shadow-[0_0_25px_rgba(234,179,8,0.15)]" 
              : "bg-emerald-500/10 border border-emerald-500/20"
          }`}>
            <div className="flex items-center gap-3.5">
              <div className={`grid size-11 place-items-center rounded-xl border ${isNanoBanana ? "bg-amber-500/20 border-amber-500/40 text-amber-300" : "bg-emerald-500/20 border-emerald-500/40 text-emerald-300"}`}>
                {isNanoBanana ? <Sparkles className="size-5 animate-pulse" /> : <Building2 className="size-5" />}
              </div>
              <div>
                <h3 className={`text-base font-bold flex items-center gap-2 ${isNanoBanana ? "text-amber-300" : "text-emerald-200"}`}>
                  Mode Multi-Outlet {isNanoBanana && "(Cyber Gold Engine)"}
                  {isGlobal && <span className="text-[10px] bg-amber-400/20 text-amber-300 border border-amber-400/30 px-2 py-0.5 rounded-full font-mono">100 OUTLETS CONNECTED</span>}
                </h3>
                <p className={`text-xs ${isNanoBanana ? "text-amber-200/70" : "text-emerald-300/70"}`}>
                  {isGlobal 
                    ? "Executive Command Center — Menampilkan konsolidasi makro, performa cabang, & radar keamanan global." 
                    : `Menampilkan analisis mendalam dan metrik operasional untuk ${selectedOutlet}.`}
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
                    <div className={`grid size-10 place-items-center rounded-xl border ${toneMap[tone]} ${isNanoBanana && idx === 0 ? "border-amber-500/40 bg-amber-500/15 text-amber-400 shadow-[0_0_15px_rgba(234,179,8,0.2)]" : ""}`}>
                      <Icon className="size-4.5" />
                    </div>
                    <span className={`font-semibold text-[11px] px-2.5 py-1 rounded-full ${delta.startsWith("+") || delta.includes("Normal") || delta.includes("mnt") ? "bg-emerald-500/15 text-emerald-400 border border-emerald-500/30" : "bg-amber-500/15 text-amber-400 border border-amber-500/30"}`}>
                      {delta}
                    </span>
                  </div>
                  <p className="text-xs font-semibold uppercase tracking-wider text-slate-400">{label}</p>
                  <div className={`text-2xl lg:text-3xl font-bold tracking-tight mt-1 ${
                    isNanoBanana && idx === 0 
                      ? "bg-gradient-to-r from-yellow-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent" 
                      : "text-white"
                  }`}>
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
              <div className="mb-4 flex flex-wrap justify-between items-center gap-2">
                <div>
                  <h2 className="text-base font-bold text-white flex items-center gap-2">
                    {isNanoBanana ? <Sparkles className="size-4 text-amber-400" /> : <BarChart3 className="size-4 text-emerald-400" />}
                    Tren Pendapatan & Volume Transaksi (Senin–Minggu)
                  </h2>
                  <p className="text-xs text-slate-400 mt-0.5">Klik pada titik tanggal di bawah untuk melihat rincian omset & rata-rata transaksi harian.</p>
                </div>
                <Badge tone={isNanoBanana ? "amber" : "emerald"}>Periode: 8 – 14 Juli 2026</Badge>
              </div>
              <div className="flex-1 min-h-[260px]">
                <RevenueChart isNanoBanana={isNanoBanana} mode={isGlobal ? "global" : "single"} />
              </div>
            </Glass>

            <Glass className="p-6 flex flex-col justify-between border-white/10" hover>
              <div>
                <h2 className="text-base font-bold text-white flex items-center gap-2 mb-1">
                  <Clock className="size-4 text-blue-400" />
                  Jam Ramai Order (Peak Hours)
                </h2>
                <p className="text-xs text-slate-400 mb-4">Analisa trafik pemesanan berdasarkan jam operasional dapur & meja.</p>
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
                    <p className="text-xs text-slate-400">Cabang dengan kontribusi omset dan stabilitas operasional tertinggi bulan ini.</p>
                  </div>
                  <span className="text-xs text-blue-400 font-semibold cursor-pointer hover:underline flex items-center gap-1">
                    Lihat Semua 100 Cabang <ChevronRight className="size-3.5" />
                  </span>
                </div>
                <div className="space-y-3">
                  {topOutlets.map((o) => (
                    <div key={o.rank} className="flex items-center justify-between p-3.5 rounded-xl bg-white/[0.02] border border-white/5 hover:border-white/15 transition-all">
                      <div className="flex items-center gap-3.5">
                        <div className={`size-8 rounded-lg flex items-center justify-center font-extrabold text-sm ${
                          o.rank === 1 ? "bg-amber-500/20 text-amber-400 border border-amber-500/40 shadow-[0_0_12px_rgba(234,179,8,0.25)]" : "bg-white/10 text-slate-300"
                        }`}>
                          #{o.rank}
                        </div>
                        <div>
                          <p className="text-sm font-bold text-white">{o.name}</p>
                          <p className="text-xs text-slate-400">{o.city}</p>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-sm font-bold font-mono text-emerald-400">{formatRupiah(o.rev)}</p>
                        <p className="text-xs text-slate-400 flex items-center justify-end gap-1.5">
                          <span className="text-emerald-400 font-semibold">{o.growth}</span> vs minggu lalu
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
                <p className="text-xs text-slate-400 mb-4">Deteksi anomali finansial, lonjakan void, dan penurunan omset ekstrem di cabang.</p>
                
                <div className="space-y-3">
                  {alertOutlets.map((a, i) => (
                    <div key={i} className="p-3.5 rounded-xl bg-black/40 border border-red-500/30 space-y-1">
                      <div className="flex items-center justify-between">
                        <span className="text-xs font-bold text-red-300 flex items-center gap-1.5">
                          <AlertTriangle className="size-3.5 text-red-400" /> {a.name}
                        </span>
                        <Badge tone="red">{a.type === "fraud" ? "AUDIT REQUIRED" : "UNDERPERFORMING"}</Badge>
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
                  Produk Terlaris {isGlobal ? "(Akumulasi 100 Cabang)" : `(${selectedOutlet})`}
                </h2>
                <p className="text-xs text-slate-400">Kontributor pendapatan utama berdasarkan volume penjualan item.</p>
              </div>
            </div>
            <div className="grid grid-cols-[1.6fr_1fr_.8fr_1fr] border-b border-white/10 pb-2.5 text-[11px] font-bold uppercase tracking-wider text-slate-400">
              <span>Nama Produk</span><span>Kategori</span><span>Terjual</span><span>Total Pendapatan</span>
            </div>
            <div className="divide-y divide-white/5">
              {products.map((p, i) => (
                <div className="grid grid-cols-[1.6fr_1fr_.8fr_1fr] items-center py-3.5 text-sm hover:bg-white/[0.03] px-2 rounded-lg transition-colors group" key={p.name}>
                  <span className="flex items-center gap-3 text-slate-200 font-semibold">
                    <span className={`size-8 rounded-lg border flex items-center justify-center text-xs font-bold ${
                      isNanoBanana && i === 0 
                        ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(234,179,8,0.2)]" 
                        : "bg-white/5 border-white/10 text-slate-400 group-hover:border-white/20"
                    }`}>
                      {i + 1}
                    </span>
                    {p.name}
                  </span>
                  <span className="text-slate-400">{p.cat}</span>
                  <span className="font-mono font-semibold text-slate-300">{p.sold.toLocaleString("id-ID")} Porsi</span>
                  <span className={`font-bold font-mono ${isNanoBanana ? "text-amber-400" : "text-emerald-400"}`}>{formatRupiah(p.rev)}</span>
                </div>
              ))}
            </div>
          </Glass>
        </div>
      </Screen>
    </MainLayout>
  );
}

