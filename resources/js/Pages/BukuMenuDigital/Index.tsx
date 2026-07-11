import { useState, useMemo, ElementType } from 'react';
import { Head, usePage } from '@inertiajs/react';
import { useSubscription } from '../../Hooks/useSubscription';
import MainLayout from '../../Layouts/MainLayout';
import { Screen, Glass, Badge, formatRupiah, toneMap, cardToneMap, PlanBadge } from '../../Components/Shared';
import {
    DollarSign,
    Utensils,
    Package,
    Users,
    Search,
    Clock3,
    CheckCheck,
    Plus,
    SlidersHorizontal,
    ArrowDownToLine,
    Smartphone,
    QrCode,
    UserPlus,
    FileText,
    ChevronRight,
    Calculator,
    AlertTriangle,
    MessageSquare,
    TicketPercent,
    CheckCircle2,
    RefreshCcw,
    Download,
    DownloadCloud,
    Volume2,
    Link2,
    Copy,
    LayoutTemplate,
    Palette,
    Image as ImageIcon,
    MessageCircle,
    Upload,
    Printer,
} from 'lucide-react';
import { ProductImage } from '../../Components/ProductImage';
import { RoleGuard } from '../../Components/RoleGuard';
import { QRCodeSVG } from 'qrcode.react';
import { buildMenuUrl } from '../../lib/menuUrl';

type Outlet = { id: number; name: string; slug: string; is_active: boolean };

function BukuMenuDigitalInner() {
    const { props } = usePage();
    const outlets = (props.outlets as Outlet[]) ?? [];
    const activeOutletId = (props.outlet as Outlet | undefined)?.id;
    const [selectedOutletId, setSelectedOutletId] = useState<number>(activeOutletId ?? outlets[0]?.id ?? 0);
    // Label meja bebas owner (A1, 01, Meja 7, ...), 1 per baris.
    const [tableInput, setTableInput] = useState<string>('A1\nA2\nB1\nB2\nC1');
    const [copied, setCopied] = useState(false);

    const selectedOutlet = outlets.find((o) => o.id === selectedOutletId) ?? outlets[0];
    // Base URL untuk QR/link: env MENU_BASE_URL (dev/LAN/ngrok) → fallback origin browser.
    const baseUrl = (props.menu_base_url as string) || (typeof window !== 'undefined' ? window.location.origin : '');
    const menuUrl = selectedOutlet ? buildMenuUrl(baseUrl, selectedOutlet.slug) : '';

    const tables = useMemo(
        () =>
            tableInput
                .split('\n')
                .map((s) => s.trim())
                .filter(Boolean)
                .slice(0, 200),
        [tableInput],
    );

    const tableUrl = (label: string) => (selectedOutlet ? buildMenuUrl(baseUrl, selectedOutlet.slug, label) : '');

    const copyMenuLink = async () => {
        if (!menuUrl) return;
        try {
            await navigator.clipboard.writeText(menuUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* clipboard tidak tersedia */
        }
    };

    return (
        <MainLayout>
            <Head title="Buku Menu Digital (e-Menu)" />
            <Screen title="Buku Menu Digital (e-Menu)">
                <div className="grid grid-cols-[1fr_360px] gap-6 items-start">
                    <div className="space-y-5">
                        <Glass className="p-5">
                            <h2 className="text-base font-medium text-slate-200 mb-4 flex items-center gap-2">
                                <Link2 className="size-4 text-emerald-400" /> Tautan Menu Digital
                            </h2>
                            <div className="flex items-center gap-3">
                                <div className="flex-1 rounded-lg border border-white/10 bg-white/5 px-4 py-2.5 flex items-center justify-between">
                                    <span className="text-sm text-slate-300 break-all">
                                        {menuUrl || 'https://restoku.id/m/...'}
                                    </span>
                                    <button
                                        onClick={copyMenuLink}
                                        className="text-slate-400 hover:text-white transition-colors shrink-0 ml-2"
                                        title="Salin Tautan"
                                    >
                                        {copied ? (
                                            <CheckCircle2 className="size-4 text-emerald-400" />
                                        ) : (
                                            <Copy className="size-4" />
                                        )}
                                    </button>
                                </div>
                                <a
                                    href={menuUrl || '#'}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 px-4 py-2.5 text-sm font-medium hover:bg-emerald-500/20 transition-colors"
                                >
                                    Buka Preview
                                </a>
                            </div>
                            <div className="mt-5 grid grid-cols-2 gap-4">
                                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex items-center gap-4">
                                    <div className="size-10 rounded-lg bg-blue-500/10 border border-blue-500/20 flex items-center justify-center">
                                        <QrCode className="size-5 text-blue-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-200">QR Code Meja</p>
                                        <p className="text-xs text-slate-400 mt-0.5">
                                            {tables.length} meja siap dicetak
                                        </p>
                                    </div>
                                </div>
                                <div className="rounded-xl border border-white/5 bg-white/[0.02] p-4 flex items-center gap-4">
                                    <div className="size-10 rounded-lg bg-amber-500/10 border border-amber-500/20 flex items-center justify-center">
                                        <LayoutTemplate className="size-5 text-amber-400" />
                                    </div>
                                    <div>
                                        <p className="text-sm font-medium text-slate-200">Kategori Tampil</p>
                                        <p className="text-xs text-slate-400 mt-0.5">12 Kategori aktif</p>
                                    </div>
                                </div>
                            </div>
                        </Glass>

                        {/* QR Code Generator */}
                        <Glass className="p-5">
                            <div className="flex items-center justify-between mb-4">
                                <h2 className="text-base font-medium text-slate-200 flex items-center gap-2">
                                    <QrCode className="size-4 text-blue-400" /> Generator QR Code Meja
                                </h2>
                                <button
                                    onClick={() => window.print()}
                                    className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-xs font-medium text-slate-200 transition-colors flex items-center gap-2"
                                >
                                    <Printer className="size-3.5" /> Cetak Semua
                                </button>
                            </div>

                            {outlets.length === 0 ? (
                                <p className="text-sm text-amber-300">
                                    Belum ada outlet. Tambah outlet di Pengaturan Outlet terlebih dahulu.
                                </p>
                            ) : (
                                <>
                                    <div className="mb-4 max-w-xs">
                                        <label className="text-xs text-slate-400">Outlet</label>
                                        <select
                                            value={selectedOutletId}
                                            onChange={(e) => setSelectedOutletId(Number(e.target.value))}
                                            className="w-full mt-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
                                        >
                                            {outlets.map((o) => (
                                                <option key={o.id} value={o.id}>
                                                    {o.name}
                                                </option>
                                            ))}
                                        </select>
                                    </div>
                                    <label className="text-xs text-slate-400">
                                        Label meja (1 per baris, bebas: A1, 01, Meja 7)
                                    </label>
                                    <textarea
                                        value={tableInput}
                                        onChange={(e) => setTableInput(e.target.value)}
                                        rows={5}
                                        className="w-full mt-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 font-mono"
                                        placeholder={'A1\nA2\nB1'}
                                    />
                                    <div className="mt-4 grid grid-cols-3 gap-3">
                                        {tables.map((t) => (
                                            <div
                                                key={t}
                                                className="rounded-xl border border-white/5 bg-white/[0.02] p-3 flex flex-col items-center"
                                            >
                                                <div className="size-24 bg-white rounded-lg p-1.5">
                                                    <QRCodeSVG value={tableUrl(t)} size={84} level="M" />
                                                </div>
                                                <p className="text-xs font-semibold text-slate-300 mt-2">{t}</p>
                                            </div>
                                        ))}
                                    </div>
                                </>
                            )}
                        </Glass>

                        <Glass className="p-5">
                            <h2 className="text-base font-medium text-slate-200 mb-5 flex items-center gap-2">
                                <Palette className="size-4 text-blue-400" /> Kustomisasi Tampilan
                            </h2>
                            <div className="space-y-6">
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">
                                        Tema Warna Utama
                                    </label>
                                    <div className="flex gap-3">
                                        {[
                                            'bg-blue-500',
                                            'bg-emerald-500',
                                            'bg-red-500',
                                            'bg-amber-500',
                                            'bg-violet-500',
                                            'bg-slate-900',
                                        ].map((color, i) => (
                                            <button
                                                key={i}
                                                className={`size-8 rounded-full ${color} ${i === 0 ? 'ring-2 ring-white ring-offset-2 ring-offset-[#09090b]' : 'opacity-70 hover:opacity-100'} transition-all shadow-sm`}
                                            />
                                        ))}
                                    </div>
                                </div>
                                <div className="grid grid-cols-2 gap-5">
                                    {(
                                        [
                                            { label: 'Logo Restoran', hint: 'Upload (1:1)', Icon: ImageIcon },
                                            { label: 'Banner / Cover', hint: 'Upload (16:9)', Icon: Upload },
                                        ] as Array<{ label: string; hint: string; Icon: ElementType }>
                                    ).map(({ label, hint, Icon }) => (
                                        <div key={label}>
                                            <label className="block text-sm font-medium text-slate-400 mb-2">
                                                {label}
                                            </label>
                                            <div className="h-24 rounded-xl border border-dashed border-white/20 bg-white/5 hover:bg-white/10 transition-colors flex flex-col items-center justify-center cursor-pointer group">
                                                <Icon className="size-5 text-slate-400 group-hover:text-slate-300 mb-2" />
                                                <span className="text-xs text-slate-400">{hint}</span>
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div>
                                    <label className="block text-sm font-medium text-slate-400 mb-2">
                                        Pesan Sambutan
                                    </label>
                                    <textarea
                                        className="w-full h-20 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 outline-none focus:border-white/20 transition-colors resize-none"
                                        defaultValue="Selamat datang di Restoku Senopati. Silakan pesan langsung melalui e-menu ini."
                                    />
                                </div>
                            </div>
                            <div className="mt-6 pt-5 border-t border-white/5 flex justify-end">
                                <button className="rounded-lg bg-slate-100 hover:bg-white px-5 py-2.5 text-sm font-medium text-slate-900 transition-colors">
                                    Simpan Perubahan
                                </button>
                            </div>
                        </Glass>
                    </div>
                    <div className="flex justify-center sticky top-6">
                        <div className="relative w-[300px] h-[600px] rounded-[2.5rem] border-8 border-slate-900 bg-[#f8fafc] shadow-2xl overflow-hidden ring-1 ring-white/10">
                            <div className="absolute top-0 inset-x-0 h-6 flex justify-center z-20">
                                <div className="w-24 h-4 bg-slate-900 rounded-b-xl" />
                            </div>
                            <div className="h-32 bg-gradient-to-br from-slate-200 to-slate-300 relative">
                                <div className="absolute inset-0 bg-black/10" />
                                <div className="absolute -bottom-6 left-5 size-14 rounded-full bg-white p-1 shadow-md">
                                    <div className="size-full rounded-full bg-blue-500 flex items-center justify-center text-white font-bold">
                                        R
                                    </div>
                                </div>
                            </div>
                            <div className="pt-8 px-5 pb-4 bg-white shadow-sm relative z-10">
                                <h3 className="text-lg font-bold text-slate-900 tracking-tight">Restoku Senopati</h3>
                                <p className="text-xs text-slate-500 mt-1 leading-relaxed">
                                    Selamat datang di Restoku Senopati.
                                </p>
                            </div>
                            <div className="flex gap-2 overflow-x-auto px-5 py-3 border-b border-slate-100 bg-[#f8fafc]">
                                <div className="rounded-full bg-blue-500 px-3 py-1 text-[11px] font-medium text-white shadow-sm whitespace-nowrap">
                                    Makanan
                                </div>
                                <div className="rounded-full bg-white border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-600 whitespace-nowrap">
                                    Minuman
                                </div>
                                <div className="rounded-full bg-white border border-slate-200 px-3 py-1 text-[11px] font-medium text-slate-600 whitespace-nowrap">
                                    Pelengkap
                                </div>
                            </div>
                            <div className="p-4 space-y-3 bg-[#f8fafc] h-full overflow-y-auto pb-32">
                                {['Nasi Goreng Spesial', 'Ayam Geprek', 'Es Kopi Susu'].map((name, i) => (
                                    <div
                                        key={i}
                                        className="flex gap-3 bg-white p-3 rounded-xl shadow-sm border border-slate-100"
                                    >
                                        <div className="size-16 rounded-lg bg-slate-100 shrink-0" />
                                        <div className="flex-1 min-w-0 flex flex-col justify-center">
                                            <h4 className="text-sm font-semibold text-slate-900 truncate">{name}</h4>
                                            <p className="text-xs font-medium text-blue-600 mt-1">
                                                {formatRupiah([25000, 28000, 18000][i])}
                                            </p>
                                        </div>
                                        <div className="flex items-end">
                                            <button className="rounded-full bg-slate-50 size-7 flex items-center justify-center text-blue-600 font-medium shadow-sm border border-slate-100">
                                                +
                                            </button>
                                        </div>
                                    </div>
                                ))}
                            </div>
                            <div className="px-5 pb-24 z-20 relative bg-[#f8fafc]">
                                <div className="bg-white p-3 rounded-xl border border-slate-100 flex items-center justify-between shadow-sm">
                                    <div className="flex items-center gap-3">
                                        <div className="size-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                                            <MessageCircle className="size-4 text-emerald-500" />
                                        </div>
                                        <div>
                                            <p className="text-xs font-semibold text-slate-900">Kirim struk ke WA?</p>
                                            <p className="text-[10px] text-slate-500">Opt-in notifikasi & OTP</p>
                                        </div>
                                    </div>
                                    <div className="w-8 h-5 bg-emerald-500 rounded-full relative shadow-inner cursor-pointer">
                                        <div className="absolute right-0.5 top-0.5 size-4 bg-white rounded-full shadow-sm" />
                                    </div>
                                </div>
                            </div>
                            <div className="absolute bottom-5 inset-x-5 z-20">
                                <button className="w-full rounded-xl bg-blue-500 py-3.5 px-4 text-sm font-bold text-white shadow-lg shadow-blue-500/30 flex justify-between items-center">
                                    <span className="bg-white/20 px-2 py-0.5 rounded-md text-xs">2 Item</span>
                                    <span>Keranjang</span>
                                    <span>{formatRupiah(53000)}</span>
                                </button>
                            </div>
                        </div>
                    </div>
                </div>
            </Screen>
        </MainLayout>
    );
}

// --- Role Guard Wrapper -------------------------------------------------------
export default function BukuMenuDigital() {
    return (
        <RoleGuard allowedRoles={['manager', 'owner']} pageName="Buku Menu Digital" allowedRoleLabel="Manager, Owner">
            <BukuMenuDigitalInner />
        </RoleGuard>
    );
}
