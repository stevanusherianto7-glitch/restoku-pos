// Pure screen-mode applier. Takes the root <html> element as an argument so it
// can be unit-tested against a jsdom document without coupling to global state.
// Mirrors the class/attribute logic previously inlined in PengaturanOutlet.

export type ScreenMode = 'terang' | 'gelap' | 'glassmorphic' | 'nano-banana' | 'krem';

export function isScreenMode(value: string | null): value is ScreenMode {
    return (
        value === 'terang' ||
        value === 'gelap' ||
        value === 'glassmorphic' ||
        value === 'nano-banana' ||
        value === 'krem'
    );
}

export function applyScreenMode(mode: ScreenMode, root: HTMLElement): void {
    root.setAttribute('data-screen-mode', mode);

    if (mode === 'nano-banana') {
        root.classList.add('nano-banana', 'dark');
        root.classList.remove('light');
    } else if (mode === 'terang' || mode === 'krem') {
        root.classList.add('light');
        root.classList.remove('dark', 'nano-banana');
    } else {
        root.classList.add('dark');
        root.classList.remove('light', 'nano-banana');
    }
}
