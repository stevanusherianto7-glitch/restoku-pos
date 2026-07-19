import { SearchIcon, ShoppingCartIcon } from '../../../Components/icons';

interface AppHeaderProps {
    appStage: 'landing' | 'welcome' | 'howto' | 'app';
    headerBg: string;
    headerBorder: string;
    activeTheme: { header: string };
    outletName: string;
    tableNumber: string | null;
    isNanoBanana: boolean;
    activeTab: string;
    setActiveTab: (t: 'menu' | 'cart' | 'reservasi' | 'galeri' | 'status') => void;
    cartTotalItems: number;
    categories: string[];
    activeCategory: string;
    setActiveCategory: (c: string) => void;
    searchQuery: string;
    setSearchQuery: (s: string) => void;
    renderLogo: (cls: string) => React.ReactNode;
}

export function AppHeader(props: AppHeaderProps) {
    const {
        appStage,
        headerBg,
        headerBorder,
        activeTheme,
        outletName,
        tableNumber,
        isNanoBanana,
        activeTab,
        setActiveTab,
        cartTotalItems,
        categories,
        activeCategory,
        setActiveCategory,
        searchQuery,
        setSearchQuery,
        renderLogo,
    } = props;

    return (
        <div
            className={`${appStage === 'app' ? `sticky top-0 z-40 ${headerBg} ${headerBorder}` : 'fixed inset-x-0 top-0 -z-10 opacity-0 pointer-events-none'} flex flex-col shrink-0`}
        >
            <header
                className={`${activeTheme.header} !static !bg-transparent !border-b-0 !shadow-none !px-4 !py-3 !flex-col !items-stretch gap-3`}
            >
                <div className="flex items-center gap-3">
                    <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 overflow-hidden">
                        {renderLogo('size-7 text-slate-950')}
                    </div>
                    <div>
                        <h1 className="text-sm font-black tracking-tight text-white uppercase">{outletName}</h1>
                        {appStage === 'app' && (
                            <p className="text-[10px] font-bold text-emerald-400/90 flex items-center gap-1.5 uppercase tracking-wide">
                                <span className="size-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                                {tableNumber ? `Meja ${tableNumber}` : 'Scan Meja Anda'}
                            </p>
                        )}
                    </div>
                </div>

                <div className="flex bg-white/5 border border-white/10 rounded-xl p-0.5 max-w-full overflow-x-auto gap-0.5">
                    <button
                        onClick={() => setActiveTab('menu')}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all shrink-0 ${
                            activeTab === 'menu'
                                ? isNanoBanana
                                    ? 'bg-amber-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(234,179,8,0.3)]'
                                    : 'bg-emerald-500 text-slate-950 shadow'
                                : 'text-slate-400'
                        }`}
                    >
                        Menu
                    </button>
                    <button
                        onClick={() => setActiveTab('reservasi')}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all shrink-0 ${
                            activeTab === 'reservasi'
                                ? isNanoBanana
                                    ? 'bg-amber-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(234,179,8,0.3)]'
                                    : 'bg-emerald-500 text-slate-950 shadow'
                                : 'text-slate-400'
                        }`}
                    >
                        Reservasi
                    </button>
                    <button
                        onClick={() => setActiveTab('galeri')}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all shrink-0 ${
                            activeTab === 'galeri'
                                ? isNanoBanana
                                    ? 'bg-amber-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(234,179,8,0.3)]'
                                    : 'bg-emerald-500 text-slate-950 shadow'
                                : 'text-slate-400'
                        }`}
                    >
                        Galeri
                    </button>
                    <button
                        data-testid="cart-tab"
                        onClick={() => setActiveTab('cart')}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all flex items-center gap-1 shrink-0 ${
                            activeTab === 'cart'
                                ? isNanoBanana
                                    ? 'bg-amber-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(234,179,8,0.3)]'
                                    : 'bg-emerald-500 text-slate-950 shadow'
                                : 'text-slate-400'
                        }`}
                    >
                        <ShoppingCartIcon className="size-3" />
                        {cartTotalItems > 0 && <span>{cartTotalItems}</span>}
                    </button>
                    <button
                        onClick={() => setActiveTab('status')}
                        className={`px-2.5 py-1.5 rounded-lg text-[10px] font-bold transition-all shrink-0 ${
                            activeTab === 'status'
                                ? isNanoBanana
                                    ? 'bg-amber-500 text-slate-950 font-bold shadow-[0_0_10px_rgba(234,179,8,0.3)]'
                                    : 'bg-[#FF5B35] text-white shadow'
                                : 'text-slate-400'
                        }`}
                    >
                        Status
                    </button>
                </div>
            </header>

            {activeTab === 'menu' && (
                <div className="flex flex-col gap-2 pb-3.5">
                    <div className="flex gap-2 overflow-x-auto px-4">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4.5 py-2 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                                    activeCategory === cat
                                        ? isNanoBanana
                                            ? 'bg-amber-500 border-amber-400 text-slate-950 shadow-lg shadow-amber-500/10 scale-95'
                                            : 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/10 scale-95'
                                        : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

                    <div className="px-4 pt-1">
                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-2.5 shadow-inner focus-within:border-emerald-500/40 focus-within:ring-1 focus-within:ring-emerald-500/25 transition-all">
                            <SearchIcon className="size-4 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari menu terlaris kami..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent text-xs text-slate-100 outline-none w-full placeholder:text-slate-500"
                            />
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
}
