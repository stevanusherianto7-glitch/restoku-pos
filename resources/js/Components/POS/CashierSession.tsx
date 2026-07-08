import { useState, type ChangeEvent } from "react";
import { Screen, Glass, Button, Input, Badge, formatRupiah } from "../Shared";
import { Calculator, CheckCircle2, Clock, DollarSign, LogOut, Minus, Plus, Search, TerminalSquare, AlertTriangle } from "lucide-react";

export function CashierSession() {
  const [sessionState, setSessionState] = useState<"closed" | "open">("closed");
  const [openingBalance, setOpeningBalance] = useState("500000");

  const [closingCash, setClosingCash] = useState("3250000");
  const [isClosingModalOpen, setIsClosingModalOpen] = useState(false);

  // Get active logged-in staff name or fall back to the configured Kasir name
  const getActiveCashierName = () => {
    if (typeof window !== "undefined") {
      const activeRaw = localStorage.getItem("activeKaryawan");
      if (activeRaw) {
        try {
          const parsed = JSON.parse(activeRaw);
          if (parsed.name) return parsed.name.toUpperCase();
        } catch { /* ignore */ }
      }
      return (localStorage.getItem("tenant_staff_kasir") || "BUDI HARTONO").toUpperCase();
    }
    return "BUDI HARTONO";
  };

  const cashierName = getActiveCashierName();

  // Data tiruan
  const currentSession = {
    openedAt: "08:15 AM",
    cashierName: cashierName,
    totalCashSales: 2750000,
    totalNonCashSales: 4500000,
  };

  const expectedCash = parseInt(openingBalance) + currentSession.totalCashSales;
  const actualCash = parseInt(closingCash) || 0;
  const difference = actualCash - expectedCash;


  return (
    <Screen title="Sesi Kasir" action={
      sessionState === "open" && (
        <Button variant="outline" className="text-red-400 hover:text-red-300 border-red-500/20 hover:bg-red-500/10" onClick={() => setIsClosingModalOpen(true)}>
          <LogOut className="size-4 mr-2" />
          Tutup Shift
        </Button>
      )
    }>
      {sessionState === "closed" ? (
        <div className="flex flex-col items-center justify-center py-20 px-4">
          <Glass className="p-8 max-w-md w-full text-center">
            <div className="mx-auto size-16 bg-blue-500/10 rounded-full flex items-center justify-center mb-6 border border-blue-500/20">
              <TerminalSquare className="size-8 text-blue-400" />
            </div>
            <h2 className="text-xl font-semibold text-slate-200 mb-2">Buka Shift Kasir</h2>
            <p className="text-sm text-slate-400 mb-8">
              Masukkan saldo awal laci uang tunai sebelum memulai transaksi pada shift ini.
            </p>

            <div className="space-y-4 text-left">
              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Kasir Aktif</label>
                <div className="w-full bg-white/5 border border-white/10 rounded-lg px-4 py-3 text-sm text-slate-300 flex items-center gap-2">
                  <div className="grid size-6 shrink-0 place-items-center rounded-full bg-slate-800 font-medium text-[10px] text-white">
                    {cashierName.charAt(0)}
                  </div>
                  {cashierName}
                </div>
              </div>

              <div className="space-y-2">
                <label className="text-xs font-medium text-slate-400">Saldo Awal (Modal Tunai)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">Rp</span>
                  <Input 
                    type="number" 
                    value={openingBalance}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setOpeningBalance(e.target.value)}
                    className="pl-10 font-mono text-lg py-3" 
                  />
                </div>
              </div>

              <Button 
                className="w-full h-12 text-base mt-2" 
                onClick={() => setSessionState("open")}
              >
                Buka Sesi & Mulai Transaksi
              </Button>
            </div>
          </Glass>
        </div>
      ) : (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
            <Glass className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="size-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                  <Clock className="size-5 text-blue-400" />
                </div>
                <Badge tone="emerald">Shift Aktif</Badge>
              </div>
              <p className="text-sm font-medium text-slate-400">Waktu Mulai</p>
              <h3 className="text-2xl font-bold tracking-tight text-slate-100 mt-1">{currentSession.openedAt}</h3>
              <p className="text-xs text-slate-500 mt-2">Kasir: {currentSession.cashierName}</p>
            </Glass>
            
            <Glass className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="size-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                  <DollarSign className="size-5 text-amber-400" />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-400">Saldo Awal (Modal)</p>
              <h3 className="text-2xl font-bold tracking-tight text-slate-100 mt-1 font-mono">{formatRupiah(parseInt(openingBalance))}</h3>
            </Glass>

            <Glass className="p-6">
              <div className="flex justify-between items-start mb-4">
                <div className="size-10 rounded-lg bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center">
                  <Calculator className="size-5 text-emerald-400" />
                </div>
              </div>
              <p className="text-sm font-medium text-slate-400">Total Penjualan Tunai</p>
              <h3 className="text-2xl font-bold tracking-tight text-slate-100 mt-1 font-mono">{formatRupiah(currentSession.totalCashSales)}</h3>
              <p className="text-xs text-slate-500 mt-2">Ekspektasi Uang di Laci: {formatRupiah(expectedCash)}</p>
            </Glass>
          </div>

          <Glass className="p-6">
            <h2 className="mb-5 text-base font-medium text-slate-200">Riwayat Sesi Sebelumnya</h2>
            <div className="grid grid-cols-[1fr_1.5fr_1.5fr_1.5fr_1fr] border-b border-white/5 pb-3 text-[11px] font-medium uppercase tracking-wider text-slate-400">
              <span>Waktu</span><span>Kasir</span><span>Penerimaan Tunai</span><span>Selisih (Difference)</span><span>Status</span>
            </div>
            {[
              { id: "S-102", time: "Kemarin, 08:00 - 15:30", name: "Rizky", cash: 3200000, diff: 0, status: "Cocok" },
              { id: "S-101", time: "Kemarin, 15:30 - 23:00", name: "Bima", cash: 4100000, diff: -50000, status: "Minus" },
            ].map(row => (
              <div key={row.id} className="grid grid-cols-[1fr_1.5fr_1.5fr_1.5fr_1fr] items-center border-b border-white/5 py-3 text-sm">
                <span className="text-slate-400 text-xs">{row.time}</span>
                <span className="font-medium text-slate-200">{row.name}</span>
                <span className="font-mono text-slate-300">{formatRupiah(row.cash)}</span>
                <span className={`font-mono font-medium ${row.diff === 0 ? "text-emerald-400" : "text-red-400"}`}>
                  {row.diff === 0 ? "-" : formatRupiah(row.diff)}
                </span>
                <span>
                  {row.status === "Cocok" ? <Badge tone="emerald">Sesuai</Badge> : <Badge tone="red">Selisih</Badge>}
                </span>
              </div>
            ))}
          </Glass>
        </div>
      )}

      {/* Modal Tutup Shift */}
      {isClosingModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
          <Glass className="p-6 max-w-lg w-full">
            <div className="flex justify-between items-start mb-6">
              <div>
                <h2 className="text-lg font-semibold text-slate-100">Tutup Shift Kasir</h2>
                <p className="text-sm text-slate-400 mt-1">Lakukan rekonsiliasi uang laci (Z-Report).</p>
              </div>
              <button onClick={() => setIsClosingModalOpen(false)} className="text-slate-500 hover:text-white">✕</button>
            </div>

            <div className="space-y-4 mb-6">
              <div className="flex justify-between text-sm py-2 border-b border-white/10">
                <span className="text-slate-400">Saldo Awal</span>
                <span className="font-mono text-slate-200">{formatRupiah(parseInt(openingBalance))}</span>
              </div>
              <div className="flex justify-between text-sm py-2 border-b border-white/10">
                <span className="text-slate-400">Total Penjualan Tunai</span>
                <span className="font-mono text-slate-200">+{formatRupiah(currentSession.totalCashSales)}</span>
              </div>
              <div className="flex justify-between text-base py-3 border-b border-white/10 bg-white/5 px-3 rounded-lg mt-2">
                <span className="font-medium text-slate-300">Ekspektasi Uang di Laci</span>
                <span className="font-mono font-bold text-blue-400">{formatRupiah(expectedCash)}</span>
              </div>

              <div className="space-y-2 mt-4">
                <label className="text-sm font-medium text-slate-300">Jumlah Uang Fisik (Aktual)</label>
                <div className="relative">
                  <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-mono text-sm">Rp</span>
                  <Input 
                    type="number" 
                    value={closingCash}
                    onChange={(e: ChangeEvent<HTMLInputElement>) => setClosingCash(e.target.value)}
                    className="pl-10 font-mono text-lg py-3 bg-slate-900 focus:border-blue-500" 
                  />
                </div>
              </div>

              {difference !== 0 && (
                <div className={`p-4 rounded-lg flex items-start gap-3 border ${difference > 0 ? "bg-emerald-500/10 border-emerald-500/30" : "bg-red-500/10 border-red-500/30"}`}>
                  <AlertTriangle className={`size-5 shrink-0 ${difference > 0 ? "text-emerald-400" : "text-red-400"}`} />
                  <div>
                    <p className={`text-sm font-medium ${difference > 0 ? "text-emerald-400" : "text-red-400"}`}>
                      Terdapat Selisih {difference > 0 ? "Lebih" : "Kurang"}
                    </p>
                    <p className="font-mono text-lg font-bold text-white mt-1">{formatRupiah(Math.abs(difference))}</p>
                    <Input placeholder="Catatan/Alasan selisih..." className="mt-3 text-xs bg-black/20" />
                  </div>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-3 pt-4 border-t border-white/10">
              <Button variant="ghost" onClick={() => setIsClosingModalOpen(false)}>Batal</Button>
              <Button className="bg-red-600 hover:bg-red-700 text-white border-none" onClick={() => {
                setSessionState("closed");
                setIsClosingModalOpen(false);
                setOpeningBalance("");
              }}>Tutup Shift & Cetak Z-Report</Button>
            </div>
          </Glass>
        </div>
      )}
    </Screen>
  );
}
