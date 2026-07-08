import { useState } from "react";
import { Head } from "@inertiajs/react";
import MainLayout from "../../Layouts/MainLayout";
import { Screen, Glass, Badge, formatRupiah, toneMap, cardToneMap, PlanBadge, MOCK_PLAN, MOCK_OUTLET, planHasFeature, FEATURE_LOCKS } from "../../Components/Shared";
import { DollarSign, Utensils, Package, Users, Search, Clock3, CheckCheck, Plus, SlidersHorizontal, ArrowDownToLine, Smartphone, QrCode, UserPlus, FileText, ChevronRight, Calculator, AlertTriangle, MessageSquare, TicketPercent, CheckCircle2, RefreshCcw, Download, DownloadCloud, Volume2, ArrowUpRight, ArrowDownLeft, Banknote } from "lucide-react";
import { ProductImage } from "../../Components/ProductImage";
import { RoleGuard } from "../../Components/RoleGuard";

function ArusKasInner() {
  const [selectedDate, setSelectedDate] = useState("2026-07-06");

  const entries = [
    { time: "14:30", desc: "Penjualan (84 order)", type: "in", amount: 3850000, balance: 18250000 },
    { time: "13:00", desc: "Pembelian Bahan Baku", type: "out", amount: -1200000, balance: 14400000 },
    { time: "12:00", desc: "Penjualan (62 order)", type: "in", amount: 2890000, balance: 15600000 },
    { time: "10:30", desc: "Gaji Harian (3 kasir)", type: "out", amount: -450000, balance: 12710000 },
    { time: "09:00", desc: "Saldo Awal Hari Ini", type: "in", amount: 10270000, balance: 10270000 },
  ];
  const totalIn = entries.filter(e => e.type === "in").reduce((s, e) => s + e.amount, 0);
  const totalOut = Math.abs(entries.filter(e => e.type === "out").reduce((s, e) => s + e.amount, 0));

  return (
    <MainLayout>
      <Head title="Arus Kas (Cash Flow)" />
      <Screen title="Arus Kas (Cash Flow)" action={
        <div className="flex items-center gap-3 no-print">
          <input 
            type="date" 
            value={selectedDate} 
            onChange={(e) => setSelectedDate(e.target.value)} 
            className="bg-white/5 border border-white/10 rounded-xl px-3 py-1.5 text-xs text-white outline-none cursor-pointer focus:border-white/20"
          />
          <button 
            onClick={() => window.print()}
            className="rounded-lg bg-emerald-500 hover:bg-emerald-600 text-slate-950 px-4 py-2 text-sm font-bold transition-all shadow-[0_0_15px_rgba(16,185,129,0.2)] flex items-center gap-2"
          >
            <Download className="size-4" />Cetak PDF
          </button>
          <button className="rounded-lg bg-slate-100 hover:bg-white text-slate-900 px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2">
            <Plus className="size-4" />Catat Transaksi
          </button>
        </div>
      }>
      <div className="space-y-5">
        <div className="grid grid-cols-3 gap-5">
          <Glass className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-9 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                <ArrowUpRight className="size-4 text-emerald-400" />
              </div>
              <p className="text-sm text-slate-400">Uang Masuk (Hari Ini)</p>
            </div>
            <p className="text-2xl font-semibold text-emerald-300">{formatRupiah(totalIn)}</p>
          </Glass>
          <Glass className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-9 rounded-lg bg-red-500/10 border border-red-500/20 flex items-center justify-center">
                <ArrowDownLeft className="size-4 text-red-400" />
              </div>
              <p className="text-sm text-slate-400">Uang Keluar (Hari Ini)</p>
            </div>
            <p className="text-2xl font-semibold text-red-300">{formatRupiah(totalOut)}</p>
          </Glass>
          <Glass className="p-5">
            <div className="flex items-center gap-3 mb-3">
              <div className="size-9 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                <Banknote className="size-4 text-blue-400" />
              </div>
              <p className="text-sm text-slate-400">Saldo Akhir</p>
            </div>
            <p className="text-2xl font-semibold text-blue-300">{formatRupiah(entries[0].balance)}</p>
          </Glass>
        </div>
        <Glass className="p-5">
          <style dangerouslySetInnerHTML={{__html: `
            @media print {
              aside, nav, header, button, select, input, .no-print, [role="navigation"] {
                display: none !important;
              }
              body, html {
                background: #000000 !important;
                color: #ffffff !important;
                font-size: 12px !important;
              }
              main {
                padding: 0 !important;
                margin: 0 !important;
                background: transparent !important;
              }
              .grid {
                display: grid !important;
                grid-template-cols: repeat(3, 1fr) !important;
                gap: 15px !important;
              }
              .glass-card {
                background: rgba(255, 255, 255, 0.03) !important;
                border: 1px solid rgba(255, 255, 255, 0.1) !important;
                box-shadow: none !important;
                page-break-inside: avoid !important;
                border-radius: 12px !important;
                padding: 16px !important;
              }
            }
          `}} />

          {/* Print-only Header */}
          <div className="hidden print:block mb-8 border-b border-white/10 pb-4">
            <h1 className="text-2xl font-bold text-white">LAPORAN MUTASI ARUS KAS</h1>
            <p className="text-slate-400 text-xs mt-1">Tanggal Mutasi: {selectedDate} • Cetak: {new Date().toLocaleDateString('id-ID')}</p>
          </div>

          <h2 className="text-base font-medium text-slate-200 mb-4 print:hidden">Riwayat Transaksi Kas – {selectedDate}</h2>
          <h2 className="text-base font-bold text-white mb-4 hidden print:block">Riwayat Transaksi Mutasi Kas</h2>
          <div className="grid grid-cols-[80px_1fr_80px_1fr_1fr] border-b border-white/5 pb-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
            <span>Waktu</span><span>Keterangan</span><span>Jenis</span><span>Jumlah</span><span>Saldo</span>
          </div>
          {entries.map((e, i) => (
            <div key={i} className="grid grid-cols-[80px_1fr_80px_1fr_1fr] items-center border-b border-white/5 py-3.5 text-sm">
              <span className="font-mono text-slate-400 text-xs">{e.time}</span>
              <span className="text-slate-300">{e.desc}</span>
              <span>{e.type === "in" ? <Badge tone="emerald">Masuk</Badge> : <Badge tone="red">Keluar</Badge>}</span>
              <span className={`font-mono font-semibold ${e.type === "in" ? "text-emerald-400" : "text-red-400"}`}>
                {e.type === "in" ? "+" : ""}{formatRupiah(e.amount)}
              </span>
              <span className="font-mono text-slate-300">{formatRupiah(e.balance)}</span>
            </div>
          ))}
        </Glass>
      </div>
    </Screen>
    </MainLayout>
  );
}


// --- Role Guard Wrapper -------------------------------------------------------
export default function ArusKas() {
  return (
    <RoleGuard allowedRoles={["owner"]} pageName="Arus Kas" allowedRoleLabel="Owner">
      <ArusKasInner />
    </RoleGuard>
  );
}