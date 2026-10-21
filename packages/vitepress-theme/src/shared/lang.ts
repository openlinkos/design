// Language preference and detection, shared by the build (the inline head script) and the browser
// (the theme's choice tracking). Nothing here may import Node built-ins or Vue.

export type Lang = 'en' | 'zh';

/** The cookie that stores an explicit language choice, shared by every OpenLinkOS site. */
export const LANG_COOKIE = 'openlinkos-lang';

/** One year, in seconds. */
const MAX_AGE = 31536000;

/** The locale of a site path: everything under `/zh/` is Chinese, the rest is English. */
export const localeOfPath = (pathname: string): Lang =>
  /^\/zh(\/|$)/.test(pathname) ? 'zh' : 'en';

export interface RedirectInput {
  /** Locale of the page being loaded. */
  here: Lang;
  /** The stored explicit choice, if any. */
  pref: Lang | null;
  /** `navigator.languages`, most preferred first. */
  languages: readonly string[];
  /** `navigator.userAgent`. */
  ua: string;
  /** `navigator.webdriver`. */
  webdriver: boolean;
}

/**
 * Decides whether a page should send the reader to its counterpart in the other locale, and
 * returns the target locale or null to stay.
 *
 * - Bots and automation are never redirected.
 * - An explicit choice wins in both directions.
 * - Without a choice, only English pages redirect, and only when the first English or Chinese
 *   entry in the browser's languages is Chinese. Chinese pages never fall back to English.
 *
 * The function is serialized with `Function.prototype.toString` into the inline head script, so
 * it must stay self-contained: no references to anything outside its own body.
 */
export function resolveLanguageRedirect(input: RedirectInput): Lang | null {
  if (input.webdriver || /bot|crawl|spider|slurp|preview|headless|lighthouse/i.test(input.ua)) {
    return null;
  }
  if (input.pref === 'en' || input.pref === 'zh') {
    return input.pref === input.here ? null : input.pref;
  }
  if (input.here !== 'en') return null;
  for (const entry of input.languages) {
    const tag = String(entry).toLowerCase();
    if (tag.startsWith('zh')) return 'zh';
    if (tag.startsWith('en')) return null;
  }
  return null;
}

/**
 * The registrable domain of a site's origin, taken as its last two labels (so
 * `https://origin.openlinkos.com` gives `openlinkos.com`), or null for localhost and IP
 * addresses. Sites under a multi-label public suffix must set the domain explicitly.
 */
export const deriveCookieDomain = (origin: string): string | null => {
  const host = new URL(origin).hostname;
  if (!host.includes('.') || host.includes(':') || /^[\d.]+$/.test(host)) return null;
  return host.split('.').slice(-2).join('.');
};

/**
 * The `Domain` attribute for the preference cookie: the configured registrable domain when the
 * current host is that domain or one of its subdomains, otherwise nothing (a host-only cookie, as
 * on localhost and preview hosts).
 */
export const cookieDomainAttribute = (hostname: string, domain: string | null): string =>
  domain && (hostname === domain || hostname.endsWith(`.${domain}`)) ? `; Domain=${domain}` : '';

/** The `document.cookie` assignment that records an explicit choice. */
export const preferenceCookie = (
  lang: Lang,
  location: { hostname: string; protocol: string },
  domain: string | null,
): string =>
  `${LANG_COOKIE}=${lang}; Path=/; Max-Age=${MAX_AGE}; SameSite=Lax` +
  (location.protocol === 'https:' ? '; Secure' : '') +
  cookieDomainAttribute(location.hostname, domain);
