import { useState, type ChangeEvent } from "react";
import { Screen, Glass, Button, Input } from "../Shared";
import { QrCode, Printer, Download, Users, Store, Settings, LayoutGrid } from "lucide-react";
import { QRTableCard } from "../QR/QRTableCard";
import { QRDisplay } from "../QR/QRDisplay";

export function QRManager() {
  const [activeTab, setActiveTab] = useState<"tables" | "staff" | "menu">("tables");
  const [tableCount, setTableCount] = useState("20");
  const [showPrintPreview, setShowPrintPreview] = useState(false);

  // Mock data
  const staffList = [
    { id: "S001", name: "Andi Saputra", role: "Waiter" },
    { id: "S002", name: "Budi Santoso", role: "Kitchen" },
    { id: "S003", name: "Citra Dewi", role: "Cashier" },
  ];

  return (
    <Screen title="Manajemen QR Code" action={
      <div className="flex gap-2">
        <Button variant="outline" className="gap-2 text-xs">
          <Settings className="size-3" /> Konfigurasi
        </Button>
      </div>
    }>
      
      {/* Tabs */}
      <div className="flex overflow-x-auto border-b border-white/10 mb-6 custom-scrollbar">
        <button
          onClick={() => setActiveTab("tables")}
          className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "tables"
              ? "border-emerald-400 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <LayoutGrid className="size-4" /> QR Meja (Self-Order)
        </button>
        <button
          onClick={() => setActiveTab("staff")}
          className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "staff"
              ? "border-emerald-400 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Users className="size-4" /> QR Absensi Staff
        </button>
        <button
          onClick={() => setActiveTab("menu")}
          className={`px-4 py-3 text-sm font-medium whitespace-nowrap border-b-2 transition-colors flex items-center gap-2 ${
            activeTab === "menu"
              ? "border-emerald-400 text-emerald-400"
              : "border-transparent text-slate-400 hover:text-white"
          }`}
        >
          <Store className="size-4" /> QR Menu Digital (Statis)
        </button>
      </div>

      {activeTab === "tables" && (
        <div className="space-y-6">
          <Glass className="p-6">
            <h3 className="text-lg font-semibold text-white mb-2">Generate QR Code Meja</h3>
            <p className="text-sm text-slate-400 mb-6 max-w-2xl">
              Buat dan cetak kode QR untuk ditempel di setiap meja. Pelanggan dapat memindai QR ini untuk membuka menu digital dan memesan langsung dari *smartphone* mereka.
            </p>
            
            <div className="flex items-end gap-4 max-w-md">
              <div className="flex-1">
                <label className="block text-xs font-medium text-slate-400 mb-1">Jumlah Meja</label>
                <Input 
                  type="number" 
                  value={tableCount} 
                  onChange={(e: ChangeEvent<HTMLInputElement>) => setTableCount(e.target.value)}
                  className="bg-white/5 border-white/10"
                />
              </div>
              <Button onClick={() => setShowPrintPreview(true)} className="gap-2">
                <QrCode className="size-4" /> Generate QR
              </Button>
            </div>
          </Glass>

          {showPrintPreview && (
            <Glass className="p-6 border-emerald-500/30">
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h3 className="font-semibold text-white">Preview Cetak (Meja 1 - {tableCount})</h3>
                  <p className="text-sm text-slate-400">Ukuran cetak standar: 8x8 cm (Kertas Vinyl/Art Paper)</p>
                </div>
                <div className="flex gap-2">
                  <Button variant="outline" className="gap-2">
                    <Download className="size-4" /> Download ZIP
                  </Button>
                  <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2">
                    <Printer className="size-4" /> Cetak Sekarang
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6 place-items-center bg-slate-900/50 p-6 rounded-xl border border-white/5 max-h-[600px] overflow-y-auto">
                {Array.from({ length: Math.min(parseInt(tableCount) || 0, 20) }).map((_, idx) => (
                  <QRTableCard 
                    key={idx} 
                    tableNumber={String(idx + 1)} 
                    url={`https://restoku.app/q/${idx + 1}`} 
                  />
                ))}
                {parseInt(tableCount) > 20 && (
                  <div className="col-span-full py-8 text-slate-500 italic text-sm">
                    ... dan {parseInt(tableCount) - 20} QR lainnya akan disertakan dalam file unduhan/cetak.
                  </div>
                )}
              </div>
            </Glass>
          )}
        </div>
      )}

      {activeTab === "staff" && (
        <Glass className="p-6">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h3 className="text-lg font-semibold text-white">QR Absensi Karyawan</h3>
              <p className="text-sm text-slate-400">QR Code unik per karyawan untuk scan masuk/keluar shift.</p>
            </div>
            <Button variant="outline" className="gap-2">
              <Download className="size-4" /> Export Semua
            </Button>
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {staffList.map(staff => (
              <div key={staff.id} className="p-4 bg-white/5 border border-white/10 rounded-xl flex items-center gap-4">
                <div className="bg-white p-1 rounded border border-white/20 shrink-0">
                  <QRDisplay content={`staff:${staff.id}`} size={64} />
                </div>
                <div>
                  <h4 className="font-semibold text-white">{staff.name}</h4>
                  <div className="text-xs text-slate-400 mb-1">{staff.id} • {staff.role}</div>
                  <button className="text-xs text-emerald-400 hover:text-emerald-300 flex items-center gap-1 font-medium mt-2">
                    <Printer className="size-3" /> Cetak ID Card
                  </button>
                </div>
              </div>
            ))}
          </div>
        </Glass>
      )}

      {activeTab === "menu" && (
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Glass className="p-6">
            <h3 className="text-lg font-semibold text-white mb-2">QR Menu Digital</h3>
            <p className="text-sm text-slate-400 mb-6">
              Gunakan QR ini untuk dipasang di banner depan toko, brosur, atau sosial media. Pelanggan dapat melihat menu tanpa terikat pada nomor meja tertentu.
            </p>
            
            <div className="flex flex-col items-center p-8 bg-slate-900/50 rounded-xl border border-white/5 mb-6">
              <div className="bg-white p-2 rounded-xl mb-4 shadow-xl">
                <QRDisplay content="https://restoku.app/m/sedap" size={200} includeLogo={true} />
              </div>
              <div className="font-mono text-sm text-slate-300 bg-black/40 px-3 py-1.5 rounded-lg border border-white/10">
                https://restoku.app/m/sedap
              </div>
            </div>
            
            <div className="flex gap-3 w-full">
              <Button className="flex-1 gap-2 bg-blue-600 hover:bg-blue-700 text-white">
                <Download className="size-4" /> Unduh PNG
              </Button>
              <Button className="flex-1 gap-2 bg-purple-600 hover:bg-purple-700 text-white">
                <Download className="size-4" /> Unduh SVG
              </Button>
            </div>
          </Glass>
          
          <div className="space-y-6">
            <Glass className="p-6">
              <h4 className="font-semibold text-white mb-3">Tautan Lainnya</h4>
              <div className="space-y-3">
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-xs text-slate-400 mb-1">Link Reservasi Meja</div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-200">restoku.app/r/sedap</span>
                    <button className="text-xs text-emerald-400">Copy</button>
                  </div>
                </div>
                <div className="p-3 bg-white/5 rounded-lg border border-white/10">
                  <div className="text-xs text-slate-400 mb-1">Link Delivery / Takeaway</div>
                  <div className="flex items-center justify-between">
                    <span className="text-sm text-slate-200">restoku.app/d/sedap</span>
                    <button className="text-xs text-emerald-400">Copy</button>
                  </div>
                </div>
              </div>
            </Glass>
          </div>
        </div>
      )}

    </Screen>
  );
}
