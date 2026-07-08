import { useState } from "react";
import { Screen, Glass, Badge, Button, Input, formatRupiah as formatRp } from "../Shared";
import { Search, AlertTriangle, PackageX, CheckCircle2, PackageSearch } from "lucide-react";

export function DashboardInventory() {
  const summary = [
    { label: "Total Item", value: 250, icon: PackageSearch, color: "text-blue-400", bg: "bg-blue-500/10" },
    { label: "Stok Aman", value: 232, icon: CheckCircle2, color: "text-emerald-400", bg: "bg-emerald-500/10" },
    { label: "Hampir Habis", value: 15, icon: AlertTriangle, color: "text-amber-400", bg: "bg-amber-500/10" },
    { label: "Stok Habis", value: 3, icon: PackageX, color: "text-red-400", bg: "bg-red-500/10" },
  ];

  const stockAlerts = [
    { id: 1, name: "Beras Premium", stock: 25, min: 10, unit: "kg", cost: 12000, status: "safe" },
    { id: 2, name: "Daging Ayam", stock: 3, min: 5, unit: "kg", cost: 35000, status: "warning" },
    { id: 3, name: "Minyak Goreng", stock: 0, min: 10, unit: "liter", cost: 18000, status: "danger" },
    { id: 4, name: "Telur Ayam", stock: 12, min: 30, unit: "butir", cost: 2000, status: "warning" },
    { id: 5, name: "Garam", stock: 0, min: 2, unit: "kg", cost: 10000, status: "danger" },
    { id: 6, name: "Bawang Merah", stock: 1, min: 3, unit: "kg", cost: 30000, status: "warning" },
    { id: 7, name: "Saus Sambal", stock: 0, min: 5, unit: "botol", cost: 15000, status: "danger" },
  ];


  return (
    <Screen title="Dasbor Stok & Inventaris">
      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
        {summary.map((item, i) => (
          <Glass key={i} className="p-4 flex items-center justify-between">
            <div>
              <p className="text-sm text-slate-400 mb-1">{item.label}</p>
              <h3 className="text-3xl font-bold text-white">{item.value}</h3>
            </div>
            <div className={`p-3 rounded-xl ${item.bg}`}>
              <item.icon className={`size-6 ${item.color}`} />
            </div>
          </Glass>
        ))}
      </div>

      {/* Main Content */}
      <Glass className="p-6">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 mb-6">
          <h2 className="text-lg font-semibold text-white">Status Stok Bahan Baku</h2>
          <div className="flex gap-2">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-4 text-slate-400" />
              <Input placeholder="Cari bahan baku..." className="pl-9 w-full md:w-64" />
            </div>
            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
              <option value="all">Semua Kategori</option>
              <option value="fresh">Bahan Segar</option>
              <option value="dry">Bahan Kering</option>
              <option value="spice">Bumbu</option>
            </select>
            <select className="bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-sm text-white focus:outline-none focus:border-blue-500">
              <option value="all">Semua Status</option>
              <option value="danger">Stok Habis</option>
              <option value="warning">Hampir Habis</option>
              <option value="safe">Stok Aman</option>
            </select>
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm text-slate-300">
            <thead className="text-xs text-slate-400 uppercase bg-white/5">
              <tr>
                <th className="px-4 py-3 rounded-tl-lg">Nama Bahan</th>
                <th className="px-4 py-3">Stok Saat Ini</th>
                <th className="px-4 py-3">Batas Minimum</th>
                <th className="px-4 py-3">Harga Rata-Rata</th>
                <th className="px-4 py-3 text-center rounded-tr-lg">Status</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              {stockAlerts.map((item) => (
                <tr key={item.id} className="hover:bg-white/5 transition-colors">
                  <td className="px-4 py-3 font-medium text-white">{item.name}</td>
                  <td className="px-4 py-3">
                    <span className={`font-semibold ${item.status === 'danger' ? 'text-red-400' : item.status === 'warning' ? 'text-amber-400' : 'text-slate-200'}`}>
                      {item.stock}
                    </span> <span className="text-slate-500">{item.unit}</span>
                  </td>
                  <td className="px-4 py-3">{item.min} <span className="text-slate-500">{item.unit}</span></td>
                  <td className="px-4 py-3">{formatRp(item.cost)}<span className="text-slate-500 text-xs">/{item.unit}</span></td>
                  <td className="px-4 py-3 text-center">
                    {item.status === "danger" && <Badge tone="red">Habis</Badge>}
                    {item.status === "warning" && <Badge tone="amber">Hampir Habis</Badge>}
                    {item.status === "safe" && <Badge tone="emerald">Aman</Badge>}
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
