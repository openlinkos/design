import { describe, expect, it } from 'vitest';
import { type Brand, findBrand, loadBrands } from '../src/config/brands.ts';
import {
  buildFooter,
  type FooterOptions,
  legalLinks,
  masterBrand,
  repeatedPrivacy,
  siteLink,
} from '../src/config/footer.ts';
import { securityTxt } from '../src/config/plugin.ts';
import { FAMILY, FOOTER } from '../src/config/strings.ts';

const brands = loadBrands();

const footer = (id: string, locale: 'en' | 'zh', extra: Partial<FooterOptions> = {}) =>
  buildFooter({
    brand: findBrand(id),
    brands,
    hostname: 'https://example.com',
    locale,
    year: 2026,
    ...extra,
  });

const hrefs = (html: string): string[] => [...html.matchAll(/href="([^"]*)"/g)].map((m) => m[1]);

describe('the footer', () => {
  it.each(brands.flatMap((b) => [[b.id, 'en'] as const, [b.id, 'zh'] as const]))(
    '%s (%s) uses phrasing elements and absolute, local or mailto links only',
    (id, locale) => {
      const { message, copyright } = footer(id, locale);
      for (const html of [message, copyright]) {
        expect(html).not.toMatch(/<(div|p|ul|ol|li|nav|section|header|footer|h\d)\b/);
        for (const href of hrefs(html)) expect(href).toMatch(/^(https:\/\/|mailto:|\/)/);
      }
    },
  );

  it('has the same links in both languages', () => {
    for (const b of brands) {
      expect(hrefs(footer(b.id, 'zh').message)).toHaveLength(
        hrefs(footer(b.id, 'en').message).length,
      );
    }
  });

  it('lists the projects, the services, the organization and the resources', () => {
    const { message } = footer('origin', 'en');
    expect(hrefs(message)).toEqual([
      '/',
      'https://github.com/openlinkos/registry-mirrors',
      'https://origin.openlinkos.com/',
      'https://beacon.openlinkos.com/',
      'https://linkos.org/mirrors',
      'https://uptime.linkos.org/',
      'https://linkos.org/',
      'https://linkos.io/about',
      'https://linkos.io/news',
      'https://linkos.io/trust',
      'mailto:admin@linkos.io',
      'https://github.com/openlinkos',
      'https://openlinkos.com/brand',
      'https://github.com/openlinkos/design',
    ]);
    expect(hrefs(footer('origin', 'zh').message)).toContain('https://linkos.io/zh/about');
  });

  it('says who the site belongs to, except on the organization’s own sites', () => {
    expect(footer('origin', 'en').message).toContain('Open source by LinkOS');
    expect(footer('openlinkos', 'zh').message).toContain('LinkOS 发起的开源项目');
    expect(footer('linkos-mirrors', 'zh').message).toContain('由 LinkOS 运营');
    expect(footer('linkos', 'en').message).not.toContain('olf-about');
  });

  it('describes the site with its own description, escaped, or the brand’s', () => {
    expect(footer('origin', 'en').message).toContain(findBrand('origin').description.en);
    expect(
      footer('origin', 'en', { description: 'Memory <for> agents & tools' }).message,
    ).toContain('Memory &lt;for&gt; agents &amp; tools');
  });

  it('adds the site’s note under the description and the attribution, escaped, per language', () => {
    const note = { en: 'Run by the <LinkOS> team & friends', zh: '由 LinkOS 团队运营' };
    const en = footer('origin', 'en', { note }).message;
    expect(en).toContain(
      '<span class="olf-about">Open source by LinkOS</span>' +
        '<span class="olf-note">Run by the &lt;LinkOS&gt; team &amp; friends</span></span>',
    );
    expect(footer('linkos', 'zh', { note }).message).toContain(
      '<span class="olf-note">由 LinkOS 团队运营</span>',
    );
    expect(footer('linkos', 'en', { note: 'Same text' }).message).toContain('>Same text</span>');
    expect(footer('origin', 'en').message).not.toContain('olf-note');
  });

  it('turns links into the site itself into paths', () => {
    const { message, copyright } = footer('linkos', 'zh', { hostname: 'https://linkos.io' });
    expect(hrefs(message)).toContain('/zh/about');
    expect(hrefs(copyright)).toEqual(['/zh/privacy']);
    expect(hrefs(footer('linkos', 'zh', { hostname: 'https://linkos.org' }).message)).toEqual(
      expect.arrayContaining(['/zh/mirrors', '/zh/']),
    );
    expect(siteLink('https://linkos.org', 'https://linkos.org')).toBe('/');
    expect(siteLink('https://linkos.org/', 'https://linkos.org')).toBe('/');
    expect(siteLink('https://linkos.org/zh/mirrors', 'https://linkos.org')).toBe('/zh/mirrors');
    expect(siteLink('https://linkos.org.cn/x', 'https://linkos.org')).toBe(
      'https://linkos.org.cn/x',
    );
    expect(siteLink('https://uptime.linkos.org/', 'https://linkos.org')).toBe(
      'https://uptime.linkos.org/',
    );
  });

  it('ends with the copyright and the organization’s privacy notice', () => {
    expect(footer('origin', 'en').copyright).toBe(
      '<span class="olf-copy">© 2026 LinkOS</span>' +
        '<span class="olf-sep" aria-hidden="true"> · </span>' +
        '<a href="https://linkos.io/privacy">Privacy</a>',
    );
  });

  it('adds the site’s legal links after the privacy notice', () => {
    const links = [
      { text: { en: 'Terms', zh: '使用须知' }, link: { en: '/terms', zh: '/zh/terms' } },
      { text: 'MIT', link: 'https://github.com/openlinkos/origin/blob/master/LICENSE' },
    ];
    const expected = [
      'https://linkos.io/zh/privacy',
      '/zh/terms',
      'https://github.com/openlinkos/origin/blob/master/LICENSE',
    ];
    const { copyright } = footer('linkos', 'zh', { legal: links });
    expect(hrefs(copyright)).toEqual(expected);
    expect(copyright).toContain('>隐私说明</a>');
    expect(copyright).toContain('>使用须知</a>');
    expect(hrefs(footer('linkos', 'zh', { legal: { links } }).copyright)).toEqual(expected);
    expect(hrefs(footer('linkos', 'zh', { legal: { privacy: true, links } }).copyright)).toEqual(
      expected,
    );
  });

  it('points the privacy notice at the site’s own, or leaves it out', () => {
    const links = [{ text: 'Terms', link: { en: '/terms', zh: '/zh/terms' } }];
    const own = footer('linkos', 'zh', {
      hostname: 'https://linkos.org',
      legal: { privacy: { en: 'https://linkos.org/privacy', zh: '/zh/privacy' }, links },
    }).copyright;
    expect(hrefs(own)).toEqual(['/zh/privacy', '/zh/terms']);
    expect(own).toContain('<a href="/zh/privacy">隐私说明</a>');
    const none = footer('linkos', 'en', { legal: { privacy: false, links } }).copyright;
    expect(hrefs(none)).toEqual(['/terms']);
    expect(none).not.toContain('Privacy');
    expect(legalLinks(masterBrand(brands), { privacy: false })).toEqual([]);
  });

  it('finds a legal link that repeats the privacy notice', () => {
    const master = masterBrand(brands);
    const mit = { text: 'MIT License', link: 'https://github.com/openlinkos/origin' };
    const repeats = (legal: Parameters<typeof repeatedPrivacy>[1], hostname = 'https://x.com') =>
      repeatedPrivacy(master, legal, hostname)?.text;
    // By its text, in either language, or by its address.
    expect(repeats([mit, { text: 'privacy', link: '/p' }])).toBe('privacy');
    expect(repeats([{ text: { en: 'Data', zh: '隐私说明' }, link: '/p' }])).toEqual({
      en: 'Data',
      zh: '隐私说明',
    });
    expect(repeats([{ text: 'Data', link: 'https://linkos.io/zh/privacy' }])).toBe('Data');
    expect(repeats([{ text: 'Data', link: '/privacy' }], 'https://linkos.io')).toBe('Data');
    expect(repeats({ privacy: '/own', links: [{ text: 'Data', link: '/own' }] })).toBe('Data');
    // Not when the site leaves the notice out, nor for other links.
    expect(repeats({ privacy: false, links: [{ text: 'Privacy', link: '/p' }] })).toBeUndefined();
    expect(repeats([mit])).toBeUndefined();
    expect(repeats(undefined)).toBeUndefined();
  });

  it('calls the services 公共服务 in Chinese, and 免费公共服务 in prose, never 公益', () => {
    expect(FAMILY.zh.services).toBe('公共服务');
    expect(FOOTER.zh.services).toBe('公共服务');
    expect(findBrand('linkos').description.zh).toContain('免费公共服务');
    const texts = JSON.stringify([FAMILY, FOOTER, brands.map((b) => b.description)]);
    expect(texts).not.toContain('公益');
  });

  it('needs exactly one master brand', () => {
    const asMaster = (b: Brand): Brand => ({ ...b, tier: 'master' });
    expect(() => masterBrand(brands.map(asMaster))).toThrow(/exactly one master brand, found 7/);
    expect(() => masterBrand(brands.filter((b) => b.tier !== 'master'))).toThrow(/found 0/);
  });
});

describe('security.txt', () => {
  it('names the contact, the policy and the canonical URL, and expires a year after the build', () => {
    expect(securityTxt('https://linkos.org', new Date('2026-10-24T09:30:00Z'))).toBe(
      'Contact: mailto:security@linkos.io\n' +
        'Expires: 2027-10-24T00:00:00Z\n' +
        'Policy: https://linkos.io/trust\n' +
        'Preferred-Languages: zh, en\n' +
        'Canonical: https://linkos.org/.well-known/security.txt\n',
    );
    expect(securityTxt('https://linkos.io', new Date('2028-02-29T00:00:00Z'))).toContain(
      'Expires: 2029-03-01T00:00:00Z',
    );
  });
});
