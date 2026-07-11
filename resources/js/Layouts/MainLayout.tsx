import { useState, useEffect, type ReactNode, type ElementType } from 'react';
import { Link, usePage } from '@inertiajs/react';
import {
    Store,
    Package,
    Boxes,
    BriefcaseBusiness,
    BarChart3,
    Settings,
    Smartphone,
    Menu,
    ChevronDown,
    ChevronRight,
    Lock,
    ArrowLeft,
} from 'lucide-react';
import { useTenantSettings, TenantBrandLockup } from '../Components/Shared';
import GeminiCopilotWidget from '../Components/POS/GeminiCopilotWidget';
import { useSubscription } from '../Hooks/useSubscription';
import type { SharedProps } from '../Types';

// --- Role Types ---
type Role = 'kasir' | 'kitchen' | 'waiter' | 'manager' | 'owner';

// --- Navigation ---
type NavItem = { name: string; href: string; phase: 1 | 2 | 3; roles: Role[] };
type NavGroup = { title: string; Icon: ElementType; roles: Role[]; items: NavItem[] };

const nav: NavGroup[] = [
    {
        title: 'Utama',
        Icon: Store,
        roles: ['kasir', 'kitchen', 'waiter', 'manager', 'owner'],
        items: [
            { name: 'Dashboard', href: '/dashboard', phase: 1, roles: ['kasir', 'waiter', 'manager', 'owner'] },
            { name: 'Kasir (POS)', href: '/pos', phase: 1, roles: ['kasir', 'manager', 'owner'] },
            {
                name: 'Monitor Pesanan',
                href: '/monitor-pesanan',
                phase: 1,
                roles: ['kasir', 'waiter', 'manager', 'owner'],
            },
            { name: 'Monitor Reservasi', href: '/monitor-reservasi', phase: 1, roles: ['kasir', 'manager', 'owner'] },
            { name: 'Dapur (KDS)', href: '/kds', phase: 1, roles: ['kitchen', 'waiter', 'manager', 'owner'] },
            { name: 'Refund & Void', href: '/refund-void', phase: 2, roles: ['manager', 'owner'] },
        ],
    },
    {
        title: 'Manajemen',
        Icon: Package,
        roles: ['kasir', 'waiter', 'manager', 'owner'],
        items: [
            { name: 'Produk & Menu', href: '/produk', phase: 1, roles: ['manager', 'owner'] },
            { name: 'Katalog Menu', href: '/katalog-menu', phase: 1, roles: ['kasir', 'waiter', 'manager', 'owner'] },
            { name: 'Buku Menu Digital', href: '/buku-menu-digital', phase: 2, roles: ['manager', 'owner'] },
            {
                name: 'Manajemen Meja',
                href: '/manajemen-meja',
                phase: 1,
                roles: ['kasir', 'waiter', 'manager', 'owner'],
            },
        ],
    },
    {
        title: 'Inventaris',
        Icon: Boxes,
        roles: ['manager', 'owner'],
        items: [
            { name: 'Stok (Bahan Baku)', href: '/inventory', phase: 2, roles: ['manager', 'owner'] },
            { name: 'Supplier', href: '/pembelian-vendor', phase: 2, roles: ['manager', 'owner'] },
            { name: 'Stock Opname', href: '/stok-opname', phase: 2, roles: ['manager', 'owner'] },
            { name: 'Dasbor Stok', href: '/dashboard-inventory', phase: 2, roles: ['manager', 'owner'] },
        ],
    },
    {
        title: 'Operasional',
        Icon: BriefcaseBusiness,
        roles: ['kasir', 'manager', 'owner'],
        items: [
            { name: 'Shift Kerja', href: '/staf-shift', phase: 2, roles: ['manager', 'owner'] },
            { name: 'Sesi Kasir', href: '/cashier-session', phase: 2, roles: ['kasir', 'manager', 'owner'] },
        ],
    },
    {
        title: 'Laporan',
        Icon: BarChart3,
        roles: ['manager', 'owner'],
        items: [
            { name: 'Laporan Penjualan', href: '/laporan-penjualan', phase: 1, roles: ['manager', 'owner'] },
            { name: 'Perbandingan Outlet', href: '/perbandingan-outlet', phase: 2, roles: ['owner'] },
            { name: 'Arus Kas', href: '/arus-kas', phase: 2, roles: ['owner'] },
        ],
    },
    {
        title: 'Pengaturan',
        Icon: Settings,
        roles: ['manager', 'owner'],
        items: [
            { name: 'Pengaturan Outlet', href: '/pengaturan-outlet', phase: 1, roles: ['manager', 'owner'] },
            { name: 'Diskon & Pajak', href: '/diskon-pajak', phase: 1, roles: ['manager', 'owner'] },
            { name: 'QR Code Meja', href: '/qrcode-meja', phase: 1, roles: ['manager', 'owner'] },
            { name: 'Printer Config', href: '/printer-config', phase: 1, roles: ['manager', 'owner'] },
            { name: 'Antrean Cetak', href: '/print-job-monitor', phase: 2, roles: ['manager', 'owner'] },
            { name: 'Pengaturan TTS', href: '/tts-settings', phase: 1, roles: ['manager', 'owner'] },
            { name: 'WhatsApp API integration', href: '/whatsapp-integration', phase: 1, roles: ['manager', 'owner'] },
        ],
    },
    {
        title: 'Owner View',
        Icon: Smartphone,
        roles: ['owner'],
        items: [
            { name: 'Data Karyawan', href: '/owner/employees', phase: 1, roles: ['owner'] },
            { name: 'Peringatan Stok', href: '/owner/inventory/alerts', phase: 1, roles: ['owner'] },
            { name: 'Google Review & Complaint', href: '/owner/google-reviews', phase: 1, roles: ['owner'] },
            { name: 'Pengaturan Owner', href: '/owner/settings', phase: 1, roles: ['owner'] },
        ],
    },
];

const ROLE_LABEL: Record<string, string> = {
    kasir: 'Kasir',
    kitchen: 'Kitchen Staff',
    waiter: 'Waiter / Bar',
    manager: 'Manager',
    owner: 'Owner',
};

const ROLE_BADGE: Record<string, string> = {
    kasir: 'bg-blue-500/15    text-blue-400    border border-blue-500/20',
    kitchen: 'bg-red-500/15     text-red-400     border border-red-500/20',
    waiter: 'bg-emerald-500/15 text-emerald-400  border border-emerald-500/20',
    manager: 'bg-amber-500/15   text-amber-400   border border-amber-500/20',
    owner: 'bg-purple-500/15  text-purple-400  border border-purple-500/20',
};

const ROLE_AVATAR: Record<string, string> = {
    kasir: 'bg-blue-600/30    text-blue-300    ring-1 ring-blue-500/40',
    kitchen: 'bg-red-600/30     text-red-300     ring-1 ring-red-500/40',
    waiter: 'bg-emerald-600/30 text-emerald-300  ring-1 ring-emerald-500/40',
    manager: 'bg-amber-600/30   text-amber-300   ring-1 ring-amber-500/40',
    owner: 'bg-purple-600/30  text-purple-300  ring-1 ring-purple-500/40',
};

function Sidebar({ isCollapsed, setIsCollapsed }: { isCollapsed: boolean; setIsCollapsed: (v: boolean) => void }) {
    const [open, setOpen] = useState(['Utama']);
    const { screenMode } = useTenantSettings();
    const { isLocked: checkLocked, featureLocks } = useSubscription();
    const { outlet, auth } = usePage<SharedProps>().props;
    const user = auth?.user;
    const outletName = outlet?.name ?? 'Pawon Salam';

    const isLight = screenMode === 'terang';
    const isGlass = screenMode === 'glassmorphic';
    const isNanoBanana = screenMode === 'nano-banana';

    const asideBg = isLight
        ? 'bg-white border-r border-slate-200 text-slate-800 shadow-sm'
        : isNanoBanana
          ? 'bg-[#030712]/95 backdrop-blur-3xl border-r border-amber-500/20 shadow-[0_0_50px_0_rgba(234,179,8,0.1)] text-slate-100'
          : isGlass
            ? 'bg-slate-950/60 backdrop-blur-3xl border-r border-white/10 shadow-[0_0_50px_0_rgba(0,0,0,0.5)]'
            : 'bg-[#030303] border-r border-white/5';
    const [activeKaryawan, setActiveKaryawan] = useState<{ name: string; role: string } | null>(null);
    const [pendingReservationsCount, setPendingReservationsCount] = useState(0);

    useEffect(() => {
        const raw = localStorage.getItem('activeKaryawan');
        if (raw) {
            try {
                setActiveKaryawan(JSON.parse(raw));
            } catch {
                /* ignore */
            }
        }
    }, []);

    useEffect(() => {
        // Fetch pending reservations for notifications badge
        const fetchReservations = async () => {
            try {
                const res = await fetch('/api/reservations');
                if (res.ok) {
                    const data = await res.json();
                    const pending = data.filter(
                        (r: any) => r.status === 'Menunggu Konfirmasi' || r.status === 'pending',
                    );
                    setPendingReservationsCount(pending.length);
                }
            } catch (err) {
                console.error('Failed to fetch reservations for badge', err);
            }
        };

        fetchReservations();
        const interval = setInterval(fetchReservations, 15000); // 15 seconds poll for high awareness
        return () => clearInterval(interval);
    }, []);

    const activeRole = (user?.role === 'owner' ? 'owner' : (activeKaryawan?.role ?? user?.role ?? 'kasir')) as Role;

    // Filter: render only what the active role is authorised to see
    const visibleNav = nav
        .map((group) => ({ ...group, items: group.items.filter((i) => i.roles.includes(activeRole)) }))
        .filter((group) => group.roles.includes(activeRole) && group.items.length > 0);

    return (
        <aside
            className={`flex h-full shrink-0 flex-col p-4 transition-all duration-500 relative ${asideBg} ${isCollapsed ? 'w-[80px]' : 'w-64'}`}
        >
            {/* Brand */}
            <div className={`mb-6 flex items-center ${isCollapsed ? 'justify-center' : 'justify-start gap-2'}`}>
                <TenantBrandLockup collapsed={isCollapsed} />
            </div>

            {/* Role-filtered nav */}
            <nav className="flex-1 space-y-1 overflow-x-hidden overflow-y-auto pr-1">
                {visibleNav.map(({ title, Icon, items }) => (
                    <div key={title} className="mb-2">
                        <button
                            type="button"
                            onClick={() => {
                                if (isCollapsed) setIsCollapsed(false);
                                setOpen((o) => (o.includes(title) ? o.filter((x) => x !== title) : [...o, title]));
                            }}
                            className={`flex w-full items-center ${isCollapsed ? 'justify-center' : 'justify-between'} rounded-xl px-3 py-2.5 text-sm text-slate-400 hover:text-slate-200 hover:bg-white/[0.03] transition-all duration-300 ease-out`}
                        >
                            <span className="flex items-center gap-2.5 relative">
                                <Icon className="size-4 shrink-0" />
                                {!isCollapsed && <span className="font-medium">{title}</span>}
                                {/* Collapsed Group red notification dot */}
                                {isCollapsed && title === 'Utama' && pendingReservationsCount > 0 && (
                                    <span className="absolute -top-1 -right-1 size-2 rounded-full bg-rose-500 ring-2 ring-[#030303] animate-pulse" />
                                )}
                            </span>
                            {!isCollapsed &&
                                (open.includes(title) ? (
                                    <ChevronDown className="size-3 opacity-50" />
                                ) : (
                                    <ChevronRight className="size-3 opacity-50" />
                                ))}
                        </button>
                        {!isCollapsed && open.includes(title) && (
                            <div className="mt-1 space-y-0.5 pl-3 border-l border-white/5 ml-4">
                                {items.map((i) => {
                                    const lock = featureLocks[i.name];
                                    const isLocked = lock ? checkLocked(lock.feature) : false;
                                    return (
                                        <Link
                                            key={i.name}
                                            href={i.href}
                                            className={`w-full text-left rounded-lg px-3 py-2 text-[13px] transition-all duration-300 ease-out flex items-center justify-between gap-2 ${
                                                isNanoBanana
                                                    ? 'text-slate-400 hover:text-amber-300 hover:bg-amber-500/[0.08] hover:translate-x-1 hover:border-l-2 hover:border-amber-400'
                                                    : 'text-slate-500 hover:text-slate-300 hover:translate-x-1'
                                            }`}
                                        >
                                            <span className="truncate flex items-center gap-2">
                                                {i.name}
                                                {i.name === 'Monitor Reservasi' && pendingReservationsCount > 0 && (
                                                    <span className="inline-flex size-4.5 items-center justify-center rounded-full bg-rose-500/15 text-rose-400 text-[10px] font-bold border border-rose-500/30 px-1.5 animate-pulse">
                                                        {pendingReservationsCount}
                                                    </span>
                                                )}
                                            </span>
                                            {isLocked && <Lock className="size-3 text-slate-600 shrink-0" />}
                                        </Link>
                                    );
                                })}
                            </div>
                        )}
                    </div>
                ))}
            </nav>

            {/* Restoku Co-Pilot AI Widget in Bottom Sidebar */}
            <GeminiCopilotWidget placement="sidebar" isCollapsed={isCollapsed} />

            {/* Active Staff Profile Card */}
            {(() => {
                const isOwnerSession = user?.role === 'owner';
                const rawName = isOwnerSession ? (user?.name ?? 'Owner') : (activeKaryawan?.name ?? '');
                const roleLabel = ROLE_LABEL[activeRole] ?? 'Kasir';
                // Detect stale session where name was set to the role string itself
                const nameIsRole =
                    rawName.toLowerCase() === activeRole || rawName.toLowerCase() === roleLabel.toLowerCase();
                // If real name exists and differs from role → show "BUDI HARTONO [KASIR]"
                // If stale / no real name → show just "[KASIR]" badge, no name text
                const displayName = nameIsRole ? '' : rawName;

                return (
                    <div
                        className={`mt-4 rounded-xl border p-2.5 flex items-center ${isNanoBanana ? 'border-amber-500/30 bg-amber-500/[0.04] shadow-[0_0_20px_rgba(234,179,8,0.1)]' : 'border-white/5 bg-white/[0.02]'} ${isCollapsed ? 'flex-col justify-center gap-2' : 'justify-between gap-2'}`}
                    >
                        <div className="flex items-center gap-2.5 min-w-0 flex-1">
                            {/* Role-colored avatar */}
                            <div
                                className={`grid size-8 shrink-0 place-items-center rounded-full font-bold text-xs uppercase ${ROLE_AVATAR[activeRole] ?? ROLE_AVATAR.kasir}`}
                            >
                                {displayName ? displayName.charAt(0) : roleLabel.charAt(0)}
                            </div>
                            {!isCollapsed && (
                                <div className="min-w-0 flex-1 flex items-center gap-1.5">
                                    {displayName && (
                                        <span
                                            className="text-[11px] font-semibold text-slate-200 truncate leading-none"
                                            title={displayName}
                                        >
                                            {displayName}
                                        </span>
                                    )}
                                    <span
                                        className={`shrink-0 text-[9px] font-bold px-1.5 py-0.5 rounded-full tracking-wider uppercase leading-none ${ROLE_BADGE[activeRole] ?? ROLE_BADGE.kasir}`}
                                    >
                                        {roleLabel}
                                    </span>
                                </div>
                            )}
                        </div>
                        <Link
                            href="/"
                            className="shrink-0 p-1.5 text-slate-500 hover:text-white hover:bg-white/10 rounded-lg transition-colors"
                            title="Kembali ke Website"
                        >
                            <ArrowLeft className="size-4" />
                        </Link>
                    </div>
                );
            })()}
        </aside>
    );
}

export default function MainLayout({ children, noScroll = false }: { children: ReactNode; noScroll?: boolean }) {
    const [isCollapsed, setIsCollapsed] = useState(false);
    const { screenMode } = useTenantSettings();

    const isLight = screenMode === 'terang';
    const isKrem = screenMode === 'krem';
    const isGlass = screenMode === 'glassmorphic';
    const isNanoBanana = screenMode === 'nano-banana';

    const rootBgClass = isLight
        ? 'bg-slate-50 text-slate-900 selection:bg-blue-500/20'
        : isKrem
          ? 'bg-[linear-gradient(90deg,#fff3e0_0%,#ffe6c0_50%,#ffd99f_100%)] text-slate-900 selection:bg-amber-500/20'
          : isNanoBanana
            ? 'bg-[#030712] text-slate-100 selection:bg-amber-500/30'
            : isGlass
              ? 'bg-gradient-to-br from-[#020617] via-[#0b1329] to-[#030712] text-slate-100 selection:bg-cyan-500/30'
              : 'bg-[#030303] text-slate-200 selection:bg-white/20';

    return (
        <div
            className={`flex h-screen w-full overflow-hidden font-sans transition-all duration-500 ${isLight ? 'light' : 'dark'} ${rootBgClass}`}
        >
            <Sidebar isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
            <main
                className={`flex-1 ${noScroll ? 'overflow-hidden p-4 md:p-5 flex flex-col min-h-0' : 'overflow-y-auto p-6 md:p-8'} relative`}
            >
                {/* Floating burger toggle — permanent di top-left main content */}
                <button
                    onClick={() => setIsCollapsed(!isCollapsed)}
                    className="absolute top-3 left-3 z-30 rounded-lg border border-white/10 bg-white/5 p-2 text-slate-400 hover:bg-white/10 hover:text-white transition-all shadow-sm"
                    title={isCollapsed ? 'Buka sidebar' : 'Tutup sidebar'}
                >
                    <Menu className="size-4" />
                </button>
                {isNanoBanana ? (
                    <>
                        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-amber-500/15 rounded-full blur-[140px] pointer-events-none animate-pulse" />
                        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-yellow-500/10 rounded-full blur-[140px] pointer-events-none" />
                        <div className="absolute -bottom-40 left-1/4 w-[600px] h-[600px] bg-amber-600/15 rounded-full blur-[140px] pointer-events-none animate-pulse" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(234,179,8,0.08),transparent_70%)] pointer-events-none" />
                    </>
                ) : isGlass ? (
                    <>
                        <div className="absolute -top-40 -left-40 w-[600px] h-[600px] bg-cyan-500/15 rounded-full blur-[140px] pointer-events-none animate-pulse" />
                        <div className="absolute top-1/3 -right-40 w-[600px] h-[600px] bg-purple-500/15 rounded-full blur-[140px] pointer-events-none" />
                        <div className="absolute -bottom-40 left-1/4 w-[600px] h-[600px] bg-emerald-500/15 rounded-full blur-[140px] pointer-events-none animate-pulse" />
                        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(6,182,212,0.08),transparent_70%)] pointer-events-none" />
                    </>
                ) : isLight ? (
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(59,130,246,0.08),transparent_70%)] pointer-events-none" />
                ) : (
                    <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_top_right,rgba(255,255,255,0.04),transparent_60%)] pointer-events-none" />
                )}
                <div
                    className={`relative z-10 ${noScroll ? 'flex-1 min-h-0 flex flex-col w-full h-full overflow-hidden' : ''}`}
                >
                    {children}
                </div>
            </main>
        </div>
    );
}
