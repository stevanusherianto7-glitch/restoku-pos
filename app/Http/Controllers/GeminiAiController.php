<?php

namespace App\Http\Controllers;

use App\Ai\Agents\RestokuAiAssistant;
use Illuminate\Http\Request;
use Illuminate\Support\Facades\Log;

class GeminiAiController extends Controller
{
    public function chat(Request $request)
    {
        $request->validate([
            'message' => 'required|string|max:1000',
        ]);

        $message = $request->input('message');
        $user = auth()->user();

        try {
            // Sertakan konteks tenant dan outlet agar Gemini dapat menjalankan tool (seperti TenantTaxConfigTool & OutletOperatingHoursTool)
            $prompt = sprintf(
                "[Konteks Pengguna: %s (Role: %s), Outlet ID: %s, Tenant ID: %s]\nPertanyaan: %s",
                $user ? $user->name : 'Manager',
                $user ? $user->role : 'manager',
                $user ? ($user->outlet_id ?? 1) : 1,
                $user ? ($user->tenant_id ?? 1) : 1,
                $message
            );

            $response = RestokuAiAssistant::make()->prompt($prompt);

            return response()->json([
                'status' => 'success',
                'reply' => (string) $response,
            ]);
        } catch (\Exception $e) {
            Log::error('[Gemini AI] Error: '.$e->getMessage());

            return response()->json([
                'status' => 'error',
                'message' => 'Maaf, Gemini AI sedang sibuk atau mengalami kendala koneksi.',
            ], 500);
        }
    }
}
