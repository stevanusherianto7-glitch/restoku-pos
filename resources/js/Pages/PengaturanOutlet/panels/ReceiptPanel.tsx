import { Glass } from '../../../Components/Shared';
import { ReceiptIcon, ChefHatIcon, ClockIcon } from '../../../Components/icons';
import type { PanelProps } from '../types';
import ReceiptPreview from './ReceiptPreview';

export default function ReceiptPanel(props: PanelProps) {
    const {
        h2Class,
        descClass,
        labelClass,
        inputClass,
        selectClass,
        isLight,
        strukHeader,
        setStrukHeader,
        strukFooter,
        setStrukFooter,
        strukPaperWidth,
        setStrukPaperWidth,
        voidPolicy,
        setVoidPolicy,
        strukPreviewMode,
        setStrukPreviewMode,
        nameInput,
        tenantName,
        alamatInput,
        teleponInput,
        employeesList,
        ownerInput,
    } = props;

    return (
        <Glass className="p-6">
            <h2 className={h2Class}>
                <ReceiptIcon className="size-4 text-emerald-500" /> Pengaturan Tampilan Struk
            </h2>
            <p className={`${descClass} mb-5`}>
                Kustomisasi informasi header dan footer yang tercetak pada struk pembelian pelanggan.
            </p>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-4">
                    <div className="space-y-1.5">
                        <label className={labelClass}>Header Struk (Pesan Selamat Datang)</label>
                        <input
                            value={strukHeader}
                            onChange={(e) => setStrukHeader(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className={labelClass}>Footer Struk (Pesan Penutup)</label>
                        <input
                            value={strukFooter}
                            onChange={(e) => setStrukFooter(e.target.value)}
                            className={inputClass}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className={labelClass}>Lebar Kertas Struk</label>
                        <select
                            value={strukPaperWidth}
                            onChange={(e) => setStrukPaperWidth(e.target.value)}
                            className={selectClass}
                        >
                            <option value="58mm">58mm (Kecil)</option>
                            <option value="80mm">80mm (Standar POS)</option>
                        </select>
                    </div>
                    <div className="space-y-1.5">
                        <label
                            className={`text-xs font-medium flex items-center gap-1.5 ${isLight ? 'text-emerald-800 font-bold' : 'text-emerald-400'}`}
                        >
                            <span>🛡️ Kebijakan Keamanan & Struk Void</span>
                        </label>
                        <select
                            value={voidPolicy}
                            onChange={(e) => setVoidPolicy(e.target.value as PanelProps['voidPolicy'])}
                            className={`w-full rounded-lg px-3 py-2 text-sm outline-none transition-colors shadow-sm font-medium ${isLight ? 'border border-emerald-400 bg-emerald-50/50 text-emerald-950 focus:border-emerald-600 focus:bg-white' : 'border border-emerald-500/30 bg-[#0c0c0c] text-emerald-300 focus:border-emerald-500'}`}
                        >
                            <option value="audit_full">
                                🛡️ Wajib Otorisasi Manager & Tampilkan Item Void (Audit Full)
                            </option>
                            <option value="zero_out">
                                📑 Nol-kan / Sembunyikan Item Void pada Struk Pelanggan (Zero-Out)
                            </option>
                            <option value="manager_only">
                                🔒 Kunci Total Fitur Void Kasir (Manager Only via Dasbor)
                            </option>
                        </select>
                    </div>
                    <p
                        className={`text-[11px] flex items-center gap-1 ${isLight ? 'text-emerald-700 font-semibold' : 'text-emerald-400'}`}
                    >
                        ✓ Konfigurasi disimpan via tombol "Simpan Semua Perubahan" & disinkronkan ke API.
                    </p>
                </div>

                {/* Visual receipt mockup container with switch selector */}
                <div className="space-y-3.5">
                    <div
                        className={`flex items-center justify-between p-1 rounded-xl border shadow-inner gap-1 ${isLight ? 'bg-slate-200 border-slate-300' : 'bg-[#0c0c0c] border-white/10'}`}
                    >
                        <button
                            type="button"
                            onClick={() => setStrukPreviewMode('transaksi')}
                            className={`flex-1 py-2 px-2 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 ${strukPreviewMode === 'transaksi' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md font-bold scale-[1.01]' : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <ReceiptIcon className="size-3.5 shrink-0" /> Struk Pelanggan
                        </button>
                        <button
                            type="button"
                            onClick={() => setStrukPreviewMode('dapur')}
                            className={`flex-1 py-2 px-2 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 ${strukPreviewMode === 'dapur' ? 'bg-gradient-to-r from-amber-500 to-yellow-500 text-slate-950 shadow-md font-bold scale-[1.01]' : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <ChefHatIcon className="size-3.5 shrink-0" /> Tiket Dapur (KDS)
                        </button>
                        <button
                            type="button"
                            onClick={() => setStrukPreviewMode('closing')}
                            className={`flex-1 py-2 px-2 rounded-lg text-[11px] font-semibold transition-all flex items-center justify-center gap-1.5 ${strukPreviewMode === 'closing' ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md font-bold scale-[1.01]' : isLight ? 'text-slate-600 hover:text-slate-900 hover:bg-slate-300/50' : 'text-slate-400 hover:text-slate-200'}`}
                        >
                            <ClockIcon className="size-3.5 shrink-0" /> Laporan Shift
                        </button>
                    </div>

                    <ReceiptPreview
                        mode={strukPreviewMode}
                        strukHeader={strukHeader}
                        strukFooter={strukFooter}
                        strukPaperWidth={strukPaperWidth}
                        voidPolicy={voidPolicy}
                        nameInput={nameInput}
                        tenantName={tenantName}
                        alamatInput={alamatInput}
                        teleponInput={teleponInput}
                        employeesList={employeesList}
                        ownerInput={ownerInput}
                    />
                </div>
            </div>
        </Glass>
    );
}
