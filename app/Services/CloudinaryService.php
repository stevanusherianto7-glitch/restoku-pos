<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * CloudinaryService — upload foto menu ke Cloudinary (CDN offload).
 *
 * Keputusan Architect (Fase 1):
 *  - TIDAK pakai SDK penuh; cukup signed upload via HTTP facade (Laravel bawaan).
 *  - Path logical per-tenant: restoku/{tenant_id}/menu/{hash} -> isolasi multi-tenant.
 *  - Return secure URL (https), bukan path storage lokal (cegah kebocoran internal).
 *  - Di testing/tanpa config -> fallback ke placeholder URL (jangan throw).
 */
class CloudinaryService
{
    /**
     * Upload file (base64 data URL atau path temp) ke Cloudinary.
     * Mengembalikan secure URL, atau null bila config tidak tersedia.
     *
     * @param  string  $fileData  Path file temp ATAU data URL base64
     * @param  int  $tenantId  Untuk namespacing folder (isolasi)
     * @param  string  $folder  Sub-folder (default 'menu')
     */
    public function uploadMenuPhoto(string $fileData, int $tenantId, string $folder = 'menu'): ?string
    {
        $config = $this->parseConfig();
        if (! $config) {
            // Tanpa config (local/testing): kembalikan null -> frontend placeholder.
            return null;
        }

        $uploadUrl = "https://api.cloudinary.com/v1_1/{$config['cloud']}/image/upload";

        // Build signed params (wajib untuk keamanan — secret tidak ke frontend).
        $params = [
            'timestamp' => time(),
            'folder' => "restoku/{$tenantId}/{$folder}",
        ];
        $params['signature'] = $this->sign($params, $config['secret']);
        $params['api_key'] = $config['key'];

        // Tentukan field 'file'
        if (preg_match('/^data:/', $fileData)) {
            $params['file'] = $fileData;               // data URL
        } else {
            $params['file'] = fopen($fileData, 'r');   // path temp
        }

        $response = Http::asMultipart()->post($uploadUrl, $params);
        if (! $response->successful()) {
            throw new RuntimeException('Cloudinary upload gagal: '.$response->body());
        }

        $body = $response->json();

        return $body['secure_url'] ?? null;
    }

    /**
     * Parse CLOUDINARY_URL resmi: cloudinary://key:secret@cloud
     */
    private function parseConfig(): ?array
    {
        $url = config('services.cloudinary.url');
        if (! $url || ! str_starts_with($url, 'cloudinary://')) {
            return null;
        }
        $parts = parse_url($url);

        return [
            'cloud' => $parts['host'] ?? null,
            'key' => $parts['user'] ?? null,
            'secret' => $parts['pass'] ?? null,
        ];
    }

    /**
     * Buat signature sesuai dokumentasi Cloudinary (sorted key=value, sha1).
     */
    private function sign(array $params, string $secret): string
    {
        $sorted = $params;
        ksort($sorted);
        $raw = '';
        foreach ($sorted as $k => $v) {
            $raw .= "$k=".($v ?? '').'&';
        }
        $raw = rtrim($raw, '&');

        return sha1($raw.$secret);
    }
}
