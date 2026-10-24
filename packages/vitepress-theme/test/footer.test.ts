import { describe, expect, it } from 'vitest';
import { type Brand, findBrand, loadBrands } from '../src/config/brands.ts';
import { buildFooter, type FooterOptions, masterBrand } from '../src/config/footer.ts';
import { securityTxt } from '../src/config/plugin.ts';

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
      'https://origin.openlinkos.com/',
      'https://github.com/openlinkos/agent',
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

  it('turns links into the site itself into paths', () => {
    const { message, copyright } = footer('linkos', 'zh', { hostname: 'https://linkos.io' });
    expect(hrefs(message)).toContain('/zh/about');
    expect(hrefs(copyright)).toEqual(['/zh/privacy']);
  });

  it('ends with the copyright and the legal links, the organization’s privacy notice by default', () => {
    expect(footer('origin', 'en').copyright).toBe(
      '<span class="olf-copy">© 2026 LinkOS</span>' +
        '<span class="olf-sep" aria-hidden="true"> · </span>' +
        '<a href="https://linkos.io/privacy">Privacy</a>',
    );
    const legal = [
      { text: { en: 'Terms', zh: '使用须知' }, link: { en: '/terms', zh: '/zh/terms' } },
      { text: 'MIT', link: 'https://github.com/openlinkos/origin/blob/master/LICENSE' },
    ];
    const { copyright } = footer('linkos', 'zh', { legal });
    expect(hrefs(copyright)).toEqual([
      '/zh/terms',
      'https://github.com/openlinkos/origin/blob/master/LICENSE',
    ]);
    expect(copyright).toContain('>使用须知</a>');
  });

  it('needs exactly one master brand', () => {
    const asMaster = (b: Brand): Brand => ({ ...b, tier: 'master' });
    expect(() => masterBrand(brands.map(asMaster))).toThrow(/exactly one master brand, found 6/);
    expect(() => masterBrand(brands.filter((b) => b.tier !== 'master'))).toThrow(/found 0/);
  });
});

describe('security.txt', () => {
  it('names the contact, the policy and the canonical URL, and expires a year after the build', () => {
    expect(securityTxt('https://linkos.org', new Date('2026-10-24T09:30:00Z'))).toBe(
      'Contact: mailto:admin@linkos.io\n' +
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
