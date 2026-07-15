import { useState, useMemo, useRef, useCallback, useEffect } from 'react';
import { Head, usePage } from '@inertiajs/react';

import MainLayout from '../../Layouts/MainLayout';
import { Screen } from '../../Components/Shared';
import {
    QrCodeIcon,
    CheckCircle2Icon,
    Link2Icon,
    CopyIcon,
    PrinterIcon,
    DownloadIcon,
    UploadIcon,
    ExternalLinkIcon,
    MapPinIcon,
    LeafIcon,
    PlusIcon,
    SearchIcon,
    PencilIcon,
    TrashIcon,
    XIcon,
} from '../../Components/icons';

import { RoleGuard } from '../../Components/RoleGuard';
import { QRCodeSVG } from 'qrcode.react';
import { buildMenuUrl } from '../../lib/menuUrl';

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

// Convert SVG (QR) jadi PNG via canvas untuk download stiker.
function downloadSvgAsPng(filename: string, svgText: string, scale = 4) {
    return new Promise<void>((resolve) => {
        const img = new Image();
        const svgBlob = new Blob([svgText], { type: 'image/svg+xml;charset=utf-8' });
        const url = URL.createObjectURL(svgBlob);
        img.onload = () => {
            const canvas = document.createElement('canvas');
            canvas.width = img.width * scale;
            canvas.height = img.height * scale;
            const ctx = canvas.getContext('2d');
            if (ctx) {
                ctx.fillStyle = '#ffffff';
                ctx.fillRect(0, 0, canvas.width, canvas.height);
                ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
                canvas.toBlob((blob) => {
                    if (blob) {
                        const a = document.createElement('a');
                        a.href = URL.createObjectURL(blob);
                        a.download = filename;
                        a.click();
                        URL.revokeObjectURL(a.href);
                    }
                    resolve();
                }, 'image/png');
            } else {
                resolve();
            }
            URL.revokeObjectURL(url);
        };
        img.onerror = () => resolve();
        img.src = url;
    });
}

// Tipe QR terpilih per stiker.
type QrKind = 'qr' | 'logo' | 'frame';

// Meja dari backend (CRUD nyata via outlet_tables).
type ApiTable = {
    id: number;
    label: string;
    pin: string;
    is_queue: boolean;
    qr_type: QrKind;
};

function BukuMenuDigitalInner() {
    const { props } = usePage();
    const outlets = (props.outlets as Outlet[]) ?? [];
    const activeOutletId = (props.outlet as Outlet | undefined)?.id;
    const [selectedOutletId, setSelectedOutletId] = useState<number>(activeOutletId ?? outlets[0]?.id ?? 0);

    const [copied, setCopied] = useState(false);
    const [selectedTable, setSelectedTable] = useState<string>('');

    // Data meja nyata dari backend.
    const [apiTables, setApiTables] = useState<ApiTable[]>([]);
    const [loadingTables, setLoadingTables] = useState(false);
    const [tableError, setTableError] = useState<string>('');
    const [saving, setSaving] = useState(false);

    const selectedOutlet = outlets.find((o) => o.id === selectedOutletId) ?? outlets[0];
    const baseUrl = (props.menu_base_url as string) || (typeof window !== 'undefined' ? window.location.origin : '');
    const menuUrl = selectedOutlet ? buildMenuUrl(baseUrl, selectedOutlet.slug) : '';

    // Load meja per outlet dari backend.
    const loadTables = useCallback(async (outletId: number) => {
        if (!outletId) return;
        setLoadingTables(true);
        setTableError('');
        try {
            const res = await fetch(`/api/outlet-tables/${outletId}`, {
                headers: { Accept: 'application/json', 'X-Inertia': 'false' },
            });
            if (!res.ok) throw new Error('Gagal memuat meja');
            const data = await res.json();
            const rows: ApiTable[] = (data.tables ?? []).map((t: any) => ({
                id: t.id,
                label: t.label,
                pin: t.pin,
                is_queue: !!t.is_queue,
                qr_type: (t.qr_type as QrKind) || 'frame',
            }));
            setApiTables(rows);
            setSelectedTable(rows[0]?.label ?? '');
        } catch (e: any) {
            setTableError(e?.message ?? 'Gagal memuat meja');
            setApiTables([]);
        } finally {
            setLoadingTables(false);
        }
    }, []);

    useEffect(() => {
        loadTables(selectedOutletId);
    }, [selectedOutletId, loadTables]);

    const tables = useMemo(() => apiTables.map((t) => t.label), [apiTables]);

    const previewTable = tables.includes(selectedTable) ? selectedTable : (tables[0] ?? '');
    const tableUrl = previewTable ? buildMenuUrl(baseUrl, selectedOutlet?.slug ?? '', previewTable) : '';

    const previewRef = useRef<HTMLDivElement>(null);
    const previewSvgRef = useRef<SVGSVGElement>(null);
    const modalSvgRef = useRef<SVGSVGElement>(null);

    // Modal stiker QR (referensi: Data Meja -> klik meja -> modal Ubah Data Meja).
    const [modalOpen, setModalOpen] = useState(false);
    const [modalMode, setModalMode] = useState<'create' | 'edit'>('edit');
    const [modalId, setModalId] = useState<number | null>(null);
    const [modalTable, setModalTable] = useState<string>('');
    const [modalQrKind, setModalQrKind] = useState<QrKind>('frame');
    const [modalQueue, setModalQueue] = useState(false);
    const [modalNoMeja, setModalNoMeja] = useState('');

    const openModal = (mode: 'create' | 'edit', row?: ApiTable) => {
        setModalMode(mode);
        if (mode === 'edit' && row) {
            setModalId(row.id);
            setModalTable(row.label);
            setModalNoMeja(row.label);
            setModalQueue(row.is_queue);
            setModalQrKind(row.qr_type);
        } else {
            setModalId(null);
            setModalTable('');
            setModalNoMeja('');
            setModalQueue(false);
            setModalQrKind('frame');
        }
        setModalOpen(true);
    };

    const modalUrl = modalTable ? buildMenuUrl(baseUrl, selectedOutlet?.slug ?? '', modalTable) : '';

    const downloadModalQr = () => {
        const svg = modalSvgRef.current;
        if (!svg) return;
        downloadSvgAsPng(`qrcode-${selectedOutlet?.slug ?? 'outlet'}-${modalTable}.png`, svgToString(svg));
    };

    const saveModal = async () => {
        if (!selectedOutletId) return;
        if (!modalNoMeja.trim()) {
            setTableError('No Meja wajib diisi.');
            return;
        }
        setSaving(true);
        setTableError('');
        try {
            const payload = {
                label: modalNoMeja.trim(),
                is_queue: modalQueue,
                qr_type: modalQrKind,
            };
            let res: Response;
            if (modalMode === 'create') {
                res = await fetch('/api/outlet-tables', {
                    method: 'POST',
                    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Inertia': 'false' },
                    body: JSON.stringify({ outlet_id: selectedOutletId, ...payload }),
                });
            } else {
                res = await fetch(`/api/outlet-tables/${modalId}`, {
                    method: 'PUT',
                    headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Inertia': 'false' },
                    body: JSON.stringify(payload),
                });
            }
            if (!res.ok) {
                const err = await res.json().catch(() => ({}));
                throw new Error(err.error ?? 'Gagal menyimpan meja');
            }
            await loadTables(selectedOutletId);
            setModalOpen(false);
        } catch (e: any) {
            setTableError(e?.message ?? 'Gagal menyimpan meja');
        } finally {
            setSaving(false);
        }
    };

    const deleteTable = async (id: number, label: string) => {
        if (!confirm(`Hapus meja ${label}?`)) return;
        setSaving(true);
        setTableError('');
        try {
            const res = await fetch(`/api/outlet-tables/${id}`, {
                method: 'DELETE',
                headers: { Accept: 'application/json', 'X-Inertia': 'false' },
            });
            if (!res.ok) throw new Error('Gagal menghapus meja');
            await loadTables(selectedOutletId);
        } catch (e: any) {
            setTableError(e?.message ?? 'Gagal menghapus meja');
        } finally {
            setSaving(false);
        }
    };

    // ── Upload CSV (import massal) ───────────────────────────────────────────
    const fileInputRef = useRef<HTMLInputElement>(null);

    // Parse CSV sederhana: header no.1 = label, kol.2 = is_queue (ya/tidak/1/0), kol.3 = qr_type.
    const parseCsv = (text: string): { label: string; is_queue: boolean; qr_type: string }[] => {
        const lines = text
            .split(/\r?\n/)
            .map((l) => l.trim())
            .filter((l) => l.length > 0);
        if (lines.length === 0) return [];
        const rows = lines.slice(1); // skip header
        return rows.map((line) => {
            const cols = line.split(',').map((c) => c.trim());
            const label = cols[0] ?? '';
            const isQueueRaw = (cols[1] ?? '').toLowerCase();
            const is_queue = ['ya', 'yes', '1', 'true'].includes(isQueueRaw);
            const qr_type = ['qr', 'logo', 'frame'].includes((cols[2] ?? '').toLowerCase())
                ? cols[2].toLowerCase()
                : 'frame';
            return { label, is_queue, qr_type };
        });
    };

    const uploadCsv = async (file: File) => {
        if (!selectedOutletId) return;
        setSaving(true);
        setTableError('');
        try {
            const text = await file.text();
            const rows = parseCsv(text);
            if (rows.length === 0) {
                setTableError('File CSV kosong atau format salah (butuh header: label,is_queue,qr_type).');
                return;
            }
            const res = await fetch('/api/outlet-tables/bulk', {
                method: 'POST',
                headers: { Accept: 'application/json', 'Content-Type': 'application/json', 'X-Inertia': 'false' },
                body: JSON.stringify({ outlet_id: selectedOutletId, rows }),
            });
            const data = await res.json().catch(() => ({}));
            if (!res.ok) throw new Error(data.error ?? 'Gagal mengimpor CSV');
            let msg = `Import selesai: ${data.created} dibuat`;
            if (data.skipped > 0) msg += `, ${data.skipped} dilewati`;
            if (Array.isArray(data.errors) && data.errors.length > 0) {
                msg += `\n${data.errors.slice(0, 5).join('\n')}`;
            }
            await loadTables(selectedOutletId);
            setTableError(msg);
        } catch (e: any) {
            setTableError(e?.message ?? 'Gagal mengimpor CSV');
        } finally {
            setSaving(false);
            if (fileInputRef.current) fileInputRef.current.value = '';
        }
    };

    // ── Download CSV (export) ────────────────────────────────────────────────
    const downloadCsv = () => {
        const escape = (v: string) => `"${String(v).replace(/"/g, '""')}"`;
        const header = 'label,is_queue,qr_type';
        const body = apiTables
            .map((t) => [t.label, t.is_queue ? 'ya' : 'tidak', t.qr_type].map(escape).join(','))
            .join('\n');
        const csv = `${header}\n${body}`;
        const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
        const url = URL.createObjectURL(blob);
        const a = document.createElement('a');
        a.href = url;
        a.download = `meja_${selectedOutlet?.slug ?? 'outlet'}.csv`;
        document.body.appendChild(a);
        a.click();
        document.body.removeChild(a);
        URL.revokeObjectURL(url);
    };

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

                    {/* Outlet selector + Cetak Semua */}
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

                    {/* 1. DATA MEJA — tabel (referensi gambar 2) */}
                    <div className="mt-6 rounded-2xl border border-[#E7D9CB] bg-white overflow-hidden">
                        {/* Toolbar */}
                        <div className="flex flex-wrap items-center justify-between gap-3 border-b border-[#F0E6DA] bg-[#FBF4EC] px-4 py-3">
                            <h3 className="text-[14px] font-extrabold text-[#1A1410]">Data Meja</h3>
                            <div className="flex flex-wrap items-center gap-2">
                                <button
                                    onClick={() => openModal('create')}
                                    className="inline-flex items-center gap-1.5 rounded-lg bg-[#FF5B35] px-3 py-2 text-[12px] font-bold text-white hover:bg-[#E04E2B] transition-colors"
                                >
                                    <PlusIcon className="size-4" /> Tambah Data
                                </button>
                                <button
                                    onClick={() => fileInputRef.current?.click()}
                                    disabled={saving}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#E7D9CB] bg-white px-3 py-2 text-[12px] font-medium text-[#5A4F43] hover:bg-[#FBEDE2] disabled:opacity-50"
                                >
                                    <UploadIcon className="size-4" /> Upload
                                </button>
                                <button
                                    onClick={downloadCsv}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#E7D9CB] bg-white px-3 py-2 text-[12px] font-medium text-[#5A4F43] hover:bg-[#FBEDE2]"
                                >
                                    <DownloadIcon className="size-4" /> Download
                                </button>
                                <input
                                    ref={fileInputRef}
                                    type="file"
                                    accept=".csv,text/csv"
                                    className="hidden"
                                    onChange={(e) => {
                                        const f = e.target.files?.[0];
                                        if (f) uploadCsv(f);
                                    }}
                                />
                                <button
                                    onClick={() => tables[0] && openModal('edit', apiTables[0])}
                                    className="inline-flex items-center gap-1.5 rounded-lg border border-[#E7D9CB] bg-white px-3 py-2 text-[12px] font-medium text-[#5A4F43] hover:bg-[#FBEDE2]"
                                >
                                    <QrCodeIcon className="size-4" /> Download QR
                                </button>
                            </div>
                        </div>

                        {/* Search */}
                        <div className="flex items-center gap-2 border-b border-[#F0E6DA] px-4 py-2.5">
                            <div className="relative w-full max-w-xs">
                                <SearchIcon className="absolute left-3 top-1/2 size-4 -translate-y-1/2 text-[#A99A8C]" />
                                <input
                                    type="text"
                                    placeholder="Search"
                                    className="w-full rounded-lg border border-[#E7D9CB] bg-white py-2 pl-9 pr-3 text-[12px] text-[#1A1410] outline-none focus:border-[#FF5B35]/50"
                                />
                            </div>
                        </div>

                        {tableError && (
                            <div className="border-b border-[#F0E6DA] bg-[#FFF6EC] px-4 py-2 text-[12px] text-[#7A4A12]">
                                <pre className="whitespace-pre-wrap font-sans">{tableError}</pre>
                            </div>
                        )}

                        {/* Table */}
                        <div className="overflow-x-auto">
                            <table className="w-full text-left text-[12.5px]">
                                <thead>
                                    <tr className="border-b border-[#F0E6DA] bg-[#FCF7F1] text-[#7A6F63]">
                                        <th className="px-4 py-2.5 font-semibold">No</th>
                                        <th className="px-4 py-2.5 font-semibold">No Meja</th>
                                        <th className="px-4 py-2.5 font-semibold">Meja Antrian</th>
                                        <th className="px-4 py-2.5 font-semibold text-right">Aksi</th>
                                    </tr>
                                </thead>
                                <tbody className="divide-y divide-[#F4ECE2]">
                                    {loadingTables && (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-6 text-center text-[#A99A8C]">
                                                Memuat…
                                            </td>
                                        </tr>
                                    )}
                                    {!loadingTables &&
                                        apiTables.map((t, i) => (
                                            <tr key={t.id} className="hover:bg-[#FFF8F1]">
                                                <td className="px-4 py-3 text-[#5A4F43]">{i + 1}</td>
                                                <td className="px-4 py-3 font-bold text-[#1A1410]">{t.label}</td>
                                                <td className="px-4 py-3 text-[#5A4F43]">
                                                    {t.is_queue ? 'Ya' : 'Tidak'}
                                                </td>
                                                <td className="px-4 py-3">
                                                    <div className="flex items-center justify-end gap-1.5">
                                                        <button
                                                            onClick={() => openModal('edit', t)}
                                                            className="inline-flex items-center gap-1 rounded-lg border border-[#FFE0D1] bg-[#FFF3EC] px-2.5 py-1.5 text-[11.5px] font-bold text-[#C9431F] hover:bg-[#FBE7D6]"
                                                        >
                                                            <QrCodeIcon className="size-3.5" /> QR
                                                        </button>
                                                        <button
                                                            onClick={() => openModal('edit', t)}
                                                            className="inline-flex items-center gap-1 rounded-lg border border-[#E7D9CB] bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-[#5A4F43] hover:bg-[#FBEDE2]"
                                                        >
                                                            <PencilIcon className="size-3.5" /> Edit
                                                        </button>
                                                        <button
                                                            onClick={() => deleteTable(t.id, t.label)}
                                                            className="inline-flex items-center gap-1 rounded-lg border border-[#E7D9CB] bg-white px-2.5 py-1.5 text-[11.5px] font-medium text-[#5A4F43] hover:bg-[#FBEDE2]"
                                                        >
                                                            <TrashIcon className="size-3.5" /> Hapus
                                                        </button>
                                                    </div>
                                                </td>
                                            </tr>
                                        ))}
                                    {!loadingTables && apiTables.length === 0 && (
                                        <tr>
                                            <td colSpan={4} className="px-4 py-6 text-center text-[#A99A8C]">
                                                Belum ada meja. Klik "Tambah Data".
                                            </td>
                                        </tr>
                                    )}
                                </tbody>
                            </table>
                        </div>

                        {/* Pagination */}
                        <div className="flex items-center justify-end gap-2 border-t border-[#F0E6DA] bg-[#FBF4EC] px-4 py-2.5 text-[12px] text-[#7A6F63]">
                            <span>{apiTables.length} meja</span>
                        </div>
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
                                        <QRCodeSVG
                                            ref={previewSvgRef}
                                            value={tableUrl}
                                            size={164}
                                            level="M"
                                            margin={2}
                                        />
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

                {/* Modal Stiker QR (referensi gambar 3) */}
                {modalOpen && (
                    <div
                        className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4"
                        onClick={() => setModalOpen(false)}
                    >
                        <div
                            className="relative w-full max-w-2xl rounded-2xl bg-white shadow-2xl"
                            onClick={(e) => e.stopPropagation()}
                        >
                            {/* Header modal */}
                            <div className="flex items-center justify-between rounded-t-2xl bg-[#FFE9E0] px-5 py-4">
                                <h3 className="text-[15px] font-extrabold text-[#1A1410]">
                                    {modalMode === 'create' ? 'Tambah Data Meja' : 'Ubah Data Meja'}
                                </h3>
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="text-[#7A6F63] hover:text-[#C9431F]"
                                >
                                    <XIcon className="size-5" />
                                </button>
                            </div>

                            <div className="grid grid-cols-1 gap-5 p-5 md:grid-cols-2">
                                {/* Kiri: stiker QR */}
                                <div className="flex flex-col items-center">
                                    <div className="w-full max-w-[260px] rounded-2xl bg-[#FF5B35] p-4 shadow-inner">
                                        <div className="relative mx-auto w-[200px] bg-white p-3 rounded-xl">
                                            <QRCodeSVG
                                                ref={modalSvgRef}
                                                value={modalUrl}
                                                size={184}
                                                level="M"
                                                margin={2}
                                            />
                                            <div className="pointer-events-none absolute inset-0 flex items-center justify-center">
                                                {modalQrKind === 'logo' || modalQrKind === 'frame' ? (
                                                    <div className="flex size-10 items-center justify-center rounded-full bg-white text-[#FF5B35] ring-2 ring-white">
                                                        <LeafIcon className="size-5" />
                                                    </div>
                                                ) : null}
                                            </div>
                                        </div>
                                        <div className="mt-3 rounded-xl bg-white px-3 py-2 text-center">
                                            <p className="text-[11px] font-semibold text-[#FF5B35]">
                                                Download Aplikasi
                                            </p>
                                            <p className="text-[13px] font-extrabold text-[#FF5B35]">
                                                Restoku Self Order
                                            </p>
                                            <div className="mt-2 flex items-center justify-center gap-2">
                                                <span className="rounded bg-black px-2 py-1 text-[9px] font-bold text-white">
                                                    App Store
                                                </span>
                                                <span className="rounded bg-[#FF5B35] px-2 py-1 text-[9px] font-bold text-white">
                                                    Google Play
                                                </span>
                                            </div>
                                        </div>
                                        <p className="mt-3 text-center text-[34px] font-extrabold leading-none text-[#1A1410] drop-shadow">
                                            {modalNoMeja}
                                        </p>
                                    </div>
                                </div>

                                {/* Kanan: form */}
                                <div className="space-y-4">
                                    <div>
                                        <label className="text-[12.5px] font-semibold text-[#1A1410]">No Meja</label>
                                        <input
                                            value={modalNoMeja}
                                            onChange={(e) => setModalNoMeja(e.target.value)}
                                            className="mt-1 w-full rounded-lg border border-[#E7D9CB] bg-white px-3 py-2 text-[13px] text-[#1A1410] outline-none focus:border-[#FF5B35]/50"
                                        />
                                        <span className="mt-1 inline-block rounded bg-[#FEF3C7] px-1.5 py-0.5 text-[10px] font-bold text-[#92400E]">
                                            Wajib
                                        </span>
                                    </div>

                                    <div>
                                        <label className="text-[12.5px] font-semibold text-[#1A1410]">
                                            Meja Antrian
                                        </label>
                                        <button
                                            type="button"
                                            onClick={() => setModalQueue((v) => !v)}
                                            className={
                                                'mt-1 flex h-6 w-11 items-center rounded-full px-0.5 transition-colors ' +
                                                (modalQueue ? 'bg-[#FF5B35]' : 'bg-[#D8CFC4]')
                                            }
                                        >
                                            <span
                                                className={
                                                    'size-5 rounded-full bg-white shadow transition-transform ' +
                                                    (modalQueue ? 'translate-x-5' : 'translate-x-0')
                                                }
                                            />
                                        </button>
                                        <p className="mt-1 text-[11px] leading-snug text-[#7A6F63]">
                                            Jika aktif, customer yang pesan makanan akan diberikan nomor antrian dan
                                            notifikasi setelah pesanan selesai.
                                        </p>
                                    </div>

                                    <div>
                                        <label className="text-[12.5px] font-semibold text-[#1A1410]">Tipe QR</label>
                                        <div className="mt-1.5 flex gap-3">
                                            {(['qr', 'logo', 'frame'] as QrKind[]).map((k) => (
                                                <label
                                                    key={k}
                                                    className="flex items-center gap-1.5 text-[12.5px] text-[#1A1410]"
                                                >
                                                    <input
                                                        type="radio"
                                                        name="qrkind"
                                                        checked={modalQrKind === k}
                                                        onChange={() => setModalQrKind(k)}
                                                        className="accent-[#FF5B35]"
                                                    />
                                                    <span className="capitalize">{k}</span>
                                                </label>
                                            ))}
                                        </div>
                                    </div>
                                </div>
                            </div>

                            {/* Footer modal */}
                            <div className="flex flex-wrap items-center justify-end gap-2 border-t border-[#F0E6DA] px-5 py-4">
                                <button
                                    onClick={() => setModalOpen(false)}
                                    className="rounded-lg border border-[#E7D9CB] bg-white px-4 py-2 text-[12.5px] font-semibold text-[#5A4F43] hover:bg-[#FBEDE2]"
                                >
                                    Batal
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        window.open(
                                            buildMenuUrl(baseUrl, selectedOutlet?.slug ?? '', modalNoMeja),
                                            '_blank',
                                            'noopener',
                                        )
                                    }
                                    disabled={!selectedOutlet || !modalNoMeja.trim()}
                                    className="rounded-lg border border-[#FF5B35] bg-white px-4 py-2 text-[12.5px] font-bold text-[#FF5B35] hover:bg-[#FFF3EC] disabled:opacity-40"
                                >
                                    Preview Publik
                                </button>
                                <button
                                    type="button"
                                    onClick={() =>
                                        window.open(
                                            buildMenuUrl(
                                                'http://localhost:8000',
                                                selectedOutlet?.slug ?? '',
                                                modalNoMeja,
                                            ),
                                            '_blank',
                                            'noopener',
                                        )
                                    }
                                    disabled={!selectedOutlet || !modalNoMeja.trim()}
                                    className="rounded-lg border border-[#5A4F43] bg-white px-4 py-2 text-[12.5px] font-bold text-[#5A4F43] hover:bg-[#FBEDE2] disabled:opacity-40"
                                >
                                    Preview Lokal
                                </button>
                                {modalMode === 'edit' && (
                                    <button
                                        onClick={() => deleteTable(modalId!, modalNoMeja)}
                                        disabled={saving}
                                        className="rounded-lg bg-[#FF5B35] px-4 py-2 text-[12.5px] font-bold text-white hover:bg-[#E04E2B] disabled:opacity-50"
                                    >
                                        Hapus
                                    </button>
                                )}
                                <button
                                    onClick={downloadModalQr}
                                    className="rounded-lg bg-[#FF5B35] px-4 py-2 text-[12.5px] font-bold text-white hover:bg-[#E04E2B]"
                                >
                                    Download QR
                                </button>
                                <button
                                    onClick={saveModal}
                                    disabled={saving}
                                    className="rounded-lg bg-[#FF5B35] px-4 py-2 text-[12.5px] font-bold text-white hover:bg-[#E04E2B] disabled:opacity-50"
                                >
                                    {saving ? 'Menyimpan…' : 'Simpan'}
                                </button>
                            </div>
                        </div>
                    </div>
                )}
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
