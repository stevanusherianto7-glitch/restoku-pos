import { Clock3Icon } from '../../../Components/icons';

type Stage = 'landing' | 'welcome' | 'howto';
type OrderType = 'dine_in' | 'take_away';

interface WelcomeModalProps {
    stage: Stage;
    onStageChange: (s: Stage) => void;
    outletName: string;
    tenantImage: string | null;
    isOutletOpen: boolean;
    outletScheduleMsg: string | null;
    tableNumber: string | null;
    orderType: OrderType;
    setOrderType: (t: OrderType) => void;
    isNanoBanana: boolean;
    isDarkTheme: boolean;
}

export function WelcomeModal(props: WelcomeModalProps) {
    const {
        stage,
        onStageChange,
        outletName,
        tenantImage,
        isOutletOpen,
        outletScheduleMsg,
        tableNumber,
        orderType,
        setOrderType,
        isNanoBanana,
        isDarkTheme,
    } = props;

    const modalStyle = {
        bg: isDarkTheme
            ? isNanoBanana
                ? 'bg-[#111827] border-amber-500/25'
                : 'bg-[#0d2a21] border-[#0F8A4D]/25'
            : 'bg-[#FAF5EE] border-amber-900/10',
        textTitle: isDarkTheme ? 'text-white' : 'text-[#1A1410]',
        textDesc: isDarkTheme ? 'text-slate-300' : 'text-[#7A6F63]',
        accentText: isDarkTheme ? (isNanoBanana ? 'text-amber-400' : 'text-[#0f9f59]') : 'text-[#FF5B35]',
        accentBorder: isDarkTheme
            ? isNanoBanana
                ? 'border-amber-500/30'
                : 'border-[#0F8A4D]/30'
            : 'border-[#FF5B35]/30',
        accentBadgeBg: isDarkTheme
            ? isNanoBanana
                ? 'bg-amber-500/15 border-amber-500/30 text-amber-400'
                : 'bg-[#0F8A4D]/15 border-[#0F8A4D]/30 text-emerald-400'
            : 'bg-[#FF5B35]/15 border-[#FF5B35]/30 text-[#FF5B35]',
        cardBg: isDarkTheme
            ? 'bg-white/5 border-white/10 p-2.5 rounded-2xl'
            : 'border border-amber-900/10 p-2.5 rounded-2xl',
        button: isDarkTheme
            ? isNanoBanana
                ? 'bg-amber-500 text-slate-950 hover:bg-amber-400 shadow-md shadow-amber-500/25'
                : 'bg-[#0F8A4D] hover:bg-[#0c6e3d] text-white shadow-md shadow-[#0F8A4D]/25'
            : 'bg-[#FF5B35] text-white hover:bg-[#E04E2B] shadow-md shadow-[#FF5B35]/25',
        divider: isDarkTheme ? 'border-white/10' : 'border-amber-900/10',
    };

    if (stage === 'landing') {
        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden max-w-md mx-auto">
                <div
                    className={`w-[92%] max-w-sm rounded-3xl ${modalStyle.bg} p-6 text-center shadow-2xl border flex flex-col gap-4 overflow-hidden`}
                >
                    <div className="flex justify-center">
                        <img src="/images/restoku_logo.png" alt="Restoku" className="h-9 w-auto select-none" />
                    </div>
                    <div className={`h-px ${modalStyle.divider} my-1`} />
                    <p className={`text-xs ${modalStyle.textDesc} leading-relaxed`}>
                        Platform pemesanan digital terintegrasi — dari pemesanan langsung dari meja, dapur realtime,
                        hingga sajian tersaji hangat di meja Anda.
                    </p>
                    <div className="mt-1 space-y-2.5 text-left">
                        {[
                            { ic: '▣', t: 'QR Self-Order', d: 'Tamu pesan langsung dari meja' },
                            { ic: '🍴', t: 'Dapur Realtime', d: 'Antrian pesanan otomatis masuk' },
                            { ic: '📊', t: 'Monitor Pesanan', d: 'Pantau semua transaksi live' },
                        ].map((f) => (
                            <div
                                key={f.t}
                                className={`flex items-center gap-3 ${modalStyle.cardBg} p-2.5 rounded-2xl border`}
                            >
                                <div
                                    className={`size-8 rounded-lg border ${modalStyle.accentBorder} grid place-items-center ${modalStyle.accentText} text-sm shrink-0`}
                                >
                                    {f.ic}
                                </div>
                                <div>
                                    <p className={`font-bold text-xs ${modalStyle.textTitle}`}>{f.t}</p>
                                    <p className={`text-[10px] ${modalStyle.textDesc}`}>{f.d}</p>
                                </div>
                            </div>
                        ))}
                    </div>
                    <button
                        onClick={() => onStageChange('welcome')}
                        className={`w-full ${modalStyle.button} border-none rounded-xl py-3 text-xs font-black flex justify-center gap-2 items-center cursor-pointer`}
                    >
                        Masuk ke Menu →
                    </button>
                    <p className={`text-center text-[9px] ${modalStyle.textDesc}`}>© 2025 Restoku App</p>
                </div>
            </div>
        );
    }

    if (stage === 'welcome') {
        return (
            <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden max-w-md mx-auto">
                <div
                    className={`w-[92%] max-w-sm rounded-3xl ${modalStyle.bg} p-6 text-center shadow-2xl border flex flex-col gap-4 overflow-hidden`}
                >
                    {/* IDENTITAS TENANT */}
                    <div className="flex w-full items-center justify-between gap-3">
                        <div className="flex items-center gap-3 min-w-0">
                            {tenantImage ? (
                                <div className="size-14 shrink-0 overflow-hidden rounded-2xl border border-white/10 bg-white/5 shadow-md">
                                    <img src={tenantImage} alt={outletName} className="size-full object-cover" />
                                </div>
                            ) : (
                                <div className="grid size-14 shrink-0 place-items-center overflow-hidden rounded-2xl bg-gradient-to-tr from-[#FF5B35] to-[#E04E2B] text-white shadow-md">
                                    <span className="text-lg font-black leading-none px-1 text-center">
                                        {outletName.slice(0, 2).toUpperCase()}
                                    </span>
                                </div>
                            )}
                            <div className="min-w-0">
                                <p
                                    className={`text-[9px] font-bold tracking-[0.22em] uppercase ${modalStyle.accentText}`}
                                >
                                    Selamat Datang di
                                </p>
                                <h2
                                    className={`font-serif text-xl leading-tight font-extrabold ${modalStyle.textTitle} truncate`}
                                >
                                    {outletName}
                                </h2>
                            </div>
                        </div>
                        <img
                            src="/images/halal-indonesia.svg"
                            alt="Halal Indonesia"
                            className="h-10 w-auto shrink-0 select-none"
                        />
                    </div>
                    <p className={`text-[11px] ${modalStyle.textDesc} leading-relaxed`}>
                        Sajian otentik khas Nusantara yang kini hadir lebih dekat. Resmi bersertifikat Halal & tanpa
                        MSG. Selamat menikmati!
                    </p>
                    {/* Notice operasional: Buka/Tutup */}
                    {!isOutletOpen ? (
                        <div
                            className={`w-full ${modalStyle.cardBg} rounded-2xl p-3 flex items-center gap-2 border border-rose-500/30`}
                        >
                            <Clock3Icon className="size-4 shrink-0 text-rose-400" />
                            <div className="text-left">
                                <p className={`text-[11px] font-extrabold ${modalStyle.accentText}`}>
                                    Pemesanan Online Ditutup
                                </p>
                                <p className={`text-[10px] ${modalStyle.textDesc}`}>
                                    {outletScheduleMsg || 'Restoran sedang di luar jam operasional.'}
                                </p>
                            </div>
                        </div>
                    ) : (
                        outletScheduleMsg && (
                            <div
                                className={`w-full ${modalStyle.cardBg} rounded-2xl p-3 flex items-center gap-2 border border-emerald-500/20`}
                            >
                                <Clock3Icon className="size-4 shrink-0 text-emerald-400" />
                                <span className={`text-[10px] ${modalStyle.textDesc}`}>{outletScheduleMsg}</span>
                            </div>
                        )
                    )}
                    <div
                        className={`w-full ${modalStyle.cardBg} rounded-2xl p-3 flex items-center justify-between text-left border`}
                    >
                        <div>
                            <p className={`text-[9px] font-extrabold tracking-wider ${modalStyle.accentText}`}>
                                📍 NOMOR MEJA ANDA
                            </p>
                            <p className={`text-base font-extrabold ${modalStyle.textTitle} mt-0.5`}>
                                Meja {tableNumber ?? 'A3'}
                            </p>
                        </div>
                        <span
                            className={`px-2.5 py-1 rounded-full bg-[#0F8A4D]/10 ${modalStyle.accentText} text-[9px] font-extrabold flex items-center gap-1`}
                        >
                            ✓ Terverifikasi
                        </span>
                    </div>
                    <div className="w-full text-left">
                        <p
                            className={`text-[10px] font-extrabold tracking-wider ${modalStyle.textDesc} text-left mb-1.5`}
                        >
                            PILIH TIPE PESANAN
                        </p>
                        <div className={`flex gap-3`}>
                            <button
                                onClick={() => setOrderType('dine_in')}
                                className={`flex-1 rounded-2xl py-3 text-white font-extrabold border-[3px] transition-all flex flex-col items-center justify-center ${orderType === 'dine_in' ? 'border-[#FF5B35] bg-gradient-to-br from-[#7C3AED] to-[#FF5B35]' : 'border-transparent bg-gradient-to-br from-[#7C3AED] to-[#FF5B35] opacity-60'}`}
                            >
                                <span className="text-lg">🪑</span>
                                <span className="text-[11px] block mt-0.5">Dine In</span>
                                <span className="text-[8px] font-medium opacity-80 block">Makan di tempat</span>
                            </button>
                            <button
                                onClick={() => setOrderType('take_away')}
                                className={`flex-1 rounded-2xl py-3 text-white font-extrabold border-[3px] transition-all flex flex-col items-center justify-center ${orderType === 'take_away' ? 'border-[#FF5B35] bg-gradient-to-br from-[#DB2777] to-[#F97316]' : 'border-transparent bg-gradient-to-br from-[#DB2777] to-[#F97316] opacity-60'}`}
                            >
                                <span className="text-lg">🥡</span>
                                <span className="text-[11px] block mt-0.5">Take Away</span>
                                <span className="text-[8px] font-medium opacity-80 block">Dibawa pulang</span>
                            </button>
                        </div>
                    </div>
                    <button
                        onClick={() => onStageChange('howto')}
                        className={`w-full ${modalStyle.button} border-none rounded-xl py-3 text-xs font-black cursor-pointer`}
                    >
                        Lanjut →
                    </button>
                </div>
            </div>
        );
    }

    // howto
    return (
        <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm flex items-center justify-center p-4 overflow-hidden max-w-md mx-auto">
            <div
                className={`w-[92%] max-w-sm rounded-3xl ${modalStyle.bg} p-6 text-center shadow-2xl border flex flex-col gap-4 overflow-hidden text-[#1A1410]`}
            >
                <h2 className={`text-xl font-extrabold ${modalStyle.textTitle}`}>Cara Memesan</h2>
                <p className={`text-[11px] ${modalStyle.textDesc} -mt-2`}>
                    Cukup 3 langkah mudah, pesanan langsung masuk dapur!
                </p>
                <div className="flex flex-col gap-2.5">
                    {[
                        {
                            n: 1,
                            bg: isDarkTheme
                                ? 'bg-white/5 border-white/5 text-slate-300'
                                : 'bg-[#F4EEFD] border-[#7C3AED]/10 text-[#7C3AED]',
                            t: 'Pilih Menu Favorit',
                            d: 'Tekan menu yang kamu inginkan, lihat foto & harga lengkap',
                        },
                        {
                            n: 2,
                            bg: isDarkTheme
                                ? 'bg-white/5 border-white/5 text-slate-300'
                                : 'bg-[#FFF1E9] border-[#FF5B35]/10 text-[#FF5B35]',
                            t: 'Masuk ke Keranjang',
                            d: 'Tambah qty, tulis catatan khusus untuk chef jika perlu',
                        },
                        {
                            n: 3,
                            bg: isDarkTheme
                                ? 'bg-white/5 border-white/5 text-slate-300'
                                : 'bg-[#EAF7EF] border-[#0F8A4D]/10 text-[#0F8A4D]',
                            t: 'Kirim Pesanan',
                            d: 'Tekan "Pesan Sekarang" — pesanan langsung diterima dapur!',
                        },
                    ].map((s) => (
                        <div key={s.n} className={`rounded-2xl p-3 flex gap-3 items-start border text-left ${s.bg}`}>
                            <div
                                className={`size-5 rounded-full ${isDarkTheme ? 'bg-emerald-500 text-slate-950' : 'bg-current text-white'} font-extrabold grid place-items-center text-[10px] shrink-0`}
                            >
                                <span className={isDarkTheme ? 'text-slate-900 font-bold' : 'text-white font-bold'}>
                                    {s.n}
                                </span>
                            </div>
                            <div>
                                <p className={`font-extrabold text-[12px] ${modalStyle.textTitle}`}>{s.t}</p>
                                <p className={`text-[10px] ${modalStyle.textDesc} mt-0.5`}>{s.d}</p>
                            </div>
                        </div>
                    ))}
                </div>
                <div
                    className={`flex items-center justify-between ${modalStyle.cardBg} border rounded-2xl p-3 text-[11px] mt-1`}
                >
                    <span className={modalStyle.textDesc}>🪑 Tipe pesanan</span>
                    <b className={modalStyle.textTitle}>{orderType === 'dine_in' ? 'Dine In' : 'Take Away'}</b>
                    <span
                        className={`${modalStyle.accentText} font-extrabold cursor-pointer`}
                        onClick={() => onStageChange('welcome')}
                    >
                        Ubah
                    </span>
                </div>
                <button
                    onClick={() => onStageChange('app')}
                    className={`w-full ${modalStyle.button} border-none rounded-xl py-3 text-xs font-black cursor-pointer flex justify-center gap-2 items-center`}
                >
                    ✨ Mulai Pesan Sekarang!
                </button>
            </div>
        </div>
    );
}
