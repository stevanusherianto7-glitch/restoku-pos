import { useState } from 'react';
import { usePage } from '@inertiajs/react';
import { formatRupiah } from '../../../lib/formatters';
import { ProductImage } from '../../../Components/ProductImage';
import { useTenantSettings } from '../../../Components/Shared';
import { type MenuItem } from '../../CustomerView';

export function MenuDetailSheet({
    item,
    outletName,
    onClose,
    onAdd,
}: {
    item: MenuItem;
    outletName: string;
    onClose: () => void;
    onAdd: (id: number) => void;
}) {
    // SERVER-DRIVEN tema (sama dengan parent).
    const page = usePage();
    const { tenantLayout: lsTenantLayout, screenMode: lsScreenMode } = useTenantSettings();
    const screenMode = (page.props.screen_mode as string) || lsScreenMode;
    const tenantLayout = (page.props.tenant_layout as string) || lsTenantLayout;
    const isNanoBanana = screenMode === 'nano-banana' || tenantLayout === 'nano-banana';
    const isDarkTheme = isNanoBanana || tenantLayout === 'premium' || screenMode === 'premium';

    const modalStyle = {
        bg: isDarkTheme
            ? isNanoBanana
                ? 'bg-[#111827] border-amber-500/25'
                : 'bg-[#0d2a21] border-[#0F8A4D]/25'
            : 'bg-[#FAF5EE] border-amber-900/10',
        textTitle: isDarkTheme ? 'text-white' : 'text-[#1A1410]',
        textDesc: isDarkTheme ? 'text-slate-300' : 'text-[#7A6F63]',
        textMuted: isDarkTheme ? 'text-slate-400' : 'text-[#5A4F43]',
        accentText: isDarkTheme ? (isNanoBanana ? 'text-amber-400' : 'text-[#0f9f59]') : 'text-[#FF5B35]',
        accentBg: isDarkTheme ? (isNanoBanana ? 'bg-amber-500' : 'bg-[#0F8A4D]') : 'bg-[#FF5B35]',
        accentBadgeBg: isDarkTheme
            ? isNanoBanana
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                : 'bg-[#0F8A4D]/15 border-[#0F8A4D]/30 text-emerald-400'
            : 'bg-[#FF5B35]/15 border-[#FF5B35]/30 text-[#FF5B35]',
        accentStepBg: isDarkTheme
            ? isNanoBanana
                ? 'bg-amber-500/10 text-amber-400'
                : 'bg-[#0F8A4D]/10 text-emerald-400'
            : 'bg-[#FF5B35]/10 text-[#FF5B35]',
        divider: isDarkTheme ? 'border-white/10' : 'border-amber-900/10',
        cardBg: isDarkTheme
            ? 'bg-white/5 border-white/10 p-2.5 rounded-2xl'
            : 'border border-amber-900/10 p-2.5 rounded-2xl',
        ctaBg: isDarkTheme ? 'bg-[#0a2019]/60 border-t border-white/5' : 'bg-[#FFF3EC]/50 border-t border-amber-900/10',
        button: isDarkTheme
            ? isNanoBanana
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/25'
                : 'bg-[#0F8A4D] hover:bg-[#0c6e3d] text-white shadow-md shadow-[#0F8A4D]/25'
            : 'bg-[#FF5B35] text-white hover:bg-[#E04E2B] shadow-md shadow-[#FF5B35]/25',
    };

    const [tab, setTab] = useState<'desc' | 'combo' | 'reviews'>('desc');
    const steps = item.steps ?? [
        'Bahan segar diproses higienis sesuai standar outlet.',
        'Diolah dengan resep rahasia outlet untuk cita rasa terbaik.',
        'Disajikan hangat/segar langsung ke meja Anda.',
    ];
    const reviews = item.reviews ?? [];

    return (
        <div
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden max-w-md mx-auto"
            onClick={onClose}
        >
            <div
                className={`relative w-[92%] max-w-sm rounded-3xl ${modalStyle.bg} overflow-hidden shadow-2xl border max-h-[85vh] flex flex-col`}
                onClick={(e) => e.stopPropagation()}
            >
                <div className="relative h-44 shrink-0 bg-slate-100">
                    <ProductImage
                        src={item.image}
                        alt={item.name}
                        variant="large"
                        className="w-full h-full object-cover"
                    />
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 size-8 rounded-full bg-black/50 text-white grid place-items-center backdrop-blur hover:bg-black/75 cursor-pointer border-none"
                    >
                        ✕
                    </button>
                    {item.isPopular && (
                        <span
                            className={`absolute top-3 left-3 ${modalStyle.accentBadgeBg} font-black text-[9px] uppercase tracking-wider px-2.5 py-1 rounded-full shadow-sm`}
                        >
                            🔥 Favorit
                        </span>
                    )}
                    <div
                        className={`absolute bottom-3 right-3 ${modalStyle.accentBg} text-white font-extrabold text-xs px-3 py-1.5 rounded-full shadow-md`}
                    >
                        {formatRupiah(item.price)}
                    </div>
                </div>

                <div className="flex-1 overflow-y-auto px-5 py-4 text-left">
                    <h2 className={`text-xl font-extrabold ${modalStyle.textTitle} tracking-tight`}>{item.name}</h2>
                    <p className={`text-[10px] font-bold ${modalStyle.accentText} uppercase tracking-wide mt-0.5`}>
                        {outletName}
                    </p>

                    <div className={`flex items-center gap-3 mt-2 text-[10px] ${modalStyle.textDesc} font-bold`}>
                        <span className="text-[#F59E0B]">
                            {'★'.repeat(Math.round(item.rating ?? 4.9))}{' '}
                            <span className={`${modalStyle.textTitle} font-extrabold`}>
                                {(item.rating ?? 4.9).toFixed(1)}
                            </span>
                        </span>
                        {item.cookTime && <span>⏱ {item.cookTime}</span>}
                        {item.servings && <span>🍽 {item.servings}</span>}
                    </div>

                    <p className={`text-xs ${modalStyle.textDesc} leading-relaxed mt-2.5`}>
                        {item.description || 'Hidangan lezat diolah higienis dengan resep rahasia outlet.'}
                    </p>

                    <div className={`flex gap-6 mt-4 border-b ${modalStyle.divider}`}>
                        {(['desc', 'combo', 'reviews'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`pb-2 text-xs font-bold transition-colors border-none bg-transparent cursor-pointer ${tab === t ? modalStyle.accentText + ' border-b-2 border-current' : 'text-slate-400'}`}
                            >
                                {t === 'desc' ? 'Deskripsi' : t === 'combo' ? 'Combo' : 'Ulasan'}
                            </button>
                        ))}
                    </div>

                    <div className="py-3 space-y-3">
                        {tab === 'desc' && (
                            <div className="space-y-2.5">
                                {steps.map((s, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div
                                            className={`shrink-0 size-5 rounded-full ${modalStyle.accentStepBg} font-extrabold text-[10px] grid place-items-center`}
                                        >
                                            {i + 1}
                                        </div>
                                        <p className={`text-xs ${modalStyle.textMuted} leading-snug pt-0.5`}>{s}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        {tab === 'combo' && (
                            <p className={`text-xs ${modalStyle.textDesc}`}>
                                {item.combo ?? 'Belum ada paket combo untuk menu ini.'}
                            </p>
                        )}
                        {tab === 'reviews' &&
                            (reviews.length > 0 ? (
                                <div className="space-y-2.5">
                                    {reviews.map((r, i) => (
                                        <div key={i} className={`border ${modalStyle.cardBg}`}>
                                            <div className="flex items-center justify-between">
                                                <span className={`text-xs font-bold ${modalStyle.textTitle}`}>
                                                    {r.name}
                                                </span>
                                                <span className="text-[#F59E0B] text-[10px]">
                                                    {'★'.repeat(r.rating)}
                                                </span>
                                            </div>
                                            <p className={`text-[10px] ${modalStyle.textDesc} mt-1`}>{r.text}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className={`text-xs ${modalStyle.textDesc}`}>Belum ada ulasan untuk menu ini.</p>
                            ))}
                    </div>
                </div>

                <div className={`shrink-0 p-3.5 ${modalStyle.ctaBg}`}>
                    <button
                        onClick={() => {
                            onAdd(item.id);
                            onClose();
                        }}
                        className={`w-full ${modalStyle.button} border-none rounded-xl py-3 text-xs font-black cursor-pointer flex items-center justify-center`}
                    >
                        Tambah ke Pesanan · {formatRupiah(item.price)}
                    </button>
                </div>
            </div>
        </div>
    );
}
