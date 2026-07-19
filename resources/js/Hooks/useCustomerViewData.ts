import { useState, useEffect, useCallback } from 'react';
import { usePage } from '@inertiajs/react';
import { useTenantSettings } from '../Components/Shared';
import { evaluateSchedule } from '../lib/evaluateSchedule';
import { MenuItem } from '../Pages/BukuMenuDigital/CustomerView';
import { OperatingHour } from '../Types/outlet';

export interface OrderStub {
    id: string;
    status: 'offline' | 'ready';
    label: string;
    duration: string;
    items: string;
    total: number;
    step: number;
    destination?: 'kds' | 'bar';
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

export function useCustomerViewData() {
    const { renderLogo, tenantImage, tenantLayout: lsTenantLayout, screenMode: lsScreenMode } = useTenantSettings();
    const page = usePage();
    const screenMode = (page.props.screen_mode as string) || lsScreenMode;
    const tenantLayout = (page.props.tenant_layout as string) || lsTenantLayout;
    const isNanoBanana = screenMode === 'nano-banana' || tenantLayout === 'nano-banana';

    const [tableNumber, setTableNumber] = useState<string | null>(null);
    const [guestVerified, setGuestVerified] = useState(false);
    const [verifyToken, setVerifyToken] = useState('');
    const [outletGeo, setOutletGeo] = useState<{
        latitude: number | null;
        longitude: number | null;
        geo_radius_meters: number;
    } | null>(null);
    const outletSlug = (window.location.pathname.split('/m/')[1] ?? '').split('?')[0] ?? '';
    const [outletName, setOutletName] = useState<string>(tenantImage ? '' : 'Outlet');
    const [activeCategory, setActiveCategory] = useState('Makanan');
    const [searchQuery, setSearchQuery] = useState('');
    const [cart, setCart] = useState<Record<number, number>>({});
    const [detailItem, setDetailItem] = useState<MenuItem | null>(null);
    const [orderSuccess, setOrderSuccess] = useState(false);
    const [activeTab, setActiveTab] = useState<'menu' | 'cart' | 'reservasi' | 'galeri'>('menu');

    const [menuItems, setMenuItems] = useState<MenuItem[]>([]);
    const [outletId, setOutletId] = useState<number | null>(null);
    const [, setMenuLoading] = useState(true);

    const [rName, setRName] = useState('');
    const [rPhone, setRPhone] = useState('');
    const [rDate, setRDate] = useState('');
    const [rTime, setRTime] = useState('');
    const [rGuests, setRGuests] = useState('2');
    const [rType, setRType] = useState('meja');
    const [rNotes, setRNotes] = useState('');
    const [reservationSuccess, setReservationSuccess] = useState(false);
    const [isSubmittingR, setIsSubmittingR] = useState(false);

    const [orderType, setOrderType] = useState<'dine_in' | 'take_away'>('dine_in');
    const [chefNotes, setChefNotes] = useState('');

    const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
    const [orderStatus, setOrderStatus] = useState<string | null>(null);
    const [orderTone, setOrderTone] = useState<string>('amber');
    const [orderHasFood, setOrderHasFood] = useState<boolean>(false);
    const [orderHasDrink, setOrderHasDrink] = useState<boolean>(false);
    const [orderFoodServed, setOrderFoodServed] = useState<boolean>(false);
    const [orderDrinkServed, setOrderDrinkServed] = useState<boolean>(false);

    const [appStage, setAppStage] = useState<'landing' | 'welcome' | 'howto' | 'app'>('landing');
    const [dailyPin, setDailyPin] = useState<string | null>(null);
    const [isOutletOpen, setIsOutletOpen] = useState(true);
    const [outletScheduleMsg, setOutletScheduleMsg] = useState<string | null>(null);

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

    useEffect(() => {
        const apiUrl = `/api/menu${outletSlug ? `/${encodeURIComponent(outletSlug)}` : ''}`;
        fetch(apiUrl)
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                const items: MenuItem[] = (data?.menu ?? []).map((m: MenuItem) => ({
                    ...m,
                    category: m.category?.name ?? m.category ?? '',
                    image: m.photo_url ?? undefined,
                }));
                if (data?.outlet?.name) setOutletName(data.outlet.name);
                if (data?.outlet?.id) setOutletId(Number(data.outlet.id));
                if (data?.outlet)
                    setOutletGeo({
                        latitude: data.outlet.latitude ?? null,
                        longitude: data.outlet.longitude ?? null,
                        geo_radius_meters: data.outlet.geo_radius_meters ?? 50,
                    });
                if (data?.screen_mode) {
                    window.localStorage.setItem('outlet_screen_mode', data.screen_mode);
                    window.localStorage.setItem('tenant_layout', data.tenant_layout ?? data.screen_mode);
                }
                setMenuItems(items.length ? items : FALLBACK_ITEMS);
            })
            .catch(() => setMenuItems(FALLBACK_ITEMS))
            .finally(() => setMenuLoading(false));

        if (outletSlug) {
            fetch(`/api/guest/daily-pin?slug=${encodeURIComponent(outletSlug)}`)
                .then((r) => (r.ok ? r.json() : null))
                .then((d) => d?.pin && setDailyPin(String(d.pin)))
                .catch(() => {});
        }
    }, []);

    useEffect(() => {
        const apiUrl = `/api/outlet-operating-hours${outletSlug ? `?outlet=${encodeURIComponent(outletSlug)}` : ''}`;
        const applySchedule = (schedule: OperatingHour[] | null) => {
            const result = evaluateSchedule(schedule ?? []);
            if (result) {
                setIsOutletOpen(result.isOpen);
                setOutletScheduleMsg(result.msg);
            }
        };
        fetch(apiUrl)
            .then((r) => (r.ok ? r.json() : null))
            .then((data) => {
                if (data?.operating_hours) {
                    const dayNames: Record<string, string> = {
                        mon: 'Senin',
                        tue: 'Selasa',
                        wed: 'Rabu',
                        thu: 'Kamis',
                        fri: 'Jumat',
                        sat: 'Sabtu',
                        sun: 'Minggu',
                    };
                    const schedule = Object.entries(data.operating_hours).map(
                        ([key, val]: [string, { closed: boolean; open: string; close: string }]) => ({
                            day: dayNames[key] ?? key,
                            isOpen: !val.closed,
                            openTime: val.open,
                            closeTime: val.close,
                        }),
                    );
                    applySchedule(schedule);
                } else {
                    const raw = localStorage.getItem('outlet_jam_operasional');
                    if (raw) {
                        try {
                            applySchedule(JSON.parse(raw));
                        } catch {
                            /* ignore */
                        }
                    }
                }
            })
            .catch(() => {
                const raw = localStorage.getItem('outlet_jam_operasional');
                if (raw) {
                    try {
                        applySchedule(JSON.parse(raw));
                    } catch {
                        /* ignore */
                    }
                }
            });
    }, []);

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const table = params.get('t') ?? params.get('table');
        if (table) setTableNumber(table);
    }, []);

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

    const addToCart = useCallback((id: number) => setCart((prev) => ({ ...prev, [id]: (prev[id] || 0) + 1 })), []);
    const removeFromCart = useCallback(
        (id: number) =>
            setCart((prev) => {
                const next = { ...prev };
                if (next[id] <= 1) delete next[id];
                else next[id]--;
                return next;
            }),
        [],
    );

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

    const handleCheckout = useCallback(async () => {
        if (!isOutletOpen) {
            alert(`Mohon maaf, pemesanan saat ini ditutup. ${outletScheduleMsg || ''}`);
            return;
        }
        if (!guestVerified || !verifyToken) {
            alert('Silakan verifikasi kehadiran (GPS + PIN) terlebih dahulu sebelum mengirim pesanan.');
            return;
        }
        if (!outletId) {
            alert('Data outlet belum siap. Muat ulang halaman lalu coba lagi.');
            return;
        }
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
                body: JSON.stringify({ outlet_id: outletId, table: displayTable, items, verify_token: verifyToken }),
            });
            const data = await response.json().catch(() => null);
            if (response.ok && data?.success) {
                setActiveOrderId(data.order.id);
                setOrderStatus(data.order.status);
                setOrderTone(data.order.tone ?? 'info');
                setOrderSuccess(true);
            } else if (response.status === 422 && /verifikasi|token/i.test(data?.message ?? '')) {
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
    }, [
        isOutletOpen,
        outletScheduleMsg,
        guestVerified,
        verifyToken,
        outletId,
        cart,
        chefNotes,
        orderType,
        tableNumber,
    ]);

    const handleReservationSubmit = useCallback(
        async (e: React.FormEvent) => {
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
                setReservationSuccess(true);
            } catch {
                setReservationSuccess(true);
            } finally {
                setIsSubmittingR(false);
            }
        },
        [rName, rPhone, rDate, rTime, rGuests, rType, rNotes],
    );

    return {
        // settings/context
        renderLogo,
        tenantImage,
        isNanoBanana,
        screenMode,
        tenantLayout,
        // state
        tableNumber,
        setTableNumber,
        guestVerified,
        setGuestVerified,
        verifyToken,
        setVerifyToken,
        outletGeo,
        outletSlug,
        outletName,
        activeCategory,
        setActiveCategory,
        searchQuery,
        setSearchQuery,
        cart,
        setCart,
        detailItem,
        setDetailItem,
        orderSuccess,
        setOrderSuccess,
        activeTab,
        setActiveTab,
        menuItems,
        outletId,
        rName,
        setRName,
        rPhone,
        setRPhone,
        rDate,
        setRDate,
        rTime,
        setRTime,
        rGuests,
        setRGuests,
        rType,
        setRType,
        rNotes,
        setRNotes,
        reservationSuccess,
        setReservationSuccess,
        isSubmittingR,
        orderType,
        setOrderType,
        chefNotes,
        setChefNotes,
        activeOrderId,
        setActiveOrderId,
        orderStatus,
        orderTone,
        orderHasFood,
        orderHasDrink,
        orderFoodServed,
        orderDrinkServed,
        appStage,
        setAppStage,
        dailyPin,
        isOutletOpen,
        outletScheduleMsg,
        orders,
        // derived
        categories,
        filteredItems,
        cartTotalItems,
        cartTotalPrice,
        // handlers
        addToCart,
        removeFromCart,
        handleCheckout,
        handleReservationSubmit,
    };
}
