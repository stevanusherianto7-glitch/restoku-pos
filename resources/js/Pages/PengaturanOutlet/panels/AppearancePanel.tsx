import { Glass } from '../../../Components/Shared';
import { SparklesIcon } from '../../../Components/icons';
import type { PanelProps } from '../types';

const SCREEN_MODE_OPTIONS = [
    {
        id: 'nano-banana',
        name: 'Nano Banana',
        desc: 'WOW Cyber Gold',
        theme: 'bg-[#030712] border-amber-500/50 text-amber-400',
        preview: 'from-amber-500/20 via-[#030712] to-yellow-500/20',
    },
    {
        id: 'terang',
        name: 'Terang (Light)',
        desc: 'Bersih & Cerah',
        theme: 'bg-white border-slate-200 text-slate-800',
        preview: 'from-slate-100 to-white',
    },
    {
        id: 'gelap',
        name: 'Gelap (Dark)',
        desc: 'Mewah & Nyaman',
        theme: 'bg-slate-900 border-emerald-500/30 text-emerald-400',
        preview: 'from-slate-950 to-slate-900',
    },
    {
        id: 'glassmorphic',
        name: 'Glassmorphic',
        desc: 'Transparan & Futuristik',
        theme: 'bg-white/10 backdrop-blur-md border-white/20 text-white',
        preview: 'from-emerald-900/40 via-slate-900/60 to-purple-900/40',
    },
    {
        id: 'krem',
        name: 'Krem Hangat',
        desc: 'Warm & Cozy',
        theme: 'bg-[#ffe6c0] border-amber-300 text-amber-900',
        preview: 'from-[#fff3e0] via-[#ffe6c0] to-[#ffd99f]',
    },
] as const;

const FRONTEND_OPTIONS = [
    {
        id: 'premium-dark',
        name: 'Premium Dark',
        desc: 'Gelap & Mewah',
        theme: 'bg-slate-900 border-emerald-500/30 text-emerald-400',
        preview: 'from-emerald-950 to-slate-950',
    },
    {
        id: 'minimalist-light',
        name: 'Minimalist Light',
        desc: 'Bersih & Terang',
        theme: 'bg-white border-slate-200 text-slate-800',
        preview: 'from-slate-100 to-white',
    },
    {
        id: 'warm-cozy',
        name: 'Warm Cozy',
        desc: 'Krem & Hangat',
        theme: 'bg-[#fcf8f2] border-amber-200 text-amber-900',
        preview: 'from-amber-100/50 to-[#fdfaf6]',
    },
] as const;

export default function AppearancePanel(props: PanelProps) {
    const {
        h2Class,
        descClass,
        isLight,
        screenMode,
        handleScreenModeChange,
        optionBtnClass,
        tenantLayout,
        saveLayout,
    } = props;

    return (
        <>
            <Glass className="p-6">
                <h2 className={h2Class}>
                    <SparklesIcon className="size-4 text-emerald-500" /> Mode Screen UI (Tema Sistem & POS)
                </h2>
                <div className="space-y-4">
                    <p className={descClass}>
                        Pilih mode tampilan antarmuka (UI Screen) untuk dasbor admin, kasir POS, dan operasional outlet
                        Anda.
                    </p>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                        {SCREEN_MODE_OPTIONS.map((opt) => (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => handleScreenModeChange(opt.id as PanelProps['screenMode'])}
                                className={optionBtnClass(screenMode === opt.id)}
                            >
                                <div
                                    className={`h-8 w-full rounded-lg bg-gradient-to-br ${opt.preview} border ${isLight ? 'border-slate-200' : 'border-white/5'} mb-2.5 flex items-center justify-center shadow-inner`}
                                >
                                    <span
                                        className={`text-[9px] font-extrabold opacity-80 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}
                                    >
                                        UI Mode
                                    </span>
                                </div>
                                <div
                                    className={`font-bold text-[11px] ${isLight ? 'text-slate-900' : 'text-slate-200'}`}
                                >
                                    {opt.name}
                                </div>
                                <div
                                    className={`text-[9px] mt-0.5 leading-tight ${isLight ? 'text-slate-600' : 'text-slate-500'}`}
                                >
                                    {opt.desc}
                                </div>
                                {screenMode === opt.id && (
                                    <div
                                        className={`absolute top-1 right-1 size-2 rounded-full ${isLight ? 'bg-[var(--color-primary)]' : 'bg-amber-400'} animate-pulse`}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </Glass>

            <Glass className="p-6">
                <h2 className={h2Class}>
                    <SparklesIcon className="size-4 text-emerald-500" /> Tampilan Frontend (Buku Menu Tamu)
                </h2>
                <div className="space-y-4">
                    <p className={descClass}>
                        Pilih tema tampilan e-menu yang sesuai dengan konsep restoran Anda. Perubahan akan langsung
                        terlihat pada menu digital tamu.
                    </p>
                    <div className="grid grid-cols-3 gap-3">
                        {FRONTEND_OPTIONS.map((opt) => (
                            <button
                                key={opt.id}
                                type="button"
                                onClick={() => saveLayout(opt.id as PanelProps['screenMode'])}
                                className={optionBtnClass(tenantLayout === opt.id)}
                            >
                                <div
                                    className={`h-8 w-full rounded-lg bg-gradient-to-br ${opt.preview} border ${isLight ? 'border-slate-200' : 'border-white/5'} mb-2.5 flex items-center justify-center`}
                                >
                                    <span
                                        className={`text-[8px] font-bold opacity-80 ${isLight ? 'text-slate-800' : 'text-slate-200'}`}
                                    >
                                        Aa
                                    </span>
                                </div>
                                <div
                                    className={`font-bold text-[11px] ${isLight ? 'text-slate-900' : 'text-slate-200'}`}
                                >
                                    {opt.name}
                                </div>
                                <div
                                    className={`text-[9px] mt-0.5 leading-tight ${isLight ? 'text-slate-600' : 'text-slate-500'}`}
                                >
                                    {opt.desc}
                                </div>
                                {tenantLayout === opt.id && (
                                    <div
                                        className={`absolute top-1 right-1 size-2 rounded-full ${isLight ? 'bg-[var(--color-primary)]' : 'bg-emerald-500'}`}
                                    />
                                )}
                            </button>
                        ))}
                    </div>
                </div>
            </Glass>
        </>
    );
}
