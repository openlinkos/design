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
import { type Brand, findBrand, loadBrands } from './brands.js';
import { checkSite, formatProblems } from './check.js';
import { buildFooter, type Footer, type FooterLink, masterBrand } from './footer.js';
import { addXDefault, pageHead, siteHead } from './head.js';
import { englishLabels, localizeMarkdown } from './markdown.js';
import { openlinkosPlugin, PACKAGE_NAME } from './plugin.js';
import { openlinkosTokenize } from './search.js';
import { FAMILY, LINKS, UI, ZH_SEARCH_TRANSLATIONS } from './strings.js';

export { sourceHash } from './check.js';
export type { FooterLink, Localized } from './footer.js';

type ThemeConfig = DefaultTheme.Config;
type Config = UserConfig<ThemeConfig>;

/** A locale of an OpenLinkOS site. `lang`, `label` and `link` are set by the theme. */
export type OpenLinkOSLocale = Omit<LocaleSpecificConfig<ThemeConfig>, 'head' | 'lang' | 'dir'>;

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
  /** English at the root and Simplified Chinese under /zh/; no other locales. */
  locales?: { root?: OpenLinkOSLocale; zh?: OpenLinkOSLocale };
  /**
   * The links in the footer's bottom row, after the copyright, such as the terms of use and the
   * privacy notice. Defaults to the organization's privacy notice.
   */
  legal?: FooterLink[];
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
 * The family menu, named after the master brand: its home, the open-source projects and the
 * services from brands.json, and a link to every service.
 */
const familyNav = (locale: 'en' | 'zh'): DefaultTheme.NavItem => {
  const brands = loadBrands();
  const master = masterBrand(brands);
  const listed = (nav: 'projects' | 'services') =>
    brands.filter((b) => b.nav === nav).map((b) => ({ text: b.name, link: b.url[locale] }));
  return {
    text: master.name,
    items: [
      { text: FAMILY[locale].home(master.name), link: master.url[locale] },
      { text: FAMILY[locale].projects, items: listed('projects') },
      {
        text: FAMILY[locale].services,
        items: [
          ...listed('services'),
          { text: FAMILY[locale].allServices, link: LINKS.services[locale] },
        ],
      },
    ],
  };
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
    locales = {},
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
  const year = new Date().getUTCFullYear();
  const footer = (locale: 'en' | 'zh', description: string | undefined): Footer =>
    buildFooter({ brand, brands: loadBrands(), hostname, locale, description, legal, year });
  const resolved: Resolved = {
    brand,
    hostname,
    brandKit,
    cookieDomain: cookieDomain === false ? null : (cookieDomain ?? deriveCookieDomain(hostname)),
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
      themeConfig: { ...themeConfig, nav: [...(themeConfig.nav ?? []), familyNav(lang)] },
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
