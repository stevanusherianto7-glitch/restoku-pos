import { describe, it, expect } from 'vitest';
import { serializeStruk, parseStruk } from '../../lib/strukConfig';

describe('strukConfig', () => {
    it('serializes all fields', () => {
        const raw = serializeStruk({ headerText: 'H', footerText: 'F', paperWidth: '80mm' });
        expect(JSON.parse(raw)).toEqual({ headerText: 'H', footerText: 'F', paperWidth: '80mm' });
    });

    it('parses a valid config', () => {
        const raw = JSON.stringify({ headerText: 'A', footerText: 'B', paperWidth: '58mm' });
        expect(parseStruk(raw)).toEqual({ headerText: 'A', footerText: 'B', paperWidth: '58mm' });
    });

    it('parses partial fields', () => {
        expect(parseStruk(JSON.stringify({ headerText: 'X' }))).toEqual({ headerText: 'X' });
        expect(parseStruk(JSON.stringify({ footerText: 'Y' }))).toEqual({ footerText: 'Y' });
        expect(parseStruk(JSON.stringify({ paperWidth: '72mm' }))).toEqual({ paperWidth: '72mm' });
    });

    it('returns empty object for null or malformed input', () => {
        expect(parseStruk(null)).toEqual({});
        expect(parseStruk('')).toEqual({});
        expect(parseStruk('not json')).toEqual({});
    });
});
