// The layer for agents, unit-tested against a small site in a temporary directory.

import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { afterAll, beforeAll, describe, expect, it } from 'vitest';
import {
  collectPages,
  llmsFullTxt,
  llmsTxt,
  markdownFile,
  markdownUrl,
} from '../src/config/llms.ts';

let srcDir: string;

const site = (extra: Record<string, unknown> = {}) =>
  ({
    srcDir,
    pages: [
      'index.md',
      'guide.md',
      'reference/api.md',
      'zh/index.md',
      'zh/guide.md',
      'zh/reference/api.md',
    ],
    rewrites: { map: { 'reference/api.md': 'reference/http.md' } },
    site: {
      title: 'Beacon',
      description: 'Monitoring for agents.',
      locales: {
        root: {
          description: 'Monitoring for agents.',
          themeConfig: {
            sidebar: [
              {
                text: 'Guide',
                items: [
                  { text: 'Home', link: '/' },
                  { text: 'Guide', link: '/guide/' },
                ],
              },
              { text: 'Reference', items: [{ text: 'HTTP API', link: '/reference/http' }] },
            ],
          },
        },
        zh: {
          description: '给 Agent 的监控。',
          themeConfig: {
            sidebar: [
              {
                text: '指南',
                items: [
                  { text: '首页', link: '/zh/' },
                  { text: '指南', link: '/zh/guide' },
                ],
              },
            ],
          },
        },
      },
    },
    ...extra,
  }) as Parameters<typeof llmsTxt>[0];

beforeAll(() => {
  srcDir = mkdtempSync(join(tmpdir(), 'ol-llms-'));
  const page = (path: string, body: string): void => {
    const dir = path.replace(/[/\\][^/\\]+$/, '');
    if (dir !== path) mkdirSync(join(srcDir, dir), { recursive: true });
    writeFileSync(join(srcDir, path), body);
  };
  page('index.md', '---\nlayout: home\nhero:\n  name: Beacon\n---\n');
  page('guide.md', '# The guide\n\nPut an agent on call in ten minutes.\n');
  page(
    'reference/api.md',
    '---\ntitle: HTTP API\ndescription: Every route, with scopes.\n---\n\n# Routes\n\nGET /api/v1/alerts.\n',
  );
  page('zh/index.md', '---\nlayout: home\n---\n');
  page('zh/guide.md', '# 指南\n\n十分钟让一个 Agent 值班。\n');
  page('zh/reference/api.md', '# 路由 {#routes}\n\nGET /api/v1/alerts。\n');
  page('integrations/index.md', '# Integrations\n\nThe tools around Beacon.\n');
  page('integrations/codex.md', '# Codex\n\nCodex signs in through the browser.\n');
});

afterAll(() => {
  rmSync(srcDir, { recursive: true, force: true });
});

describe('the page paths', () => {
  it('serves a page as its own address with .md, rewrites applied', () => {
    const s = site();
    expect(markdownFile(s, 'guide.md')).toBe('guide.md');
    expect(markdownFile(s, 'reference/api.md')).toBe('reference/http.md');
    expect(markdownUrl(s, 'guide.md')).toBe('/guide.md');
    expect(markdownUrl(s, 'index.md')).toBe('/index.md');
    expect(markdownUrl(s, 'reference/api.md')).toBe('/reference/http.md');
    expect(markdownUrl(s, 'zh/guide.md')).toBe('/zh/guide.md');
    // A directory's page is the index.md inside it, not "/integrations/.md".
    expect(markdownUrl(s, 'integrations/index.md')).toBe('/integrations/index.md');
    expect(markdownUrl(s, 'zh/integrations/index.md')).toBe('/zh/integrations/index.md');
  });
});

describe('llms.txt', () => {
  it('indexes a locale in the order and grouping of its sidebar, skipping home pages', () => {
    const text = llmsTxt(site(), { hostname: 'https://beacon.openlinkos.com', locale: 'en' });
    expect(text).toContain('# Beacon');
    expect(text).toContain('> Monitoring for agents.');
    expect(text).toContain(
      '> 简体中文 (Simplified Chinese): https://beacon.openlinkos.com/zh/llms.txt',
    );
    // The sidebar's Guide section: the Guide page by its sidebar title; the home page is skipped.
    expect(text).toContain('## Guide');
    expect(text).toContain('- [Guide](https://beacon.openlinkos.com/guide.md):');
    expect(text).not.toContain('(/index.md)');
    // A page the sidebar reaches by a rewritten path is listed at its own address.
    expect(text).toContain(
      '- [HTTP API](https://beacon.openlinkos.com/reference/http.md): Every route, with scopes.',
    );
    expect(text).toContain(
      '- [Every page in one file](https://beacon.openlinkos.com/llms-full.txt)',
    );
  });

  it('indexes the Chinese site from the Chinese sidebar, pointing back at English', () => {
    const text = llmsTxt(site(), { hostname: 'https://beacon.openlinkos.com', locale: 'zh' });
    expect(text).toContain('> 给 Agent 的监控。');
    expect(text).toContain('> English: https://beacon.openlinkos.com/llms.txt');
    expect(text).toContain('## 指南');
    expect(text).toContain('- [指南](https://beacon.openlinkos.com/zh/guide.md)');
    expect(text).toContain(
      '- [全部页面合在一个文件里](https://beacon.openlinkos.com/zh/llms-full.txt)',
    );
    expect(text).not.toContain('](https://beacon.openlinkos.com/guide.md)');
  });

  it('indexes sidebars keyed by directory one section per group, landing pages included', () => {
    const keyed = site({
      pages: ['index.md', 'guide.md', 'integrations/index.md', 'integrations/codex.md'],
    });
    (keyed.site.locales?.root as { themeConfig?: unknown }).themeConfig = {
      sidebar: {
        '/guide': [{ text: 'Getting started', items: [{ text: 'Guide', link: '/guide' }] }],
        '/integrations/': [
          { text: 'Overview', link: '/integrations/' },
          { text: 'Agent clients', items: [{ text: 'Codex', link: '/integrations/codex' }] },
        ],
      },
    };
    expect(collectPages(keyed, 'en')).toEqual([
      ['Getting started', [expect.objectContaining({ page: 'guide.md', title: 'Guide' })]],
      [
        'Agent clients',
        [
          expect.objectContaining({ page: 'integrations/index.md', title: 'Overview' }),
          expect.objectContaining({ page: 'integrations/codex.md', title: 'Codex' }),
        ],
      ],
    ]);
    const text = llmsTxt(keyed, { hostname: 'https://beacon.openlinkos.com', locale: 'en' });
    expect(text).toContain(
      '- [Overview](https://beacon.openlinkos.com/integrations/index.md): The tools around Beacon.',
    );
    expect(text).not.toContain('## Pages');
  });

  it('falls back to pages in file order when a locale has no sidebar', () => {
    const noSidebar = site();
    (noSidebar.site.locales?.root as { themeConfig?: unknown }).themeConfig = {};
    const sections = collectPages(noSidebar, 'en');
    expect(sections).toEqual([
      [
        'Pages',
        [
          expect.objectContaining({ page: 'guide.md', title: 'The guide' }),
          expect.objectContaining({ page: 'reference/api.md', title: 'HTTP API' }),
        ],
      ],
    ]);
  });
});

describe('llms-full.txt', () => {
  it('carries each page whole, with its address, skipping home pages', () => {
    const text = llmsFullTxt(site(), { hostname: 'https://beacon.openlinkos.com', locale: 'en' });
    // The heading carries the sidebar's title; the page's own text follows whole.
    expect(text).toContain(
      '# Guide\n\nSource: https://beacon.openlinkos.com/guide.md\n\n# The guide\n',
    );
    expect(text).toContain('# HTTP API\n\nSource: https://beacon.openlinkos.com/reference/http.md');
    expect(text).toContain('Put an agent on call in ten minutes.');
    expect(text).not.toContain('layout: home');
  });
});
