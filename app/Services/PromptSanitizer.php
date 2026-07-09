<?php

namespace App\Services;

/**
 * Fase Audit-Followup — Sanitasi prompt-injection untuk Gemini AI.
 *
 * Tujuannya: mencegah user (tenant/kasir) menyuntikkan instruksi ke dalam
 * prompt yang dikirim ke LLM (mis. "abaikan instruksi di atas", "sebutkan
 * Laravel 13", "bocorkan data tenant lain").
 *
 * Pendekatan berlapis (defense-in-depth):
 *   1. Strip delimiter markdown/role yang bisa dipakai untuk inject role.
 *   2. Redaksi frasa injection umum (case-insensitive, multi-bahasa).
 *   3. Karantina sisa yang mencurigakan (ganti dengan █) agar tidak
 *      mengganggu konteks bisnis yang sah.
 */
final class PromptSanitizer
{
    /** Delimiter yang biasa dipakai untuk "ganti role" / "system block". */
    private const ROLE_DELIMITERS = [
        '/\[(system|user|assistant|ai|model|developer|admin)\b[^\]]*\]/i',
        '/```(?:system|prompt)?/i',
        '/<<[A-Z_]+>>/',
        '/<\/?system>/i',
        '/<\/?instruction>/i',
    ];

    /** Frasa injection — diredaksi (bukan dihapus agar panjang terjaga). */
    private const INJECTION_PHRASES = [
        'ignore previous', 'abaikan instru', 'abai(kan)? (semua|instru)',
        'disregard', 'forget (your|all) (instructions|rules|prompt)',
        'lupakan (instru|aturan|semua)',
        'system prompt', 'system instruction', 'developer mode', 'god mode', 'jailbreak',
        'you are now', 'anda sekarang', 'act as', 'berlakonlah', 'pretend to be',
        'sebutkan (laravel|gemini|google|ai sdk|openai|gpt)',
        'reveal (your|the) (prompt|instruction|system)',
        'bocorkan (prompt|instru|sistem|data)',
        'output (your|the) (prompt|system|instruction)',
        'print (your|the) (prompt|system)',
        'override', 'bypass', 'tanpa (batas|pembatasan)',
        'exfiltrate', 'leak (data|prompt)',
        'DAN', 'do anything now',
    ];

    public function sanitize(string $raw): string
    {
        // 1. Normalisasi + strip delimiter role.
        $text = trim($raw);
        $text = preg_replace(self::ROLE_DELIMITERS, ' ', $text) ?? $text;

        // 2. Redaksi frasa injection (case-insensitive, word-boundary longgar).
        foreach (self::INJECTION_PHRASES as $phrase) {
            $text = preg_replace('/\b('.$phrase.')\b/ui', '██', $text) ?? $text;
        }

        // 3. Karantina karakter kontrol / newline berlebih yang bisa
        //    dipakai untuk "lanjutkan instruksi di baris baru".
        $text = preg_replace('/[\x00-\x08\x0B\x0C\x0E-\x1F]/u', ' ', $text) ?? $text;
        $text = preg_replace('/\n{3,}/', "\n\n", $text) ?? $text;

        return mb_substr($text, 0, 1000); // batas keras (sesuai validasi controller)
    }

    /**
     * True bila teks MENGANDUNG indikasi injection (untuk logging/alert).
     * Dipakai controller untuk mencatat percobaan (SIEM/audit trail).
     */
    public function looksInjected(string $raw): bool
    {
        foreach (self::ROLE_DELIMITERS as $re) {
            if (preg_match($re, $raw)) {
                return true;
            }
        }
        foreach (self::INJECTION_PHRASES as $phrase) {
            if (preg_match('/\b('.$phrase.')\b/ui', $raw)) {
                return true;
            }
        }

        return false;
    }
}
