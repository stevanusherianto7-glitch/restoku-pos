import { useState } from "react";
import { Screen, Glass, Button } from "../Shared";
import { CheckCircle2, AlertTriangle, Search, Eye, MapPin } from "lucide-react";

export function ReviewAbsensi() {
  const [reviews, setReviews] = useState([
    {
      id: 1,
      name: "Budi Santoso",
      role: "Kitchen",
      time: "Hari ini, 14:55",
      type: "Clock In",
      timeStatus: "Terlambat",
      lateMinutes: 25,
      distance: 150, // meter
      status: "pending", // pending, ok, flagged
    },
    {
      id: 2,
      name: "Andi Saputra",
      role: "Waiter",
      time: "Hari ini, 09:12",
      type: "Clock In",
      timeStatus: "Tepat Waktu",
      lateMinutes: 0,
      distance: 420,
      status: "pending",
    },
    {
      id: 3,
      name: "Citra Dewi",
      role: "Cashier",
      time: "Kemarin, 22:30",
      type: "Clock Out",
      timeStatus: "Lembur",
      lateMinutes: 0,
      distance: 25, // dalam radius tapi di-flag manual/sebab lain
      status: "ok",
    }
  ]);

  const handleReview = (id: number, newStatus: "ok" | "flagged") => {
    setReviews(reviews.map(r => r.id === id ? { ...r, status: newStatus } : r));
  };

  return (
    <Screen title="Review Absensi Karyawan" action={
      <div className="relative w-64">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
        <input 
          type="text" 
          placeholder="Cari nama karyawan..." 
          className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-1.5 text-sm text-slate-200 outline-none focus:border-white/20 transition-colors"
        />
      </div>
    }>
      
      <Glass className="p-6">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h2 className="text-lg font-semibold text-white mb-1">Perlu Review (Soft-Block)</h2>
            <p className="text-sm text-slate-400">
              Absensi di bawah ini tercatat namun di luar radius toleransi lokasi outlet. Silakan periksa foto selfie untuk memverifikasi.
            </p>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse">
            <thead>
              <tr className="border-b border-white/10">
                <th className="pb-3 text-xs font-semibold text-slate-400">KARYAWAN</th>
                <th className="pb-3 text-xs font-semibold text-slate-400">TIPE & WAKTU</th>
                <th className="pb-3 text-xs font-semibold text-slate-400">JARAK DARI OUTLET</th>
                <th className="pb-3 text-xs font-semibold text-slate-400">BUKTI SELFIE</th>
                <th className="pb-3 text-xs font-semibold text-slate-400 text-right">AKSI REVIEW</th>
              </tr>
            </thead>
            <tbody>
              {reviews.map((item) => (
                <tr key={item.id} className="border-b border-white/5 last:border-0 hover:bg-white/5 transition-colors">
                  <td className="py-4">
                    <div className="font-medium text-slate-200">{item.name}</div>
                    <div className="text-xs text-slate-500">{item.role}</div>
                  </td>
                  <td className="py-4">
                    <div className="font-medium text-slate-200">{item.type}</div>
                    <div className="text-xs text-slate-500 mb-1">{item.time}</div>
                    {item.lateMinutes > 0 ? (
                      <span className="text-[10px] bg-red-500/20 text-red-400 px-1.5 py-0.5 rounded border border-red-500/30">
                        {item.timeStatus} ({item.lateMinutes} mnt)
                      </span>
                    ) : (
                      <span className="text-[10px] bg-emerald-500/20 text-emerald-400 px-1.5 py-0.5 rounded border border-emerald-500/30">
                        {item.timeStatus}
                      </span>
                    )}
                  </td>
                  <td className="py-4">
                    <div className="flex items-center gap-1.5">
                      <MapPin className={`size-4 ${item.distance > 50 ? 'text-amber-400' : 'text-emerald-400'}`} />
                      <span className={`text-sm font-medium ${item.distance > 50 ? 'text-amber-400' : 'text-emerald-400'}`}>
                        {item.distance} meter
                      </span>
                    </div>
                  </td>
                  <td className="py-4">
                    <button className="flex items-center gap-1.5 text-xs font-medium text-blue-400 hover:text-blue-300 bg-blue-500/10 hover:bg-blue-500/20 px-2.5 py-1.5 rounded-lg transition-colors border border-blue-500/20">
                      <Eye className="size-3.5" /> Lihat Foto
                    </button>
                  </td>
                  <td className="py-4 text-right">
                    {item.status === "pending" ? (
                      <div className="flex justify-end gap-2">
                        <Button 
                          onClick={() => handleReview(item.id, "flagged")}
                          className="bg-amber-500/10 hover:bg-amber-500/20 text-amber-500 border border-amber-500/20 px-3 py-1.5 h-auto text-xs"
                        >
                          Tandai Mencurigakan
                        </Button>
                        <Button 
                          onClick={() => handleReview(item.id, "ok")}
                          className="bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border border-emerald-500/20 px-3 py-1.5 h-auto text-xs"
                        >
                          Tandai OK
                        </Button>
                      </div>
                    ) : item.status === "ok" ? (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-emerald-400 bg-emerald-500/10 px-2.5 py-1 rounded-full border border-emerald-500/20">
                        <CheckCircle2 className="size-3.5" /> Telah Disetujui
                      </span>
                    ) : (
                      <span className="inline-flex items-center gap-1.5 text-xs font-medium text-amber-500 bg-amber-500/10 px-2.5 py-1 rounded-full border border-amber-500/20">
                        <AlertTriangle className="size-3.5" /> Mencurigakan
                      </span>
                    )}
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
