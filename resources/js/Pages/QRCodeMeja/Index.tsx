import { useState, useMemo, useEffect, useRef } from 'react';
import { Head } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';

import MainLayout from '../../Layouts/MainLayout';
import { Screen, Glass } from '../../Components/Shared';
import { QrCodeIcon, DownloadIcon, PrinterIcon, MapPinIcon, StoreIcon, ExternalLinkIcon } from '../../Components/icons';

import { RoleGuard } from '../../Components/RoleGuard';
import { QRCodeSVG } from 'qrcode.react';
import { buildMenuUrl } from '../../lib/menuUrl';

type Outlet = { id: number; name: string; slug: string; is_active: boolean };

// ── SVG → PNG download (client-side, no dep) ────────────────────────────────
function downloadQrPng(label: string, svgEl: SVGSVGElement | null) {
    if (!svgEl) return;
    const xml = new XMLSerializer().serializeToString(svgEl);
    const svg64 = btoa(unescape(encodeURIComponent(xml)));
    const img = new Image();
    img.onload = () => {
        const size = 512;
        const canvas = document.createElement('canvas');
        canvas.width = size;
        canvas.height = size;
        const ctx = canvas.getContext('2d');
        if (!ctx) return;
        ctx.fillStyle = '#ffffff';
        ctx.fillRect(0, 0, size, size);
        ctx.drawImage(img, 0, 0, size, size);
        canvas.toBlob((blob) => {
            if (!blob) return;
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `qr-meja-${label}.png`;
            a.click();
            URL.revokeObjectURL(a.href);
        });
    };
    img.src = 'data:image/svg+xml;base64,' + svg64;
}

function QRCodeMejaInner() {
    const { props } = usePage();
    const outlets = (props.outlets as Outlet[]) ?? [];
    const [selectedOutletId, setSelectedOutletId] = useState<number>(outlets[0]?.id ?? 0);
    // Label meja bebas owner (A1, 01, Meja 7, ...), 1 per baris.
    const [tableInput, setTableInput] = useState<string>('A1\nA2\nB1\nB2\nC1');

    // Dropdown filter "Semua Meja" / per-meja (scroll-to + highlight)
    const [filter, setFilter] = useState<string>('all');
    const cardRefs = useRef<Record<string, HTMLDivElement | null>>({});

    const selectedOutlet = outlets.find((o) => o.id === selectedOutletId) ?? outlets[0];

    // Base URL untuk QR: env MENU_BASE_URL (dev/LAN/cloudflared) → fallback origin browser.
    const baseUrl = (props.menu_base_url as string) || (typeof window !== 'undefined' ? window.location.origin : '');

    const tables = useMemo(() => {
        return tableInput
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 200); // batas wajar per cetak
    }, [tableInput]);

    const tableUrl = (label: string) => (selectedOutlet ? buildMenuUrl(baseUrl, selectedOutlet.slug, label) : '');

    const visibleTables = useMemo(
        () => (filter === 'all' ? tables : tables.filter((t) => t === filter)),
        [filter, tables],
    );

    const onFilterChange = (val: string) => {
        setFilter(val);
        if (val !== 'all') {
            requestAnimationFrame(() => {
                cardRefs.current[val]?.scrollIntoView({ behavior: 'smooth', block: 'center' });
            });
        }
    };

    return (
        <MainLayout>
            <Head title="QR Code Meja" />

            {/* Print stylesheet: hanya .print-area yg tampil saat cetak */}
            <style>{`
                .print-area { display: none; }
                .print-card {
                    width: 320px; background: #fffdf8; border: 2px dashed #d9b25a; border-radius: 20px;
                    padding: 26px 22px; text-align: center; box-shadow: 0 8px 30px rgba(0,0,0,.06);
                    break-inside: avoid; page-break-inside: avoid; margin-bottom: 16px;
                }
                .print-grid { display: flex; flex-wrap: wrap; gap: 16px; }
                .print-card .pt { font-weight: 800; font-size: 18px; color: #1c1917; }
                .print-card .ps { font-size: 11px; letter-spacing: .18em; color: #a8a29e; text-transform: uppercase; margin-top: 2px; }
                .print-card .pqr { width: 180px; height: 180px; margin: 18px auto; background: #fff; border-radius: 14px; padding: 10px; box-shadow: 0 4px 14px rgba(0,0,0,.08); }
                .print-card .brand-badge {
                    width: 64px; height: 64px; border-radius: 50%; margin: 0 auto 10px;
                    background: radial-gradient(circle at 50% 40%, #FF7A4D, #C9431F);
                    color: #fff; font-weight: 800; font-size: 13px; display: flex; align-items: center; justify-content: center;
                }
                .print-card .lbl { font-size: 10px; letter-spacing: .2em; color: #a8a29e; text-transform: uppercase; margin-top: 6px; }
                .print-card .tnum { font-size: 22px; font-weight: 800; color: #1c1917; margin-top: 2px; }
                .print-card .scan { font-size: 11px; color: #a8a29e; margin-top: 14px; }
                @media print {
                    .app-shell { display: none !important; }
                    .print-area { display: block !important; }
                    @page { margin: 12mm; }
                    body { background: #fff !important; }
                }
            `}</style>

            <div className="app-shell">
                <Screen
                    title="Buku Menu Digital"
                    subtitle="QR Code untuk setiap meja — tamu scan langsung lihat menu &amp; pesan mandiri"
                >
                    {/* Top action bar */}
                    <div className="flex items-center justify-between gap-3 mb-5 flex-wrap">
                        <button
                            onClick={() => window.print()}
                            className="rounded-xl bg-[var(--color-primary)] hover:brightness-110 text-white px-5 py-2.5 text-sm font-bold tracking-wide flex items-center gap-2 transition-all"
                        >
                            <QrCodeIcon className="size-4" />
                            GENERATOR QR MEJA
                        </button>
                        <a
                            href="#"
                            onClick={(e) => e.preventDefault()}
                            className="rounded-xl border border-[var(--color-primary)]/30 text-[var(--color-primary)] px-5 py-2.5 text-sm font-semibold flex items-center gap-2 hover:bg-[var(--color-primary)]/10 transition-colors"
                        >
                            <MapPinIcon className="size-4" />
                            KELOLA GALERI ACARA
                        </a>
                    </div>

                    {/* Info box */}
                    <Glass className="p-5 mb-5">
                        <p className="text-sm text-slate-300 leading-relaxed">
                            <span className="font-semibold text-white">Cara kerja:</span> Cetak QR stiker untuk setiap
                            meja, tempel di meja. Tamu scan QR → buka menu digital → pilih item → pesan langsung ke
                            dapur.
                        </p>
                        <div className="mt-3 inline-block rounded-lg bg-white/5 border border-white/10 px-3 py-1.5 font-mono text-xs text-slate-400">
                            {baseUrl}/m/{selectedOutlet?.slug ?? '—'}
                        </div>
                    </Glass>

                    {/* Controls: outlet + filter + cetak semua */}
                    <div className="flex items-end justify-between gap-3 mb-4 flex-wrap">
                        <div className="flex items-end gap-3 flex-wrap">
                            <div>
                                <label className="text-xs text-slate-400">Outlet</label>
                                <select
                                    value={selectedOutletId}
                                    onChange={(e) => setSelectedOutletId(Number(e.target.value))}
                                    className="block mt-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
                                >
                                    {outlets.map((o) => (
                                        <option key={o.id} value={o.id}>
                                            {o.name}
                                        </option>
                                    ))}
                                </select>
                            </div>
                            <div>
                                <label className="text-xs text-slate-400">
                                    Label meja (1 per baris, bebas: A1, 01, Meja 7)
                                </label>
                                <textarea
                                    value={tableInput}
                                    onChange={(e) => setTableInput(e.target.value)}
                                    rows={1}
                                    className="block mt-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 font-mono w-64 resize-none"
                                    placeholder={'A1\nA2\nB1'}
                                />
                            </div>
                            <div>
                                <label className="text-xs text-slate-400">Filter</label>
                                <select
                                    value={filter}
                                    onChange={(e) => onFilterChange(e.target.value)}
                                    className="block mt-1 rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200"
                                >
                                    <option value="all">Semua Meja</option>
                                    {tables.map((t) => (
                                        <option key={t} value={t}>
                                            Meja {t}
                                        </option>
                                    ))}
                                </select>
                            </div>
                        </div>
                        <button
                            onClick={() => window.print()}
                            className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition-colors flex items-center gap-2"
                        >
                            <PrinterIcon className="size-4" />
                            Cetak Semua
                        </button>
                    </div>

                    {/* Grid kartu QR */}
                    {outlets.length === 0 ? (
                        <Glass className="p-6">
                            <p className="text-sm text-amber-300">
                                Belum ada outlet. Tambah outlet di Pengaturan Outlet terlebih dahulu.
                            </p>
                        </Glass>
                    ) : (
                        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-4">
                            {visibleTables.map((t) => (
                                <div
                                    key={t}
                                    ref={(el) => {
                                        cardRefs.current[t] = el;
                                    }}
                                    className={`rounded-2xl border bg-white/[0.02] p-3 flex flex-col items-center transition-all ${
                                        filter === t
                                            ? 'border-[var(--color-primary)] ring-2 ring-[var(--color-primary)]/30'
                                            : 'border-white/5'
                                    }`}
                                >
                                    <h3 className="text-sm font-bold text-slate-200 self-start mb-1.5">Meja {t}</h3>
                                    <div className="size-24 bg-white rounded-xl p-1.5 shadow-sm">
                                        <QRCodeSVG value={tableUrl(t)} size={84} level="M" data-qr={t} />
                                    </div>
                                    <p className="text-[9px] font-mono text-slate-500 mt-1.5 text-center break-all w-full leading-tight">
                                        {tableUrl(t)}
                                    </p>
                                    <div className="mt-2 flex gap-2 w-full">
                                        <button
                                            onClick={(e) =>
                                                downloadQrPng(
                                                    t,
                                                    e.currentTarget.parentElement?.parentElement?.querySelector(
                                                        'svg',
                                                    ) ?? null,
                                                )
                                            }
                                            className="flex-1 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 py-1.5 text-xs font-medium text-slate-200 flex items-center justify-center gap-1.5 transition-colors"
                                        >
                                            <DownloadIcon className="size-3.5" />
                                            Unduh
                                        </button>
                                        <button
                                            onClick={() => window.open(tableUrl(t), '_blank')}
                                            className="flex-1 rounded-lg bg-[var(--color-primary)] hover:brightness-110 text-white py-1.5 text-xs font-medium flex items-center justify-center gap-1.5 transition-all"
                                        >
                                            <ExternalLinkIcon className="size-3.5" />
                                            Buka
                                        </button>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
                </Screen>
            </div>

            {/* ── Print area: kartu border emas + logo brand (image 3 style) ── */}
            <div className="print-area">
                <div className="print-grid">
                    {tables.map((t) => (
                        <div key={t} className="print-card">
                            <div className="pt">Buku Menu Digital</div>
                            <div className="ps">{(selectedOutlet?.name ?? 'Restoku').toUpperCase()}</div>
                            <div className="pqr">
                                <QRCodeSVG value={tableUrl(t)} size={180} level="M" />
                            </div>
                            <div className="brand-badge">Restoku</div>
                            <div className="lbl">NOMOR MEJA</div>
                            <div className="tnum">Meja {t}</div>
                            <div className="scan">Scan QR untuk pesan menu favorit Anda</div>
                        </div>
                    ))}
                </div>
            </div>
        </MainLayout>
    );
}

export default function QRCodeMeja() {
    return (
        <RoleGuard
            allowedRoles={['owner', 'manager', 'admin']}
            pageName="QR Code Meja"
            allowedRoleLabel="Owner, Manager"
        >
            <QRCodeMejaInner />
        </RoleGuard>
    );
}
