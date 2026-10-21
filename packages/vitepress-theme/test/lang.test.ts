import { afterEach, describe, expect, it, vi } from 'vitest';
import { languageScript } from '../src/config/head.ts';
import {
  cookieDomainAttribute,
  deriveCookieDomain,
  type Lang,
  localeOfPath,
  preferenceCookie,
  type RedirectInput,
  resolveLanguageRedirect,
} from '../src/shared/lang.ts';
import { trackLanguageChoice } from '../src/theme/choice.ts';

const CHROME =
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 Chrome/141.0 Safari/537.36';

describe('resolveLanguageRedirect', () => {
  // here, pref, languages, ua, webdriver -> target
  const table: Array<[Lang, Lang | null, string[], string, boolean, Lang | null]> = [
    // No preference: only English pages move, and only for a Chinese-first browser.
    ['en', null, ['zh-CN', 'en'], CHROME, false, 'zh'],
    ['en', null, ['ZH-tw'], CHROME, false, 'zh'],
    ['en', null, ['fr-FR', 'zh-CN', 'en'], CHROME, false, 'zh'],
    ['en', null, ['en-US', 'zh-CN'], CHROME, false, null],
    ['en', null, ['fr-FR', 'de'], CHROME, false, null],
    ['en', null, [], CHROME, false, null],
    ['zh', null, ['en-US'], CHROME, false, null],
    ['zh', null, ['zh-CN'], CHROME, false, null],
    // An explicit choice wins in both directions.
    ['en', 'zh', ['en-US'], CHROME, false, 'zh'],
    ['zh', 'en', ['zh-CN'], CHROME, false, 'en'],
    ['en', 'en', ['zh-CN'], CHROME, false, null],
    ['zh', 'zh', ['en-US'], CHROME, false, null],
    // Bots and automation stay where they are.
    ['en', null, ['zh-CN'], 'Mozilla/5.0 (compatible; Googlebot/2.1)', false, null],
    ['en', null, ['zh-CN'], 'Mozilla/5.0 (compatible; bingbot/2.0)', false, null],
    ['en', null, ['zh-CN'], 'Baiduspider/2.0', false, null],
    ['en', null, ['zh-CN'], 'Mozilla/5.0 (compatible; Yahoo! Slurp)', false, null],
    ['zh', 'en', ['zh-CN'], 'Mozilla/5.0 HeadlessChrome/141.0', false, null],
    ['en', 'zh', ['zh-CN'], 'Mozilla/5.0 Chrome-Lighthouse', false, null],
    ['en', null, ['zh-CN'], 'facebookexternalhit/1.1 (+preview)', false, null],
    ['en', null, ['zh-CN'], CHROME, true, null],
  ];

  it.each(table)(
    'here=%s pref=%s languages=%j ua=%s webdriver=%s -> %s',
    (here, pref, languages, ua, webdriver, expected) => {
      expect(resolveLanguageRedirect({ here, pref, languages, ua, webdriver })).toBe(expected);
    },
  );

  it('is self-contained, so the serialized copy behaves the same', () => {
    const revived = new Function(`return ${resolveLanguageRedirect.toString()}`)() as (
      input: RedirectInput,
    ) => Lang | null;
    for (const [here, pref, languages, ua, webdriver, expected] of table) {
      expect(revived({ here, pref, languages, ua, webdriver })).toBe(expected);
    }
  });
});

describe('localeOfPath', () => {
  it('treats /zh and everything under /zh/ as Chinese', () => {
    expect(['/zh', '/zh/', '/zh/guide/cli'].map(localeOfPath)).toEqual(['zh', 'zh', 'zh']);
    expect(['/', '/guide', '/zhuyin', '/brand/zh/'].map(localeOfPath)).toEqual([
      'en',
      'en',
      'en',
      'en',
    ]);
  });
});

describe('cookie domain', () => {
  it('derives the registrable domain from the hostname', () => {
    expect(deriveCookieDomain('https://origin.openlinkos.com')).toBe('openlinkos.com');
    expect(deriveCookieDomain('https://openlinkos.com')).toBe('openlinkos.com');
    expect(deriveCookieDomain('https://a.b.linkos.org')).toBe('linkos.org');
    expect(deriveCookieDomain('http://localhost:5173')).toBeNull();
    expect(deriveCookieDomain('http://127.0.0.1:4173')).toBeNull();
    expect(deriveCookieDomain('http://[::1]:4173')).toBeNull();
  });

  it('sets Domain only on that domain and its subdomains', () => {
    expect(cookieDomainAttribute('origin.openlinkos.com', 'openlinkos.com')).toBe(
      '; Domain=openlinkos.com',
    );
    expect(cookieDomainAttribute('openlinkos.com', 'openlinkos.com')).toBe(
      '; Domain=openlinkos.com',
    );
    expect(cookieDomainAttribute('localhost', 'openlinkos.com')).toBe('');
    expect(cookieDomainAttribute('site.pages.dev', 'openlinkos.com')).toBe('');
    expect(cookieDomainAttribute('evilopenlinkos.com', 'openlinkos.com')).toBe('');
    expect(cookieDomainAttribute('origin.openlinkos.com', null)).toBe('');
  });

  it('builds the preference cookie, Secure on https', () => {
    expect(
      preferenceCookie(
        'zh',
        { hostname: 'origin.openlinkos.com', protocol: 'https:' },
        'openlinkos.com',
      ),
    ).toBe(
      'openlinkos-lang=zh; Path=/; Max-Age=31536000; SameSite=Lax; Secure; Domain=openlinkos.com',
    );
    expect(
      preferenceCookie('en', { hostname: 'localhost', protocol: 'http:' }, 'openlinkos.com'),
    ).toBe('openlinkos-lang=en; Path=/; Max-Age=31536000; SameSite=Lax');
  });
});

describe('the inline language script', () => {
  const run = (
    script: string,
    env: { cookie?: string; languages?: string[]; ua?: string; webdriver?: boolean },
  ): string[] => {
    const replaced: string[] = [];
    const location = {
      search: '?q=1',
      hash: '#top',
      replace: (url: string) => replaced.push(url),
    };
    const navigator = {
      languages: env.languages ?? [],
      language: env.languages?.[0] ?? '',
      userAgent: env.ua ?? CHROME,
      webdriver: env.webdriver ?? false,
    };
    new Function('document', 'navigator', 'location', script)(
      { cookie: env.cookie ?? '' },
      navigator,
      location,
    );
    return replaced;
  };

  it('redirects a Chinese-first browser from English, keeping query and hash', () => {
    expect(run(languageScript('en', '/zh/guide'), { languages: ['zh-CN', 'en'] })).toEqual([
      '/zh/guide?q=1#top',
    ]);
  });

  it('follows the cookie in both directions', () => {
    const cookie = 'theme=dark; openlinkos-lang=en; other=1';
    expect(run(languageScript('zh', '/guide'), { cookie, languages: ['zh-CN'] })).toEqual([
      '/guide?q=1#top',
    ]);
    expect(run(languageScript('en', '/zh/'), { cookie: 'openlinkos-lang=zh' })).toEqual([
      '/zh/?q=1#top',
    ]);
    expect(run(languageScript('en', '/zh/'), { cookie: 'xopenlinkos-lang=zh' })).toEqual([]);
  });

  it('stays put for bots, automation and Chinese pages without a choice', () => {
    expect(run(languageScript('en', '/zh/'), { languages: ['zh-CN'], ua: 'Googlebot' })).toEqual(
      [],
    );
    expect(run(languageScript('en', '/zh/'), { languages: ['zh-CN'], webdriver: true })).toEqual(
      [],
    );
    expect(run(languageScript('zh', '/'), { languages: ['en-US'] })).toEqual([]);
  });

  it('never throws', () => {
    expect(() =>
      new Function('document', 'navigator', 'location', languageScript('en', '/zh/'))(
        undefined,
        undefined,
        undefined,
      ),
    ).not.toThrow();
  });

  it('escapes the counterpart URL', () => {
    expect(languageScript('en', '/zh/</script>')).not.toContain('</script>');
  });
});

describe('trackLanguageChoice', () => {
  type Listener = (event: Record<string, unknown>) => void;

  class FakeElement {
    constructor(
      readonly attrs: Record<string, string>,
      readonly parent: FakeElement | null = null,
    ) {}
    closest(selector: string): FakeElement | null {
      expect(selector).toBe('a[href]');
      for (let el: FakeElement | null = this; el; el = el.parent) {
        if ('href' in el.attrs) return el;
      }
      return null;
    }
    getAttribute(name: string): string | null {
      return this.attrs[name] ?? null;
    }
    get baseURI(): string {
      return `https://origin.openlinkos.com${page.pathname}`;
    }
  }

  const page = { pathname: '/guide/cli' };
  let cookies: string[] = [];
  const listeners: Record<string, Listener[]> = {};
  const on = (type: string, listener: Listener): void => {
    listeners[type] ??= [];
    listeners[type].push(listener);
  };

  const setup = (pathname: string): void => {
    page.pathname = pathname;
    cookies = [];
    for (const key of Object.keys(listeners)) delete listeners[key];
    vi.stubGlobal('Element', FakeElement);
    vi.stubGlobal('location', {
      get pathname() {
        return page.pathname;
      },
      origin: 'https://origin.openlinkos.com',
      hostname: 'origin.openlinkos.com',
      protocol: 'https:',
    });
    vi.stubGlobal('window', { addEventListener: on });
    vi.stubGlobal('document', {
      addEventListener: (type: string, listener: Listener, capture: boolean) => {
        expect(capture).toBe(true);
        on(type, listener);
      },
      set cookie(value: string) {
        cookies.push(value);
      },
    });
    trackLanguageChoice('openlinkos.com');
  };

  const click = (href: string, extra: Record<string, unknown> = {}, type = 'click'): void => {
    const link = new FakeElement({ href, ...((extra.attrs as Record<string, string>) ?? {}) });
    const target = new FakeElement({}, link);
    for (const listener of listeners[type] ?? []) listener({ type, target, ...extra });
  };

  afterEach(() => {
    vi.unstubAllGlobals();
  });

  it('records a click into the other locale, even after the router has changed the URL', () => {
    setup('/guide/cli');
    expect(Object.keys(listeners).sort()).toEqual(['auxclick', 'click', 'popstate']);
    // The router's window listener has already pushed the new URL.
    page.pathname = '/zh/guide/cli';
    click('/zh/guide/cli');
    expect(cookies).toEqual([
      'openlinkos-lang=zh; Path=/; Max-Age=31536000; SameSite=Lax; Secure; Domain=openlinkos.com',
    ]);
    // Back in English through the language menu.
    click('/guide/cli');
    expect(cookies).toHaveLength(2);
    expect(cookies[1]).toMatch(/^openlinkos-lang=en;/);
  });

  it('ignores links within the locale, to other origins and anchors', () => {
    setup('/zh/guide/cli');
    click('/zh/guide/hub');
    click('#top');
    click('https://openlinkos.com/');
    click('https://github.com/openlinkos');
    expect(cookies).toEqual([]);
  });

  it('records middle clicks and new-tab clicks without changing the shown locale', () => {
    setup('/guide/cli');
    click('/zh/guide/cli', {}, 'auxclick');
    click('/zh/guide/cli', { ctrlKey: true });
    click('/zh/guide/cli', { attrs: { target: '_blank' } });
    expect(cookies).toHaveLength(3);
    // The page on screen is still English, so a later English link is no choice.
    click('/guide/hub');
    expect(cookies).toHaveLength(3);
  });

  it('follows back and forward navigation without recording a choice', () => {
    setup('/guide/cli');
    page.pathname = '/zh/guide/cli';
    for (const listener of listeners.popstate) listener({ type: 'popstate' });
    expect(cookies).toEqual([]);
    click('/zh/guide/hub');
    expect(cookies).toEqual([]);
    click('/guide/hub');
    expect(cookies).toHaveLength(1);
  });
});
