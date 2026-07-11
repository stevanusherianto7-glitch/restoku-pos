import { useState, useEffect } from 'react';
import { Head } from '@inertiajs/react';
import MainLayout from '../../Layouts/MainLayout';
import { Screen, Glass, Badge, useTenantSettings } from '../../Components/Shared';
import {
    StarIcon,
    RefreshCwIcon,
    SendIcon,
    CheckCircle2Icon,
    SettingsIcon,
    SparklesIcon,
    AlertCircleIcon,
    StoreIcon,
    XIcon,
    MessageSquareIcon,
} from '../../Components/icons';

interface Review {
    id: number;
    reviewer_name: string;
    reviewer_photo: string | null;
    rating: number;
    comment: string | null;
    reply_text: string | null;
    replied_at: string | null;
    reviewed_at: string;
}

export default function GoogleReviews() {
    const { screenMode } = useTenantSettings();
    const isNanoBanana = screenMode === 'nano-banana';

    const [reviews, setReviews] = useState<Review[]>([]);
    const [loading, setLoading] = useState(false);
    const [syncing, setSyncing] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [connected, setConnected] = useState(false);
    const [filterRating, setFilterRating] = useState<'all' | 'complaints' | 'positive'>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'unreplied' | 'replied'>('all');

    // SettingsIcon states
    const [showSettings, setShowSettings] = useState(false);
    const [placeId, setPlaceId] = useState('ChIJrTLr-GzsaS4R350O6vCqzw4');
    const [apiKey, setApiKey] = useState('AIzaSyA1234567890-XYZ-restoku-gmaps');

    // Place ID Helper / Generator states
    const [helperMode, setHelperMode] = useState<'none' | 'url' | 'search'>('none');
    const [helperUrl, setHelperUrl] = useState('');
    const [helperSearch, setHelperSearch] = useState('');
    const [helperMessage, setHelperMessage] = useState('');

    const handleParseUrl = () => {
        if (!helperUrl.trim()) return;

        // Ekstrak Place ID asli dari URL Maps (format hex 0x...:0x...).
        // TIDAK memalsukan jadi 'ChIJ...' — itu sebabkan sync "berhasil" tapi data palsu.
        const hexMatch = helperUrl.match(/1s(0x[0-9a-fA-F]+:0x[0-9a-fA-F]+)/);
        if (hexMatch) {
            const realPlaceId = hexMatch[1];
            setPlaceId(realPlaceId);
            setHelperMessage(`Tautan terdeteksi. Place ID asli diekstrak: ${realPlaceId}`);
            return;
        }

        // Place ID kanonik ChIJ (jika user tempel langsung, bukan dari URL).
        const chijMatch = helperUrl.match(/ChIJ[A-Za-z0-9_-]+/);
        if (chijMatch) {
            setPlaceId(chijMatch[0]);
            setHelperMessage(`Place ID ditemukan: ${chijMatch[0]}`);
            return;
        }

        setHelperMessage('Tautan tidak valid. Tempel tautan Google Maps lengkap (berisi 1s0x...).');
    };

    const handleSearchName = () => {
        if (!helperSearch.trim()) return;

        // Nama → butuh resolve via Google (Place ID / location GBP). Tidak tebak ChIJ.
        setHelperMessage(
            'Pencarian nama butuh koneksi Google Business Profile. Klik "Hubungkan GBP" lalu pilih lokasi dari daftar — Place ID akan otomatis terisi.',
        );
    };

    // Reply states
    const [replyingToId, setReplyingToId] = useState<number | null>(null);
    const [replyText, setReplyText] = useState('');
    const [generatingAi, setGeneratingAi] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [replyError, setReplyError] = useState<string | null>(null);

    const fetchReviews = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/google-reviews');
            const data = await res.json();
            if (data.status === 'success') {
                setReviews(data.reviews);
                setConnected(!!data.connected);
            } else {
                setError(data.message || 'Gagal memuat ulasan Google.');
                setConnected(!!data.connected);
            }
        } catch (err) {
            setError('Tidak dapat terhubung ke server. Periksa koneksi Anda.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSync = async () => {
        setSyncing(true);
        setError(null);
        try {
            const res = await fetch('/api/google-reviews/sync', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'XIcon-CSRF-TOKEN':
                        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
            });
            const data = await res.json();
            if (data.status === 'success') {
                setReviews(data.reviews);
                setConnected(!!data.connected);
                // Setelah sinkron, langsung fokus ke ulasan yang belum dibalas
                // supaya owner langsung melihat commentary yang butuh tanggapan.
                const unreplied = (data.reviews as Review[]).filter((r) => !r.reply_text).length;
                setFilterStatus(unreplied > 0 ? 'unreplied' : 'all');
            } else if (data.status === 'demo') {
                // Transparan: data contoh, belum terhubung GBP.
                setReviews(data.reviews);
                setConnected(false);
                setError(data.message || 'Menampilkan data contoh (belum terhubung GBP).');
            } else {
                setError(data.message || 'Sinkronisasi gagal. Coba lagi.');
                setConnected(!!data.connected);
            }
        } catch (err) {
            setError('Sinkronisasi gagal. Periksa koneksi Anda.');
            console.error(err);
        } finally {
            setSyncing(false);
        }
    };

    const handleReplySubmit = async (reviewId: number) => {
        if (!replyText.trim()) return;
        setReplyError(null);
        try {
            const res = await fetch(`/api/google-reviews/${reviewId}/reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'XIcon-CSRF-TOKEN':
                        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ reply_text: replyText }),
            });
            const data = await res.json();
            if (data.status === 'success') {
                setReviews((prev) => prev.map((r) => (r.id === reviewId ? data.review : r)));
                setReplyingToId(null);
                setReplyText('');
            } else {
                setReplyError(data.message || 'Gagal mengirim balasan.');
            }
        } catch (err) {
            setReplyError('Gagal mengirim balasan. Periksa koneksi Anda.');
            console.error(err);
        }
    };

    const handleAiReplyGenerate = async (reviewId: number) => {
        setGeneratingAi(true);
        setAiError(null);
        try {
            const res = await fetch(`/api/google-reviews/${reviewId}/generate-ai-reply`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'XIcon-CSRF-TOKEN':
                        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
            });
            const data = await res.json();
            if (data.status === 'success') {
                setReplyText(data.reply);
            } else {
                // TRANSPARAN: jangan silent fallback. Laporkan kegagalan AI.
                setAiError(data.message || 'AI gagal membuat balasan. Tulis manual.');
            }
        } catch (err) {
            setAiError('Layanan AI tidak tersedia saat ini. Tulis balasan manual.');
            console.error(err);
        } finally {
            setGeneratingAi(false);
        }
    };

    const handleSaveSettings = async () => {
        try {
            const res = await fetch('/api/google-reviews/settings', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'XIcon-CSRF-TOKEN':
                        (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '',
                },
                body: JSON.stringify({ google_place_id: placeId, api_key: apiKey }),
            });
            const data = await res.json();
            if (data.status === 'success') {
                setShowSettings(false);
            }
        } catch (err) {
            console.error(err);
        }
    };

    useEffect(() => {
        fetchReviews();
        // Real-time: poll ulang tiap 30 detik agar ulasan & balasan tetap segar
        // tanpa intervensi owner (banner "real-time" jadi nyata, bukan klaim).
        const id = setInterval(fetchReviews, 30000);
        return () => clearInterval(id);
    }, []);

    const filteredReviews = reviews.filter((r) => {
        // Filter Rating
        if (filterRating === 'complaints' && r.rating > 3) return false;
        if (filterRating === 'positive' && r.rating < 4) return false;

        // Filter Status
        if (filterStatus === 'unreplied' && r.reply_text) return false;
        if (filterStatus === 'replied' && !r.reply_text) return false;

        return true;
    });

    const renderStars = (rating: number) => {
        return (
            <div className="flex gap-0.5">
                {[1, 2, 3, 4, 5].map((s) => (
                    <StarIcon
                        key={s}
                        className={`size-3.5 ${s <= rating ? 'fill-amber-400 text-amber-400' : 'text-white/10'}`}
                    />
                ))}
            </div>
        );
    };

    return (
        <MainLayout>
            <Head title="Google Review & Complaint Hub" />
            <Screen title="Google Review & Complaint Hub">
                <div className="space-y-6">
                    {/* Header Info Banner */}
                    <div className="flex flex-col md:flex-row md:items-center justify-between p-4 bg-emerald-500/10 border border-emerald-500/20 rounded-xl gap-4">
                        <div className="flex items-center gap-3">
                            <div className="grid size-11 place-items-center rounded-xl bg-emerald-500/20 text-emerald-300 border border-emerald-500/30">
                                <MessageSquareIcon className="size-5" />
                            </div>
                            <div>
                                <h3 className="text-base font-bold text-emerald-200">Google Review & Complaint Hub</h3>
                                <p className="text-xs text-emerald-300/70">
                                    Pusat penanganan kritik, saran, dan kepuasan pelanggan secara real-time dari Google
                                    Maps.
                                </p>
                            </div>
                        </div>
                        <div className="flex items-center gap-2">
                            {connected ? (
                                <span className="flex items-center gap-1.5 px-3 py-2 rounded-xl bg-emerald-500/10 border border-emerald-500/30 text-emerald-300 text-xs font-semibold">
                                    <span className="size-2 rounded-full bg-emerald-400 animate-pulse" />
                                    Terhubung GBP
                                </span>
                            ) : (
                                <a
                                    href="/owner/google-reviews/connect"
                                    className="bg-blue-500/15 hover:bg-blue-500/25 text-blue-200 border border-blue-500/30 rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2 transition-all"
                                >
                                    <StoreIcon className="size-3.5" /> Hubungkan GBP
                                </a>
                            )}
                            <button
                                onClick={() => setShowSettings(true)}
                                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2 transition-all"
                            >
                                <SettingsIcon className="size-3.5" /> Pengaturan GBP
                            </button>
                            <button
                                onClick={handleSync}
                                disabled={syncing}
                                className={`text-black rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2 transition-all ${
                                    isNanoBanana
                                        ? 'bg-amber-400 hover:bg-amber-500'
                                        : 'bg-emerald-400 hover:bg-emerald-500'
                                } disabled:opacity-50`}
                            >
                                <RefreshCwIcon className={`size-3.5 ${syncing ? 'animate-spin' : ''}`} />
                                {syncing ? 'Sinkronisasi...' : 'Sinkronkan Ulasan'}
                            </button>
                        </div>
                    </div>

                    {/* Error banner — transparan saat fetch/sync gagal */}
                    {error && (
                        <div className="flex items-center gap-3 p-4 bg-red-500/10 border border-red-500/30 rounded-xl text-red-200">
                            <AlertCircleIcon className="size-5 shrink-0 text-red-400" />
                            <span className="text-xs font-medium flex-1">{error}</span>
                            <button
                                onClick={fetchReviews}
                                className="bg-red-500/20 hover:bg-red-500/30 border border-red-500/30 text-red-100 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all"
                            >
                                Coba Lagi
                            </button>
                        </div>
                    )}

                    {/* Filters Bar */}
                    <div className="flex flex-wrap items-center justify-between gap-4 p-4 bg-black/40 border border-white/5 rounded-xl">
                        <div className="flex flex-wrap items-center gap-4">
                            {/* Rating filter */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                    Kategori Review
                                </label>
                                <div className="flex bg-black/40 border border-white/10 rounded-lg p-0.5">
                                    <button
                                        onClick={() => setFilterRating('all')}
                                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                                            filterRating === 'all'
                                                ? 'bg-white/10 text-white'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        Semua
                                    </button>
                                    <button
                                        onClick={() => setFilterRating('complaints')}
                                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all flex items-center gap-1.5 ${
                                            filterRating === 'complaints'
                                                ? 'bg-red-500/20 text-red-300 border border-red-500/30'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        Komplain (Bintang 1-3)
                                    </button>
                                    <button
                                        onClick={() => setFilterRating('positive')}
                                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                                            filterRating === 'positive'
                                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        Positif (Bintang 4-5)
                                    </button>
                                </div>
                            </div>

                            {/* Status filter */}
                            <div className="flex flex-col gap-1.5">
                                <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                    Status Balasan
                                </label>
                                <div className="flex bg-black/40 border border-white/10 rounded-lg p-0.5">
                                    <button
                                        onClick={() => setFilterStatus('all')}
                                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                                            filterStatus === 'all'
                                                ? 'bg-white/10 text-white'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        Semua
                                    </button>
                                    <button
                                        onClick={() => setFilterStatus('unreplied')}
                                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                                            filterStatus === 'unreplied'
                                                ? 'bg-amber-500/20 text-amber-300 border border-amber-500/30'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        Belum Dibalas
                                    </button>
                                    <button
                                        onClick={() => setFilterStatus('replied')}
                                        className={`px-3 py-1 rounded-md text-xs font-semibold transition-all ${
                                            filterStatus === 'replied'
                                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                                : 'text-slate-400 hover:text-white'
                                        }`}
                                    >
                                        Sudah Dibalas
                                    </button>
                                </div>
                            </div>
                        </div>

                        <div className="text-xs text-slate-400">
                            Menampilkan <span className="text-white font-bold">{filteredReviews.length}</span> dari{' '}
                            {reviews.length} ulasan
                        </div>
                    </div>

                    {/* Reviews List */}
                    {loading ? (
                        <div className="text-center py-12 text-slate-400 flex flex-col items-center gap-3">
                            <RefreshCwIcon className="size-8 animate-spin text-emerald-400" />
                            Memuat ulasan Google...
                        </div>
                    ) : filteredReviews.length === 0 ? (
                        <Glass className="p-12 text-center text-slate-400 flex flex-col items-center justify-center border-white/5">
                            <CheckCircle2Icon className="size-12 text-slate-600 mb-3" />
                            <p className="font-bold text-white">Tidak ada ulasan ditemukan</p>
                            <p className="text-xs text-slate-500 mt-1">
                                Coba sinkronkan ulasan Anda atau sesuaikan filter pencarian.
                            </p>
                        </Glass>
                    ) : (
                        <div className="space-y-4">
                            {filteredReviews.map((review) => {
                                const isComplaint = review.rating <= 3;
                                return (
                                    <Glass
                                        key={review.id}
                                        className={`p-5 border-white/5 flex flex-col gap-4 ${
                                            isComplaint && !review.reply_text
                                                ? 'border-l-4 border-l-red-500 bg-red-500/[0.01]'
                                                : ''
                                        }`}
                                        hover
                                    >
                                        <div className="flex items-start justify-between gap-4">
                                            <div className="flex gap-3">
                                                <div className="size-10 rounded-full bg-white/5 border border-white/10 flex items-center justify-center font-bold text-white text-sm">
                                                    {review.reviewer_name.charAt(0)}
                                                </div>
                                                <div>
                                                    <h4 className="text-sm font-bold text-white flex items-center gap-2">
                                                        {review.reviewer_name}
                                                        {isComplaint && !review.reply_text && (
                                                            <span className="text-[9px] bg-red-500/20 text-red-300 border border-red-500/30 px-2 py-0.5 rounded-full font-bold uppercase tracking-wider">
                                                                Butuh Respon Segera
                                                            </span>
                                                        )}
                                                    </h4>
                                                    <div className="flex items-center gap-2 mt-1">
                                                        {renderStars(review.rating)}
                                                        <span className="text-[10px] text-slate-500">
                                                            {new Date(review.reviewed_at).toLocaleDateString('id-ID', {
                                                                day: 'numeric',
                                                                month: 'long',
                                                                year: 'numeric',
                                                            })}
                                                        </span>
                                                    </div>
                                                </div>
                                            </div>
                                            <Badge tone={review.rating >= 4 ? 'emerald' : 'red'}>
                                                Bintang {review.rating}
                                            </Badge>
                                        </div>

                                        {/* Review Comment */}
                                        <div className="text-sm text-slate-200 pl-13 leading-relaxed">
                                            {review.comment || (
                                                <span className="text-slate-500 italic">Tanpa komentar tertulis.</span>
                                            )}
                                        </div>

                                        {/* Reply Section */}
                                        {review.reply_text ? (
                                            <div className="ml-13 p-4 bg-white/[0.02] border border-white/5 rounded-xl space-y-2">
                                                <div className="flex items-center justify-between">
                                                    <span className="text-xs font-bold text-slate-400 flex items-center gap-1.5">
                                                        <CheckCircle2Icon className="size-3.5 text-emerald-400" />{' '}
                                                        Balasan dari Anda:
                                                    </span>
                                                    <span className="text-[10px] text-slate-500">
                                                        {new Date(review.replied_at || '').toLocaleDateString('id-ID', {
                                                            day: 'numeric',
                                                            month: 'long',
                                                            year: 'numeric',
                                                        })}
                                                    </span>
                                                </div>
                                                <p className="text-xs text-slate-300 leading-relaxed">
                                                    {review.reply_text}
                                                </p>
                                            </div>
                                        ) : (
                                            <div className="ml-13 pl-1">
                                                {replyingToId === review.id ? (
                                                    <div className="space-y-3 bg-black/40 border border-white/5 rounded-xl p-4">
                                                        <div className="flex justify-between items-center">
                                                            <span className="text-xs font-bold text-white">
                                                                Draft Balasan
                                                            </span>
                                                            <button
                                                                onClick={() => handleAiReplyGenerate(review.id)}
                                                                disabled={generatingAi}
                                                                className="bg-gradient-to-r from-amber-400 to-yellow-500 text-black px-3 py-1.5 rounded-lg text-xs font-bold flex items-center gap-1.5 transition-all shadow-[0_0_10px_rgba(234,179,8,0.2)] disabled:opacity-50"
                                                            >
                                                                <SparklesIcon className="size-3" />
                                                                {generatingAi
                                                                    ? 'AI Berpikir...'
                                                                    : 'Auto Balas dengan AI'}
                                                            </button>
                                                        </div>

                                                        <textarea
                                                            rows={3}
                                                            value={replyText}
                                                            onChange={(e) => setReplyText(e.target.value)}
                                                            placeholder="Tuliskan pesan balasan Anda atau gunakan AI Co-Pilot..."
                                                            className="w-full bg-black/40 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500"
                                                        />

                                                        {/* AI error — transparan (tidak silent fallback) */}
                                                        {aiError && (
                                                            <div className="flex items-center gap-2 text-[11px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                                                                <AlertCircleIcon className="size-3.5 shrink-0" />
                                                                {aiError}
                                                            </div>
                                                        )}

                                                        <div className="flex justify-end gap-2 text-xs">
                                                            <button
                                                                onClick={() => {
                                                                    setReplyingToId(null);
                                                                    setReplyText('');
                                                                }}
                                                                className="bg-white/5 hover:bg-white/10 border border-white/10 px-3 py-1.5 rounded-lg text-white"
                                                            >
                                                                Batal
                                                            </button>
                                                            <button
                                                                onClick={() => handleReplySubmit(review.id)}
                                                                disabled={!replyText.trim()}
                                                                className="bg-emerald-500 hover:bg-emerald-600 text-black px-4 py-1.5 rounded-lg font-bold flex items-center gap-1.5 transition-all disabled:opacity-50"
                                                            >
                                                                <SendIcon className="size-3" /> Kirim Balasan
                                                            </button>
                                                        </div>

                                                        {/* Reply error — transparan saat submit gagal */}
                                                        {replyError && (
                                                            <div className="flex items-center gap-2 text-[11px] text-red-300 bg-red-500/10 border border-red-500/20 rounded-lg px-3 py-2">
                                                                <AlertCircleIcon className="size-3.5 shrink-0" />
                                                                {replyError}
                                                            </div>
                                                        )}
                                                    </div>
                                                ) : (
                                                    <div className="flex gap-2">
                                                        <button
                                                            onClick={() => {
                                                                setReplyingToId(review.id);
                                                                setReplyText('');
                                                            }}
                                                            className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all"
                                                        >
                                                            Balas Manual
                                                        </button>
                                                        <button
                                                            onClick={async () => {
                                                                setReplyingToId(review.id);
                                                                setReplyText('');
                                                                handleAiReplyGenerate(review.id);
                                                            }}
                                                            className="bg-amber-400/10 hover:bg-amber-400/20 border border-amber-400/30 text-amber-300 px-3 py-2 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-all shadow-inner"
                                                        >
                                                            <SparklesIcon className="size-3 text-amber-400 animate-pulse" />{' '}
                                                            Tulis Balasan dengan AI
                                                        </button>
                                                    </div>
                                                )}
                                            </div>
                                        )}
                                    </Glass>
                                );
                            })}
                        </div>
                    )}

                    {/* GBP SettingsIcon Modal */}
                    {showSettings && (
                        <div className="fixed inset-0 bg-black/80 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                            <div className="bg-zinc-950 border border-white/10 rounded-2xl w-full max-w-md p-6 relative shadow-2xl">
                                <button
                                    onClick={() => setShowSettings(false)}
                                    className="absolute top-4 right-4 text-slate-400 hover:text-white"
                                >
                                    <XIcon className="size-5" />
                                </button>
                                <h3 className="text-lg font-bold text-white flex items-center gap-2 mb-2">
                                    <SettingsIcon className="size-5 text-emerald-400" />
                                    Pengaturan Google Business
                                </h3>
                                <p className="text-xs text-slate-400 mb-5">
                                    Hubungkan lokasi Google Maps gerai Anda untuk memicu sinkronisasi ulasan otomatis.
                                </p>

                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                            Google Place ID
                                        </label>
                                        <input
                                            type="text"
                                            value={placeId}
                                            onChange={(e) => setPlaceId(e.target.value)}
                                            placeholder="Masukkan Google Place ID gerai Anda"
                                            className="bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                                        />
                                    </div>

                                    {/* Place ID Generator Helper Widget */}
                                    <div className="bg-white/[0.02] border border-white/5 rounded-xl p-3 space-y-3">
                                        <div className="flex justify-between items-center">
                                            <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wider">
                                                Bantuan Cari Place ID
                                            </span>
                                            <div className="flex gap-1">
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setHelperMode(helperMode === 'url' ? 'none' : 'url');
                                                        setHelperMessage('');
                                                    }}
                                                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                                                        helperMode === 'url'
                                                            ? 'bg-emerald-500/20 text-emerald-300'
                                                            : 'bg-white/5 text-slate-400 hover:text-white'
                                                    }`}
                                                >
                                                    Tempel Link Maps
                                                </button>
                                                <button
                                                    type="button"
                                                    onClick={() => {
                                                        setHelperMode(helperMode === 'search' ? 'none' : 'search');
                                                        setHelperMessage('');
                                                    }}
                                                    className={`px-2 py-1 rounded text-[10px] font-semibold transition-all ${
                                                        helperMode === 'search'
                                                            ? 'bg-emerald-500/20 text-emerald-300'
                                                            : 'bg-white/5 text-slate-400 hover:text-white'
                                                    }`}
                                                >
                                                    Cari Nama Resto
                                                </button>
                                            </div>
                                        </div>

                                        {helperMode === 'url' && (
                                            <div className="space-y-2">
                                                <input
                                                    type="text"
                                                    value={helperUrl}
                                                    onChange={(e) => setHelperUrl(e.target.value)}
                                                    placeholder="Tempel tautan Google Maps di sini..."
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleParseUrl}
                                                    className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                                >
                                                    Ekstrak Place ID dari Tautan
                                                </button>
                                            </div>
                                        )}

                                        {helperMode === 'search' && (
                                            <div className="space-y-2">
                                                <input
                                                    type="text"
                                                    value={helperSearch}
                                                    onChange={(e) => setHelperSearch(e.target.value)}
                                                    placeholder="Masukkan nama restoran Anda..."
                                                    className="w-full bg-black/40 border border-white/10 rounded-lg p-2 text-xs text-white placeholder-slate-600 focus:outline-none focus:border-emerald-500"
                                                />
                                                <button
                                                    type="button"
                                                    onClick={handleSearchName}
                                                    className="w-full bg-emerald-500/10 hover:bg-emerald-500/20 text-emerald-300 border border-emerald-500/20 py-1.5 rounded-lg text-xs font-semibold transition-all"
                                                >
                                                    Cari ID Otomatis
                                                </button>
                                            </div>
                                        )}

                                        {helperMessage && (
                                            <p className="text-[10px] text-amber-300/90 leading-normal flex items-start gap-1">
                                                <AlertCircleIcon className="size-3.5 shrink-0 text-amber-400 mt-0.5" />
                                                {helperMessage}
                                            </p>
                                        )}
                                    </div>

                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                            Google API Key
                                        </label>
                                        <input
                                            type="password"
                                            value={apiKey}
                                            onChange={(e) => setApiKey(e.target.value)}
                                            placeholder="Masukkan Google Maps API Key"
                                            className="bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500"
                                        />
                                    </div>
                                </div>

                                <div className="flex justify-end gap-2.5 mt-6">
                                    <button
                                        onClick={() => setShowSettings(false)}
                                        className="bg-white/5 hover:bg-white/10 text-white border border-white/10 px-4 py-2 rounded-xl text-xs font-semibold transition-all"
                                    >
                                        Batal
                                    </button>
                                    <button
                                        onClick={handleSaveSettings}
                                        className={`text-black px-4 py-2 rounded-xl text-xs font-bold transition-all ${
                                            isNanoBanana
                                                ? 'bg-amber-400 hover:bg-amber-500'
                                                : 'bg-emerald-400 hover:bg-emerald-500'
                                        }`}
                                    >
                                        Simpan Pengaturan
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </Screen>
        </MainLayout>
    );
}
