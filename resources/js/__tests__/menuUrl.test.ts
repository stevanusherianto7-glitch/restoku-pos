import { describe, it, expect } from 'vitest';
import { buildMenuUrl } from '../lib/menuUrl';

describe('buildMenuUrl', () => {
  it('builds url from base + slug', () => {
    expect(buildMenuUrl('https://restoku.id', 'senopati'))
      .toBe('https://restoku.id/m/senopati');
  });

  it('strips trailing slash on base', () => {
    expect(buildMenuUrl('https://restoku.id/', 'kedai-nusantara'))
      .toBe('https://restoku.id/m/kedai-nusantara');
  });

  it('strips leading slash on slug', () => {
    expect(buildMenuUrl('https://restoku.id', '/senopati'))
      .toBe('https://restoku.id/m/senopati');
  });

  it('returns empty when base missing', () => {
    expect(buildMenuUrl('', 'x')).toBe('');
  });

  it('returns empty when slug missing', () => {
    expect(buildMenuUrl('https://restoku.id', '')).toBe('');
  });
});
