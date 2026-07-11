import { useState } from 'react';
import { Screen, Glass, Button, useTenantSettings } from '../Shared';
import { Volume2, Mic, Play, Square, Settings2, Globe, Save, CheckCircle2 } from 'lucide-react';
import { useTTS } from '../../Hooks/useTTS';

export function TTSSettings() {
    const [saved, setSaved] = useState(false);
    const { isLight } = useTenantSettings();

    // Settings State
    const [config, setConfig] = useState({
        enabled: true,
        volume: 0.75,
        rate: 0.95,
        engine: 'browser',
        events: {
            orderReady: true,
            welcomeScan: true,
            queueCall: true,
            promo: false,
        },
    });

    const { speak, stop, isSpeaking, voices } = useTTS({
        volume: config.volume,
        rate: config.rate,
        lang: 'id-ID',
    });

    const handleSave = () => {
        setSaved(true);
        setTimeout(() => setSaved(false), 3000);
    };

    const demoTexts = {
        orderReady: 'Pesanan untuk Meja 5 atas nama Budi sudah siap, silakan diambil di kasir.',
        welcomeScan: 'Selamat datang di Restoku. Silakan pesan makanan dan minuman melalui HP Anda.',
        queueCall: 'Nomor antrean 23, pesanan Anda sudah siap.',
        promo: 'Halo! Hari ini ada promo buy 1 get 1 untuk semua minuman.',
    };

    const playDemo = (key: keyof typeof demoTexts) => {
        if (isSpeaking) {
            stop();
        } else {
            speak(demoTexts[key]);
        }
    };

    return (
        <Screen
            title="Pengaturan Text-to-Speech (TTS)"
            action={
                <Button className="bg-emerald-600 hover:bg-emerald-700 gap-2 text-white font-bold" onClick={handleSave}>
                    {saved ? <CheckCircle2 className="size-4" /> : <Save className="size-4" />}
                    {saved ? 'Tersimpan' : 'Simpan Pengaturan'}
                </Button>
            }
        >
            <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in slide-in-from-bottom-4 duration-500">
                {/* Main Toggle */}
                <Glass
                    className={`p-6 border ${isLight ? 'border-emerald-300 bg-emerald-50 shadow-sm' : 'border-emerald-500/30 bg-emerald-950/20'}`}
                >
                    <div className="flex items-center justify-between">
                        <div className="flex items-center gap-4">
                            <div
                                className={`p-3 rounded-xl ${config.enabled ? (isLight ? 'bg-emerald-600 text-white shadow-md' : 'bg-emerald-500 text-white') : isLight ? 'bg-slate-200 text-slate-500' : 'bg-slate-800 text-slate-400'}`}
                            >
                                <Volume2 className="size-6" />
                            </div>
                            <div>
                                <h2 className={`text-xl font-bold mb-1 ${isLight ? 'text-slate-900' : 'text-white'}`}>
                                    Aktifkan Pengumuman Suara
                                </h2>
                                <p className={`text-sm ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                                    Sistem akan membacakan notifikasi pesanan dan sapaan melalui speaker kasir/dapur.
                                </p>
                            </div>
                        </div>
                        <label className="relative inline-flex items-center cursor-pointer">
                            <input
                                type="checkbox"
                                className="sr-only peer"
                                checked={config.enabled}
                                onChange={(e) => setConfig({ ...config, enabled: e.target.checked })}
                            />
                            <div className="w-14 h-7 bg-slate-700 peer-focus:outline-none rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-6 after:w-6 after:transition-all peer-checked:bg-emerald-500"></div>
                        </label>
                    </div>
                </Glass>

                <div
                    className={`grid grid-cols-1 md:grid-cols-2 gap-6 transition-opacity duration-300 ${!config.enabled && 'opacity-50 pointer-events-none'}`}
                >
                    {/* Audio Controls */}
                    <Glass className="p-6 space-y-6">
                        <h3
                            className={`text-lg font-bold flex items-center gap-2 mb-4 ${isLight ? 'text-slate-900' : 'text-white'}`}
                        >
                            <Settings2 className="size-5 text-[var(--color-primary)]" /> Kontrol Suara
                        </h3>

                        <div className="space-y-4">
                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className={isLight ? 'text-slate-700 font-bold' : 'text-slate-300'}>
                                        Volume Pengumuman
                                    </span>
                                    <span
                                        className={`font-bold ${isLight ? 'text-[var(--color-primary)]' : 'text-[var(--color-primary)]'}`}
                                    >
                                        {Math.round(config.volume * 100)}%
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0"
                                    max="1"
                                    step="0.05"
                                    value={config.volume}
                                    onChange={(e) => setConfig({ ...config, volume: parseFloat(e.target.value) })}
                                    className={`w-full accent-blue-500 h-2 rounded-lg appearance-none cursor-pointer ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}
                                />
                            </div>

                            <div>
                                <div className="flex justify-between text-sm mb-2">
                                    <span className={isLight ? 'text-slate-700 font-bold' : 'text-slate-300'}>
                                        Kecepatan Bicara
                                    </span>
                                    <span
                                        className={`font-bold ${isLight ? 'text-[var(--color-primary)]' : 'text-[var(--color-primary)]'}`}
                                    >
                                        {config.rate}x
                                    </span>
                                </div>
                                <input
                                    type="range"
                                    min="0.5"
                                    max="2"
                                    step="0.05"
                                    value={config.rate}
                                    onChange={(e) => setConfig({ ...config, rate: parseFloat(e.target.value) })}
                                    className={`w-full accent-blue-500 h-2 rounded-lg appearance-none cursor-pointer ${isLight ? 'bg-slate-200' : 'bg-slate-800'}`}
                                />
                                <div
                                    className={`flex justify-between text-xs mt-1 ${isLight ? 'text-slate-500 font-medium' : 'text-slate-500'}`}
                                >
                                    <span>Lambat</span>
                                    <span>Normal</span>
                                    <span>Cepat</span>
                                </div>
                            </div>
                        </div>

                        <div className={`pt-4 border-t space-y-3 ${isLight ? 'border-slate-200' : 'border-white/10'}`}>
                            <h4
                                className={`text-sm font-medium mb-2 ${isLight ? 'text-slate-800 font-bold' : 'text-slate-300'}`}
                            >
                                Engine TTS
                            </h4>
                            <div className="flex gap-3">
                                <button
                                    className={`flex-1 py-3 px-4 rounded-xl border flex flex-col items-center gap-1 transition-all ${config.engine === 'browser' ? (isLight ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)] font-bold shadow-sm' : 'bg-[var(--color-primary)]/20 border-[var(--color-primary)] text-[var(--color-primary)]') : isLight ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50' : 'bg-slate-900 border-white/10 text-slate-400 hover:bg-white/5'}`}
                                    onClick={() => setConfig({ ...config, engine: 'browser' })}
                                >
                                    <Globe className="size-5 mb-1" />
                                    <span className="font-semibold text-sm">Browser API</span>
                                    <span className="text-[10px] opacity-70">Gratis & Offline</span>
                                </button>
                                <button
                                    className={`flex-1 py-3 px-4 rounded-xl border flex flex-col items-center gap-1 transition-all ${config.engine === 'google' ? (isLight ? 'bg-[var(--color-primary)]/10 border-[var(--color-primary)] text-[var(--color-primary)] font-bold shadow-sm' : 'bg-[var(--color-primary)]/20 border-[var(--color-primary)] text-[var(--color-primary)]') : isLight ? 'bg-white border-slate-300 text-slate-600 hover:bg-slate-50' : 'bg-slate-900 border-white/10 text-slate-400 hover:bg-white/5'}`}
                                    onClick={() => setConfig({ ...config, engine: 'google' })}
                                >
                                    <Mic className="size-5 mb-1" />
                                    <span className="font-semibold text-sm">Google Cloud</span>
                                    <span className="text-[10px] opacity-70">Natural (Premium)</span>
                                </button>
                            </div>
                            {config.engine === 'google' && (
                                <div
                                    className={`p-3 rounded-lg text-xs mt-3 border ${isLight ? 'bg-amber-50 border-amber-300 text-amber-900 font-semibold' : 'bg-amber-500/10 border-amber-500/20 text-amber-300'}`}
                                >
                                    Google Cloud TTS membutuhkan konfigurasi API Key tambahan pada backend.
                                </div>
                            )}
                        </div>
                    </Glass>

                    {/* Trigger Events */}
                    <Glass className="p-6">
                        <h3
                            className={`text-lg font-bold flex items-center gap-2 mb-6 ${isLight ? 'text-slate-900' : 'text-white'}`}
                        >
                            <Volume2 className="size-5 text-emerald-500" /> Skenario & Uji Coba
                        </h3>

                        <div className="space-y-4">
                            {[
                                {
                                    key: 'orderReady',
                                    label: 'Pesanan Siap Diambil',
                                    desc: 'Saat staff klik "Siap Diambil" di KDS.',
                                },
                                { key: 'queueCall', label: 'Panggilan Antrean', desc: 'Untuk order Takeaway.' },
                                {
                                    key: 'welcomeScan',
                                    label: 'Sambutan Scan QR',
                                    desc: 'Diucapkan di HP tamu (opsional).',
                                },
                                { key: 'promo', label: 'Pengumuman Promo', desc: 'Otomatis saat jam sepi.' },
                            ].map((event) => (
                                <div
                                    key={event.key}
                                    className={`p-4 rounded-xl border flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${isLight ? 'bg-white border-slate-200 shadow-sm' : 'bg-white/5 border-white/10'}`}
                                >
                                    <div className="flex items-start gap-3">
                                        <input
                                            type="checkbox"
                                            className={`mt-1 w-4 h-4 rounded text-emerald-500 focus:ring-emerald-500 focus:ring-offset-slate-900 ${isLight ? 'border-slate-300 bg-white' : 'border-slate-600 bg-slate-800'}`}
                                            checked={config.events[event.key as keyof typeof config.events]}
                                            onChange={(e) =>
                                                setConfig({
                                                    ...config,
                                                    events: { ...config.events, [event.key]: e.target.checked },
                                                })
                                            }
                                        />
                                        <div>
                                            <div
                                                className={`text-sm font-medium ${isLight ? 'text-slate-900 font-bold' : 'text-white'}`}
                                            >
                                                {event.label}
                                            </div>
                                            <div className={`text-xs ${isLight ? 'text-slate-600' : 'text-slate-400'}`}>
                                                {event.desc}
                                            </div>
                                        </div>
                                    </div>

                                    <Button
                                        variant="outline"
                                        size="sm"
                                        className={`shrink-0 ${isSpeaking ? (isLight ? 'border-red-400 text-red-700 bg-red-50' : 'border-red-500 text-red-400 hover:bg-red-500/10') : isLight ? 'border-emerald-400 text-emerald-700 bg-emerald-50 hover:bg-emerald-100' : 'border-emerald-500/30 text-emerald-400 hover:bg-emerald-500/10'}`}
                                        onClick={() => playDemo(event.key as keyof typeof demoTexts)}
                                    >
                                        {isSpeaking ? (
                                            <>
                                                <Square className="size-3 mr-2" /> Stop
                                            </>
                                        ) : (
                                            <>
                                                <Play className="size-3 mr-2" /> Dengarkan
                                            </>
                                        )}
                                    </Button>
                                </div>
                            ))}
                        </div>

                        <div
                            className={`mt-6 p-4 rounded-xl border ${isLight ? 'bg-slate-100 border-slate-300' : 'bg-slate-900 border-slate-700'}`}
                        >
                            <h4
                                className={`text-xs font-semibold uppercase tracking-wider mb-2 ${isLight ? 'text-slate-700' : 'text-slate-400'}`}
                            >
                                Browser Support Status
                            </h4>
                            <div className="flex items-center gap-2 text-sm">
                                {'speechSynthesis' in window ? (
                                    <>
                                        <CheckCircle2 className="size-4 text-emerald-500" />{' '}
                                        <span className={isLight ? 'text-emerald-800 font-bold' : 'text-emerald-400'}>
                                            Web Speech API Tersedia
                                        </span>
                                    </>
                                ) : (
                                    <span className="text-red-500 font-bold">
                                        Browser tidak mendukung Web Speech API
                                    </span>
                                )}
                            </div>
                            <div className={`text-xs mt-1 ${isLight ? 'text-slate-600' : 'text-slate-500'}`}>
                                Suara Indonesia: {voices.some((v) => v.lang.includes('id')) ? 'Ditemukan' : 'Default'}
                            </div>
                        </div>
                    </Glass>
                </div>
            </div>
        </Screen>
    );
}
