<?php

namespace App\Http\Controllers;

use App\Ai\Agents\RestokuAiAssistant;
use App\Models\GoogleReview;
use App\Models\Outlet;
use App\Models\Scopes\TenantScope;
use App\Services\GoogleBusinessProfileService;
use App\Services\PlaceIdResolver;
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

    /**
     * List ulasan real-time dari Google Places API (by Place ID outlet).
     * Prioritas: BELUM DIBALAS (reply_text IS NULL) di-front, sort terbaru.
     * Status "belum dibalas" dilacak LOKAL (Places API read-only tdk return balasan).
     */
    public function index(Request $request)
    {
        $user = auth()->user();
        $outletId = $user->outlet_id ?: Outlet::where('tenant_id', $user->tenant_id)->orderBy('id')->value('id');
        $outlet = Outlet::withoutGlobalScope(TenantScope::class)
            ->where('id', $outletId)
            ->first();

        $placeId = $outlet?->google_place_id;
        $source = $placeId ? 'places' : 'local';

        if ($placeId) {
            try {
                $payload = $this->bp->fetchReviewsFromPlaceId($placeId, $outlet->id, $user->tenant_id);

                // Tandai review yang SUDAH dibalas lokal (copy-to-clipboard) → pisah list.
                $unreplied = [];
                $replied = [];
                foreach ($payload['reviews'] as $r) {
                    if (empty($r->reply_text)) {
                        $unreplied[] = $r;
                    } else {
                        $replied[] = $r;
                    }
                }

                return response()->json([
                    'status' => 'success',
                    'source' => 'places',
                    'place_id' => $placeId,
                    'rating' => $payload['rating'],
                    'user_ratings_total' => $payload['user_ratings_total'],
                    'unreplied' => $unreplied,
                    'replied' => $replied,
                ]);
            } catch (\Throwable $e) {
                Log::warning('[Places] fetch gagal: '.$e->getMessage());

                return response()->json([
                    'status' => 'error',
                    'source' => 'places',
                    'message' => 'Gagal mengambil ulasan dari Google. Silakan coba lagi.',
                ], 502);
            }
        }

        // Tanpa Place ID → tampilkan review lokal yang sudah ada (jika ada), transparan.
        $localReviews = GoogleReview::where('outlet_id', $outlet?->id)->orderByDesc('reviewed_at')->get();
        $unreplied = [];
        $replied = [];
        foreach ($localReviews as $r) {
            if (empty($r->reply_text)) {
                $unreplied[] = $r;
            } else {
                $replied[] = $r;
            }
        }

        return response()->json([
            'status' => 'none',
            'source' => 'local',
            'message' => 'Tempel link Google Maps restoran Anda untuk menampilkan ulasan sungguhan.',
            'unreplied' => $unreplied,
            'replied' => $replied,
            'rating' => null,
            'user_ratings_total' => null,
            'place_id' => null,
        ]);
    }

    /**
     * Simpan link Google Maps → resolve ke Place ID → simpan di outlet.
     * Tenant CUKUP tempel link (bisa berisi koordinat @lat,lng) → auto-detect robust.
     */
    public function saveSettings(Request $request)
    {
        $request->validate([
            'google_place_link' => 'required|string|max:2000',
        ]);

        $user = auth()->user();
        $placeId = (new PlaceIdResolver)->resolve($request->input('google_place_link'));

        if (! $placeId) {
            return response()->json([
                'status' => 'error',
                'message' => 'Link tidak dikenali. Tempel link Google Maps lengkap (berisi nama/koordinat resto).',
            ], 422);
        }

        $outletId = $user->outlet_id ?: Outlet::where('tenant_id', $user->tenant_id)->orderBy('id')->value('id');
        $outlet = Outlet::withoutGlobalScope(TenantScope::class)
            ->where('id', $outletId)
            ->firstOrFail();
        $outlet->update(['google_place_id' => $placeId]);

        return response()->json([
            'status' => 'success',
            'message' => 'Link tersimpan. Ulasan akan ditampilkan secara real-time.',
            'place_id' => $placeId,
        ]);
    }

    /**
     * Generate balasan AI via Groq untuk SEMUA ulasan (tanpa template hardcoded).
     * Catch → 502 transparan (bukan fake success).
     */
    public function generateAiReply(Request $request, $id)
    {
        $review = GoogleReview::findOrFail($id);

        // SECURITY FIX: Pastikan review milik tenant yang sedang login.
        if ($review->tenant_id !== auth()->user()->tenant_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ulasan tidak ditemukan.',
            ], 404);
        }

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

        try {
            $response = RestokuAiAssistant::make()->prompt($prompt);

            return response()->json(['status' => 'success', 'reply' => trim((string) $response)]);
        } catch (\Exception $e) {
            Log::warning('[AI Review Reply] Primary provider failed: '.$e->getMessage().'. Attempting fallback to gemini.');
            try {
                // Set default provider to gemini at runtime
                config(['ai.default' => 'gemini']);
                
                $response = RestokuAiAssistant::make()->prompt($prompt);
                
                return response()->json(['status' => 'success', 'reply' => trim((string) $response)]);
            } catch (\Exception $fallbackException) {
                Log::error('[AI Review Reply] Fallback to gemini also failed: '.$fallbackException->getMessage());
                return response()->json([
                    'status' => 'error',
                    'message' => 'Gagal membuat balasan AI: ' . $fallbackException->getMessage(),
                ], 502);
            }
        }

    }

    /**
     * Tandai ulasan sudah dibalas (owner copy balasan ke Google secara manual).
     * Places API read-only → kita lacak status lokal agar tab "Belum Dibalas" akurat.
     */
    public function reply(Request $request, $id)
    {
        $request->validate([
            'reply_text' => 'required|string|max:2000',
        ]);

        $review = GoogleReview::findOrFail($id);

        // SECURITY FIX: Pastikan review milik tenant yang sedang login.
        if ($review->tenant_id !== auth()->user()->tenant_id) {
            return response()->json([
                'status' => 'error',
                'message' => 'Ulasan tidak ditemukan.',
            ], 404);
        }

        $review->update([
            'reply_text' => $request->input('reply_text'),
            'replied_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Balasan disimpan. Silakan salin & tempel ke Google Maps untuk mempublikasikan.',
            'review' => $review,
        ]);
    }
}
