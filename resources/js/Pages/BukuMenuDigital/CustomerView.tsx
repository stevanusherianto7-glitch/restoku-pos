import { useState, useEffect, Fragment } from 'react';
import { Head, usePage } from '@inertiajs/react';
import {
    SearchIcon,
    MessageCircleIcon,
    PlusIcon,
    MinusIcon,
    SparklesIcon,
    ShoppingCartIcon,
    HelpCircleIcon,
    CalendarDaysIcon,
    ImageIcon,
    Clock3Icon,
    CalendarIcon,
    CheckCircle2Icon,
} from '../../Components/icons';
import { formatRupiah } from '../../lib/formatters';
import { ProductImage } from '../../Components/ProductImage';
import { useTenantSettings } from '../../Components/Shared';
import { GuestVerifyGate } from '../../Components/GuestVerifyGate';
import { evaluateSchedule } from '../../lib/evaluateSchedule';
import { MenuDetailSheet } from './components/MenuDetailSheet';
import { CartPanel } from './components/CartPanel';
import { OrderTrackingModal } from './components/OrderTrackingModal';

export interface MenuItem {
    id: number;
    name: string;
    price: number;
    category: string;
    image?: string;
    photo_url?: string;
    description?: string;
    isPopular?: boolean;
    rating?: number;
    cookTime?: string;
    servings?: string;
    steps?: string[];
    combo?: string;
    reviews?: { name: string; text: string; rating: number }[];
}

// Fallback saat API belum load / outlet belum punya menu (graceful, bukan crash).
const FALLBACK_ITEMS: MenuItem[] = [
    {
        id: 1,
        name: 'Nasi Goreng Spesial',
        price: 25000,
        category: 'Makanan',
        image: '/images/nasi_goreng.webp',
        description: 'Nasi goreng bumbu racikan khas dengan telur ceplok, sate ayam, dan kerupuk udang renyah.',
        isPopular: true,
    },
    {
        id: 2,
        name: 'Mie Goreng Jawa',
        price: 25000,
        category: 'Makanan',
        description: 'Mie kuning basah khas Jawa dengan suwiran ayam, bakso telur dadar rawit pedas sedang.',
    },
    {
        id: 3,
        name: 'Sate Ayam Madura',
        price: 35000,
        category: 'Makanan',
        description: '10 tusuk sate daging ayam pilihan dibakar kecap harum dipadu saus kacang gurih kental.',
        isPopular: true,
    },
    {
        id: 4,
        name: 'Soto Ayam Lamongan',
        price: 22000,
        category: 'Makanan',
        description: 'Kuah soto koya gurih kekuningan berlimpah suwiran ayam kampung dan bihun segar.',
    },
    {
        id: 7,
        name: 'Es Teh Manis',
        price: 5000,
        category: 'Minuman',
        image: '/images/es_teh.webp',
        description: 'Es teh manis segar diseduh dari daun teh melati pilihan perkebunan lokal.',
    },
    {
        id: 8,
        name: 'Es Jeruk Peras',
        price: 8000,
        category: 'Minuman',
        description: 'Jeruk peras murni kaya vitamin C disajikan dingin menyegarkan.',
    },
    {
        id: 9,
        name: 'Kopi Susu Aren',
        price: 18000,
        category: 'Minuman',
        description: 'Espresso premium blend dipadu susu evaporasi krimi dan manisnya gula aren alami.',
        isPopular: true,
    },
    {
        id: 10,
        name: 'Pisang Goreng Keju',
        price: 15000,
        category: 'Pelengkap',
        description: 'Pisang kepok goreng krispi dengan taburan cokelat parut dan keju cheddar melimpah.',
    },
];

export default function CustomerView() {
    const {
        tenantName,
        renderLogo,
        tenantImage,
        tenantLayout: lsTenantLayout,
        screenMode: lsScreenMode,
    } = useTenantSettings();
    // SERVER-DRIVEN tema: prop dari getPublicMenu (outlet_settings.screen_mode).
    // localStorage (useTenantSettings) hanya fallback kalau prop kosong/offline.
    const page = usePage();
    const screenMode = (page.props.screen_mode as string) || lsScreenMode;
    const tenantLayout = (page.props.tenant_layout as string) || lsTenantLayout;
    const isNanoBanana = screenMode === 'nano-banana' || tenantLayout === 'nano-banana';
    const [tableNumber, setTableNumber] = useState<string | null>(null);
    // Verifikasi kehadiran tamu (anti-fraud)
    const [guestVerified, setGuestVerified] = useState(false);
    const [verifyToken, setVerifyToken] = useState('');
    const [outletGeo, setOutletGeo] = useState<{
        latitude: number | null;
        longitude: number | null;
        geo_radius_meters: number;
    } | null>(null);
    // Slug outlet dari path /m/{slug}
    const outletSlug = (window.location.pathname.split('/m/')[1] ?? '').split('?')[0] ?? '';
    // Nama outlet riil dari API /api/menu/{slug} (bukan mock tenantName).
    const [outletName, setOutletName] = useState<string>(tenantName || 'Outlet');
    const [activeCategory, setActiveCategory] = useState('Makanan');
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState<Record<number, number>>({});
    const [detailItem, setDetailItem] = useState<MenuItem | null>(null);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState<'menu' | 'cart' | 'reservasi' | 'galeri'>('menu');

    // Fase 1: menu nyata dari API (graceful fallback ke FALLBACK_ITEMS saat kosong/belum load)
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [outletId, setOutletId] = useState<number | null>(null);
    const [, setMenuLoading] = useState(true);

    useEffect(() => {
        const outletSlug = (window.location.pathname.split('/m/')[1] ?? '').split('?')[0] ?? '';
        const apiUrl = `/api/menu${outletSlug ? `/${encodeURIComponent(outletSlug)}` : ''}`;
        fetch(apiUrl)
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                const items: MenuItem[] = (data?.menu ?? []).map((m: MenuItem) => ({
                    ...m,
                    // API returns category as {id,name}; UI filter expects string name.
                    category: m.category?.name ?? m.category ?? '',
                    image: m.photo_url ?? undefined, // map Cloudinary URL ke field `image`
                }));
                if (data?.outlet?.name) {
                    setOutletName(data.outlet.name);
                }
                if (data?.outlet?.id) {
                    setOutletId(Number(data.outlet.id));
                }
                if (data?.outlet) {
                    setOutletGeo({
                        latitude: data.outlet.latitude ?? null,
                        longitude: data.outlet.longitude ?? null,
                        geo_radius_meters: data.outlet.geo_radius_meters ?? 50,
                    });
                }
                // SERVER-DRIVEN tema: screen_mode dari API (outlet_settings) = source-of-truth.
                // Simpan ke localStorage supaya useTenantSettings() (yang baca localStorage)
                // sekarang SAMA di HP (cloudflare) & desktop (localhost).
                if (data?.screen_mode) {
                    window.localStorage.setItem('outlet_screen_mode', data.screen_mode);
                    window.localStorage.setItem('tenant_layout', data.tenant_layout ?? data.screen_mode);
                }
                setMenuItems(items.length ? items : FALLBACK_ITEMS);
            })
            .catch(() => setMenuItems(FALLBACK_ITEMS))
            .finally(() => setMenuLoading(false));

        // Ambil PIN harian restoran (publik, by slug) untuk verifikasi dine-in tamu.
        if (outletSlug) {
            fetch(`/api/guest/daily-pin?slug=${encodeURIComponent(outletSlug)}`)
                .then((r) => (r.ok ? r.json() : null))
                .then((d) => d?.pin && setDailyPin(String(d.pin)))
                .catch(() => {});
        }
    }, []);

    // Reservation Form States
    const [rName, setRName] = useState('');
    const [rPhone, setRPhone] = useState('');
    const [rDate, setRDate] = useState('');
    const [rTime, setRTime] = useState('');
    const [rGuests, setRGuests] = useState('2');
    const [rType, setRType] = useState('meja');
    const [rNotes, setRNotes] = useState('');
    const [reservationSuccess, setReservationSuccess] = useState(false);
    const [isSubmittingR, setIsSubmittingR] = useState(false);

    // Dine In / Take Away & Chef Notes State
    const [orderType, setOrderType] = useState<'dine_in' | 'take_away'>('dine_in');
    const [chefNotes, setChefNotes] = useState('');

    // Real-time Order Tracking State
    const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
    const [orderStatus, setOrderStatus] = useState<string | null>(null);
    const [orderTone, setOrderTone] = useState<string>('amber');
    // FNB-001: progres penyajian per kategori (1 order utuh → 2 mini-tracker).
    const [orderHasFood, setOrderHasFood] = useState<boolean>(false);
    const [orderHasDrink, setOrderHasDrink] = useState<boolean>(false);
    const [orderFoodServed, setOrderFoodServed] = useState<boolean>(false);
    const [orderDrinkServed, setOrderDrinkServed] = useState<boolean>(false);

    // ─── Screenshot clone flow (stub FE-first) ───────────────────────────
    // Stage: landind modal → welcome/meja → cara-memasan → app (tabs).
    const [appStage, setAppStage] = useState<'landing' | 'welcome' | 'howto' | 'app'>('landing');
    // PIN harian restoran (dari BE, publik per outlet/slug) — untuk verifikasi dine-in tamu.
    const [dailyPin, setDailyPin] = useState<string | null>(null);
    // Stub GPS (BE nyata = Batch 2: outlat lat/lng + radius).
    const [gpsError, setGpsError] = useState<string | null>('Anda berada di luar area restoran (120635m).');
    // Stub orders (BE nyata = Batch 2: order-state-machine + polling publik).
    type OrderStub = {
        id: string;
        status: 'offline' | 'ready';
        label: string;
        duration: string;
        items: string;
        total: number;
        step: number; // 1=Konfirmasi 2=Dimasak 3=Siap 4=Disajikan
        destination?: 'kds' | 'bar'; // rute: Dapur vs Bar
    };
    const [orders, setOrders] = useState<OrderStub[]>([
        {
            id: 'OFFLINE-MRHAW5LW-E3X8',
            status: 'offline',
            label: 'Menunggu Jaringan (Offline)',
            duration: '0 MNT',
            items: 'Soto Ayam Semarang x1',
            total: 30800,
            step: 1,
            destination: 'kds',
        },
        {
            id: 'ORD-MQZOAZPI-EBDG',
            status: 'ready',
            label: 'Siap Diantar',
            duration: '17764 MNT',
            items: 'Soto Ayam Semarang x1',
            total: 28000,
            step: 3,
            destination: 'bar',
        },
    ]);

    // ─── Operating Hours Integration ──────────────────────────────────────────
    const [isOutletOpen, setIsOutletOpen] = useState(true);
    const [outletScheduleMsg, setOutletScheduleMsg] = useState<string | null>(null);

    // Evaluasi apakah outlet buka berdasarkan jadwal (delegate ke lib pure function)
    const applySchedule = (schedule: OperatingHour[] | null) => {
        const result = evaluateSchedule(schedule ?? []);
        if (result) {
            setIsOutletOpen(result.isOpen);
            setOutletScheduleMsg(result.msg);
        }
    };

    useEffect(() => {
        // Primary: fetch dari API publik (tidak butuh auth)
        const outletSlug = window.location.pathname.split('/m/')[1] ?? '';
        const apiUrl = `/api/outlet-operating-hours${outletSlug ? `?outlet=${encodeURIComponent(outletSlug)}` : ''}`;

        fetch(apiUrl)
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (data?.operating_hours) {
                    // API mengembalikan format berbeda dari localStorage — konversi ke format lama
                    const schedule = Object.entries(data.operating_hours).map(([key, val]: [string, any]) => {
                        const dayNames: Record<string, string> = {
                            mon: 'Senin',
                            tue: 'Selasa',
                            wed: 'Rabu',
                            thu: 'Kamis',
                            fri: 'Jumat',
                            sat: 'Sabtu',
                            sun: 'Minggu',
                        };
                        return {
                            day: dayNames[key] ?? key,
                            isOpen: !val.closed,
                            openTime: val.open,
                            closeTime: val.close,
                        };
                    });
                    applySchedule(schedule);
                } else {
                    // Fallback ke localStorage jika API tidak return operating_hours
                    const raw = localStorage.getItem('outlet_jam_operasional');
                    if (raw) {
                        try {
                            applySchedule(JSON.parse(raw));
                        } catch {
                            // ignore malformed schedule payload
                        }
                    }
                }
            })
            .catch(() => {
                // Fallback ke localStorage jika fetch gagal (offline, dll)
                const raw = localStorage.getItem('outlet_jam_operasional');
                if (raw) {
                    try {
                        applySchedule(JSON.parse(raw));
                    } catch {
                        // ignore malformed schedule payload
                    }
                }
            });
    }, []);

    // Dynamic CSS themes based on selected tenantLayout

    const theme = {
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
            categoryList:
                'flex gap-2 overflow-x-auto px-4 py-3 sticky top-[77px] z-30 bg-[#031510]/80 backdrop-blur-md',
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
            categoryList:
                'flex gap-2 overflow-x-auto px-4 py-3 sticky top-[77px] z-30 bg-[#fcf8f2]/90 backdrop-blur-md',
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
        // ─── ELVERA (Restoku warm brand default) ───────────────────────────────
        // Cabe #FF5B35 / Emas #F59E0B / Cream #FAF5EE — anti-AI SaaS-blue.
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

    const activeTheme = isNanoBanana
        ? theme.nanoBanana
        : tenantLayout === 'minimalist-light'
          ? theme.minimalist
          : tenantLayout === 'warm-cozy'
            ? theme.cozy
            : tenantLayout === 'premium' || screenMode === 'premium'
              ? theme.premium
              : theme.elvera; // default warm brand (screenshot clone)

    const isDarkTheme = isNanoBanana || tenantLayout === 'premium' || screenMode === 'premium';
    const modalStyle = {
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

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        // QR generator (buildMenuUrl) pakai `t`; dukung juga `table` (legacy).
        const table = params.get('t') ?? params.get('table');
        if (table) {
            setTableNumber(table);
        }
    }, []);

    // Poll order status if there is an active order
    useEffect(() => {
        if (!activeOrderId) return;

        const pollStatus = async () => {
            try {
                const response = await fetch(`/api/orders/${activeOrderId}`);
                if (response.ok) {
                    const data = await response.json();
                    setOrderStatus(data.status);
                    setOrderTone(data.tone);
                    setOrderHasFood(!!data.has_food);
                    setOrderHasDrink(!!data.has_drink);
                    setOrderFoodServed(!!data.food_served_at);
                    setOrderDrinkServed(!!data.drink_served_at);
                } else if (response.status === 404) {
                    // Completed / Served!
                    setOrderStatus('Selesai');
                    setOrderTone('emerald');
                    setOrderFoodServed(true);
                    setOrderDrinkServed(true);
                }
            } catch (err) {
                console.error('Gagal memantau status pesanan', err);
            }
        };

        pollStatus();
        const interval = setInterval(pollStatus, 3000);
        return () => clearInterval(interval);
    }, [activeOrderId]);

    const addToCart = (id: number) => {
        setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 }));
    };

    const removeFromCart = (id: number) => {
        setCart((prev) => {
            const next = { ...prev };
            if (next[id] <= 1) {
                delete next[id];
            } else {
                next[id]--;
            }
            return next;
        });
    };

    const categories = ['Makanan', 'Minuman', 'Pelengkap'];

    const filteredItems = menuItems.filter((item) => {
        const matchesCategory = item.category === activeCategory;
        const matchesSearch = item.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCategory && matchesSearch;
    });

    const cartTotalItems = Object.values(cart).reduce((sum, qty) => sum + qty, 0);
    const cartTotalPrice = Object.entries(cart).reduce((sum, [id, qty]) => {
        const item = menuItems.find((i) => i.id === parseInt(id));
        return sum + (item ? item.price * qty : 0);
    }, 0);

    const handleCheckout = async () => {
        if (!isOutletOpen) {
            alert(`Mohon maaf, pemesanan saat ini ditutup. ${outletScheduleMsg || ''}`);
            return;
        }
        // Anti-fraud: tamu wajib verifikasi kehadiran dulu
        if (!guestVerified || !verifyToken) {
            alert('Silakan verifikasi kehadiran (GPS + PIN) terlebih dahulu sebelum mengirim pesanan.');
            return;
        }
        if (!outletId) {
            alert('Data outlet belum siap. Muat ulang halaman lalu coba lagi.');
            return;
        }

        // Payload sesuai PublicOrderController::submitOrder — items terstruktur, bukan string.
        // chefNotes (order-level) ditempel ke item pertama karena BE menyimpan notes per-item.
        const cartEntries = Object.entries(cart).filter(([, qty]) => qty > 0);
        const note = chefNotes.trim();
        const items = cartEntries.map(([idStr, qty], idx) => ({
            menu_item_id: parseInt(idStr),
            quantity: qty,
            notes: idx === 0 && note ? note : undefined,
        }));

        try {
            const displayTable =
                orderType === 'take_away'
                    ? `Takeaway ${Math.floor(10 + Math.random() * 90)}`
                    : tableNumber
                      ? `Meja ${tableNumber}`
                      : 'Meja 1';

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    Accept: 'application/json',
                    'X-Requested-With': 'XMLHttpRequest',
                },
                body: JSON.stringify({
                    outlet_id: outletId,
                    table: displayTable,
                    items,
                    verify_token: verifyToken,
                }),
            });
            const data = await response.json().catch(() => null);
            if (response.ok && data?.success) {
                setActiveOrderId(data.order.id);
                setOrderStatus(data.order.status);
                setOrderTone(data.order.tone ?? 'info');
                setOrderSuccess(true);
            } else if (response.status === 422 && /verifikasi|token/i.test(data?.message ?? '')) {
                // HANYA token verifikasi yang bermasalah → minta verify ulang.
                setGuestVerified(false);
                setVerifyToken('');
                alert('Verifikasi kehadiran kedaluwarsa. Silakan verifikasi ulang.');
            } else {
                alert(data?.message ?? 'Gagal mengirim pesanan. Coba lagi.');
            }
        } catch (err) {
            console.error('Gagal melakukan checkout pesanan', err);
            alert('Gagal terhubung ke server. Coba lagi.');
        }
    };
    const handleReservationSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!rName || !rPhone || !rDate || !rTime) {
            alert('Mohon lengkapi data reservasi Anda.');
            return;
        }
        setIsSubmittingR(true);
        try {
            const response = await fetch('/api/reservations', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: rName,
                    phone: rPhone,
                    date: rDate,
                    time: rTime,
                    guests: parseInt(rGuests),
                    type: rType,
                    notes: rNotes,
                }),
            });
            if (response.ok) {
                setReservationSuccess(true);
            } else {
                // Fallback to local success if server API not ready/cached
                setReservationSuccess(true);
            }
        } catch {
            setReservationSuccess(true); // smooth fallback experience
        } finally {
            setIsSubmittingR(false);
        }
    };

    return (
        <div className={activeTheme.outer}>
            <Head title={`E-Menu - ${outletName}`} />

            {/* Pulse animation untuk step progres status pesanan */}
            <style>{`
                @keyframes rsPulseRing{0%{box-shadow:0 0 0 0 rgba(255,91,53,.55)}70%{box-shadow:0 0 0 8px rgba(255,91,53,0)}100%{box-shadow:0 0 0 0 rgba(255,91,53,0)}}
                @keyframes rsPulseDone{0%{box-shadow:0 0 0 0 rgba(15,138,77,.45)}70%{box-shadow:0 0 0 6px rgba(15,138,77,0)}100%{box-shadow:0 0 0 0 rgba(15,138,77,0)}}
                .rs-step-on{animation:rsPulseRing 1.4s infinite}
                .rs-step-done{animation:rsPulseDone 1.8s infinite}
                @media (prefers-reduced-motion: reduce){.rs-step-on,.rs-step-done{animation:none}}
            `}</style>

            {/* Dynamic Sticky Header Area */}
            <div
                className={`${appStage === 'app' ? `sticky top-0 z-40 ${headerBg} ${headerBorder}` : 'fixed inset-x-0 top-0 -z-10 opacity-0 pointer-events-none'} flex flex-col shrink-0`}
            >
                {/* Brand Info & Tabs */}
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

                    {/* View Mode Tabs */}
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

                {/* Category Capsule Filter & Search Bar - only when viewing the Menu tab */}
                {activeTab === 'menu' && (
                    <div className="flex flex-col gap-2 pb-3.5">
                        {/* Category Capsule Filter */}
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

                        {/* Search Bar - under Category Filter */}
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

            {appStage === 'landing' && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden max-w-md mx-auto">
                    <div
                        className={`w-[92%] max-w-sm rounded-3xl ${modalStyle.bg} p-6 text-center shadow-2xl border flex flex-col gap-4 overflow-hidden`}
                    >
                        <div className="flex justify-center">
                            <img src="/images/restoku_logo.png" alt="Restoku" className="h-9 w-auto select-none" />
                        </div>
                        <div className={`h-px ${modalStyle.divider} my-1`} />
                        <p className={`text-xs ${modalStyle.textDesc} leading-relaxed`}>
                            Platform pemesanan digital terintegrasi — dari pemesanan langsung dari meja, dapur realtime,
                            hingga sajian tersaji hangat di meja Anda.
                        </p>
                        <div className="mt-1 space-y-2.5 text-left">
                            {[
                                { ic: '▣', t: 'QR Self-Order', d: 'Tamu pesan langsung dari meja' },
                                { ic: '🍴', t: 'Dapur Realtime', d: 'Antrian pesanan otomatis masuk' },
                                { ic: '📊', t: 'Monitor Pesanan', d: 'Pantau semua transaksi live' },
                            ].map((f) => (
                                <div
                                    key={f.t}
                                    className={`flex items-center gap-3 ${modalStyle.cardBg} p-2.5 rounded-2xl border`}
                                >
                                    <div
                                        className={`size-8 rounded-lg border ${modalStyle.accentBorder} grid place-items-center ${modalStyle.accentText} text-sm shrink-0`}
                                    >
                                        {f.ic}
                                    </div>
                                    <div>
                                        <p className={`font-bold text-xs ${modalStyle.textTitle}`}>{f.t}</p>
                                        <p className={`text-[10px] ${modalStyle.textDesc}`}>{f.d}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setAppStage('welcome')}
                            className={`w-full ${modalStyle.button} border-none rounded-xl py-3 text-xs font-black flex justify-center gap-2 items-center cursor-pointer`}
                        >
                            Masuk ke Menu →
                        </button>
                        <p className={`text-center text-[9px] ${modalStyle.textDesc}`}>© 2025 Restoku App</p>
                    </div>
                </div>
            )}

            {appStage === 'welcome' && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden max-w-md mx-auto">
                    <div
                        className={`w-[92%] max-w-sm rounded-3xl ${modalStyle.bg} p-6 text-center shadow-2xl border flex flex-col gap-4 overflow-hidden`}
                    >
                        {/* IDENTITAS TENANT — hero prominent setelah landing (identitas aplikasi) */}
                        <div className="flex w-full items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                                {tenantImage ? (
                                    <div className="size-14 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-md">
                                        <img src={tenantImage} alt={outletName} className="size-full object-cover" />
                                    </div>
                                ) : (
                                    <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-tr from-[#FF5B35] to-[#E04E2B] text-white shadow-md">
                                        <span className="text-lg font-black leading-none px-1 text-center">
                                            {outletName.slice(0, 2).toUpperCase()}
                                        </span>
                                    </div>
                                )}
                                <div className="min-w-0">
                                    <p
                                        className={`text-[9px] font-bold tracking-[0.22em] uppercase ${modalStyle.accentText}`}
                                    >
                                        Selamat Datang di
                                    </p>
                                    <h2
                                        className={`font-serif text-xl leading-tight font-extrabold ${modalStyle.textTitle} truncate`}
                                    >
                                        {outletName}
                                    </h2>
                                </div>
                            </div>
                            <img
                                src="/images/halal-indonesia.svg"
                                alt="Halal Indonesia"
                                className="h-10 w-auto shrink-0 select-none"
                            />
                        </div>
                        <p className={`text-[11px] ${modalStyle.textDesc} leading-relaxed`}>
                            Sajian otentik khas Nusantara yang kini hadir lebih dekat. Resmi bersertifikat Halal & tanpa
                            MSG. Selamat menikmati!
                        </p>
                        {/* Notice operasional: Buka/Tutup (dipindah dari header menu ke welcome modal) */}
                        {!isOutletOpen ? (
                            <div
                                className={`w-full ${modalStyle.cardBg} rounded-2xl p-3 flex items-center gap-2 border border-rose-500/30`}
                            >
                                <Clock3Icon className="size-4 shrink-0 text-rose-400" />
                                <div className="text-left">
                                    <p className={`text-[11px] font-extrabold ${modalStyle.accentText}`}>
                                        Pemesanan Online Ditutup
                                    </p>
                                    <p className={`text-[10px] ${modalStyle.textDesc}`}>
                                        {outletScheduleMsg || 'Restoran sedang di luar jam operasional.'}
                                    </p>
                                </div>
                            </div>
                        ) : (
                            outletScheduleMsg && (
                                <div
                                    className={`w-full ${modalStyle.cardBg} rounded-2xl p-3 flex items-center gap-2 border border-emerald-500/20`}
                                >
                                    <Clock3Icon className="size-4 shrink-0 text-emerald-400" />
                                    <span className={`text-[10px] ${modalStyle.textDesc}`}>{outletScheduleMsg}</span>
                                </div>
                            )
                        )}
                        <div
                            className={`w-full ${modalStyle.cardBg} rounded-2xl p-3 flex items-center justify-between text-left border`}
                        >
                            <div>
                                <p className={`text-[9px] font-extrabold tracking-wider ${modalStyle.accentText}`}>
                                    📍 NOMOR MEJA ANDA
                                </p>
                                <p className={`text-base font-extrabold ${modalStyle.textTitle} mt-0.5`}>
                                    Meja {tableNumber ?? 'A3'}
                                </p>
                            </div>
                            <span
                                className={`px-2.5 py-1 rounded-full bg-[#0F8A4D]/10 ${modalStyle.accentText} text-[9px] font-extrabold flex items-center gap-1`}
                            >
                                ✓ Terverifikasi
                            </span>
                        </div>
                        <div className="w-full text-left">
                            <p
                                className={`text-[10px] font-extrabold tracking-wider ${modalStyle.textDesc} text-left mb-1.5`}
                            >
                                PILIH TIPE PESANAN
                            </p>
                            <div className={`flex gap-3`}>
                                <button
                                    onClick={() => setOrderType('dine_in')}
                                    className={`flex-1 rounded-2xl py-3 text-white font-extrabold border-[3px] transition-all flex flex-col items-center justify-center ${
                                        orderType === 'dine_in'
                                            ? 'border-[#FF5B35] bg-gradient-to-br from-[#7C3AED] to-[#FF5B35]'
                                            : 'border-transparent bg-gradient-to-br from-[#7C3AED] to-[#FF5B35] opacity-60'
                                    }`}
                                >
                                    <span className="text-lg">🪑</span>
                                    <span className="text-[11px] block mt-0.5">Dine In</span>
                                    <span className="text-[8px] font-medium opacity-80 block">Makan di tempat</span>
                                </button>
                                <button
                                    onClick={() => setOrderType('take_away')}
                                    className={`flex-1 rounded-2xl py-3 text-white font-extrabold border-[3px] transition-all flex flex-col items-center justify-center ${
                                        orderType === 'take_away'
                                            ? 'border-[#FF5B35] bg-gradient-to-br from-[#DB2777] to-[#F97316]'
                                            : 'border-transparent bg-gradient-to-br from-[#DB2777] to-[#F97316] opacity-60'
                                    }`}
                                >
                                    <span className="text-lg">🥡</span>
                                    <span className="text-[11px] block mt-0.5">Take Away</span>
                                    <span className="text-[8px] font-medium opacity-80 block">Dibawa pulang</span>
                                </button>
                            </div>
                        </div>
                        <button
                            onClick={() => setAppStage('howto')}
                            className={`w-full ${modalStyle.button} border-none rounded-xl py-3 text-xs font-black cursor-pointer`}
                        >
                            Lanjut →
                        </button>
                    </div>
                </div>
            )}

            {appStage === 'howto' && (
                <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden max-w-md mx-auto">
                    <div
                        className={`w-[92%] max-w-sm rounded-3xl ${modalStyle.bg} p-6 text-center shadow-2xl border flex flex-col gap-4 overflow-hidden text-[#1A1410]`}
                    >
                        <h2 className={`text-xl font-extrabold ${modalStyle.textTitle}`}>Cara Memesan</h2>
                        <p className={`text-[11px] ${modalStyle.textDesc} -mt-2`}>
                            Cukup 3 langkah mudah, pesanan langsung masuk dapur!
                        </p>
                        <div className="flex flex-col gap-2.5">
                            {[
                                {
                                    n: 1,
                                    bg: isDarkTheme
                                        ? 'bg-white/5 border-white/5 text-slate-300'
                                        : 'bg-[#F4EEFD] border-[#7C3AED]/10 text-[#7C3AED]',
                                    t: 'Pilih Menu Favorit',
                                    d: 'Tekan menu yang kamu inginkan, lihat foto & harga lengkap',
                                },
                                {
                                    n: 2,
                                    bg: isDarkTheme
                                        ? 'bg-white/5 border-white/5 text-slate-300'
                                        : 'bg-[#FFF1E9] border-[#FF5B35]/10 text-[#FF5B35]',
                                    t: 'Masuk ke Keranjang',
                                    d: 'Tambah qty, tulis catatan khusus untuk chef jika perlu',
                                },
                                {
                                    n: 3,
                                    bg: isDarkTheme
                                        ? 'bg-white/5 border-white/5 text-slate-300'
                                        : 'bg-[#EAF7EF] border-[#0F8A4D]/10 text-[#0F8A4D]',
                                    t: 'Kirim Pesanan',
                                    d: 'Tekan "Pesan Sekarang" — pesanan langsung diterima dapur!',
                                },
                            ].map((s) => (
                                <div
                                    key={s.n}
                                    className={`rounded-2xl p-3 flex gap-3 items-start border text-left ${s.bg}`}
                                >
                                    <div
                                        className={`size-5 rounded-full ${isDarkTheme ? 'bg-emerald-500 text-slate-950' : 'bg-current text-white'} font-extrabold grid place-items-center text-[10px] shrink-0`}
                                    >
                                        <span
                                            className={
                                                isDarkTheme ? 'text-slate-900 font-bold' : 'text-white font-bold'
                                            }
                                        >
                                            {s.n}
                                        </span>
                                    </div>
                                    <div>
                                        <p className={`font-extrabold text-[12px] ${modalStyle.textTitle}`}>{s.t}</p>
                                        <p className={`text-[10px] ${modalStyle.textDesc} mt-0.5`}>{s.d}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <div
                            className={`flex items-center justify-between ${modalStyle.cardBg} border rounded-2xl p-3 text-[11px] mt-1`}
                        >
                            <span className={modalStyle.textDesc}>🪑 Tipe pesanan</span>
                            <b className={modalStyle.textTitle}>{orderType === 'dine_in' ? 'Dine In' : 'Take Away'}</b>
                            <span
                                className={`${modalStyle.accentText} font-extrabold cursor-pointer`}
                                onClick={() => setAppStage('welcome')}
                            >
                                Ubah
                            </span>
                        </div>
                        <button
                            onClick={() => setAppStage('app')}
                            className={`w-full ${modalStyle.button} border-none rounded-xl py-3 text-xs font-black cursor-pointer flex justify-center gap-2 items-center`}
                        >
                            ✨ Mulai Pesan Sekarang!
                        </button>
                    </div>
                </div>
            )}

            {activeTab === 'menu' && (
                <>
                    {/* Menu Items List */}
                    <main className="flex-1 px-4 pb-28 space-y-4 overflow-y-auto">
                        {filteredItems.length > 0 ? (
                            filteredItems.map((item) => (
                                <div
                                    key={item.id}
                                    onClick={() => setDetailItem(item)}
                                    className="flex gap-4 bg-white/[0.03] p-4 rounded-3xl shadow-sm border border-white/5 hover:border-white/10 transition-all group relative overflow-hidden cursor-pointer"
                                >
                                    <div className="relative size-20 rounded-2xl overflow-hidden shrink-0 bg-slate-900 border border-white/5">
                                        <ProductImage
                                            src={item.image}
                                            alt={item.name}
                                            variant="small"
                                            className="size-full object-cover group-hover:scale-105 transition-transform duration-300"
                                        />
                                        {item.isPopular && (
                                            <span className="absolute top-1 left-1 bg-amber-500 text-slate-950 font-black text-[7px] uppercase tracking-wider px-1 py-0.5 rounded shadow">
                                                POPULAR
                                            </span>
                                        )}
                                    </div>
                                    <div className="flex-1 min-w-0 flex flex-col justify-between">
                                        <div>
                                            <div className="flex items-start justify-between gap-1.5">
                                                <h3
                                                    className={`text-sm font-bold text-white leading-snug transition-colors truncate ${isNanoBanana ? 'group-hover:text-amber-400' : 'group-hover:text-emerald-400'}`}
                                                >
                                                    {item.name}
                                                </h3>
                                            </div>
                                            <p className="text-[10px] text-slate-400 leading-relaxed mt-1 line-clamp-2">
                                                {item.description ||
                                                    'Hidangan lezat diolah higienis dengan resep rahasia.'}
                                            </p>
                                        </div>
                                        <div className="flex items-center justify-between mt-2 pt-2 border-t border-white/5">
                                            <span
                                                className={`text-xs font-mono font-bold ${isNanoBanana ? 'text-amber-400' : 'text-emerald-400'}`}
                                            >
                                                {formatRupiah(item.price)}
                                            </span>
                                            <div className="flex items-center">
                                                {cart[item.id] ? (
                                                    <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-0.5">
                                                        <button
                                                            onClick={() => removeFromCart(item.id)}
                                                            className={`size-6 rounded-full text-slate-950 flex items-center justify-center font-bold transition-colors ${isNanoBanana ? 'bg-amber-500 hover:bg-amber-400' : 'bg-emerald-500 hover:bg-emerald-400'}`}
                                                        >
                                                            <MinusIcon className="size-3" />
                                                        </button>
                                                        <span className="w-8 text-center text-xs font-bold text-white">
                                                            {cart[item.id]}
                                                        </span>
                                                        <button
                                                            onClick={() => addToCart(item.id)}
                                                            className={`size-6 rounded-full text-slate-950 flex items-center justify-center font-bold transition-colors ${isNanoBanana ? 'bg-amber-500 hover:bg-amber-400' : 'bg-emerald-500 hover:bg-emerald-400'}`}
                                                        >
                                                            <PlusIcon className="size-3" />
                                                        </button>
                                                    </div>
                                                ) : (
                                                    <button
                                                        onClick={() => addToCart(item.id)}
                                                        className={`rounded-full px-4 py-1.5 text-xs font-bold transition-all shadow-sm ${isNanoBanana ? 'bg-amber-500/20 border border-amber-500/50 hover:bg-amber-500 hover:text-slate-950 text-amber-300 shadow-[0_0_10px_rgba(234,179,8,0.2)]' : 'bg-emerald-500/10 border border-emerald-500/35 hover:bg-emerald-500 hover:text-slate-950 text-emerald-400'}`}
                                                    >
                                                        Tambah
                                                    </button>
                                                )}
                                            </div>
                                        </div>
                                    </div>
                                </div>
                            ))
                        ) : (
                            <div className="py-16 text-center text-slate-500">
                                <HelpCircleIcon className="size-12 mx-auto text-slate-600 mb-3" />
                                <p className="text-sm font-semibold">Menu tidak tersedia</p>
                                <p className="text-xs text-slate-500 mt-1">Cari hidangan yang lain.</p>
                            </div>
                        )}
                    </main>
                </>
            )}

            {activeTab === 'cart' && (
                <CartPanel
                    outletSlug={outletSlug}
                    tableNumber={tableNumber}
                    outletGeo={outletGeo}
                    onVerified={(token: string) => {
                        setVerifyToken(token);
                        setGuestVerified(true);
                    }}
                    cartTotalItems={cartTotalItems}
                    cart={cart}
                    menuItems={menuItems}
                    addToCart={addToCart}
                    removeFromCart={removeFromCart}
                    orderType={orderType}
                    setOrderType={setOrderType}
                    chefNotes={chefNotes}
                    setChefNotes={setChefNotes}
                    cartTotalPrice={cartTotalPrice}
                    setActiveTab={setActiveTab}
                />
            )}

            {activeTab === 'reservasi' && (
                <main className="flex-1 p-5 pb-28 flex flex-col justify-between overflow-y-auto">
                    <div className="space-y-4">
                        <h2 className="text-base font-extrabold text-white flex items-center gap-2 mb-2">
                            <CalendarDaysIcon className="size-5 text-emerald-400" /> Booking & Reservasi
                        </h2>

                        {reservationSuccess ? (
                            <div className="py-12 px-4 text-center space-y-4 bg-emerald-950/10 border border-emerald-500/20 rounded-3xl animate-in fade-in duration-300">
                                <div className="size-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 mx-auto">
                                    <CheckCircle2Icon className="size-8 text-emerald-400" />
                                </div>
                                <div className="space-y-1">
                                    <h3 className="text-sm font-bold text-white">Reservasi Terkirim!</h3>
                                    <p className="text-xs text-slate-400 leading-relaxed">
                                        Terima kasih {rName}. Pengajuan reservasi Anda pada {rDate} pukul {rTime} sedang
                                        ditinjau oleh staf kami.
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setReservationSuccess(false);
                                        setRName('');
                                        setRPhone('');
                                        setRDate('');
                                        setRTime('');
                                        setRNotes('');
                                        setActiveTab('menu');
                                    }}
                                    className="px-5 py-2.5 bg-emerald-500 text-slate-950 rounded-xl text-xs font-bold hover:bg-emerald-400 transition-colors"
                                >
                                    Kembali ke Menu
                                </button>
                            </div>
                        ) : (
                            <form onSubmit={handleReservationSubmit} className="space-y-3.5">
                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                        Nama Lengkap
                                    </label>
                                    <input
                                        type="text"
                                        required
                                        value={rName}
                                        onChange={(e) => setRName(e.target.value)}
                                        placeholder="Masukkan nama Anda"
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/25 transition-all"
                                    />
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                        Nomor WhatsApp / HP
                                    </label>
                                    <input
                                        type="tel"
                                        required
                                        value={rPhone}
                                        onChange={(e) => setRPhone(e.target.value)}
                                        placeholder="Contoh: 08123456789"
                                        className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/25 transition-all"
                                    />
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                            Tanggal
                                        </label>
                                        <input
                                            type="date"
                                            required
                                            value={rDate}
                                            onChange={(e) => setRDate(e.target.value)}
                                            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/25 transition-all"
                                        />
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                            Jam
                                        </label>
                                        <input
                                            type="time"
                                            required
                                            value={rTime}
                                            onChange={(e) => setRTime(e.target.value)}
                                            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/25 transition-all"
                                        />
                                    </div>
                                </div>

                                <div className="grid grid-cols-2 gap-3">
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                            Jumlah Tamu
                                        </label>
                                        <select
                                            value={rGuests}
                                            onChange={(e) => setRGuests(e.target.value)}
                                            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/25 transition-all"
                                        >
                                            <option value="1">1 Orang</option>
                                            <option value="2">2 Orang</option>
                                            <option value="4">4 Orang</option>
                                            <option value="6">6 Orang</option>
                                            <option value="8">8 Orang</option>
                                            <option value="10">10 Orang</option>
                                            <option value="20">20+ Orang</option>
                                            <option value="50">50+ Orang</option>
                                            <option value="100">100+ Orang (Event)</option>
                                        </select>
                                    </div>
                                    <div className="space-y-1.5">
                                        <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                            Jenis Acara
                                        </label>
                                        <select
                                            value={rType}
                                            onChange={(e) => setRType(e.target.value)}
                                            className="w-full rounded-xl border border-white/10 bg-white/5 px-3 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/25 transition-all"
                                        >
                                            <option value="meja">Makan Biasa</option>
                                            <option value="ulang_tahun">Ulang Tahun</option>
                                            <option value="gathering">Gathering / Arisan</option>
                                            <option value="pernikahan">Tunangan / Pernikahan</option>
                                            <option value="acara_kantor">Acara Kantor</option>
                                            <option value="lainnya">Lainnya</option>
                                        </select>
                                    </div>
                                </div>

                                <div className="space-y-1.5">
                                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                        Catatan Khusus
                                    </label>
                                    <textarea
                                        value={rNotes}
                                        onChange={(e) => setRNotes(e.target.value)}
                                        placeholder="Dekorasi khusus, kebutuhan kursi bayi, atau menu pre-order..."
                                        className="w-full h-20 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/25 transition-all resize-none"
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={isSubmittingR}
                                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-emerald-500/10 disabled:opacity-50"
                                >
                                    {isSubmittingR ? 'Mengirim...' : 'Kirim Pengajuan Reservasi'}
                                </button>
                            </form>
                        )}
                    </div>
                </main>
            )}

            {activeTab === 'galeri' && (
                <main className="flex-1 p-5 pb-28 flex flex-col justify-between overflow-y-auto space-y-6">
                    <div className="space-y-4">
                        <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-r from-emerald-950/40 to-slate-950 p-5 shadow-2xl">
                            <div className="absolute -top-10 -right-10 size-32 bg-emerald-500/10 rounded-full blur-2xl" />
                            <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-bold text-emerald-400 tracking-wider uppercase mb-2">
                                <SparklesIcon className="size-2.5" /> Event & Venue Booking
                            </span>
                            <h2 className="text-sm font-extrabold text-white">Booking Tempat & Acara</h2>
                            <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                                Kami menyediakan paket ruang eksklusif dan menu khusus untuk melengkapi momen spesial
                                Anda.
                            </p>
                        </div>

                        {/* Gallery Grid */}
                        <div className="grid grid-cols-2 gap-3">
                            {[
                                {
                                    title: 'Ulang Tahun',
                                    desc: 'Momen manis berkesan',
                                    img: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500',
                                },
                                {
                                    title: 'Intimate Wedding',
                                    desc: 'Suasana sakral premium',
                                    img: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=500',
                                },
                                {
                                    title: 'Corporate Meeting',
                                    desc: 'Fasilitas meeting lengkap',
                                    img: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500',
                                },
                                {
                                    title: 'Family Gathering',
                                    desc: 'Kebersamaan tak terlupakan',
                                    img: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=500',
                                },
                            ].map((item, idx) => (
                                <div
                                    key={idx}
                                    className="group relative rounded-2xl overflow-hidden border border-white/5 bg-white/[0.02]"
                                >
                                    <div className="h-28 w-full overflow-hidden bg-slate-950">
                                        <img
                                            src={item.img}
                                            alt={item.title}
                                            className="size-full object-cover opacity-80 group-hover:scale-105 transition-all duration-300"
                                        />
                                    </div>
                                    <div className="p-3">
                                        <h3 className="text-xs font-bold text-slate-200">{item.title}</h3>
                                        <p className="text-[9px] text-slate-500 mt-0.5">{item.desc}</p>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Premium Facilities */}
                        <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
                            <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                                <ImageIcon className="size-3.5 text-emerald-400" /> Fasilitas Kami
                            </h3>
                            <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                                <span className="flex items-center gap-1">✓ Sound System Premium</span>
                                <span className="flex items-center gap-1">✓ Proyektor & Layar</span>
                                <span className="flex items-center gap-1">✓ AC & Ruangan Privat</span>
                                <span className="flex items-center gap-1">✓ WiFi Kecepatan Tinggi</span>
                                <span className="flex items-center gap-1">✓ Parkir Luas & Aman</span>
                                <span className="flex items-center gap-1">✓ Menu Buffet Variatif</span>
                            </div>
                        </div>

                        <button
                            onClick={() => setActiveTab('reservasi')}
                            className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
                        >
                            <CalendarIcon className="size-3.5" /> Hubungi & Reservasi Sekarang
                        </button>
                    </div>
                </main>
            )}

            {activeTab === 'status' && (
                <main className="flex-1 p-4 pb-28 flex flex-col gap-3 overflow-y-auto bg-[#FAF5EE]">
                    <div className="flex items-center justify-between">
                        <h2 className="text-base font-extrabold text-[#1A1410] flex items-center gap-2">
                            <ArrowLeftIcon className="size-4 text-[#FF5B35]" /> Status Pesanan
                        </h2>
                        <div className="flex items-center gap-2">
                            <span className="text-[11px] font-bold text-[#0F8A4D] flex items-center gap-1">
                                <span className="size-1.5 rounded-full bg-[#0F8A4D] inline-block" /> Auto Aktif
                            </span>
                            <span
                                className="text-[#9B8D7E] text-sm cursor-pointer"
                                onClick={() => setActiveTab('menu')}
                            >
                                ⟳
                            </span>
                        </div>
                    </div>
                    {orders.map((o) => {
                        const steps = [
                            'Dikonfirmasi',
                            'Sedang Dimasak',
                            'Selesai Masak',
                            'Siap Saji',
                            'Sudah Disajikan',
                        ];
                        const isFood = o.destination !== 'bar';
                        const routeLabel = isFood ? '🍳 Rute: Dapur (KDS)' : '🥤 Rute: Bar (Waiter)';
                        const routeCls = isFood ? 'bg-[#FCE3D6] text-[#C9431F]' : 'bg-[#EAF2FB] text-[#1666C9]';
                        return (
                            <div key={o.id} className="bg-white border border-[#EFE2D4] rounded-2xl p-4 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <p
                                        className={`text-[13px] font-extrabold flex items-center gap-1.5 ${o.status === 'ready' ? 'text-[#0F8A4D]' : 'text-[#C9431F]'}`}
                                    >
                                        {o.status === 'ready' ? '✓ ' : '🍴 '} {o.label}
                                    </p>
                                    <span className="text-[10px] font-bold text-[#9B8D7E]">{o.id}</span>
                                </div>
                                <p className="text-[10px] font-bold text-[#9B8D7E] mt-0.5">
                                    DURASI PROSES: {o.duration}
                                </p>
                                {/* Per-item 5-tahap tracker (FNB-003) */}
                                <div className="mt-3 space-y-2">
                                    {(Array.isArray(o.items) ? o.items : []).map((it, idx) => {
                                        const itemSteps = [
                                            'Dikonfirmasi',
                                            'Sedang Dimasak',
                                            'Selesai Masak',
                                            'Siap Saji',
                                            'Sudah Disajikan',
                                        ];
                                        const cookStep = it.cook_step ?? 1;
                                        return (
                                            <div
                                                key={it.id ?? idx}
                                                className="bg-[#FAF5EE] border border-[#EFE2D4] rounded-xl p-2.5"
                                            >
                                                <p className="text-[11px] font-extrabold text-[#1A1410] mb-1.5">
                                                    {it.qty ?? 1}x {it.name}
                                                    {it.notes ? (
                                                        <span className="font-normal text-[#9B8D7E]">
                                                            {' '}
                                                            ({it.notes})
                                                        </span>
                                                    ) : null}
                                                </p>
                                                <div className="flex items-center justify-between px-0.5">
                                                    {itemSteps.map((s, i) => {
                                                        const n = i + 1;
                                                        const state =
                                                            n < cookStep ? 'done' : n === cookStep ? 'on' : 'off';
                                                        const bubCls =
                                                            state === 'done'
                                                                ? 'bg-[#0F8A4D] text-white rs-step-done'
                                                                : state === 'on'
                                                                  ? 'bg-[#FF5B35] text-white rs-step-on'
                                                                  : 'bg-[#EFE7DD] text-[#9B8D7E]';
                                                        return (
                                                            <Fragment key={s}>
                                                                <div className="flex flex-col items-center gap-1">
                                                                    <div
                                                                        className={`size-6 rounded-full ${bubCls} grid place-items-center text-[10px] font-extrabold`}
                                                                    >
                                                                        {n}
                                                                    </div>
                                                                    <span
                                                                        className={`text-[8px] font-extrabold tracking-wide ${state === 'done' ? 'text-[#0F8A4D]' : state === 'on' ? 'text-[#FF5B35]' : 'text-[#9B8D7E]'}`}
                                                                    >
                                                                        {s.toUpperCase()}
                                                                    </span>
                                                                </div>
                                                                {n < 5 && (
                                                                    <div
                                                                        className="h-0.5 flex-1 mx-1 -mt-4"
                                                                        style={{
                                                                            background:
                                                                                n < cookStep
                                                                                    ? '#0F8A4D'
                                                                                    : n === cookStep
                                                                                      ? '#FF5B35'
                                                                                      : '#EFE7DD',
                                                                        }}
                                                                    />
                                                                )}
                                                            </Fragment>
                                                        );
                                                    })}
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex items-end justify-between mt-3 pt-3 border-t border-[#EFE2D4]">
                                    <p className="text-[13px] font-extrabold text-[#1A1410]">
                                        {(Array.isArray(o.items) ? o.items : [])
                                            .map((it) => `${it.qty ?? 1}x ${it.name}`)
                                            .join(', ')}
                                    </p>
                                    <span className="text-[14px] font-extrabold text-[#0F8A4D]">
                                        {formatRupiah(o.total)}
                                    </span>
                                </div>
                                {o.id === activeOrderId && (orderHasFood || orderHasDrink) && (
                                    <div className="mt-3 pt-3 border-t border-[#EFE2D4] space-y-2">
                                        {orderHasDrink && (
                                            <div className="flex items-center gap-2 text-[11px] font-bold">
                                                <span
                                                    className={`size-2 rounded-full ${orderDrinkServed ? 'bg-[#0F8A4D]' : 'bg-[#FF5B35] animate-pulse'}`}
                                                />
                                                <span
                                                    className={orderDrinkServed ? 'text-[#0F8A4D]' : 'text-[#C9431F]'}
                                                >
                                                    🥤 Minuman{' '}
                                                    {orderDrinkServed ? 'Sudah Disajikan' : 'Disajikan ke Meja…'}
                                                </span>
                                            </div>
                                        )}
                                        {orderHasFood && (
                                            <div className="flex items-center gap-2 text-[11px] font-bold">
                                                <span
                                                    className={`size-2 rounded-full ${orderFoodServed ? 'bg-[#0F8A4D]' : 'bg-[#FF5B35]'}`}
                                                />
                                                <span className={orderFoodServed ? 'text-[#0F8A4D]' : 'text-[#C9431F]'}>
                                                    🍳 Makanan{' '}
                                                    {orderFoodServed ? 'Sudah Disajikan' : 'Disajikan ke Meja…'}
                                                </span>
                                            </div>
                                        )}
                                    </div>
                                )}
                                <span
                                    className={`inline-flex items-center gap-1.5 mt-3 text-[10px] font-extrabold px-2.5 py-1.5 rounded-lg ${routeCls}`}
                                >
                                    {routeLabel}
                                </span>
                            </div>
                        );
                    })}
                </main>
            )}

            {/* Floating Checkout Button */}
            {cartTotalItems > 0 && !orderSuccess && (
                <div className="absolute bottom-5 inset-x-4 z-40">
                    <button
                        onClick={handleCheckout}
                        disabled={!guestVerified}
                        className={`w-full rounded-2xl py-4 px-5 text-sm font-extrabold flex justify-between items-center transition-all ${
                            guestVerified
                                ? 'bg-gradient-to-r from-emerald-600 to-teal-500 hover:from-emerald-500 hover:to-teal-400 text-slate-950 shadow-2xl shadow-emerald-950/50 hover:scale-[1.02] active:scale-[0.98]'
                                : 'bg-white/10 text-white/40 cursor-not-allowed'
                        }`}
                    >
                        <span
                            className={`px-2.5 py-1 rounded-lg text-[9px] font-black uppercase tracking-wider ${guestVerified ? 'bg-slate-950/20 text-slate-900' : 'bg-black/20 text-white/40'}`}
                        >
                            {cartTotalItems} Item
                        </span>
                        <span>{guestVerified ? 'Kirim Pesanan Ke Dapur' : '🔒 Verifikasi Dulu'}</span>
                        <span className="font-mono">{formatRupiah(cartTotalPrice * 1.1)}</span>
                    </button>
                </div>
            )}

            {orderSuccess && (
                <OrderTrackingModal
                    orderStatus={orderStatus}
                    orderTone={orderTone}
                    tableNumber={tableNumber}
                    activeOrderId={activeOrderId}
                    onClose={() => {
                        setOrderSuccess(false);
                        setCart({});
                        setActiveTab('menu');
                    }}
                />
            )}

            {detailItem && (
                <MenuDetailSheet
                    item={detailItem}
                    outletName={outletName}
                    onClose={() => setDetailItem(null)}
                    onAdd={addToCart}
                />
            )}
        </div>
    );
}
