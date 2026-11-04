# @openlinkos/vitepress-theme

The shared [VitePress](https://vitepress.dev) theme of every OpenLinkOS and LinkOS site. A site names its brand and its pages; the theme brings the rest:

- **Brand.** The brand's colours, logo, favicons, app icons, web manifest and Open Graph image, generated from the [OpenLinkOS design repository](https://github.com/openlinkos/design), a family menu of the open-source projects and the free public services, and a shared footer (see below).
- **Two languages.** English at the root and Simplified Chinese under `/zh/`, with complete interface strings in both, Chinese local search (with a tokenizer that understands Chinese), and Chinese titles for containers, alerts and the copy button on Chinese pages.
- **Metadata.** A canonical URL, `hreflang` alternates (with `x-default`), Open Graph and Twitter tags on every page, a sitemap with language alternates, `robots.txt`, `/.well-known/security.txt`, and `noindex` on the 404 page.
- **A layer for agents** (on by default, `llms: false` to turn off): `/llms.txt` and `/llms-full.txt` per locale, and every page as its Markdown source at its own address with `.md` appended. See below.
- **Page actions** on every doc page: copy the page as Markdown, open it in Claude or ChatGPT with the page's address prefilled. See below.
- **Landing-page components** (`@openlinkos/vitepress-theme/components`): `OlHero`, `OlSteps`, `OlCast`, `OlLogos`, `OlBand`. See below.
- **Language detection** that is safe behind a CDN and for search engines (see below).
- **A bilingual coverage check** that fails `vitepress build` when the Chinese site falls behind the English one.

## Usage

```bash
pnpm add -D vitepress@1.6.4 vue @openlinkos/vitepress-theme
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
      },
    },
    zh: {
      description: '本地优先、跨 Agent 的个人记忆，服务于 AI 编码 Agent。',
      themeConfig: {
        nav: [{ text: '指南', link: '/zh/guide/getting-started' }],
        sidebar: [/* … */],
      },
    },
  },
  // After the organization's privacy notice, which the footer always links to first.
  legal: [
    { text: { en: 'MIT License', zh: 'MIT 许可证' }, link: 'https://github.com/openlinkos/origin/blob/master/LICENSE' },
  ],
});
```

`defineOpenLinkOSConfig` accepts every VitePress option plus:

| Option | |
| --- | --- |
| `brand` | The brand id from `brands.json`: `openlinkos`, `origin`, `agent`, `beacon`, `linkos`, `linkos-mirrors` or `linkos-status`. |
| `hostname` | The site's origin, such as `https://origin.openlinkos.com`. Used for canonical URLs, Open Graph, the sitemap and `robots.txt`. |
| `brandKit` | Publish every brand's web, GitHub and kit files under `/brand/<id>/` (for openlinkos.com). Markdown can then show them, as in `![](/brand/origin/kit/lockup.svg)`. |
| `cookieDomain` | The domain that shares the language preference across sites. Defaults to the last two labels of `hostname` (`openlinkos.com`); `false` keeps it to one host. |
| `llms` | The layer for agents, on by default; `false` writes no `llms.txt`, no `llms-full.txt` and no page Markdown. |
| `locales` | `root` (English) and `zh` (Simplified Chinese) only. Language, label and link are set for you. |
| `footer` | The site's own part of the shared footer. `footer.note`: one line of plain text of its own in the brand block, under the description, such as who runs the site: a string for both languages or `{ en, zh }`. |
| `legal` | The footer's bottom row, after the copyright: the organization's privacy notice, then the site's links. A list of links (`{ text, link }`, each a string or `{ en, zh }`) adds them after the notice. The full form is `{ privacy, links }`: `privacy` is `true` (the default, the organization's notice), the site's own notice (its link, a string or `{ en, zh }`; the text stays "Privacy"), or `false` for none. |

The site's config extends the theme's: arrays such as `head` are appended, objects are merged, and the theme's `transformHead`, `buildEnd`, `markdown.config` and `sitemap.transformItems` run before the site's own. The family menu is appended to each locale's `nav`; its links into the site itself are paths (see [Footer](#footer)).

Things to know:

- **Per-locale settings.** VitePress replaces the top-level theme config with each locale's, key by key. The theme sets `nav`, `footer`, `outline`, `docFooter`, `notFound` and the interface labels in every locale, so set them per locale; values set at the top level are copied into both locales as defaults.
- **No `head` in locales** (VitePress drops it in production). Use the top-level `head`.
- **Reserved files.** The theme writes `favicon.ico`, `favicon.svg`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `site.webmanifest`, `og.png`, `logo.svg`, `logo-dark.svg`, `robots.txt`, `.well-known/security.txt`, `llms.txt`, `llms-full.txt`, `zh/llms.txt` and `zh/llms-full.txt` (and `brand/**` with `brandKit`). The build stops if the site's `public/` has one of them.
- Sites are served from the root with clean URLs: `base` must be `/` and `cleanUrls` stays on.

## The layer for agents

The theme gives every site a layer agents can read, on by default (`llms: false` turns it off):

- **`/llms.txt`** — the site's pages as an index ([llmstxt.org](https://llmstxt.org) format), one section per sidebar group in sidebar order, each page by its sidebar title with its frontmatter description or first paragraph, linking to the page as Markdown. Home-layout pages are left out: they are designed pages, not reading material.
- **`/llms-full.txt`** — every page of the locale whole, each with its title and address.
- **Every page as Markdown** — a page's own address with `.md` appended returns its Markdown source, in the dev server and in the build: `/guide/quickstart.md`, `/zh/guide/quickstart.md`, `/index.md`.

English is the source of truth, so `/llms.txt` and `/llms-full.txt` list the English pages and `/zh/llms.txt` and `/zh/llms-full.txt` the Chinese ones; each index's header points to the other, so an agent landing on either finds both. A page's Markdown sits next to the page itself, so appending `.md` to any address works in either locale.

## Page actions

Every doc page carries three actions at the top of its content, in the page's language:

- **Copy page** fetches the page's Markdown (the same `.md` address as above) and puts it on the clipboard;
- **Open in Claude** opens a new chat with `Read <address>.md and answer questions about it.` prefilled ([documented by Anthropic](https://support.claude.com/en/articles/14729294-open-claude-desktop-with-a-link); the prompt is prefilled, not sent);
- **Open in ChatGPT** does the same at `chatgpt.com/?q=`, which is not an officially documented parameter.

They are plain DOM, put in place after the page mounts and re-pointed on every navigation. The strings live with the theme's other interface strings (`PAGE_ACTIONS` in `src/config/strings.ts`).

## Landing-page components

`@openlinkos/vitepress-theme/components` ships five components for a site's first screen, as Vue single-file components that the site's own Vite build compiles (the theme's compiled code still never imports Vue; `vue` is a peer dependency for this path). Register them in the site's theme:

```ts
// <site>/.vitepress/theme/index.ts
import Theme from '@openlinkos/vitepress-theme';
import { OlBand, OlCast, OlHero, OlLogos, OlSteps } from '@openlinkos/vitepress-theme/components';

export default {
  ...Theme,
  enhanceApp(ctx) {
    for (const [name, component] of Object.entries({ OlBand, OlCast, OlHero, OlLogos, OlSteps })) {
      ctx.app.component(name, component);
    }
    Theme.enhanceApp?.(ctx);
  },
};
```

| Component | |
| --- | --- |
| `OlHero` | The first screen: `title`, `lead`, `actions` and `meta` slots, a `command` prop shown with a copy button, and a `media` slot on the right (under the words below 960 px). |
| `OlSteps` | A numbered timeline: `steps`, a list of `{ title, text, media, alt }`, the media beside each step. |
| `OlCast` | A terminal recording (asciinema): `poster` (a static screenshot, all that a reader without JavaScript or with reduced motion ever sees), `src` (the `.cast` file), `player` and `player-css` (the site's own copy of asciinema-player), `alt`, `caption`. The play button appears only with JavaScript and motion, and the recording starts on click, never by itself. |
| `OlLogos` | A row of names: `items`, a list of `{ name, src, href }`, and `label` for screen readers. |
| `OlBand` | The closing call to action: `title`, `text` and `actions` slots on the brand colour; a link marked `class="ghost"` sits quietly beside the first. |

Their styles use `@openlinkos/ui` design tokens only (`--ol-*`), which the theme loads on every page; the head sets `data-brand`, which picks the brand's palette, and `light-dark()` follows VitePress's `.dark` class. The playground site in this repository has a page exercising all five (`playground/components.md`).

## Footer

Every site gets the same footer, built from `brands.json`:

- the site's logo and name, its description (the locale's `description`, or the brand's), who it belongs to ("Open source by LinkOS" on the open-source sites, "Run by LinkOS" on a service, nothing on the master brand's sites), and the site's `footer.note`, if it has one;
- columns of the open-source projects and the free public services (`nav` in `brands.json`, the same as the family menu; a service that is also an open-source project links to its repository under the projects), the master brand's pages (about, news, trust and security, contact), and resources (GitHub, brand guidelines, design system);
- a bottom row with `© <build year> <master brand>`, the privacy notice, and the site's `legal` links.

The footer is on every page, pages with a sidebar included: VitePress hides it there, and the theme shows it beside the sidebar. A page leaves it out with `footer: false` in its frontmatter. A site that sets its own `themeConfig.footer.message` in a locale replaces the columns (and the note) and keeps the bottom row. VitePress renders the footer with `v-html` inside a paragraph, so the theme builds it from phrasing elements only.

Links into the site itself, by its `hostname`, become paths, in the footer and in the family menu alike: on linkos.org, the menu's LinkOS Mirrors is `/mirrors`, so it opens in the same tab, without the external-link icon, and works on `vitepress preview` too. The family menu's label does not light up when one of its links is the page on screen; the link does.

**Saying who runs the site.** A site of the master brand that is not the organization's own, such as linkos.org, shows no attribution line; it says who runs it with the note:

```ts
footer: {
  note: {
    en: 'The free public services are run by the LinkOS team',
    zh: 'LinkOS 免费公共服务由 LinkOS 团队运营',
  },
},
```

**Legal links.** The bottom row always starts with the privacy notice; `legal` adds the site's links after it. The build stops if one of them repeats the notice (its text, "Privacy" or "隐私说明", or its address): remove it, point the notice at the site's own with `legal: { privacy: { en: '/privacy', zh: '/zh/privacy' }, links: [/* … */] }`, or leave the notice out with `privacy: false`.

## security.txt

The theme writes `/.well-known/security.txt` ([RFC 9116](https://www.rfc-editor.org/rfc/rfc9116)) with the security contact, the master brand's trust and security page as the policy, and the site's own URL as the canonical one. It expires a year after the build, so rebuild every site at least once a year.

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
