import { useState } from "react";
import { Screen, Glass, Button } from "../Shared";
import { CalendarDays, Save, Upload, UserPlus, AlertTriangle, CheckCircle2, MoreHorizontal } from "lucide-react";

export function ShiftManager() {
  const [selectedWeek, setSelectedWeek] = useState("06 Jul - 12 Jul 2026");
  
  const days = ["Senin 6", "Selasa 7", "Rabu 8", "Kamis 9", "Jumat 10", "Sabtu 11", "Minggu 12"];
  
  // Dummy data
  const scheduleData = {
    Pagi: {
      time: "08:00 - 16:00",
      tolerance: "15 menit",
      roles: {
        Waiter: ["Budi", "Budi", "Citra", "", "", "Budi", ""],
        Kitchen: ["Joko", "Joko", "Joko", "Joko", "Joko", "Joko", "Joko"],
        Cashier: ["Sari", "Sari", "Sari", "Sari", "Sari", "Sari", "Sari"]
      }
    },
    Siang: {
      time: "15:00 - 23:00",
      tolerance: "15 menit",
      roles: {
        Waiter: ["Aji, Ria", "Aji, Ria", "Aji, Citra", "Ria", "Aji", "Aji, Ria", "Aji, Ria"],
        Kitchen: ["Eko, Tia", "Eko, Tia", "Eko, Tia", "Eko", "Eko, Tia", "Eko, Tia", "Eko, Tia"],
        Cashier: ["Dewi", "Dewi", "Dewi", "Dewi", "Dewi", "Dewi", "Dewi"]
      }
    }
  };

  const getAlert = (shift: keyof typeof scheduleData, role: string, dayIdx: number) => {
    const val = scheduleData[shift].roles[role as "Waiter"|"Kitchen"|"Cashier"][dayIdx];
    if (!val) return true; // Empty
    return false;
  };

  return (
    <Screen title="Jadwal Shift Karyawan" action={
      <div className="flex gap-2">
        <Button variant="outline" className="gap-2 text-xs">
          <CalendarDays className="size-4" /> Minggu Ini
        </Button>
        <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2 text-xs">
          <Upload className="size-4" /> Publikasikan Jadwal
        </Button>
      </div>
    }>
      
      <Glass className="p-6">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-4">
            <h3 className="font-semibold text-white">Minggu: {selectedWeek}</h3>
            <span className="bg-yellow-500/20 text-yellow-500 border border-yellow-500/30 px-3 py-1 text-xs rounded-full flex items-center gap-1">
              <AlertTriangle className="size-3" /> Draft (Belum Dipublikasi)
            </span>
          </div>
          <div className="flex gap-2 text-xs">
            <Button variant="outline" className="gap-2 bg-white/5 border-white/10 text-slate-300">
              <Save className="size-3" /> Simpan Draft
            </Button>
          </div>
        </div>

        <div className="overflow-x-auto custom-scrollbar pb-4">
          <table className="w-full text-sm text-left border-collapse min-w-[800px]">
            <thead>
              <tr className="border-b border-white/10 text-slate-400">
                <th className="p-3 font-medium w-32">Shift / Role</th>
                {days.map(d => (
                  <th key={d} className="p-3 font-medium text-center min-w-[120px]">{d}</th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {Object.entries(scheduleData).map(([shiftName, data]) => (
                <optgroup key={shiftName} label={shiftName} className="bg-transparent">
                  <tr className="bg-white/5">
                    <td colSpan={8} className="p-3">
                      <div className="flex items-center gap-2">
                        <span className="font-bold text-emerald-400">Shift {shiftName}</span>
                        <span className="text-xs text-slate-400">({data.time} | Toleransi Telat: {data.tolerance})</span>
                      </div>
                    </td>
                  </tr>
                  {Object.entries(data.roles).map(([roleName, assigned]) => (
                    <tr key={`${shiftName}-${roleName}`} className="hover:bg-white/5 transition-colors">
                      <td className="p-3 text-slate-300 flex items-center gap-2">
                        <span className="w-1.5 h-1.5 rounded-full bg-slate-500"></span> {roleName}
                      </td>
                      {assigned.map((staff, idx) => (
                        <td key={idx} className="p-2 border-l border-white/5 text-center">
                          {staff ? (
                            <div className="bg-white/10 border border-white/20 rounded-lg p-2 flex flex-col items-center gap-1 cursor-pointer hover:bg-white/15 transition-colors relative group">
                              <span className="text-white font-medium text-xs text-center leading-tight">
                                {staff.split(',').map((s, i) => <div key={i}>{s}</div>)}
                              </span>
                              <div className="absolute inset-0 bg-black/60 rounded-lg opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                                <MoreHorizontal className="size-4 text-white" />
                              </div>
                            </div>
                          ) : (
                            <div className={`border border-dashed rounded-lg p-3 flex flex-col items-center justify-center cursor-pointer transition-colors ${getAlert(shiftName as keyof typeof scheduleData, roleName, idx) ? 'border-red-500/50 hover:bg-red-500/10' : 'border-white/20 hover:bg-white/5'}`}>
                              {getAlert(shiftName as keyof typeof scheduleData, roleName, idx) ? (
                                <AlertTriangle className="size-4 text-red-400 mb-1" />
                              ) : (
                                <UserPlus className="size-4 text-slate-500 mb-1" />
                              )}
                              <span className={getAlert(shiftName as keyof typeof scheduleData, roleName, idx) ? 'text-[10px] text-red-400' : 'text-[10px] text-slate-500'}>Isi Slot</span>
                            </div>
                          )}
                        </td>
                      ))}
                    </tr>
                  ))}
                </optgroup>
              ))}
            </tbody>
          </table>
        </div>
        
        <div className="mt-6 flex gap-4 text-xs">
          <div className="flex items-center gap-2 text-slate-400">
            <AlertTriangle className="size-4 text-red-400" /> Kurang Waiter (Kamis, Jumat)
          </div>
          <div className="flex items-center gap-2 text-slate-400">
            <CheckCircle2 className="size-4 text-emerald-400" /> Cashier & Kitchen Lengkap
          </div>
        </div>
      </Glass>
    </Screen>
  );
}
