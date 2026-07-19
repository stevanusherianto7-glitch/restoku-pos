import { CalendarDaysIcon, CheckCircle2Icon } from '../../../Components/icons';

interface ReservationPanelProps {
    reservationSuccess: boolean;
    setReservationSuccess: (v: boolean) => void;
    rName: string;
    setRName: (v: string) => void;
    rPhone: string;
    setRPhone: (v: string) => void;
    rDate: string;
    setRDate: (v: string) => void;
    rTime: string;
    setRTime: (v: string) => void;
    rGuests: string;
    setRGuests: (v: string) => void;
    rType: string;
    setRType: (v: string) => void;
    rNotes: string;
    setRNotes: (v: string) => void;
    isSubmittingR: boolean;
    handleReservationSubmit: (e: React.FormEvent) => void;
    setActiveTab: (t: 'menu' | 'cart' | 'reservasi' | 'galeri' | 'status') => void;
}

const fieldCls =
    'w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/25 transition-all';
const labelCls = 'block text-[10px] font-extrabold text-slate-400 uppercase tracking-wider';

export function ReservationPanel(p: ReservationPanelProps) {
    if (p.reservationSuccess) {
        return (
            <main className="flex-1 p-5 pb-28 flex flex-col justify-between overflow-y-auto">
                <div className="space-y-4">
                    <h2 className="text-base font-extrabold text-white flex items-center gap-2 mb-2">
                        <CalendarDaysIcon className="size-5 text-emerald-400" /> Booking & Reservasi
                    </h2>
                    <div className="py-12 px-4 text-center space-y-4 bg-emerald-950/10 border border-emerald-500/20 rounded-3xl animate-in fade-in duration-300">
                        <div className="size-16 bg-emerald-500/10 rounded-full flex items-center justify-center border border-emerald-500/20 mx-auto">
                            <CheckCircle2Icon className="size-8 text-emerald-400" />
                        </div>
                        <div className="space-y-1">
                            <h3 className="text-sm font-bold text-white">Reservasi Terkirim!</h3>
                            <p className="text-xs text-slate-400 leading-relaxed">
                                Terima kasih {p.rName}. Pengajuan reservasi Anda pada {p.rDate} pukul {p.rTime} sedang
                                ditinjau oleh staf kami.
                            </p>
                        </div>
                        <button
                            onClick={() => {
                                p.setReservationSuccess(false);
                                p.setRName('');
                                p.setRPhone('');
                                p.setRDate('');
                                p.setRTime('');
                                p.setRNotes('');
                                p.setActiveTab('menu');
                            }}
                            className="px-5 py-2.5 bg-emerald-500 text-slate-950 rounded-xl text-xs font-bold hover:bg-emerald-400 transition-colors"
                        >
                            Kembali ke Menu
                        </button>
                    </div>
                </div>
            </main>
        );
    }

    return (
        <main className="flex-1 p-5 pb-28 flex flex-col justify-between overflow-y-auto">
            <div className="space-y-4">
                <h2 className="text-base font-extrabold text-white flex items-center gap-2 mb-2">
                    <CalendarDaysIcon className="size-5 text-emerald-400" /> Booking & Reservasi
                </h2>
                <form onSubmit={p.handleReservationSubmit} className="space-y-3.5">
                    <div className="space-y-1.5">
                        <label className={labelCls}>Nama Lengkap</label>
                        <input
                            type="text"
                            required
                            value={p.rName}
                            onChange={(e) => p.setRName(e.target.value)}
                            placeholder="Masukkan nama Anda"
                            className={fieldCls}
                        />
                    </div>
                    <div className="space-y-1.5">
                        <label className={labelCls}>Nomor WhatsApp / HP</label>
                        <input
                            type="tel"
                            required
                            value={p.rPhone}
                            onChange={(e) => p.setRPhone(e.target.value)}
                            placeholder="Contoh: 08123456789"
                            className={fieldCls}
                        />
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className={labelCls}>Tanggal</label>
                            <input
                                type="date"
                                required
                                value={p.rDate}
                                onChange={(e) => p.setRDate(e.target.value)}
                                className={`${fieldCls} px-3`}
                            />
                        </div>
                        <div className="space-y-1.5">
                            <label className={labelCls}>Jam</label>
                            <input
                                type="time"
                                required
                                value={p.rTime}
                                onChange={(e) => p.setRTime(e.target.value)}
                                className={`${fieldCls} px-3`}
                            />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-3">
                        <div className="space-y-1.5">
                            <label className={labelCls}>Jumlah Tamu</label>
                            <select
                                value={p.rGuests}
                                onChange={(e) => p.setRGuests(e.target.value)}
                                className={`${fieldCls} px-3`}
                            >
                                <option value="1">1 Orang</option>
                                <option value="2">2 Orang</option>
                                <option value="4">4 Orang</option>
                                <option value="6">6 Orang</option>
                                <option value="8">8 Orang</option>
                                <option value="10">10 Orang</option>
                                <option value="20">20+ Orang</option>
                                <option value="50">50+ Orang</option>
                                <option value="100">100+ Orang (Event)</option>
                            </select>
                        </div>
                        <div className="space-y-1.5">
                            <label className={labelCls}>Jenis Acara</label>
                            <select
                                value={p.rType}
                                onChange={(e) => p.setRType(e.target.value)}
                                className={`${fieldCls} px-3`}
                            >
                                <option value="meja">Makan Biasa</option>
                                <option value="ulang_tahun">Ulang Tahun</option>
                                <option value="gathering">Gathering / Arisan</option>
                                <option value="pernikahan">Tunangan / Pernikahan</option>
                                <option value="acara_kantor">Acara Kantor</option>
                                <option value="lainnya">Lainnya</option>
                            </select>
                        </div>
                    </div>
                    <div className="space-y-1.5">
                        <label className={labelCls}>Catatan Khusus</label>
                        <textarea
                            value={p.rNotes}
                            onChange={(e) => p.setRNotes(e.target.value)}
                            placeholder="Dekorasi khusus, kebutuhan kursi bayi, atau menu pre-order..."
                            className="w-full h-20 rounded-xl border border-white/10 bg-white/5 px-4 py-2.5 text-xs text-slate-200 outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/25 transition-all resize-none"
                        />
                    </div>
                    <button
                        type="submit"
                        disabled={p.isSubmittingR}
                        className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 mt-4 shadow-lg shadow-emerald-500/10 disabled:opacity-50"
                    >
                        {p.isSubmittingR ? 'Mengirim...' : 'Kirim Pengajuan Reservasi'}
                    </button>
                </form>
            </div>
        </main>
    );
}
