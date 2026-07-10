// ─── General Utilities ────────────────────────────────────────────────────────

import { type ClassValue, clsx } from 'clsx';
import { twMerge } from 'tailwind-merge';

/**
 * Merge Tailwind CSS class names intelligently.
 * Resolves conflicts (e.g., `p-4` vs `p-6`) using tailwind-merge.
 * @example cn("p-4 text-white", condition && "bg-red-500")
 */
export function cn(...inputs: ClassValue[]): string {
    return twMerge(clsx(inputs));
}

/**
 * Generate a random UUID v4.
 */
export function generateId(): string {
    return crypto.randomUUID?.() ?? Math.random().toString(36).slice(2);
}

/**
 * Truncate a string to a max length with an ellipsis.
 * @example truncate("Hello World", 5) → "Hello..."
 */
export function truncate(str: string, maxLength: number): string {
    if (str.length <= maxLength) return str;
    return str.slice(0, maxLength) + '...';
}

/**
 * Debounce a function call.
 */
export function debounce<T extends (...args: unknown[]) => void>(
    fn: T,
    delayMs: number,
): (...args: Parameters<T>) => void {
    let timer: ReturnType<typeof setTimeout>;
    return (...args: Parameters<T>) => {
        clearTimeout(timer);
        timer = setTimeout(() => fn(...args), delayMs);
    };
}

/**
 * Clamp a number between min and max.
 */
export const clamp = (value: number, min: number, max: number): number => Math.max(min, Math.min(max, value));

/**
 * Group an array of objects by a key.
 * @example groupBy([{cat: 'a', val: 1}, {cat: 'b', val: 2}, {cat: 'a', val: 3}], 'cat')
 * → { a: [{...}, {...}], b: [{...}] }
 */
export function groupBy<T>(arr: T[], key: keyof T): Record<string, T[]> {
    return arr.reduce(
        (acc, item) => {
            const group = String(item[key]);
            if (!acc[group]) acc[group] = [];
            acc[group].push(item);
            return acc;
        },
        {} as Record<string, T[]>,
    );
}
