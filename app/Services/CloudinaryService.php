<?php

namespace App\Services;

use Illuminate\Support\Facades\Http;
use RuntimeException;

/**
 * CloudinaryService — upload foto menu ke Cloudinary (CDN offload).
 *
 * Keputusan Architect (Fase 1, diserap dari Cloudinary Skills):
 *  - Server-side SIGNED upload via HTTP facade (secret TIDAK pernah ke client).
 *  - Path logical per-tenant: restoku/{tenant_id}/menu/{hash} -> isolasi multi-tenant.
 *  - Transform on-the-fly: incoming f_auto,q_auto + eager thumbnail grid (c_fill,w_500,h_500).
 *  - Return associative ['url' => secure_url, 'public_id' => ...] supaya bisa di-destroy.
 *  - Tanpa CLOUDINARY_URL (local/testing) -> fallback null (jangan throw), frontend placeholder.
 */
class CloudinaryService
{
    /**
     * Upload file (base64 data URL atau path temp) ke Cloudinary.
     *
     * @param  string  $fileData  Path file temp ATAU data URL base64 (harus image)
     * @param  int  $tenantId  Untuk namespacing folder (isolasi)
     * @param  string  $folder  Sub-folder (default 'menu')
     * @return array|null ['url' => secure_url, 'public_id' => string] atau null bila tanpa config
     */
    public function uploadMenuPhoto(string $fileData, int $tenantId, string $folder = 'menu'): ?array
    {
        // Sanity: hanya terima image (data URL harus diawali data:image).
        if (! $this->isImage($fileData)) {
            throw new RuntimeException('File bukan gambar valid (harus data:image atau path gambar).');
        }

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
            'transformation' => 'f_auto,q_auto',
            'eager' => 'c_fill,w_500,h_500,f_auto,q_auto',
            'eager_async' => true,
            'return_delete_token' => true,
        ];
        $params['signature'] = $this->sign($params, $config['secret']);
        $params['api_key'] = $config['key'];

        // Tentukan field 'file'
        if (preg_match('/^data:/', $fileData)) {
            $params['file'] = $fileData;               // data URL (upload dari frontend)
        } elseif (preg_match('#^https?://#', $fileData)) {
            $params['file'] = $fileData;               // remote URL (Cloudinary fetch upload)
        } else {
            $params['file'] = fopen($fileData, 'r');   // path lokal temp
        }

        $response = Http::asMultipart()->post($uploadUrl, $params);
        if (! $response->successful()) {
            throw new RuntimeException('Cloudinary upload gagal: '.$response->body());
        }

        $body = $response->json();

        if (empty($body['secure_url']) || empty($body['public_id'])) {
            return null;
        }

        return [
            'url' => $body['secure_url'],
            'public_id' => $body['public_id'],
        ];
    }

    /**
     * Hapus asset dari Cloudinary berdasarkan public_id (saat ganti/hapus foto menu).
     *
     * @return bool true = berhasil dihapus / di-skip (tanpa config), false = gagal API
     */
    public function deleteMenuPhoto(string $publicId): bool
    {
        $config = $this->parseConfig();
        if (! $config) {
            // Tanpa config: tidak ada asset di Cloudinary -> anggap sukses (no-op).
            return true;
        }

        $destroyUrl = "https://api.cloudinary.com/v1_1/{$config['cloud']}/image/destroy";

        $params = [
            'timestamp' => time(),
            'public_id' => $publicId,
        ];
        $params['signature'] = $this->sign($params, $config['secret']);
        $params['api_key'] = $config['key'];

        $response = Http::asForm()->post($destroyUrl, $params);
        if (! $response->successful()) {
            return false;
        }

        $body = $response->json();

        // result: "ok" (deleted) atau "not found" (sudah hilang) -> dua-duanya aman.
        return in_array($body['result'] ?? null, ['ok', 'not found'], true);
    }

    /**
     * Cek apakah input berupa gambar valid.
     */
    private function isImage(string $fileData): bool
    {
        if (preg_match('/^data:image\//', $fileData)) {
            return true;
        }
        if (preg_match('/^data:/', $fileData)) {
            return false; // data URL tapi bukan image
        }

        // Path file: cek ekstensi umum (best-effort, bukan validasi mime penuh).
        return (bool) preg_match('/\.(jpe?g|png|webp|gif|avif|bmp)$/i', $fileData);
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
            // boolean true -> "1", false -> di-skip (Cloudinary convention)
            if (is_bool($v)) {
                if (! $v) {
                    continue;
                }
                $v = '1';
            }
            $raw .= "$k=".($v ?? '').'&';
        }
        $raw = rtrim($raw, '&');

        return sha1($raw.$secret);
    }
}
