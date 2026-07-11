// Pure geocoding fallback (no React / no DOM). Mirrors the keyword map that was
// previously inlined inside PengaturanOutlet/Index.tsx so it can be unit-tested
// deterministically. Returns default Jakarta center when no keyword matches.

export interface Coords {
    lat: string;
    lng: string;
}

const RULES: Array<{ keywords: string[]; coords: Coords }> = [
    {
        keywords: ['SENOPATI', 'KEBAYORAN', 'JAKARTA SELATAN'],
        coords: { lat: '-6.223847', lng: '106.808162' },
    },
    {
        keywords: ['JAKARTA BARAT', 'PURI INDAH'],
        coords: { lat: '-6.168329', lng: '106.758852' },
    },
    {
        keywords: ['JAKARTA UTARA', 'PIK', 'PLUIT'],
        coords: { lat: '-6.111248', lng: '106.782631' },
    },
    {
        keywords: ['JAKARTA PUSAT', 'MENTENG', 'SUDIRMAN'],
        coords: { lat: '-6.186486', lng: '106.829432' },
    },
    {
        keywords: ['JAKARTA TIMUR', 'JATINEGARA'],
        coords: { lat: '-6.225014', lng: '106.886034' },
    },
    { keywords: ['SURABAYA'], coords: { lat: '-7.257487', lng: '112.752090' } },
    { keywords: ['BANDUNG'], coords: { lat: '-6.917464', lng: '107.619123' } },
    {
        keywords: ['BALI', 'KUTA', 'SEMINYAK', 'DENPASAR'],
        coords: { lat: '-8.409518', lng: '115.188919' },
    },
    { keywords: ['MEDAN'], coords: { lat: '3.595196', lng: '98.672223' } },
    { keywords: ['MAKASSAR'], coords: { lat: '-5.147665', lng: '119.432731' } },
    {
        keywords: ['JOGJA', 'YOGYAKARTA'],
        coords: { lat: '-7.795580', lng: '110.369490' },
    },
    { keywords: ['SEMARANG'], coords: { lat: '-6.966667', lng: '110.416667' } },
];

const DEFAULT: Coords = { lat: '-6.200000', lng: '106.816666' };

export function runLocalGeocoder(address: string): Coords {
    const upper = address.toUpperCase();
    for (const rule of RULES) {
        if (rule.keywords.some((k) => upper.includes(k))) {
            return rule.coords;
        }
    }
    return DEFAULT;
}
