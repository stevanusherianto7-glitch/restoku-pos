<?php

namespace App\Http\Controllers;

use App\Ai\Agents\RestokuAiAssistant;
use App\Services\PromptSanitizer;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class GeminiAiController extends Controller
{
    public function __construct(
        private PromptSanitizer $sanitizer,
    ) {}

    public function chat(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        $raw = $request->input('message');

        // 🛡️ Audit-followup: sanitasi prompt-injection SEBELUM dikirim ke LLM.
        if ($this->sanitizer->looksInjected($raw)) {
            Log::warning('[Gemini AI] Possible prompt-injection blocked', [
                'tenant_id' => auth()->id() ? auth()->user()->tenant_id : null,
                'user_id' => auth()->id(),
                'snippet' => mb_substr($raw, 0, 200),
            ]);

            return response()->json([
                'status' => 'error',
                'message' => 'Pesan ditolak karena pola yang tidak aman.',
            ], 422);
        }
        $message = $this->sanitizer->sanitize($raw);

        $user = auth()->user();

        try {
            // Sertakan konteks tenant dan outlet agar Gemini dapat menjalankan tool (seperti TenantTaxConfigTool & OutletOperatingHoursTool)
            $prompt = sprintf(
                "[Konteks Pengguna: %s (Role: %s), Outlet ID: %s, Tenant ID: %s]\nPertanyaan: %s",
                $user ? $user->name : 'Manager',
                $user ? $user->role : 'manager',
                $user ? ($user->outlet_id ?? 'null') : 'null',
                $user ? ($user->tenant_id ?? 'null') : 'null',
                $message
            );

            $response = RestokuAiAssistant::make()->prompt($prompt);

            return response()->json([
                'status' => 'success',
                'reply' => (string) $response,
            ]);
        } catch (\Exception $e) {
            Log::warning('[Gemini AI] Primary provider failed: '.$e->getMessage().'. Attempting fallback to gemini.');
            try {
                // S-17 FIX: JANGAN mutate global config(['ai.default'=>...]) — itu race-condition
                // antar tenant/request (state global mutable per-proses). Gunakan provider per-call.
                $response = RestokuAiAssistant::make()->prompt($prompt, [], 'gemini');

                return response()->json([
                    'status' => 'success',
                    'reply' => (string) $response,
                ]);
            } catch (\Exception $fallbackException) {
                Log::error('[Gemini AI] Fallback to gemini also failed: '.$fallbackException->getMessage());

                return response()->json([
                    'status' => 'error',
                    'message' => 'Maaf, Asisten AI sedang sibuk atau mengalami kendala koneksi.',
                ], 500);
            }
        }

    }
}
