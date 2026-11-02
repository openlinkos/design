// Typed access to brands.json, the single source of truth for every brand.

import { readFileSync } from 'node:fs';
import type { MarkId } from './marks.ts';

export type Tier = 'master' | 'product' | 'line' | 'service';
export type Locale = 'en' | 'zh';
/** The groups of the family menu and the footer: open-source projects and free public services. */
export type NavGroup = 'projects' | 'services';

export interface BrandColours {
  /** Accent of the mark (graphics, 3:1 against the page). */
  mark: { light: string; dark: string };
  /** VitePress brand-1 (text and links), brand-2 (hover) and brand-3 (solid buttons). */
  brand: { light: [string, string, string]; dark: [string, string, string] };
  soft: { light: string; dark: string };
}

export interface Brand {
  id: string;
  name: string;
  tier: Tier;
  parent?: string;
  mark: MarkId;
  word: string;
  descriptor?: string;
  url: Record<Locale, string>;
  /** The source repository on GitHub, as owner/name, for brands that have one. */
  repo?: string;
  description: Record<Locale, string>;
  /** The groups the brand is listed in; none for a brand that is not listed. */
  nav: NavGroup[];
  colors: BrandColours;
}

/** Ink and page colours shared by every brand. */
export const INK = { light: '#0f172a', dark: '#e2e8f0' } as const;
export const TILE = '#0f172a';

type Raw = Omit<Brand, 'id' | 'colors'> & { colors: BrandColours | string };

export const loadBrands = (): Brand[] => {
  const raw = JSON.parse(readFileSync(new URL('./brands.json', import.meta.url), 'utf8')) as Record<
    string,
    Raw
  >;
  return Object.entries(raw).map(([id, b]) => {
    const colors = typeof b.colors === 'string' ? raw[b.colors]?.colors : b.colors;
    if (!colors || typeof colors === 'string') throw new Error(`brand ${id}: unresolved colours`);
    return { ...b, id, colors };
  });
};
