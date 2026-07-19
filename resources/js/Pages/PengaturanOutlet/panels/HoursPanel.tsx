import { Glass } from '../../../Components/Shared';
import { ClockIcon } from '../../../Components/icons';
import type { PanelProps } from '../types';

export default function HoursPanel(props: PanelProps) {
    const { h2Class, descClass, isLight, inputClass, jamOperasional, setJamOperasional } = props;

    return (
        <Glass className="p-6">
            <h2 className={h2Class}>
                <ClockIcon className="size-4 text-emerald-500" /> Jam Operasional Outlet
            </h2>
            <p className={`${descClass} mb-4`}>
                Atur jadwal operasional outlet Anda untuk membatasi pemesanan online oleh pelanggan di luar jam buka.
            </p>

            <div
                className={`flex flex-wrap items-center gap-2 mb-5 pb-3 border-b ${isLight ? 'border-slate-200' : 'border-white/10'}`}
            >
                <span className={`text-[11px] font-semibold mr-1 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}>
                    Aksi Cepat:
                </span>
                <button
                    type="button"
                    onClick={() => setJamOperasional((prev) => prev.map((d) => ({ ...d, isOpen: true })))}
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors border ${isLight ? 'bg-emerald-50 hover:bg-emerald-100 text-emerald-700 border-emerald-300 shadow-sm' : 'bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-400 border-emerald-500/20'}`}
                >
                    Buka Semua Hari
                </button>
                <button
                    type="button"
                    onClick={() =>
                        setJamOperasional((prev) =>
                            prev.map((d) => (d.day === 'Minggu' ? { ...d, isOpen: false } : { ...d, isOpen: true })),
                        )
                    }
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors border ${isLight ? 'bg-slate-100 hover:bg-slate-200 text-slate-700 border-slate-300 shadow-sm' : 'bg-white/5 hover:bg-white/10 text-slate-300 border-white/10'}`}
                >
                    Libur Minggu Saja
                </button>
                <button
                    type="button"
                    onClick={() =>
                        setJamOperasional((prev) => prev.map((d) => ({ ...d, openTime: '09:00', closeTime: '22:00' })))
                    }
                    className={`rounded-lg px-2.5 py-1 text-[11px] font-semibold transition-colors border ${isLight ? 'bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/15 text-[var(--color-primary)] border-[var(--color-primary)] shadow-sm' : 'bg-[var(--color-primary)]/10 hover:bg-[var(--color-primary)]/20 text-[var(--color-primary)] border-[var(--color-primary)]/20'}`}
                >
                    Set Waktu Standar (09:00 - 22:00)
                </button>
            </div>

            <div className="space-y-3">
                {jamOperasional.map((item, idx) => (
                    <div
                        key={item.day}
                        className={`flex items-center gap-4 p-3 rounded-xl transition-colors border ${isLight ? 'bg-white border-slate-200 hover:bg-slate-50 shadow-sm' : 'bg-white/[0.01] border-white/5 hover:bg-white/[0.03]'}`}
                    >
                        <div className={`w-20 text-xs font-bold ${isLight ? 'text-slate-900' : 'text-slate-200'}`}>
                            {item.day}
                        </div>
                        <div className="flex items-center gap-2">
                            <input
                                type="time"
                                value={item.openTime}
                                onChange={(e) =>
                                    setJamOperasional((prev) =>
                                        prev.map((d, i) => (i === idx ? { ...d, openTime: e.target.value } : d)),
                                    )
                                }
                                className={inputClass}
                            />
                            <span className={`text-xs font-medium ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>
                                s/d
                            </span>
                            <input
                                type="time"
                                value={item.closeTime}
                                onChange={(e) =>
                                    setJamOperasional((prev) =>
                                        prev.map((d, i) => (i === idx ? { ...d, closeTime: e.target.value } : d)),
                                    )
                                }
                                className={inputClass}
                            />
                        </div>
                        <div className="ml-auto flex items-center gap-2">
                            <span
                                className={`text-[10px] font-bold uppercase ${item.isOpen ? (isLight ? 'text-emerald-700' : 'text-emerald-400') : 'text-slate-500'}`}
                            >
                                {item.isOpen ? 'Buka' : 'Tutup'}
                            </span>
                            <button
                                type="button"
                                onClick={() =>
                                    setJamOperasional((prev) =>
                                        prev.map((d, i) => (i === idx ? { ...d, isOpen: !d.isOpen } : d)),
                                    )
                                }
                                className={`w-8 h-4 rounded-full border flex items-center px-0.5 transition-all cursor-pointer ${item.isOpen ? (isLight ? 'bg-emerald-200 border-emerald-500 justify-end' : 'bg-emerald-500/20 border-emerald-500/40 justify-end') : isLight ? 'bg-slate-200 border-slate-300 justify-start' : 'bg-white/5 border-white/10 justify-start'}`}
                            >
                                <div
                                    className={`size-3 rounded-full transition-colors ${item.isOpen ? (isLight ? 'bg-emerald-600' : 'bg-emerald-400') : 'bg-slate-500'}`}
                                />
                            </button>
                        </div>
                    </div>
                ))}
            </div>
            <p
                className={`mt-3 text-[11px] flex items-center gap-1 ${isLight ? 'text-emerald-700 font-semibold' : 'text-emerald-400'}`}
            >
                ✓ Jam operasional disimpan via tombol "Simpan Semua Perubahan".
            </p>
        </Glass>
    );
}
