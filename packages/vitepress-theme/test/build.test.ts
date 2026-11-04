// Integration: builds the package and the playground site with VitePress, then checks the output.

import { spawnSync } from 'node:child_process';
import {
  appendFileSync,
  cpSync,
  existsSync,
  mkdirSync,
  readdirSync,
  readFileSync,
  rmSync,
  writeFileSync,
} from 'node:fs';
import { join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import { sourceHash } from '../src/config/check.ts';

const pkg = fileURLToPath(new URL('..', import.meta.url));
const playground = join(pkg, '..', '..', 'playground');
const dist = join(playground, '.vitepress', 'dist');
const tmp = join(playground, '.tmp');
const vitepress = join(playground, 'node_modules', 'vitepress', 'bin', 'vitepress.js');

const run = (args: string[], cwd: string): { status: number | null; output: string } => {
  const result = spawnSync(process.execPath, args, {
    cwd,
    encoding: 'utf8',
    env: { ...process.env, NO_COLOR: '1', FORCE_COLOR: '0' },
  });
  return { status: result.status, output: `${result.stdout}\n${result.stderr}` };
};

/** Builds a VitePress site in `root`, run from the playground package like `pnpm docs:build`. */
const buildSite = (root: string) => run([vitepress, 'build', root], playground);

const read = (path: string, root = dist): string => readFileSync(join(root, path), 'utf8');

/** The built site's stylesheet. */
const stylesheet = (): string => {
  const css = readdirSync(join(dist, 'assets')).find((f) => f.endsWith('.css'));
  return readFileSync(join(dist, 'assets', css ?? ''), 'utf8');
};

/** The footers VitePress rendered into a page (the site data in the page is not one). */
const footers = (html: string): string[] =>
  [...html.matchAll(/<footer class="VPFooter[\s\S]*?<\/footer>/g)].map((m) => m[0]);

/** A copy of the playground sources (no node_modules or build output) under playground/.tmp/. */
const copyPlayground = (name: string): string => {
  const root = join(tmp, name);
  rmSync(root, { recursive: true, force: true });
  mkdirSync(root, { recursive: true });
  for (const entry of [
    'index.md',
    'guide.md',
    'components.md',
    'zh',
    'public',
    '.vitepress/config.ts',
    '.vitepress/theme',
  ]) {
    cpSync(join(playground, entry), join(root, entry), { recursive: true });
  }
  return root;
};

beforeAll(() => {
  const built = run([join(pkg, 'scripts', 'build.ts')], pkg);
  if (built.status !== 0) throw new Error(`package build failed:\n${built.output}`);
  const site = buildSite('.');
  if (site.status !== 0) throw new Error(`playground build failed:\n${site.output}`);
}, 300_000);

afterAll(() => {
  rmSync(tmp, { recursive: true, force: true });
});

describe('the package', () => {
  it('never imports vue', () => {
    const files = (dir: string): string[] =>
      readdirSync(dir, { withFileTypes: true }).flatMap((e) =>
        e.isDirectory()
          ? files(join(dir, e.name))
          : e.name.endsWith('.js')
            ? [join(dir, e.name)]
            : [],
      );
    const js = files(join(pkg, 'dist'));
    expect(js.length).toBeGreaterThan(5);
    for (const file of js) {
      const code = readFileSync(file, 'utf8');
      expect(code, file).not.toMatch(
        /\bfrom\s*['"]vue['"]|\bimport\s*\(\s*['"]vue['"]\s*\)|\bimport\s*['"]vue['"]|require\(\s*['"]vue['"]\s*\)/,
      );
    }
  });

  it('ships the brand data and the theme stylesheet', () => {
    for (const file of [
      'brand/brands.json',
      'brand/out/origin/web/favicon.svg',
      'brand/out/openlinkos/kit/lockup.svg',
      'theme/style.css',
      'theme/index.d.ts',
      'config/index.d.ts',
    ]) {
      expect(existsSync(join(pkg, 'dist', file)), file).toBe(true);
    }
  });
});

describe('the playground build', () => {
  it('emits the brand files, the brand kit and robots.txt', () => {
    for (const file of [
      'favicon.ico',
      'favicon.svg',
      'apple-touch-icon.png',
      'icon-192.png',
      'icon-512.png',
      'icon-maskable-512.png',
      'site.webmanifest',
      'og.png',
      'logo.svg',
      'logo-dark.svg',
      'brand/origin/kit/lockup.svg',
      'brand/linkos/github/avatar.png',
      'brand/openlinkos/web/favicon.ico',
    ]) {
      expect(existsSync(join(dist, file)), file).toBe(true);
    }
    expect(read('robots.txt')).toContain('Sitemap: https://playground.openlinkos.com/sitemap.xml');
    expect(read('logo.svg')).toBe(
      readFileSync(join(pkg, 'dist', 'brand', 'out', 'openlinkos', 'web', 'logo.svg'), 'utf8'),
    );
  });

  it('writes canonical, language alternates, Open Graph tags and the language script', () => {
    const html = read('index.html');
    expect(html).toContain('<link rel="canonical" href="https://playground.openlinkos.com/">');
    expect(html).toContain(
      '<link rel="alternate" hreflang="en-US" href="https://playground.openlinkos.com/">',
    );
    expect(html).toContain(
      '<link rel="alternate" hreflang="zh-CN" href="https://playground.openlinkos.com/zh/">',
    );
    expect(html).toContain(
      '<link rel="alternate" hreflang="x-default" href="https://playground.openlinkos.com/">',
    );
    expect(html).toContain(
      '<meta property="og:image" content="https://playground.openlinkos.com/og.png">',
    );
    expect(html).toContain('id="openlinkos-lang"');
    expect(html).toMatch(/<link rel="icon" href="\/favicon\.ico\?v=[0-9a-f]{8}" sizes="32x32">/);
    expect(html).toContain('<meta name="theme-color" media="(prefers-color-scheme: dark)"');

    const zh = read('zh/guide.html');
    expect(zh).toContain('<html lang="zh-CN"');
    expect(zh).toContain(
      '<link rel="canonical" href="https://playground.openlinkos.com/zh/guide">',
    );
    expect(zh).toContain('location.replace("/guide"+location.search+location.hash)');
  });

  it('localizes Chinese pages and serves the brand kit image by its URL', () => {
    const zh = read('zh/guide.html');
    expect(zh).toContain('<p class="custom-block-title">提示</p>');
    expect(zh).toContain('<p class="custom-block-title">说明</p>');
    expect(zh).toContain('<summary>详情</summary>');
    expect(zh).toContain('title="复制代码" class="copy"');
    expect(zh).toContain('<img src="/brand/openlinkos/kit/lockup.svg"');
    const en = read('guide.html');
    expect(en).toContain('<p class="custom-block-title">TIP</p>');
    expect(en).toContain('title="Copy Code" class="copy"');
  });

  it('lists x-default alternates in the sitemap', () => {
    const sitemap = read('sitemap.xml');
    expect(sitemap).toContain(
      '<xhtml:link rel="alternate" hreflang="x-default" href="https://playground.openlinkos.com/guide"/>',
    );
    expect(sitemap).toContain(
      '<xhtml:link rel="alternate" hreflang="x-default" href="https://playground.openlinkos.com/"/>',
    );
  });

  it('keeps the 404 page out of the index and without the language script', () => {
    const html = read('404.html');
    expect(html).toContain('<meta name="robots" content="noindex">');
    expect(html).not.toContain('openlinkos-lang');
    expect(html).not.toContain('rel="canonical"');
  });

  it('ships the Chinese 404 strings and search strings in the site data', () => {
    const html = read('index.html');
    expect(html).toContain('页面未找到');
    expect(html).toContain('返回首页');
    expect(html).toContain('没有找到相关结果');
    expect(html).toContain('_vp-fn_function openlinkosTokenize');
  });

  it('shows the footer once on every page, beside the sidebar on pages with one', () => {
    const [home] = footers(read('index.html'));
    expect(footers(read('index.html'))).toHaveLength(1);
    expect(home).toMatch(/^<footer class="VPFooter" /);
    // The guide has a sidebar: VitePress renders the footer there but hides it, and the theme's
    // stylesheet shows it again.
    expect(footers(read('guide.html'))).toHaveLength(1);
    expect(footers(read('zh/guide.html'))).toHaveLength(1);
    expect(footers(read('guide.html'))[0]).toMatch(/^<footer class="VPFooter has-sidebar" /);
    expect(stylesheet()).toContain('.Layout>footer.VPFooter.has-sidebar{display:block}');
    expect(stylesheet()).toContain(
      '.Layout>footer.VPFooter.has-sidebar{padding-left:calc(var(--vp-sidebar-width) + 32px)}',
    );
  });

  it('adds the site’s note and its legal links after the privacy notice', () => {
    const [en] = footers(read('guide.html'));
    const [zh] = footers(read('zh/guide.html'));
    expect(en).toContain(
      '<span class="olf-about">Open source by LinkOS</span>' +
        '<span class="olf-note">The playground is kept by the LinkOS team.</span>',
    );
    expect(zh).toContain('<span class="olf-note">演示站点由 LinkOS 团队维护。</span>');
    const sep = '<span class="olf-sep" aria-hidden="true"> · </span>';
    const license = 'https://github.com/openlinkos/design/blob/master/LICENSE';
    expect(en).toContain(
      `<span class="olf-copy">© ${new Date().getUTCFullYear()} LinkOS</span>` +
        `${sep}<a href="https://linkos.io/privacy">Privacy</a>` +
        `${sep}<a href="${license}">MIT License</a></p>`,
    );
    expect(zh).toContain(
      `${sep}<a href="https://linkos.io/zh/privacy">隐私说明</a>` +
        `${sep}<a href="${license}">MIT 许可证</a></p>`,
    );
  });

  it('bundles the brand colours into the stylesheet', () => {
    const style = stylesheet();
    expect(style).toMatch(/--vp-c-brand-1:\s*#1d4ed8/);
    expect(style).toMatch(/\.dark\{[^}]*--vp-c-brand-1:\s*#6b9bff/);
    expect(style).toContain('html[lang^=zh]');
  });

  it('writes the layer for agents: llms files per locale and every page as Markdown', () => {
    const llms = read('llms.txt');
    expect(llms).toContain('# Playground');
    expect(llms).toContain('> A test site for the OpenLinkOS VitePress theme.');
    expect(llms).toContain(
      '> 简体中文 (Simplified Chinese): https://playground.openlinkos.com/zh/llms.txt',
    );
    expect(llms).toContain('- [Guide](https://playground.openlinkos.com/guide.md):');
    expect(llms).toContain('- [Components](https://playground.openlinkos.com/components.md):');
    // The home-layout page is a designed page, not reading material; it is not listed.
    expect(llms).not.toContain('(/index.md)');

    const zh = read('zh/llms.txt');
    expect(zh).toContain('> English: https://playground.openlinkos.com/llms.txt');
    expect(zh).toContain('## 演示站点');
    expect(zh).toContain('- [组件](https://playground.openlinkos.com/zh/components.md):');
    expect(zh).toContain('- [指南](https://playground.openlinkos.com/zh/guide.md):');

    const full = read('llms-full.txt');
    expect(full).toContain('# Guide\n\nSource: https://playground.openlinkos.com/guide.md');
    expect(full).toContain('## Install');
    expect(read('zh/llms-full.txt')).toContain(
      '# 组件\n\nSource: https://playground.openlinkos.com/zh/components.md',
    );

    // Every page sits next to itself as Markdown, both locales, 404 excepted.
    for (const file of [
      'index.md',
      'guide.md',
      'components.md',
      'zh/index.md',
      'zh/guide.md',
      'zh/components.md',
    ]) {
      expect(existsSync(join(dist, file)), file).toBe(true);
    }
    expect(existsSync(join(dist, '404.md'))).toBe(false);
    expect(read('components.md')).toContain('# Components');
  });

  it('can turn the layer off', () => {
    const root = copyPlayground('no-llms');
    const config = join(root, '.vitepress/config.ts');
    writeFileSync(
      config,
      readFileSync(config, 'utf8').replace(
        "hostname: 'https://playground.openlinkos.com',",
        "hostname: 'https://playground.openlinkos.com',\n  llms: false,",
      ),
    );
    const result = buildSite(root);
    expect(result.status, result.output).toBe(0);
    const out = join(root, '.vitepress/dist');
    expect(existsSync(join(out, 'llms.txt'))).toBe(false);
    expect(existsSync(join(out, 'zh/llms-full.txt'))).toBe(false);
    // Off means off: no page Markdown either, and public/llms.txt is the site's own again.
    expect(existsSync(join(out, 'guide.md'))).toBe(false);
    writeFileSync(join(root, 'public', 'llms.txt'), 'mine');
    const again = buildSite(root);
    expect(again.status, again.output).toBe(0);
  }, 240_000);

  it('refuses public files the layer would write', () => {
    const root = copyPlayground('llms-clash');
    writeFileSync(join(root, 'public', 'llms.txt'), 'mine');
    const clash = buildSite(root);
    expect(clash.status).toBe(1);
    expect(clash.output).toContain('the theme provides llms.txt');
  }, 240_000);

  it('renders the landing components and puts the page actions on doc pages', () => {
    const html = read('components.html');
    for (const part of [
      'olc-hero-title',
      'olc-hero-command-code',
      'olc-steps',
      'olc-cast-poster',
      'olc-logos',
      'olc-band-title',
    ]) {
      expect(html, part).toContain(part);
    }
    // The page actions are plain DOM put in place by the browser (no server round trip), and the
    // design tokens and their guard ride along in the stylesheet.
    const chunks = join(dist, 'assets', 'chunks');
    const theme = readdirSync(chunks)
      .map((f) => readFileSync(join(chunks, f), 'utf8'))
      .find((code) => code.includes('ol-page-actions'));
    expect(theme).toContain('claude.ai/new?q=');
    expect(theme).toContain('chatgpt.com/?q=');
    expect(theme).toContain('复制本页');
    const style = stylesheet();
    expect(style).toContain('--ol-color-accent-solid');
    expect(style).toContain('.ol-page-action');
  });
});

describe('a family site', () => {
  it('links the family menu to its own pages by paths, which VitePress keeps in the tab', () => {
    // The playground as linkos.org: the menu's LinkOS Mirrors and All services are its own pages.
    const root = copyPlayground('linkos-org');
    const config = join(root, '.vitepress', 'config.ts');
    writeFileSync(
      config,
      readFileSync(config, 'utf8')
        .replace("brand: 'openlinkos'", "brand: 'linkos'")
        .replace("hostname: 'https://playground.openlinkos.com'", "hostname: 'https://linkos.org'"),
    );
    const result = buildSite(root);
    expect(result.status, result.output).toBe(0);
    const out = join(root, '.vitepress', 'dist');
    // The links of the nav bar's menus: the family menu and the language menu.
    const links = (html: string): string[] =>
      [...html.matchAll(/<div class="VPMenuLink"[^>]*>(<a [^>]*>)/g)].map((m) => m[1]);
    const en = links(read('guide.html', out));
    expect(en.filter((a) => a.includes('href="/mirrors"'))).toHaveLength(1);
    expect(en.filter((a) => a.includes('href="/"'))).toHaveLength(1);
    for (const a of en.filter((a) => /href="\/(mirrors)?"/.test(a))) {
      expect(a).not.toMatch(/target=|vp-external-link-icon/);
    }
    expect(en.some((a) => a.includes('https://linkos.org'))).toBe(false);
    // Links to other sites, such as LinkOS Status, stay external.
    expect(en.find((a) => a.includes('href="https://uptime.linkos.org/"'))).toContain(
      'target="_blank"',
    );
    const zh = links(read('zh/guide.html', out));
    expect(zh.filter((a) => a.includes('href="/zh/mirrors"'))).toHaveLength(1);
    expect(zh.filter((a) => a.includes('href="/zh/"'))).toHaveLength(1);
  }, 120_000);
});

describe('the bilingual coverage check', () => {
  it('fails the build for a missing Chinese page and a stale sourceHash', () => {
    const root = copyPlayground('broken');
    writeFileSync(join(root, 'extra.md'), '# Extra\n\nEnglish only.\n');
    appendFileSync(join(root, 'index.md'), '\nA new English paragraph.\n');
    const expected = sourceHash(readFileSync(join(root, 'index.md'), 'utf8'));

    const result = buildSite(root);
    expect(result.status).toBe(1);
    expect(result.output).toContain('Bilingual coverage check failed with 2 problems');
    expect(result.output).toContain('extra.md: has no Chinese translation; add zh/extra.md');
    expect(result.output).toContain('zh/index.md: is out of date');
    expect(result.output).toContain(`    sourceHash: ${expected}`);
  }, 120_000);

  it('refuses public files that the theme provides', () => {
    const root = copyPlayground('reserved');
    writeFileSync(join(root, 'public', 'favicon.ico'), '');
    const result = buildSite(root);
    expect(result.status).toBe(1);
    expect(result.output).toContain('the theme provides favicon.ico');
  }, 120_000);
});
