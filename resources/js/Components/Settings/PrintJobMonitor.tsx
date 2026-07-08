import { useState, useEffect } from "react";
import { Screen, Glass, Button, Badge, useTenantSettings } from "../Shared";
import { Printer, Search, RefreshCw, AlertTriangle, CheckCircle2, FileText, Settings, Download } from "lucide-react";

export function PrintJobMonitor() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [jobs, setJobs] = useState<any[]>([]);
  const { isLight } = useTenantSettings();

  const fetchJobs = async () => {
    try {
      const response = await fetch("/api/print-jobs");
      if (response.ok) {
        const data = await response.json();
        setJobs(data);
      }
    } catch (err) {
      console.error("Gagal mengambil antrean cetak", err);
    }
  };

  useEffect(() => {
    fetchJobs();
    const interval = setInterval(fetchJobs, 3000);
    return () => clearInterval(interval);
  }, []);

  const handleRefresh = async () => {
    setIsRefreshing(true);
    await fetchJobs();
    setIsRefreshing(false);
  };

  return (
    <Screen title="Antrean & Riwayat Cetak" action={
      <div className="flex gap-2">
        <Button variant="outline" className={`gap-2 ${isLight ? "text-slate-700 border-slate-300 hover:bg-slate-100 font-bold" : "text-slate-300 border-white/10 hover:bg-white/10"}`}>
          <Settings className="size-4" /> Pengaturan Printer
        </Button>
        <Button onClick={handleRefresh} className={`gap-2 font-bold ${isLight ? "bg-slate-800 hover:bg-slate-900 text-white" : "bg-slate-800 text-white hover:bg-slate-700"}`}>
          <RefreshCw className={`size-4 ${isRefreshing ? "animate-spin" : ""}`} /> Muat Ulang
        </Button>
      </div>
    }>
      <div className="grid grid-cols-4 gap-5 mb-5">
        <Glass className={`p-5 flex items-center justify-between border-l-4 border-l-blue-500 ${isLight ? "bg-white shadow-sm border-y border-r border-slate-200" : ""}`}>
          <div>
            <p className={`text-sm font-medium ${isLight ? "text-slate-600" : "text-slate-400"}`}>Total Print Hari Ini</p>
            <h3 className={`text-2xl font-bold mt-1 ${isLight ? "text-slate-900" : "text-slate-100"}`}>142</h3>
          </div>
          <Printer className="size-8 text-blue-500/20" />
        </Glass>
        <Glass className={`p-5 flex items-center justify-between border-l-4 border-l-emerald-500 ${isLight ? "bg-white shadow-sm border-y border-r border-slate-200" : ""}`}>
          <div>
            <p className={`text-sm font-medium ${isLight ? "text-slate-600" : "text-slate-400"}`}>Berhasil</p>
            <h3 className={`text-2xl font-bold mt-1 ${isLight ? "text-emerald-700" : "text-emerald-400"}`}>138</h3>
          </div>
          <CheckCircle2 className="size-8 text-emerald-500/20" />
        </Glass>
        <Glass className={`p-5 flex items-center justify-between border-l-4 border-l-red-500 ${isLight ? "bg-white shadow-sm border-y border-r border-slate-200" : ""}`}>
          <div>
            <p className={`text-sm font-medium ${isLight ? "text-slate-600" : "text-slate-400"}`}>Gagal Cetak</p>
            <h3 className={`text-2xl font-bold mt-1 ${isLight ? "text-red-700" : "text-red-400"}`}>4</h3>
          </div>
          <AlertTriangle className="size-8 text-red-500/20" />
        </Glass>
        <Glass className={`p-5 flex items-center justify-between border-l-4 border-l-amber-500 ${isLight ? "bg-white shadow-sm border-y border-r border-slate-200" : ""}`}>
          <div>
            <p className={`text-sm font-medium ${isLight ? "text-slate-600" : "text-slate-400"}`}>Sedang Proses</p>
            <h3 className={`text-2xl font-bold mt-1 ${isLight ? "text-amber-700" : "text-amber-400"}`}>1</h3>
          </div>
          <RefreshCw className="size-8 text-amber-500/20 animate-spin-slow" />
        </Glass>
      </div>

      <Glass className="overflow-hidden">
        <div className={`p-4 border-b flex items-center justify-between ${isLight ? "border-slate-200 bg-slate-50" : "border-white/5 bg-white/[0.01]"}`}>
          <div className="flex items-center gap-3">
            <div className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 transition-colors w-64 ${isLight ? "border-slate-300 bg-white" : "border-white/10 bg-white/5"}`}>
              <Search className="size-4 text-slate-400" />
              <input placeholder="Cari Job ID atau Order ID..." className={`w-full bg-transparent text-sm outline-none ${isLight ? "text-slate-900 placeholder:text-slate-400" : "text-slate-200 placeholder:text-slate-400"}`} />
            </div>
            <select className={`rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:border-blue-500 border ${isLight ? "bg-white border-slate-300 text-slate-800" : "bg-white/5 border-white/10 text-slate-300"}`}>
              <option>Semua Status</option>
              <option>Failed</option>
              <option>Done</option>
              <option>Printing</option>
            </select>
          </div>
        </div>
        
        <div className="p-5">
          <div className={`grid grid-cols-[1fr_1.5fr_1fr_1.5fr_1fr_1.5fr_1.2fr] border-b pb-3 text-[11px] font-medium uppercase tracking-wider ${isLight ? "border-slate-200 text-slate-600 font-bold" : "border-white/5 text-slate-400"}`}>
            <span>Job ID</span><span>Tipe Struk</span><span>Order ID</span><span>Printer Target</span><span>Status</span><span>Waktu & Info</span><span>Aksi</span>
          </div>
          {jobs.map(job => (
            <div className={`grid grid-cols-[1fr_1.5fr_1fr_1.5fr_1fr_1.5fr_1.2fr] items-center border-b py-3.5 text-sm ${isLight ? "border-slate-100 text-slate-800 font-medium" : "border-white/5 text-slate-300"}`} key={job.id}>
              <span className={`font-mono ${isLight ? "text-slate-900 font-bold" : "text-slate-300"}`}>{job.id}</span>
              <span className={`flex items-center gap-2 ${isLight ? "text-slate-800 font-medium" : "text-slate-200"}`}>
                <FileText className="size-4 text-slate-400" />
                {job.type}
              </span>
              <span className={job.orderId !== "-" ? (isLight ? "text-blue-600 font-bold hover:underline cursor-pointer" : "text-blue-400 hover:underline cursor-pointer") : "text-slate-500"}>
                {job.orderId}
              </span>
              <span className={isLight ? "text-slate-800 font-medium" : "text-slate-300"}>{job.target}</span>
              
              <div>
                {job.status === "done" && <Badge tone="emerald"><CheckCircle2 className="size-3 mr-1" /> Selesai</Badge>}
                {job.status === "failed" && <Badge tone="red"><AlertTriangle className="size-3 mr-1" /> Gagal</Badge>}
                {job.status === "printing" && <Badge tone="amber"><RefreshCw className="size-3 mr-1 animate-spin" /> Printing</Badge>}
              </div>
              
              <div className="flex flex-col pr-3">
                <span className={`text-xs ${isLight ? "text-slate-500 font-medium" : "text-slate-400"}`}>{job.time}</span>
                {job.error && (
                  <span className="text-[10px] text-red-500 font-bold mt-1 leading-tight break-words border-l border-red-500/50 pl-1.5">
                    {job.error} (Retry: {job.retryCount}/3)
                  </span>
                )}
              </div>
              
              <div>
                {job.status === "failed" ? (
                  <button className="flex items-center gap-1 text-[11px] bg-blue-500/20 text-blue-400 px-3 py-1.5 rounded-lg border border-blue-500/30 hover:bg-blue-500/30 transition-colors font-bold">
                    <RefreshCw className="size-3" /> Cetak Ulang
                  </button>
                ) : (
                  <button className={`flex items-center gap-1 text-[11px] px-3 py-1.5 rounded-lg border transition-colors ${isLight ? "bg-slate-100 text-slate-700 border-slate-300 hover:bg-slate-200 font-bold" : "bg-white/5 text-slate-300 border-white/10 hover:bg-white/10"}`}>
                    <Download className="size-3" /> Unduh PDF
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      </Glass>
    </Screen>
  );
}
