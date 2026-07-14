// Format meja permanen: A = lantai 1, B = lantai 2, dst.
// Owner boleh edit label (backward-compat), tapi ini default konsisten.

export function defaultTables(): string {
    const a = Array.from({ length: 9 }, (_, i) => `A${i + 1}`);
    const b = Array.from({ length: 3 }, (_, i) => `B${i + 1}`);
    return [...a, ...b].join('\n');
}

export type FloorGroup = { floor: number; letter: string; items: string[] };

// Kelompokkan label meja per lantai berdasar huruf depan (A=1, B=2, ...).
export function groupTablesByFloor(tables: string[]): FloorGroup[] {
    const map = new Map<string, FloorGroup>();
    for (const t of tables) {
        const letter = t.charAt(0).toUpperCase();
        if (!letter) continue;
        const floor = letter.charCodeAt(0) - 64; // A=1, B=2, ...
        if (!map.has(letter)) map.set(letter, { floor, letter, items: [] });
        map.get(letter)!.items.push(t);
    }
    return Array.from(map.values()).sort((x, y) => x.floor - y.floor);
}
