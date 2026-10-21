// Head tags: the site-wide icons and theme colours, and the per-page canonical URL, language
// alternates, Open Graph tags and language-detection script.

import { createHash } from 'node:crypto';
import { readFileSync } from 'node:fs';
import type { HeadConfig, UserConfig } from 'vitepress';
import { LANG_COOKIE, type Lang, resolveLanguageRedirect } from '../shared/lang.js';
import { assetPath, type Brand } from './brands.js';

/** Page backgrounds of the default theme, used as the browser's theme colour. */
const THEME_COLOR = { light: '#ffffff', dark: '#1b1b1f' };

const OG_IMAGE = { path: '/og.png', width: 1200, height: 630 };

const LOCALES: Record<Lang, { hreflang: string; og: string }> = {
  en: { hreflang: 'en-US', og: 'en_US' },
  zh: { hreflang: 'zh-CN', og: 'zh_CN' },
};

/** The first 8 hex digits of a file's SHA-256, for `?v=` cache busting. */
export const contentVersion = (data: Buffer | string): string =>
  createHash('sha256').update(data).digest('hex').slice(0, 8);

/** Icons, manifest and theme colours, on every page. */
export const siteHead = (brand: Brand): HeadConfig[] => {
  const v = (file: string): string =>
    `/${file}?v=${contentVersion(readFileSync(assetPath(brand.id, `web/${file}`)))}`;
  return [
    ['link', { rel: 'icon', href: v('favicon.ico'), sizes: '32x32' }],
    ['link', { rel: 'icon', href: v('favicon.svg'), type: 'image/svg+xml' }],
    ['link', { rel: 'apple-touch-icon', href: v('apple-touch-icon.png') }],
    ['link', { rel: 'manifest', href: v('site.webmanifest') }],
    [
      'meta',
      { name: 'theme-color', media: '(prefers-color-scheme: light)', content: THEME_COLOR.light },
    ],
    [
      'meta',
      { name: 'theme-color', media: '(prefers-color-scheme: dark)', content: THEME_COLOR.dark },
    ],
    ['meta', { name: 'apple-mobile-web-app-title', content: brand.name }],
  ];
};

/** The locale of a source page: `zh/…` is Chinese, everything else English. */
export const localeOfPage = (page: string): Lang => (page.startsWith('zh/') ? 'zh' : 'en');

/** The same page in the other locale. */
export const counterpartPage = (page: string): string =>
  page.startsWith('zh/') ? page.slice(3) : `zh/${page}`;

/** The clean URL path of a page: no `.html`, and `index` becomes its directory. */
export const pagePath = (page: string): string => {
  const path = page.replace(/\.md$/, '');
  if (path === 'index') return '/';
  if (path.endsWith('/index')) return `/${path.slice(0, -'index'.length)}`;
  return `/${path}`;
};

/** The inline script that sends readers to the counterpart page when the rules say so. */
export const languageScript = (here: Lang, counterpart: string): string => {
  const literal = (value: unknown): string => JSON.stringify(value).replace(/</g, '\\u003c');
  return (
    '(function(){try{' +
    `var resolve=(${resolveLanguageRedirect.toString()});` +
    `var match=document.cookie.match(/(?:^|;\\s*)${LANG_COOKIE}=(en|zh)(?:;|$)/);` +
    'var nav=navigator;' +
    'var target=resolve({' +
    `here:${literal(here)},` +
    'pref:match?match[1]:null,' +
    'languages:nav.languages&&nav.languages.length?Array.prototype.slice.call(nav.languages):[nav.language||""],' +
    'ua:nav.userAgent||"",' +
    'webdriver:!!nav.webdriver' +
    '});' +
    `if(target)location.replace(${literal(counterpart)}+location.search+location.hash);` +
    '}catch(e){}})();'
  );
};

export interface PageHeadContext {
  /** The page's path relative to the source directory, e.g. `zh/guide/cli.md`. */
  page: string;
  pageData: { isNotFound?: boolean };
  title: string;
  description: string;
  siteData: { title: string };
}

export interface PageHeadOptions {
  /** Canonical origin without a trailing slash, e.g. `https://origin.openlinkos.com`. */
  hostname: string;
  brand: Brand;
}

type SitemapItems = Parameters<
  NonNullable<NonNullable<UserConfig['sitemap']>['transformItems']>
>[0];

/** Sitemap entries with an x-default alternate (the English page) in each group, and no 404. */
export const addXDefault = (items: SitemapItems): SitemapItems =>
  items
    .filter((item) => item.url !== '404')
    .map((item) => {
      const links = item.links;
      if (!links?.length || links.some((l) => l.lang === 'x-default')) return item;
      const en = links.find((l) => l.lang === LOCALES.en.hreflang);
      return en ? { ...item, links: [...links, { lang: 'x-default', url: en.url }] } : item;
    });

/** Per-page tags. The 404 page gets only `noindex`. */
export const pageHead = (ctx: PageHeadContext, o: PageHeadOptions): HeadConfig[] => {
  if (ctx.pageData.isNotFound || ctx.page === '404.md') {
    return [['meta', { name: 'robots', content: 'noindex' }]];
  }
  const here = localeOfPage(ctx.page);
  const other: Lang = here === 'en' ? 'zh' : 'en';
  const self = pagePath(ctx.page);
  const counterpart = pagePath(counterpartPage(ctx.page));
  const url = (path: string): string => `${o.hostname}${path}`;
  const en = here === 'en' ? self : counterpart;
  const zh = here === 'zh' ? self : counterpart;
  return [
    ['link', { rel: 'canonical', href: url(self) }],
    ['link', { rel: 'alternate', hreflang: LOCALES.en.hreflang, href: url(en) }],
    ['link', { rel: 'alternate', hreflang: LOCALES.zh.hreflang, href: url(zh) }],
    ['link', { rel: 'alternate', hreflang: 'x-default', href: url(en) }],
    ['meta', { property: 'og:type', content: 'website' }],
    ['meta', { property: 'og:site_name', content: ctx.siteData.title || o.brand.name }],
    ['meta', { property: 'og:title', content: ctx.title }],
    ['meta', { property: 'og:description', content: ctx.description }],
    ['meta', { property: 'og:url', content: url(self) }],
    ['meta', { property: 'og:image', content: url(OG_IMAGE.path) }],
    ['meta', { property: 'og:image:width', content: String(OG_IMAGE.width) }],
    ['meta', { property: 'og:image:height', content: String(OG_IMAGE.height) }],
    ['meta', { property: 'og:image:alt', content: o.brand.name }],
    ['meta', { property: 'og:locale', content: LOCALES[here].og }],
    ['meta', { property: 'og:locale:alternate', content: LOCALES[other].og }],
    ['meta', { name: 'twitter:card', content: 'summary_large_image' }],
    ['script', { id: 'openlinkos-lang' }, languageScript(here, counterpart)],
  ];
};
