import { useState } from "react";
import { Head } from "@inertiajs/react";
import MainLayout from "../../Layouts/MainLayout";
import { Screen, Glass, Badge, formatRupiah, toneMap, cardToneMap, PlanBadge, MOCK_PLAN, MOCK_OUTLET, planHasFeature, FEATURE_LOCKS } from "../../Components/Shared";
import { QrCode, Download, Printer, MapPin } from "lucide-react";
import { ProductImage } from "../../Components/ProductImage";
import { RoleGuard } from "../../Components/RoleGuard";

function QRCodeMejaInner() {
  const [selectedTable, setSelectedTable] = useState(1);
  const tables = [...Array(20)].map((_, i) => ({ num: i + 1, url: `https://restoku.id/order?outlet=senopati&table=${i + 1}` }));
  return (
    <MainLayout>
      <Head title="QR Code Meja" />
      <Screen title="QR Code Meja" action={
      <button className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition-colors flex items-center gap-2">
        <Download className="size-4" />Unduh Semua QR
      </button>
    }>
      <div className="grid grid-cols-[1fr_320px] gap-5 items-start">
        <Glass className="p-5">
          <h2 className="text-base font-medium text-slate-200 mb-4">Pilih Meja</h2>
          <div className="grid grid-cols-5 gap-3">
            {tables.map(t => (
              <button key={t.num} onClick={() => setSelectedTable(t.num)}
                className={`rounded-xl border py-4 text-center transition-all ${selectedTable === t.num ? "bg-blue-500/15 border-blue-500/40 text-blue-200" : "border-white/5 bg-white/[0.02] text-slate-400 hover:border-white/20 hover:text-slate-200"}`}>
                <QrCode className="size-5 mx-auto mb-2 opacity-60" />
                <p className="text-sm font-semibold">Meja {t.num}</p>
              </button>
            ))}
          </div>
        </Glass>

        <div className="space-y-4 sticky top-6">
          <Glass className="p-5 flex flex-col items-center">
            <h2 className="text-base font-medium text-slate-200 mb-4">QR Code – Meja {selectedTable}</h2>
            <div className="size-48 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-lg">
              <div className="size-40 grid grid-cols-8 gap-0.5">
                {[...Array(64)].map((_, i) => (
                  <div key={i} className={`rounded-[1px] ${Math.random() > 0.5 ? "bg-slate-900" : "bg-white"}`} />
                ))}
              </div>
            </div>
            <p className="text-xs text-slate-400 text-center break-all px-2 mb-4">
              {tables[selectedTable - 1].url}
            </p>
            <div className="flex gap-2 w-full">
              <button className="flex-1 rounded-lg bg-slate-100 hover:bg-white text-slate-900 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Download className="size-4" />Download PNG
              </button>
              <button className="flex-1 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 text-slate-200 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2">
                <Printer className="size-4" />Cetak
              </button>
            </div>
          </Glass>
          <Glass className="p-4">
            <p className="text-xs font-medium text-slate-300 mb-2 flex items-center gap-2"><MapPin className="size-3.5 text-blue-400" />Cara Penggunaan</p>
            <ol className="space-y-1.5 text-xs text-slate-400 list-decimal list-inside">
              <li>Download QR dan cetak ukuran A5/A6</li>
              <li>Tempel di meja yang sesuai</li>
              <li>Pelanggan scan → buka e-menu langsung</li>
              <li>Order masuk otomatis ke dapur</li>
            </ol>
          </Glass>
        </div>
      </div>
    </Screen>
    </MainLayout>
  );
}


// --- Role Guard Wrapper -------------------------------------------------------
export default function QRCodeMeja() {
  return (
    <RoleGuard allowedRoles={["manager","owner"]} pageName="QR Code Meja" allowedRoleLabel="Manager, Owner">
      <QRCodeMejaInner />
    </RoleGuard>
  );
}