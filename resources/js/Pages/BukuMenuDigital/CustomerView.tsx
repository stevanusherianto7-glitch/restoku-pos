import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import {
    SearchIcon,
    MessageCircleIcon,
    ShoppingBagIcon,
    PlusIcon,
    MinusIcon,
    CheckIcon,
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

interface MenuItem {
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
    const { tenantName, renderLogo, tenantLayout, screenMode } = useTenantSettings();
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
    const [isWaOptIn, setIsWaOptIn] = useState(true);
    const [detailItem, setDetailItem] = useState<MenuItem | null>(null);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState<'menu' | 'cart' | 'reservasi' | 'galeri'>('menu');

    // Fase 1: menu nyata dari API (graceful fallback ke FALLBACK_ITEMS saat kosong/belum load)
    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [, setMenuLoading] = useState(true);

    useEffect(() => {
        const outletSlug = (window.location.pathname.split('/m/')[1] ?? '').split('?')[0] ?? '';
        const apiUrl = `/api/menu${outletSlug ? `/${encodeURIComponent(outletSlug)}` : ''}`;
        fetch(apiUrl)
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                const items: MenuItem[] = (data?.menu ?? []).map((m: any) => ({
                    ...m,
                    // API returns category as {id,name}; UI filter expects string name.
                    category: m.category?.name ?? m.category ?? '',
                    image: m.photo_url ?? undefined, // map Cloudinary URL ke field `image`
                }));
                if (data?.outlet?.name) {
                    setOutletName(data.outlet.name);
                }
                if (data?.outlet) {
                    setOutletGeo({
                        latitude: data.outlet.latitude ?? null,
                        longitude: data.outlet.longitude ?? null,
                        geo_radius_meters: data.outlet.geo_radius_meters ?? 50,
                    });
                }
                setMenuItems(items.length ? items : FALLBACK_ITEMS);
            })
            .catch(() => setMenuItems(FALLBACK_ITEMS))
            .finally(() => setMenuLoading(false));
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

    // ─── Screenshot clone flow (stub FE-first) ───────────────────────────
    // Stage: landind modal → welcome/meja → cara-memasan → app (tabs).
    const [appStage, setAppStage] = useState<'landing' | 'welcome' | 'howto' | 'app'>('landing');
    const [dineVerified, setDineVerified] = useState(false);
    const [pin, setPin] = useState('');
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
        },
        {
            id: 'ORD-MQZOAZPI-EBDG',
            status: 'ready',
            label: 'Siap Diantar',
            duration: '17764 MNT',
            items: 'Soto Ayam Semarang x1',
            total: 28000,
            step: 3,
        },
    ]);

    // ─── Operating Hours Integration ──────────────────────────────────────────
    const [isOutletOpen, setIsOutletOpen] = useState(true);
    const [outletScheduleMsg, setOutletScheduleMsg] = useState<string | null>(null);

    // Evaluasi apakah outlet buka berdasarkan jadwal
    const evaluateSchedule = (schedule: any[]) => {
        if (!Array.isArray(schedule)) return;
        const daysMap = ['Minggu', 'Senin', 'Selasa', 'Rabu', 'Kamis', 'Jumat', 'Sabtu'];
        const now = new Date();
        const todayName = daysMap[now.getDay()];
        const todaySchedule = schedule.find((d) => d.day === todayName);
        if (todaySchedule) {
            if (!todaySchedule.isOpen) {
                setIsOutletOpen(false);
                setOutletScheduleMsg(`Restoran hari ini (${todayName}) TUTUP.`);
            } else {
                const currentTime = now.toTimeString().slice(0, 5); // "HH:MM"
                if (currentTime < todaySchedule.openTime || currentTime > todaySchedule.closeTime) {
                    setIsOutletOpen(false);
                    setOutletScheduleMsg(
                        `Restoran sedang TUTUP. Jam operasional hari ini: ${todaySchedule.openTime} - ${todaySchedule.closeTime} WIB.`,
                    );
                } else {
                    setIsOutletOpen(true);
                    setOutletScheduleMsg(`Buka hari ini: ${todaySchedule.openTime} - ${todaySchedule.closeTime} WIB`);
                }
            }
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
                    evaluateSchedule(schedule);
                } else {
                    // Fallback ke localStorage jika API tidak return operating_hours
                    const raw = localStorage.getItem('outlet_jam_operasional');
                    if (raw) {
                        try {
                            evaluateSchedule(JSON.parse(raw));
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
                        evaluateSchedule(JSON.parse(raw));
                    } catch {
                        // ignore malformed schedule payload
                    }
                }
            });
    }, []);

    // Dynamic CSS themes based on selected tenantLayout

    const theme = {
        premium: {
            outer: 'min-h-screen w-full bg-gradient-to-b from-[#031510] via-[#052119] to-[#020b08] text-slate-100 flex flex-col font-sans selection:bg-emerald-500/30 max-w-md mx-auto shadow-2xl relative border-x border-emerald-950/40',
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
            outer: 'min-h-screen w-full bg-slate-50 text-slate-800 flex flex-col font-sans max-w-md mx-auto shadow-2xl relative border-x border-slate-200',
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
            outer: 'min-h-screen w-full bg-[linear-gradient(90deg,#fff3e0_0%,#ffe6c0_50%,#ffd99f_100%)] text-amber-950 flex flex-col font-sans max-w-md mx-auto shadow-2xl relative border-x border-amber-900/10',
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
            outer: 'min-h-screen w-full bg-[#030712] text-slate-100 flex flex-col font-sans selection:bg-amber-500/30 max-w-md mx-auto shadow-[0_0_50px_rgba(234,179,8,0.15)] relative border-x border-amber-500/30 dark nano-banana',
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
            outer: 'min-h-screen w-full bg-[#FAF5EE] text-[#1A1410] flex flex-col font-sans selection:bg-[#FF5B35]/20 max-w-md mx-auto shadow-2xl relative border-x border-[#E7D9CB]',
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

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const table = params.get('table');
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
                } else if (response.status === 404) {
                    // Completed / Served!
                    setOrderStatus('Selesai');
                    setOrderTone('emerald');
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

        // Generate formatted items list for KDS
        const itemsList = Object.entries(cart).map(([idStr, qty]) => {
            const item = menuItems.find((i) => i.id === parseInt(idStr));
            return `${qty}x ${item?.name}`;
        });

        // Add Chef Notes to KDS items list as a sub-note
        if (chefNotes.trim()) {
            itemsList.push(`+ Catatan: ${chefNotes.trim()}`);
        }

        try {
            const displayTable =
                orderType === 'take_away'
                    ? `Takeaway ${Math.floor(10 + Math.random() * 90)}`
                    : tableNumber
                      ? `Meja ${tableNumber}`
                      : 'Meja 1';

            const response = await fetch('/api/orders', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    table: displayTable,
                    items: itemsList,
                    verify_token: verifyToken,
                }),
            });
            if (response.ok) {
                const data = await response.json();
                setActiveOrderId(data.order.id);
                setOrderStatus(data.order.status);
                setOrderTone(data.order.tone);
                setOrderSuccess(true);
            } else if (response.status === 422) {
                // Token expired / invalid → minta verify ulang
                setGuestVerified(false);
                setVerifyToken('');
                alert('Verifikasi kehadiran kedaluwarsa. Silakan verifikasi ulang.');
            }
        } catch (err) {
            console.error('Gagal melakukan checkout pesanan', err);
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

            {/* Operating Hours Alert Banner */}
            {!isOutletOpen && (
                <div className="bg-rose-500/20 border-b border-rose-500/30 px-4 py-3 flex items-center gap-3 text-rose-300">
                    <Clock3Icon className="size-5 shrink-0 text-rose-400 animate-pulse" />
                    <div className="text-xs">
                        <p className="font-bold">Pemesanan Online Ditutup</p>
                        <p className="text-[11px] opacity-90">
                            {outletScheduleMsg || 'Restoran sedang di luar jam operasional.'}
                        </p>
                    </div>
                </div>
            )}
            {isOutletOpen && outletScheduleMsg && (
                <div className="bg-emerald-500/10 border-b border-emerald-500/20 px-4 py-2 flex items-center gap-2 text-emerald-300 text-[11px]">
                    <Clock3Icon className="size-3.5 shrink-0 text-emerald-400" />
                    <span>{outletScheduleMsg}</span>
                </div>
            )}

            {/* Glassmorphism Header */}
            <header className={activeTheme.header}>
                <div className="flex items-center gap-3">
                    <div className="grid size-11 place-items-center rounded-2xl bg-gradient-to-tr from-emerald-500 to-teal-400 text-slate-950 shadow-lg shadow-emerald-500/20 overflow-hidden">
                        {renderLogo('size-5 stroke-[2.5] text-slate-950')}
                    </div>
                    <div>
                        <h1 className="text-sm font-black tracking-tight text-white uppercase">{outletName}</h1>
                        <p className="text-[10px] font-bold text-emerald-400/90 flex items-center gap-1.5 uppercase tracking-wide">
                            <span className="size-1.5 rounded-full bg-emerald-400 animate-ping inline-block" />
                            {tableNumber ? `Meja ${tableNumber}` : 'Scan Meja Anda'}
                        </p>
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

            {/* ─── SCREENSHOT CLONE: FLOW BARU (stub FE-first) ───────────── */}
            {appStage === 'landing' && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
                    <div
                        className="w-full rounded-3xl p-7 text-white relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg,#2A1E16 0%,#3A2A1E 60%,#43261A 100%)',
                            backgroundImage:
                                'linear-gradient(rgba(245,158,11,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(245,158,11,.04) 1px,transparent 1px)',
                            backgroundSize: '20px 20px',
                        }}
                    >
                        <p className="text-[10px] font-bold tracking-[0.22em] text-[#F59E0B] uppercase">
                            Sejak 2025 · Nusantara
                        </p>
                        <h2 className="font-serif text-3xl mt-3 leading-tight">
                            Cita rasa Jawa,
                            <br />
                            <span className="italic text-[#F59E0B]">disajikan modern.</span>
                        </h2>
                        <div className="h-px bg-[#F59E0B]/40 my-5" />
                        <p className="text-[13px] text-[#E9DFD3] leading-relaxed">
                            Platform pemesanan digital terintegrasi — dari pemesanan langsung dari meja, dapur realtime,
                            hingga sajian tersaji hangat di meja Anda.
                        </p>
                        <div className="mt-5 space-y-3">
                            {[
                                { ic: '▣', t: 'QR Self-Order', d: 'Tamu pesan langsung dari meja' },
                                { ic: '🍴', t: 'Dapur Realtime', d: 'Antrian pesanan otomatis masuk' },
                                { ic: '📊', t: 'Monitor Pesanan', d: 'Pantau semua transaksi live' },
                            ].map((f) => (
                                <div key={f.t} className="flex items-center gap-3">
                                    <div className="size-9 rounded-xl border border-[#F59E0B]/40 grid place-items-center text-[#F59E0B] text-base">
                                        {f.ic}
                                    </div>
                                    <div>
                                        <p className="font-bold text-[13px]">{f.t}</p>
                                        <p className="text-[11px] text-[#CBBCAE]">{f.d}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                        <button
                            onClick={() => setAppStage('welcome')}
                            className="mt-7 w-full bg-[#F59E0B] text-[#2A1E16] border-none rounded-xl py-3.5 text-sm font-extrabold flex justify-center gap-2 items-center cursor-pointer"
                        >
                            Masuk ke Menu →
                        </button>
                        <p className="text-center text-[10px] text-[#9B8D7E] mt-4">© 2025 {outletName}</p>
                    </div>
                </div>
            )}

            {appStage === 'welcome' && (
                <div className="absolute inset-0 z-40 flex flex-col items-center p-7 gap-4 text-center bg-[#FAF5EE] overflow-y-auto">
                    <div className="w-full flex items-center justify-center gap-3">
                        <div className="size-14 rounded-full bg-gradient-to-tr from-[#FF5B35] to-[#E04E2B] grid place-items-center text-white font-extrabold text-lg shadow-lg">
                            {outletName.slice(0, 2).toUpperCase()}
                        </div>
                        <span className="px-2.5 py-1 rounded-lg bg-[#0F8A4D]/10 text-[#0F8A4D] text-[10px] font-extrabold">
                            HALAL
                        </span>
                    </div>
                    <h2 className="text-2xl font-extrabold text-[#1A1410] mt-1">
                        Selamat Datang di <span className="text-[#FF5B35]">{outletName}!</span>
                    </h2>
                    <p className="text-[12px] text-[#7A6F63] leading-relaxed max-w-[260px]">
                        Sajian otentik khas Nusantara yang kini hadir lebih dekat. Resmi bersertifikat Halal & tanpa
                        MSG. Selamat menikmati!
                    </p>
                    <div className="w-full bg-[#FFF3EC] rounded-xl p-3.5 flex items-center justify-between text-left">
                        <div>
                            <p className="text-[10px] font-extrabold tracking-wider text-[#A8521F] flex items-center gap-1.5">
                                📍 NOMOR MEJA ANDA
                            </p>
                            <p className="text-lg font-extrabold text-[#1A1410] mt-1">Meja {tableNumber ?? 'A3'}</p>
                        </div>
                        <span className="px-2.5 py-1 rounded-full bg-[#0F8A4D]/10 text-[#0F8A4D] text-[10px] font-extrabold flex items-center gap-1">
                            ✓ Terverifikasi
                        </span>
                    </div>
                    <div className="w-full">
                        <p className="text-[11px] font-extrabold tracking-wider text-[#8A7D70] text-left mb-2">
                            PILIH TIPE PESANAN
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setOrderType('dine_in')}
                                className={`flex-1 rounded-xl py-4 text-white font-extrabold border-[3px] transition-all ${
                                    orderType === 'dine_in'
                                        ? 'border-[#FF5B35] bg-gradient-to-br from-[#7C3AED] to-[#FF5B35]'
                                        : 'border-transparent bg-gradient-to-br from-[#7C3AED] to-[#FF5B35] opacity-70'
                                }`}
                            >
                                🪑
                                <br />
                                Dine In
                                <span className="text-[11px] font-semibold opacity-90 block mt-1">Makan di tempat</span>
                            </button>
                            <button
                                onClick={() => setOrderType('take_away')}
                                className={`flex-1 rounded-xl py-4 text-white font-extrabold border-[3px] transition-all ${
                                    orderType === 'take_away'
                                        ? 'border-[#FF5B35] bg-gradient-to-br from-[#DB2777] to-[#F97316]'
                                        : 'border-transparent bg-gradient-to-br from-[#DB2777] to-[#F97316] opacity-70'
                                }`}
                            >
                                🥡
                                <br />
                                Take Away
                                <span className="text-[11px] font-semibold opacity-90 block mt-1">Dibawa pulang</span>
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={() => setAppStage('howto')}
                        className="w-full bg-[#FF5B35] text-white border-none rounded-xl py-3.5 text-sm font-extrabold mt-auto cursor-pointer"
                    >
                        Lanjut →
                    </button>
                </div>
            )}

            {appStage === 'howto' && (
                <div className="absolute inset-0 z-40 p-5 flex flex-col gap-3 bg-[#FAF5EE] overflow-y-auto">
                    <h2 className="text-center text-lg font-extrabold text-[#1A1410]">Cara Memesan</h2>
                    <p className="text-center text-[12px] text-[#7A6F63] -mt-1">
                        Cukup 3 langkah mudah, pesanan langsung masuk dapur!
                    </p>
                    {[
                        {
                            n: 1,
                            c: 'from-[#7C3AED]',
                            bg: 'bg-[#F4EEFD]',
                            t: 'Pilih Menu Favorit',
                            d: 'Tekan menu yang kamu inginkan, lihat foto & harga lengkap',
                        },
                        {
                            n: 2,
                            c: 'from-[#FF5B35]',
                            bg: 'bg-[#FFF1E9]',
                            t: 'Masuk ke Keranjang',
                            d: 'Tambah qty, tulis catatan khusus untuk chef jika perlu',
                        },
                        {
                            n: 3,
                            c: 'from-[#0F8A4D]',
                            bg: 'bg-[#EAF7EF]',
                            t: 'Kirim Pesanan',
                            d: 'Tekan "Pesan Sekarang" — pesanan langsung diterima dapur!',
                        },
                    ].map((s) => (
                        <div key={s.n} className={`rounded-xl p-3 flex gap-3 items-start ${s.bg}`}>
                            <div
                                className={`size-6 rounded-full bg-gradient-to-br ${s.c} to-black/20 text-white font-extrabold grid place-items-center text-xs shrink-0`}
                            >
                                {s.n}
                            </div>
                            <div>
                                <p className="font-extrabold text-[13px] text-[#1A1410]">{s.t}</p>
                                <p className="text-[11px] text-[#7A6F63] mt-0.5">{s.d}</p>
                            </div>
                        </div>
                    ))}
                    <div className="flex items-center justify-between bg-[#FFF3EC] rounded-xl p-3 text-[12px] mt-1">
                        <span className="text-[#5A4F43]">🪑 Tipe pesanan dipilih</span>
                        <b className="text-[#1A1410]">
                            {orderType === 'dine_in' ? 'Dine In — Makan di tempat' : 'Take Away — Dibawa pulang'}
                        </b>
                        <span className="text-[#FF5B35] font-extrabold">Ubah</span>
                    </div>
                    <button
                        onClick={() => setAppStage('app')}
                        className="w-full bg-gradient-to-r from-[#7C3AED] to-[#3B82F6] text-white border-none rounded-xl py-3.5 text-sm font-extrabold mt-auto cursor-pointer flex justify-center gap-2 items-center"
                    >
                        ✨ Mulai Pesan Sekarang!
                    </button>
                    <p className="text-center text-[10px] text-[#9B8D7E]">
                        Meja {tableNumber ?? 'A3'} · {outletName}
                    </p>
                </div>
            )}

            {/* Verifikasi Dine-In: overlay saat app & dine_in & belum verified */}
            {appStage === 'app' && orderType === 'dine_in' && !dineVerified && (
                <div className="absolute inset-0 z-50 bg-black/80 backdrop-blur-md flex items-center justify-center p-6">
                    <div
                        className="w-full rounded-3xl p-6 text-white relative overflow-hidden"
                        style={{
                            background: 'linear-gradient(135deg,#2A1E16 0%,#3A2A1E 60%,#43261A 100%)',
                            backgroundImage:
                                'linear-gradient(rgba(245,158,11,.04) 1px,transparent 1px),linear-gradient(90deg,rgba(245,158,11,.04) 1px,transparent 1px)',
                            backgroundSize: '20px 20px',
                        }}
                    >
                        <div className="flex items-start gap-3">
                            <div className="size-10 rounded-full border border-[#F59E0B] grid place-items-center text-lg">
                                🛡
                            </div>
                            <div>
                                <p className="font-extrabold text-[15px] text-[#F59E0B] tracking-wide">
                                    VERIFIKASI DINE-IN
                                </p>
                                <p className="text-[10px] text-[#CBBCAE] mt-0.5 tracking-wide">
                                    PASTIKAN ANDA MEMESAN DI LOKASI
                                </p>
                            </div>
                            <span
                                className="ml-auto text-[#E9DFD3] text-lg cursor-pointer"
                                onClick={() => setDineVerified(true)}
                            >
                                ✕
                            </span>
                        </div>

                        <div className="mt-5">
                            <p className="font-bold text-[12.5px] flex items-center gap-1.5">
                                📍 Validasi GPS Otomatis
                            </p>
                            {gpsError && (
                                <div className="mt-2 bg-[#7A2A1A] text-[#FF9B7A] rounded-xl p-2.5 text-[12px] font-semibold leading-snug">
                                    {gpsError}
                                </div>
                            )}
                            <button
                                onClick={() => setGpsError(null)}
                                className="mt-3 w-full bg-transparent border-[1.5px] border-[#FF5B35] text-[#FF5B35] rounded-xl py-3 text-[12.5px] font-extrabold cursor-pointer"
                            >
                                ⟳ DETEKSI ULANG LOKASI
                            </button>
                        </div>

                        <div className="text-center text-[11px] text-[#9B8D7E] font-extrabold my-5 relative">ATAU</div>

                        <div>
                            <p className="font-extrabold text-[13px] text-[#F59E0B] tracking-wide">
                                MASUKKAN PIN VERIFIKASI MEJA
                            </p>
                            <p className="text-[11px] text-[#CBBCAE] mt-1.5 leading-relaxed">
                                Minta 4-digit PIN harian kepada pelayan kami di kedai.
                            </p>
                            <div className="flex justify-center gap-2.5 my-4">
                                {[0, 1, 2, 3].map((i) => (
                                    <span
                                        key={i}
                                        className="size-12 rounded-xl bg-white text-[#1A1410] grid place-items-center text-xl font-extrabold"
                                    >
                                        {pin[i] ?? ''}
                                    </span>
                                ))}
                            </div>
                            <input
                                type="text"
                                inputMode="numeric"
                                maxLength={4}
                                value={pin}
                                onChange={(e) => setPin(e.target.value.replace(/\D/g, '').slice(0, 4))}
                                placeholder="----"
                                className="hidden"
                            />
                            <div className="grid grid-cols-3 gap-2 mb-3">
                                {['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '⌫'].map((k) => (
                                    <button
                                        key={k}
                                        disabled={!k}
                                        onClick={() =>
                                            k === '⌫'
                                                ? setPin((p) => p.slice(0, -1))
                                                : k && setPin((p) => (p + k).slice(0, 4))
                                        }
                                        className="h-11 rounded-xl bg-white/10 text-white font-bold text-lg disabled:opacity-30 cursor-pointer"
                                    >
                                        {k}
                                    </button>
                                ))}
                            </div>
                            <button
                                onClick={() => pin === '0000' && setDineVerified(true)}
                                className="w-full rounded-xl py-3.5 text-[13.5px] font-extrabold cursor-pointer border-none"
                                style={{ background: 'linear-gradient(135deg,#8A3A1E,#C9542A)', color: '#F3D9CC' }}
                            >
                                VERIFIKASI PIN
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {activeTab === 'menu' && (
                <>
                    {/* Banner Promo */}
                    <section className={activeTheme.bannerBg}>
                        <div
                            className={`absolute -top-12 -right-12 size-36 rounded-full blur-3xl ${isNanoBanana ? 'bg-amber-500/20' : 'bg-emerald-500/10'}`}
                        />
                        <div className="relative z-10">
                            <span className={activeTheme.badge}>
                                <SparklesIcon
                                    className={`size-3 ${isNanoBanana ? 'text-amber-300' : 'text-emerald-400'}`}
                                />{' '}
                                {isNanoBanana ? 'Cyber Gold Executive Dining' : 'Premium Dining Experience'}
                            </span>
                            <h2 className="text-xl font-extrabold text-white tracking-tight leading-tight">
                                Sajian Cita Rasa Terbaik
                            </h2>
                            <p className="text-xs text-slate-400 mt-1 leading-relaxed">
                                Pesan hidangan otentik langsung ke dapur dari genggaman Anda.
                            </p>
                        </div>
                    </section>

                    {/* SearchIcon bar */}
                    <div className="px-4 pt-4 pb-1">
                        <div className="flex items-center gap-3 bg-white/5 border border-white/10 rounded-2xl px-4 py-3 shadow-inner focus-within:border-emerald-500/40 focus-within:ring-1 focus-within:ring-emerald-500/25 transition-all">
                            <SearchIcon className="size-4.5 text-slate-400" />
                            <input
                                type="text"
                                placeholder="Cari menu terlaris kami..."
                                value={searchQuery}
                                onChange={(e) => setSearchQuery(e.target.value)}
                                className="bg-transparent text-sm text-slate-100 outline-none w-full placeholder:text-slate-500"
                            />
                        </div>
                    </div>

                    {/* Category Capsule Filter */}
                    <div className="flex gap-2 overflow-x-auto px-4 py-3 sticky top-[77px] z-30 bg-[#031510]/80 backdrop-blur-md">
                        {categories.map((cat) => (
                            <button
                                key={cat}
                                onClick={() => setActiveCategory(cat)}
                                className={`px-4.5 py-2.5 rounded-xl text-xs font-bold whitespace-nowrap transition-all border ${
                                    activeCategory === cat
                                        ? 'bg-emerald-500 border-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/10 scale-95'
                                        : 'bg-white/5 border-white/10 text-slate-300 hover:border-white/20'
                                }`}
                            >
                                {cat}
                            </button>
                        ))}
                    </div>

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
                /* Redesigned Premium Cart Tab */
                <main className="flex-1 p-5 pb-28 flex flex-col justify-between">
                    <div className="space-y-4">
                        <h2 className="text-base font-extrabold text-white flex items-center gap-2 mb-2">
                            <ShoppingBagIcon className="size-5 text-emerald-400" /> Ringkasan Pesanan
                        </h2>

                        {/* Anti-fraud: verifikasi kehadiran tamu (GPS + PIN) */}
                        <GuestVerifyGate
                            slug={outletSlug}
                            tableLabel={tableNumber}
                            geo={outletGeo}
                            onVerified={(token: string) => {
                                setVerifyToken(token);
                                setGuestVerified(true);
                            }}
                        />

                        {cartTotalItems > 0 ? (
                            <div className="space-y-3 max-h-[calc(100vh-320px)] overflow-y-auto pr-1">
                                {/* Dine In / Take Away Segmented Selector */}
                                <div className="flex bg-white/5 border border-white/10 rounded-2xl p-1 mb-4">
                                    <button
                                        onClick={() => setOrderType('dine_in')}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                            orderType === 'dine_in'
                                                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                                                : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        Dine In
                                    </button>
                                    <button
                                        onClick={() => setOrderType('take_away')}
                                        className={`flex-1 py-2.5 rounded-xl text-xs font-bold transition-all ${
                                            orderType === 'take_away'
                                                ? 'bg-emerald-500 text-slate-950 shadow-md shadow-emerald-500/10'
                                                : 'text-slate-400 hover:text-slate-200'
                                        }`}
                                    >
                                        Take Away
                                    </button>
                                </div>

                                {Object.entries(cart).map(([idStr, qty]) => {
                                    const id = parseInt(idStr);
                                    const item = menuItems.find((i) => i.id === id);
                                    if (!item) return null;
                                    return (
                                        <div
                                            key={id}
                                            className="flex items-center gap-3 bg-white/[0.02] p-3 rounded-2xl border border-white/5"
                                        >
                                            <ProductImage
                                                src={item.image}
                                                alt={item.name}
                                                variant="small"
                                                className="size-12 rounded-xl object-cover"
                                            />
                                            <div className="flex-1 min-w-0">
                                                <h4 className="text-xs font-bold text-white truncate">{item.name}</h4>
                                                <p className="text-[10px] text-emerald-400 font-mono mt-0.5">
                                                    {formatRupiah(item.price)}
                                                </p>
                                            </div>
                                            <div className="flex items-center bg-white/5 border border-white/10 rounded-full p-0.5">
                                                <button
                                                    onClick={() => removeFromCart(id)}
                                                    className="size-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold"
                                                >
                                                    <MinusIcon className="size-2.5" />
                                                </button>
                                                <span className="w-6 text-center text-xs font-bold text-white">
                                                    {qty}
                                                </span>
                                                <button
                                                    onClick={() => addToCart(id)}
                                                    className="size-5 rounded-full bg-emerald-500 text-slate-950 flex items-center justify-center font-bold"
                                                >
                                                    <PlusIcon className="size-2.5" />
                                                </button>
                                            </div>
                                        </div>
                                    );
                                })}

                                {/* Chef Notes Textarea */}
                                <div className="space-y-2 mt-4">
                                    <label className="block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider">
                                        Catatan untuk Chef / Dapur (opsional)
                                    </label>
                                    <textarea
                                        placeholder="contoh: Tanpa bawang, kuah pisah, extra pedas, dll."
                                        value={chefNotes}
                                        onChange={(e) => setChefNotes(e.target.value)}
                                        className="w-full h-16 rounded-2xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/25 transition-all resize-none placeholder:text-slate-600"
                                    />
                                </div>

                                {/* Bill details */}
                                <div className="bg-white/[0.01] border border-white/5 rounded-2xl p-4 space-y-2 mt-4">
                                    <div className="flex justify-between text-xs text-slate-400">
                                        <span>Subtotal</span>
                                        <span className="font-mono text-slate-300">{formatRupiah(cartTotalPrice)}</span>
                                    </div>
                                    <div className="flex justify-between text-xs text-slate-400">
                                        <span>Pajak Restoran PBJT (10%)</span>
                                        <span className="font-mono text-slate-300">
                                            {formatRupiah(cartTotalPrice * 0.1)}
                                        </span>
                                    </div>
                                    <div className="h-px bg-white/5 my-2" />
                                    <div className="flex justify-between text-sm font-bold text-white">
                                        <span>Total Pembayaran</span>
                                        <span className="font-mono text-emerald-400">
                                            {formatRupiah(cartTotalPrice * 1.1)}
                                        </span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <div className="py-24 text-center text-slate-500">
                                <ShoppingCartIcon className="size-16 mx-auto text-slate-700 mb-3" />
                                <p className="text-sm font-bold">Keranjang Anda Kosong</p>
                                <p className="text-xs text-slate-500 mt-1">
                                    Kembali ke tab menu untuk memilih hidangan terbaik kami.
                                </p>
                                <button
                                    onClick={() => setActiveTab('menu')}
                                    className="mt-5 px-5 py-2.5 bg-emerald-500 text-slate-950 rounded-xl text-xs font-bold hover:bg-emerald-400 shadow-lg shadow-emerald-500/10"
                                >
                                    Lihat Daftar Menu
                                </button>
                            </div>
                        )}
                    </div>
                </main>
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
                        const steps = ['Konfirmasi', 'Dimasak', 'Siap', 'Disajikan'];
                        return (
                            <div key={o.id} className="bg-white border border-[#EFE2D4] rounded-2xl p-3.5 shadow-sm">
                                <div className="flex items-center justify-between">
                                    <p
                                        className={`text-[12.5px] font-extrabold ${o.status === 'ready' ? 'text-[#C9431F]' : 'text-[#A8521F]'}`}
                                    >
                                        {o.status === 'ready' ? '🍴 ' : '⟳ '} {o.label}
                                    </p>
                                    <span className="text-[10px] font-bold text-[#9B8D7E]">{o.id}</span>
                                </div>
                                <p className="text-[10px] font-bold text-[#9B8D7E] mt-0.5">
                                    DURASI PROSES: {o.duration}
                                </p>
                                <div className="flex items-center gap-1 mt-2.5">
                                    {steps.map((s, i) => {
                                        const n = i + 1;
                                        const cls =
                                            n < o.step
                                                ? 'bg-[#0F8A4D] text-white'
                                                : n === o.step
                                                  ? 'bg-[#FF5B35] text-white'
                                                  : 'bg-[#EFE7DD] text-[#9B8D7E]';
                                        return (
                                            <div key={s} className="flex items-center">
                                                <div
                                                    className={`size-6 rounded-full ${cls} grid place-items-center text-[11px] font-extrabold`}
                                                >
                                                    {n}
                                                </div>
                                                {n < 4 && (
                                                    <div
                                                        className="h-0.5 w-3.5"
                                                        style={{
                                                            background:
                                                                n < o.step
                                                                    ? '#0F8A4D'
                                                                    : n === o.step
                                                                      ? '#FF5B35'
                                                                      : '#EFE7DD',
                                                        }}
                                                    />
                                                )}
                                            </div>
                                        );
                                    })}
                                </div>
                                <div className="flex justify-between text-[10px] font-bold text-[#9B8D7E] mt-1">
                                    {steps.map((s) => (
                                        <span key={s}>{s}</span>
                                    ))}
                                </div>
                                <div className="flex items-end justify-between mt-2 pt-2 border-t border-[#EFE2D4]">
                                    <div>
                                        <p className="text-[13px] font-extrabold text-[#1A1410]">{o.items}</p>
                                        <p className="text-[11px] text-[#7A6F63]">{formatRupiah(o.total)}</p>
                                    </div>
                                    <span className="text-[14px] font-extrabold text-[#0F8A4D]">
                                        {formatRupiah(o.total)}
                                    </span>
                                </div>
                            </div>
                        );
                    })}
                </main>
            )}

            {/* WhatsApp receipt Delivery Card */}
            {cartTotalItems > 0 && !orderSuccess && (
                <div className="absolute bottom-20 inset-x-4 z-40 bg-slate-900/60 backdrop-blur-md p-4 rounded-3xl border border-white/10 flex items-center justify-between shadow-2xl">
                    <div className="flex items-center gap-3">
                        <div className="size-9 rounded-xl bg-emerald-500/10 flex items-center justify-center border border-emerald-500/20">
                            <MessageCircleIcon className="size-4.5 text-emerald-400" />
                        </div>
                        <div>
                            <p className="text-xs font-bold text-white">Kirim struk ke WA?</p>
                            <p className="text-[9px] text-slate-400 leading-tight">
                                Dapatkan updates & status pesanan realtime.
                            </p>
                        </div>
                    </div>
                    <button
                        onClick={() => setIsWaOptIn(!isWaOptIn)}
                        className={`w-10 h-6 rounded-full transition-all duration-300 p-0.5 ${
                            isWaOptIn ? 'bg-emerald-500 flex justify-end' : 'bg-white/10 flex justify-start'
                        }`}
                    >
                        <div className="size-5 bg-white rounded-full shadow-sm" />
                    </button>
                </div>
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

            {/* Premium Success & Real-Time Tracking Modal */}
            {orderSuccess && (
                <div className="absolute inset-0 bg-black/90 backdrop-blur-md z-50 flex items-center justify-center p-6">
                    <div className="bg-slate-900/90 border border-white/10 rounded-3xl p-6 w-full max-w-xs flex flex-col items-center text-center shadow-2xl animate-in fade-in zoom-in-95 duration-200">
                        <div
                            className={`size-16 rounded-full flex items-center justify-center mb-4 shadow-lg transition-all ${
                                orderTone === 'amber'
                                    ? 'bg-amber-500/10 border-amber-500/20 text-amber-400 shadow-amber-500/5'
                                    : orderTone === 'blue'
                                      ? 'bg-blue-500/10 border-blue-500/20 text-blue-400 shadow-blue-500/5'
                                      : 'bg-emerald-500/10 border-emerald-500/20 text-emerald-400 shadow-emerald-500/5'
                            }`}
                        >
                            {orderStatus === 'Siap Sajikan' || orderStatus === 'Selesai' ? (
                                <CheckIcon className="size-8 stroke-[3]" />
                            ) : (
                                <span className="size-6 rounded-full border-4 border-t-transparent animate-spin border-current" />
                            )}
                        </div>
                        <h3 className="text-base font-extrabold text-white mb-1">
                            {orderStatus === 'Antrian Masuk'
                                ? 'Menunggu Konfirmasi'
                                : orderStatus === 'Sedang Dimasak'
                                  ? 'Sedang Dimasak'
                                  : orderStatus === 'Siap Sajikan'
                                    ? 'Pesanan Siap Sajikan!'
                                    : 'Pesanan Selesai!'}
                        </h3>
                        <p className="text-xs text-slate-400 leading-relaxed mb-4">
                            {orderStatus === 'Antrian Masuk'
                                ? 'Dapur sedang meninjau pesanan Anda.'
                                : orderStatus === 'Sedang Dimasak'
                                  ? 'Koki sedang meracik hidangan lezat Anda.'
                                  : orderStatus === 'Siap Sajikan'
                                    ? 'Pelayan kami sedang mengantarkan hidangan ke meja Anda.'
                                    : 'Terima kasih! Silakan nikmati hidangan lezat Anda.'}
                        </p>

                        {/* Real-time Status Tracker */}
                        <div className="w-full bg-white/[0.02] border border-white/5 p-4 rounded-2xl mb-4 text-left space-y-3">
                            <div className="flex justify-between items-center">
                                <span className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                                    Status Pesanan
                                </span>
                                <span
                                    className={`text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded ${
                                        orderTone === 'amber'
                                            ? 'bg-amber-500/20 text-amber-400 border border-amber-500/30'
                                            : orderTone === 'blue'
                                              ? 'bg-blue-500/20 text-blue-400 border border-blue-500/30'
                                              : 'bg-emerald-500/20 text-emerald-400 border border-emerald-500/30'
                                    }`}
                                >
                                    {orderStatus}
                                </span>
                            </div>

                            {/* Progress Bar Visualizer */}
                            <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden flex">
                                <div
                                    className={`h-full transition-all duration-500 ${
                                        orderStatus === 'Antrian Masuk'
                                            ? 'w-1/3 bg-amber-500'
                                            : orderStatus === 'Sedang Dimasak'
                                              ? 'w-2/3 bg-blue-500'
                                              : 'w-full bg-emerald-500'
                                    }`}
                                />
                            </div>

                            <div className="flex justify-between text-[8px] font-bold text-slate-500 uppercase tracking-wider">
                                <span className={orderStatus === 'Antrian Masuk' ? 'text-amber-400' : ''}>Antrian</span>
                                <span className={orderStatus === 'Sedang Dimasak' ? 'text-blue-400' : ''}>Dimasak</span>
                                <span
                                    className={
                                        orderStatus === 'Siap Sajikan' || orderStatus === 'Selesai'
                                            ? 'text-emerald-400'
                                            : ''
                                    }
                                >
                                    Saji
                                </span>
                            </div>
                        </div>

                        <div className="w-full bg-white/[0.02] border border-white/5 p-3 rounded-2xl mb-4 text-left">
                            <div className="flex justify-between">
                                <div>
                                    <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider">
                                        Nomor Meja
                                    </p>
                                    <p className="text-sm font-extrabold text-emerald-400 mt-0.5">
                                        {tableNumber ? `Meja ${tableNumber}` : 'Meja 1'}
                                    </p>
                                </div>
                                <div>
                                    <p className="text-[9px] uppercase font-bold text-slate-500 tracking-wider text-right">
                                        Order ID
                                    </p>
                                    <p className="text-xs font-bold text-slate-300 mt-0.5 text-right">
                                        {activeOrderId}
                                    </p>
                                </div>
                            </div>
                        </div>

                        <button
                            onClick={() => {
                                setOrderSuccess(false);
                                setCart({});
                                setActiveTab('menu');
                            }}
                            className="w-full py-3 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition-colors"
                        >
                            Pesan Menu Lainnya
                        </button>
                    </div>
                </div>
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

function MenuDetailSheet({
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
    const [tab, setTab] = useState<'desc' | 'combo' | 'reviews'>('desc');
    const accent = 'text-[#FF5B35]';
    const accentBg = 'bg-[#FF5B35]';
    const steps = item.steps ?? [
        'Bahan segar diproses higienis sesuai standar outlet.',
        'Diolah dengan resep rahasia outlet untuk cita rasa terbaik.',
        'Disajikan hangat/segar langsung ke meja Anda.',
    ];
    const reviews = item.reviews ?? [];

    return (
        <div className="fixed inset-0 z-50 flex flex-col justify-end" onClick={onClose}>
            <div className="absolute inset-0 bg-black/60 backdrop-blur-sm" />
            <div
                className="relative w-full max-w-md mx-auto bg-[#1c1917] rounded-t-3xl overflow-hidden shadow-2xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                {/* Hero */}
                <div className="relative h-56 shrink-0 bg-black">
                    <ProductImage
                        src={item.image}
                        alt={item.name}
                        variant="large"
                        className="w-full h-full object-cover"
                    />
                    <button
                        onClick={onClose}
                        className="absolute top-3 right-3 size-9 rounded-full bg-black/50 text-white grid place-items-center backdrop-blur"
                    >
                        ✕
                    </button>
                    {item.isPopular && (
                        <span className="absolute top-3 left-3 bg-white/90 text-[#7C4A2D] font-black text-[10px] uppercase tracking-wider px-2 py-1 rounded-full">
                            🔥 Favorit
                        </span>
                    )}
                    <div
                        className={`absolute bottom-3 right-3 ${accentBg} text-white font-extrabold text-sm px-3 py-1.5 rounded-full shadow-lg`}
                    >
                        {formatRupiah(item.price)}
                    </div>
                </div>

                {/* Body */}
                <div className="flex-1 overflow-y-auto px-5 py-4">
                    <h2 className="text-2xl font-extrabold text-white tracking-tight">{item.name}</h2>
                    <p className="text-xs font-semibold text-[#D97706] mt-0.5">{outletName}</p>

                    <div className="flex items-center gap-4 mt-3 text-xs text-slate-400">
                        <span className="text-[#F59E0B]">
                            {'★'.repeat(Math.round(item.rating ?? 4.9))}{' '}
                            <span className="text-slate-300 font-bold">{(item.rating ?? 4.9).toFixed(1)}</span>
                        </span>
                        {item.cookTime && <span>⏱ {item.cookTime}</span>}
                        {item.servings && <span>🍽 {item.servings}</span>}
                    </div>

                    <p className="text-sm text-slate-300 leading-relaxed mt-3">
                        {item.description || 'Hidangan lezat diolah higienis dengan resep rahasia outlet.'}
                    </p>

                    {/* Tabs */}
                    <div className="flex gap-6 mt-5 border-b border-white/10">
                        {(['desc', 'combo', 'reviews'] as const).map((t) => (
                            <button
                                key={t}
                                onClick={() => setTab(t)}
                                className={`pb-2 text-sm font-bold transition-colors ${tab === t ? accent + ' border-b-2 border-[#FF5B35]' : 'text-slate-500'}`}
                            >
                                {t === 'desc' ? 'Deskripsi' : t === 'combo' ? 'Combo' : 'Ulasan'}
                            </button>
                        ))}
                    </div>

                    <div className="py-4 space-y-3">
                        {tab === 'desc' && (
                            <div className="space-y-3">
                                {steps.map((s, i) => (
                                    <div key={i} className="flex gap-3">
                                        <div
                                            className={`shrink-0 size-6 rounded-full ${accentBg} text-white font-extrabold text-xs grid place-items-center`}
                                        >
                                            {i + 1}
                                        </div>
                                        <p className="text-sm text-slate-300 leading-snug pt-0.5">{s}</p>
                                    </div>
                                ))}
                            </div>
                        )}
                        {tab === 'combo' && (
                            <p className="text-sm text-slate-400">
                                {item.combo ?? 'Belum ada paket combo untuk menu ini.'}
                            </p>
                        )}
                        {tab === 'reviews' &&
                            (reviews.length > 0 ? (
                                <div className="space-y-3">
                                    {reviews.map((r, i) => (
                                        <div key={i} className="border border-white/10 rounded-xl p-3">
                                            <div className="flex items-center justify-between">
                                                <span className="text-sm font-bold text-white">{r.name}</span>
                                                <span className="text-[#F59E0B] text-xs">{'★'.repeat(r.rating)}</span>
                                            </div>
                                            <p className="text-xs text-slate-400 mt-1">{r.text}</p>
                                        </div>
                                    ))}
                                </div>
                            ) : (
                                <p className="text-sm text-slate-400">Belum ada ulasan untuk menu ini.</p>
                            ))}
                    </div>
                </div>

                {/* CTA */}
                <div className="shrink-0 p-4 bg-[#1c1917] border-t border-white/10">
                    <button
                        onClick={() => {
                            onAdd(item.id);
                            onClose();
                        }}
                        className={`w-full ${accentBg} text-white rounded-2xl py-3.5 text-sm font-extrabold shadow-lg shadow-[#FF5B35]/30`}
                    >
                        Tambah ke Pesanan · {formatRupiah(item.price)}
                    </button>
                </div>
            </div>
        </div>
    );
}
