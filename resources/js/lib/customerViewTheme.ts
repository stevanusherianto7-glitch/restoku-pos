export interface ThemeTokens {
    outer: string;
    header: string;
    textMuted: string;
    textTitle: string;
    textDesc: string;
    card: string;
    cardHover: string;
    input: string;
    inputLarge: string;
    btnPrimary: string;
    btnSecondary: string;
    badge: string;
    divider: string;
    bannerBg: string;
    categoryBtn: (active: boolean) => string;
    categoryList: string;
}

export interface ModalStyle {
    bg: string;
    textTitle: string;
    textDesc: string;
    accentText: string;
    accentBorder: string;
    accentBg: string;
    cardBg: string;
    divider: string;
    button: string;
    pinBox: string;
    pinKey: string;
}

export interface DerivedTheme {
    activeTheme: ThemeTokens;
    isDarkTheme: boolean;
    modalStyle: ModalStyle;
    headerBg: string;
    headerBorder: string;
}

const theme: Record<string, ThemeTokens> = {
    premium: {
        outer: 'min-h-[100dvh] w-full bg-gradient-to-b from-[#031510] via-[#052119] to-[#020b08] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 max-w-md mx-auto shadow-2xl relative border-x border-emerald-950/40',
        header: 'sticky top-0 z-40 bg-[#04130f]/60 backdrop-blur-md border-b border-white/5 px-5 py-4 flex items-center justify-between',
        textMuted: 'text-slate-400',
        textTitle: 'text-white',
        textDesc: 'text-slate-400',
        card: 'bg-white/[0.03] border border-white/5 hover:border-white/10 p-4 rounded-3xl shadow-sm',
        cardHover:
            'bg-white/[0.03] border border-white/5 hover:border-white/10 p-4 rounded-3xl shadow-sm flex gap-4 transition-all group relative overflow-hidden',
        input: 'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/25 transition-all',
        inputLarge:
            'w-full h-20 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/25 transition-all resize-none',
        btnPrimary:
            'w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-emerald-500/10 disabled:opacity-50',
        btnSecondary: 'bg-white/5 border border-white/10 text-slate-300 hover:bg-white/20',
        badge: 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-bold text-emerald-400 tracking-wider uppercase mb-2',
        divider: 'h-px bg-white/5 my-2',
        bannerBg:
            'relative px-5 py-6 bg-gradient-to-r from-emerald-950/40 via-teal-950/20 to-slate-950/40 border-b border-white/5 overflow-hidden',
        categoryBtn: (active: boolean) =>
            active
                ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/10 scale-95'
                : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20',
        categoryList: 'flex gap-2 overflow-x-auto px-4 py-3 sticky top-[77px] z-30 bg-[#031510]/80 backdrop-blur-md',
    },
    minimalist: {
        outer: 'min-h-[100dvh] w-full bg-slate-50 text-slate-800 flex flex-col font-sans max-w-md mx-auto shadow-2xl relative border-x border-slate-200',
        header: 'sticky top-0 z-40 bg-white/90 backdrop-blur-md border-b border-slate-200 px-5 py-4 flex items-center justify-between shadow-sm',
        textMuted: 'text-slate-500',
        textTitle: 'text-slate-900',
        textDesc: 'text-slate-600',
        card: 'bg-white border border-slate-200/80 p-4 rounded-2xl shadow-sm',
        cardHover:
            'bg-white border border-slate-200 p-4 rounded-2xl shadow-sm flex gap-4 transition-all group relative overflow-hidden',
        input: 'w-full rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400/25 transition-all',
        inputLarge:
            'w-full h-20 rounded-xl border border-slate-200 bg-white px-4 py-2.5 text-xs text-slate-800 outline-none focus:border-slate-400 focus:ring-1 focus:ring-slate-400/25 transition-all resize-none',
        btnPrimary:
            'w-full py-3.5 bg-slate-900 hover:bg-slate-800 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 mt-4 shadow-md disabled:opacity-50',
        btnSecondary: 'bg-slate-100 border border-slate-200 text-slate-700 hover:bg-slate-200',
        badge: 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-slate-100 border border-slate-200 text-[8px] font-bold text-slate-700 tracking-wider uppercase mb-2',
        divider: 'h-px bg-slate-200 my-2',
        bannerBg: 'relative px-5 py-6 bg-slate-100 border-b border-slate-200 overflow-hidden',
        categoryBtn: (active: boolean) =>
            active
                ? 'bg-slate-900 border-slate-900 text-white shadow-sm scale-95'
                : 'bg-white border-slate-200 text-slate-600 hover:bg-slate-50',
        categoryList: 'flex gap-2 overflow-x-auto px-4 py-3 sticky top-[77px] z-30 bg-slate-50/90 backdrop-blur-md',
    },
    cozy: {
        outer: 'min-h-[100dvh] w-full bg-[linear-gradient(90deg,#fff3e0_0%,#ffe6c0_50%,#ffd99f_100%)] text-amber-950 flex flex-col font-sans max-w-md mx-auto shadow-2xl relative border-x border-amber-900/10',
        header: 'sticky top-0 z-40 bg-[#faf4ec]/95 backdrop-blur-md border-b border-amber-900/10 px-5 py-4 flex items-center justify-between shadow-sm',
        textMuted: 'text-amber-800/70',
        textTitle: 'text-amber-900',
        textDesc: 'text-amber-900/80',
        card: 'bg-white/80 border border-amber-900/10 p-4 rounded-2xl shadow-sm',
        cardHover:
            'bg-white/80 border border-amber-900/10 p-4 rounded-2xl shadow-sm flex gap-4 transition-all group relative overflow-hidden',
        input: 'w-full rounded-xl border border-amber-900/15 bg-white px-4 py-2.5 text-xs text-amber-950 outline-none focus:border-amber-600/40 focus:ring-1 focus:ring-amber-600/25 transition-all',
        inputLarge:
            'w-full h-20 rounded-xl border border-amber-900/15 bg-white px-4 py-2.5 text-xs text-amber-950 outline-none focus:border-amber-600/40 focus:ring-1 focus:ring-amber-600/25 transition-all resize-none',
        btnPrimary:
            'w-full py-3.5 bg-amber-850 hover:bg-amber-800 text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 mt-4 shadow-md disabled:opacity-50',
        btnSecondary: 'bg-amber-100 border border-amber-200 text-amber-850 hover:bg-amber-200',
        badge: 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-100 border border-amber-200/50 text-[8px] font-bold text-amber-800 tracking-wider uppercase mb-2',
        divider: 'h-px bg-amber-900/10 my-2',
        bannerBg: 'relative px-5 py-6 bg-[#faf4ec] border-b border-amber-900/10 overflow-hidden',
        categoryBtn: (active: boolean) =>
            active
                ? 'bg-amber-850 border-amber-800 text-white shadow-sm scale-95'
                : 'bg-white border-amber-900/10 text-amber-800 hover:bg-[#faf4ec]',
        categoryList: 'flex gap-2 overflow-x-auto px-4 py-3 sticky top-[77px] z-30 bg-[#fcf8f2]/90 backdrop-blur-md',
    },
    nanoBanana: {
        outer: 'min-h-[100dvh] w-full bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 max-w-md mx-auto shadow-[0_0_50px_rgba(234,179,8,0.15)] relative border-x border-amber-500/30 dark nano-banana',
        header: 'sticky top-0 z-40 bg-[#030712]/80 backdrop-blur-xl border-b border-amber-500/20 px-5 py-4 flex items-center justify-between shadow-[0_4px_20px_rgba(234,179,8,0.1)]',
        textMuted: 'text-amber-200/60',
        textTitle: 'text-amber-100 font-bold',
        textDesc: 'text-slate-300',
        card: 'bg-gradient-to-br from-amber-500/[0.05] to-transparent border border-amber-500/20 hover:border-amber-500/40 p-4 rounded-3xl shadow-[0_4px_20px_rgba(234,179,8,0.05)]',
        cardHover:
            'bg-gradient-to-br from-amber-500/[0.05] to-transparent border border-amber-500/20 hover:border-amber-500/50 p-4 rounded-3xl shadow-[0_4px_20px_rgba(234,179,8,0.08)] flex gap-4 transition-all group relative overflow-hidden',
        input: 'w-full rounded-xl border border-amber-500/30 bg-[#030712]/60 px-4 py-2.5 text-xs text-amber-100 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all',
        inputLarge:
            'w-full h-20 rounded-xl border border-amber-500/30 bg-[#030712]/60 px-4 py-2.5 text-xs text-amber-100 outline-none focus:border-amber-400 focus:ring-1 focus:ring-amber-400/30 transition-all resize-none',
        btnPrimary:
            'w-full py-3.5 bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 hover:brightness-110 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 mt-4 shadow-[0_0_20px_rgba(234,179,8,0.4)] disabled:opacity-50',
        btnSecondary: 'bg-amber-500/10 border border-amber-500/30 text-amber-300 hover:bg-amber-500/20',
        badge: 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-amber-500/20 border border-amber-500/40 text-[8px] font-extrabold text-amber-300 tracking-wider uppercase mb-2 shadow-[0_0_10px_rgba(234,179,8,0.2)]',
        divider: 'h-px bg-amber-500/20 my-2',
        bannerBg:
            'relative px-5 py-6 bg-gradient-to-r from-amber-950/40 via-yellow-950/20 to-[#030712] border-b border-amber-500/20 overflow-hidden',
        categoryBtn: (active: boolean) =>
            active
                ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 border-amber-400 text-slate-950 font-extrabold shadow-[0_0_15px_rgba(234,179,8,0.4)] scale-95'
                : 'bg-amber-500/[0.05] border-amber-500/20 text-amber-200/80 hover:border-amber-500/40',
        categoryList:
            'flex gap-2 overflow-x-auto px-4 py-3 sticky top-[77px] z-30 bg-[#030712]/90 backdrop-blur-xl border-b border-amber-500/10',
    },
    elvera: {
        outer: 'min-h-[100dvh] w-full bg-[#FAF5EE] text-[#1A1410] flex flex-col font-sans selection:bg-[#FF5B35]/20 max-w-md mx-auto shadow-2xl relative border-x border-[#E7D9CB]',
        header: 'sticky top-0 z-40 bg-[#FFF3EC]/95 backdrop-blur-md border-b border-[#E7D9CB] px-5 py-4 flex items-center justify-between shadow-sm',
        textMuted: 'text-[#7A6F63]',
        textTitle: 'text-[#1A1410]',
        textDesc: 'text-[#7A6F63]',
        card: 'bg-white border border-[#EFE2D4] p-4 rounded-2xl shadow-sm',
        cardHover:
            'bg-white border border-[#EFE2D4] p-4 rounded-2xl shadow-sm flex gap-4 transition-all group relative overflow-hidden',
        input: 'w-full rounded-xl border border-[#E7D9CB] bg-white px-4 py-2.5 text-xs text-[#1A1410] outline-none focus:border-[#FF5B35]/50 focus:ring-1 focus:ring-[#FF5B35]/30 transition-all',
        inputLarge:
            'w-full h-20 rounded-xl border border-[#E7D9CB] bg-white px-4 py-2.5 text-xs text-[#1A1410] outline-none focus:border-[#FF5B35]/50 focus:ring-1 focus:ring-[#FF5B35]/30 transition-all resize-none',
        btnPrimary:
            'w-full py-3.5 bg-[#FF5B35] hover:bg-[#E04E2B] text-white rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 mt-4 shadow-md disabled:opacity-50',
        btnSecondary: 'bg-[#FCE3D6] border border-[#F0D9C8] text-[#A8521F] hover:bg-[#FBE7D6]',
        badge: 'inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-[#FF5B35]/10 border border-[#FF5B35]/25 text-[8px] font-bold text-[#C9431F] tracking-wider uppercase mb-2',
        divider: 'h-px bg-[#E7D9CB] my-2',
        bannerBg:
            'relative px-5 py-6 bg-gradient-to-r from-[#FFF3EC] via-[#FFE6C0] to-[#FFD99F] border-b border-[#E7D9CB] overflow-hidden',
        categoryBtn: (active: boolean) =>
            active
                ? 'bg-[#FF5B35] border-[#E04E2B] text-white shadow-md scale-95'
                : 'bg-white border-[#E7D9CB] text-[#7A6F63] hover:bg-[#FFF3EC]',
        categoryList:
            'flex gap-2 overflow-x-auto px-4 py-3 sticky top-[77px] z-30 bg-[#FAF5EE]/90 backdrop-blur-md border-b border-[#E7D9CB]',
    },
};

export function buildTheme(screenMode: string, tenantLayout: string): DerivedTheme {
    const isNanoBanana = screenMode === 'nano-banana' || tenantLayout === 'nano-banana';
    const activeTheme = isNanoBanana
        ? theme.nanoBanana
        : tenantLayout === 'minimalist-light'
          ? theme.minimalist
          : tenantLayout === 'warm-cozy'
            ? theme.cozy
            : tenantLayout === 'premium' || screenMode === 'premium'
              ? theme.premium
              : theme.elvera;
    const isDarkTheme = isNanoBanana || tenantLayout === 'premium' || screenMode === 'premium';

    const modalStyle: ModalStyle = {
        bg: isDarkTheme
            ? isNanoBanana
                ? 'bg-[#111827] border-amber-500/25'
                : 'bg-[#0d2a21] border-[#0F8A4D]/25'
            : 'bg-[#FAF5EE] border-amber-900/10',
        textTitle: isDarkTheme ? 'text-white' : 'text-[#1A1410]',
        textDesc: isDarkTheme ? 'text-slate-300' : 'text-[#7A6F63]',
        accentText: isDarkTheme ? (isNanoBanana ? 'text-amber-400' : 'text-[#0F8A4D]') : 'text-[#FF5B35]',
        accentBorder: isDarkTheme
            ? isNanoBanana
                ? 'border-amber-500/20'
                : 'border-[#0F8A4D]/20'
            : 'border-[#FF5B35]/15',
        accentBg: isDarkTheme ? (isNanoBanana ? 'bg-amber-500/10' : 'bg-[#0F8A4D]/10') : 'bg-[#FF5B35]/10',
        cardBg: isDarkTheme ? 'bg-white/5 border-white/5' : 'bg-[#FFF3EC] border-[#FF5B35]/10',
        divider: isDarkTheme ? 'bg-white/10' : 'bg-amber-900/10',
        button: isDarkTheme
            ? isNanoBanana
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/25'
                : 'bg-[#0F8A4D] hover:bg-[#0c6e3d] text-white shadow-md shadow-[#0F8A4D]/25'
            : 'bg-[#FF5B35] text-white hover:bg-[#E04E2B] shadow-md shadow-[#FF5B35]/25',
        pinBox: isDarkTheme
            ? 'bg-white/5 border border-white/10 text-white'
            : 'bg-white border border-amber-900/15 text-[#1A1410]',
        pinKey: isDarkTheme
            ? 'bg-white/5 border border-white/5 text-white hover:bg-white/10'
            : 'bg-white border border-amber-900/10 text-[#1A1410] hover:bg-slate-50',
    };

    const headerBg = isDarkTheme
        ? isNanoBanana
            ? 'bg-[#030712]'
            : 'bg-[#04130f]'
        : tenantLayout === 'warm-cozy'
          ? 'bg-[#faf4ec]'
          : 'bg-[#FAF5EE]';
    const headerBorder = isDarkTheme ? 'border-b border-white/5' : 'border-b border-amber-900/10';

    return { activeTheme, isDarkTheme, modalStyle, headerBg, headerBorder };
}
