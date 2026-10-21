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

const read = (path: string): string => readFileSync(join(dist, path), 'utf8');

/** A copy of the playground sources (no node_modules or build output) under playground/.tmp/. */
const copyPlayground = (name: string): string => {
  const root = join(tmp, name);
  rmSync(root, { recursive: true, force: true });
  mkdirSync(root, { recursive: true });
  for (const entry of ['index.md', 'guide.md', 'zh', '.vitepress/config.ts', '.vitepress/theme']) {
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

  it('bundles the brand colours into the stylesheet', () => {
    const css = readdirSync(join(dist, 'assets')).find((f) => f.endsWith('.css'));
    const style = readFileSync(join(dist, 'assets', css ?? ''), 'utf8');
    expect(style).toMatch(/--vp-c-brand-1:\s*#1d4ed8/);
    expect(style).toMatch(/\.dark\{[^}]*--vp-c-brand-1:\s*#6b9bff/);
    expect(style).toContain('html[lang^=zh]');
  });
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
    mkdirSync(join(root, 'public'));
    writeFileSync(join(root, 'public', 'favicon.ico'), '');
    const result = buildSite(root);
    expect(result.status).toBe(1);
    expect(result.output).toContain('the theme provides favicon.ico');
  }, 120_000);
});
