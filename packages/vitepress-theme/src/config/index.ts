// `@openlinkos/vitepress-theme/config`: the site configuration shared by every OpenLinkOS and
// LinkOS site. Runs in Node when VitePress loads the site's config.

import type {
  DefaultTheme,
  HeadConfig,
  LocaleSpecificConfig,
  MarkdownOptions,
  SiteConfig,
  UserConfig,
} from 'vitepress';
import { deriveCookieDomain } from '../shared/lang.js';
import { type Brand, findBrand, listed, loadBrands, type NavGroup } from './brands.js';
import { checkSite, formatProblems } from './check.js';
import {
  buildFooter,
  type Footer,
  type FooterLegal,
  type Legal,
  type Localized,
  masterBrand,
  pick,
  repeatedPrivacy,
  siteLink,
} from './footer.js';
import { addXDefault, pageHead, siteHead } from './head.js';
import { englishLabels, localizeMarkdown } from './markdown.js';
import { openlinkosPlugin, PACKAGE_NAME } from './plugin.js';
import { openlinkosTokenize } from './search.js';
import { FAMILY, LINKS, UI, ZH_SEARCH_TRANSLATIONS } from './strings.js';

export { sourceHash } from './check.js';
export type { FooterLegal, FooterLink, Legal, Localized } from './footer.js';

type ThemeConfig = DefaultTheme.Config;
type Config = UserConfig<ThemeConfig>;

/** A locale of an OpenLinkOS site. `lang`, `label` and `link` are set by the theme. */
export type OpenLinkOSLocale = Omit<LocaleSpecificConfig<ThemeConfig>, 'head' | 'lang' | 'dir'>;

/** The site's own part of the shared footer. */
export interface OpenLinkOSFooter {
  /**
   * One line of the site's own in the footer's brand block, under the description, such as who
   * runs the site: plain text, the same in both languages or `{ en, zh }`.
   */
  note?: Localized;
}

export interface OpenLinkOSConfig extends Omit<Config, 'locales' | 'extends'> {
  /** The site's brand: an id from brands.json, such as `openlinkos` or `origin`. */
  brand: string;
  /** The site's canonical origin, such as `https://origin.openlinkos.com`. */
  hostname: string;
  /** Publish every brand's web, GitHub and kit files under /brand/<id>/ (openlinkos.com only). */
  brandKit?: boolean;
  /**
   * The registrable domain that shares the language preference cookie across sites. Derived from
   * `hostname` (its last two labels); `false` keeps the cookie host-only.
   */
  cookieDomain?: string | false;
  /**
   * The layer for agents (on by default): `/llms.txt` and `/llms-full.txt` per locale, built from
   * the site's sidebars, and every page served as its Markdown source next to itself
   * (`/guide/x.md`), in the dev server and in the build.
   */
  llms?: boolean;
  /** English at the root and Simplified Chinese under /zh/; no other locales. */
  locales?: { root?: OpenLinkOSLocale; zh?: OpenLinkOSLocale };
  /** The site's own part of the shared footer: `note`, one line of its own. */
  footer?: OpenLinkOSFooter;
  /**
   * The footer's bottom row, after the copyright: the organization's privacy notice, then the
   * site's links. A list of links adds them after the notice; `{ privacy, links }` also points the
   * notice at the site's own (`privacy: { en, zh }`) or leaves it out (`privacy: false`).
   */
  legal?: Legal;
}

/** Theme config keys that the theme sets in every locale, which therefore hide top-level values. */
const PER_LOCALE_KEYS = [
  'nav',
  'footer',
  'outline',
  'docFooter',
  'lastUpdated',
  'darkModeSwitchLabel',
  'lightModeSwitchTitle',
  'darkModeSwitchTitle',
  'sidebarMenuLabel',
  'returnToTopLabel',
  'langMenuLabel',
  'skipToContentLabel',
  'notFound',
] as const;

interface Resolved {
  brand: Brand;
  hostname: string;
  brandKit: boolean;
  cookieDomain: string | null;
  llms: boolean;
  markdown: MarkdownOptions | undefined;
  /** Whether the site uses the local search (the default) rather than another provider. */
  localSearch: boolean;
  footers: Record<'en' | 'zh', Footer>;
}

const fail = (message: string): never => {
  throw new Error(`${PACKAGE_NAME}: ${message}`);
};

const isPlainObject = (value: unknown): value is Record<string, unknown> =>
  Object.prototype.toString.call(value) === '[object Object]';

const resolveHostname = (hostname: string): string => {
  let url: URL | undefined;
  try {
    url = new URL(hostname);
  } catch {
    url = undefined;
  }
  if (!url || !/^https?:$/.test(url.protocol) || url.pathname !== '/' || url.search || url.hash) {
    return fail(`hostname must be an origin such as https://example.com, got "${hostname}"`);
  }
  return url.origin;
};

/**
 * The family menu, named after the master brand: its home, the open-source projects and the free
 * public services from brands.json, and a link to every service. As in the footer, links into the
 * site itself become paths, so they open in the same tab, without the external-link icon, and
 * also work on a preview or a local server.
 */
const familyNav = (locale: 'en' | 'zh', hostname: string): DefaultTheme.NavItem => {
  const brands = loadBrands();
  const master = masterBrand(brands);
  const link = (text: string, url: string) => ({ text, link: siteLink(url, hostname) });
  const items = (group: NavGroup) => listed(brands, group, locale).map((l) => link(l.name, l.link));
  return {
    text: master.name,
    items: [
      link(FAMILY[locale].home(master.name), master.url[locale]),
      { text: FAMILY[locale].projects, items: items('projects') },
      {
        text: FAMILY[locale].services,
        items: [...items('services'), link(FAMILY[locale].allServices, LINKS.services[locale])],
      },
    ],
  };
};

const LOCALIZED = 'a string or { en, zh }';

/** Whether a value is a text or link for both languages: a string, or `{ en, zh }`. */
const isLocalized = (value: unknown): value is Localized =>
  (typeof value === 'string' && value.trim() !== '') ||
  (isPlainObject(value) &&
    (['en', 'zh'] as const).every((l) => typeof value[l] === 'string' && value[l].trim() !== ''));

/** Checks the site's footer options: a note in both languages, legal links that skip Privacy. */
const checkFooter = (
  footer: OpenLinkOSFooter | undefined,
  legal: Legal | undefined,
  master: Brand,
  hostname: string,
): void => {
  const others = (value: object, allowed: string[]) =>
    Object.keys(value).filter((key) => !allowed.includes(key));
  if (footer !== undefined) {
    if (!isPlainObject(footer)) fail('footer must be an object such as { note: { en, zh } }');
    const other = others(footer, ['note']);
    if (other.length) {
      fail(
        `footer may only have note, got ${other.join(', ')}; ` +
          'to replace the columns, set themeConfig.footer.message in each locale',
      );
    }
    if (footer.note !== undefined && !isLocalized(footer.note)) {
      fail(`footer.note must be ${LOCALIZED}`);
    }
  }
  if (legal === undefined) return;
  if (!Array.isArray(legal)) {
    if (!isPlainObject(legal)) fail('legal must be a list of links or { privacy, links }');
    const other = others(legal, ['privacy', 'links']);
    if (other.length) fail(`legal may only have privacy and links, got ${other.join(', ')}`);
  }
  const { privacy, links = [] }: FooterLegal = Array.isArray(legal) ? { links: legal } : legal;
  if (privacy !== undefined && typeof privacy !== 'boolean' && !isLocalized(privacy)) {
    fail(`legal.privacy must be true, false or the link of the site's notice, ${LOCALIZED}`);
  }
  if (!Array.isArray(links)) fail('legal.links must be a list of links');
  for (const [i, l] of links.entries()) {
    if (!isLocalized(l?.text) || !isLocalized(l?.link)) {
      fail(`legal link ${i + 1}: text and link must each be ${LOCALIZED}`);
    }
  }
  const repeated = repeatedPrivacy(master, legal, hostname);
  if (repeated) {
    fail(
      `legal: "${pick(repeated.text, 'en')}" repeats the privacy notice, which the footer links ` +
        'to first; remove it, point the notice at your own with legal.privacy: { en, zh }, or ' +
        'leave the notice out with legal.privacy: false',
    );
  }
};

/** The search options: local search with Chinese strings and a CJK-aware tokenizer. */
const search = (): ThemeConfig['search'] => ({
  provider: 'local',
  options: {
    locales: { zh: { translations: ZH_SEARCH_TRANSLATIONS } },
    miniSearch: { options: { tokenize: openlinkosTokenize } },
  },
});

/** Language, menu label and root of each locale. */
const LOCALE_META = {
  root: { label: 'English', lang: 'en-US' },
  zh: { label: '简体中文', lang: 'zh-CN', link: '/zh/' },
} as const;

/** The configuration every site extends. */
const baseConfig = (r: Resolved): Config => ({
  cleanUrls: true,
  head: siteHead(r.brand),
  locales: {
    root: { ...LOCALE_META.root, themeConfig: { ...UI.en, footer: r.footers.en } },
    zh: { ...LOCALE_META.zh, themeConfig: { ...UI.zh, footer: r.footers.zh } },
  },
  themeConfig: {
    logo: { light: '/logo.svg', dark: '/logo-dark.svg' },
    search: r.localSearch ? search() : undefined,
  },
  markdown: {
    config: (md) => localizeMarkdown(md, englishLabels(r.markdown)),
  },
  sitemap: {
    hostname: r.hostname,
    transformItems: addXDefault,
  },
  transformHead: (ctx) => pageHead(ctx, { hostname: r.hostname, brand: r.brand }),
  buildEnd: (site: SiteConfig) => {
    const problems = checkSite(site, { built: true });
    if (problems.length) throw new Error(formatProblems(problems));
  },
  vite: {
    plugins: [
      openlinkosPlugin({
        brand: r.brand,
        hostname: r.hostname,
        brandKit: r.brandKit,
        cookieDomain: r.cookieDomain,
        llms: r.llms,
      }),
    ],
    ssr: { noExternal: [PACKAGE_NAME] },
    optimizeDeps: { exclude: [PACKAGE_NAME] },
  },
});

/**
 * Moves theme config keys that the theme sets per locale from the top level into each locale,
 * where they act as defaults; at the top level they would be hidden by the locale values.
 */
const distribute = (top: ThemeConfig | undefined, locale: ThemeConfig | undefined): ThemeConfig => {
  const result: Record<string, unknown> = { ...locale };
  for (const key of PER_LOCALE_KEYS) {
    const value = top?.[key];
    if (value === undefined) continue;
    const own = result[key];
    result[key] =
      isPlainObject(value) && isPlainObject(own) ? { ...value, ...own } : (own ?? value);
  }
  return result as ThemeConfig;
};

const chain =
  <A extends unknown[], R>(
    first: ((...args: A) => R) | undefined,
    second: ((...args: A) => R) | undefined,
  ) =>
  async (...args: A): Promise<void> => {
    await first?.(...args);
    await second?.(...args);
  };

/**
 * Defines the VitePress config of an OpenLinkOS or LinkOS site. The site's own config extends the
 * theme's base config; hooks that VitePress would otherwise replace (transformHead, buildEnd,
 * markdown.config, sitemap.transformItems) run the theme's first and then the site's, and the
 * family menu is appended to each locale's nav.
 */
export function defineOpenLinkOSConfig(config: OpenLinkOSConfig): Config {
  const {
    brand: brandId,
    hostname: rawHostname,
    brandKit = false,
    cookieDomain,
    llms = true,
    locales = {},
    footer: ownFooter,
    legal,
    ...site
  } = config;
  const extra = Object.keys(locales).filter((key) => key !== 'root' && key !== 'zh');
  if (extra.length) {
    fail(
      `locales may only be "root" (English) and "zh" (Simplified Chinese), got ${extra.join(', ')}`,
    );
  }
  for (const [key, locale] of Object.entries(locales)) {
    if (locale && 'head' in locale) {
      fail(`locales.${key}.head is not supported: VitePress drops it in production; use head`);
    }
  }
  if (site.cleanUrls === false) fail('cleanUrls cannot be turned off');
  if (site.base && site.base !== '/') fail('sites are served from the root; base must be "/"');
  if ('extends' in site) fail('extends is set by the theme');

  const hostname = resolveHostname(rawHostname);
  const brand = findBrand(brandId);
  checkFooter(ownFooter, legal, masterBrand(loadBrands()), hostname);
  const year = new Date().getUTCFullYear();
  const note = ownFooter?.note;
  const footer = (locale: 'en' | 'zh', description: string | undefined): Footer =>
    buildFooter({ brand, brands: loadBrands(), hostname, locale, description, note, legal, year });
  const resolved: Resolved = {
    brand,
    hostname,
    brandKit,
    cookieDomain: cookieDomain === false ? null : (cookieDomain ?? deriveCookieDomain(hostname)),
    llms,
    markdown: site.markdown,
    localSearch: (site.themeConfig?.search?.provider ?? 'local') === 'local',
    footers: {
      en: footer('en', locales.root?.description ?? site.description),
      zh: footer('zh', locales.zh?.description),
    },
  };
  const base = baseConfig(resolved);

  const { themeConfig: topTheme, markdown, sitemap } = site;
  const theme: ThemeConfig | undefined = topTheme && { ...topTheme };
  for (const key of PER_LOCALE_KEYS) if (theme) delete theme[key];

  const locale = (key: 'root' | 'zh', lang: 'en' | 'zh') => {
    const own = locales[key] ?? {};
    const themeConfig = distribute(topTheme, own.themeConfig);
    return {
      ...LOCALE_META[key],
      ...own,
      themeConfig: {
        ...themeConfig,
        nav: [...(themeConfig.nav ?? []), familyNav(lang, hostname)],
      },
    };
  };

  return {
    ...site,
    extends: base,
    themeConfig: theme,
    locales: { root: locale('root', 'en'), zh: locale('zh', 'zh') },
    transformHead: async (ctx) => {
      const ours = (await base.transformHead?.(ctx)) ?? [];
      const own = (await site.transformHead?.(ctx)) ?? [];
      return [...ours, ...own] as HeadConfig[];
    },
    buildEnd: chain(base.buildEnd, site.buildEnd),
    markdown: {
      ...markdown,
      config: (md) => {
        base.markdown?.config?.(md);
        markdown?.config?.(md);
      },
    },
    sitemap: {
      ...sitemap,
      hostname: sitemap?.hostname ?? hostname,
      transformItems: async (items) => {
        const ours = addXDefault(items);
        return (await sitemap?.transformItems?.(ours)) ?? ours;
      },
    },
  };
}
