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

    const [unreplied, setUnreplied] = useState<Review[]>([]);
    const [replied, setReplied] = useState<Review[]>([]);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [source, setSource] = useState<string>('local');
    const [placeId, setPlaceId] = useState<string | null>(null);
    const [filterRating, setFilterRating] = useState<'all' | 'complaints' | 'positive'>('all');
    const [filterStatus, setFilterStatus] = useState<'all' | 'unreplied' | 'replied'>('unreplied');

    // Settings: tempel link Google Maps (auto-detect Place ID di BE).
    const [showSettings, setShowSettings] = useState(false);
    const [placeLink, setPlaceLink] = useState('');
    const [saving, setSaving] = useState(false);
    const [settingsError, setSettingsError] = useState<string | null>(null);

    // Reply states
    const [replyingToId, setReplyingToId] = useState<number | null>(null);
    const [replyText, setReplyText] = useState('');
    const [generatingAi, setGeneratingAi] = useState(false);
    const [aiError, setAiError] = useState<string | null>(null);
    const [replyError, setReplyError] = useState<string | null>(null);

    const csrf = () => (document.querySelector('meta[name="csrf-token"]') as HTMLMetaElement)?.content || '';

    const fetchReviews = async () => {
        setLoading(true);
        setError(null);
        try {
            const res = await fetch('/api/google-reviews');
            const data = await res.json();
            if (data.status === 'success' || data.status === 'none') {
                setUnreplied(data.unreplied || []);
                setReplied(data.replied || []);
                setSource(data.source);
                setPlaceId(data.place_id || null);
                if (data.status === 'error') {
                    setError(data.message || 'Gagal memuat ulasan Google.');
                }
            } else if (data.status === 'error') {
                setError(data.message || 'Gagal memuat ulasan Google.');
            }
        } catch (err) {
            setError('Tidak dapat terhubung ke server. Periksa koneksi Anda.');
            console.error(err);
        } finally {
            setLoading(false);
        }
    };

    const handleSaveSettings = async () => {
        if (!placeLink.trim()) return;
        setSaving(true);
        setSettingsError(null);
        try {
            const res = await fetch('/api/google-reviews/settings', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'XIcon-CSRF-TOKEN': csrf() },
                body: JSON.stringify({ google_place_link: placeLink }),
            });
            const data = await res.json();
            if (data.status === 'success') {
                setShowSettings(false);
                setPlaceLink('');
                await fetchReviews();
            } else {
                setSettingsError(data.message || 'Link tidak dikenali.');
            }
        } catch (err) {
            setSettingsError('Gagal menyimpan. Periksa koneksi Anda.');
            console.error(err);
        } finally {
            setSaving(false);
        }
    };

    const handleReplySubmit = async (reviewId: number) => {
        if (!replyText.trim()) return;
        setReplyError(null);
        try {
            const res = await fetch(`/api/google-reviews/${reviewId}/reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'XIcon-CSRF-TOKEN': csrf() },
                body: JSON.stringify({ reply_text: replyText }),
            });
            const data = await res.json();
            if (data.status === 'success') {
                const updated = data.review as Review;
                setUnreplied((prev) => prev.filter((r) => r.id !== reviewId));
                setReplied((prev) => [updated, ...prev]);
                setReplyingToId(null);
                setReplyText('');
            } else {
                setReplyError(data.message || 'Gagal menyimpan balasan.');
            }
        } catch (err) {
            setReplyError('Gagal menyimpan balasan. Periksa koneksi Anda.');
            console.error(err);
        }
    };

    const handleAiReplyGenerate = async (reviewId: number) => {
        setGeneratingAi(true);
        setAiError(null);
        try {
            const res = await fetch(`/api/google-reviews/${reviewId}/generate-ai-reply`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json', 'XIcon-CSRF-TOKEN': csrf() },
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

    const copyReply = async () => {
        if (!replyText) return;
        try {
            await navigator.clipboard.writeText(replyText);
        } catch {
            /* clipboard may be blocked; user can select manually */
        }
    };

    useEffect(() => {
        fetchReviews();
        // Real-time: poll ulang tiap 30 detik agar ulasan & balasan tetap segar
        // tanpa intervensi owner (banner "real-time" jadi nyata, bukan klaim).
        const id = setInterval(fetchReviews, 30000);
        return () => clearInterval(id);
    }, []);

    // Gabungkan sesuai filter status.
    const reviews = [...unreplied, ...replied];
    const filteredReviews = reviews.filter((r) => {
        if (filterRating === 'complaints' && r.rating > 3) return false;
        if (filterRating === 'positive' && r.rating < 4) return false;
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
                            <span
                                className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-semibold ${
                                    source === 'places'
                                        ? 'bg-emerald-500/10 border-emerald-500/30 text-emerald-300'
                                        : 'bg-white/5 border-white/10 text-slate-400'
                                }`}
                            >
                                <span
                                    className={`size-2 rounded-full ${
                                        source === 'places' ? 'bg-emerald-400 animate-pulse' : 'bg-slate-500'
                                    }`}
                                />
                                {source === 'places' ? 'Real-time • Places API' : 'Belum terhubung'}
                            </span>
                            <button
                                onClick={() => setShowSettings(true)}
                                className="bg-white/5 hover:bg-white/10 text-white border border-white/10 rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2 transition-all"
                            >
                                <SettingsIcon className="size-3.5" /> Hubungkan Maps
                            </button>
                            <button
                                onClick={fetchReviews}
                                disabled={loading}
                                className={`text-black rounded-xl px-4 py-2.5 text-xs font-semibold flex items-center gap-2 transition-all ${
                                    isNanoBanana
                                        ? 'bg-amber-400 hover:bg-amber-500'
                                        : 'bg-emerald-400 hover:bg-emerald-500'
                                } disabled:opacity-50`}
                            >
                                <RefreshCwIcon className={`size-3.5 ${loading ? 'animate-spin' : ''}`} />
                                {loading ? 'Memuat...' : 'Segarkan'}
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
                                                                onClick={copyReply}
                                                                disabled={!replyText.trim()}
                                                                className="bg-white/5 hover:bg-white/10 border border-white/10 text-white px-3 py-1.5 rounded-lg font-semibold flex items-center gap-1.5 transition-all disabled:opacity-40"
                                                            >
                                                                Salin Balasan
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
                                    Hubungkan Google Maps
                                </h3>
                                <p className="text-xs text-slate-400 mb-5">
                                    Tempel <strong>link Google Maps</strong> restoran Anda. Restoku otomatis mendeteksi
                                    Place ID (termasuk dari koordinat @lat,lng). Ulasan akan tampil real-time.
                                </p>

                                <div className="space-y-4">
                                    <div className="flex flex-col gap-1.5">
                                        <label className="text-[10px] uppercase font-bold tracking-wider text-slate-400">
                                            Link Google Maps Restoran
                                        </label>
                                        <textarea
                                            value={placeLink}
                                            onChange={(e) => setPlaceLink(e.target.value)}
                                            placeholder="https://www.google.com/maps/place/Nama+Resto/@-6.2,106.8,17z"
                                            rows={3}
                                            className="bg-black/60 border border-white/10 rounded-xl p-3 text-xs text-white focus:outline-none focus:border-emerald-500 resize-none"
                                        />
                                    </div>

                                    {settingsError && (
                                        <p className="text-[10px] text-red-300/90 leading-normal flex items-start gap-1">
                                            <AlertCircleIcon className="size-3.5 shrink-0 text-red-400 mt-0.5" />
                                            {settingsError}
                                        </p>
                                    )}

                                    {placeId && (
                                        <p className="text-[10px] text-emerald-300/90 leading-normal flex items-start gap-1">
                                            <CheckCircle2Icon className="size-3.5 shrink-0 text-emerald-400 mt-0.5" />
                                            Terhubung: Place ID <code className="font-mono">{placeId}</code>
                                        </p>
                                    )}
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
