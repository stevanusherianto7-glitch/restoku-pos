export function buildMenuUrl(base: string, slug: string, table?: string): string {
    if (!base || !slug) return '';
    const cleanBase = base.replace(/\/+$/, '');
    const cleanSlug = slug.replace(/^\/+/, '');
    const url = `${cleanBase}/m/${cleanSlug}`;
    // `table` opsional (label meja bebas owner: A1, 01, Meja 7). Tamu scan QR
    // per-meja -> ?t={table}. Bukan bagian dari cache key menu (menu per-outlet).
    if (table) {
        const cleanTable = String(table).trim();
        if (cleanTable) return `${url}?t=${encodeURIComponent(cleanTable)}`;
    }
    return url;
}
