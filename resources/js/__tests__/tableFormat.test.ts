import { describe, it, expect } from 'vitest';
import { defaultTables, groupTablesByFloor } from '../lib/tableFormat';

describe('tableFormat', () => {
    it('defaultTables menghasilkan A1..A9 + B1..B3 (format permanen)', () => {
        const t = defaultTables().split('\n');
        expect(t).toEqual(['A1', 'A2', 'A3', 'A4', 'A5', 'A6', 'A7', 'A8', 'A9', 'B1', 'B2', 'B3']);
        // A = lantai 1, B = lantai 2
        expect(t.filter((x) => x.startsWith('A'))).toHaveLength(9);
        expect(t.filter((x) => x.startsWith('B'))).toHaveLength(3);
    });

    it('groupTablesByFloor mengelompokkan A=lantai 1, B=lantai 2', () => {
        const groups = groupTablesByFloor(['A1', 'A2', 'B1', 'B2', 'A3']);
        expect(groups).toHaveLength(2);
        expect(groups[0]).toMatchObject({ floor: 1, letter: 'A', items: ['A1', 'A2', 'A3'] });
        expect(groups[1]).toMatchObject({ floor: 2, letter: 'B', items: ['B1', 'B2'] });
    });

    it('groupTablesByFloor urut berdasar lantai', () => {
        const groups = groupTablesByFloor(['C1', 'A1', 'B1']);
        expect(groups.map((g) => g.floor)).toEqual([1, 2, 3]);
    });

    it('mendukung format custom (Meja 7, 01) tanpa crash', () => {
        const groups = groupTablesByFloor(['Meja 7', '01', 'A1']);
        expect(groups.length).toBeGreaterThan(0);
    });
});
