import type { DefaultTheme, HeadConfig, Plugin, UserConfig } from 'vitepress';
import { createMarkdownRenderer, disposeMdItInstance, mergeConfig } from 'vitepress';
import { describe, expect, it } from 'vitest';
import { findBrand } from '../src/config/brands.ts';
import { defineOpenLinkOSConfig, type OpenLinkOSConfig } from '../src/config/index.ts';
import { brandCss, robotsTxt, siteFiles } from '../src/config/plugin.ts';
import { openlinkosTokenize } from '../src/config/search.ts';
import { UI } from '../src/config/strings.ts';

type Config = UserConfig<DefaultTheme.Config>;

const origin = (extra: Partial<OpenLinkOSConfig> = {}): OpenLinkOSConfig => ({
  brand: 'origin',
  hostname: 'https://origin.openlinkos.com/',
  title: 'Origin',
  locales: {
    root: {
      description: 'Memory for agents.',
      themeConfig: {
        nav: [{ text: 'Guide', link: '/guide/getting-started' }],
        footer: { message: 'Released under the MIT License.' },
      },
    },
    zh: {
      description: 'Agent 的记忆。',
      themeConfig: {
        nav: [{ text: '指南', link: '/zh/guide/getting-started' }],
        footer: { message: '基于 MIT 许可证发布。' },
      },
    },
  },
  ...extra,
});

/** The config VitePress ends up with: the base merged under the site's own config. */
const resolve = (config: Config): Config => {
  const { extends: base, ...site } = config;
  return mergeConfig(base as Config, site) as Config;
};

const pluginOf = (config: Config): Plugin =>
  (config.extends as Config).vite?.plugins?.[0] as Plugin;

describe('defineOpenLinkOSConfig', () => {
  it('rejects locales other than root and zh, unknown brands and bad hostnames', () => {
    expect(() =>
      defineOpenLinkOSConfig(
        origin({ locales: { root: {}, fr: {} } as OpenLinkOSConfig['locales'] }),
      ),
    ).toThrow(/locales may only be "root" \(English\) and "zh" \(Simplified Chinese\), got fr/);
    expect(() => defineOpenLinkOSConfig(origin({ brand: 'nope' }))).toThrow(/unknown brand "nope"/);
    expect(() => defineOpenLinkOSConfig(origin({ hostname: 'origin.openlinkos.com' }))).toThrow(
      /hostname must be an origin/,
    );
    expect(() => defineOpenLinkOSConfig(origin({ hostname: 'https://x.com/docs/' }))).toThrow(
      /hostname must be an origin/,
    );
    expect(() => defineOpenLinkOSConfig(origin({ base: '/docs/' }))).toThrow(/base must be "\/"/);
    expect(() =>
      defineOpenLinkOSConfig(
        origin({
          locales: { zh: { head: [] } as unknown as OpenLinkOSConfig['locales'] } as never,
        }),
      ),
    ).toThrow(/locales.zh.head is not supported/);
  });

  it('sets up both locales with complete interface strings and the footer', () => {
    const config = resolve(defineOpenLinkOSConfig(origin()));
    expect(config.cleanUrls).toBe(true);
    const root = config.locales?.root;
    const zh = config.locales?.zh;
    expect(root).toMatchObject({
      label: 'English',
      lang: 'en-US',
      description: 'Memory for agents.',
    });
    expect(zh).toMatchObject({ label: '简体中文', lang: 'zh-CN', link: '/zh/' });
    expect(Object.keys(UI.en).sort()).toEqual(Object.keys(UI.zh).sort());
    for (const [locale, strings] of [
      [root, UI.en],
      [zh, UI.zh],
    ] as const) {
      expect(locale?.themeConfig).toMatchObject(strings);
    }
    expect(zh?.themeConfig?.notFound).toEqual({
      title: '页面未找到',
      quote: '你要找的页面不存在，或已移动到别处。',
      linkLabel: '返回首页',
      linkText: '返回首页',
    });
    expect(root?.themeConfig?.footer).toEqual({
      copyright: '© 2026 OpenLinkOS',
      message: 'Released under the MIT License.',
    });
    expect(zh?.themeConfig?.footer).toEqual({
      copyright: '© 2026 OpenLinkOS',
      message: '基于 MIT 许可证发布。',
    });
    expect(config.themeConfig?.logo).toEqual({ light: '/logo.svg', dark: '/logo-dark.svg' });
    expect(config.sitemap?.hostname).toBe('https://origin.openlinkos.com');
  });

  it('appends the family menu to each locale nav', () => {
    const config = resolve(defineOpenLinkOSConfig(origin()));
    const en = config.locales?.root?.themeConfig?.nav ?? [];
    const zh = config.locales?.zh?.themeConfig?.nav ?? [];
    expect(en[0]).toEqual({ text: 'Guide', link: '/guide/getting-started' });
    expect(en.at(-1)).toEqual({
      text: 'OpenLinkOS',
      items: [
        {
          text: 'Projects',
          items: [
            { text: 'Origin', link: 'https://origin.openlinkos.com/' },
            { text: 'OpenLinkOS Agent', link: 'https://github.com/openlinkos/agent' },
          ],
        },
        {
          text: 'Services',
          items: [
            { text: 'LinkOS Mirrors', link: 'https://github.com/openlinkos/registry-mirrors' },
            { text: 'LinkOS Status', link: 'https://uptime.linkos.org/' },
          ],
        },
      ],
    });
    const family = zh.at(-1) as DefaultTheme.NavItemWithChildren;
    expect(family.text).toBe('OpenLinkOS');
    expect(family.items.map((g) => (g as DefaultTheme.NavItemChildren).text)).toEqual([
      '开源项目',
      '服务',
    ]);
    expect((family.items[0] as DefaultTheme.NavItemChildren).items[0]).toEqual({
      text: 'Origin',
      link: 'https://origin.openlinkos.com/zh/',
    });
  });

  it('moves per-locale theme keys from the top level into each locale', () => {
    const config = resolve(
      defineOpenLinkOSConfig(
        origin({
          themeConfig: {
            outline: { level: [2, 3] },
            footer: { message: 'MIT' },
            socialLinks: [{ icon: 'github', link: 'https://github.com/openlinkos/origin' }],
          },
          locales: { root: {}, zh: { themeConfig: { footer: { message: 'MIT 许可' } } } },
        }),
      ),
    );
    expect(config.themeConfig?.outline).toBeUndefined();
    expect(config.themeConfig?.socialLinks).toHaveLength(1);
    expect(config.locales?.root?.themeConfig?.outline).toEqual({
      label: 'On this page',
      level: [2, 3],
    });
    expect(config.locales?.zh?.themeConfig?.outline).toEqual({ label: '本页内容', level: [2, 3] });
    expect(config.locales?.root?.themeConfig?.footer?.message).toBe('MIT');
    expect(config.locales?.zh?.themeConfig?.footer?.message).toBe('MIT 许可');
  });

  it('configures local search with Chinese strings and the CJK tokenizer', () => {
    const search = resolve(defineOpenLinkOSConfig(origin())).themeConfig?.search;
    expect(search?.provider).toBe('local');
    const options = (search as { options: DefaultTheme.LocalSearchOptions }).options;
    expect(options.locales?.zh?.translations?.button?.buttonText).toBe('搜索');
    expect(Object.keys(options.locales?.zh?.translations?.modal ?? {}).sort()).toEqual([
      'backButtonTitle',
      'displayDetails',
      'footer',
      'noResultsText',
      'resetButtonTitle',
    ]);
    expect(Object.keys(options.locales?.zh?.translations?.modal?.footer ?? {})).toHaveLength(7);
    expect(options.miniSearch?.options?.tokenize).toBe(openlinkosTokenize);
  });

  it('leaves another search provider alone', () => {
    const algolia = { appId: 'app', apiKey: 'key', indexName: 'docs' };
    const search = resolve(
      defineOpenLinkOSConfig(
        origin({ themeConfig: { search: { provider: 'algolia', options: algolia } } }),
      ),
    ).themeConfig?.search;
    expect(search).toEqual({ provider: 'algolia', options: algolia });
  });

  it('runs the theme hooks before the site hooks', async () => {
    const calls: string[] = [];
    const config = defineOpenLinkOSConfig(
      origin({
        transformHead: () => [['meta', { name: 'site', content: 'x' }]],
        buildEnd: () => {
          calls.push('site');
        },
        markdown: { config: () => calls.push('markdown') },
        sitemap: {
          hostname: 'https://origin.openlinkos.com',
          transformItems: (items) => items.filter((i) => i.url !== 'hidden'),
        },
      }),
    );
    const head = (await config.transformHead?.({
      page: 'index.md',
      pageData: {},
      title: 'Origin',
      description: '',
      siteData: { title: 'Origin' },
    } as never)) as HeadConfig[];
    expect(head[0]).toEqual(['link', { rel: 'canonical', href: 'https://origin.openlinkos.com/' }]);
    expect(head.at(-1)).toEqual(['meta', { name: 'site', content: 'x' }]);

    const items = await config.sitemap?.transformItems?.([
      { url: '', links: [{ lang: 'en-US', url: '' }] },
      { url: 'hidden' },
    ]);
    expect(items).toEqual([
      {
        url: '',
        links: [
          { lang: 'en-US', url: '' },
          { lang: 'x-default', url: '' },
        ],
      },
    ]);

    // The base buildEnd runs the coverage check first: an empty site passes, then the site's runs.
    await config.buildEnd?.({
      srcDir: '.',
      outDir: '.',
      pages: [],
      site: { locales: {} },
    } as never);
    expect(calls).toEqual(['site']);
  });

  it('derives the cookie domain for the client, unless disabled', async () => {
    const client = async (config: Config): Promise<string> =>
      String(
        await (pluginOf(config).load as (id: string) => unknown)('\0virtual:openlinkos/client'),
      );
    expect(await client(defineOpenLinkOSConfig(origin()))).toContain('"openlinkos.com"');
    expect(await client(defineOpenLinkOSConfig(origin({ cookieDomain: false })))).toContain('null');
    expect(await client(defineOpenLinkOSConfig(origin({ cookieDomain: 'example.org' })))).toContain(
      '"example.org"',
    );
  });
});

describe('the Vite plugin', () => {
  it('provides the brand colours as a virtual stylesheet', () => {
    const css = brandCss(findBrand('origin'));
    expect(css).toContain(':root {\n  --vp-c-brand-1: #4f5bd5;');
    expect(css).toContain('--vp-c-brand-soft: rgba(79, 91, 213, 0.14);');
    expect(css).toContain('--vp-home-hero-name-color: var(--vp-c-brand-1);');
    expect(css).toContain('.dark {\n  --vp-c-brand-1: #8b96ff;');
  });

  it('lists the web files and robots.txt, and the brand kit only on request', () => {
    const base = {
      brand: findBrand('origin'),
      hostname: 'https://x.openlinkos.com',
      cookieDomain: null,
    };
    const files = siteFiles({ ...base, brandKit: false });
    expect([...files.keys()].sort()).toEqual([
      'apple-touch-icon.png',
      'favicon.ico',
      'favicon.svg',
      'icon-192.png',
      'icon-512.png',
      'icon-maskable-512.png',
      'logo-dark.svg',
      'logo.svg',
      'og.png',
      'robots.txt',
      'site.webmanifest',
    ]);
    expect(files.get('robots.txt')?.source).toBe(robotsTxt('https://x.openlinkos.com'));
    expect(robotsTxt('https://x.openlinkos.com')).toBe(
      'User-agent: *\nAllow: /\n\nSitemap: https://x.openlinkos.com/sitemap.xml\n',
    );
    const kit = siteFiles({ ...base, brandKit: true });
    expect(kit.get('brand/origin/kit/lockup.svg')?.type).toBe('image/svg+xml');
    expect(kit.has('brand/linkos-mirrors/github/social-preview.png')).toBe(true);
    expect([...kit.keys()].filter((k) => k.startsWith('brand/'))).toHaveLength(6 * 21);
  });
});

describe('Chinese markdown defaults', () => {
  const render = async (markdown: Config['markdown'], src: string, relativePath: string) => {
    // VitePress caches one renderer per process; start fresh so each config takes effect.
    disposeMdItInstance();
    const md = await createMarkdownRenderer(process.cwd(), markdown);
    return md.render(src, { relativePath });
  };
  const markdown = resolve(defineOpenLinkOSConfig(origin())).markdown;

  it('localizes container titles only on zh/ pages', async () => {
    const src =
      '::: tip\nx\n:::\n\n::: warning\nx\n:::\n\n::: danger\nx\n:::\n\n::: info\nx\n:::\n\n::: details\nx\n:::\n';
    const zh = await render(markdown, src, 'zh/guide.md');
    for (const title of ['提示', '注意', '警告', '信息']) {
      expect(zh).toContain(`<p class="custom-block-title">${title}</p>`);
    }
    expect(zh).toContain('<summary>详情</summary>');
    const en = await render(markdown, src, 'guide.md');
    expect(en).toContain('<p class="custom-block-title">TIP</p>');
    expect(en).toContain('<summary>Details</summary>');
  });

  it('keeps titles the author wrote', async () => {
    const zh = await render(
      markdown,
      '::: tip 早期开发\nx\n:::\n\n> [!TIP] 自定义\n> x\n',
      'zh/a.md',
    );
    expect(zh).toContain('<p class="custom-block-title">早期开发</p>');
    expect(zh).toContain('<p class="custom-block-title">自定义</p>');
  });

  it('localizes GitHub alerts, the copy button and header anchors', async () => {
    const src = '## 安装 {#install}\n\n> [!NOTE]\n> x\n\n> [!CAUTION]\n> x\n\n```bash\nls\n```\n';
    const zh = await render(markdown, src, 'zh/a.md');
    expect(zh).toContain('<p class="custom-block-title">说明</p>');
    expect(zh).toContain('<p class="custom-block-title">警告</p>');
    expect(zh).toContain('<button title="复制代码" class="copy">');
    expect(zh).toContain('aria-label="“安装”的永久链接"');
    const en = await render(markdown, src.replace('安装', 'Install'), 'a.md');
    expect(en).toContain('<p class="custom-block-title">NOTE</p>');
    expect(en).toContain('<button title="Copy Code" class="copy">');
  });

  it('respects the English labels a site configures', async () => {
    const custom = resolve(
      defineOpenLinkOSConfig(
        origin({ markdown: { codeCopyButtonTitle: 'Copy', container: { tipLabel: 'Hint' } } }),
      ),
    ).markdown;
    const src = '> [!TIP]\n> x\n\n```bash\nls\n```\n';
    expect(await render(custom, src, 'a.md')).toContain('title="Copy" class="copy"');
    const zh = await render(custom, src, 'zh/a.md');
    expect(zh).toContain('<p class="custom-block-title">提示</p>');
    expect(zh).toContain('<button title="复制代码" class="copy">');
  });
});

describe('openlinkosTokenize', () => {
  it('splits Chinese into words and English on punctuation', () => {
    const words = openlinkosTokenize('本地优先的个人记忆 origin.openlinkos.com, CLI_reference');
    expect(words).toContain('记忆');
    expect(words).not.toContain('本地优先的个人记忆');
    expect(words).toEqual(
      expect.arrayContaining(['origin', 'openlinkos', 'com', 'CLI', 'reference']),
    );
    expect(words).not.toContain('');
  });

  it('survives serialization, as VitePress revives it in the browser', () => {
    const revived = new Function(`return ${openlinkosTokenize.toString()}`)() as (
      t: string,
    ) => string[];
    expect(revived('跨 Agent 的记忆')).toEqual(openlinkosTokenize('跨 Agent 的记忆'));
  });

  it('falls back to the default splitter without Intl.Segmenter', () => {
    const fallback = new Function('Intl', `return ${openlinkosTokenize.toString()}`)({}) as (
      t: string,
    ) => string[];
    expect(fallback('hello, world')).toEqual(['hello', 'world']);
  });
});
