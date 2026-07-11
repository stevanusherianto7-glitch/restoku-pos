import { describe, it, expect } from 'vitest';
import { TAB_SLUGS, SLUG_TO_TAB, slugFromTab, tabFromSlug } from '../../lib/outletTabs';

describe('outletTabs', () => {
    it('maps every known label to a slug', () => {
        expect(TAB_SLUGS['Profil Outlet']).toBe('profil');
        expect(TAB_SLUGS['Lokasi Restoran']).toBe('lokasi');
        expect(TAB_SLUGS['Pajak & Tarif']).toBe('pajak');
        expect(TAB_SLUGS['Tampilan Struk']).toBe('struk');
        expect(TAB_SLUGS['Jam Operasional']).toBe('jam');
    });

    it('is bidirectional (label<->slug)', () => {
        for (const [label, slug] of Object.entries(TAB_SLUGS)) {
            expect(SLUG_TO_TAB[slug]).toBe(label);
        }
    });

    it('slugFromTab returns the slug or default', () => {
        expect(slugFromTab('Lokasi Restoran')).toBe('lokasi');
        expect(slugFromTab('Tidak Ada Tab')).toBe('profil');
    });

    it('tabFromSlug returns the label or null', () => {
        expect(tabFromSlug('struk')).toBe('Tampilan Struk');
        expect(tabFromSlug(null)).toBeNull();
        expect(tabFromSlug('slug-tidak-ada')).toBeNull();
    });
});
