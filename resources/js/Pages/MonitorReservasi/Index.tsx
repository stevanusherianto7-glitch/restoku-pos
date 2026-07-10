import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { RoleGuard } from '../../Components/RoleGuard';
import { Screen, Glass, Badge } from '../../Components/Shared';
import {
    CalendarDays,
    Clock3,
    Users,
    Phone,
    CheckCircle2,
    XCircle,
    Calendar,
    MapPin,
    PartyPopper,
    RefreshCw,
    ChevronDown,
    Filter,
    Search,
    Cake,
    Utensils,
    Star,
} from 'lucide-react';

// ─── Types ────────────────────────────────────────────────────────────────────
type ReservationStatus = 'pending' | 'confirmed' | 'cancelled' | 'completed';
type ReservationType = 'meja' | 'ulang_tahun' | 'gathering' | 'pernikahan' | 'acara_kantor' | 'lainnya';

interface Reservation {
    id: string;
    name: string;
    phone: string;
    email?: string;
    date: string; // YYYY-MM-DD
    time: string; // HH:MM
    guests: number;
    type: ReservationType;
    notes?: string;
    table_preference?: string;
    status: ReservationStatus;
    created_at: number; // unix timestamp
}

// ─── Mock Data ────────────────────────────────────────────────────────────────
const TYPE_LABEL: Record<ReservationType, string> = {
    meja: 'Reservasi Meja',
    ulang_tahun: 'Ulang Tahun',
    gathering: 'Gathering',
    pernikahan: 'Pernikahan / Tunangan',
    acara_kantor: 'Acara Kantor',
    lainnya: 'Lainnya',
};

const TYPE_ICON: Record<ReservationType, React.ElementType> = {
    meja: Utensils,
    ulang_tahun: Cake,
    gathering: Users,
    pernikahan: Star,
    acara_kantor: Calendar,
    lainnya: CalendarDays,
};

const STATUS_CONFIG: Record<ReservationStatus, { label: string; cls: string }> = {
    pending: { label: 'Menunggu', cls: 'bg-amber-500/15 text-amber-400 border border-amber-500/20' },
    confirmed: { label: 'Dikonfirmasi', cls: 'bg-emerald-500/15 text-emerald-400 border border-emerald-500/20' },
    cancelled: { label: 'Dibatalkan', cls: 'bg-red-500/15 text-red-400 border border-red-500/20' },
    completed: { label: 'Selesai', cls: 'bg-blue-500/15 text-blue-400 border border-blue-500/20' },
};

const MOCK_RESERVATIONS: Reservation[] = [
    {
        id: 'RSV-001',
        name: 'Budi Santoso',
        phone: '0812-3456-7890',
        date: '2026-07-10',
        time: '18:30',
        guests: 6,
        type: 'ulang_tahun',
        notes: 'Mohon siapkan kue ulang tahun & dekorasi balon',
        status: 'confirmed',
        created_at: Date.now() - 7200000,
    },
    {
        id: 'RSV-002',
        name: 'Dewi Rahayu',
        phone: '0857-8765-4321',
        date: '2026-07-08',
        time: '12:00',
        guests: 2,
        type: 'meja',
        notes: 'Anniversary, preferably window seat',
        status: 'pending',
        created_at: Date.now() - 3600000,
    },
    {
        id: 'RSV-003',
        name: 'PT Maju Bersama',
        phone: '0811-2233-4455',
        date: '2026-07-15',
        time: '10:00',
        guests: 25,
        type: 'acara_kantor',
        notes: 'Team lunch bulanan, butuh ruang semi-privat',
        status: 'pending',
        created_at: Date.now() - 1800000,
    },
    {
        id: 'RSV-004',
        name: 'Rizky Pratama',
        phone: '0878-9900-1122',
        date: '2026-07-12',
        time: '19:00',
        guests: 12,
        type: 'gathering',
        notes: 'Reuni alumni SMA, mohon siapkan area khusus',
        status: 'confirmed',
        created_at: Date.now() - 86400000,
    },
    {
        id: 'RSV-005',
        name: 'Anita & Brama',
        phone: '0821-5544-6677',
        date: '2026-07-20',
        time: '17:30',
        guests: 50,
        type: 'pernikahan',
        notes: 'Bridal shower + makan malam, tema elegant',
        status: 'pending',
        created_at: Date.now() - 43200000,
    },
    {
        id: 'RSV-006',
        name: 'Siti Nurhaliza',
        phone: '0831-7788-9900',
        date: '2026-07-07',
        time: '13:00',
        guests: 4,
        type: 'meja',
        notes: '',
        status: 'completed',
        created_at: Date.now() - 172800000,
    },
];

// ─── Main Component (Guard Wrapper) ──────────────────────────────────────────
export default function MonitorReservasi() {
    return (
        <RoleGuard
            allowedRoles={['kasir', 'manager', 'owner']}
            pageName="Monitor Reservasi"
            allowedRoleLabel="Kasir, Manager, Owner"
        >
            <MonitorReservasiContent />
        </RoleGuard>
    );
}

function MonitorReservasiContent() {
    const [reservations, setReservations] = useState<Reservation[]>([]);
    const [filterStatus, setFilterStatus] = useState<'all' | ReservationStatus>('all');
    const [filterType, setFilterType] = useState<'all' | ReservationType>('all');
    const [searchQuery, setSearchQuery] = useState('');
    const [isLoading, setIsLoading] = useState(true);

    // Load from API (falls back to mock)
    useEffect(() => {
        const load = async () => {
            setIsLoading(true);
            try {
                const res = await fetch('/api/reservations');
                if (res.ok) {
                    const data = await res.json();
                    setReservations(data.reservations ?? MOCK_RESERVATIONS);
                } else {
                    setReservations(MOCK_RESERVATIONS);
                }
            } catch {
                setReservations(MOCK_RESERVATIONS);
            } finally {
                setIsLoading(false);
            }
        };
        load();
    }, []);

    const updateStatus = async (id: string, newStatus: ReservationStatus) => {
        try {
            await fetch(`/api/reservations/${id}/status`, {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ status: newStatus }),
            });
        } catch {
            /* silent */
        }
        setReservations((prev) => prev.map((r) => (r.id === id ? { ...r, status: newStatus } : r)));
    };

    // Stats
    const stats = {
        pending: reservations.filter((r) => r.status === 'pending').length,
        confirmed: reservations.filter((r) => r.status === 'confirmed').length,
        total: reservations.length,
        guests: reservations.filter((r) => r.status !== 'cancelled').reduce((s, r) => s + r.guests, 0),
    };

    // Filter
    const today = new Date().toISOString().slice(0, 10);
    const filtered = reservations
        .filter((r) => {
            const matchStatus = filterStatus === 'all' || r.status === filterStatus;
            const matchType = filterType === 'all' || r.type === filterType;
            const matchSearch =
                r.name.toLowerCase().includes(searchQuery.toLowerCase()) || r.phone.includes(searchQuery);
            return matchStatus && matchType && matchSearch;
        })
        .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

    const todayReservations = filtered.filter((r) => r.date === today);
    const upcomingReservations = filtered.filter((r) => r.date > today);
    const pastReservations = filtered.filter((r) => r.date < today);

    return (
        <MainLayout>
            <Head title="Monitor Reservasi" />
            <Screen title="Monitor Reservasi" subtitle="Kelola pemesanan meja dan acara dari tamu">
                {/* Stats Row */}
                <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-6">
                    {[
                        {
                            label: 'Menunggu Konfirmasi',
                            value: stats.pending,
                            icon: Clock3,
                            cls: 'text-amber-400',
                            bg: 'bg-amber-500/10 border-amber-500/20',
                        },
                        {
                            label: 'Dikonfirmasi',
                            value: stats.confirmed,
                            icon: CheckCircle2,
                            cls: 'text-emerald-400',
                            bg: 'bg-emerald-500/10 border-emerald-500/20',
                        },
                        {
                            label: 'Total Reservasi',
                            value: stats.total,
                            icon: CalendarDays,
                            cls: 'text-blue-400',
                            bg: 'bg-blue-500/10 border-blue-500/20',
                        },
                        {
                            label: 'Total Tamu',
                            value: `${stats.guests} org`,
                            icon: Users,
                            cls: 'text-purple-400',
                            bg: 'bg-purple-500/10 border-purple-500/20',
                        },
                    ].map(({ label, value, icon: Icon, cls, bg }) => (
                        <Glass key={label} className={`p-4 border ${bg}`}>
                            <div className="flex items-center gap-2 mb-2">
                                <Icon className={`size-4 ${cls}`} />
                                <span className="text-xs text-slate-500">{label}</span>
                            </div>
                            <p className={`text-2xl font-black ${cls}`}>{value}</p>
                        </Glass>
                    ))}
                </div>

                {/* Filter Bar */}
                <Glass className="p-3 mb-5 flex flex-wrap gap-3 items-center">
                    {/* Search */}
                    <div className="relative flex-1 min-w-48">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 size-3.5 text-slate-500" />
                        <input
                            value={searchQuery}
                            onChange={(e) => setSearchQuery(e.target.value)}
                            placeholder="Cari nama / nomor HP..."
                            className="w-full bg-white/5 border border-white/10 rounded-lg pl-9 pr-3 py-2 text-sm text-slate-200 placeholder:text-slate-600 focus:outline-none focus:border-emerald-500/50"
                        />
                    </div>

                    {/* Status Filter */}
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                        <Filter className="size-3.5 text-slate-500" />
                        <select
                            value={filterStatus}
                            onChange={(e) => setFilterStatus(e.target.value as typeof filterStatus)}
                            className="bg-transparent text-sm text-slate-300 focus:outline-none cursor-pointer"
                        >
                            <option value="all">Semua Status</option>
                            <option value="pending">Menunggu</option>
                            <option value="confirmed">Dikonfirmasi</option>
                            <option value="completed">Selesai</option>
                            <option value="cancelled">Dibatalkan</option>
                        </select>
                    </div>

                    {/* Type Filter */}
                    <div className="flex items-center gap-1.5 bg-white/5 border border-white/10 rounded-lg px-3 py-2">
                        <CalendarDays className="size-3.5 text-slate-500" />
                        <select
                            value={filterType}
                            onChange={(e) => setFilterType(e.target.value as typeof filterType)}
                            className="bg-transparent text-sm text-slate-300 focus:outline-none cursor-pointer"
                        >
                            <option value="all">Semua Jenis</option>
                            <option value="meja">Reservasi Meja</option>
                            <option value="ulang_tahun">Ulang Tahun</option>
                            <option value="gathering">Gathering</option>
                            <option value="pernikahan">Pernikahan / Tunangan</option>
                            <option value="acara_kantor">Acara Kantor</option>
                            <option value="lainnya">Lainnya</option>
                        </select>
                    </div>

                    <button
                        onClick={() => {
                            setFilterStatus('all');
                            setFilterType('all');
                            setSearchQuery('');
                        }}
                        className="flex items-center gap-1.5 px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 border border-white/10 text-xs text-slate-400 transition-colors"
                    >
                        <RefreshCw className="size-3.5" /> Reset
                    </button>
                </Glass>

                {/* Reservation Sections */}
                {isLoading ? (
                    <Glass className="p-10 flex flex-col items-center justify-center text-center gap-3">
                        <RefreshCw className="size-8 text-slate-600 animate-spin" />
                        <p className="text-slate-500 text-sm">Memuat data reservasi...</p>
                    </Glass>
                ) : filtered.length === 0 ? (
                    <Glass className="p-10 flex flex-col items-center justify-center text-center gap-3">
                        <CalendarDays className="size-10 text-slate-700" />
                        <p className="text-slate-400 font-medium">Tidak ada reservasi ditemukan</p>
                        <p className="text-slate-600 text-xs">Coba ubah filter pencarian</p>
                    </Glass>
                ) : (
                    <div className="space-y-6">
                        {/* Today */}
                        {todayReservations.length > 0 && (
                            <Section
                                title="Hari Ini"
                                badge={todayReservations.length}
                                badgeCls="bg-emerald-500/20 text-emerald-400"
                            >
                                {todayReservations.map((r) => (
                                    <ReservationCard key={r.id} r={r} onUpdate={updateStatus} />
                                ))}
                            </Section>
                        )}
                        {/* Upcoming */}
                        {upcomingReservations.length > 0 && (
                            <Section
                                title="Mendatang"
                                badge={upcomingReservations.length}
                                badgeCls="bg-blue-500/20 text-blue-400"
                            >
                                {upcomingReservations.map((r) => (
                                    <ReservationCard key={r.id} r={r} onUpdate={updateStatus} />
                                ))}
                            </Section>
                        )}
                        {/* Past */}
                        {pastReservations.length > 0 && (
                            <Section
                                title="Selesai / Lampau"
                                badge={pastReservations.length}
                                badgeCls="bg-slate-500/20 text-slate-400"
                            >
                                {pastReservations.map((r) => (
                                    <ReservationCard key={r.id} r={r} onUpdate={updateStatus} />
                                ))}
                            </Section>
                        )}
                    </div>
                )}
            </Screen>
        </MainLayout>
    );
}

// ─── Sub-components ────────────────────────────────────────────────────────────
function Section({
    title,
    badge,
    badgeCls,
    children,
}: {
    title: string;
    badge: number;
    badgeCls: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <div className="flex items-center gap-2 mb-3">
                <h2 className="text-sm font-semibold text-slate-300">{title}</h2>
                <span className={`text-xs font-bold px-2 py-0.5 rounded-full ${badgeCls}`}>{badge}</span>
            </div>
            <div className="space-y-3">{children}</div>
        </div>
    );
}

function ReservationCard({ r, onUpdate }: { r: Reservation; onUpdate: (id: string, s: ReservationStatus) => void }) {
    const { label, cls } = STATUS_CONFIG[r.status];
    const TypeIcon = TYPE_ICON[r.type];
    const dateLabel = new Date(r.date).toLocaleDateString('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    });

    return (
        <Glass className="p-4 hover:bg-white/[0.04] transition-all duration-200">
            <div className="flex items-start justify-between gap-3">
                {/* Left info */}
                <div className="flex items-start gap-3 flex-1 min-w-0">
                    <div className="p-2.5 rounded-xl bg-white/5 border border-white/10 shrink-0">
                        <TypeIcon className="size-4 text-slate-400" />
                    </div>
                    <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap mb-1">
                            <span className="font-semibold text-slate-100 text-sm">{r.name}</span>
                            <span className={`text-[10px] font-bold px-2 py-0.5 rounded-full ${cls}`}>{label}</span>
                            <span className="text-[10px] text-slate-500 bg-white/5 border border-white/10 px-2 py-0.5 rounded-full">
                                {TYPE_LABEL[r.type]}
                            </span>
                        </div>
                        <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-slate-500">
                            <span className="flex items-center gap-1">
                                <CalendarDays className="size-3" /> {dateLabel}
                            </span>
                            <span className="flex items-center gap-1">
                                <Clock3 className="size-3" /> {r.time} WIB
                            </span>
                            <span className="flex items-center gap-1">
                                <Users className="size-3" /> {r.guests} tamu
                            </span>
                            <span className="flex items-center gap-1">
                                <Phone className="size-3" /> {r.phone}
                            </span>
                        </div>
                        {r.notes && (
                            <p className="mt-2 text-xs text-slate-400 italic bg-white/[0.03] border border-white/5 rounded-lg px-3 py-1.5">
                                "{r.notes}"
                            </p>
                        )}
                    </div>
                </div>

                {/* Actions */}
                {r.status !== 'completed' && r.status !== 'cancelled' && (
                    <div className="flex flex-col gap-1.5 shrink-0">
                        {r.status === 'pending' && (
                            <button
                                onClick={() => onUpdate(r.id, 'confirmed')}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-emerald-500/15 hover:bg-emerald-500/25 text-emerald-400 text-xs font-semibold border border-emerald-500/20 transition-colors"
                            >
                                <CheckCircle2 className="size-3.5" /> Konfirmasi
                            </button>
                        )}
                        {r.status === 'confirmed' && (
                            <button
                                onClick={() => onUpdate(r.id, 'completed')}
                                className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-blue-500/15 hover:bg-blue-500/25 text-blue-400 text-xs font-semibold border border-blue-500/20 transition-colors"
                            >
                                <PartyPopper className="size-3.5" /> Selesai
                            </button>
                        )}
                        <button
                            onClick={() => onUpdate(r.id, 'cancelled')}
                            className="flex items-center gap-1 px-3 py-1.5 rounded-lg bg-red-500/10 hover:bg-red-500/20 text-red-400 text-xs font-semibold border border-red-500/20 transition-colors"
                        >
                            <XCircle className="size-3.5" /> Tolak
                        </button>
                    </div>
                )}
            </div>
            <div className="mt-2 pt-2 border-t border-white/5 flex justify-between text-[10px] text-slate-600">
                <span>ID: {r.id}</span>
                <span>
                    Diterima:{' '}
                    {new Date(r.created_at).toLocaleString('id-ID', { dateStyle: 'short', timeStyle: 'short' })}
                </span>
            </div>
        </Glass>
    );
}
