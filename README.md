<h1>
  <img alt="OpenLinkOS Design" src="brand/out/openlinkos/github/readme.svg" height="56">
</h1>

**The brand, the design system, and the shared site theme of OpenLinkOS and LinkOS.**

[![npm: ui](https://img.shields.io/npm/v/@openlinkos/ui?label=%40openlinkos%2Fui)](https://www.npmjs.com/package/@openlinkos/ui) [![npm: vitepress-theme](https://img.shields.io/npm/v/@openlinkos/vitepress-theme?label=%40openlinkos%2Fvitepress-theme)](https://www.npmjs.com/package/@openlinkos/vitepress-theme) [![CI](https://github.com/openlinkos/design/actions/workflows/ci.yml/badge.svg)](https://github.com/openlinkos/design/actions/workflows/ci.yml)

English | [简体中文](README.zh-CN.md)

This repository holds:

- the brand marks of **OpenLinkOS**, the umbrella brand of our open-source projects (such as Origin), and of **LinkOS**, our line of hosted services (such as LinkOS Mirrors);
- the generated brand assets: favicons, app icons, social images, and README headers;
- `@openlinkos/ui`, the design system for apps: design tokens in the W3C DTCG format, framework-free CSS for layout and components (per brand, light and dark, with contrast checked by tests), and a curated Lucide icon set;
- `@openlinkos/vitepress-theme`, the VitePress theme every OpenLinkOS and LinkOS site uses for its look, bilingual (English and Simplified Chinese) interface, language detection, and metadata.

Maintainers: see [BRAND.md](BRAND.md).

## Using the design system

Apps link `@openlinkos/ui/ui.css`, set `data-brand` on the page, and build their pages from `ol-` classes. See the [package README](packages/ui/README.md), the [principles](packages/ui/docs/principles.md), the [components](packages/ui/docs/components.md) and the [token reference](packages/ui/docs/tokens.md).

## Using the theme

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
  locales: {
    root: { description: '…', themeConfig: { nav: [], sidebar: [] } },
    zh: { description: '…', themeConfig: { nav: [], sidebar: [] } },
  },
});
```

Every page needs a Simplified Chinese counterpart under `zh/`, and the build checks that the two stay in step. See the [theme's README](packages/vitepress-theme/README.md) for the options, the language detection and the bilingual rules. [`playground/`](playground) is a small bilingual site that uses the theme: run `pnpm build` once, then `pnpm docs:dev`.

## License

The code is released under the [MIT License](LICENSE). The OpenLinkOS and LinkOS names and marks are not covered by that license; how to use them will be described in the brand guidelines on openlinkos.com.
