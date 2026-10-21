import { readFileSync } from 'node:fs';
import type { HeadConfig } from 'vitepress';
import { describe, expect, it } from 'vitest';
import { assetPath, findBrand } from '../src/config/brands.ts';
import {
  addXDefault,
  contentVersion,
  counterpartPage,
  pageHead,
  pagePath,
  siteHead,
} from '../src/config/head.ts';

const brand = findBrand('origin');
const options = { hostname: 'https://origin.openlinkos.com', brand };

const head = (page: string, isNotFound = false): HeadConfig[] =>
  pageHead(
    {
      page,
      pageData: { isNotFound },
      title: 'CLI reference | Origin',
      description: 'Every command.',
      siteData: { title: 'Origin' },
    },
    options,
  );

/** `rel=…`/`property=…`/`name=…` → value, for readable assertions. */
const tags = (h: HeadConfig[]): Record<string, string> =>
  Object.fromEntries(
    h
      .filter(([tag]) => tag !== 'script')
      .map(([, attrs]) => {
        const a = attrs as Record<string, string>;
        const key = a.hreflang ? `alternate ${a.hreflang}` : (a.rel ?? a.property ?? a.name);
        return [key, a.href ?? a.content];
      }),
  );

const script = (h: HeadConfig[]): string | undefined =>
  h.find(([tag, attrs]) => tag === 'script' && attrs.id === 'openlinkos-lang')?.[2] as
    | string
    | undefined;

describe('page URLs', () => {
  it('uses clean URLs and directories for index pages', () => {
    expect(pagePath('index.md')).toBe('/');
    expect(pagePath('zh/index.md')).toBe('/zh/');
    expect(pagePath('guide/index.md')).toBe('/guide/');
    expect(pagePath('guide/cli.md')).toBe('/guide/cli');
    expect(pagePath('zh/guide/cli.md')).toBe('/zh/guide/cli');
  });

  it('pairs pages across locales', () => {
    expect(counterpartPage('guide/cli.md')).toBe('zh/guide/cli.md');
    expect(counterpartPage('zh/guide/cli.md')).toBe('guide/cli.md');
    expect(counterpartPage('index.md')).toBe('zh/index.md');
  });
});

describe('pageHead', () => {
  it('describes the English home page', () => {
    const h = head('index.md');
    expect(tags(h)).toEqual({
      canonical: 'https://origin.openlinkos.com/',
      'alternate en-US': 'https://origin.openlinkos.com/',
      'alternate zh-CN': 'https://origin.openlinkos.com/zh/',
      'alternate x-default': 'https://origin.openlinkos.com/',
      'og:type': 'website',
      'og:site_name': 'Origin',
      'og:title': 'CLI reference | Origin',
      'og:description': 'Every command.',
      'og:url': 'https://origin.openlinkos.com/',
      'og:image': 'https://origin.openlinkos.com/og.png',
      'og:image:width': '1200',
      'og:image:height': '630',
      'og:image:alt': 'Origin',
      'og:locale': 'en_US',
      'og:locale:alternate': 'zh_CN',
      'twitter:card': 'summary_large_image',
    });
    expect(script(h)).toContain('here:"en"');
    expect(script(h)).toContain('location.replace("/zh/"+location.search+location.hash)');
  });

  it('describes the Chinese home page', () => {
    const h = head('zh/index.md');
    const t = tags(h);
    expect(t.canonical).toBe('https://origin.openlinkos.com/zh/');
    expect(t['alternate en-US']).toBe('https://origin.openlinkos.com/');
    expect(t['alternate zh-CN']).toBe('https://origin.openlinkos.com/zh/');
    expect(t['alternate x-default']).toBe('https://origin.openlinkos.com/');
    expect(t['og:locale']).toBe('zh_CN');
    expect(t['og:locale:alternate']).toBe('en_US');
    expect(script(h)).toContain('here:"zh"');
    expect(script(h)).toContain('location.replace("/"+location.search');
  });

  it('describes a nested page', () => {
    const h = head('guide/cli.md');
    const t = tags(h);
    expect(t.canonical).toBe('https://origin.openlinkos.com/guide/cli');
    expect(t['og:url']).toBe('https://origin.openlinkos.com/guide/cli');
    expect(t['alternate zh-CN']).toBe('https://origin.openlinkos.com/zh/guide/cli');
    expect(script(head('zh/guide/cli.md'))).toContain('location.replace("/guide/cli"+');
  });

  it('marks the 404 page noindex and nothing else', () => {
    expect(head('404.md', true)).toEqual([['meta', { name: 'robots', content: 'noindex' }]]);
    expect(head('404.md')).toEqual([['meta', { name: 'robots', content: 'noindex' }]]);
  });
});

describe('siteHead', () => {
  it('links the icons and manifest with content-hash versions', () => {
    const h = siteHead(brand);
    const version = (file: string): string =>
      contentVersion(readFileSync(assetPath('origin', `web/${file}`)));
    expect(h).toContainEqual([
      'link',
      { rel: 'icon', href: `/favicon.ico?v=${version('favicon.ico')}`, sizes: '32x32' },
    ]);
    expect(h).toContainEqual([
      'link',
      { rel: 'icon', href: `/favicon.svg?v=${version('favicon.svg')}`, type: 'image/svg+xml' },
    ]);
    expect(h).toContainEqual([
      'link',
      {
        rel: 'apple-touch-icon',
        href: `/apple-touch-icon.png?v=${version('apple-touch-icon.png')}`,
      },
    ]);
    expect(h).toContainEqual([
      'link',
      { rel: 'manifest', href: `/site.webmanifest?v=${version('site.webmanifest')}` },
    ]);
    expect(version('favicon.ico')).toMatch(/^[0-9a-f]{8}$/);
    expect(h.filter(([, a]) => a.name === 'theme-color').map(([, a]) => a.media)).toEqual([
      '(prefers-color-scheme: light)',
      '(prefers-color-scheme: dark)',
    ]);
    expect(h).toContainEqual(['meta', { name: 'apple-mobile-web-app-title', content: 'Origin' }]);
  });
});

describe('sitemap', () => {
  it('adds an x-default alternate to each group without sharing arrays, and drops 404', () => {
    const links = [
      { lang: 'en-US', url: 'guide/cli' },
      { lang: 'zh-CN', url: 'zh/guide/cli' },
    ];
    const items = addXDefault([
      { url: 'guide/cli', links },
      { url: 'zh/guide/cli', links },
      { url: 'only' },
      { url: '404' },
    ]);
    expect(items.map((i) => i.url)).toEqual(['guide/cli', 'zh/guide/cli', 'only']);
    for (const item of items.slice(0, 2)) {
      expect(item.links).toEqual([...links, { lang: 'x-default', url: 'guide/cli' }]);
    }
    expect(links).toHaveLength(2);
  });
});
