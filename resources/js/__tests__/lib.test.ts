import { describe, it, expect } from 'vitest';
import {
    formatRupiah,
    formatDate,
    formatDateShort,
    formatTime,
    formatRupiahCompact,
    formatPercent,
} from '../lib/formatters';
import { cn, generateId, truncate, debounce, clamp, groupBy } from '../lib/utils';
import { buildMenuUrl } from '../lib/menuUrl';
import {
    planHasFeature,
    PLAN_FEATURES,
    ORDER_STATUS,
    PAYMENT_METHODS,
    PLAN_LABELS,
    PLAN_TONES,
    TAX_LABELS,
    TAX_RATES,
    FEATURE_LOCKS,
} from '../lib/constants';

describe('formatters', () => {
    it('formatRupiah formats IDR with no decimals', () => {
        expect(formatRupiah(15000)).toContain('15.000');
        expect(formatRupiah(15000)).toContain('Rp');
        expect(formatRupiah(0)).toContain('0');
        expect(formatRupiah(1234567)).toContain('1.234.567');
    });

    it('formatDate / short / time use id-ID locale', () => {
        const d = new Date('2026-07-07T14:30:00');
        expect(formatDate(d)).toContain('2026');
        expect(formatDateShort(d)).toBe('07/07/2026');
        expect(formatTime(d)).toBe('14.30');
    });

    it('formatDate / short / time default to now without throwing', () => {
        expect(() => formatDate()).not.toThrow();
        expect(() => formatDateShort()).not.toThrow();
        expect(() => formatTime()).not.toThrow();
    });

    it('formatRupiahCompact scales billions / millions / thousands', () => {
        expect(formatRupiahCompact(1_500_000_000)).toBe('Rp 1.5M');
        expect(formatRupiahCompact(15_000_000)).toBe('Rp 15.0jt');
        expect(formatRupiahCompact(15_000)).toBe('Rp 15rb');
        expect(formatRupiahCompact(500)).toContain('500');
    });

    it('formatPercent multiplies by 100 with decimals', () => {
        expect(formatPercent(0.1245)).toBe('12.4%');
        expect(formatPercent(0.1245, 2)).toBe('12.45%');
        expect(formatPercent(1)).toBe('100.0%');
    });
});

describe('utils', () => {
    it('cn merges tailwind classes', () => {
        expect(cn('p-4', 'p-6')).toBe('p-6');
        expect(cn('text-white', undefined, 'block')).toBe('text-white block');
        expect(cn('text-white', false, 'block')).toBe('text-white block');
    });

    it('generateId returns a string', () => {
        const id = generateId();
        expect(typeof id).toBe('string');
        expect(id.length).toBeGreaterThan(0);
    });

    it('truncate respects maxLength', () => {
        expect(truncate('Hello World', 5)).toBe('Hello...');
        expect(truncate('Hi', 5)).toBe('Hi');
    });

    it('clamp bounds value', () => {
        expect(clamp(5, 0, 10)).toBe(5);
        expect(clamp(-1, 0, 10)).toBe(0);
        expect(clamp(11, 0, 10)).toBe(10);
    });

    it('groupBy groups by key', () => {
        const arr = [
            { cat: 'a', val: 1 },
            { cat: 'b', val: 2 },
            { cat: 'a', val: 3 },
        ];
        expect(groupBy(arr, 'cat')).toEqual({
            a: [
                { cat: 'a', val: 1 },
                { cat: 'a', val: 3 },
            ],
            b: [{ cat: 'b', val: 2 }],
        });
    });

    it('debounce delays invocation and clears previous timer', () => {
        vi.useFakeTimers();
        const fn = vi.fn();
        const debounced = debounce(fn, 100);
        debounced();
        debounced();
        expect(fn).not.toHaveBeenCalled();
        vi.advanceTimersByTime(100);
        expect(fn).toHaveBeenCalledTimes(1);
        vi.useRealTimers();
    });
});

describe('menuUrl', () => {
    it('returns empty string when base or slug missing', () => {
        expect(buildMenuUrl('', 'slug')).toBe('');
        expect(buildMenuUrl('http://x.com', '')).toBe('');
    });

    it('builds plain menu url, stripping slashes', () => {
        expect(buildMenuUrl('http://x.com/', '/slug/')).toBe('http://x.com/m/slug');
        expect(buildMenuUrl('http://x.com/', 'slug/')).toBe('http://x.com/m/slug');
    });

    it('appends table param when provided and non-empty', () => {
        expect(buildMenuUrl('http://x.com', 'slug', 'A1')).toBe('http://x.com/m/slug?t=A1');
        expect(buildMenuUrl('http://x.com', 'slug', ' Meja 7 ')).toBe('http://x.com/m/slug?t=Meja%207');
    });

    it('omits table param when empty/whitespace', () => {
        expect(buildMenuUrl('http://x.com', 'slug', '')).toBe('http://x.com/m/slug');
        expect(buildMenuUrl('http://x.com', 'slug', '   ')).toBe('http://x.com/m/slug');
    });
});

describe('constants', () => {
    it('planHasFeature checks plan feature list', () => {
        expect(planHasFeature('pro', 'qrcode_order')).toBe(true);
        expect(planHasFeature('basic', 'kds')).toBe(false);
        expect(planHasFeature('nope' as any, 'x')).toBe(false);
    });

    it('exposes label/status/tax maps', () => {
        expect(ORDER_STATUS.pending).toBe('Menunggu');
        expect(PAYMENT_METHODS.cash).toBe('Tunai');
        expect(PLAN_LABELS.enterprise).toBe('Enterprise');
        expect(PLAN_TONES.basic).toContain('slate');
        expect(TAX_LABELS.pbjt).toContain('PBJT');
        expect(TAX_RATES.ppn).toBe(0.11);
        expect(FEATURE_LOCKS['Buku Menu Digital'].feature).toBe('buku_menu_digital');
    });

    it('PLAN_FEATURES is a record of arrays', () => {
        expect(Array.isArray(PLAN_FEATURES.pro)).toBe(true);
        expect(Array.isArray(PLAN_FEATURES.enterprise)).toBe(true);
    });
});
