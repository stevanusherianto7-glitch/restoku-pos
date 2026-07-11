// URL-hash tab navigation maps for PengaturanOutlet. Pure (no React) so the
// slug<->label resolution can be unit-tested deterministically.

export const TAB_SLUGS: Record<string, string> = {
    'Profil Outlet': 'profil',
    'Lokasi Restoran': 'lokasi',
    'Pajak & Tarif': 'pajak',
    'Tampilan Struk': 'struk',
    'Jam Operasional': 'jam',
};

export const SLUG_TO_TAB: Record<string, string> = Object.fromEntries(
    Object.entries(TAB_SLUGS).map(([k, v]) => [v, k]),
);

export function slugFromTab(label: string): string {
    return TAB_SLUGS[label] ?? 'profil';
}

export function tabFromSlug(slug: string | null): string | null {
    if (!slug) return null;
    return SLUG_TO_TAB[slug] ?? null;
}
