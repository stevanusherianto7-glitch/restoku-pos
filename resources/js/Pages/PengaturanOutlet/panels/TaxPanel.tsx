import { Glass } from '../../../Components/Shared';
import { PercentIcon, SparklesIcon, CheckIcon, XIcon, AlertTriangleIcon } from '../../../Components/icons';
import { TAX_LABELS } from '../../../Components/Shared';
import type { PanelProps } from '../types';

export default function TaxPanel(props: PanelProps) {
    const {
        h2Class,
        labelClass,
        inputClass,
        descClass,
        isLight,
        taxType,
        setTaxType,
        isTaxActive,
        setIsTaxActive,
        taxRateInput,
        setTaxRateInput,
        serviceChargeInput,
        setServiceChargeInput,
    } = props;

    return (
        <Glass className="p-6">
            <h2 className={h2Class}>
                <PercentIcon className="size-4 text-[var(--color-primary)]" /> Konfigurasi Pajak & Biaya
            </h2>

            {/* Referensi Regulasi Pemerintah */}
            <div
                className={`mb-5 rounded-xl border p-4 space-y-2 ${isLight ? 'border-emerald-300 bg-emerald-50' : 'border-emerald-500/20 bg-emerald-500/5'}`}
            >
                <div className="flex items-center justify-between">
                    <span
                        className={`text-xs font-bold flex items-center gap-1.5 ${isLight ? 'text-emerald-800' : 'text-emerald-400'}`}
                    >
                        <SparklesIcon className="size-3.5 text-emerald-500" /> Referensi Regulasi Perpajakan Restoran
                        (Indonesia)
                    </span>
                    <span
                        className={`text-[10px] font-mono px-2 py-0.5 rounded-full border ${isLight ? 'bg-emerald-200/80 text-emerald-900 border-emerald-400 font-bold' : 'bg-emerald-500/20 text-emerald-300 border-emerald-500/30'}`}
                    >
                        UU HKPD No. 1/2022
                    </span>
                </div>
                <p className={`text-[11px] leading-relaxed ${isLight ? 'text-slate-700' : 'text-slate-300'}`}>
                    Berdasarkan{' '}
                    <strong className={isLight ? 'text-slate-950' : 'text-white'}>
                        UU No. 1 Tahun 2022 (HKPD) Pasal 53 & 58
                    </strong>
                    , makanan dan/atau minuman yang disediakan oleh restoran, kafe, atau rumah makan merupakan objek{' '}
                    <strong className={isLight ? 'text-emerald-700 font-bold' : 'text-emerald-300'}>
                        PBJT (Pajak Barang dan Jasa Tertentu)
                    </strong>{' '}
                    yang dipungut Pemerintah Daerah dengan tarif maksimal{' '}
                    <strong className={isLight ? 'text-slate-950' : 'text-white'}>10%</strong>. PBJT dikecualikan dari
                    PPN (UU HPP) untuk mencegah pajak ganda.{' '}
                    <strong
                        className={isLight ? 'text-[var(--color-primary)] font-bold' : 'text-[var(--color-primary)]'}
                    >
                        Service Charge
                    </strong>{' '}
                    diatur secara terpisah sebagai biaya layanan usaha restoran.
                </p>
            </div>

            {/* Status Penerapan Pajak (Capsule Switch Active - Inactive) */}
            <div
                className={`mb-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 p-4 rounded-xl border ${isLight ? 'bg-slate-50 border-slate-200' : 'bg-white/[0.02] border-white/10'}`}
            >
                <div className="space-y-1">
                    <div
                        className={`text-xs font-bold flex items-center gap-2 ${isLight ? 'text-slate-900' : 'text-slate-200'}`}
                    >
                        Status Penerapan Pajak & Tarif di POS
                        <span
                            className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${isTaxActive ? 'bg-emerald-500/20 text-emerald-500 border border-emerald-500/30' : 'bg-rose-500/20 text-rose-500 border border-rose-500/30'}`}
                        >
                            {isTaxActive ? 'Active' : 'Inactive'}
                        </span>
                    </div>
                    <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                        Jika Inactive, perhitungan pajak (PBJT/PPN) & service charge dinonaktifkan (0%) pada seluruh
                        transaksi POS kasir dan cetak struk.
                    </p>
                </div>

                {/* Tombol Switch Kapsul Active - Inactive */}
                <div
                    className={`flex items-center p-1 rounded-full border shrink-0 shadow-inner ${isLight ? 'bg-slate-200 border-slate-300' : 'bg-[#0c0c0c] border-white/10'}`}
                >
                    <button
                        type="button"
                        onClick={() => setIsTaxActive(true)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${isTaxActive ? 'bg-gradient-to-r from-emerald-500 to-teal-500 text-slate-950 shadow-md shadow-emerald-500/20 scale-[1.02]' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <CheckIcon className="size-3.5" /> Active
                    </button>
                    <button
                        type="button"
                        onClick={() => setIsTaxActive(false)}
                        className={`px-4 py-1.5 rounded-full text-xs font-bold transition-all flex items-center gap-1.5 ${!isTaxActive ? 'bg-gradient-to-r from-rose-500 to-red-500 text-white shadow-md shadow-rose-500/20 scale-[1.02]' : 'text-slate-500 hover:text-slate-800'}`}
                    >
                        <XIcon className="size-3.5" /> Inactive
                    </button>
                </div>
            </div>

            <div className={`space-y-5 transition-all ${!isTaxActive ? 'opacity-40 pointer-events-none' : ''}`}>
                <div>
                    <label className={`${labelClass} block mb-2`}>Jenis Pajak</label>
                    <div className="grid grid-cols-2 gap-3">
                        <button
                            onClick={() => {
                                setTaxType('pbjt');
                                setTaxRateInput(10);
                            }}
                            className={`rounded-lg border px-4 py-3 text-sm font-medium text-left transition-colors ${taxType === 'pbjt' ? (isLight ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)] shadow-sm' : 'bg-[var(--color-primary)]/15 border-[var(--color-primary)]/40 text-[var(--color-primary)]') : isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                        >
                            <div className="font-semibold">PBJT</div>
                            <div className="text-xs mt-0.5 opacity-70">Pajak Restoran (Daerah)</div>
                        </button>
                        <button
                            onClick={() => {
                                setTaxType('ppn');
                                setTaxRateInput(11);
                            }}
                            className={`rounded-lg border px-4 py-3 text-sm font-medium text-left transition-colors ${taxType === 'ppn' ? (isLight ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)] shadow-sm' : 'bg-[var(--color-primary)]/15 border-[var(--color-primary)]/40 text-[var(--color-primary)]') : isLight ? 'bg-white border-slate-200 text-slate-700 hover:bg-slate-50' : 'bg-white/5 border-white/10 text-slate-400 hover:bg-white/10'}`}
                        >
                            <div className="font-semibold">PPN 11%</div>
                            <div className="text-xs mt-0.5 opacity-70">Untuk PKP (Omzet &gt;Rp4,8M)</div>
                        </button>
                    </div>
                </div>
                <div className="grid grid-cols-2 gap-5">
                    <div className="space-y-1.5">
                        <label className={labelClass}>{TAX_LABELS[taxType]} (%)</label>
                        <input
                            type="number"
                            value={taxRateInput}
                            onChange={(e) => setTaxRateInput(Number(e.target.value))}
                            min={0}
                            max={taxType === 'ppn' ? 11 : 10}
                            className={inputClass}
                        />
                        <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>
                            {taxType === 'pbjt'
                                ? 'Tarif PBJT daerah: 0–10%. Cek peraturan daerah Anda.'
                                : 'PPN 11% sesuai UU HPP.'}
                        </p>
                    </div>
                    <div className="space-y-1.5">
                        <label className={labelClass}>Service Charge (%)</label>
                        <input
                            type="number"
                            value={serviceChargeInput}
                            onChange={(e) => setServiceChargeInput(Number(e.target.value))}
                            min={0}
                            max={5}
                            className={inputClass}
                        />
                        <p className={`text-[11px] ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>
                            Opsional. 0–5%. Bukan pajak, adalah pendapatan restoran.
                        </p>
                    </div>
                </div>
            </div>

            {/* Real-time tax calculation preview */}
            <div
                className={`mt-5 rounded-xl border p-4 transition-all ${isTaxActive ? (isLight ? 'border-[var(--color-primary)] bg-[var(--color-primary)]/10' : 'border-[var(--color-primary)]/10 bg-[var(--color-primary)]/5') : isLight ? 'border-slate-300 bg-slate-100' : 'border-slate-500/10 bg-slate-500/5'}`}
            >
                <p
                    className={`text-xs font-medium mb-1 flex items-center gap-1.5 ${isTaxActive ? (isLight ? 'text-[var(--color-primary)]' : 'text-[var(--color-primary)]') : 'text-slate-500'}`}
                >
                    <AlertTriangleIcon className="size-3.5" /> Contoh kalkulasi struk (
                    {isTaxActive ? 'Pajak & Layanan Aktif' : 'Pajak & Layanan Inactive'})
                </p>
                <p
                    className={`text-xs ${isTaxActive ? (isLight ? 'text-[var(--color-primary)]' : 'text-[var(--color-primary)]/70') : 'text-slate-500'}`}
                >
                    Subtotal Rp 100.000
                    {isTaxActive ? (
                        <>
                            {' → '} {TAX_LABELS[taxType]} {taxRateInput}% = Rp{' '}
                            {((100000 * taxRateInput) / 100).toLocaleString('id-ID')}
                            {serviceChargeInput > 0 &&
                                ` + Service Charge ${serviceChargeInput}% = Rp ${((100000 * serviceChargeInput) / 100).toLocaleString('id-ID')}`}
                            {' → '} Total Rp{' '}
                            {(100000 * (1 + taxRateInput / 100 + serviceChargeInput / 100)).toLocaleString('id-ID')}
                        </>
                    ) : (
                        <>{' → Pajak & Service Charge Inactive (0%) → '} Total Rp 100.000</>
                    )}
                </p>
            </div>
            <p
                className={`mt-4 text-[11px] flex items-center gap-1 ${isLight ? 'text-emerald-700 font-semibold' : 'text-emerald-400'}`}
            >
                ✓ Data pajak & status aktivasi ini digunakan oleh POS untuk kalkulasi total transaksi.
            </p>
        </Glass>
    );
}
