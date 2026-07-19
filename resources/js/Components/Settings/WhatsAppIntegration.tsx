import { useState } from 'react';
import {
    MessageCircleIcon,
    StoreIcon,
    PrinterIcon,
    QrCodeIcon,
    CopyIcon,
    CheckCircle2Icon,
    AlertTriangleIcon,
    MessageSquareIcon,
    PhoneCallIcon,
} from '../icons';
import { Screen, Glass, Badge, planHasFeature } from '../Shared';
import { FeatureLock } from '../shared/FeatureLock';

// ─── WhatsApp API ─────────────────────────────────────────────────────────────
export function WhatsAppIntegration() {
    const [isConnected, setIsConnected] = useState(false);
    const [isConnecting, setIsConnecting] = useState(false);

    const handleConnect = () => {
        setIsConnecting(true);
        // Simulate Meta OAuth flow
        setTimeout(() => {
            setIsConnected(true);
            setIsConnecting(false);
        }, 1500);
    };

    const content = (
        <Screen title="WhatsApp Business API">
            <div className="grid grid-cols-[240px_1fr] gap-5 items-start">
                <Glass className="p-3">
                    <div className="space-y-1">
                        {[
                            { label: 'Profil Toko', Icon: StoreIcon },
                            { label: 'WhatsApp API', Icon: MessageCircleIcon },
                            { label: 'PrinterIcon', Icon: PrinterIcon },
                            { label: 'QR Code Meja', Icon: QrCodeIcon },
                        ].map(({ label, Icon }) => (
                            <button
                                key={label}
                                type="button"
                                className={`flex w-full items-center gap-3 rounded-lg px-3 py-2 text-sm font-medium text-left transition-colors ${label === 'WhatsApp API' ? 'bg-white/10 text-white' : 'text-slate-400 hover:bg-white/5 hover:text-slate-300'}`}
                            >
                                <Icon className="size-4" />
                                {label}
                            </button>
                        ))}
                    </div>
                </Glass>
                <div className="space-y-5">
                    {/* Connection Status */}
                    <Glass className="p-6">
                        <h2 className="mb-5 text-base font-medium text-slate-200">Koneksi Meta Business</h2>
                        {!isConnected ? (
                            <div className="flex flex-col items-center justify-center py-8 px-4 border border-dashed border-white/20 rounded-xl bg-white/5">
                                <MessageSquareIcon className="size-10 text-slate-400 mb-4" />
                                <h3 className="text-sm font-medium text-white mb-2">Hubungkan WhatsApp Business</h3>
                                <p className="text-xs text-slate-400 text-center max-w-md mb-6">
                                    Integrasikan nomor WhatsApp Anda dengan Meta Cloud API untuk mengirim notifikasi
                                    pesanan, OTP, dan laporan harian secara otomatis.
                                </p>
                                <button
                                    onClick={handleConnect}
                                    disabled={isConnecting}
                                    className="rounded-lg bg-[#25D366] hover:bg-[#1DA851] text-white px-6 py-2.5 text-sm font-bold transition-colors flex items-center gap-2"
                                >
                                    {isConnecting ? 'Menghubungkan...' : 'Hubungkan dengan Meta'}
                                </button>
                            </div>
                        ) : (
                            <div className="space-y-6">
                                <div className="flex items-center justify-between p-4 rounded-xl border border-emerald-500/20 bg-emerald-500/10">
                                    <div className="flex items-center gap-4">
                                        <div className="size-12 rounded-full bg-[#25D366] flex items-center justify-center shadow-lg">
                                            <PhoneCallIcon className="size-6 text-white" />
                                        </div>
                                        <div>
                                            <h3 className="text-sm font-bold text-white flex items-center gap-2">
                                                WhatsApp Business Terhubung{' '}
                                                <CheckCircle2Icon className="size-4 text-emerald-400" />
                                            </h3>
                                            <p className="text-xs text-emerald-200/70 mt-1">
                                                Status Webhook: Aktif & Menerima Pesan
                                            </p>
                                        </div>
                                    </div>
                                    <button
                                        onClick={() => setIsConnected(false)}
                                        className="text-xs font-medium text-red-400 hover:text-red-300 transition-colors bg-white/5 px-3 py-1.5 rounded-lg border border-white/10"
                                    >
                                        Putuskan Koneksi
                                    </button>
                                </div>

                                <div className="grid grid-cols-2 gap-5">
                                    {[
                                        ['Business Phone ID', '109824-RESTOKU-ID'],
                                        ['WABA ID', '987654321012345'],
                                        ['Nomor WhatsApp Aktif', '+62 812-3456-7890'],
                                    ].map(([label, val]) => (
                                        <div key={label} className="space-y-1.5">
                                            <label className="text-xs font-medium text-slate-400">{label}</label>
                                            <input
                                                className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 outline-none focus:border-white/20 transition-colors"
                                                defaultValue={val}
                                                readOnly
                                            />
                                        </div>
                                    ))}
                                    <div className="col-span-2 space-y-1.5">
                                        <label className="text-xs font-medium text-slate-400">
                                            Webhook URL (Otomatis Didaftarkan)
                                        </label>
                                        <div className="flex items-center gap-3">
                                            <input
                                                className="flex-1 rounded-lg border border-emerald-500/30 bg-emerald-500/5 px-3 py-2 text-sm text-emerald-200 outline-none"
                                                defaultValue="https://api.restoku.id/wa/webhook"
                                                readOnly
                                            />
                                            <button
                                                className="rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 px-3 py-2 text-slate-400 hover:text-white transition-colors"
                                                title="Salin"
                                            >
                                                <CopyIcon className="size-4" />
                                            </button>
                                        </div>
                                    </div>
                                </div>
                            </div>
                        )}
                    </Glass>

                    {/* Configuration & Templates */}
                    {isConnected && (
                        <>
                            <Glass className="p-6">
                                <div className="flex justify-between items-center mb-5">
                                    <h2 className="text-base font-medium text-slate-200">Template Notifikasi Aktif</h2>
                                    <Badge tone="blue">Disetujui Meta</Badge>
                                </div>
                                <div className="space-y-3">
                                    {[
                                        {
                                            label: 'Pesanan Diterima (order_confirmed)',
                                            template:
                                                'Halo {{1}}, pesanan Anda di Restoku telah diterima ✅\nNo. Order: {{2}}\nTotal: {{3}}',
                                            tone: 'emerald' as const,
                                        },
                                        {
                                            label: 'Pesanan Siap (order_ready)',
                                            template:
                                                'Halo {{1}}, pesanan Anda sudah siap! 🎉\nNo. Order: {{2}}\nMeja: {{3}}',
                                            tone: 'blue' as const,
                                        },
                                        {
                                            label: 'Pembayaran Sukses (payment_received)',
                                            template: 'Pembayaran Rp {{2}} via {{3}} untuk #{1} berhasil.',
                                            tone: 'emerald' as const,
                                        },
                                        {
                                            label: 'Kode OTP (wa_otp)',
                                            template: 'Kode verifikasi Restoku Anda: {{1}}\nKode berlaku 5 menit.',
                                            tone: 'amber' as const,
                                        },
                                    ].map(({ label, template, tone }) => (
                                        <div
                                            key={label}
                                            className="rounded-xl border border-white/5 bg-white/[0.02] p-4"
                                        >
                                            <div className="flex items-center justify-between mb-3">
                                                <span className="text-sm font-medium text-slate-200">{label}</span>
                                                <Badge tone={tone}>Active</Badge>
                                            </div>
                                            <div className="text-[11px] text-slate-400 font-mono whitespace-pre-wrap bg-black/20 p-3 rounded-lg border border-white/5">
                                                {template}
                                            </div>
                                        </div>
                                    ))}
                                </div>
                                <div className="mt-5 rounded-xl border border-blue-500/20 bg-blue-500/10 p-4 flex gap-3">
                                    <AlertTriangleIcon className="size-5 text-blue-400 shrink-0" />
                                    <p className="text-xs text-blue-200 leading-relaxed">
                                        Pengajuan template baru harus dilakukan melalui Meta Business Suite. Restoku
                                        akan secara otomatis mensinkronisasi template yang disetujui setiap hari.
                                    </p>
                                </div>
                            </Glass>

                            <Glass className="p-6">
                                <h2 className="mb-4 text-base font-medium text-slate-200">Testing Notifikasi</h2>
                                <div className="space-y-4">
                                    <div className="space-y-1.5">
                                        <label className="text-xs font-medium text-slate-400">
                                            Nomor Tujuan (Gunakan format 62xxx)
                                        </label>
                                        <input
                                            className="w-full rounded-lg border border-white/10 bg-white/5 px-3 py-2 text-sm text-slate-200 outline-none focus:border-white/20 transition-colors"
                                            defaultValue="628123456789"
                                        />
                                    </div>
                                    <button className="rounded-lg bg-slate-100 hover:bg-white px-6 py-2 text-sm font-medium text-slate-900 transition-colors">
                                        Kirim Pesan Uji Coba
                                    </button>
                                </div>
                            </Glass>
                        </>
                    )}
                </div>
            </div>
        </Screen>
    );

    // MOCK_PLAN is 'pro' in App.tsx
    return planHasFeature('pro', 'wa_notif') ? (
        content
    ) : (
        <Screen title="WhatsApp Business API">
            <FeatureLock requiredPlan="pro">{content}</FeatureLock>
        </Screen>
    );
}
