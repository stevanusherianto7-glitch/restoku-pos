import { describe, it, expect, beforeEach } from 'vitest';
import { applyScreenMode, isScreenMode, type ScreenMode } from '../../lib/screenMode';

function makeRoot(): HTMLElement {
    const el = document.createElement('html');
    return el;
}

describe('isScreenMode', () => {
    it('accepts valid modes', () => {
        for (const m of ['terang', 'gelap', 'glassmorphic', 'nano-banana', 'krem'] as ScreenMode[]) {
            expect(isScreenMode(m)).toBe(true);
        }
    });

    it('rejects invalid / null', () => {
        expect(isScreenMode('')).toBe(false);
        expect(isScreenMode(null)).toBe(false);
        expect(isScreenMode('unknown')).toBe(false);
    });
});

describe('applyScreenMode', () => {
    let root: HTMLElement;
    beforeEach(() => {
        root = makeRoot();
    });

    it('nano-banana adds nano-banana+dark, removes light', () => {
        root.classList.add('light');
        applyScreenMode('nano-banana', root);
        expect(root.getAttribute('data-screen-mode')).toBe('nano-banana');
        expect(root.classList.contains('nano-banana')).toBe(true);
        expect(root.classList.contains('dark')).toBe(true);
        expect(root.classList.contains('light')).toBe(false);
    });

    it('terang adds light, removes dark + nano-banana', () => {
        root.classList.add('dark', 'nano-banana');
        applyScreenMode('terang', root);
        expect(root.classList.contains('light')).toBe(true);
        expect(root.classList.contains('dark')).toBe(false);
        expect(root.classList.contains('nano-banana')).toBe(false);
    });

    it('krem behaves like terang (adds light)', () => {
        applyScreenMode('krem', root);
        expect(root.classList.contains('light')).toBe(true);
        expect(root.classList.contains('dark')).toBe(false);
    });

    it('gelap adds dark, removes light + nano-banana', () => {
        root.classList.add('light', 'nano-banana');
        applyScreenMode('gelap', root);
        expect(root.classList.contains('dark')).toBe(true);
        expect(root.classList.contains('light')).toBe(false);
        expect(root.classList.contains('nano-banana')).toBe(false);
    });

    it('glassmorphic falls into dark branch', () => {
        applyScreenMode('glassmorphic', root);
        expect(root.classList.contains('dark')).toBe(true);
        expect(root.classList.contains('light')).toBe(false);
    });
});
