// ─── Formatters ───────────────────────────────────────────────────────────────
// Centralized locale-aware formatters for Indonesian Rupiah & dates.

/**
 * Format a number as Indonesian Rupiah currency.
 * @example formatRupiah(15000) → "Rp 15.000"
 */
export const formatRupiah = (amount: number): string =>
    new Intl.NumberFormat('id-ID', {
        style: 'currency',
        currency: 'IDR',
        minimumFractionDigits: 0,
    }).format(amount);

/**
 * Format a Date object as a full Indonesian date string.
 * @example formatDate() → "Senin, 7 Juli 2026"
 */
export const formatDate = (date: Date = new Date()): string =>
    new Intl.DateTimeFormat('id-ID', {
        weekday: 'long',
        day: 'numeric',
        month: 'long',
        year: 'numeric',
    }).format(date);

/**
 * Format a Date as short Indonesian date.
 * @example formatDateShort() → "07/07/2026"
 */
export const formatDateShort = (date: Date = new Date()): string =>
    new Intl.DateTimeFormat('id-ID', {
        day: '2-digit',
        month: '2-digit',
        year: 'numeric',
    }).format(date);

/**
 * Format a Date as time string.
 * @example formatTime() → "14:30"
 */
export const formatTime = (date: Date = new Date()): string =>
    new Intl.DateTimeFormat('id-ID', {
        hour: '2-digit',
        minute: '2-digit',
        hour12: false,
    }).format(date);

/**
 * Format a number as a compact currency (for small screens).
 * @example formatRupiahCompact(15000000) → "Rp 15jt"
 */
export const formatRupiahCompact = (amount: number): string => {
    if (amount >= 1_000_000_000) return `Rp ${(amount / 1_000_000_000).toFixed(1)}M`;
    if (amount >= 1_000_000) return `Rp ${(amount / 1_000_000).toFixed(1)}jt`;
    if (amount >= 1_000) return `Rp ${(amount / 1_000).toFixed(0)}rb`;
    return formatRupiah(amount);
};

/**
 * Format a percentage value.
 * @example formatPercent(0.1245) → "12.45%"
 */
export const formatPercent = (value: number, decimals = 1): string => `${(value * 100).toFixed(decimals)}%`;
