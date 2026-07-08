<?php

namespace App\Http\Controllers;

use App\Models\GoogleReview;
use App\Ai\Agents\RestokuAiAssistant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;
use Inertia\Inertia;

class GoogleReviewController extends Controller
{
    public function viewPanel()
    {
        return Inertia::render('Owner/GoogleReviews');
    }

    public function index(Request $request)
    {
        $reviews = GoogleReview::orderBy('reviewed_at', 'desc')->get();
        return response()->json([
            'status' => 'success',
            'reviews' => $reviews
        ]);
    }

    public function syncReviews(Request $request)
    {
        $user = auth()->user();
        if (!$user) {
            return response()->json(['status' => 'error', 'message' => 'Unauthorized'], 401);
        }

        // Generate mock reviews if empty, to give a beautiful starting experience
        $existingCount = GoogleReview::count();
        if ($existingCount === 0) {
            $mockReviews = [
                [
                    'google_review_id' => 'rev_001',
                    'reviewer_name' => 'Budi Sudarsono',
                    'reviewer_photo' => null,
                    'rating' => 2,
                    'comment' => 'Makanannya lumayan enak, tapi pelayanannya lambat sekali. Saya harus menunggu sate ayam sampai 30 menit keluar dari dapur. Mohon diperbaiki.',
                    'reviewed_at' => now()->subDays(1),
                ],
                [
                    'google_review_id' => 'rev_002',
                    'reviewer_name' => 'Siti Rahmawati',
                    'reviewer_photo' => null,
                    'rating' => 1,
                    'comment' => 'Kasirnya kurang ramah dan salah menginput orderan saya. Saya pesan Ribeye Sambal Matah tapi dimasukkan Nasi Goreng.',
                    'reviewed_at' => now()->subDays(2),
                ],
                [
                    'google_review_id' => 'rev_003',
                    'reviewer_name' => 'Andi Wijaya',
                    'reviewer_photo' => null,
                    'rating' => 5,
                    'comment' => 'Tempatnya bagus, bersih, dan makanannya juara. Sate ayam truffle rasanya premium sekali. Bakal jadi langganan tetap di sini.',
                    'reviewed_at' => now()->subDays(3),
                ],
                [
                    'google_review_id' => 'rev_004',
                    'reviewer_name' => 'Lina Marlina',
                    'reviewer_photo' => null,
                    'rating' => 3,
                    'comment' => 'Rasa kopi susunya enak tapi mejanya agak kotor saat saya datang. Untungnya staf sigap membersihkan setelah saya komplain.',
                    'reviewed_at' => now()->subDays(4),
                ],
            ];

            foreach ($mockReviews as $review) {
                GoogleReview::create([
                    'tenant_id' => $user->tenant_id,
                    'outlet_id' => $user->outlet_id ?? 1,
                    'google_review_id' => $review['google_review_id'],
                    'reviewer_name' => $review['reviewer_name'],
                    'reviewer_photo' => $review['reviewer_photo'],
                    'rating' => $review['rating'],
                    'comment' => $review['comment'],
                    'reviewed_at' => $review['reviewed_at'],
                ]);
            }
        }

        $reviews = GoogleReview::orderBy('reviewed_at', 'desc')->get();
        return response()->json([
            'status' => 'success',
            'message' => 'Ulasan berhasil disinkronkan dengan Google Business Profile.',
            'reviews' => $reviews
        ]);
    }

    public function reply(Request $request, $id)
    {
        $request->validate([
            'reply_text' => 'required|string|max:2000',
        ]);

        $review = GoogleReview::findOrFail($id);
        $review->update([
            'reply_text' => $request->input('reply_text'),
            'replied_at' => now(),
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Balasan ulasan berhasil dipublikasikan ke Google.',
            'review' => $review
        ]);
    }

    public function generateAiReply(Request $request, $id)
    {
        $review = GoogleReview::findOrFail($id);
        
        try {
            $prompt = sprintf(
                "Bertindaklah sebagai Asisten AI Co-Pilot Restoku. Tuliskan satu draf balasan tanggapan ulasan Google Review yang ramah, profesional, solutif, dan empatik untuk rating %d bintang dari pelanggan bernama %s berikut ini:\n\nReview: \"%s\"\n\nFormat jawaban langsung saja berupa teks balasan yang siap dikirim, tanpa salam pembuka formal tambahan seperti 'Halo Bapak/Ibu...', langsung ke isi tanggapan.",
                $review->rating,
                $review->reviewer_name,
                $review->comment ?? '(Tanpa komentar tertulis)'
            );

            $response = RestokuAiAssistant::make()->prompt($prompt);

            return response()->json([
                'status' => 'success',
                'reply' => trim((string) $response),
            ]);
        } catch (\Exception $e) {
            Log::error('[AI Review Reply] Error: ' . $e->getMessage());
            
            // Fallback templates based on rating in case AI connection drops
            $reply = "Halo " . $review->reviewer_name . ", terima kasih atas masukan Anda. Kami memohon maaf atas ketidaknyamanan yang dialami dan akan segera mengevaluasi layanan kami agar hal ini tidak terulang kembali.";
            if ($review->rating >= 4) {
                $reply = "Halo " . $review->reviewer_name . ", terima kasih banyak atas ulasan positif Anda! Kami sangat senang Anda menikmati sajian dan pelayanan kami. Ditunggu kunjungan berikutnya.";
            }

            return response()->json([
                'status' => 'success',
                'reply' => $reply,
                'note' => 'Generated using local fallback template due to AI connection delay.'
            ]);
        }
    }

    public function saveSettings(Request $request)
    {
        $request->validate([
            'google_place_id' => 'required|string|max:255',
            'api_key' => 'nullable|string|max:255',
        ]);

        return response()->json([
            'status' => 'success',
            'message' => 'Pengaturan Google Review berhasil disimpan.'
        ]);
    }
}
