import React from "react";
import { X, Download, Printer } from "lucide-react";
import { Button } from "../Shared";

interface DigitalReceiptPreviewProps {
  onClose: () => void;
  config: {
    header: string;
    footer: string;
    showNpwp: boolean;
    showNib: boolean;
    showServiceCharge: boolean;
    showPbjt: boolean;
    paperWidth: "58mm" | "80mm";
    fontType: "font-a" | "font-b" | "font-c";
    printDensity: "normal" | "medium" | "dark";
    autoWriteCashier: boolean;
  };
}

export function DigitalReceiptPreview({ onClose, config }: DigitalReceiptPreviewProps) {
  const widthClass = config.paperWidth === "58mm" ? "w-[300px]" : "w-[400px]";

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
      <div className={`bg-white rounded-xl shadow-2xl overflow-hidden flex flex-col max-h-[90vh] ${widthClass}`}>
        
        {/* Modal Header */}
        <div className="bg-slate-100 p-4 flex justify-between items-center border-b">
          <h3 className="font-bold text-slate-800">Pratinjau Struk ({config.paperWidth})</h3>
          <button onClick={onClose} className="text-slate-500 hover:text-slate-800 transition-colors">
            <X className="size-5" />
          </button>
        </div>

        {/* Receipt Content (Scrollable) */}
        <div className="p-6 overflow-y-auto custom-scrollbar bg-slate-50 flex justify-center">
          {(() => {
            // Auto Write Cashier Name
            let cashierName = "Kasir Umum";
            if (config.autoWriteCashier) {
              const activeKaryawanStr = localStorage.getItem("activeKaryawan");
              if (activeKaryawanStr) {
                try {
                  cashierName = JSON.parse(activeKaryawanStr).name;
                } catch (e) {
                  cashierName = "Kasir Utama";
                }
              } else {
                cashierName = "Kasir Utama";
              }
            }

            // Font styles mapping
            let fontStyleClass = "font-mono text-xs";
            if (config.fontType === "font-b") {
              fontStyleClass = "font-mono text-[10px] tracking-tight leading-relaxed";
            } else if (config.fontType === "font-c") {
              fontStyleClass = "font-mono text-[9px] tracking-tighter leading-snug";
            }

            // Print density mapping
            let densityClass = "text-slate-800";
            if (config.printDensity === "medium") {
              densityClass = "text-slate-900 font-medium";
            } else if (config.printDensity === "dark") {
              densityClass = "text-slate-950 font-bold";
            }

            return (
              <div 
                className={`bg-white p-5 shadow-sm border border-slate-200 leading-relaxed select-none ${fontStyleClass} ${densityClass}`} 
                style={{ width: config.paperWidth === "58mm" ? "250px" : "320px" }}
              >
                {/* Receipt Header */}
                <div className="text-center space-y-0.5 mb-2">
                  <div className="font-bold text-sm text-black">{config.header || "Pawon Salam"}</div>
                  <div className="text-[10px] text-black">Jl. Pertanian No. 57, Lebak Bulus, Jak-Sel</div>
                  <div className="text-[10px] text-black">WA: 0895-3763-48626</div>
                  {config.showNpwp && <div className="text-[9px] text-black">NPWP: 01.234.567.8-012.000</div>}
                  {config.showNib && <div className="text-[9px] text-black">NIB: 9120123456789</div>}
                </div>

                <div className="border-b border-black/40 border-dashed my-1.5"></div>

                {/* Metadata */}
                <div className="text-[10px] space-y-0.5 text-black">
                  <div className="flex"><span className="w-14">Tgl</span><span>: {new Date().toLocaleDateString("id-ID", { day: '2-digit', month: 'numeric', year: 'numeric' })}</span></div>
                  <div className="flex"><span className="w-14">Jam</span><span>: {new Date().toLocaleTimeString("id-ID", { hour: '2-digit', minute: '2-digit' })} WIB</span></div>
                  <div className="flex"><span className="w-14">No</span><span>: #MP9S13Z4</span></div>
                  <div className="flex"><span className="w-14">Kasir</span><span>: {cashierName || "Verena"}</span></div>
                  <div className="flex"><span className="w-14">Meja</span><span>: Meja 5 (DINE-IN)</span></div>
                </div>

                <div className="border-b border-black/40 border-dashed my-1.5"></div>

                {/* Column Header */}
                <div className="flex justify-between font-bold text-[10px] uppercase text-black">
                  <span className="flex-1">Item</span>
                  <span className="w-8 text-center">Qty</span>
                  <span className="w-16 text-right">Harga</span>
                  <span className="w-16 text-right">Total</span>
                </div>
                <div className="border-b border-black/40 border-dashed my-1.5"></div>

                {/* Items */}
                <div className="space-y-1.5 text-[10px] text-black">
                  <div>
                    <div className="flex justify-between font-bold">
                      <span className="flex-1 truncate pr-1">BAKMI GORENG JAWA</span>
                      <span className="w-8 text-center">1</span>
                      <span className="w-16 text-right">24.000</span>
                      <span className="w-16 text-right">24.000</span>
                    </div>
                  </div>
                  <div>
                    <div className="flex justify-between font-bold">
                      <span className="flex-1 truncate pr-1">NASI GORENG KAMPUNG</span>
                      <span className="w-8 text-center">1</span>
                      <span className="w-16 text-right">31.000</span>
                      <span className="w-16 text-right">31.000</span>
                    </div>
                  </div>
                </div>

                <div className="border-b border-black/40 border-dashed my-1.5"></div>

                {/* Totals */}
                <div className="space-y-1 text-[10px] text-black">
                  <div className="flex justify-between">
                    <span>Subtotal:</span>
                    <span>55.000</span>
                  </div>
                  {config.showPbjt && (
                    <div className="flex justify-between">
                      <span>PBJT 10%:</span>
                      <span>5.500</span>
                    </div>
                  )}
                  {config.showServiceCharge && (
                    <div className="flex justify-between">
                      <span>Service Charge 5%:</span>
                      <span>2.750</span>
                    </div>
                  )}
                  <div className="flex justify-between font-bold text-[11px] pt-0.5">
                    <span>TOTAL:</span>
                    <span>{config.showPbjt || config.showServiceCharge ? "63.250" : "55.000"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Metode:</span>
                    <span>QRIS</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Bayar:</span>
                    <span>{config.showPbjt || config.showServiceCharge ? "63.250" : "55.000"}</span>
                  </div>
                  <div className="flex justify-between">
                    <span>Kembali:</span>
                    <span>0</span>
                  </div>
                </div>

                <div className="border-b border-black/40 border-dashed my-1.5"></div>

                {/* Footer */}
                <div className="text-center text-[10px] text-black space-y-0.5 pt-1 font-bold leading-tight whitespace-pre-line">
                  {config.footer || "Dukung UMKM Indonesia\nTulang Punggung\nEkonomi Nasional"}
                </div>
              </div>
            );
          })()}
        </div>

        {/* Modal Footer Actions */}
        <div className="p-4 bg-slate-100 border-t flex gap-3 justify-center">
          <Button variant="outline" className="text-slate-700 border-slate-300 hover:bg-slate-200 gap-2" onClick={onClose}>
            <Download className="size-4" /> Download PDF
          </Button>
          <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2 text-white" onClick={onClose}>
            <Printer className="size-4" /> Cetak (Tes)
          </Button>
        </div>

      </div>
    </div>
  );
}
