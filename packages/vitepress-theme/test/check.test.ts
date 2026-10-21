import { mkdirSync, mkdtempSync, rmSync, writeFileSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { dirname, join } from 'node:path';
import { afterEach, describe, expect, it } from 'vitest';
import {
  checkConfigLinks,
  checkLinks,
  checkPairs,
  checkSite,
  checkStaleness,
  checkStructure,
  extractLinks,
  formatProblems,
  readSourceHash,
  sourceHash,
} from '../src/config/check.ts';

describe('sourceHash', () => {
  it('is sha256- and the first 8 hex digits of the SHA-256', () => {
    // sha256("hello\n") = 5891b5b5…
    expect(sourceHash('hello\n')).toBe('sha256-5891b5b5');
  });

  it('normalizes CRLF to LF', () => {
    expect(sourceHash('hello\r\n')).toBe(sourceHash('hello\n'));
    expect(sourceHash(Buffer.from('a\r\nb\r\n'))).toBe(sourceHash('a\nb\n'));
  });

  it('hashes UTF-8 text', () => {
    expect(sourceHash('中文\n')).toMatch(/^sha256-[0-9a-f]{8}$/);
    expect(sourceHash('中文\n')).not.toBe(sourceHash('中文'));
  });
});

describe('readSourceHash', () => {
  it('reads the frontmatter field, quoted or not, with LF or CRLF', () => {
    expect(readSourceHash('---\nsourceHash: sha256-1a2b3c4d\n---\n# x')).toBe('sha256-1a2b3c4d');
    expect(readSourceHash("---\r\ntitle: x\r\nsourceHash: 'sha256-1a2b3c4d'\r\n---\r\n")).toBe(
      'sha256-1a2b3c4d',
    );
  });

  it('ignores the field outside the frontmatter', () => {
    expect(readSourceHash('# x\n\nsourceHash: sha256-1a2b3c4d\n')).toBeNull();
    expect(readSourceHash('---\ntitle: x\n---\nsourceHash: sha256-1a2b3c4d\n')).toBeNull();
  });
});

describe('checkPairs', () => {
  it('reports pages without a counterpart and skips 404', () => {
    const problems = checkPairs([
      'index.md',
      'zh/index.md',
      'guide/cli.md',
      'zh/only.md',
      '404.md',
    ]);
    expect(problems.map((p) => p.file)).toEqual(['guide/cli.md', 'zh/only.md']);
    expect(problems[0].message).toContain('add zh/guide/cli.md');
    expect(problems[1].message).toContain('has no English source only.md');
  });
});

describe('checkStaleness', () => {
  const en = '# Guide\r\n\r\nText.\r\n';
  const hash = sourceHash(en);

  it('passes when the hash matches', () => {
    expect(checkStaleness('zh/guide.md', `---\nsourceHash: ${hash}\n---\n# 指南\n`, en)).toEqual(
      [],
    );
  });

  it('prints the exact line to paste when the hash is stale', () => {
    const [problem] = checkStaleness('zh/guide.md', '---\nsourceHash: sha256-00000000\n---\n', en);
    expect(problem.file).toBe('zh/guide.md');
    expect(problem.message).toContain('sha256-00000000');
    expect(problem.message).toContain(`then set:\n      sourceHash: ${hash}`);
  });

  it('explains how to add a missing hash, with or without frontmatter', () => {
    const [withFm] = checkStaleness('zh/guide.md', '---\ntitle: 指南\n---\n', en);
    expect(withFm.message).toContain(
      `add this line to its frontmatter:\n      sourceHash: ${hash}`,
    );
    const [withoutFm] = checkStaleness('zh/guide.md', '# 指南\n', en);
    expect(withoutFm.message).toContain(`---\n      sourceHash: ${hash}\n      ---`);
  });
});

describe('checkStructure', () => {
  const page = (headings: string[], blocks: number): string =>
    headings
      .map((h) => `<${h.slice(0, 2)} id="${h.slice(3)}" tabindex="-1">x</${h.slice(0, 2)}>`)
      .join('') + '<div class="language-bash vp-adaptive-theme"><pre></pre></div>'.repeat(blocks);

  it('passes when ids and code blocks match', () => {
    const html = page(['h2#install', 'h3#the-config-file'], 2);
    expect(checkStructure('zh/guide.md', html, html)).toEqual([]);
  });

  it('ignores h1 and h4', () => {
    const en = `<h1 id="guide">Guide</h1>${page(['h2#install'], 0)}<h4 id="a">a</h4>`;
    const zh = `<h1 id="指南">指南</h1>${page(['h2#install'], 0)}`;
    expect(checkStructure('zh/guide.md', en, zh)).toEqual([]);
  });

  it('reports the first differing heading', () => {
    const [problem] = checkStructure(
      'zh/guide.md',
      page(['h2#install', 'h2#configure'], 0),
      page(['h2#install', 'h2#配置'], 0),
    );
    expect(problem.message).toContain('at heading 2: expected h2#configure, found h2#配置');
    expect(problem.message).toContain('{#install}');
  });

  it('reports missing and extra headings and different code block counts', () => {
    expect(
      checkStructure('zh/a.md', page(['h2#a', 'h2#b'], 1), page(['h2#a'], 1))[0].message,
    ).toContain('expected h2#b, found (none)');
    expect(
      checkStructure('zh/a.md', page(['h2#a'], 1), page(['h2#a', 'h3#c'], 1))[0].message,
    ).toContain('expected (none), found h3#c');
    expect(checkStructure('zh/a.md', page([], 2), page([], 1))[0].message).toContain(
      'has 1 code blocks, but a.md has 2',
    );
  });
});

describe('links', () => {
  it('extracts markdown, HTML, reference and frontmatter links outside code', () => {
    const source = [
      '---',
      'hero:',
      '  actions:',
      '    - link: /zh/guide',
      "      link: '/x'",
      '---',
      '[a](./a.md) and ![img](/logo.svg) and <a href="/b">b</a>',
      '`[not](./code.md)`',
      '```md',
      '[not](./fenced.md)',
      '```',
      '[ref]: /c',
    ].join('\n');
    expect(extractLinks(source)).toEqual([
      { line: 4, href: '/zh/guide' },
      { line: 5, href: '/x' },
      { line: 7, href: './a.md' },
      { line: 7, href: '/logo.svg' },
      { line: 7, href: '/b' },
      { line: 12, href: '/c' },
    ]);
  });

  it('keeps Chinese pages inside zh/', () => {
    const source = [
      '[ok](./hub.md) [ok](/zh/guide/cli) [ok](/zh/) [ok](#anchor)',
      '[ok](https://github.com/openlinkos) [ok](/logo.svg) [ok](mailto:a@b.c)',
      '[bad](../../guide/hub.md) [bad](/guide/cli) [bad](/)',
    ].join('\n');
    const problems = checkLinks('zh/guide/getting-started.md', source);
    expect(problems.map((p) => `${p.line}:${p.message.split(',')[0]}`)).toEqual([
      '3:links to "../../guide/hub.md" (/guide/hub.md)',
      '3:links to "/guide/cli" (/guide/cli)',
      '3:links to "/" (/)',
    ]);
  });

  it('keeps English pages out of zh/', () => {
    const problems = checkLinks('guide/cli.md', '[a](./hub.md) [b](/zh/guide/cli) [c](../zh/x.md)');
    expect(problems.map((p) => p.message.split(',')[0])).toEqual([
      'links to "/zh/guide/cli" (/zh/guide/cli)',
      'links to "../zh/x.md" (/zh/x.md)',
    ]);
  });

  it('checks nav and sidebar links per locale', () => {
    const zh = {
      nav: [
        { text: '指南', link: '/zh/guide' },
        { text: 'Bad', link: '/guide' },
        {
          text: 'OpenLinkOS',
          items: [{ text: 'x', items: [{ text: 'y', link: 'https://x.y/' }] }],
        },
      ],
      sidebar: {
        '/zh/': { base: '/zh/guide/', items: [{ text: 'a', link: 'a' }] },
        '/x/': [{ text: 'b', link: '/b' }],
      },
    };
    expect(checkConfigLinks('zh', zh).map((p) => `${p.file}: ${p.message.split(',')[0]}`)).toEqual([
      'config locales.zh.themeConfig.nav: links to "/guide" (/guide)',
      'config locales.zh.themeConfig.sidebar: links to "/b" (/b)',
    ]);
    expect(checkConfigLinks('en', { nav: [{ text: 'x', link: '/zh/' }] })).toHaveLength(1);
  });
});

describe('checkSite', () => {
  let dir: string | undefined;
  afterEach(() => {
    if (dir) rmSync(dir, { recursive: true, force: true });
  });

  const site = (files: Record<string, string>): string => {
    dir = mkdtempSync(join(tmpdir(), 'openlinkos-check-'));
    for (const [path, content] of Object.entries(files)) {
      mkdirSync(dirname(join(dir, path)), { recursive: true });
      writeFileSync(join(dir, path), content);
    }
    return dir;
  };

  it('runs every check and reads built HTML only after a build', () => {
    const en = '# A\n\n## One\n';
    const root = site({
      'src/a.md': en,
      'src/zh/a.md': `---\nsourceHash: ${sourceHash(en)}\n---\n# 甲\n\n## 一\n`,
      'src/b.md': '# B\n',
      'out/a.html': '<h2 id="one">One</h2>',
      'out/zh/a.html': '<h2 id="一">一</h2>',
    });
    const config = {
      srcDir: join(root, 'src'),
      outDir: join(root, 'out'),
      pages: ['a.md', 'zh/a.md', 'b.md'],
    };
    expect(checkSite(config, { built: false }).map((p) => p.file)).toEqual(['b.md']);
    const problems = checkSite(config, { built: true });
    expect(problems.map((p) => p.file)).toEqual(['b.md', 'zh/a.md']);
    expect(formatProblems(problems)).toMatch(/^Bilingual coverage check failed with 2 problems:/);
  });
});
