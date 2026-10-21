// The Vite plugin: serves and emits the brand files, provides the theme's virtual modules, and
// reports bilingual coverage problems while the dev server runs.

import { existsSync, readFileSync } from 'node:fs';
import { join, posix } from 'node:path';
import { fileURLToPath } from 'node:url';
import type { Plugin, SiteConfig } from 'vitepress';
import {
  ASSET_GROUPS,
  assetPath,
  type Brand,
  groupFiles,
  loadBrands,
  WEB_FILES,
} from './brands.js';
import { checkSite, formatProblem, type Problem } from './check.js';

/** The package name, for `ssr.noExternal` and `optimizeDeps.exclude`. */
export const PACKAGE_NAME = '@openlinkos/vitepress-theme';

/** The package's root directory (two levels above this file), with forward slashes like Vite's. */
export const PACKAGE_DIR = fileURLToPath(new URL('../../', import.meta.url))
  .replaceAll('\\', '/')
  .replace(/\/$/, '');

export const BRAND_CSS_ID = 'virtual:openlinkos/brand.css';
export const CLIENT_ID = 'virtual:openlinkos/client';
const RESOLVED_BRAND_CSS = `\0${BRAND_CSS_ID}`;
const RESOLVED_CLIENT = `\0${CLIENT_ID}`;
const ASSET_PREFIX = '\0openlinkos-asset:';

type HookFn<H> = Extract<NonNullable<H>, (...args: never[]) => unknown>;
type ResolvedViteConfig = Parameters<HookFn<Plugin['configResolved']>>[0];
type DevServer = Parameters<HookFn<Plugin['configureServer']>>[0];

export interface PluginOptions {
  brand: Brand;
  hostname: string;
  brandKit: boolean;
  cookieDomain: string | null;
}

export interface SiteFile {
  source: Buffer | string;
  type: string;
}

const TYPES: Record<string, string> = {
  '.ico': 'image/x-icon',
  '.svg': 'image/svg+xml',
  '.png': 'image/png',
  '.webmanifest': 'application/manifest+json',
  '.txt': 'text/plain; charset=utf-8',
};

export const robotsTxt = (hostname: string): string =>
  `User-agent: *\nAllow: /\n\nSitemap: ${hostname}/sitemap.xml\n`;

/**
 * Every file the theme adds to a site, keyed by its path in the output: the brand's web files and
 * robots.txt at the root, and with `brandKit` every brand's web, GitHub and kit files under
 * brand/<id>/.
 */
export const siteFiles = (o: PluginOptions): Map<string, SiteFile> => {
  const files = new Map<string, SiteFile>();
  const add = (path: string, source: Buffer | string): void => {
    files.set(path, { source, type: TYPES[posix.extname(path)] ?? 'application/octet-stream' });
  };
  for (const file of WEB_FILES) add(file, readFileSync(assetPath(o.brand.id, `web/${file}`)));
  add('robots.txt', robotsTxt(o.hostname));
  if (o.brandKit) {
    for (const b of loadBrands()) {
      for (const group of ASSET_GROUPS) {
        for (const file of groupFiles(b.id, group)) {
          add(`brand/${b.id}/${group}/${file}`, readFileSync(assetPath(b.id, `${group}/${file}`)));
        }
      }
    }
  }
  return files;
};

/** The brand's colours as default-theme variables. */
export const brandCss = (b: Brand): string => {
  const { brand, soft } = b.colors;
  return (
    ':root {\n' +
    `  --vp-c-brand-1: ${brand.light[0]};\n` +
    `  --vp-c-brand-2: ${brand.light[1]};\n` +
    `  --vp-c-brand-3: ${brand.light[2]};\n` +
    `  --vp-c-brand-soft: ${soft.light};\n` +
    '  --vp-home-hero-name-color: var(--vp-c-brand-1);\n' +
    '}\n' +
    '.dark {\n' +
    `  --vp-c-brand-1: ${brand.dark[0]};\n` +
    `  --vp-c-brand-2: ${brand.dark[1]};\n` +
    `  --vp-c-brand-3: ${brand.dark[2]};\n` +
    `  --vp-c-brand-soft: ${soft.dark};\n` +
    '}\n'
  );
};

const PREFIX = '[@openlinkos/vitepress-theme]';

export const openlinkosPlugin = (o: PluginOptions): Plugin => {
  let files: Map<string, SiteFile> | undefined;
  const getFiles = (): Map<string, SiteFile> => {
    files ??= siteFiles(o);
    return files;
  };
  let site: SiteConfig | undefined;
  let ssr = false;

  const devCheck = (server: DevServer): void => {
    let last = '';
    let timer: ReturnType<typeof setTimeout> | undefined;
    const run = (): void => {
      if (!site) return;
      let problems: Problem[];
      try {
        problems = checkSite(site, { built: false });
      } catch (error) {
        problems = [{ file: '(check)', message: String(error) }];
      }
      const report = problems.map(formatProblem).join('\n');
      if (report === last) return;
      const logger = server.config.logger;
      if (problems.length) {
        logger.warn(
          `${PREFIX} bilingual coverage: ${problems.length} problem${problems.length === 1 ? '' : 's'} ` +
            `(vitepress build will fail):\n${problems.map((p) => `  - ${formatProblem(p)}`).join('\n')}`,
          { timestamp: true },
        );
      } else if (last) {
        logger.info(`${PREFIX} bilingual coverage: all pages are in step`, { timestamp: true });
      }
      last = report;
    };
    const schedule = (file: string): void => {
      if (!file.endsWith('.md')) return;
      clearTimeout(timer);
      // Let VitePress update its page list first when files are added or removed.
      timer = setTimeout(run, 300);
    };
    server.watcher.on('add', schedule).on('change', schedule).on('unlink', schedule);
    run();
  };

  return {
    name: 'openlinkos:vitepress-theme',
    enforce: 'pre',

    configResolved(config: ResolvedViteConfig) {
      site = (config as unknown as { vitepress?: SiteConfig }).vitepress;
      ssr = Boolean(config.build.ssr);
      const allow = config.server.fs.allow as string[];
      if (!allow.includes(PACKAGE_DIR)) allow.push(PACKAGE_DIR);
      const publicDir = config.publicDir;
      if (publicDir) {
        const clashes = [...getFiles().keys()].filter((name) => existsSync(join(publicDir, name)));
        if (clashes.length) {
          throw new Error(
            `${PREFIX} the theme provides ${clashes.join(', ')}; remove ${clashes.length === 1 ? 'it' : 'them'} ` +
              `from ${publicDir}`,
          );
        }
      }
    },

    resolveId(id) {
      if (id === BRAND_CSS_ID) return RESOLVED_BRAND_CSS;
      if (id === CLIENT_ID) return RESOLVED_CLIENT;
      // In builds, `![](/brand/…)` in markdown becomes an import; resolve it to the URL we emit.
      if (id.startsWith('/brand/')) {
        const path = id.replace(/[?#].*$/, '');
        if (getFiles().has(path.slice(1))) return `${ASSET_PREFIX}${path}`;
      }
      return null;
    },

    load(id) {
      if (id === RESOLVED_BRAND_CSS) return brandCss(o.brand);
      if (id === RESOLVED_CLIENT) {
        return `export const cookieDomain = ${JSON.stringify(o.cookieDomain)};\n`;
      }
      if (id.startsWith(ASSET_PREFIX)) {
        return `export default ${JSON.stringify(id.slice(ASSET_PREFIX.length))};\n`;
      }
      return null;
    },

    generateBundle() {
      if (ssr) return;
      for (const [fileName, file] of getFiles()) {
        this.emitFile({ type: 'asset', fileName, source: file.source });
      }
    },

    configureServer(server) {
      server.middlewares.use((req, res, next) => {
        let path: string;
        try {
          path = decodeURIComponent((req.url ?? '').replace(/[?#].*$/, ''));
        } catch {
          return next();
        }
        const file = getFiles().get(path.slice(1));
        if (!file) return next();
        res.statusCode = 200;
        res.setHeader('Content-Type', file.type);
        res.setHeader('Cache-Control', 'no-cache');
        res.end(file.source);
      });
      devCheck(server);
    },
  };
};
