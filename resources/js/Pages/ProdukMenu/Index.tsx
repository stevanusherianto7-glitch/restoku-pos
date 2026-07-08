import { Head } from "@inertiajs/react";
import MainLayout from "../../Layouts/MainLayout";
import { Screen, Glass, Badge, formatRupiah, toneMap, cardToneMap, PlanBadge, MOCK_PLAN, MOCK_OUTLET, planHasFeature, FEATURE_LOCKS } from "../../Components/Shared";
import { DollarSign, Utensils, Package, Users, Search, Clock3, CheckCheck, Plus, SlidersHorizontal, ArrowDownToLine, Smartphone, QrCode, UserPlus, FileText, ChevronRight, Calculator, AlertTriangle, MessageSquare, TicketPercent, CheckCircle2, RefreshCcw, Download, DownloadCloud, Volume2 } from "lucide-react";
import { ProductImage } from "../../Components/ProductImage";
import { RoleGuard } from "../../Components/RoleGuard";

function ProdukMenuInner() {
  return (
    <MainLayout>
      <Head title="Produk & Menu" />
      <Screen title="Produk & Menu" action={
      <button className="rounded-lg bg-slate-100 hover:bg-white text-slate-900 px-4 py-2 text-sm font-medium transition-colors flex items-center gap-2">
        <Plus className="size-4" />Tambah Menu
      </button>
    }>
      <Glass className="p-5">
        <table className="w-full text-left text-sm">
          <thead className="border-b border-white/5 text-slate-400">
            <tr>
              <th className="pb-3 font-medium">Nama Menu</th>
              <th className="pb-3 font-medium">Kategori</th>
              <th className="pb-3 font-medium">Harga Jual</th>
              <th className="pb-3 font-medium">HPP</th>
              <th className="pb-3 font-medium">Margin</th>
              <th className="pb-3 font-medium">Status</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-white/5">
            {[
              { name: "Nasi Goreng Spesial", cat: "Makanan", price: 25000, hpp: 8000 },
              { name: "Ayam Geprek", cat: "Makanan", price: 28000, hpp: 10000 },
              { name: "Es Teh Manis", cat: "Minuman", price: 5000, hpp: 1200 },
              { name: "Kopi Susu Aren", cat: "Minuman", price: 18000, hpp: 5000 },
              { name: "Pisang Goreng", cat: "Snack", price: 10000, hpp: 3000 },
              { name: "Sate Ayam Madura", cat: "Makanan", price: 35000, hpp: 12000 },
            ].map((item, i) => {
              const margin = Math.round(((item.price - item.hpp) / item.price) * 100);
              return (
                <tr key={i} className="group">
                  <td className="py-3 font-medium flex items-center gap-3 text-slate-200">
                    <div className="size-8 rounded-lg bg-white/5 border border-white/10 flex items-center justify-center">
                      <Utensils className="size-3.5 text-slate-500" />
                    </div>
                    {item.name}
                  </td>
                  <td className="py-3 text-slate-400">{item.cat}</td>
                  <td className="py-3 font-mono text-slate-300">{formatRupiah(item.price)}</td>
                  <td className="py-3 font-mono text-slate-400">{formatRupiah(item.hpp)}</td>
                  <td className="py-3"><Badge tone={margin > 60 ? "emerald" : margin > 40 ? "blue" : "amber"}>{margin}%</Badge></td>
                  <td className="py-3"><Badge tone="emerald">Aktif</Badge></td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </Glass>
    </Screen>
    </MainLayout>
  );
}


// --- Role Guard Wrapper -------------------------------------------------------
export default function ProdukMenu() {
  return (
    <RoleGuard allowedRoles={["manager","owner"]} pageName="Produk & Menu" allowedRoleLabel="Manager, Owner">
      <ProdukMenuInner />
    </RoleGuard>
  );
}