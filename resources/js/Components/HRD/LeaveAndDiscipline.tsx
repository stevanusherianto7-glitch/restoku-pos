import React, { useState } from "react";
import { Screen, Glass, Badge, Button } from "../Shared";
import { 
  CalendarOff, ShieldAlert, FileText, CheckCircle2, AlertTriangle, Plus
} from "lucide-react";

export function LeaveAndDiscipline() {
  const [activeTab, setActiveTab] = useState<"cuti" | "sp">("cuti");

  return (
    <Screen 
      title="Manajemen Cuti & Kedisiplinan"
      actions={
        activeTab === "cuti" ? (
          <Button><CalendarOff className="size-4 mr-2" /> Ajukan Cuti</Button>
        ) : (
          <Button className="bg-red-500 hover:bg-red-600"><ShieldAlert className="size-4 mr-2" /> Terbitkan SP</Button>
        )
      }
    >
      <div className="flex gap-4 mb-6">
        <button 
          onClick={() => setActiveTab("cuti")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "cuti" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}
        >
          Cuti & Izin
        </button>
        <button 
          onClick={() => setActiveTab("sp")}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${activeTab === "sp" ? "bg-white/10 text-white" : "text-slate-400 hover:text-white"}`}
        >
          Kedisiplinan (SP)
        </button>
      </div>

      {activeTab === "cuti" && (
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <Glass className="p-5">
            <h3 className="font-semibold text-white mb-4">Ringkasan Cuti Hari Ini</h3>
            <div className="space-y-4">
              <div className="bg-amber-500/10 border border-amber-500/20 p-3 rounded-lg flex items-start gap-3">
                <div className="size-8 rounded-full bg-slate-700 shrink-0 flex items-center justify-center text-white text-xs font-bold">BS</div>
                <div>
                  <div className="text-white text-sm font-medium">Budi Santoso</div>
                  <div className="text-amber-400 text-xs">Cuti Sakit (Hari ke-1)</div>
                </div>
              </div>
              <div className="bg-blue-500/10 border border-blue-500/20 p-3 rounded-lg flex items-start gap-3">
                <div className="size-8 rounded-full bg-slate-700 shrink-0 flex items-center justify-center text-white text-xs font-bold">SP</div>
                <div>
                  <div className="text-white text-sm font-medium">Sari Pertiwi</div>
                  <div className="text-blue-400 text-xs">Cuti Tahunan (s/d 15 Jul)</div>
                </div>
              </div>
            </div>
          </Glass>
          
          <Glass className="p-0 overflow-hidden md:col-span-2">
            <div className="p-4 border-b border-white/5">
              <h3 className="font-semibold text-white">Sisa Kuota Cuti Karyawan (2026)</h3>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Nama Karyawan</th>
                  <th className="px-4 py-3 font-medium text-center">Cuti Tahunan</th>
                  <th className="px-4 py-3 font-medium text-center">Cuti Sakit</th>
                  <th className="px-4 py-3 font-medium text-center">Cuti Penting</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {[
                  { name: "Budi Hartono", annual: "12/12", sick: "12/14", important: "3/3" },
                  { name: "Sari Pertiwi", annual: "8/12", sick: "14/14", important: "3/3" },
                  { name: "Andi Saputra", annual: "0/0 (Probation)", sick: "14/14", important: "0/0" }
                ].map((emp, i) => (
                  <tr key={i} className="hover:bg-white/[0.02]">
                    <td className="px-4 py-3 text-white">{emp.name}</td>
                    <td className="px-4 py-3 text-center text-slate-300">{emp.annual}</td>
                    <td className="px-4 py-3 text-center text-slate-300">{emp.sick}</td>
                    <td className="px-4 py-3 text-center text-slate-300">{emp.important}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </Glass>
        </div>
      )}

      {activeTab === "sp" && (
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <Glass className="p-4 flex justify-between items-center border-amber-500/30">
              <div><p className="text-slate-400 text-sm">SP 1 (Lisan/Tertulis)</p><p className="text-xl font-bold text-amber-400">3</p></div>
              <AlertTriangle className="size-8 text-amber-500/20" />
            </Glass>
            <Glass className="p-4 flex justify-between items-center border-orange-500/30">
              <div><p className="text-slate-400 text-sm">SP 2</p><p className="text-xl font-bold text-orange-400">1</p></div>
              <AlertTriangle className="size-8 text-orange-500/20" />
            </Glass>
            <Glass className="p-4 flex justify-between items-center border-red-500/30">
              <div><p className="text-slate-400 text-sm">SP 3 / Skorsing</p><p className="text-xl font-bold text-red-500">0</p></div>
              <ShieldAlert className="size-8 text-red-500/20" />
            </Glass>
            <Glass className="p-4 flex justify-between items-center border-slate-500/30">
              <div><p className="text-slate-400 text-sm">PHK / Terminasi</p><p className="text-xl font-bold text-slate-300">0</p></div>
              <FileText className="size-8 text-slate-500/20" />
            </Glass>
          </div>

          <Glass className="p-0 overflow-hidden">
            <div className="p-4 border-b border-white/5">
              <h3 className="font-semibold text-white">Log Surat Peringatan (SP)</h3>
            </div>
            <table className="w-full text-left text-sm">
              <thead className="bg-white/5 text-slate-400">
                <tr>
                  <th className="px-4 py-3 font-medium">Karyawan</th>
                  <th className="px-4 py-3 font-medium">Tingkat SP</th>
                  <th className="px-4 py-3 font-medium">Tgl Insiden</th>
                  <th className="px-4 py-3 font-medium">Pelanggaran</th>
                  <th className="px-4 py-3 font-medium">Dikeluarkan Oleh</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                <tr className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white">Andi Saputra</td>
                  <td className="px-4 py-3"><Badge tone="amber">SP 1</Badge></td>
                  <td className="px-4 py-3 text-slate-400">02 Jul 2026</td>
                  <td className="px-4 py-3 text-slate-300">Terlambat masuk shift &gt; 3x dalam 1 bulan</td>
                  <td className="px-4 py-3 text-slate-400">Manager HRD</td>
                </tr>
                <tr className="hover:bg-white/[0.02]">
                  <td className="px-4 py-3 text-white">Sari Pertiwi</td>
                  <td className="px-4 py-3"><Badge tone="orange">SP 2</Badge></td>
                  <td className="px-4 py-3 text-slate-400">15 Jun 2026</td>
                  <td className="px-4 py-3 text-slate-300">Merokok di area dapur (Safety violation)</td>
                  <td className="px-4 py-3 text-slate-400">Store Manager</td>
                </tr>
              </tbody>
            </table>
          </Glass>
        </div>
      )}
    </Screen>
  );
}
