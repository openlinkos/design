// The brand registry and generated assets, read from dist/brand/ in the published package or from
// the repository's brand/ directory when running from source.

import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';

export type BrandLocale = 'en' | 'zh';

export interface BrandColours {
  mark: { light: string; dark: string };
  brand: { light: [string, string, string]; dark: [string, string, string] };
  soft: { light: string; dark: string };
}

export interface Brand {
  id: string;
  name: string;
  tier: 'master' | 'product' | 'line' | 'service';
  parent?: string;
  mark: string;
  word: string;
  descriptor?: string;
  url: Record<BrandLocale, string>;
  description: Record<BrandLocale, string>;
  nav: 'projects' | 'services' | null;
  colors: BrandColours;
}

/** Asset groups under brand/out/<id>/. */
export const ASSET_GROUPS = ['web', 'github', 'kit'] as const;

/** The web files every site serves from its root. */
export const WEB_FILES = [
  'favicon.ico',
  'favicon.svg',
  'apple-touch-icon.png',
  'icon-192.png',
  'icon-512.png',
  'icon-maskable-512.png',
  'site.webmanifest',
  'og.png',
  'logo.svg',
  'logo-dark.svg',
] as const;

let cachedDir: string | undefined;

/** The directory that holds brands.json and out/. */
export const brandDir = (): string => {
  if (cachedDir) return cachedDir;
  // dist/config/ -> dist/brand/ (package); src/config/ -> <repo>/brand/ (source).
  for (const rel of ['../brand/', '../../../../brand/']) {
    const dir = fileURLToPath(new URL(rel, import.meta.url));
    if (existsSync(join(dir, 'brands.json'))) {
      cachedDir = dir;
      return dir;
    }
  }
  throw new Error('@openlinkos/vitepress-theme: brand data not found; is the package built?');
};

type Raw = Omit<Brand, 'id' | 'colors'> & { colors: BrandColours | string };

let cachedBrands: Brand[] | undefined;

export const loadBrands = (): Brand[] => {
  if (cachedBrands) return cachedBrands;
  const raw = JSON.parse(readFileSync(join(brandDir(), 'brands.json'), 'utf8')) as Record<
    string,
    Raw
  >;
  cachedBrands = Object.entries(raw).map(([id, b]) => {
    const colors = typeof b.colors === 'string' ? raw[b.colors]?.colors : b.colors;
    if (!colors || typeof colors === 'string') throw new Error(`brand ${id}: unresolved colours`);
    return { ...b, id, colors };
  });
  return cachedBrands;
};

export const findBrand = (id: string): Brand => {
  const brands = loadBrands();
  const brand = brands.find((b) => b.id === id);
  if (!brand) {
    throw new Error(
      `@openlinkos/vitepress-theme: unknown brand "${id}"; expected one of ${brands.map((b) => b.id).join(', ')}`,
    );
  }
  return brand;
};

/** Absolute path of a generated asset, e.g. assetPath('origin', 'web/favicon.svg'). */
export const assetPath = (id: string, file: string): string => join(brandDir(), 'out', id, file);

/** Every file of a brand's asset group, as paths relative to the group. */
export const groupFiles = (id: string, group: (typeof ASSET_GROUPS)[number]): string[] => {
  const root = join(brandDir(), 'out', id, group);
  const walk = (dir: string, prefix: string): string[] =>
    readdirSync(dir)
      .sort()
      .flatMap((name) =>
        statSync(join(dir, name)).isDirectory()
          ? walk(join(dir, name), `${prefix}${name}/`)
          : [`${prefix}${name}`],
      );
  return existsSync(root) ? walk(root, '') : [];
};
