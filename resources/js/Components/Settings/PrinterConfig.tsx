import { useState, useEffect } from "react";
import { Screen, Glass, Button, useTenantSettings } from "../Shared";
import { Printer, Bluetooth, Wifi, Usb, Save, Settings2, FileText, CheckCircle2 } from "lucide-react";
import { DigitalReceiptPreview } from "./DigitalReceiptPreview";

export function PrinterConfig() {
  const [activeTab, setActiveTab] = useState<"kasir" | "dapur" | "receipt">("kasir");
  const [showPreview, setShowPreview] = useState(false);
  const [saved, setSaved] = useState(false);
  const { isLight } = useTenantSettings();

  // Config States
  const [kasirConfig, setKasirConfig] = useState({
    enabled: true,
    connection: "bluetooth",
    port: "COM4",
    autoCut: true,
  });

  const [dapurConfig, setDapurConfig] = useState({
    enabled: true,
    connection: "network",
    ip: "192.168.1.100",
  });

  const [receiptConfig, setReceiptConfig] = useState({
    header: "RUMAH MAKAN SEDAP",
    footer: "Terima kasih sudah makan di tempat kami!\nBesar harapan kami untuk kembali lagi.",
    showNpwp: true,
    showNib: true,
    showServiceCharge: true,
    showPbjt: true,
    paperWidth: "80mm" as "58mm" | "80mm",
    fontType: "font-a" as "font-a" | "font-b" | "font-c",
    printDensity: "normal" as "normal" | "medium" | "dark",
    autoWriteCashier: true,
  });

  // [H-2 FIX] Synchronize receipt config with localStorage (set by Pengaturan Outlet) and /api/receipt-config
  useEffect(() => {
    const sStruk = localStorage.getItem("outlet_struk_config");
    if (sStruk) {
      try {
        const cfg = JSON.parse(sStruk);
        setReceiptConfig(prev => ({
          ...prev,
          header: cfg.headerText ?? prev.header,
          footer: cfg.footerText ?? prev.footer,
          paperWidth: (cfg.paperWidth === "58mm" || cfg.paperWidth === "80mm") ? cfg.paperWidth : prev.paperWidth,
        }));
      } catch {}
    }

    fetch("/api/receipt-config")
      .then(res => res.json())
      .then(data => {
        if (data && (data.header || data.footer)) {
          setReceiptConfig({
            header: data.header ?? "RUMAH MAKAN SEDAP",
            footer: data.footer ?? "Terima kasih sudah makan di tempat kami!\nBesar harapan kami untuk kembali lagi.",
            showNpwp: data.showNpwp !== false,
            showNib: data.showNib !== false,
            showServiceCharge: data.showServiceCharge !== false,
            showPbjt: data.showPbjt !== false,
            paperWidth: (data.paperWidth === "58mm" || data.paperWidth === "80mm") ? data.paperWidth : "80mm",
            fontType: (data.fontType === "font-a" || data.fontType === "font-b" || data.fontType === "font-c") ? data.fontType : "font-a",
            printDensity: (data.printDensity === "normal" || data.printDensity === "medium" || data.printDensity === "dark") ? data.printDensity : "normal",
            autoWriteCashier: data.autoWriteCashier !== false,
          });
        }
      })
      .catch(err => console.error("Gagal memuat format struk", err));
  }, []);

  const handleSave = () => {
    // [H-2 FIX] Sync to localStorage so Pengaturan Outlet shares the single source of truth
    const strukConfig = { headerText: receiptConfig.header, footerText: receiptConfig.footer, paperWidth: receiptConfig.paperWidth };
    localStorage.setItem("outlet_struk_config", JSON.stringify(strukConfig));

    fetch("/api/receipt-config", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(receiptConfig),
    })
      .then(res => res.json())
      .then(data => {
        if (data.success) {
          setSaved(true);
          setTimeout(() => setSaved(false), 3000);
        }
      })
      .catch(err => console.error("Gagal menyimpan format struk", err));
  };

  const labelClass = `text-sm font-medium block ${isLight ? "text-slate-800 font-bold" : "text-slate-300"}`;
  const inputClass = `w-full rounded-lg p-3 focus:outline-none focus:border-emerald-500 border ${isLight ? "bg-white border-slate-300 text-slate-900 shadow-xs" : "bg-slate-900 border-white/10 text-white"}`;

  return (
    <Screen title="Pengaturan Printer & Struk" action={
      <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2 text-white font-bold" onClick={handleSave}>
        {saved ? <CheckCircle2 className="size-4" /> : <Save className="size-4" />}
        {saved ? "Tersimpan" : "Simpan Pengaturan"}
      </Button>
    }>
      
      <div className="flex gap-6 h-full">
        
        {/* Sidebar Menu */}
        <div className="w-64 shrink-0 space-y-2">
          <button 
            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${activeTab === 'kasir' ? (isLight ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-400 shadow-xs' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30') : (isLight ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent' : 'text-slate-400 hover:bg-white/5 border border-transparent')}`}
            onClick={() => setActiveTab('kasir')}
          >
            <Printer className="size-5" />
            <div className="font-medium">Printer Kasir</div>
          </button>
          <button 
            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${activeTab === 'dapur' ? (isLight ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-400 shadow-xs' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30') : (isLight ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent' : 'text-slate-400 hover:bg-white/5 border border-transparent')}`}
            onClick={() => setActiveTab('dapur')}
          >
            <Printer className="size-5" />
            <div className="font-medium">Printer Dapur</div>
          </button>
          <button 
            className={`w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors ${activeTab === 'receipt' ? (isLight ? 'bg-emerald-100 text-emerald-800 font-bold border border-emerald-400 shadow-xs' : 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30') : (isLight ? 'text-slate-600 hover:bg-slate-100 hover:text-slate-900 border border-transparent' : 'text-slate-400 hover:bg-white/5 border border-transparent')}`}
            onClick={() => setActiveTab('receipt')}
          >
            <FileText className="size-5" />
            <div className="font-medium">Format Struk</div>
          </button>
        </div>

        {/* Content Area */}
        <Glass className="flex-1 p-8 overflow-y-auto custom-scrollbar">
          
          {/* KASIR CONFIG */}
          {activeTab === 'kasir' && (
            <div className="max-w-2xl animate-in fade-in duration-300 space-y-8">
              <div>
                <h2 className={`text-2xl font-bold mb-2 ${isLight ? "text-slate-900" : "text-white"}`}>Printer Kasir</h2>
                <p className={isLight ? "text-slate-600 font-medium" : "text-slate-400"}>Pengaturan cetak struk pembayaran untuk pelanggan (Bluetooth Thermal / USB).</p>
              </div>

              <div className={`flex items-center justify-between p-4 rounded-lg border ${isLight ? "bg-slate-100 border-slate-300" : "bg-slate-900/50 border-white/10"}`}>
                <div>
                  <div className={`font-medium ${isLight ? "text-slate-900 font-bold" : "text-white"}`}>Aktifkan Printer Kasir</div>
                  <div className={`text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>Otomatis mencetak struk setelah pembayaran lunas.</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={kasirConfig.enabled} onChange={e => setKasirConfig({...kasirConfig, enabled: e.target.checked})} />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div className={`space-y-6 ${!kasirConfig.enabled && 'opacity-50 pointer-events-none'}`}>
                
                <div className="space-y-3">
                  <label className={labelClass}>Tipe Koneksi</label>
                  <div className="grid grid-cols-3 gap-4">
                    <div 
                      className={`p-4 border rounded-xl flex flex-col items-center gap-2 cursor-pointer transition-colors ${kasirConfig.connection === 'bluetooth' ? (isLight ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold shadow-xs' : 'border-blue-500 bg-blue-500/10 text-blue-400') : (isLight ? 'border-slate-300 text-slate-600 hover:bg-slate-50' : 'border-white/10 text-slate-400 hover:bg-white/5')}`}
                      onClick={() => setKasirConfig({...kasirConfig, connection: 'bluetooth'})}
                    >
                      <Bluetooth className="size-6" />
                      <span className="font-medium">Bluetooth</span>
                    </div>
                    <div 
                      className={`p-4 border rounded-xl flex flex-col items-center gap-2 cursor-pointer transition-colors ${kasirConfig.connection === 'usb' ? (isLight ? 'border-emerald-500 bg-emerald-50 text-emerald-700 font-bold shadow-xs' : 'border-emerald-500 bg-emerald-500/10 text-emerald-400') : (isLight ? 'border-slate-300 text-slate-600 hover:bg-slate-50' : 'border-white/10 text-slate-400 hover:bg-white/5')}`}
                      onClick={() => setKasirConfig({...kasirConfig, connection: 'usb'})}
                    >
                      <Usb className="size-6" />
                      <span className="font-medium">USB (Windows)</span>
                    </div>
                    <div 
                      className={`p-4 border rounded-xl flex flex-col items-center gap-2 cursor-pointer transition-colors ${kasirConfig.connection === 'network' ? (isLight ? 'border-purple-500 bg-purple-50 text-purple-700 font-bold shadow-xs' : 'border-purple-500 bg-purple-500/10 text-purple-400') : (isLight ? 'border-slate-300 text-slate-600 hover:bg-slate-50' : 'border-white/10 text-slate-400 hover:bg-white/5')}`}
                      onClick={() => setKasirConfig({...kasirConfig, connection: 'network'})}
                    >
                      <Wifi className="size-6" />
                      <span className="font-medium">Network / LAN</span>
                    </div>
                  </div>
                </div>

                {kasirConfig.connection === 'bluetooth' && (
                  <div className="space-y-2">
                    <label className={labelClass}>Bluetooth COM Port</label>
                    <input 
                      type="text" 
                      value={kasirConfig.port} 
                      onChange={e => setKasirConfig({...kasirConfig, port: e.target.value})}
                      className={inputClass} 
                    />
                    <p className={`text-xs ${isLight ? "text-slate-500 font-medium" : "text-slate-500"}`}>Contoh Windows: COM4. Contoh Linux: /dev/rfcomm0</p>
                  </div>
                )}

                <div className={`pt-6 border-t ${isLight ? "border-slate-200" : "border-white/10"}`}>
                  <Button className={`w-full font-bold ${isLight ? "bg-slate-800 hover:bg-slate-900 text-white" : "bg-slate-700 hover:bg-slate-600"}`} onClick={() => setShowPreview(true)}>
                    <Printer className="size-4 mr-2" /> Uji Coba Cetak (Test Print)
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* DAPUR CONFIG */}
          {activeTab === 'dapur' && (
            <div className="max-w-2xl animate-in fade-in duration-300 space-y-8">
              <div>
                <h2 className={`text-2xl font-bold mb-2 ${isLight ? "text-slate-900" : "text-white"}`}>Printer Dapur</h2>
                <p className={isLight ? "text-slate-600 font-medium" : "text-slate-400"}>Otomatis mencetak pesanan masuk (tanpa harga) ke area dapur (Kitchen Receipt).</p>
              </div>

              <div className={`flex items-center justify-between p-4 rounded-lg border ${isLight ? "bg-slate-100 border-slate-300" : "bg-slate-900/50 border-white/10"}`}>
                <div>
                  <div className={`font-medium ${isLight ? "text-slate-900 font-bold" : "text-white"}`}>Aktifkan Printer Dapur</div>
                  <div className={`text-sm ${isLight ? "text-slate-600" : "text-slate-400"}`}>Otomatis cetak tiket ke koki saat pesanan dikonfirmasi.</div>
                </div>
                <label className="relative inline-flex items-center cursor-pointer">
                  <input type="checkbox" className="sr-only peer" checked={dapurConfig.enabled} onChange={e => setDapurConfig({...dapurConfig, enabled: e.target.checked})} />
                  <div className="w-11 h-6 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-emerald-500"></div>
                </label>
              </div>

              <div className={`space-y-6 ${!dapurConfig.enabled && 'opacity-50 pointer-events-none'}`}>
                
                <div className="space-y-3">
                  <label className={labelClass}>Tipe Koneksi</label>
                  <div className="grid grid-cols-3 gap-4">
                    <div 
                      className={`p-4 border rounded-xl flex flex-col items-center gap-2 cursor-pointer transition-colors ${dapurConfig.connection === 'network' ? (isLight ? 'border-purple-500 bg-purple-50 text-purple-700 font-bold shadow-xs' : 'border-purple-500 bg-purple-500/10 text-purple-400') : (isLight ? 'border-slate-300 text-slate-600 hover:bg-slate-50' : 'border-white/10 text-slate-400 hover:bg-white/5')}`}
                      onClick={() => setDapurConfig({...dapurConfig, connection: 'network'})}
                    >
                      <Wifi className="size-6" />
                      <span className="font-medium">Network / LAN</span>
                    </div>
                    <div 
                      className={`p-4 border rounded-xl flex flex-col items-center gap-2 cursor-pointer transition-colors ${dapurConfig.connection === 'bluetooth' ? (isLight ? 'border-blue-500 bg-blue-50 text-blue-700 font-bold shadow-xs' : 'border-blue-500 bg-blue-500/10 text-blue-400') : (isLight ? 'border-slate-300 text-slate-600 hover:bg-slate-50' : 'border-white/10 text-slate-400 hover:bg-white/5')}`}
                      onClick={() => setDapurConfig({...dapurConfig, connection: 'bluetooth'})}
                    >
                      <Bluetooth className="size-6" />
                      <span className="font-medium">Bluetooth</span>
                    </div>
                  </div>
                </div>

                {dapurConfig.connection === 'network' && (
                  <div className="space-y-2">
                    <label className={labelClass}>Alamat IP Printer</label>
                    <input 
                      type="text" 
                      value={dapurConfig.ip} 
                      onChange={e => setDapurConfig({...dapurConfig, ip: e.target.value})}
                      className={inputClass} 
                    />
                    <p className={`text-xs ${isLight ? "text-slate-500 font-medium" : "text-slate-500"}`}>Contoh: 192.168.1.100</p>
                  </div>
                )}
                
                <div className={`pt-6 border-t ${isLight ? "border-slate-200" : "border-white/10"}`}>
                  <Button className={`w-full font-bold ${isLight ? "bg-slate-800 hover:bg-slate-900 text-white" : "bg-slate-700 hover:bg-slate-600"}`} onClick={() => setShowPreview(true)}>
                    <Printer className="size-4 mr-2" /> Uji Coba Cetak (Kitchen Tiket)
                  </Button>
                </div>
              </div>
            </div>
          )}

          {/* RECEIPT FORMATTING */}
          {activeTab === 'receipt' && (
            <div className="max-w-2xl animate-in fade-in duration-300 space-y-8">
              <div className="flex justify-between items-start">
                <div>
                  <h2 className={`text-2xl font-bold mb-2 ${isLight ? "text-slate-900" : "text-white"}`}>Format Struk & Layout</h2>
                  <p className={isLight ? "text-slate-600 font-medium" : "text-slate-400"}>Atur konten teks, pajak, NPWP, dan ukuran kertas untuk struk pelanggan.</p>
                </div>
                <Button variant="outline" className={`gap-2 ${isLight ? "border-emerald-500 text-emerald-700 bg-emerald-50 hover:bg-emerald-100 font-bold" : "text-emerald-400 border-emerald-500/30 hover:bg-emerald-500/10"}`} onClick={() => setShowPreview(true)}>
                  <FileText className="size-4" /> Pratinjau Struk
                </Button>
              </div>

              <div className="grid grid-cols-2 gap-6">
                
                {/* Text Content */}
                <div className="col-span-2 space-y-4">
                  <div className="space-y-2">
                    <label className={labelClass}>Nama Restoran (Header)</label>
                    <input 
                      type="text" 
                      value={receiptConfig.header} 
                      onChange={e => setReceiptConfig({...receiptConfig, header: e.target.value})}
                      className={inputClass} 
                    />
                  </div>
                  <div className="space-y-2">
                    <label className={labelClass}>Pesan Penutup (Footer)</label>
                    <textarea 
                      rows={3}
                      value={receiptConfig.footer} 
                      onChange={e => setReceiptConfig({...receiptConfig, footer: e.target.value})}
                      className={`${inputClass} resize-none`} 
                    />
                  </div>
                </div>

                {/* Toggles */}
                <div className="col-span-2 grid grid-cols-2 gap-4">
                  {[
                    { key: 'showNpwp', label: 'Tampilkan NPWP', desc: 'Sesuai regulasi pajak' },
                    { key: 'showNib', label: 'Tampilkan NIB', desc: 'Nomor Izin Berusaha' },
                    { key: 'showPbjt', label: 'Tampilkan Pajak (PBJT)', desc: 'Rincian pajak 10%' },
                    { key: 'showServiceCharge', label: 'Tampilkan Service Charge', desc: 'Rincian biaya layanan' },
                  ].map(toggle => (
                    <div key={toggle.key} className={`flex justify-between items-center p-4 rounded-lg border ${isLight ? "bg-white border-slate-300 shadow-xs" : "bg-white/5 border-white/10"}`}>
                      <div>
                        <div className={`text-sm font-medium ${isLight ? "text-slate-900 font-bold" : "text-white"}`}>{toggle.label}</div>
                        <div className={`text-xs ${isLight ? "text-slate-600" : "text-slate-500"}`}>{toggle.desc}</div>
                      </div>
                      <label className="relative inline-flex items-center cursor-pointer">
                        <input 
                          type="checkbox" 
                          className="sr-only peer" 
                          checked={receiptConfig[toggle.key as keyof typeof receiptConfig] as boolean} 
                          onChange={e => setReceiptConfig({...receiptConfig, [toggle.key]: e.target.checked})} 
                        />
                        <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                      </label>
                    </div>
                  ))}
                </div>

                {/* Paper Width */}
                <div className={`col-span-2 space-y-3 pt-4 border-t ${isLight ? "border-slate-200" : "border-white/10"}`}>
                  <label className={labelClass}>Lebar Kertas (Paper Width)</label>
                  <div className="flex gap-4">
                    <button 
                      className={`flex-1 py-3 rounded-lg border font-medium transition-colors ${receiptConfig.paperWidth === '58mm' ? (isLight ? 'bg-emerald-100 border-emerald-500 text-emerald-800 font-bold shadow-xs' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400') : (isLight ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50' : 'bg-slate-900 border-white/10 text-slate-400 hover:bg-white/5')}`}
                      onClick={() => setReceiptConfig({...receiptConfig, paperWidth: '58mm'})}
                    >
                      58mm (Kecil)<br/>
                      <span className="text-xs font-normal opacity-80">32 Karakter / Baris</span>
                    </button>
                    <button 
                      className={`flex-1 py-3 rounded-lg border font-medium transition-colors ${receiptConfig.paperWidth === '80mm' ? (isLight ? 'bg-emerald-100 border-emerald-500 text-emerald-800 font-bold shadow-xs' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400') : (isLight ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50' : 'bg-slate-900 border-white/10 text-slate-400 hover:bg-white/5')}`}
                      onClick={() => setReceiptConfig({...receiptConfig, paperWidth: '80mm'})}
                    >
                      80mm (Standar)<br/>
                      <span className="text-xs font-normal opacity-80">48 Karakter / Baris</span>
                    </button>
                  </div>
                </div>

                {/* Tulis Nama Kasir Otomatis */}
                <div className={`col-span-2 flex justify-between items-center p-4 rounded-lg border ${isLight ? "bg-white border-slate-300 shadow-xs" : "bg-white/5 border-white/10"}`}>
                  <div>
                    <div className={`text-sm font-medium ${isLight ? "text-slate-900 font-bold" : "text-white"}`}>Tulis Nama Kasir Otomatis</div>
                    <div className={`text-xs ${isLight ? "text-slate-600" : "text-slate-500"}`}>Membaca session karyawan yang bertugas dan menulisnya di struk</div>
                  </div>
                  <label className="relative inline-flex items-center cursor-pointer">
                    <input 
                      type="checkbox" 
                      className="sr-only peer" 
                      checked={receiptConfig.autoWriteCashier} 
                      onChange={e => setReceiptConfig({...receiptConfig, autoWriteCashier: e.target.checked})} 
                    />
                    <div className="w-9 h-5 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-4 after:w-4 after:transition-all peer-checked:bg-emerald-500"></div>
                  </label>
                </div>

                {/* Jenis Font Printer */}
                <div className={`col-span-2 space-y-3 pt-4 border-t ${isLight ? "border-slate-200" : "border-white/10"}`}>
                  <label className={labelClass}>Jenis Font Printer (ESC/POS Font)</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "font-a", label: "Font A (12x24 - Standar)" },
                      { id: "font-b", label: "Font B (9x17 - Kecil)" },
                      { id: "font-c", label: "Font C (9x24 - Rapat)" }
                    ].map(font => (
                      <button 
                        key={font.id}
                        type="button"
                        className={`py-2.5 px-3 rounded-lg border text-xs font-semibold transition-colors ${receiptConfig.fontType === font.id ? (isLight ? 'bg-emerald-100 border-emerald-500 text-emerald-800 font-bold shadow-xs' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400') : (isLight ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50' : 'bg-slate-900 border-white/10 text-slate-400 hover:bg-white/5')}`}
                        onClick={() => setReceiptConfig({...receiptConfig, fontType: font.id as any})}
                      >
                        {font.label}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Kerapatan Cetak */}
                <div className={`col-span-2 space-y-3 pt-4 border-t ${isLight ? "border-slate-200" : "border-white/10"}`}>
                  <label className={labelClass}>Kerapatan Cetak (Thermal Density)</label>
                  <div className="grid grid-cols-3 gap-3">
                    {[
                      { id: "normal", label: "Normal (Standar)" },
                      { id: "medium", label: "Medium (Tebal)" },
                      { id: "dark", label: "Dark (Sangat Tebal)" }
                    ].map(density => (
                      <button 
                        key={density.id}
                        type="button"
                        className={`py-2.5 px-3 rounded-lg border text-xs font-semibold transition-colors ${receiptConfig.printDensity === density.id ? (isLight ? 'bg-emerald-100 border-emerald-500 text-emerald-800 font-bold shadow-xs' : 'bg-emerald-500/20 border-emerald-500/50 text-emerald-400') : (isLight ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50' : 'bg-slate-900 border-white/10 text-slate-400 hover:bg-white/5')}`}
                        onClick={() => setReceiptConfig({...receiptConfig, printDensity: density.id as any})}
                      >
                        {density.label}
                      </button>
                    ))}
                  </div>
                </div>

              </div>
            </div>
          )}
          
        </Glass>
      </div>

      {showPreview && (
        <DigitalReceiptPreview onClose={() => setShowPreview(false)} config={receiptConfig} />
      )}
    </Screen>
  );
}
