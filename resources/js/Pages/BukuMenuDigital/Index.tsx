import { useState, useMemo, ElementType } from 'react';
import { Head, usePage } from '@inertiajs/react';

import MainLayout from '../../Layouts/MainLayout';
import { Screen, Glass, formatRupiah } from '../../Components/Shared';
import {
    QrCodeIcon,
    CheckCircle2Icon,
    Link2Icon,
    CopyIcon,
    LayoutTemplateIcon,
    PaletteIcon,
    ImageIcon,
    MessageCircleIcon,
    UploadIcon,
    PrinterIcon,
    DownloadIcon,
    ExternalLinkIcon,
} from '../../Components/icons';

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
    const [tableInput, setTableInput] = useState<string>('A1\nA2\nA3\nA4\nA5\nA6\nB1\nB2\nB3');
    const [copied, setCopied] = useState(false);
    const [tableFilter, setTableFilter] = useState<string>('all');

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

    const visibleTables = tableFilter === 'all' ? tables : tables.filter((t) => t === tableFilter);

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
                <div className="rounded-2xl bg-[#FAF5EE] border border-[#E7D9CB] p-5 md:p-7">
                    {/* Header */}
                    <div className="flex flex-wrap items-center justify-between gap-3">
                        <div className="flex flex-wrap items-center gap-3">
                            <button className="inline-flex items-center gap-2 rounded-xl bg-[#FF5B35] px-4 py-2.5 text-[13px] font-bold text-white shadow-sm hover:bg-[#E04E2B] transition-colors">
                                <QrCodeIcon className="size-4" /> GENERATOR QR MEJA
                            </button>
                            <a
                                href="#"
                                className="inline-flex items-center gap-2 rounded-xl bg-[#FFF3EC] px-4 py-2.5 text-[13px] font-bold text-[#C9431F] border border-[#F0D9C8] hover:bg-[#FBE7D6] transition-colors"
                            >
                                <ImageIcon className="size-4" /> KELOLA GALERI ACARA
                            </a>
                        </div>
                    </div>

                    <h2 className="mt-5 text-2xl font-extrabold text-[#1A1410]">Buku Menu Digital</h2>
                    <p className="mt-1 text-[13px] text-[#7A6F63]">
                        QR Code untuk setiap meja – tamu scan langsung lihat menu &amp; pesan mandiri.
                    </p>

                    {/* Controls */}
                    <div className="mt-5 flex flex-wrap items-center justify-between gap-3">
                        <div className="flex items-center gap-2">
                            <select
                                value={selectedOutletId}
                                onChange={(e) => setSelectedOutletId(Number(e.target.value))}
                                className="rounded-xl border border-[#E7D9CB] bg-white px-3 py-2.5 text-[13px] font-medium text-[#1A1410] focus:border-[#FF5B35]/50 outline-none"
                            >
                                {outlets.map((o) => (
                                    <option key={o.id} value={o.id}>
                                        {o.name}
                                    </option>
                                ))}
                            </select>
                            <select
                                value={tableFilter}
                                onChange={(e) => setTableFilter(e.target.value)}
                                className="rounded-xl border border-[#E7D9CB] bg-white px-3 py-2.5 text-[13px] font-medium text-[#1A1410] focus:border-[#FF5B35]/50 outline-none"
                            >
                                <option value="all">Semua Meja</option>
                                {tables.map((t) => (
                                    <option key={t} value={t}>
                                        Meja {t}
                                    </option>
                                ))}
                            </select>
                        </div>
                        <button
                            onClick={() => window.print()}
                            className="inline-flex items-center gap-2 rounded-xl bg-[#FF5B35] px-4 py-2.5 text-[13px] font-bold text-white shadow-sm hover:bg-[#E04E2B] transition-colors"
                        >
                            <PrinterIcon className="size-4" /> Cetak Semua
                        </button>
                    </div>

                    {/* Cara kerja */}
                    <div className="mt-5 rounded-xl bg-[#F3EEF8] border border-[#E4D8F2] p-4 text-[12.5px] leading-relaxed text-[#4A3F5E]">
                        <b className="text-[#3A2F4E]">Cara kerja:</b> Cetak QR stiker untuk setiap meja, tempel di meja.
                        Tamu scan QR → buka menu digital → pilih item → pesan langsung ke dapur.
                        <div className="mt-1">
                            <b className="text-[#3A2F4E]">URL dasar:</b>{' '}
                            <code className="font-mono text-[#7C3AED]">
                                {menuUrl || 'https://restoku.app/m/{slug}?t={meja}'}
                            </code>
                        </div>
                    </div>

                    {/* Label meja editor */}
                    <div className="mt-5">
                        <label className="text-[12px] font-semibold text-[#5A4F43]">
                            Label meja (1 per baris, bebas: A1, 01, Meja 7)
                        </label>
                        <textarea
                            value={tableInput}
                            onChange={(e) => {
                                setTableInput(e.target.value);
                                setTableFilter('all');
                            }}
                            rows={3}
                            className="mt-1 w-full max-w-md rounded-xl border border-[#E7D9CB] bg-white px-3 py-2 text-[13px] text-[#1A1410] font-mono outline-none focus:border-[#FF5B35]/50"
                            placeholder={'A1\nA2\nB1'}
                        />
                    </div>

                    {/* Grid Meja */}
                    {outlets.length === 0 ? (
                        <p className="mt-5 text-[13px] text-[#A8521F]">
                            Belum ada outlet. Tambah outlet di Pengaturan Outlet terlebih dahulu.
                        </p>
                    ) : (
                        <div className="mt-5 grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-4">
                            {visibleTables.map((t) => (
                                <div
                                    key={t}
                                    className="rounded-2xl border border-[#EFE2D4] bg-white p-4 text-center shadow-sm"
                                >
                                    <p className="text-[14px] font-extrabold text-[#1A1410]">Meja {t}</p>
                                    <div className="mx-auto mt-3 w-[120px] rounded-lg bg-white p-1.5 shadow-sm">
                                        <QRCodeSVG value={tableUrl(t)} size={108} level="M" />
                                    </div>
                                    <p className="mt-3 break-all font-mono text-[10.5px] text-[#8A7D70]">
                                        {tableUrl(t)}
                                    </p>
                                    <div className="mt-3 flex gap-2">
                                        <button className="flex-1 rounded-xl bg-[#FFF3EC] px-2 py-2 text-[11.5px] font-bold text-[#A8521F] border border-[#F0D9C8] hover:bg-[#FBE7D6] transition-colors inline-flex items-center justify-center gap-1">
                                            <DownloadIcon className="size-3.5" /> Unduh
                                        </button>
                                        <a
                                            href={tableUrl(t)}
                                            target="_blank"
                                            rel="noreferrer"
                                            className="flex-1 rounded-xl bg-[#FFF3EC] px-2 py-2 text-[11.5px] font-bold text-[#C9431F] border border-[#F0D9C8] hover:bg-[#FBE7D6] transition-colors inline-flex items-center justify-center gap-1"
                                        >
                                            <ExternalLinkIcon className="size-3.5" /> Buka
                                        </a>
                                    </div>
                                </div>
                            ))}
                        </div>
                    )}
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
