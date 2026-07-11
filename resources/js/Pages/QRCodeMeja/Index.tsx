import { useState, useMemo } from 'react';
import { Head } from '@inertiajs/react';
import { usePage } from '@inertiajs/react';

import MainLayout from '../../Layouts/MainLayout';
import { Screen, Glass } from '../../Components/Shared';
import { QrCodeIcon, DownloadIcon, PrinterIcon, MapPinIcon, StoreIcon } from '../../Components/icons';

import { RoleGuard } from '../../Components/RoleGuard';
import { QRCodeSVG } from 'qrcode.react';
import { buildMenuUrl } from '../../lib/menuUrl';

type Outlet = { id: number; name: string; slug: string; is_active: boolean };

function QRCodeMejaInner() {
    const { props } = usePage();
    const outlets = (props.outlets as Outlet[]) ?? [];
    const [selectedOutletId, setSelectedOutletId] = useState<number>(outlets[0]?.id ?? 0);
    // Label meja bebas owner (A1, 01, Meja 7, ...), 1 per baris.
    const [tableInput, setTableInput] = useState<string>('A1\nA2\nB1\nB2\nC1');

    const selectedOutlet = outlets.find((o) => o.id === selectedOutletId) ?? outlets[0];

    // Base URL untuk QR: env MENU_BASE_URL (dev/LAN/ngrok) → fallback origin browser.
    const baseUrl = (props.menu_base_url as string) || (typeof window !== 'undefined' ? window.location.origin : '');

    const tables = useMemo(() => {
        return tableInput
            .split('\n')
            .map((s) => s.trim())
            .filter(Boolean)
            .slice(0, 200); // batas wajar per cetak
    }, [tableInput]);

    const tableUrl = (label: string) => (selectedOutlet ? buildMenuUrl(baseUrl, selectedOutlet.slug, label) : '');

    return (
        <MainLayout>
            <Head title="QR Code Meja" />
            <Screen
                title="QR Code Meja"
                action={
                    <button
                        onClick={() => window.print()}
                        className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-4 py-2 text-sm font-medium text-slate-200 transition-colors flex items-center gap-2"
                    >
                        <PrinterIcon className="size-4" />
                        Cetak Semua
                    </button>
                }
            >
                <div className="grid grid-cols-[1fr_320px] gap-5 items-start">
                    {/* Kiri: pilih outlet + input meja */}
                    <Glass className="p-5">
                        <h2 className="text-base font-medium text-slate-200 mb-4 flex items-center gap-2">
                            <StoreIcon className="size-4 text-blue-400" />
                            Pilih Outlet & Meja
                        </h2>

                        {outlets.length === 0 ? (
                            <p className="text-sm text-amber-300">
                                Belum ada outlet. Tambah outlet di Pengaturan Outlet terlebih dahulu.
                            </p>
                        ) : (
                            <div className="mb-4">
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
                        )}

                        <label className="text-xs text-slate-400">
                            Label meja (1 per baris, bebas: A1, 01, Meja 7)
                        </label>
                        <textarea
                            value={tableInput}
                            onChange={(e) => setTableInput(e.target.value)}
                            rows={6}
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
                    </Glass>

                    {/* Kanan: preview + cara pakai */}
                    <div className="space-y-4 sticky top-6">
                        <Glass className="p-5 flex flex-col items-center">
                            <h2 className="text-base font-medium text-slate-200 mb-4">Preview — {tables[0] ?? '—'}</h2>
                            <div className="size-48 bg-white rounded-2xl flex items-center justify-center mb-4 shadow-lg p-3">
                                {selectedOutlet && tables[0] ? (
                                    <QRCodeSVG value={tableUrl(tables[0])} size={160} level="M" />
                                ) : (
                                    <QrCodeIcon className="size-16 text-slate-300" />
                                )}
                            </div>
                            <p className="text-xs text-slate-400 text-center break-all px-2 mb-4">
                                {selectedOutlet && tables[0] ? tableUrl(tables[0]) : 'Pilih outlet & isi meja'}
                            </p>
                            <button
                                onClick={() => window.print()}
                                className="w-full rounded-lg bg-slate-100 hover:bg-white text-slate-900 py-2.5 text-sm font-medium transition-colors flex items-center justify-center gap-2"
                            >
                                <DownloadIcon className="size-4" />
                                Cetak / Unduh
                            </button>
                        </Glass>
                        <Glass className="p-4">
                            <p className="text-xs font-medium text-slate-300 mb-2 flex items-center gap-2">
                                <MapPinIcon className="size-3.5 text-blue-400" />
                                Cara Penggunaan
                            </p>
                            <ol className="space-y-1.5 text-xs text-slate-400 list-decimal list-inside">
                                <li>Pilih outlet, lalu isi label meja (1 per baris)</li>
                                <li>Klik Cetak, pilih meja yang diinginkan</li>
                                <li>Tempel stiker di meja — tamu scan untuk buka menu</li>
                            </ol>
                        </Glass>
                    </div>
                </div>
            </Screen>
        </MainLayout>
    );
}

export default function QRCodeMeja() {
    return (
        <RoleGuard allow={['owner', 'manager', 'admin']}>
            <QRCodeMejaInner />
        </RoleGuard>
    );
}
