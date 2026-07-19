import { CalendarIcon, ImageIcon, SparklesIcon } from '../../../Components/icons';

interface GalleryPanelProps {
    setActiveTab: (t: 'menu' | 'cart' | 'reservasi' | 'galeri' | 'status') => void;
}

export function GalleryPanel({ setActiveTab }: GalleryPanelProps) {
    return (
        <main className="flex-1 p-5 pb-28 flex flex-col justify-between overflow-y-auto space-y-6">
            <div className="space-y-4">
                <div className="relative rounded-3xl overflow-hidden border border-white/10 bg-gradient-to-r from-emerald-950/40 to-slate-950 p-5 shadow-2xl">
                    <div className="absolute -top-10 -right-10 size-32 bg-emerald-500/10 rounded-full blur-2xl" />
                    <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[8px] font-bold text-emerald-400 tracking-wider uppercase mb-2">
                        <SparklesIcon className="size-2.5" /> Event & Venue Booking
                    </span>
                    <h2 className="text-sm font-extrabold text-white">Booking Tempat & Acara</h2>
                    <p className="text-[11px] text-slate-400 mt-1 leading-relaxed">
                        Kami menyediakan paket ruang eksklusif dan menu khusus untuk melengkapi momen spesial Anda.
                    </p>
                </div>

                <div className="grid grid-cols-2 gap-3">
                    {[
                        {
                            title: 'Ulang Tahun',
                            desc: 'Momen manis berkesan',
                            img: 'https://images.unsplash.com/photo-1530103862676-de8c9debad1d?w=500',
                        },
                        {
                            title: 'Intimate Wedding',
                            desc: 'Suasana sakral premium',
                            img: 'https://images.unsplash.com/photo-1519741497674-611481863552?w=500',
                        },
                        {
                            title: 'Corporate Meeting',
                            desc: 'Fasilitas meeting lengkap',
                            img: 'https://images.unsplash.com/photo-1517245386807-bb43f82c33c4?w=500',
                        },
                        {
                            title: 'Family Gathering',
                            desc: 'Kebersamaan tak terlupakan',
                            img: 'https://images.unsplash.com/photo-1528605248644-14dd04022da1?w=500',
                        },
                    ].map((item, idx) => (
                        <div
                            key={idx}
                            className="group relative rounded-2xl overflow-hidden border border-white/5 bg-white/[0.02]"
                        >
                            <div className="h-28 w-full overflow-hidden bg-slate-950">
                                <img
                                    src={item.img}
                                    alt={item.title}
                                    className="size-full object-cover opacity-80 group-hover:scale-105 transition-all duration-300"
                                />
                            </div>
                            <div className="p-3">
                                <h3 className="text-xs font-bold text-slate-200">{item.title}</h3>
                                <p className="text-[9px] text-slate-500 mt-0.5">{item.desc}</p>
                            </div>
                        </div>
                    ))}
                </div>

                <div className="bg-white/[0.02] border border-white/5 rounded-2xl p-4 space-y-3">
                    <h3 className="text-xs font-bold text-white flex items-center gap-1.5">
                        <ImageIcon className="size-3.5 text-emerald-400" /> Fasilitas Kami
                    </h3>
                    <div className="grid grid-cols-2 gap-2 text-[10px] text-slate-400">
                        <span className="flex items-center gap-1">✓ Sound System Premium</span>
                        <span className="flex items-center gap-1">✓ Proyektor & Layar</span>
                        <span className="flex items-center gap-1">✓ AC & Ruangan Privat</span>
                        <span className="flex items-center gap-1">✓ WiFi Kecepatan Tinggi</span>
                        <span className="flex items-center gap-1">✓ Parkir Luas & Aman</span>
                        <span className="flex items-center gap-1">✓ Menu Buffet Variatif</span>
                    </div>
                </div>

                <button
                    onClick={() => setActiveTab('reservasi')}
                    className="w-full py-3.5 bg-emerald-500 hover:bg-emerald-400 text-slate-950 rounded-xl text-xs font-black transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-500/10"
                >
                    <CalendarIcon className="size-3.5" /> Hubungi & Reservasi Sekarang
                </button>
            </div>
        </main>
    );
}
