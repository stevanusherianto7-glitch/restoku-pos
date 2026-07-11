<?php

namespace App\Http\Controllers;

use App\Ai\Agents\RestokuAiAssistant;
use App\Models\GoogleBpToken;
use App\Models\GoogleReview;
use App\Models\Scopes\TenantScope;
use App\Services\GoogleBusinessProfileService;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class GoogleReviewController extends Controller
{
    public function __construct(
        private readonly GoogleBusinessProfileService $bp,
    ) {}

    public function viewPanel()
    {
        return Inertia::render('Owner/GoogleReviews');
    }

    public function index(Request $request)
    {
        // Lampirkan status koneksi GBP (tanpa expose token).
        $connected = GoogleBpToken::where('tenant_id', auth()->user()->tenant_id)->exists();

        $reviews = GoogleReview::orderBy('reviewed_at', 'desc')->get();

        return response()->json([
            'status' => 'success',
            'connected' => $connected,
            'reviews' => $reviews,
        ]);
    }

    public function syncReviews(Request $request)
    {
        $user = auth()->user();
        if (! $user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        $token = GoogleBpToken::where('tenant_id', $user->tenant_id)->first();

        // ── LIVE: ada token GBP → fetch ulasan sungguhan ───────────────────────
        if ($token) {
            try {
                $reviews = $this->bp->fetchReviews($user, $token);

                return response()->json([
                    'status' => 'success',
                    'connected' => true,
                    'message' => 'Ulasan terbaru dari Google Business Profile berhasil disinkronkan.',
                    'reviews' => $reviews,
                ]);
            } catch (\Throwable $e) {
                Log::warning('[GBP] sync gagal: '.$e->getMessage());

                return response()->json([
                    'status' => 'error',
                    'connected' => true,
                    'message' => 'Gagal mengambil ulasan dari Google: '.$e->getMessage(),
                ], 502);
            }
        }

        // ── FALLBACK DEMO (transparan): belum terhubung GBP ────────────────────
        // Seed mock agar UI tidak kosong, tapi status:'demo' memberi tahu FE jujur.
        if (config('google-business-profile.fallback_mode') === 'demo') {
            $existingCount = GoogleReview::withoutGlobalScope(TenantScope::class)
                ->where('tenant_id', $user->tenant_id)->count();

            if ($existingCount === 0) {
                // Seed contoh (Pawon Salam) agar panel tidak kosong saat demo.
                $mockReviews = [
                    ['google_review_id' => 'demo_001', 'reviewer_name' => 'RJ Arje', 'rating' => 5, 'comment' => 'Seusai jogging...', 'reviewed_at' => now()->subDays(1)],
                    ['google_review_id' => 'demo_002', 'reviewer_name' => 'Mas M Ramdhani', 'rating' => 5, 'comment' => 'Tempatnya syahdu...', 'reviewed_at' => now()->subDays(2)],
                    ['google_review_id' => 'demo_003', 'reviewer_name' => 'Anisa Indah', 'rating' => 3, 'comment' => 'Makanannya enak...', 'reviewed_at' => now()->subDays(3)],
                ];
                foreach ($mockReviews as $review) {
                    GoogleReview::create([
                        'tenant_id' => $user->tenant_id, 'outlet_id' => $user->outlet_id,
                        'google_review_id' => $review['google_review_id'], 'reviewer_name' => $review['reviewer_name'],
                        'reviewer_photo' => null, 'rating' => $review['rating'], 'comment' => $review['comment'],
                        'reviewed_at' => $review['reviewed_at'],
                    ]);
                }
            }

            $reviews = GoogleReview::orderBy('reviewed_at', 'desc')->get();

            return response()->json([
                'status' => 'demo',
                'connected' => false,
                'message' => 'Menampilkan data contoh. Hubungkan Google Business Profile untuk ulasan sungguhan.',
                'reviews' => $reviews,
            ]);
        }

        // fallback_mode = 'off' → error transparan, tanpa data palsu.
        return response()->json([
            'status' => 'error',
            'connected' => false,
            'message' => 'Belum terhubung ke Google Business Profile. Klik "Hubungkan GBP" terlebih dahulu.',
        ], 400);
    }

    public function reply(Request $request, $id)
    {
        $request->validate([
            'reply_text' => 'required|string|max:2000',
        ]);

        $review = GoogleReview::findOrFail($id);
        $user = auth()->user();

        $token = GoogleBpToken::where('tenant_id', $user->tenant_id)->first();
        if ($token) {
            try {
                $this->bp->postReply($user, $token, $review->google_review_id, $request->input('reply_text'));

                return response()->json([
                    'status' => 'success',
                    'message' => 'Balasan berhasil dipublikasikan ke Google.',
                    'review' => $review->fresh(),
                ]);
            } catch (\Throwable $e) {
                Log::warning('[GBP] reply gagal: '.$e->getMessage());

                return response()->json([
                    'status' => 'error',
                    'message' => 'Gagal mempublikasikan balasan ke Google: '.$e->getMessage(),
                ], 502);
            }
        }

        // Fallback (belum terhubung): simpan lokal saja, transparan.
        $review->update([
            'reply_text' => $request->input('reply_text'),
            'replied_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Balasan disimpan secara lokal (belum terhubung GBP).',
            'review' => $review,
        ]);
    }

    public function generateAiReply(Request $request, $id)
    {
        // ... (dipertahankan persis seperti sebelumnya: template + fallback) ...
        $review = GoogleReview::findOrFail($id);

        if ($review->reviewer_name === 'Budi Sudarsono') {
            return response()->json(['status' => 'success', 'reply' => 'Halo Kak Budi, aduh maaf sekali ya sudah membuat Kak Budi menunggu sate ayamnya sampai 30 menit. Kami paham banget kalau waktu Kak Budi sangat berharga. Kelambatan pelayanan ini langsung kami jadikan bahan evaluasi keras untuk tim kitchen kami malam ini agar koordinasi pesanan lebih responsif. Kalau ada waktu luang, boleh minta kontak Kak Budi via DM/inbox untuk kami kirimkan kompensasi voucher makan sebagai tanda maaf kami? Ditunggu kedatangannya kembali ya Kak.']);
        }
        if ($review->reviewer_name === 'Siti Rahmawati') {
            return response()->json(['status' => 'success', 'reply' => 'Halo Kak Siti, aduh mohon maaf sekali ya atas sikap kasir kami yang kurang ramah kemarin, dan sampai salah menginput pesanan Ribeye Sambal Matah jadi Nasi Goreng. Hal ini sudah kami tegur dan evaluasi langsung bersama tim frontliner agar pelayanan lebih teliti dan selalu senyum menyambut pelanggan. Kami sangat ingin mengirimkan complimentary voucher makan gratis sebagai permohonan maaf kami, boleh tolong kirim kontak Kak Siti ke DM kami? Ditunggu mampir kembali Kak.']);
        }
        if ($review->reviewer_name === 'Anisa Indah') {
            return response()->json(['status' => 'success', 'reply' => 'Halo Kak Anisa, terima kasih banyak sudah mampir sarapan di Pawon Salam Resto. Kami memohon maaf atas antrean kasir yang menumpuk saat makan siang kemarin. Masukan Kak Anisa langsung kami evaluasi dengan tim kasir agar bisa melayani lebih cepat di jam-jam sibuk. Kami tunggu kedatangan berikutnya untuk mencoba menu pindang kudus kami ya Kak. Sehat selalu!']);
        }

        try {
            $prompt = sprintf(
                "Bertindaklah sebagai Owner/Manager Restoran yang ramah, rendah hati, dan sangat peduli dengan masukan pelanggan. Tulis satu tanggapan ulasan Google Review yang sangat manusiawi, tidak kaku, relevan dengan isi komplain/ulasan, dan sama sekali TIDAK terlihat seperti ditulis oleh template AI.\n\n".
                "PANDUAN PENULISAN JAWABAN:\n".
                "1. Sapa pelanggan dengan nama panggilan akrab Indonesia yang wajar (contoh: 'Halo Kak %s').\n".
                "2. Jika rating %d bintang (Ulasan Negatif/Komplain): segera minta maaf dengan tulus, tuliskan tindakan nyata, undang menghubungi tim untuk kompensasi.\n".
                "3. Jika rating >= 4 bintang (Ulasan Positif): ucapkan terima kasih hangat, sebut item spesifik, tunggu kehadiran kembali.\n".
                "4. Gaya: Indonesia kasual-profesional mengalir alami. Hindari kata kaku.\n\n".
                "ULASAN PELANGGAN:\nNama: %s\nRating: %d Bintang\nKomentar: \"%s\"",
                $review->reviewer_name, $review->rating, $review->reviewer_name, $review->rating, $review->comment ?? '(Tanpa komentar tertulis)'
            );

            $response = RestokuAiAssistant::make()->prompt($prompt);

            return response()->json(['status' => 'success', 'reply' => trim((string) $response)]);
        } catch (\Exception $e) {
            Log::error('[AI Review Reply] Error: '.$e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Gagal membuat balasan AI: '.$e->getMessage(),
            ], 502);
        }
    }

    public function saveSettings(Request $request)
    {
        $request->validate([
            'google_place_id' => 'required|string|max:255',
            'api_key' => 'nullable|string|max:255',
        ]);

        // Simpan Place ID asli (bisa hex Maps / ChIJ). TIDAK memalsukan jadi ChIJ palsu.
        session(['google_place_id' => $request->input('google_place_id')]);

        return response()->json([
            'status' => 'success',
            'message' => 'Pengaturan Google Review berhasil disimpan.',
        ]);
    }

    // ── Google Business Profile OAuth ─────────────────────────────────────────

    public function bpConnect(Request $request)
    {
        $user = auth()->user();
        if (! $user) {
            abort(401);
        }

        return redirect($this->bp->authorizeUrl($user));
    }

    public function bpCallback(Request $request)
    {
        $user = auth()->user();
        if (! $user) {
            abort(401);
        }
        if ($request->has('error')) {
            return redirect('/owner/google-reviews')->with('error', 'Otorisasi Google dibatalkan.');
        }
        if (! $request->filled('code')) {
            return redirect('/owner/google-reviews')->with('error', 'Kode otorisasi tidak ditemukan.');
        }

        try {
            $this->bp->exchangeCode($user, $request->input('code'));
        } catch (\Throwable $e) {
            Log::warning('[GBP] callback gagal: '.$e->getMessage());

            return redirect('/owner/google-reviews')->with('error', 'Gagal menghubungkan ke Google Business Profile.');
        }

        return redirect('/owner/google-reviews')->with('success', 'Berhasil terhubung ke Google Business Profile. Pilih lokasi resto Anda.');
    }

    public function bpLocations(Request $request)
    {
        $user = auth()->user();
        $token = GoogleBpToken::where('tenant_id', $user->tenant_id)->first();
        if (! $token) {
            return response()->json(['status' => 'error', 'message' => 'Belum terhubung GBP.'], 400);
        }

        $locations = $this->bp->listLocations($token);

        return response()->json(['status' => 'success', 'locations' => $locations]);
    }

    public function bpSelectLocation(Request $request)
    {
        $request->validate([
            'location_id' => 'required|string',
            'location_name' => 'nullable|string',
        ]);

        $user = auth()->user();
        $token = GoogleBpToken::where('tenant_id', $user->tenant_id)->firstOrFail();
        $token->update([
            'location_id' => $request->input('location_id'),
            'location_name' => $request->input('location_name'),
        ]);

        return response()->json(['status' => 'success', 'message' => 'Lokasi dipilih.']);
    }
}
