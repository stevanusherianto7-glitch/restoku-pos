import { useState } from "react";
import { Screen, Glass, Badge, Button, Input } from "../Shared";
import { Search, Plus, FileDown, FileUp, ClipboardList, RotateCcw, Filter, ChevronDown, CheckCircle2 } from "lucide-react";

export function StockMovement({ initialTab = "riwayat" }: { initialTab?: "riwayat" | "masuk" | "waste" | "opname" }) {
  const [activeTab, setActiveTab] = useState(initialTab);

  const transactions = [
    { id: "TRX-001", date: "12 Jul 2026 08:30", type: "in", ingredient: "Beras Premium", qty: 50, balance: 50, unit: "kg", pic: "Andi (Admin)", note: "PO-202607-01", cost: 12000 },
    { id: "TRX-002", date: "12 Jul 2026 14:15", type: "out", ingredient: "Beras Premium", qty: 5, balance: 45, unit: "kg", pic: "System", note: "Auto-deduct Order #1002", cost: 12000 },
    { id: "TRX-003", date: "11 Jul 2026 20:00", type: "waste", ingredient: "Telur Ayam", qty: 2, balance: 28, unit: "butir", pic: "Budi (Kitchen)", note: "Pecah saat dipindah", cost: 2000 },
    { id: "TRX-004", date: "10 Jul 2026 23:30", type: "adjustment", ingredient: "Minyak Goreng", qty: -1, balance: 9, unit: "liter", pic: "Andi (Admin)", note: "Hasil Opname Mingguan", cost: 18000 },
  ];

  const opnames = [
    { id: "OPN-001", title: "Opname Mingguan", date: "10 Jul 2026", status: "completed", pic: "Andi (Admin)", discrepancy: 1 },
    { id: "OPN-002", title: "Opname Bulanan (Bahan Segar)", date: "30 Jun 2026", status: "completed", pic: "Andi (Admin)", discrepancy: 0 },
    { id: "OPN-003", title: "Opname Mingguan", date: "17 Jul 2026", status: "draft", pic: "-", discrepancy: 0 },
  ];

  const getTypeBadge = (type: string) => {
    switch (type) {
      case "in": return <Badge tone="emerald">Masuk (In)</Badge>;
      case "out": return <Badge tone="blue">Keluar (Out)</Badge>;
      case "waste": return <Badge tone="red">Rusak (Waste)</Badge>;
      case "adjustment": return <Badge tone="amber">Adjustment</Badge>;
      default: return <Badge tone="slate">{type}</Badge>;
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "completed": return <Badge tone="emerald">Selesai</Badge>;
      case "in_progress": return <Badge tone="blue">Berjalan</Badge>;
      case "draft": return <Badge tone="slate">Draft</Badge>;
      default: return <Badge tone="slate">{status}</Badge>;
    }
  };

  return (
    <Screen title="Mutasi Stok & Opname">
      
      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/10 mb-6 pb-px overflow-x-auto">
        <button 
          onClick={() => setActiveTab("riwayat")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'riwayat' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <RotateCcw className="size-4" /> Riwayat Mutasi
        </button>
        <button 
          onClick={() => setActiveTab("masuk")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'masuk' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <FileDown className="size-4" /> Barang Masuk (PO)
        </button>
        <button 
          onClick={() => setActiveTab("waste")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'waste' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <FileUp className="size-4" /> Barang Keluar / Rusak
        </button>
        <button 
          onClick={() => setActiveTab("opname")}
          className={`flex items-center gap-2 px-4 py-3 text-sm font-medium border-b-2 transition-colors whitespace-nowrap ${activeTab === 'opname' ? 'border-blue-500 text-blue-400' : 'border-transparent text-slate-400 hover:text-slate-200'}`}
        >
          <ClipboardList className="size-4" /> Stock Opname
        </button>
      </div>

      <Glass className="p-6">
        
        {/* Toolbar */}
        <div className="flex flex-col md:flex-row gap-4 mb-6 md:items-center justify-between">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
            <Input placeholder={`Cari data...`} className="pl-9 w-full md:w-80" />
          </div>
          <div className="flex gap-2">
            {activeTab === "riwayat" && (
              <>
                <Button variant="outline" className="gap-2"><Filter className="size-4" /> Filter Jenis</Button>
                <Button variant="outline" className="gap-2">Export Data</Button>
              </>
            )}
            {activeTab === "masuk" && (
              <Button className="gap-2"><Plus className="size-4" /> Catat Barang Masuk</Button>
            )}
            {activeTab === "waste" && (
              <Button className="gap-2"><Plus className="size-4" /> Catat Barang Rusak</Button>
            )}
            {activeTab === "opname" && (
              <Button className="gap-2"><Plus className="size-4" /> Mulai Opname Baru</Button>
            )}
          </div>
        </div>

        {/* Tables */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-white/5">
              {activeTab === "riwayat" && (
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">Waktu</th>
                  <th className="px-4 py-3">ID Transaksi</th>
                  <th className="px-4 py-3">Bahan Baku</th>
                  <th className="px-4 py-3">Jenis Mutasi</th>
                  <th className="px-4 py-3">Mutasi (Qty)</th>
                  <th className="px-4 py-3">Saldo Akhir</th>
                  <th className="px-4 py-3">Referensi / Catatan</th>
                  <th className="px-4 py-3 text-center rounded-tr-lg">PIC</th>
                </tr>
              )}
              {activeTab === "opname" && (
                <tr>
                  <th className="px-4 py-3 rounded-tl-lg">ID Opname</th>
                  <th className="px-4 py-3">Judul / Sesi</th>
                  <th className="px-4 py-3">Tanggal</th>
                  <th className="px-4 py-3">Selisih Item</th>
                  <th className="px-4 py-3">Status</th>
                  <th className="px-4 py-3 text-center rounded-tr-lg">Aksi</th>
                </tr>
              )}
              {(activeTab === "masuk" || activeTab === "waste") && (
                <tr>
                  <td colSpan={7} className="px-4 py-8 text-center text-slate-500">
                    <div className="flex flex-col items-center gap-2">
                      {activeTab === "masuk" ? <FileDown className="size-8 text-slate-600" /> : <FileUp className="size-8 text-slate-600" />}
                      <p>Silakan klik tombol "Catat {activeTab === "masuk" ? "Barang Masuk" : "Barang Rusak"}" untuk menambah data.</p>
                    </div>
                  </td>
                </tr>
              )}
            </thead>
            <tbody className="divide-y divide-white/5">
              {activeTab === "riwayat" && transactions.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 whitespace-nowrap text-slate-400">{item.date}</td>
                  <td className="px-4 py-3 font-medium text-white">{item.id}</td>
                  <td className="px-4 py-3">{item.ingredient}</td>
                  <td className="px-4 py-3">{getTypeBadge(item.type)}</td>
                  <td className={`px-4 py-3 font-semibold ${item.type === 'in' ? 'text-emerald-400' : item.type === 'out' || item.type === 'waste' ? 'text-red-400' : 'text-amber-400'}`}>
                    {item.type === 'in' ? '+' : '-'}{Math.abs(item.qty)} {item.unit}
                  </td>
                  <td className="px-4 py-3 font-mono text-slate-300">
                    {item.balance} {item.unit}
                  </td>
                  <td className="px-4 py-3 text-slate-400 text-xs">{item.note}</td>
                  <td className="px-4 py-3 text-center text-slate-400">{item.pic}</td>
                </tr>
              ))}

              {activeTab === "opname" && opnames.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{item.id}</td>
                  <td className="px-4 py-3">{item.title}</td>
                  <td className="px-4 py-3 text-slate-400">{item.date}</td>
                  <td className="px-4 py-3">
                    {item.discrepancy > 0 ? (
                      <span className="text-amber-400 font-medium">{item.discrepancy} item beda</span>
                    ) : (
                      <span className="text-emerald-400 font-medium flex items-center gap-1"><CheckCircle2 className="size-4" /> Cocok</span>
                    )}
                  </td>
                  <td className="px-4 py-3">{getStatusBadge(item.status)}</td>
                  <td className="px-4 py-3 text-center">
                    <Button variant="outline" size="sm">Detail</Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Glass>
    </Screen>
  );
}
