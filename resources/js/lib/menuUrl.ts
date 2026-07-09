export function buildMenuUrl(base: string, slug: string): string {
  if (!base || !slug) return '';
  const cleanBase = base.replace(/\/+$/, '');
  const cleanSlug = slug.replace(/^\/+/, '');
  return `${cleanBase}/m/${cleanSlug}`;
}
