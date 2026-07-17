// ─── Reservation Types ────────────────────────────────────────────────────────
// Status reservasi mengikuti nilai string di DB (tidak ada enum di model).
// 'pending' = status internal API; 'Menunggu Konfirmasi' = label tampilan.

export type ReservationStatus =
    | 'pending'
    | 'Menunggu Konfirmasi'
    | 'dikonfirmasi'
    | 'Dikonfirmasi'
    | 'selesai'
    | 'Selesai'
    | 'dibatalkan'
    | 'Dibatalkan';

export interface Reservation {
    id: number;
    tenant_id: number;
    outlet_id: number | null;
    name: string;
    phone: string | null;
    date: string;
    time: string | null;
    guests: number;
    status: ReservationStatus;
    notes: string | null;
    reservation_code: string;
    [key: string]: unknown;
}
