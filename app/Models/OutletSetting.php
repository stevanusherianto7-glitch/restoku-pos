<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

/**
 * OutletSetting — konfigurasi per outlet: jam operasional, struk, printer, KDS.
 *
 * Mengkonsolidasikan data dari:
 *   - outlets.operating_hours (JSON)
 *   - receipt_configs (tabel terpisah — deprecated)
 *
 * @property int $outlet_id
 * @property ?array $operating_hours
 * @property ?string $receipt_header
 * @property ?string $receipt_footer
 * @property string $paper_width
 * @property string $font_type
 * @property bool $show_pbjt
 * @property bool $show_service_charge
 * @property bool $show_ppn
 * @property ?string $printer_ip
 * @property int $printer_port
 * @property bool $auto_print_on_order
 */
class OutletSetting extends Model
{
    protected $table = 'outlet_settings';

    protected $fillable = [
        'outlet_id',
        'operating_hours',
        'receipt_header',
        'receipt_footer',
        'paper_width',
        'font_type',
        'show_pbjt',
        'show_service_charge',
        'show_ppn',
        'printer_ip',
        'printer_port',
        'auto_print_on_order',
        'kds_display_mode',
        'kds_alert_minutes',
        'screen_mode',
    ];

    protected $casts = [
        'operating_hours' => 'array',
        'show_pbjt' => 'boolean',
        'show_service_charge' => 'boolean',
        'show_ppn' => 'boolean',
        'auto_print_on_order' => 'boolean',
        'printer_port' => 'integer',
        'kds_alert_minutes' => 'integer',
    ];

    // ─── Defaults ─────────────────────────────────────────────────────────────

    public static function defaults(): array
    {
        return [
            'operating_hours' => self::defaultOperatingHours(),
            'receipt_header' => null,
            'receipt_footer' => 'Terima kasih atas kunjungan Anda!',
            'paper_width' => '80mm',
            'font_type' => 'font-a',
            'show_pbjt' => true,
            'show_service_charge' => false,
            'show_ppn' => false,
            'printer_ip' => null,
            'printer_port' => 9100,
            'auto_print_on_order' => false,
            'kds_display_mode' => 'grid',
            'kds_alert_minutes' => 10,
            'screen_mode' => 'light',
        ];
    }

    /**
     * Default operating hours: Senin–Minggu 08:00–22:00, semua buka.
     */
    public static function defaultOperatingHours(): array
    {
        $days = ['mon', 'tue', 'wed', 'thu', 'fri', 'sat', 'sun'];

        return array_fill_keys($days, ['open' => '08:00', 'close' => '22:00', 'closed' => false]);
    }

    // ─── Relations ────────────────────────────────────────────────────────────

    public function outlet(): BelongsTo
    {
        return $this->belongsTo(Outlet::class);
    }

    // ─── Accessors ────────────────────────────────────────────────────────────

    /**
     * Apakah outlet sedang buka berdasarkan operating_hours?
     */
    public function isOpenNow(): bool
    {
        $hours = $this->operating_hours;
        if (! $hours) {
            return true;
        } // default: selalu buka

        $dayKey = strtolower(now()->format('D')); // 'mon', 'tue', dll.
        $day = $hours[$dayKey] ?? null;

        if (! $day || ($day['closed'] ?? false)) {
            return false;
        }

        $now = now()->format('H:i');

        return $now >= $day['open'] && $now <= $day['close'];
    }

    /**
     * Data operating hours yang aman untuk di-share ke frontend (tamu/publik).
     * Digunakan oleh endpoint GET /api/outlet-operating-hours
     */
    public function toPublicScheduleArray(): array
    {
        return [
            'is_open_now' => $this->isOpenNow(),
            'operating_hours' => $this->operating_hours ?? self::defaultOperatingHours(),
        ];
    }
}
