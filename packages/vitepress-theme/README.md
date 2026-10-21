# @openlinkos/vitepress-theme

The shared [VitePress](https://vitepress.dev) theme of every OpenLinkOS and LinkOS site. A site names its brand and its pages; the theme brings the rest:

- **Brand.** The brand's colours, logo, favicons, app icons, web manifest and Open Graph image, generated from the [OpenLinkOS design repository](https://github.com/openlinkos/design), and a family menu of OpenLinkOS projects and LinkOS services.
- **Two languages.** English at the root and Simplified Chinese under `/zh/`, with complete interface strings in both, Chinese local search (with a tokenizer that understands Chinese), and Chinese titles for containers, alerts and the copy button on Chinese pages.
- **Metadata.** A canonical URL, `hreflang` alternates (with `x-default`), Open Graph and Twitter tags on every page, a sitemap with language alternates, `robots.txt`, and `noindex` on the 404 page.
- **Language detection** that is safe behind a CDN and for search engines (see below).
- **A bilingual coverage check** that fails `vitepress build` when the Chinese site falls behind the English one.

## Usage

```bash
pnpm add -D vitepress@1.6.4 @openlinkos/vitepress-theme
```

```ts
// <site>/.vitepress/theme/index.ts
export { default } from '@openlinkos/vitepress-theme';
```

```ts
// <site>/.vitepress/config.ts
import { defineOpenLinkOSConfig } from '@openlinkos/vitepress-theme/config';

export default defineOpenLinkOSConfig({
  brand: 'origin',
  hostname: 'https://origin.openlinkos.com',
  title: 'Origin',
  themeConfig: {
    socialLinks: [{ icon: 'github', link: 'https://github.com/openlinkos/origin' }],
  },
  locales: {
    root: {
      description: 'Local-first, cross-agent personal memory for AI coding agents.',
      themeConfig: {
        nav: [{ text: 'Guide', link: '/guide/getting-started' }],
        sidebar: [/* … */],
        footer: { message: 'Released under the MIT License.' },
      },
    },
    zh: {
      description: '本地优先、跨 Agent 的个人记忆，服务于 AI 编码 Agent。',
      themeConfig: {
        nav: [{ text: '指南', link: '/zh/guide/getting-started' }],
        sidebar: [/* … */],
        footer: { message: '基于 MIT 许可证发布。' },
      },
    },
  },
});
```

`defineOpenLinkOSConfig` accepts every VitePress option plus:

| Option | |
| --- | --- |
| `brand` | The brand id from `brands.json`: `openlinkos`, `origin`, `agent`, `linkos`, `linkos-mirrors` or `linkos-status`. |
| `hostname` | The site's origin, such as `https://origin.openlinkos.com`. Used for canonical URLs, Open Graph, the sitemap and `robots.txt`. |
| `brandKit` | Publish every brand's web, GitHub and kit files under `/brand/<id>/` (for openlinkos.com). Markdown can then show them, as in `![](/brand/origin/kit/lockup.svg)`. |
| `cookieDomain` | The domain that shares the language preference across sites. Defaults to the last two labels of `hostname` (`openlinkos.com`); `false` keeps it to one host. |
| `locales` | `root` (English) and `zh` (Simplified Chinese) only. Language, label and link are set for you. |

The site's config extends the theme's: arrays such as `head` are appended, objects are merged, and the theme's `transformHead`, `buildEnd`, `markdown.config` and `sitemap.transformItems` run before the site's own. The family menu is appended to each locale's `nav`.

Things to know:

- **Per-locale settings.** VitePress replaces the top-level theme config with each locale's, key by key. The theme sets `nav`, `footer`, `outline`, `docFooter`, `notFound` and the interface labels in every locale, so set them per locale; values set at the top level are copied into both locales as defaults.
- **No `head` in locales** (VitePress drops it in production). Use the top-level `head`.
- **Reserved files.** The theme writes `favicon.ico`, `favicon.svg`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `site.webmanifest`, `og.png`, `logo.svg`, `logo-dark.svg` and `robots.txt` (and `brand/**` with `brandKit`). The build stops if the site's `public/` has one of them.
- Sites are served from the root with clean URLs: `base` must be `/` and `cleanUrls` stays on.

## Language detection

Every page except the 404 page carries a small inline script, `<script id="openlinkos-lang">`, with the address of the same page in the other language. Pages stay static and identical for every visitor, so a CDN can cache them by URL, and search engines see each language at its own URL.

- If the reader has chosen a language and this page is in the other one, the script moves them to the counterpart page, keeping the query and hash.
- Without a choice, an English page moves readers whose browser prefers Chinese (the first `en*` or `zh*` entry of `navigator.languages` is `zh*`). A Chinese page never sends readers to English on its own.
- Bots, crawlers, link previews and automated browsers are never moved.

A choice is following a link into the other language, such as the language menu. It is stored for a year in the `openlinkos-lang` cookie (`en` or `zh`), shared by every site under the cookie domain.

## Bilingual coverage check

English is the source of truth. `vitepress build` fails, and `vitepress dev` prints warnings, unless:

1. every page `p.md` has a Chinese counterpart `zh/p.md`, and the other way round;
2. each Chinese page records the English version it translates in a `sourceHash` frontmatter field: `sha256-` and the first 8 hex digits of the SHA-256 of the English file, with CRLF line endings normalized to LF. When the English page changes, the error message prints the line to paste once the translation is updated;
3. each pair has the same `h2` and `h3` headings in the same order (give Chinese headings an explicit anchor equal to the English id, such as `## 安装 {#install}`) and the same number of code blocks;
4. links stay within their language: relative and absolute links on Chinese pages, and Chinese nav, sidebar and frontmatter links, point under `/zh/`; English pages never link into `/zh/`. External links and files that are not pages are exempt.

Compute a `sourceHash` with:

```bash
node -e "const c=require('fs').readFileSync(process.argv[1],'utf8').replace(/\r\n/g,'\n');console.log('sha256-'+require('crypto').createHash('sha256').update(c,'utf8').digest('hex').slice(0,8))" docs/guide/cli.md
```

or `sourceHash(content)` from `@openlinkos/vitepress-theme/config`.

## License

The code is released under the [MIT License](LICENSE). The OpenLinkOS and LinkOS names and marks, including the brand files this package ships, are not covered by that license; see the brand guidelines on openlinkos.com/brand.
