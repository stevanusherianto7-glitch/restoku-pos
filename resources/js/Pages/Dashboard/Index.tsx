import { type ElementType } from "react";
import { Head } from "@inertiajs/react";
import MainLayout from "../../Layouts/MainLayout";
import { Screen, Glass, Badge, formatRupiah, toneMap, type Tone, useTenantSettings } from "../../Components/Shared";
import { DollarSign, Utensils, Package, Users, Sparkles } from "lucide-react";

// ─── Revenue Chart ─────────────────────────────────────────────────────────────
function RevenueChart({ isNanoBanana = false }: { isNanoBanana?: boolean }) {
  const pts = "20,170 150,118 280,135 410,78 540,92 670,45 800,65";
  return (
    <svg viewBox="0 0 820 220" className="h-full w-full">
      <defs>
        <linearGradient id="line" x1="0" x2="1">
          <stop stopColor={isNanoBanana ? "#EAB308" : "#3B82F6"} />
          <stop offset="1" stopColor={isNanoBanana ? "#FACC15" : "#10B981"} />
        </linearGradient>
      </defs>
      {[40, 85, 130, 175].map(y => <line key={y} x1="0" x2="820" y1={y} y2={y} stroke="rgba(255,255,255,0.05)" />)}
      <polyline points={pts} fill="none" stroke="url(#line)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round" />
      <polyline points={`${pts} 800,220 20,220`} fill={isNanoBanana ? "rgba(234,179,8,.08)" : "rgba(59,130,246,.05)"} />
      <g>
        {pts.split(" ").map((p, i) => { 
          const [x, y] = p.split(","); 
          return <circle key={i} cx={x} cy={y} r="4" fill={isNanoBanana ? "#030712" : "#09090b"} stroke={isNanoBanana ? "#FACC15" : "#60A5FA"} strokeWidth="2" />; 
        })}
      </g>
    </svg>
  );
}

export default function Dashboard() {
  const { screenMode } = useTenantSettings();
  const isNanoBanana = screenMode === "nano-banana";

  const metrics: Array<{ label: string; value: string; Icon: ElementType; tone: Tone; delta: string }> = [
    { label: "Total Penjualan",  value: formatRupiah(12500000), Icon: DollarSign, tone: "emerald", delta: "+12.4%" },
    { label: "Meja Aktif",       value: "18/25",                Icon: Utensils,   tone: "emerald",    delta: "+3" },
    { label: "Food Cost %",      value: "28.5%",                Icon: Package,    tone: "amber",   delta: "-1.2%" },
    { label: "Kehadiran Staff",  value: "95%",                  Icon: Users,      tone: "violet",  delta: "+2%" },
  ];
  const products = [
    { name: "Nasi Goreng Spesial", cat: "Makanan",      sold: 312, rev: 7800000 },
    { name: "Ribeye Sambal Matah", cat: "Main Course",  sold: 258, rev: 12900000 },
    { name: "Es Kopi Restoku",     cat: "Minuman",      sold: 204, rev: 2448000 },
    { name: "Sate Ayam Truffle",   cat: "Signature",    sold: 150, rev: 7500000 },
  ];
  return (
    <MainLayout>
      <Head title="Owner Dashboard & Analytics" />
      <Screen title="Owner Dashboard & Analytics">
        <div className="space-y-5">
          <div className={`flex justify-between items-center p-4 rounded-xl mb-4 transition-all ${
            isNanoBanana 
              ? "bg-amber-500/10 border border-amber-500/30 shadow-[0_0_20px_rgba(234,179,8,0.15)]" 
              : "bg-emerald-500/10 border border-emerald-500/20"
          }`}>
            <div className="flex items-center gap-3">
              {isNanoBanana && <Sparkles className="size-5 text-amber-400 animate-pulse" />}
              <div>
                <h3 className={`text-sm font-medium ${isNanoBanana ? "text-amber-300 font-bold" : "text-emerald-200"}`}>Mode Multi-Outlet {isNanoBanana && "(Cyber Gold Engine)"}</h3>
                <p className={`text-xs ${isNanoBanana ? "text-amber-200/70" : "text-emerald-300/70"}`}>Menampilkan agregasi data real-time dari seluruh cabang aktif.</p>
              </div>
            </div>
            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-amber-500">
              <option>Semua Outlet (Global)</option>
              <option>Restoku Pusat (Jakarta)</option>
              <option>Restoku Cabang (Bandung)</option>
            </select>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
            {metrics.map(({ label, value, Icon, tone, delta }, idx) => (
              <Glass className="p-5" hover key={label}>
                <div className="flex items-center justify-between">
                  <div className={`grid size-10 place-items-center rounded-lg border ${toneMap[tone]} ${isNanoBanana && idx === 0 ? "border-amber-500/40 bg-amber-500/10 text-amber-400" : ""}`}>
                    <Icon className="size-4" />
                  </div>
                  <span className={`font-medium text-xs px-2 py-0.5 rounded-full ${delta.startsWith("+") ? "bg-emerald-500/10 text-emerald-400 border border-emerald-500/20" : "bg-red-500/10 text-red-400 border border-red-500/20"}`}>{delta}</span>
                </div>
                <p className="mt-4 text-sm font-medium text-slate-400">{label}</p>
                <div className={`text-2xl font-semibold tracking-tight mt-1 ${
                  isNanoBanana && idx === 0 
                    ? "bg-gradient-to-r from-yellow-200 via-amber-400 to-yellow-500 bg-clip-text text-transparent font-extrabold" 
                    : "text-slate-100"
                }`}>
                  {value}
                </div>
              </Glass>
            ))}
          </div>
          <Glass className="p-6 h-72 flex flex-col" hover>
            <div className="mb-4 flex justify-between items-center">
              <h2 className="text-base font-medium text-slate-200 flex items-center gap-2">
                {isNanoBanana && <Sparkles className="size-4 text-amber-400" />}
                Tren Pendapatan Mingguan
              </h2>
              <Badge tone={isNanoBanana ? "amber" : "emerald"}>Senin–Minggu</Badge>
            </div>
            <div className="flex-1 min-h-0"><RevenueChart isNanoBanana={isNanoBanana} /></div>
          </Glass>
          <Glass className="p-5" hover>
            <h2 className="mb-4 text-base font-medium text-slate-200 flex items-center gap-2">
              {isNanoBanana && <Sparkles className="size-4 text-amber-400" />}
              Produk Terlaris
            </h2>
            <div className="grid grid-cols-[1.6fr_1fr_.8fr_1fr] border-b border-white/5 pb-2 text-[11px] font-medium uppercase tracking-wider text-slate-400">
              <span>Nama Produk</span><span>Kategori</span><span>Terjual</span><span>Total Pendapatan</span>
            </div>
            {products.map((p, i) => (
              <div className="grid grid-cols-[1.6fr_1fr_.8fr_1fr] items-center border-b border-white/5 py-3 text-sm hover:bg-white/[0.03] px-2 rounded-lg transition-colors group" key={p.name}>
                <span className="flex items-center gap-3 text-slate-200 font-medium">
                  <span className={`size-8 rounded-md border flex items-center justify-center text-xs font-bold ${
                    isNanoBanana && i === 0 
                      ? "bg-amber-500/20 border-amber-500/50 text-amber-300 shadow-[0_0_10px_rgba(234,179,8,0.2)]" 
                      : "bg-white/5 border-white/10 text-slate-400 group-hover:border-white/20"
                  }`}>
                    {i + 1}
                  </span>
                  {p.name}
                </span>
                <span className="text-slate-400">{p.cat}</span>
                <span className="font-mono text-slate-300">{p.sold}</span>
                <span className={`font-semibold ${isNanoBanana ? "text-amber-400" : "text-emerald-400"}`}>{formatRupiah(p.rev)}</span>
              </div>
            ))}
          </Glass>
        </div>
      </Screen>
    </MainLayout>
  );
}
