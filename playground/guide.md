# Guide

This page exercises the theme: headings, code blocks, containers, alerts and links. Go back to the [home page](./index.md) at any time.

## Install

Add the theme next to VitePress:

```bash
pnpm add -D @openlinkos/vitepress-theme vitepress
```

::: tip
The theme needs VitePress 1.6.4 or later.
:::

## Configure

### The config file

Describe the site once, in English and Chinese:

```ts
import { defineOpenLinkOSConfig } from '@openlinkos/vitepress-theme/config';

export default defineOpenLinkOSConfig({
  brand: 'origin',
  hostname: 'https://origin.openlinkos.com',
  title: 'Origin',
});
```

### The theme file

```ts
export { default } from '@openlinkos/vitepress-theme';
```

> [!NOTE]
> Chinese pages get Chinese titles for containers, alerts and the copy button.

::: details
The build fails when a page has no Chinese counterpart.
:::

## Brand assets

With the brand kit enabled, every brand's files are published under `/brand/`:

![The OpenLinkOS lockup](/brand/openlinkos/kit/lockup.svg)
