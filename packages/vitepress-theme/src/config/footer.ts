// The footer every site shares: the site's brand, the open-source projects and services from
// brands.json, the organization's pages, resources, and a bottom row with the copyright and the
// site's legal links. VitePress renders `footer.message` and `footer.copyright` with `v-html`
// inside a `<p>`, so the markup uses phrasing elements only (`span`, `a`, `img`); a `div` or `ul`
// would be moved out of the paragraph by the browser and break hydration.

import type { Brand, BrandLocale } from './brands.js';
import { CONTACT, FAMILY, FOOTER, LINKS } from './strings.js';

/** A text or link that is the same in both languages, or given per language. */
export type Localized = string | Record<BrandLocale, string>;

/** A link in the footer's bottom row, such as the privacy notice or the terms of use. */
export interface FooterLink {
  text: Localized;
  link: Localized;
}

export interface FooterOptions {
  /** The site's brand. */
  brand: Brand;
  /** Every brand, in brands.json order. */
  brands: Brand[];
  /** The site's origin, used to turn links into this site into paths. */
  hostname: string;
  locale: BrandLocale;
  /** The text under the brand name; the brand's description when the site has none. */
  description?: string;
  /** The bottom row's links; the organization's privacy notice when not set. */
  legal?: FooterLink[];
  year: number;
}

export interface Footer {
  message: string;
  copyright: string;
}

const escapeHtml = (text: string): string =>
  text
    .replaceAll('&', '&amp;')
    .replaceAll('<', '&lt;')
    .replaceAll('>', '&gt;')
    .replaceAll('"', '&quot;');

const pick = (value: Localized, locale: BrandLocale): string =>
  typeof value === 'string' ? value : value[locale];

/** The master brand: the organization. */
export const masterBrand = (brands: Brand[]): Brand => {
  const masters = brands.filter((b) => b.tier === 'master');
  if (masters.length !== 1) {
    throw new Error(`brands.json must have exactly one master brand, found ${masters.length}`);
  }
  return masters[0] as Brand;
};

/** A link to one of the organization's pages, such as `about`, in the given language. */
export const orgLink = (master: Brand, locale: BrandLocale, page: string): string =>
  `${master.url[locale]}${page}`;

/** The default bottom row: the organization's privacy notice. */
export const defaultLegal = (master: Brand): FooterLink[] => [
  {
    text: { en: FOOTER.en.privacy, zh: FOOTER.zh.privacy },
    link: { en: orgLink(master, 'en', 'privacy'), zh: orgLink(master, 'zh', 'privacy') },
  },
];

/** The line under the description: who the site belongs to, or nothing on the master's sites. */
const attribution = (brand: Brand, master: Brand, locale: BrandLocale): string | undefined => {
  if (brand.tier === 'master') return undefined;
  const strings = FOOTER[locale];
  return brand.tier === 'service' ? strings.runBy(master.name) : strings.openSource(master.name);
};

/** Builds the footer of one locale. */
export const buildFooter = (o: FooterOptions): Footer => {
  const { brand, brands, locale } = o;
  const master = masterBrand(brands);
  const strings = FOOTER[locale];
  // Links into this site become paths, so they also work on a preview or a local server.
  const href = (url: string): string => {
    if (url === o.hostname || url === `${o.hostname}/`) return '/';
    return url.startsWith(`${o.hostname}/`) ? url.slice(o.hostname.length) : url;
  };
  const a = (url: string, text: string): string =>
    `<a href="${escapeHtml(href(url))}">${escapeHtml(text)}</a>`;
  const column = (key: string, title: string, links: string[]): string =>
    `<span class="olf-col olf-${key}" role="group" aria-label="${escapeHtml(title)}">` +
    `<span class="olf-title">${escapeHtml(title)}</span>${links.join('')}</span>`;

  const about = attribution(brand, master, locale);
  const brandBlock =
    '<span class="olf-brand">' +
    `<a class="olf-name" href="/">` +
    `<img class="olf-logo olf-logo-light" src="/logo.svg" alt="" width="24" height="24">` +
    `<img class="olf-logo olf-logo-dark" src="/logo-dark.svg" alt="" width="24" height="24">` +
    `${escapeHtml(brand.name)}</a>` +
    `<span class="olf-desc">${escapeHtml(o.description ?? brand.description[locale])}</span>` +
    (about ? `<span class="olf-about">${escapeHtml(about)}</span>` : '') +
    '</span>';

  const listed = (nav: 'projects' | 'services'): string[] =>
    brands.filter((b) => b.nav === nav).map((b) => a(b.url[locale], b.name));
  const message =
    '<span class="olf">' +
    brandBlock +
    column('projects', strings.projects, listed('projects')) +
    column('services', strings.services, [
      ...listed('services'),
      a(LINKS.services[locale], FAMILY[locale].allServices),
    ]) +
    column(master.id, master.name, [
      a(orgLink(master, locale, 'about'), strings.about),
      a(orgLink(master, locale, 'news'), strings.news),
      a(orgLink(master, locale, 'trust'), strings.trust),
      a(`mailto:${CONTACT.general}`, strings.contact),
    ]) +
    column('resources', strings.resources, [
      a(LINKS.github, strings.github),
      a(LINKS.brand[locale], strings.brand),
      a(LINKS.design, strings.design),
    ]) +
    '</span>';

  const legal = (o.legal ?? defaultLegal(master)).map((l) =>
    a(pick(l.link, locale), pick(l.text, locale)),
  );
  const copyright =
    `<span class="olf-copy">© ${o.year} ${escapeHtml(master.name)}</span>` +
    legal.map((link) => `<span class="olf-sep" aria-hidden="true"> · </span>${link}`).join('');
  return { message, copyright };
};
