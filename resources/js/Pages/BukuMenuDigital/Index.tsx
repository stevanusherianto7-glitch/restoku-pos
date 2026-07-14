import { useState, useMemo, useRef, ElementType } from 'react';
import { Head, usePage } from '@inertiajs/react';

import MainLayout from '../../Layouts/MainLayout';
import { Screen, Glass } from '../../Components/Shared';
import {
    QrCodeIcon,
    CheckCircle2Icon,
    Link2Icon,
    CopyIcon,
    LayoutGridIcon,
    PrinterIcon,
    DownloadIcon,
    ExternalLinkIcon,
    MapPinIcon,
    LeafIcon,
} from '../../Components/icons';

import { RoleGuard } from '../../Components/RoleGuard';
import { QRCodeSVG } from 'qrcode.react';
import { buildMenuUrl } from '../../lib/menuUrl';
import { defaultTables, groupTablesByFloor } from '../../lib/tableFormat';

type Outlet = { id: number; name: string; slug: string; is_active: boolean };

// Format permanen: A = lantai 1, B = lantai 2. Generator default (owner tetap
// boleh edit di textarea, tapi ini jadi default yang konsisten antar outlet).

// Extract SVG node jadi string untuk di-download.
function svgToString(svgEl: SVGSVGElement | null): string {
    if (!svgEl) return '';
    return new XMLSerializer().serializeToString(svgEl);
}

function downloadSvg(filename: string, svgText: string) {
    const blob = new Blob([svgText], { type: 'image/svg+xml' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
}

function BukuMenuDigitalInner() {
    const { props } = usePage();
    const outlets = (props.outlets as Outlet[]) ?? [];
    const activeOutletId = (props.outlet as Outlet | undefined)?.id;
    const [selectedOutletId, setSelectedOutletId] = useState<number>(activeOutletId ?? outlets[0]?.id ?? 0);

    // Label meja — default permanen A1..A9 (lantai 1), B1..B3 (lantai 2).
    const [tableInput, setTableInput] = useState<string>(defaultTables());
    const [copied, setCopied] = useState(false);
    const [selectedTable, setSelectedTable] = useState<string>('A1');

    const selectedOutlet = outlets.find((o) => o.id === selectedOutletId) ?? outlets[0];
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

    // Kelompokkan per lantai berdasar huruf depan (A=1, B=2, dst).
    const floors = useMemo(() => groupTablesByFloor(tables), [tables]);

    const previewTable = tables.includes(selectedTable) ? selectedTable : (tables[0] ?? '');
    const tableUrl = previewTable ? buildMenuUrl(baseUrl, selectedOutlet?.slug ?? '', previewTable) : '';

    const previewRef = useRef<HTMLDivElement>(null);
    const previewSvgRef = useRef<SVGSVGElement>(null);

    const copyMenuLink = async () => {
        if (!tableUrl) return;
        try {
            await navigator.clipboard.writeText(tableUrl);
            setCopied(true);
            setTimeout(() => setCopied(false), 1500);
        } catch {
            /* clipboard tidak tersedia */
        }
    };

    const downloadPreview = () => {
        const svg = previewSvgRef.current;
        if (!svg) return;
        downloadSvg(`qrcode-${selectedOutlet?.slug ?? 'outlet'}-${previewTable}.svg`, svgToString(svg));
    };

    return (
        <MainLayout>
            <Head title="Buku Menu Digital (e-Menu)" />
            <Screen title="Buku Menu Digital (e-Menu)">
                <div className="rounded-2xl bg-[#FAF5EE] border border-[#E7D9CB] p-5 md:p-7">
                    {/* Header */}
                    <div className="flex flex-wrap items-center gap-3">
                        <div className="inline-flex items-center gap-2 rounded-xl bg-[#FF5B35] px-4 py-2.5 text-[13px] font-bold text-white shadow-sm">
                            <MapPinIcon className="size-4" /> PETA &amp; QR MEJA
                        </div>
                        <span className="text-[13px] text-[#7A6F63]">Generate QR Code Siap Cetak</span>
                    </div>

                    <h2 className="mt-5 text-2xl font-extrabold text-[#1A1410]">Buku Menu Digital</h2>
                    <p className="mt-1 text-[13px] text-[#7A6F63]">
                        QR Code untuk setiap meja – tamu scan langsung lihat menu &amp; pesan mandiri.
                    </p>

                    {/* Status permanen */}
                    <div className="mt-5 flex items-start gap-2.5 rounded-xl bg-[#EAF7EF] border border-[#CDEBD6] p-4 text-[12.5px] leading-relaxed text-[#1F6B3F]">
                        <CheckCircle2Icon className="size-4 mt-0.5 shrink-0 text-[#1F9D57]" />
                        <div>
                            <b>QR Code Permanen (Statis):</b> Anda <b>TIDAK PERLU</b> mencetak ulang QR Code ini
                            meskipun ada perubahan harga, foto, atau penambahan menu baru di aplikasi.
                        </div>
                    </div>

                    {/* Link produksi */}
                    <div className="mt-3 flex items-start gap-2.5 rounded-xl bg-[#F1EEEA] border border-[#E2DDD5] p-4 text-[12.5px] text-[#5A4F43]">
                        <Link2Icon className="size-4 mt-0.5 shrink-0 text-[#8A7D70]" />
                        <div>
                            Link mengarah ke server produksi:{' '}
                            <code className="font-mono text-[#C9431F]">
                                {menuUrl || 'https://restoku.app/m/{slug}'}
                            </code>
                        </div>
                    </div>

                    {/* Outlet selector */}
                    <div className="mt-5 flex flex-wrap items-center gap-2">
                        <select
                            value={selectedOutletId}
                            onChange={(e) => setSelectedOutletId(Number(e.target.value))}
                            className="rounded-xl border border-[#E7D9CB] bg-white px-3 py-2.5 text-[13px] font-medium text-[#1A1410] outline-none focus:border-[#FF5B35]/50"
                        >
                            {outlets.map((o) => (
                                <option key={o.id} value={o.id}>
                                    {o.name}
                                </option>
                            ))}
                        </select>
                        <button
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#FF5B35] px-4 py-2.5 text-[13px] font-bold text-white shadow-sm hover:bg-[#E04E2B] transition-colors"
                        >
                            <PrinterIcon className="size-4" /> Cetak Semua
                        </button>
                    </div>

                    {/* 1. PILIH MEJA */}
                    <div className="mt-6">
                        <h3 className="text-[13px] font-extrabold tracking-wide text-[#1A1410]">1. PILIH MEJA</h3>

                        {floors.length === 0 && (
                            <p className="mt-3 text-[13px] text-[#A8521F]">
                                Belum ada meja. Isi label di bawah (format A = lantai 1, B = lantai 2).
                            </p>
                        )}

                        {floors.map((grp) => (
                            <div key={grp.floor} className="mt-4">
                                <p className="text-[12px] font-bold text-[#7A6F63]">
                                    Lantai {grp.floor} (Format {grp.items[0].charAt(0).toUpperCase()})
                                </p>
                                <div className="mt-2 grid grid-cols-3 gap-2.5 sm:grid-cols-5">
                                    {grp.items.map((t) => (
                                        <button
                                            key={t}
                                            onClick={() => setSelectedTable(t)}
                                            className={
                                                'rounded-xl border px-2 py-3 text-[13px] font-bold transition-colors ' +
                                                (t === previewTable
                                                    ? 'border-[#E04E2B] bg-[#FF5B35] text-white'
                                                    : 'border-[#EFE2D4] bg-white text-[#1A1410] hover:border-[#FF5B35]/40')
                                            }
                                        >
                                            Meja {t}
                                        </button>
                                    ))}
                                </div>
                            </div>
                        ))}

                        {/* Editor label (backward-compat, optional) */}
                        <details className="mt-4">
                            <summary className="cursor-pointer text-[12px] font-semibold text-[#8A7D70] hover:text-[#C9431F]">
                                Edit label meja (1 per baris, format A = lantai 1, B = lantai 2)
                            </summary>
                            <textarea
                                value={tableInput}
                                onChange={(e) => setTableInput(e.target.value)}
                                rows={3}
                                className="mt-2 w-full max-w-md rounded-xl border border-[#E7D9CB] bg-white px-3 py-2 text-[13px] text-[#1A1410] font-mono outline-none focus:border-[#FF5B35]/50"
                                placeholder={'A1\nA2\nB1'}
                            />
                        </details>
                    </div>

                    {/* 2. PREVIEW & DOWNLOAD */}
                    <div className="mt-7 border-t border-dashed border-[#E7D9CB] pt-6">
                        <h3 className="text-[13px] font-extrabold tracking-wide text-[#1A1410]">
                            2. PREVIEW &amp; DOWNLOAD QR: <span className="text-[#FF5B35]">MEJA {previewTable}</span>
                        </h3>

                        {previewTable ? (
                            <div
                                ref={previewRef}
                                className="relative mt-4 inline-block rounded-2xl border border-[#EFE2D4] bg-white p-5 shadow-sm"
                            >
                                <span className="absolute -top-3 left-4 rounded-md bg-[#F59E0B] px-2 py-1 text-[10px] font-extrabold tracking-wide text-white">
                                    AREA CETAK
                                </span>
                                <div className="relative">
                                    <p className="text-center font-serif text-[26px] font-bold text-[#1A1410]">
                                        {selectedOutlet?.name ?? 'Pawon Salam'}
                                    </p>
                                    <p className="text-center text-[11px] tracking-[0.18em] text-[#7A6F63]">
                                        SCAN TO ORDER
                                    </p>
                                    <div className="relative mx-auto my-3 w-[180px]">
                                        <QRCodeSVG ref={previewSvgRef} value={tableUrl} size={164} level="M" />
                                        {/* Logo daun di tengah QR (overlay, inline SVG) */}
                                        <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                            <div className="flex size-9 items-center justify-center rounded-full bg-[#FF5B35] text-white ring-2 ring-white">
                                                <LeafIcon className="size-5" />
                                            </div>
                                        </div>
                                    </div>
                                    <p className="text-center text-[16px] font-extrabold text-[#1A1410]">
                                        {previewTable}
                                    </p>
                                    <div className="mt-3 flex items-center gap-1.5 font-mono text-[10.5px] text-[#8A7D70]">
                                        <Link2Icon className="size-3.5 shrink-0" />
                                        <span className="break-all">{tableUrl}</span>
                                    </div>
                                </div>
                            </div>
                        ) : (
                            <p className="mt-3 text-[13px] text-[#A8521F]">Pilih meja untuk melihat preview QR.</p>
                        )}

                        {previewTable && (
                            <div className="mt-4 flex flex-wrap gap-2.5">
                                <button
                                    onClick={downloadPreview}
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#FFF3EC] px-4 py-2.5 text-[13px] font-bold text-[#A8521F] border border-[#F0D9C8] hover:bg-[#FBE7D6] transition-colors"
                                >
                                    <DownloadIcon className="size-4" /> Unduh SVG
                                </button>
                                <button
                                    onClick={copyMenuLink}
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#FFF3EC] px-4 py-2.5 text-[13px] font-bold text-[#C9431F] border border-[#F0D9C8] hover:bg-[#FBE7D6] transition-colors"
                                >
                                    <CopyIcon className="size-4" /> {copied ? 'Tersalin!' : 'Salin Link'}
                                </button>
                                <a
                                    href={tableUrl}
                                    target="_blank"
                                    rel="noreferrer"
                                    className="inline-flex items-center gap-2 rounded-xl bg-[#FFF3EC] px-4 py-2.5 text-[13px] font-bold text-[#C9431F] border border-[#F0D9C8] hover:bg-[#FBE7D6] transition-colors"
                                >
                                    <ExternalLinkIcon className="size-4" /> Buka
                                </a>
                            </div>
                        )}
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
