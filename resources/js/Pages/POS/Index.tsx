import { useState, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { useCart } from '../../Hooks/useCart';
import { ProductImage } from '../../Components/ProductImage';
import {
    Screen,
    Glass,
    formatRupiah,
    PAYMENT_METHODS,
    TAX_LABELS,
    useTenantSettings,
    getOutletTaxConfig,
} from '../../Components/Shared';
import {
    SearchIcon,
    UtensilsIcon,
    FileTextIcon,
    XCircleIcon,
    PencilIcon,
    PercentIcon,
    SparklesIcon,
} from '../../Components/icons';
import { ReceiptPreview } from '../../Components/POS/ReceiptPreview';
import { RoleGuard } from '../../Components/RoleGuard';

// ─── Menu Catalog ─────────────────────────────────────────────────────────────
// Foto menu diarahkan ke Cloudinary (sesuai konvensi Restoku: jangan hardcode
// /images lokal). Saat modul upload owner aktif, path diganti jadi URL Cloudinary
// penuh; ProductImage menangani fallback bila gambar gagal dimuat.
const CLOUDINARY_BASE = 'https://res.cloudinary.com/restoku/image/upload';
const MENU_CATALOG = [
    {
        id: 1,
        name: 'Nasi Goreng Spesial',
        price: 25000,
        category: 'Makanan',
        image: `${CLOUDINARY_BASE}/nasi_goreng.webp`,
    },
    { id: 2, name: 'Mie Goreng Jawa', price: 25000, category: 'Makanan' },
    { id: 3, name: 'Sate Ayam Madura', price: 35000, category: 'Makanan' },
    { id: 4, name: 'Soto Ayam Lamongan', price: 22000, category: 'Makanan' },
    { id: 7, name: 'Es Teh Manis', price: 5000, category: 'Minuman', image: `${CLOUDINARY_BASE}/es_teh.webp` },
    { id: 8, name: 'Es Jeruk Peras', price: 8000, category: 'Minuman' },
    { id: 9, name: 'Kopi Susu Aren', price: 18000, category: 'Minuman' },
    { id: 10, name: 'Pisang Goreng Keju', price: 15000, category: 'Pelengkap' },
] as const;

function POSInner() {
    const { screenMode } = useTenantSettings();
    const isNanoBanana = screenMode === 'nano-banana';
    const cart = useCart();

    // ── Tax Config dari Inertia Shared Props ──────────────────────────────────
    // MIGRASI dari localStorage ke usePage().props.outlet_settings
    // Fallback ke localStorage untuk backward-compat sementara komponen lain dimigrasikan
    const { outlet_settings } = usePage<any>().props;
    const taxConfig = (() => {
        // Primary: baca dari Inertia shared props (di-supply oleh HandleInertiaRequests)
        if (outlet_settings) {
            return {
                taxType: outlet_settings.tax_type ?? 'pbjt',
                taxRate: outlet_settings.is_tax_active ? (outlet_settings.tax_rate ?? 10) : 0,
                serviceCharge: outlet_settings.is_tax_active ? (outlet_settings.service_charge ?? 0) : 0,
                isTaxActive: outlet_settings.is_tax_active !== false,
            };
        }
        // Fallback: localStorage (untuk sesi yang sudah ada sebelum migrasi)
        try {
            const isTaxActive = localStorage.getItem('outlet_tax_active') !== 'false';
            return {
                taxType: localStorage.getItem('outlet_tax_type') ?? 'pbjt',
                taxRate: isTaxActive ? Number(localStorage.getItem('outlet_tax_rate')) || 10 : 0,
                serviceCharge: isTaxActive ? Number(localStorage.getItem('outlet_service_charge')) || 0 : 0,
                isTaxActive,
            };
        } catch {
            return { taxType: 'pbjt', taxRate: 10, serviceCharge: 0, isTaxActive: true };
        }
    })();

    useEffect(() => {
        const params = new URLSearchParams(window.location.search);
        const loadOrderId = params.get('loadOrder');
        if (loadOrderId) {
            const fetchAndLoadOrder = async () => {
                try {
                    const response = await fetch(`/api/orders/${loadOrderId}`);
                    if (response.ok) {
                        const data = await response.json();
                        if (data.order && Array.isArray(data.order.items)) {
                            // Map items to cart items
                            const cartItems = data.order.items
                                .filter((itemStr: string) => !itemStr.startsWith('+')) // Filter out chef notes
                                .map((itemStr: string, index: number) => {
                                    // e.g. "2x Nasi Goreng" or "1x Es Teh"
                                    const match = itemStr.match(/^(\d+)x\s+(.+)$/);
                                    const qty = match ? parseInt(match[1]) : 1;
                                    const name = match ? match[2].trim() : itemStr.trim();

                                    // Find price in catalog (case insensitive search)
                                    const catalogItem = MENU_CATALOG.find(
                                        (c) =>
                                            c.name.toLowerCase().replace(/\s+/g, '') ===
                                            name.toLowerCase().replace(/\s+/g, ''),
                                    );
                                    const price = catalogItem ? catalogItem.price : 20000;
                                    const category = catalogItem ? catalogItem.category : 'Makanan';
                                    const id = catalogItem ? catalogItem.id : 100 + index;

                                    return {
                                        id,
                                        name,
                                        price,
                                        quantity: qty,
                                        note: '',
                                        category,
                                    };
                                });

                            // Check if there is a chef note
                            const noteItem = data.order.items.find((itemStr: string) => itemStr.startsWith('+'));
                            if (noteItem && cartItems.length > 0) {
                                // Attach note to the first item
                                cartItems[0].note = noteItem.replace(/^\+\s*Catatan:\s*/i, '').trim();
                            }

                            cart.loadCartItems(cartItems);

                            // Remove query param from url
                            const newUrl =
                                window.location.protocol + '//' + window.location.host + window.location.pathname;
                            window.history.pushState({ path: newUrl }, '', newUrl);
                        }
                    }
                } catch (err) {
                    console.error('Gagal memuat detail pesanan ke POS', err);
                }
            };
            fetchAndLoadOrder();
        }
    }, []);

    const [selectedPayment, setSelectedPayment] = useState('qris');
    const [activeCategory, setActiveCategory] = useState('Semua');
    const [searchQuery, setSearchQuery] = useState('');

    const [activeOrderId, setActiveOrderId] = useState<string | null>(null);
    const [orderTableName, setOrderTableName] = useState<string | null>(null);
    const [servedQueue, setServedQueue] = useState<any[]>([]);

    // Ad-hoc item states
    const [adHocName, setAdHocName] = useState('');
    const [adHocPrice, setAdHocPrice] = useState('');

    const handleAddAdHoc = () => {
        if (!adHocName.trim()) return;
        const priceNum = parseInt(adHocPrice) || 0;

        cart.addItem({
            id: Date.now(),
            name: adHocName.trim(),
            price: priceNum,
            category: 'Pelengkap',
        });

        setAdHocName('');
        setAdHocPrice('');
    };

    const fetchServedQueue = async () => {
        try {
            const response = await fetch('/api/cashier-queue');
            if (response.ok) {
                const data = await response.json();
                setServedQueue(data.queue || []);
            }
        } catch (err) {
            console.error('Gagal mengambil antrean pembayaran', err);
        }
    };

    useEffect(() => {
        fetchServedQueue();
        const interval = setInterval(fetchServedQueue, 3000);
        return () => clearInterval(interval);
    }, []);

    const calculateOrderTotal = (order: any) => {
        return order.items
            .filter((itemStr: string) => !itemStr.startsWith('+'))
            .reduce((sum: number, itemStr: string) => {
                const match = itemStr.match(/^(\d+)x\s+(.+)$/);
                const qty = match ? parseInt(match[1]) : 1;
                const name = match ? match[2].trim() : itemStr.trim();
                const catalogItem = MENU_CATALOG.find(
                    (c) => c.name.toLowerCase().replace(/\s+/g, '') === name.toLowerCase().replace(/\s+/g, ''),
                );
                const price = catalogItem ? catalogItem.price : 20000;
                return sum + price * qty;
            }, 0);
    };

    const handleLoadServedOrder = (order: any) => {
        // Map items to cart items
        const cartItems = order.items
            .filter((itemStr: string) => !itemStr.startsWith('+'))
            .map((itemStr: string, index: number) => {
                const match = itemStr.match(/^(\d+)x\s+(.+)$/);
                const qty = match ? parseInt(match[1]) : 1;
                const name = match ? match[2].trim() : itemStr.trim();
                const catalogItem = MENU_CATALOG.find(
                    (c) => c.name.toLowerCase().replace(/\s+/g, '') === name.toLowerCase().replace(/\s+/g, ''),
                );
                const price = catalogItem ? catalogItem.price : 20000;
                const category = catalogItem ? catalogItem.category : 'Makanan';
                const id = catalogItem ? catalogItem.id : 100 + index;

                return {
                    id,
                    name,
                    price,
                    quantity: qty,
                    note: '',
                    category,
                };
            });

        // Check if there is a chef note
        const noteItem = order.items.find((itemStr: string) => itemStr.startsWith('+'));
        if (noteItem && cartItems.length > 0) {
            cartItems[0].note = noteItem.replace(/^\+\s*Catatan:\s*/i, '').trim();
        }

        setActiveOrderId(order.id);
        setOrderTableName(order.table);
        cart.loadCartItems(cartItems);
    };
    const [editingNoteId, setEditingNoteId] = useState<number | null>(null);
    const [noteInput, setNoteInput] = useState('');
    const [waNumber, setWaNumber] = useState('');
    const [isSendingWa, setIsSendingWa] = useState(false);
    const [waSent, setWaSent] = useState(false);
    const [isReceiptModalOpen, setIsReceiptModalOpen] = useState(false);
    const [isPrintingBt, setIsPrintingBt] = useState(false);

    const [isDiscountModalOpen, setIsDiscountModalOpen] = useState(false);
    const [tempDiscountType, setTempDiscountType] = useState<'percentage' | 'nominal' | 'none'>('none');
    const [tempDiscountValue, setTempDiscountValue] = useState('');

    const [isSplitBillModalOpen, setIsSplitBillModalOpen] = useState(false);
    const [splitCount, setSplitCount] = useState('2');
    const [splitMode, setSplitMode] = useState<'evenly' | 'per_item'>('evenly');
    const [splitSelectedItems, setSplitSelectedItems] = useState<Record<number, number>>({});

    const handleCheckout = () => {
        // Bluetooth Thermal Auto-Print Trigger
        setIsPrintingBt(true);
        fetch('/api/print-receipt', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                orderId: activeOrderId || 'TRX-' + Date.now(),
                table: orderTableName || 'Meja 5',
                total: total,
            }),
        })
            .then(() => {
                setTimeout(() => {
                    setIsPrintingBt(false);
                }, 3000);
            })
            .catch((err) => {
                console.error('Gagal auto-print Bluetooth', err);
                setIsPrintingBt(false);
            });

        if (waNumber) {
            setIsSendingWa(true);
            setTimeout(() => {
                setIsSendingWa(false);
                setWaSent(true);
                setTimeout(() => {
                    setWaSent(false);
                    setWaNumber('');
                    setIsReceiptModalOpen(true);
                }, 3000);
            }, 1500);
        } else {
            setIsReceiptModalOpen(true);
        }
    };

    const handleCloseReceipt = () => {
        setIsReceiptModalOpen(false);
        if (activeOrderId) {
            fetch(`/api/cashier-queue/${activeOrderId}`, { method: 'DELETE' })
                .then(() => {
                    fetchServedQueue();
                    setActiveOrderId(null);
                    setOrderTableName(null);
                })
                .catch((err) => console.error('Gagal menghapus antrean pembayaran', err));
        }
        cart.clearCart();
    };

    // [H-1 FIX] Dynamic tax config from Pengaturan Outlet (Inertia SSOT with fallback)
    const taxType = taxConfig?.taxType ?? getOutletTaxConfig().taxType;
    const taxRate = taxConfig?.taxRate ?? getOutletTaxConfig().taxRate;
    const serviceCharge = taxConfig?.serviceCharge ?? getOutletTaxConfig().serviceCharge;
    const taxRateDecimal = taxRate / 100;
    const serviceChargeDecimal = serviceCharge / 100;
    const pbjt = Math.round(cart.subtotalAfterDiscount * taxRateDecimal);
    const svcCharge = Math.round(cart.subtotalAfterDiscount * serviceChargeDecimal);
    const total = cart.subtotalAfterDiscount + pbjt + svcCharge;

    // Split Bill Per Item calculations
    const subBillSubtotal = Object.entries(splitSelectedItems).reduce((sum, [id, qty]) => {
        const item = cart.items.find((i) => i.id === Number(id));
        return sum + (item ? item.price * qty : 0);
    }, 0);

    const subBillDiscount =
        cart.discountType === 'percentage'
            ? (subBillSubtotal * cart.discountValue) / 100
            : cart.discountType === 'nominal'
              ? cart.subtotal > 0
                  ? (subBillSubtotal / cart.subtotal) * cart.discountValue
                  : 0
              : 0;

    const subBillPbjt = Math.round((subBillSubtotal - subBillDiscount) * taxRateDecimal);
    const subBillSvc = Math.round((subBillSubtotal - subBillDiscount) * serviceChargeDecimal);
    const subBillTotal = subBillSubtotal - subBillDiscount + subBillPbjt + subBillSvc;

    const handlePayPartial = () => {
        Object.entries(splitSelectedItems).forEach(([id, qty]) => {
            const item = cart.items.find((i) => i.id === Number(id));
            if (item) {
                cart.updateQuantity(item.id, item.quantity - qty);
            }
        });
        setSplitSelectedItems({});
        setIsSplitBillModalOpen(false);
    };

    const paymentMethods = Object.entries(PAYMENT_METHODS).filter(([k]) =>
        ['cash', 'qris', 'gopay', 'ovo', 'dana', 'bank_transfer'].includes(k),
    );

    const filteredMenu = MENU_CATALOG.filter((p) => {
        const matchesCat = activeCategory === 'Semua' || p.category === activeCategory;
        const matchesSearch = p.name.toLowerCase().includes(searchQuery.toLowerCase());
        return matchesCat && matchesSearch;
    });

    const handleNoteSubmit = (id: number) => {
        cart.updateNote(id, noteInput);
        setEditingNoteId(null);
        setNoteInput('');
    };

    return (
        <MainLayout noScroll>
            <Head title="Kasir (POS)" />
            <Screen title="Kasir (POS)" subtitle="Dashboard kasir." noScroll>
                {isPrintingBt && (
                    <div className="fixed bottom-6 right-6 z-50 flex items-center gap-3 rounded-2xl bg-emerald-500 text-slate-950 font-bold px-5 py-4 shadow-2xl animate-bounce border border-emerald-400">
                        <span className="size-2 bg-slate-950 rounded-full animate-ping" />
                        🖨️ Bluetooth Printer: Auto-Print Struk Berhasil!
                    </div>
                )}
                <div className="grid grid-cols-[1fr_400px] gap-5 items-stretch flex-1 min-h-0 h-full overflow-hidden">
                    {/* ── Menu Grid ── */}
                    <Glass className="p-4 flex flex-col h-full max-h-full overflow-y-auto min-h-0">
                        {/* Served Orders Payment Queue */}
                        {servedQueue.length > 0 && (
                            <div className="mb-5 bg-emerald-500/5 border border-emerald-500/10 rounded-2xl p-4">
                                <div className="flex items-center justify-between mb-3">
                                    <h4 className="text-[11px] font-black text-emerald-400 uppercase tracking-wider flex items-center gap-1.5 animate-pulse">
                                        <SparklesIcon className="size-3.5 text-emerald-400" /> Antrean Meja Siap Bayar
                                        (QR)
                                    </h4>
                                    <span className="text-[10px] text-slate-500">
                                        Klik meja untuk memproses tagihan
                                    </span>
                                </div>
                                <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
                                    {servedQueue.map((order) => {
                                        const isTakeAway = order.table.toLowerCase().includes('takeaway');
                                        return (
                                            <button
                                                key={order.id}
                                                type="button"
                                                onClick={() => handleLoadServedOrder(order)}
                                                className="bg-white/5 border border-white/10 hover:border-emerald-500/30 hover:bg-emerald-500/10 text-left p-3 rounded-xl transition-all min-w-[150px] shrink-0 flex flex-col justify-between"
                                            >
                                                <div>
                                                    <div className="font-extrabold text-xs text-white truncate">
                                                        {isTakeAway ? '🛍️ ' : '🍽️ '}
                                                        {order.table}
                                                    </div>
                                                    <div className="text-[8px] text-slate-500 mt-1 uppercase font-bold tracking-wider">
                                                        Rincian Menu:
                                                    </div>
                                                    <div className="text-[9px] text-slate-300 mt-0.5 space-y-0.5 border-t border-white/5 pt-1 max-w-[135px]">
                                                        {order.items
                                                            .filter((i) => !i.startsWith('+'))
                                                            .map((it: string, idx: number) => (
                                                                <div
                                                                    key={idx}
                                                                    className="truncate select-none font-medium leading-snug"
                                                                >
                                                                    {it}
                                                                </div>
                                                            ))}
                                                    </div>
                                                </div>
                                                <div className="mt-3 flex flex-col gap-1.5">
                                                    <span
                                                        className={`self-start text-[8px] px-1.5 py-0.5 rounded font-extrabold uppercase tracking-wide border ${isTakeAway ? 'bg-amber-500/10 text-amber-400 border-amber-500/20' : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border-[var(--color-primary)]/20'}`}
                                                    >
                                                        {isTakeAway ? 'Take Away' : 'Dine In'}
                                                    </span>
                                                    <div className="text-xs font-bold text-emerald-400 font-mono">
                                                        {formatRupiah(calculateOrderTotal(order))}
                                                    </div>
                                                </div>
                                            </button>
                                        );
                                    })}
                                </div>
                            </div>
                        )}

                        <div className="flex justify-between items-center mb-5">
                            <div className="flex gap-2">
                                {['Semua', 'Makanan', 'Minuman', 'Pelengkap'].map((cat) => (
                                    <button
                                        key={cat}
                                        onClick={() => setActiveCategory(cat)}
                                        className={`rounded-lg text-sm font-medium px-3 py-1.5 transition-colors ${activeCategory === cat ? 'bg-white/10 text-white' : 'text-slate-400 hover:text-slate-200 hover:bg-white/5'}`}
                                    >
                                        {cat}
                                    </button>
                                ))}
                            </div>
                            <div className="flex items-center gap-2 rounded-lg border border-white/10 bg-white/5 px-3 py-1.5 focus-within:border-white/20 transition-colors">
                                <SearchIcon className="size-4 text-slate-400" />
                                <input
                                    placeholder="Cari menu..."
                                    value={searchQuery}
                                    onChange={(e) => setSearchQuery(e.target.value)}
                                    className="bg-transparent text-sm outline-none w-40 text-slate-200 placeholder:text-slate-400"
                                />
                            </div>
                        </div>

                        <div className="grid grid-cols-4 gap-5 auto-rows-max content-start flex-1 overflow-y-auto pr-2 pb-4">
                            {filteredMenu.map((product) => {
                                const inCart = cart.items.find((i) => i.id === product.id);
                                return (
                                    <button
                                        key={product.id}
                                        type="button"
                                        onClick={() => cart.addItem(product)}
                                        className={`rounded-2xl border overflow-hidden cursor-pointer transition-all duration-300 ease-out hover:-translate-y-1 group text-left relative flex flex-col justify-between ${
                                            isNanoBanana
                                                ? 'border-amber-500/20 bg-[#030712]/90 hover:border-amber-500/60 hover:shadow-[0_8px_30px_rgba(234,179,8,0.25)] hover:bg-[#030712]'
                                                : 'border-white/5 bg-white/[0.02] hover:shadow-[0_8px_30px_rgb(0,0,0,0.12)] hover:border-white/20 hover:bg-white/[0.04]'
                                        }`}
                                    >
                                        {inCart && (
                                            <div
                                                className={`absolute top-2 right-2 z-10 size-5 rounded-full text-[10px] font-bold flex items-center justify-center shadow-lg ${
                                                    isNanoBanana
                                                        ? 'bg-amber-500 text-slate-950 ring-2 ring-[#030712]'
                                                        : 'bg-[var(--color-primary)]/100 text-white'
                                                }`}
                                            >
                                                {inCart.quantity}
                                            </div>
                                        )}
                                        <div className="h-28 w-full relative overflow-hidden bg-slate-900 border-b border-white/5 flex items-center justify-center">
                                            <ProductImage
                                                src={'image' in product ? product.image || null : null}
                                                alt={product.name}
                                                variant="full"
                                                className="w-full h-full object-cover rounded-none transition-transform duration-300 group-hover:scale-105"
                                            />
                                        </div>
                                        <div className="p-3">
                                            <p className="font-semibold text-sm text-slate-200 leading-tight truncate">
                                                {product.name}
                                            </p>
                                            <p
                                                className={`font-mono text-xs mt-1.5 font-bold ${isNanoBanana ? 'text-amber-400' : 'text-emerald-400'}`}
                                            >
                                                {formatRupiah(product.price)}
                                            </p>
                                        </div>
                                    </button>
                                );
                            })}
                            {filteredMenu.length === 0 && (
                                <div className="col-span-4 flex flex-col items-center justify-center h-40 text-slate-500">
                                    <SearchIcon className="size-8 mb-2 opacity-40" />
                                    <p className="text-sm">Tidak ada menu ditemukan</p>
                                </div>
                            )}
                        </div>
                    </Glass>

                    {/* ── Cart Panel ── */}
                    <Glass className="p-4 flex flex-col h-full max-h-full overflow-y-auto min-h-0">
                        <div className="flex items-center justify-between mb-4">
                            <h2 className="text-base font-bold text-slate-200 truncate">
                                {activeOrderId ? `Pesanan: ${orderTableName}` : 'Transaksi Baru'}
                            </h2>
                            <div className="flex items-center gap-2 shrink-0">
                                {activeOrderId && (
                                    <span
                                        className={`text-[10px] px-2 py-0.5 rounded-full font-bold uppercase ${orderTableName?.toLowerCase().includes('takeaway') ? 'bg-amber-500/10 text-amber-400 border border-amber-500/20' : 'bg-[var(--color-primary)]/10 text-[var(--color-primary)] border border-[var(--color-primary)]/20'}`}
                                    >
                                        {orderTableName?.toLowerCase().includes('takeaway')
                                            ? '🛍️ Take Away'
                                            : '🍽️ Dine In'}
                                    </span>
                                )}
                                {cart.itemCount > 0 && (
                                    <button
                                        type="button"
                                        onClick={cart.clearCart}
                                        className="text-[11px] text-slate-500 hover:text-red-400 transition-colors"
                                    >
                                        Kosongkan
                                    </button>
                                )}
                            </div>
                        </div>

                        <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0">
                            {cart.items.length === 0 && (
                                <div className="h-full flex flex-col items-center justify-center text-slate-600">
                                    <UtensilsIcon className="size-10 mb-3 opacity-30" />
                                    <p className="text-sm">Klik menu di kiri untuk menambah pesanan</p>
                                </div>
                            )}
                            {cart.items.map((item) => (
                                <div
                                    key={item.id}
                                    className={`rounded-2xl border transition-all duration-300 ease-out p-3.5 shadow-sm ${
                                        isNanoBanana
                                            ? 'border-amber-500/20 bg-amber-500/[0.02] hover:bg-amber-500/[0.06] hover:border-amber-500/40 shadow-[0_4px_20px_rgba(234,179,8,0.05)]'
                                            : 'border-white/5 bg-white/[0.015] hover:bg-white/[0.03]'
                                    }`}
                                >
                                    <div className="flex justify-between items-start">
                                        <div className="flex-1 min-w-0">
                                            <p className="font-medium text-sm text-slate-200 truncate">{item.name}</p>
                                            {item.note && (
                                                <p className="text-[11px] text-amber-400/80 mt-0.5 truncate">
                                                    📝 {item.note}
                                                </p>
                                            )}
                                            <p className="text-slate-500 text-xs mt-0.5">
                                                {formatRupiah(item.price)} / porsi
                                            </p>
                                        </div>
                                        <div className="flex items-center gap-1.5 ml-3 shrink-0">
                                            <button
                                                type="button"
                                                onClick={() => cart.updateQuantity(item.id, item.quantity - 1)}
                                                className="size-6 rounded bg-white/5 text-slate-400 hover:bg-red-500/20 hover:text-red-300 transition-colors flex items-center justify-center"
                                            >
                                                −
                                            </button>
                                            <span className="font-mono text-sm w-5 text-center text-slate-200">
                                                {item.quantity}
                                            </span>
                                            <button
                                                type="button"
                                                onClick={() =>
                                                    cart.addItem({
                                                        id: item.id,
                                                        name: item.name,
                                                        price: item.price,
                                                        category: item.category,
                                                    })
                                                }
                                                className="size-6 rounded bg-white/10 text-slate-200 hover:bg-white/20 hover:text-white transition-colors flex items-center justify-center"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>

                                    <div className="flex justify-between items-center mt-2">
                                        {editingNoteId === item.id ? (
                                            <div className="flex gap-1.5 flex-1 mr-2">
                                                <input
                                                    autoFocus
                                                    value={noteInput}
                                                    onChange={(e) => setNoteInput(e.target.value)}
                                                    onKeyDown={(e) => {
                                                        if (e.key === 'Enter') handleNoteSubmit(item.id);
                                                        if (e.key === 'Escape') setEditingNoteId(null);
                                                    }}
                                                    placeholder="Level 3, tanpa es, nasi setengah…"
                                                    className="flex-1 bg-white/5 border border-white/10 rounded px-2 py-1 text-[11px] text-slate-200 outline-none focus:border-[var(--color-primary)]/40"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={() => handleNoteSubmit(item.id)}
                                                    className="text-[11px] text-emerald-400 hover:text-emerald-300 px-1 transition-colors"
                                                >
                                                    ✓
                                                </button>
                                            </div>
                                        ) : (
                                            <button
                                                type="button"
                                                onClick={() => {
                                                    setEditingNoteId(item.id);
                                                    setNoteInput(item.note);
                                                }}
                                                className="text-[11px] text-slate-500 hover:text-[var(--color-primary)] transition-colors flex items-center gap-1"
                                            >
                                                <FileTextIcon className="size-3" />
                                                {item.note ? 'Ubah catatan' : 'Catatan pesanan'}
                                            </button>
                                        )}
                                        <span className="font-mono text-sm text-slate-300 shrink-0">
                                            {formatRupiah(item.price * item.quantity)}
                                        </span>
                                    </div>
                                </div>
                            ))}
                        </div>

                        {/* Form Tambahan Item Manual / Menu Tambahan (cth. Kerupuk, Extra Sambal, dsb.) */}
                        <div className="mt-3 p-3 bg-white/[0.02] border border-white/5 rounded-xl space-y-2 shrink-0">
                            <p className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                ➕ Tambah Item Manual / Tambahan
                            </p>
                            <div className="flex gap-2">
                                <input
                                    type="text"
                                    placeholder="Nama item (cth. Kerupuk, Extra Sambal)"
                                    value={adHocName}
                                    onChange={(e) => setAdHocName(e.target.value)}
                                    className="flex-1 bg-white/5 border border-white/10 rounded px-2.5 py-1 text-xs text-slate-200 outline-none focus:border-[var(--color-primary)]/40"
                                />
                                <input
                                    type="number"
                                    placeholder="Harga (Rp)"
                                    value={adHocPrice}
                                    onChange={(e) => setAdHocPrice(e.target.value)}
                                    className="w-20 bg-white/5 border border-white/10 rounded px-2.5 py-1 text-xs text-slate-200 outline-none focus:border-[var(--color-primary)]/40 font-mono"
                                />
                                <button
                                    type="button"
                                    onClick={handleAddAdHoc}
                                    className="px-3 bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/100 text-white rounded text-xs font-bold transition-colors"
                                >
                                    Tambah
                                </button>
                            </div>
                        </div>

                        <div className="pt-4 border-t border-white/10 mt-4 space-y-3">
                            <div className="flex justify-between text-sm text-slate-400">
                                <span>Subtotal</span>
                                <span className="font-mono">{formatRupiah(cart.subtotal)}</span>
                            </div>
                            {cart.discountAmount > 0 && (
                                <div className="flex justify-between text-sm text-emerald-400">
                                    <span
                                        className="flex items-center gap-1 cursor-pointer hover:text-emerald-300"
                                        onClick={() => {
                                            setTempDiscountType(cart.discountType);
                                            setTempDiscountValue(cart.discountValue.toString());
                                            setIsDiscountModalOpen(true);
                                        }}
                                    >
                                        Diskon {cart.discountType === 'percentage' ? `(${cart.discountValue}%)` : ''}{' '}
                                        <PencilIcon className="size-3" />
                                    </span>
                                    <span className="font-mono">-{formatRupiah(cart.discountAmount)}</span>
                                </div>
                            )}
                        </div>

                        <div className="shrink-0 mt-3 pt-3 border-t border-white/5 space-y-2">
                            {cart.discountAmount === 0 && (
                                <div className="flex justify-between text-sm text-slate-400">
                                    <button
                                        type="button"
                                        onClick={() => setIsDiscountModalOpen(true)}
                                        className="text-[var(--color-primary)] hover:text-[var(--color-primary)] flex items-center gap-1 transition-colors"
                                    >
                                        <PercentIcon className="size-3" /> Tambah Diskon
                                    </button>
                                </div>
                            )}
                            <div className="flex justify-between text-sm text-slate-400">
                                <span>
                                    {TAX_LABELS[taxType as keyof typeof TAX_LABELS] ?? 'Pajak'} {taxRate}%
                                </span>
                                <span className="font-mono">{formatRupiah(pbjt)}</span>
                            </div>
                            {serviceCharge > 0 && (
                                <div className="flex justify-between text-sm text-slate-400">
                                    <span>Service Charge {serviceCharge}%</span>
                                    <span className="font-mono">{formatRupiah(svcCharge)}</span>
                                </div>
                            )}
                            <div className="flex justify-between text-base font-semibold pt-2 border-t border-white/5 text-white">
                                <span>Total Pembayaran</span>
                                <span className="font-mono">{formatRupiah(total)}</span>
                            </div>

                            <div className="space-y-2 pt-1">
                                <p className="text-xs font-medium text-slate-400">Metode Pembayaran</p>
                                <div className="grid grid-cols-3 gap-2">
                                    {paymentMethods.map(([key, label]) => (
                                        <button
                                            key={key}
                                            type="button"
                                            onClick={() => setSelectedPayment(key)}
                                            className={`rounded-lg py-2 px-2 text-[11px] font-medium text-center transition-colors border ${
                                                selectedPayment === key
                                                    ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] border-[var(--color-primary)]/40'
                                                    : 'bg-white/5 text-slate-400 border-white/5 hover:bg-white/10 hover:text-slate-200'
                                            }`}
                                        >
                                            {label}
                                        </button>
                                    ))}
                                </div>
                            </div>

                            <div className="space-y-2 pt-1">
                                <p className="text-xs font-medium text-slate-400">Notifikasi WA & Struk Digital</p>
                                <div className="flex gap-2">
                                    <input
                                        type="tel"
                                        placeholder="Nomor WA (contoh: 62812...)"
                                        value={waNumber}
                                        onChange={(e) => setWaNumber(e.target.value)}
                                        className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2 text-xs text-white focus:outline-none focus:border-emerald-500 transition-colors"
                                    />
                                </div>
                            </div>

                            <div className="flex gap-2 mt-2 sticky bottom-0 bg-[#0c0c0e] pt-2 -mx-4 px-4 pb-1">
                                <button
                                    type="button"
                                    onClick={() => setIsSplitBillModalOpen(true)}
                                    disabled={cart.itemCount === 0 || isSendingWa || waSent}
                                    className="w-1/3 rounded-xl bg-white/5 hover:bg-white/10 border border-white/10 hover:-translate-y-0.5 hover:shadow-md active:scale-95 transition-all duration-300 ease-out py-3 font-medium text-sm text-slate-200 disabled:opacity-40 disabled:hover:translate-y-0 disabled:hover:shadow-none"
                                >
                                    Split Bill
                                </button>
                                <button
                                    type="button"
                                    disabled={cart.itemCount === 0 || isSendingWa || waSent}
                                    onClick={handleCheckout}
                                    className={`w-2/3 rounded-xl hover:-translate-y-0.5 active:scale-95 transition-all duration-300 ease-out py-3 font-medium text-sm disabled:opacity-40 disabled:hover:translate-y-0 flex items-center justify-center gap-2 ${
                                        waSent
                                            ? 'bg-emerald-500 text-white shadow-[0_0_20px_rgba(16,185,129,0.4)]'
                                            : isNanoBanana
                                              ? 'bg-gradient-to-r from-yellow-400 via-amber-500 to-yellow-500 text-slate-950 font-extrabold shadow-[0_0_25px_rgba(234,179,8,0.4)] hover:shadow-[0_0_35px_rgba(234,179,8,0.6)]'
                                              : 'bg-slate-100 hover:bg-white text-slate-900 hover:shadow-[0_8px_30px_rgb(0,0,0,0.15)]'
                                    }`}
                                >
                                    {isSendingWa && (
                                        <span className="animate-spin size-4 border-2 border-current border-t-transparent rounded-full" />
                                    )}
                                    {waSent
                                        ? 'Pesanan & WA Terkirim!'
                                        : cart.itemCount > 0
                                          ? `Bayar · ${formatRupiah(total)}`
                                          : 'Pembayaran'}
                                </button>
                            </div>
                        </div>
                    </Glass>
                </div>

                {/* Modals for Discount and Split Bill */}
                {isDiscountModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <Glass className="p-5 max-w-sm w-full">
                            <div className="flex justify-between items-center mb-4">
                                <h3 className="text-sm font-medium text-white">Atur Diskon</h3>
                                <button
                                    onClick={() => setIsDiscountModalOpen(false)}
                                    className="text-slate-400 hover:text-white"
                                >
                                    <XCircleIcon className="size-4" />
                                </button>
                            </div>
                            <div className="flex gap-2 mb-4">
                                <button
                                    onClick={() => setTempDiscountType('percentage')}
                                    className={`flex-1 py-2 text-xs font-medium rounded-lg border ${tempDiscountType === 'percentage' ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] border-[var(--color-primary)]/40' : 'bg-white/5 text-slate-400 border-white/10'}`}
                                >
                                    Persentase (%)
                                </button>
                                <button
                                    onClick={() => setTempDiscountType('nominal')}
                                    className={`flex-1 py-2 text-xs font-medium rounded-lg border ${tempDiscountType === 'nominal' ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] border-[var(--color-primary)]/40' : 'bg-white/5 text-slate-400 border-white/10'}`}
                                >
                                    Nominal (Rp)
                                </button>
                            </div>
                            {tempDiscountType !== 'none' && (
                                <input
                                    type="number"
                                    value={tempDiscountValue}
                                    onChange={(e) => setTempDiscountValue(e.target.value)}
                                    placeholder={tempDiscountType === 'percentage' ? 'Contoh: 10' : 'Contoh: 15000'}
                                    className="w-full bg-slate-900 border border-white/20 rounded-lg px-3 py-2 text-sm text-white mb-4 outline-none focus:border-[var(--color-primary)]"
                                />
                            )}
                            <div className="flex gap-2">
                                <button
                                    onClick={() => {
                                        cart.setDiscount('none', 0);
                                        setIsDiscountModalOpen(false);
                                    }}
                                    className="flex-1 rounded-lg py-2 text-xs font-medium bg-red-500/10 text-red-400 hover:bg-red-500/20 transition-colors"
                                >
                                    Hapus Diskon
                                </button>
                                <button
                                    onClick={() => {
                                        cart.setDiscount(tempDiscountType, Number(tempDiscountValue));
                                        setIsDiscountModalOpen(false);
                                    }}
                                    className="flex-1 rounded-lg py-2 text-xs font-medium bg-[var(--color-primary)] hover:bg-[var(--color-primary)]/100 text-white transition-colors"
                                >
                                    Terapkan
                                </button>
                            </div>
                        </Glass>
                    </div>
                )}

                {isSplitBillModalOpen && (
                    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm p-4">
                        <Glass className="p-6 max-w-md w-full max-h-[90vh] flex flex-col">
                            <div className="flex justify-between items-center mb-4 shrink-0">
                                <h3 className="text-base font-medium text-white">Split Bill</h3>
                                <button
                                    onClick={() => setIsSplitBillModalOpen(false)}
                                    className="text-slate-400 hover:text-white"
                                >
                                    <XCircleIcon className="size-5" />
                                </button>
                            </div>

                            <div className="flex gap-2 mb-4 shrink-0">
                                <button
                                    onClick={() => setSplitMode('evenly')}
                                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${splitMode === 'evenly' ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] border-[var(--color-primary)]/40' : 'bg-white/5 text-slate-400 border-white/10'}`}
                                >
                                    Bagi Rata
                                </button>
                                <button
                                    onClick={() => setSplitMode('per_item')}
                                    className={`flex-1 py-2 text-xs font-medium rounded-lg border transition-colors ${splitMode === 'per_item' ? 'bg-[var(--color-primary)]/20 text-[var(--color-primary)] border-[var(--color-primary)]/40' : 'bg-white/5 text-slate-400 border-white/10'}`}
                                >
                                    Pilih Item
                                </button>
                            </div>

                            {splitMode === 'evenly' ? (
                                <div className="mb-4 space-y-4">
                                    <div className="flex justify-between items-center bg-white/5 rounded-lg p-3 border border-white/10">
                                        <span className="text-sm text-slate-300">Total Tagihan</span>
                                        <span className="font-mono text-lg font-semibold text-white">
                                            {formatRupiah(total)}
                                        </span>
                                    </div>
                                    <div>
                                        <label className="text-xs font-medium text-slate-400 block mb-2">
                                            Dibagi Berapa Orang?
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <button
                                                onClick={() =>
                                                    setSplitCount((prev) => Math.max(2, parseInt(prev) - 1).toString())
                                                }
                                                className="size-10 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 flex items-center justify-center border border-white/10"
                                            >
                                                -
                                            </button>
                                            <input
                                                type="number"
                                                value={splitCount}
                                                onChange={(e) => setSplitCount(e.target.value)}
                                                className="w-16 h-10 text-center bg-transparent border border-white/20 rounded-lg text-white font-mono text-lg outline-none focus:border-[var(--color-primary)]"
                                                min="2"
                                                max="20"
                                            />
                                            <button
                                                onClick={() => setSplitCount((prev) => (parseInt(prev) + 1).toString())}
                                                className="size-10 rounded-lg bg-white/5 text-slate-300 hover:bg-white/10 flex items-center justify-center border border-white/10"
                                            >
                                                +
                                            </button>
                                        </div>
                                    </div>
                                    <div className="flex justify-between items-center bg-[var(--color-primary)]/10 rounded-lg p-3 border border-[var(--color-primary)]/20">
                                        <span className="text-sm text-[var(--color-primary)]">Per Orang Membayar</span>
                                        <span className="font-mono text-xl font-bold text-[var(--color-primary)]">
                                            {formatRupiah(Math.ceil(total / parseInt(splitCount || '1')))}
                                        </span>
                                    </div>
                                </div>
                            ) : (
                                <div className="flex flex-col flex-1 min-h-0">
                                    <div className="flex-1 overflow-y-auto space-y-2 pr-1 min-h-0 mb-4">
                                        {cart.items.map((item) => {
                                            const selectedQty = splitSelectedItems[item.id] || 0;
                                            return (
                                                <div
                                                    key={item.id}
                                                    className="flex justify-between items-center bg-white/5 rounded-lg p-3 border border-white/10"
                                                >
                                                    <div className="min-w-0 flex-1">
                                                        <p className="text-sm font-medium text-slate-200 truncate">
                                                            {item.name}
                                                        </p>
                                                        <p className="text-xs text-slate-400 mt-0.5">
                                                            {formatRupiah(item.price)}
                                                        </p>
                                                    </div>
                                                    <div className="flex items-center gap-2 ml-3">
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setSplitSelectedItems((prev) => ({
                                                                    ...prev,
                                                                    [item.id]: Math.max(0, selectedQty - 1),
                                                                }))
                                                            }
                                                            className="size-7 rounded bg-white/5 text-slate-300 hover:bg-white/10 flex items-center justify-center border border-white/10"
                                                        >
                                                            -
                                                        </button>
                                                        <span className="font-mono text-sm w-4 text-center text-slate-200">
                                                            {selectedQty}
                                                        </span>
                                                        <button
                                                            type="button"
                                                            onClick={() =>
                                                                setSplitSelectedItems((prev) => ({
                                                                    ...prev,
                                                                    [item.id]: Math.min(item.quantity, selectedQty + 1),
                                                                }))
                                                            }
                                                            className="size-7 rounded bg-white/10 text-slate-200 hover:bg-white/20 flex items-center justify-center border border-white/10"
                                                        >
                                                            +
                                                        </button>
                                                    </div>
                                                </div>
                                            );
                                        })}
                                        {cart.items.length === 0 && (
                                            <p className="text-sm text-slate-500 text-center py-4">Keranjang kosong</p>
                                        )}
                                    </div>

                                    <div className="bg-[var(--color-primary)]/10 rounded-lg p-3 border border-[var(--color-primary)]/20 shrink-0 space-y-2">
                                        <div className="flex justify-between text-xs text-[var(--color-primary)]/70">
                                            <span>Subtotal Terpilih</span>
                                            <span className="font-mono">{formatRupiah(subBillSubtotal)}</span>
                                        </div>
                                        {subBillDiscount > 0 && (
                                            <div className="flex justify-between text-xs text-emerald-400/80">
                                                <span>Diskon (Proporsional)</span>
                                                <span className="font-mono">-{formatRupiah(subBillDiscount)}</span>
                                            </div>
                                        )}
                                        <div className="flex justify-between text-xs text-[var(--color-primary)]/70">
                                            <span>PBJT (10%)</span>
                                            <span className="font-mono">{formatRupiah(subBillPbjt)}</span>
                                        </div>
                                        <div className="flex justify-between items-center pt-2 border-t border-[var(--color-primary)]/20">
                                            <span className="text-sm font-medium text-[var(--color-primary)]">
                                                Total Tagihan Parsial
                                            </span>
                                            <span className="font-mono text-xl font-bold text-[var(--color-primary)]">
                                                {formatRupiah(subBillTotal)}
                                            </span>
                                        </div>
                                    </div>
                                </div>
                            )}

                            <div className="flex gap-2 mt-2 shrink-0">
                                <button
                                    onClick={() => setIsSplitBillModalOpen(false)}
                                    className="flex-1 rounded-lg py-3 text-sm font-medium bg-white/5 hover:bg-white/10 text-slate-300 transition-colors"
                                >
                                    Tutup
                                </button>
                                {splitMode === 'per_item' && subBillTotal > 0 && (
                                    <button
                                        onClick={handlePayPartial}
                                        className="flex-1 rounded-lg py-3 text-sm font-medium bg-emerald-600 hover:bg-emerald-500 text-white transition-colors"
                                    >
                                        Bayar & Kurangi
                                    </button>
                                )}
                            </div>
                        </Glass>
                    </div>
                )}

                <ReceiptPreview
                    isOpen={isReceiptModalOpen}
                    onClose={handleCloseReceipt}
                    orderData={{
                        orderId: 'TRX-' + Math.floor(Math.random() * 1000000000),
                        cashierName: 'Maya Indah',
                        table: '5',
                        date: new Date().toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' }),
                        items: cart.items.map((item) => ({
                            id: item.id,
                            name: item.name,
                            qty: item.quantity,
                            price: item.price,
                            note: item.note,
                        })),
                        subtotal: cart.subtotalAfterDiscount,
                        tax: pbjt,
                        total: total,
                        paymentMethod: selectedPayment,
                    }}
                />
            </Screen>
        </MainLayout>
    );
}

// --- Role Guard Wrapper -------------------------------------------------------
export default function POS() {
    return (
        <RoleGuard
            allowedRoles={['kasir', 'manager', 'owner']}
            pageName="POS Kasir"
            allowedRoleLabel="Kasir, Manager, Owner"
        >
            <POSInner />
        </RoleGuard>
    );
}
