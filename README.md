<h1>
  <picture>
    <source media="(prefers-color-scheme: dark)" srcset="brand/out/openlinkos/github/readme-dark.svg">
    <img alt="OpenLinkOS Design" src="brand/out/openlinkos/github/readme-light.svg" height="48">
  </picture>
</h1>

**The brand and the shared site theme of OpenLinkOS and LinkOS.**

[![npm](https://img.shields.io/npm/v/@openlinkos/vitepress-theme)](https://www.npmjs.com/package/@openlinkos/vitepress-theme) [![CI](https://github.com/openlinkos/design/actions/workflows/ci.yml/badge.svg)](https://github.com/openlinkos/design/actions/workflows/ci.yml)

English | [简体中文](README.zh-CN.md)

This repository holds:

- the brand marks of **OpenLinkOS**, the umbrella brand of our open-source projects (such as Origin), and of **LinkOS**, our line of hosted services (such as LinkOS Mirrors);
- the generated brand assets: favicons, app icons, social images, and README headers;
- `@openlinkos/vitepress-theme`, the VitePress theme every OpenLinkOS and LinkOS site uses for its look, bilingual (English and Simplified Chinese) interface, language detection, and metadata.

Maintainers: see [BRAND.md](BRAND.md).

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
