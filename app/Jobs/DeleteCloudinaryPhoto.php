<?php

namespace App\Jobs;

use App\Services\CloudinaryService;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Foundation\Bus\Dispatchable;
use Illuminate\Queue\InteractsWithQueue;
use Illuminate\Queue\SerializesModels;

/**
 * Q23: Hapus foto menu di Cloudinary secara async (queue) agar request HTTP
 * kasir/owner tidak menunggu network call ke Cloudinary.
 * Fallback: bila queue sync/dev, tetap jalan (ShouldQueue + timeout).
 */
class DeleteCloudinaryPhoto implements ShouldQueue
{
    use Dispatchable;
    use InteractsWithQueue;
    use Queueable;
    use SerializesModels;

    public int $tries = 3;

    public int $backoff = 5;

    /**
     * @param  string  $publicId  Cloudinary public_id (bukan URL)
     */
    public function __construct(public readonly string $publicId) {}

    public function handle(CloudinaryService $cloudinary): void
    {
        $cloudinary->deleteMenuPhoto($this->publicId);
    }
}
