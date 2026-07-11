// Pure (de)serialization for the thermal-receipt config persisted to localStorage
// and synced to the backend. Split out of PengaturanOutlet so parsing edge cases
// (malformed JSON, partial fields) are unit-testable without rendering React.

export interface StrukConfig {
    headerText: string;
    footerText: string;
    paperWidth: string;
}

export function serializeStruk(cfg: StrukConfig): string {
    return JSON.stringify({
        headerText: cfg.headerText,
        footerText: cfg.footerText,
        paperWidth: cfg.paperWidth,
    });
}

export function parseStruk(raw: string | null): Partial<StrukConfig> {
    if (!raw) return {};
    try {
        const parsed = JSON.parse(raw) as Partial<StrukConfig>;
        return {
            ...(parsed.headerText !== undefined ? { headerText: parsed.headerText } : {}),
            ...(parsed.footerText !== undefined ? { footerText: parsed.footerText } : {}),
            ...(parsed.paperWidth !== undefined ? { paperWidth: parsed.paperWidth } : {}),
        };
    } catch {
        return {};
    }
}
