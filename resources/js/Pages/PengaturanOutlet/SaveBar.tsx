import { SaveIcon, CheckIcon } from '../../Components/icons';
import type { PanelProps } from '../types';

export default function SaveBar(props: PanelProps) {
    const { handleSaveAllChanges, saveSuccessMsg, isLight } = props;

    return (
        <div
            className={`sticky bottom-0 z-20 mt-8 rounded-2xl border p-4 backdrop-blur-md flex flex-col sm:flex-row items-center justify-between gap-3 ${saveSuccessMsg ? (isLight ? 'bg-emerald-50 border-emerald-200 text-emerald-700' : 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300') : isLight ? 'bg-white/80 border-slate-200 text-slate-700' : 'bg-[#0a0a0a]/80 border-white/10 text-slate-300'}`}
        >
            <div className="flex items-center gap-2 text-sm font-medium">
                {saveSuccessMsg ? (
                    <>
                        <CheckIcon className="size-4" /> Semua perubahan tersimpan
                    </>
                ) : (
                    <>
                        <SaveIcon className="size-4" /> Pengaturan siap disimpan
                    </>
                )}
            </div>
            <div className="flex items-center gap-2">
                <button
                    onClick={handleSaveAllChanges}
                    className={`px-6 py-2.5 rounded-xl text-sm font-bold transition-all flex items-center gap-2 hover:scale-105 shadow-lg ${isLight ? 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-white shadow-[var(--color-primary)]/20' : 'bg-[var(--color-primary)] hover:bg-[var(--color-primary-hover)] text-slate-950'}`}
                >
                    <SaveIcon className="size-4" /> Simpan Semua Perubahan
                </button>
            </div>
        </div>
    );
}
