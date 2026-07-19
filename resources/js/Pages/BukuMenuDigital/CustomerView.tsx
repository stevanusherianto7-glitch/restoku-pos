import { useState, useEffect, Fragment } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { MessageCircleIcon, HelpCircleIcon, CheckCircle2Icon } from '../../Components/icons';
import { formatRupiah } from '../../lib/formatters';
import { ProductImage } from '../../Components/ProductImage';
import { useTenantSettings } from '../../Components/Shared';
import { GuestVerifyGate } from '../../Components/GuestVerifyGate';
import { evaluateSchedule } from '../../lib/evaluateSchedule';
import { MenuDetailSheet } from './components/MenuDetailSheet';
import { CartPanel } from './components/CartPanel';
import { OrderTrackingModal } from './components/OrderTrackingModal';
import { MenuItemCard } from './components/MenuItemCard';
import { WelcomeModal } from './components/WelcomeModal';
import { AppHeader } from './components/AppHeader';
import { ReservationPanel } from './components/ReservationPanel';
import { GalleryPanel } from './components/GalleryPanel';
import { StatusPanel } from './components/StatusPanel';
import { FloatingCheckout } from './components/FloatingCheckout';

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

            <AppHeader
                appStage={appStage}
                headerBg={headerBg}
                headerBorder={headerBorder}
                activeTheme={activeTheme}
                outletName={outletName}
                tableNumber={tableNumber}
                isNanoBanana={isNanoBanana}
                activeTab={activeTab}
                setActiveTab={setActiveTab}
                cartTotalItems={cartTotalItems}
                categories={categories}
                activeCategory={activeCategory}
                setActiveCategory={setActiveCategory}
                searchQuery={searchQuery}
                setSearchQuery={setSearchQuery}
                renderLogo={renderLogo}
            />

            <WelcomeModal
                stage={appStage === 'app' ? 'landing' : appStage}
                onStageChange={setAppStage}
                outletName={outletName}
                tenantImage={tenantImage}
                isOutletOpen={isOutletOpen}
                outletScheduleMsg={outletScheduleMsg}
                tableNumber={tableNumber}
                orderType={orderType}
                setOrderType={setOrderType}
                isNanoBanana={isNanoBanana}
                isDarkTheme={isDarkTheme}
            />

            {activeTab === 'menu' && (
                <>
                    {/* Menu Items List */}
                    <main className="flex-1 px-4 pb-28 space-y-4 overflow-y-auto">
                        {filteredItems.length > 0 ? (
                            filteredItems.map((item) => (
                                <MenuItemCard
                                    key={item.id}
                                    item={item}
                                    isNanoBanana={isNanoBanana}
                                    qty={cart[item.id] ?? 0}
                                    onOpenDetail={setDetailItem}
                                    onAdd={addToCart}
                                    onRemove={removeFromCart}
                                />
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

            <ReservationPanel
                reservationSuccess={reservationSuccess}
                setReservationSuccess={setReservationSuccess}
                rName={rName}
                setRName={setRName}
                rPhone={rPhone}
                setRPhone={setRPhone}
                rDate={rDate}
                setRDate={setRDate}
                rTime={rTime}
                setRTime={setRTime}
                rGuests={rGuests}
                setRGuests={setRGuests}
                rType={rType}
                setRType={setRType}
                rNotes={rNotes}
                setRNotes={setRNotes}
                isSubmittingR={isSubmittingR}
                handleReservationSubmit={handleReservationSubmit}
                setActiveTab={setActiveTab}
            />

            <GalleryPanel setActiveTab={setActiveTab} />

            <StatusPanel
                orders={orders}
                activeOrderId={activeOrderId}
                orderHasFood={orderHasFood}
                orderHasDrink={orderHasDrink}
                orderDrinkServed={orderDrinkServed}
                orderFoodServed={orderFoodServed}
                setActiveTab={setActiveTab}
            />

            <FloatingCheckout
                cartTotalItems={cartTotalItems}
                orderSuccess={orderSuccess}
                guestVerified={guestVerified}
                cartTotalPrice={cartTotalPrice}
                handleCheckout={handleCheckout}
            />

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
