// The bilingual coverage check. English is the source of truth; every page has a Chinese
// counterpart under zh/ that records which English version it translates (sourceHash), has the
// same headings and code blocks, and links only within its own locale.

import { createHash } from 'node:crypto';
import { existsSync, readFileSync } from 'node:fs';
import { join, posix } from 'node:path';

export interface Problem {
  /** Source file relative to the source directory, or a config location. */
  file: string;
  line?: number;
  message: string;
}

/** The subset of VitePress's SiteConfig the check reads. */
export interface CheckSite {
  srcDir: string;
  outDir: string;
  pages: string[];
  rewrites?: { map: Record<string, string | undefined> };
  site?: { locales?: Record<string, { themeConfig?: unknown } | undefined> };
}

const isZh = (page: string): boolean => page.startsWith('zh/');
const isNotFound = (page: string): boolean => page === '404.md' || page === 'zh/404.md';

/**
 * `sha256-` and the first 8 hex digits of the SHA-256 of a file's text, with CRLF line endings
 * normalized to LF so that the hash does not depend on the checkout.
 */
export const sourceHash = (content: string | Buffer): string =>
  `sha256-${createHash('sha256')
    .update(String(content).replace(/\r\n/g, '\n'), 'utf8')
    .digest('hex')
    .slice(0, 8)}`;

const FRONTMATTER = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

/** The `sourceHash` value from a page's frontmatter, if any. */
export const readSourceHash = (source: string): string | null => {
  const fm = FRONTMATTER.exec(source)?.[1];
  const match = fm ? /^sourceHash:[ \t]*(['"]?)([^'"\s]+)\1[ \t]*$/m.exec(fm) : null;
  return match ? match[2] : null;
};

/** a. Every page has a counterpart in the other locale. */
export const checkPairs = (pages: readonly string[]): Problem[] => {
  const set = new Set(pages);
  const problems: Problem[] = [];
  for (const page of pages) {
    if (isNotFound(page)) continue;
    if (isZh(page)) {
      const en = page.slice(3);
      if (!set.has(en)) {
        problems.push({
          file: page,
          message: `has no English source ${en}; English is the source of truth, so add ${en} or remove this page`,
        });
      }
    } else if (!set.has(`zh/${page}`)) {
      problems.push({ file: page, message: `has no Chinese translation; add zh/${page}` });
    }
  }
  return problems;
};

/** b. A Chinese page's sourceHash matches its English source. */
export const checkStaleness = (zhPage: string, zhSource: string, enSource: string): Problem[] => {
  const expected = sourceHash(enSource);
  const found = readSourceHash(zhSource);
  if (found === expected) return [];
  const en = zhPage.slice(3);
  const line = `sourceHash: ${expected}`;
  if (found === null) {
    const hint = FRONTMATTER.test(zhSource)
      ? `add this line to its frontmatter:\n      ${line}`
      : `start the file with:\n      ---\n      ${line}\n      ---`;
    return [
      {
        file: zhPage,
        message: `has no sourceHash for ${en}; once the translation matches ${en}, ${hint}`,
      },
    ];
  }
  return [
    {
      file: zhPage,
      message:
        `is out of date: its sourceHash is ${found}, but ${en} is now ${expected}. ` +
        `Update the translation to match ${en}, then set:\n      ${line}`,
    },
  ];
};

/** The ordered h2/h3 ids of a built page. */
export const headingIds = (html: string): string[] =>
  [...html.matchAll(/<h([23])\b[^>]*?\sid="([^"]*)"/g)].map((m) => `h${m[1]}#${m[2]}`);

/** The number of highlighted code blocks of a built page. */
export const codeBlockCount = (html: string): number =>
  html.match(/<div class="language-/g)?.length ?? 0;

/** c. A pair has the same headings (by id, in order) and the same number of code blocks. */
export const checkStructure = (zhPage: string, enHtml: string, zhHtml: string): Problem[] => {
  const problems: Problem[] = [];
  const en = zhPage.slice(3);
  const enIds = headingIds(enHtml);
  const zhIds = headingIds(zhHtml);
  const length = Math.max(enIds.length, zhIds.length);
  for (let i = 0; i < length; i++) {
    if (enIds[i] === zhIds[i]) continue;
    problems.push({
      file: zhPage,
      message:
        `headings differ from ${en} at heading ${i + 1}: expected ${enIds[i] ?? '(none)'}, ` +
        `found ${zhIds[i] ?? '(none)'}. Translate every h2 and h3 in order and give each an ` +
        'explicit anchor equal to the English id, such as "## 安装 {#install}"',
    });
    break;
  }
  const enBlocks = codeBlockCount(enHtml);
  const zhBlocks = codeBlockCount(zhHtml);
  if (enBlocks !== zhBlocks) {
    problems.push({
      file: zhPage,
      message: `has ${zhBlocks} code blocks, but ${en} has ${enBlocks}; keep the same code blocks in both`,
    });
  }
  return problems;
};

const EXTERNAL = /^(?:[a-z][a-z0-9+.-]*:|\/\/)/i;

/**
 * Where a link points inside the site, as an absolute path, or null when it is external, a
 * same-page anchor, or a file that is not a page (an image, a download).
 */
export const linkTarget = (fromPage: string, href: string): string | null => {
  const target = href.trim().replace(/^<|>$/g, '');
  if (!target || EXTERNAL.test(target)) return null;
  const path = target.replace(/[?#].*$/, '');
  if (!path) return null;
  const ext = posix.extname(path);
  if (ext && ext !== '.md' && ext !== '.html') return null;
  if (path.startsWith('/')) return posix.normalize(path);
  return posix.normalize(posix.join(posix.dirname(`/${fromPage}`), path));
};

/** Problems with one link from a page (or config) of the given locale. */
const checkLink = (
  locale: 'en' | 'zh',
  fromPage: string,
  href: string,
  where: Omit<Problem, 'message'>,
): Problem | null => {
  const path = linkTarget(fromPage, href);
  if (path === null) return null;
  const inZh = /^\/zh(\/|$)/.test(path);
  if (locale === 'zh' && !inZh) {
    return {
      ...where,
      message: `links to "${href}" (${path}), outside the Chinese site; link to the page under /zh/ instead`,
    };
  }
  if (locale === 'en' && inZh) {
    return {
      ...where,
      message: `links to "${href}" (${path}), inside the Chinese site; English pages link only to English pages`,
    };
  }
  return null;
};

const FENCE = /^ {0,3}(`{3,}|~{3,})/;
const FRONTMATTER_FENCE = /^---[ \t]*$/;

/** Link targets in a markdown source with their 1-based line numbers, outside code. */
export const extractLinks = (source: string): Array<{ line: number; href: string }> => {
  const lines = source.split(/\r?\n/);
  const links: Array<{ line: number; href: string }> = [];
  let start = 0;
  // Frontmatter: `link:` values (hero actions, features).
  if (FRONTMATTER_FENCE.test(lines[0] ?? '')) {
    const end = lines.findIndex((l, n) => n > 0 && FRONTMATTER_FENCE.test(l));
    if (end > 0) {
      for (let n = 1; n < end; n++) {
        const m = /^\s*(?:-\s+)?link:\s*(['"]?)(.+?)\1\s*$/.exec(lines[n]);
        if (m) links.push({ line: n + 1, href: m[2] });
      }
      start = end + 1;
    }
  }
  let fence: string | null = null;
  for (let i = start; i < lines.length; i++) {
    const text = lines[i];
    const marker = FENCE.exec(text)?.[1];
    if (fence) {
      const closes =
        marker !== undefined &&
        marker[0] === fence[0] &&
        marker.length >= fence.length &&
        text.trim() === marker;
      if (closes) fence = null;
      continue;
    }
    if (marker) {
      fence = marker;
      continue;
    }
    const code = text.replace(/(`+)[\s\S]*?\1/g, '');
    const line = i + 1;
    for (const m of code.matchAll(/\]\(\s*(<[^>]*>|[^\s)]+)/g)) links.push({ line, href: m[1] });
    for (const m of code.matchAll(/\bhref\s*=\s*(["'])(.*?)\1/g)) links.push({ line, href: m[2] });
    const def = /^ {0,3}\[[^\]]+\]:\s*(<[^>]*>|\S+)/.exec(code);
    if (def) links.push({ line, href: def[1] });
  }
  return links;
};

/** d. Links in a page stay within its locale. */
export const checkLinks = (page: string, source: string): Problem[] => {
  const locale = isZh(page) ? 'zh' : 'en';
  return extractLinks(source)
    .map(({ line, href }) => checkLink(locale, page, href, { file: page, line }))
    .filter((p): p is Problem => p !== null);
};

/** d. Links in a locale's nav and sidebar stay within that locale. */
export const checkConfigLinks = (locale: 'en' | 'zh', themeConfig: unknown): Problem[] => {
  const key = locale === 'zh' ? 'zh' : 'root';
  const home = locale === 'zh' ? 'zh/index.md' : 'index.md';
  const problems: Problem[] = [];
  const walk = (value: unknown, where: string, base: string): void => {
    if (Array.isArray(value)) {
      for (const item of value) walk(item, where, base);
      return;
    }
    if (!value || typeof value !== 'object') return;
    const item = value as Record<string, unknown>;
    const itemBase = typeof item.base === 'string' ? item.base : base;
    if (typeof item.link === 'string' && (item.link.startsWith('/') || itemBase)) {
      const href = item.link.startsWith('/') ? item.link : `${itemBase}${item.link}`;
      const problem = checkLink(locale, home, href, {
        file: `config locales.${key}.themeConfig.${where}`,
      });
      if (problem) problems.push(problem);
    }
    for (const [k, v] of Object.entries(item)) {
      if (k !== 'link' && v && typeof v === 'object') walk(v, where, itemBase);
    }
  };
  const config = (themeConfig ?? {}) as { nav?: unknown; sidebar?: unknown };
  walk(config.nav, 'nav', '');
  walk(config.sidebar, 'sidebar', '');
  return problems;
};

/**
 * Runs every check against a site. `built` adds the structure check, which reads the HTML in
 * outDir and therefore only runs after a build.
 */
export const checkSite = (site: CheckSite, opts: { built: boolean }): Problem[] => {
  const pages = site.pages.filter((p) => !isNotFound(p));
  const set = new Set(pages);
  const read = (page: string): string => readFileSync(join(site.srcDir, page), 'utf8');
  const html = (page: string): string | null => {
    const file = join(site.outDir, (site.rewrites?.map[page] ?? page).replace(/\.md$/, '.html'));
    return existsSync(file) ? readFileSync(file, 'utf8') : null;
  };
  const problems: Problem[] = checkPairs(pages);
  for (const page of pages) {
    const source = read(page);
    problems.push(...checkLinks(page, source));
    if (!isZh(page) || !set.has(page.slice(3))) continue;
    problems.push(...checkStaleness(page, source, read(page.slice(3))));
    if (opts.built) {
      const enHtml = html(page.slice(3));
      const zhHtml = html(page);
      if (enHtml !== null && zhHtml !== null) {
        problems.push(...checkStructure(page, enHtml, zhHtml));
      }
    }
  }
  const locales = site.site?.locales ?? {};
  problems.push(...checkConfigLinks('en', locales.root?.themeConfig));
  problems.push(...checkConfigLinks('zh', locales.zh?.themeConfig));
  return problems;
};

export const formatProblem = (p: Problem): string =>
  `${p.file}${p.line ? `:${p.line}` : ''}: ${p.message}`;

export const formatProblems = (problems: readonly Problem[]): string =>
  `Bilingual coverage check failed with ${problems.length} problem${problems.length === 1 ? '' : 's'}:\n` +
  problems.map((p) => `  - ${formatProblem(p)}`).join('\n') +
  '\n\nEvery page needs a Chinese counterpart under zh/ with the same headings ({#id} anchors), ' +
  'the same code blocks, links within its own locale, and the sourceHash of its English page.';
