// The layer for agents: `llms.txt` and `llms-full.txt` per locale, built from the site's pages and
// its sidebars, and every page served as its Markdown source. English is the source of truth, so
// `/llms.txt` and `/llms-full.txt` list the English pages and `/zh/llms.txt` and
// `/zh/llms-full.txt` the Chinese ones; each index points to the other, and every page's Markdown
// sits next to the page itself, so appending `.md` to any address works in either locale.

import { existsSync, readFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import type { Lang } from '../shared/lang.js';
import { localeOfPage, pagePath } from './head.js';

/** The subset of VitePress's SiteConfig the layer reads. */
export interface LlmsSite {
  srcDir: string;
  pages: string[];
  rewrites?: { map: Record<string, string | undefined> };
  site: {
    title?: string;
    description?: string;
    locales?: Record<string, LlmsLocale | undefined>;
  };
}

/** The subset of a VitePress locale config the layer reads. */
export interface LlmsLocale {
  description?: string;
  themeConfig?: { sidebar?: unknown };
}

/** The four index files the layer writes, at the root (English) and under /zh/ (Chinese). */
export const LLMS_FILES = ['llms.txt', 'llms-full.txt', 'zh/llms.txt', 'zh/llms-full.txt'] as const;

type SidebarItem = { text?: string; link?: string; collapsed?: boolean; items?: SidebarItem[] };
type Sidebar = SidebarItem[] | Record<string, SidebarItem[]>;

const PAGES: Record<Lang, string> = { en: 'Pages', zh: '页面' };
const DOCS: Record<Lang, string> = { en: 'Docs', zh: '文档' };
const FULL: Record<Lang, string> = { en: 'Full contents', zh: '完整内容' };
const FULL_LINK: Record<Lang, string> = {
  en: 'Every page in one file',
  zh: '全部页面合在一个文件里',
};

const isNotFound = (page: string): boolean => page === '404.md' || page === 'zh/404.md';

/** The output path of a page's Markdown file: the page's own path, rewrites applied. */
export const markdownFile = (site: LlmsSite, page: string): string =>
  site.rewrites?.map[page] ?? page;

/** The address a page's Markdown is served at, next to the page itself. */
export const markdownUrl = (site: LlmsSite, page: string): string => {
  const path = pagePath(markdownFile(site, page));
  // A directory's page is served as the index.md inside it, as the page actions fetch it.
  return path.endsWith('/') ? `${path}index.md` : `${path}.md`;
};

const FRONTMATTER = /^---[ \t]*\r?\n([\s\S]*?)\r?\n---[ \t]*(?:\r?\n|$)/;

/** The simple `key: value` frontmatter fields of a page's source (arrays and objects are skipped). */
export const frontmatter = (source: string): Record<string, string> => {
  const fm = FRONTMATTER.exec(source)?.[1];
  const fields: Record<string, string> = {};
  if (!fm) return fields;
  for (const line of fm.split(/\r?\n/)) {
    const match = /^([A-Za-z][\w-]*):[ \t]*(.*)$/.exec(line);
    if (match && !/[[{]/.test(match[2])) fields[match[1]] = match[2].replace(/^['"]|['"]$/g, '');
  }
  return fields;
};

const firstHeading = (source: string): string | null => {
  const lines = source.split(/\r?\n/);
  let fence = false;
  for (const line of lines) {
    if (/^ {0,3}`{3,}/.test(line)) fence = !fence;
    if (fence) continue;
    const match = /^ {0,3}#{1,6}[ \t]+(.+?)[ \t]*#*[ \t]*$/.exec(line);
    if (match) return match[1].replace(/\s*\{#[^}]*\}\s*$/, '');
  }
  return null;
};

const firstParagraph = (source: string): string => {
  const body = source.replace(FRONTMATTER, '');
  const lines = body.split(/\r?\n/);
  let fence = false;
  const paragraph: string[] = [];
  for (const line of lines) {
    if (/^ {0,3}(`{3,}|~{3,})/.test(line)) {
      fence = !fence;
      continue;
    }
    if (fence) continue;
    if (!line.trim()) {
      if (paragraph.length) break;
      continue;
    }
    if (/^ {0,3}(?:#{1,6}|>|-|\*|\||:)/.test(line)) continue;
    paragraph.push(line.trim());
  }
  return paragraph
    .join(' ')
    .replace(/\[([^\]]*)\]\([^)]*\)/g, '$1')
    .replace(/[*_`]/g, '')
    .trim();
};

export interface PageEntry {
  page: string;
  title: string;
  description: string;
  home: boolean;
}

/** A page's title and description: frontmatter first, then the first heading and paragraph. */
export const pageEntry = (page: string, source: string, sidebarTitle?: string): PageEntry => {
  const fm = frontmatter(source);
  return {
    page,
    title: sidebarTitle || fm.title || firstHeading(source) || posix.basename(page, '.md'),
    description: fm.description || firstParagraph(source),
    home: fm.layout === 'home',
  };
};

/**
 * The pages a sidebar link may point at, as paths relative to the source directory, likelier
 * first: `/guide` is guide.md or else guide/index.md, and `/guide/` the other way round.
 */
const pagesOfLink = (link: string, locale: Lang): string[] => {
  if (!link) return [];
  const path = link.replace(/^\//, '').replace(/\.md$/, '');
  const bare = path.replace(/\/+$/, '');
  let base = bare;
  if (locale === 'zh') {
    if (link.startsWith('/') && !/^zh(\/|$)/.test(bare)) return [];
    const relative = bare.replace(/^zh(\/|$)/, '');
    base = relative === '' ? '' : `zh/${relative}`;
    if (base === '') return ['zh/index.md'];
  }
  if (base === '') return ['index.md'];
  const file = `${base}.md`;
  const index = `${base}/index.md`;
  return path.endsWith('/') ? [index, file] : [file, index];
};

const readSource = (site: LlmsSite, page: string): string | null => {
  const file = join(site.srcDir, page);
  return existsSync(file) ? readFileSync(file, 'utf8') : null;
};

/**
 * The pages of one locale, in the order and grouping of its sidebar, the pages the sidebar misses
 * appended alphabetically. Home-layout pages are left out: they are not reading material, though
 * their Markdown is still served next to them.
 */
export const collectPages = (site: LlmsSite, locale: Lang): Array<[string, PageEntry[]]> => {
  const pages = site.pages.filter((p) => !isNotFound(p) && localeOfPage(p) === locale);
  const sources = new Map<string, string>();
  for (const page of pages) {
    const source = readSource(site, page);
    if (source !== null) sources.set(page, source);
  }
  const entry = (page: string, title?: string): PageEntry | null =>
    sources.has(page) ? pageEntry(page, sources.get(page) as string, title) : null;
  const present = (e: PageEntry | null): e is PageEntry => e !== null;
  const listed = new Map<string, PageEntry>();
  const sections: Array<[string, PageEntry[]]> = [];
  const themeConfig = sidebarConfig(site, locale);
  const walkItems = (items: SidebarItem[], section: Map<string, string>): void => {
    for (const item of items) {
      if (item.items) {
        walkItems(item.items, section);
        continue;
      }
      const page = item.link
        ? pagesOfLink(item.link, locale).find((p) => sources.has(p))
        : undefined;
      if (!page || listed.has(page)) continue;
      const e = entry(page, item.text);
      if (!e) continue;
      listed.set(page, e);
      section.set(page, item.text || e.title);
    }
  };
  if (themeConfig) {
    for (const [name, items] of themeConfig) {
      const section = new Map<string, string>();
      walkItems(items, section);
      const entries = [...section]
        .map(([page, title]) => listed.get(page) ?? entry(page, title))
        .filter(present);
      if (entries.length) sections.push([name, entries]);
    }
  }
  const rest = pages
    .filter((p) => !listed.has(p))
    .sort((a, b) => a.localeCompare(b))
    .map((p) => entry(p))
    .filter(present)
    .filter((e) => !e.home);
  const named = sections.map(
    ([name, entries]) => [name, entries.filter((e) => !e.home)] as [string, PageEntry[]],
  );
  const kept = named.filter(([, entries]) => entries.length);
  if (rest.length) kept.push([PAGES[locale], rest]);
  return kept;
};

/**
 * A sidebar's items as sections: one per top-level group, named by its text. A page outside any
 * group, such as a section's landing page, joins the group after it (the one before it, at the
 * end); a sidebar without groups is one section named `fallback`.
 */
const sectionsOf = (items: SidebarItem[], fallback: string): Array<[string, SidebarItem[]]> => {
  const sections: Array<[string, SidebarItem[]]> = [];
  let loose: SidebarItem[] = [];
  for (const item of items) {
    if (!item.items?.length) {
      loose.push(item);
      continue;
    }
    sections.push([item.text || fallback, [...loose, ...item.items]]);
    loose = [];
  }
  if (loose.length) {
    const last = sections.at(-1);
    if (last) last[1].push(...loose);
    else sections.push([fallback, loose]);
  }
  return sections;
};

/** The locale's sidebar as sections, whether it is one sidebar or several keyed by directory. */
const sidebarConfig = (site: LlmsSite, locale: Lang): Array<[string, SidebarItem[]]> | null => {
  const config = site.site.locales?.[locale === 'zh' ? 'zh' : 'root'];
  const sidebar = config?.themeConfig?.sidebar as Sidebar | undefined;
  if (!sidebar) return null;
  if (Array.isArray(sidebar)) return sectionsOf(sidebar, DOCS[locale]);
  return Object.entries(sidebar as Record<string, SidebarItem[]>).flatMap(([key, items]) =>
    sectionsOf(items, key === '/' ? DOCS[locale] : key.replace(/^\//, '')),
  );
};

const OTHER_LANGUAGE_ENTRY: Record<Lang, [string, string]> = {
  en: ['简体中文 (Simplified Chinese)', '/zh/llms.txt'],
  zh: ['English', '/llms.txt'],
};

const linkText = (text: string): string => text.replaceAll('[', '(').replaceAll(']', ')');

const line = (site: LlmsSite, hostname: string, e: PageEntry): string => {
  const url = `${hostname}${markdownUrl(site, e.page)}`;
  return e.description
    ? `- [${linkText(e.title)}](${url}): ${e.description}`
    : `- [${linkText(e.title)}](${url})`;
};

/** `llms.txt`: the site's pages as an index for agents, one locale per file. */
export const llmsTxt = (site: LlmsSite, o: { hostname: string; locale: Lang }): string => {
  const { hostname, locale } = o;
  const description =
    site.site.locales?.[locale === 'zh' ? 'zh' : 'root']?.description ?? site.site.description;
  const out: string[] = [`# ${site.site.title ?? 'Docs'}`];
  if (description) out.push('', `> ${description}`);
  out.push(
    '',
    `> ${OTHER_LANGUAGE_ENTRY[locale][0]}: ${hostname}${OTHER_LANGUAGE_ENTRY[locale][1]}`,
  );
  for (const [name, entries] of collectPages(site, locale)) {
    out.push('', `## ${name}`);
    for (const e of entries) out.push(line(site, hostname, e));
  }
  out.push(
    '',
    `## ${FULL[locale]}`,
    `- [${FULL_LINK[locale]}](${hostname}/${locale === 'zh' ? 'zh/' : ''}llms-full.txt)`,
  );
  return `${out.join('\n')}\n`;
};

/** `llms-full.txt`: every page of one locale, as Markdown, in the order of `llms.txt`. */
export const llmsFullTxt = (site: LlmsSite, o: { hostname: string; locale: Lang }): string => {
  const { hostname, locale } = o;
  const description =
    site.site.locales?.[locale === 'zh' ? 'zh' : 'root']?.description ?? site.site.description;
  const out: string[] = [`# ${site.site.title ?? 'Docs'}`];
  if (description) out.push('', `> ${description}`);
  for (const [, entries] of collectPages(site, locale)) {
    for (const e of entries) {
      const source = readSource(site, e.page) ?? '';
      out.push(
        '',
        '---',
        '',
        `# ${e.title}`,
        '',
        `Source: ${hostname}${markdownUrl(site, e.page)}`,
        '',
        source.trimEnd(),
      );
    }
  }
  return `${out.join('\n')}\n`;
};

/** Every llms file the site gets, keyed by its path in the output. */
export const llmsFiles = (
  site: LlmsSite,
  o: { hostname: string },
): Map<string, { source: string; type: string }> => {
  const files = new Map<string, { source: string; type: string }>();
  for (const locale of ['en', 'zh'] as const) {
    const prefix = locale === 'zh' ? 'zh/' : '';
    files.set(`${prefix}llms.txt`, {
      source: llmsTxt(site, { ...o, locale }),
      type: 'text/plain; charset=utf-8',
    });
    files.set(`${prefix}llms-full.txt`, {
      source: llmsFullTxt(site, { ...o, locale }),
      type: 'text/plain; charset=utf-8',
    });
  }
  return files;
};
