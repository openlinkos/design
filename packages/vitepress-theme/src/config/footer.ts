// The footer every site shares: the site's brand (and the site's note, if any), the open-source
// projects and services from brands.json, the organization's pages, resources, and a bottom row
// with the copyright, the privacy notice and the site's legal links. VitePress renders
// `footer.message` and `footer.copyright` with `v-html` inside a `<p>`, so the markup uses phrasing
// elements only (`span`, `a`, `img`); a `div` or `ul` would be moved out of the paragraph by the
// browser and break hydration.

import { type Brand, type BrandLocale, listed, type NavGroup } from './brands.js';
import { CONTACT, FAMILY, FOOTER, LINKS } from './strings.js';

/** A text or link that is the same in both languages, or given per language. */
export type Localized = string | Record<BrandLocale, string>;

/** A link in the footer's bottom row, such as the terms of use or the licence. */
export interface FooterLink {
  text: Localized;
  link: Localized;
}

/** The footer's bottom row, after the copyright: the privacy notice, then the site's links. */
export interface FooterLegal {
  /**
   * The privacy notice, first in the row: the organization's (`true`, the default), the site's own
   * (its link, a string or `{ en, zh }`; the text stays "Privacy"), or `false` for none.
   */
  privacy?: boolean | Localized;
  /** The site's own links, after the privacy notice, such as its terms of use or its licence. */
  links?: FooterLink[];
}

/** The site's footer options: `legal`, or its links alone, which come after the privacy notice. */
export type Legal = FooterLegal | FooterLink[];

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
  /** One line of the site's own under the description and the attribution, such as who runs it. */
  note?: Localized;
  /** The bottom row's links: the organization's privacy notice, then the site's own. */
  legal?: Legal;
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

export const pick = (value: Localized, locale: BrandLocale): string =>
  typeof value === 'string' ? value : value[locale];

/**
 * A link as the site uses it: a link into the site itself (by its origin, `hostname`) becomes a
 * path, so it opens in the same tab and also works on a preview or a local server.
 */
export const siteLink = (url: string, hostname: string): string => {
  if (url === hostname || url === `${hostname}/`) return '/';
  return url.startsWith(`${hostname}/`) ? url.slice(hostname.length) : url;
};

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

/** `legal` in full: links alone come after the organization's privacy notice. */
const fullLegal = (legal: Legal = {}): Required<FooterLegal> =>
  Array.isArray(legal)
    ? { privacy: true, links: legal }
    : { privacy: legal.privacy ?? true, links: legal.links ?? [] };

/** The privacy notice in the bottom row, or null when the site turned it off. */
const privacyNotice = (master: Brand, legal?: Legal): FooterLink | null => {
  const { privacy } = fullLegal(legal);
  if (privacy === false) return null;
  return {
    text: { en: FOOTER.en.privacy, zh: FOOTER.zh.privacy },
    link:
      privacy === true
        ? { en: orgLink(master, 'en', 'privacy'), zh: orgLink(master, 'zh', 'privacy') }
        : privacy,
  };
};

/** The links of the bottom row, in order: the privacy notice (unless turned off), then the site's. */
export const legalLinks = (master: Brand, legal?: Legal): FooterLink[] => {
  const notice = privacyNotice(master, legal);
  return [...(notice ? [notice] : []), ...fullLegal(legal).links];
};

/**
 * The first of the site's own legal links that repeats the privacy notice the theme adds: one with
 * its text ("Privacy", "隐私说明") or its address, in either language.
 */
export const repeatedPrivacy = (
  master: Brand,
  legal: Legal | undefined,
  hostname: string,
): FooterLink | undefined => {
  const notice = privacyNotice(master, legal);
  if (!notice) return undefined;
  const same = (a: Localized, b: Localized, normalize: (s: string) => string): boolean =>
    (['en', 'zh'] as const).some((l) => normalize(pick(a, l)) === normalize(pick(b, l)));
  return fullLegal(legal).links.find(
    (l) =>
      same(l.text, notice.text, (s) => s.trim().toLowerCase()) ||
      same(l.link, notice.link, (s) => siteLink(s, hostname)),
  );
};

/**
 * The line under the description: who the site belongs to, or nothing on the master brand's sites
 * (a site of the master brand that is run for others, such as linkos.org, says so in its note).
 */
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
  const a = (url: string, text: string): string =>
    `<a href="${escapeHtml(siteLink(url, o.hostname))}">${escapeHtml(text)}</a>`;
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
    (o.note ? `<span class="olf-note">${escapeHtml(pick(o.note, locale))}</span>` : '') +
    '</span>';

  const links = (group: NavGroup): string[] =>
    listed(brands, group, locale).map((l) => a(l.link, l.name));
  const message =
    '<span class="olf">' +
    brandBlock +
    column('projects', strings.projects, links('projects')) +
    column('services', strings.services, [
      ...links('services'),
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

  const legal = legalLinks(master, o.legal).map((l) =>
    a(pick(l.link, locale), pick(l.text, locale)),
  );
  const copyright =
    `<span class="olf-copy">© ${o.year} ${escapeHtml(master.name)}</span>` +
    legal.map((link) => `<span class="olf-sep" aria-hidden="true"> · </span>${link}`).join('');
  return { message, copyright };
};
