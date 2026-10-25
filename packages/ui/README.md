# @openlinkos/ui

The OpenLinkOS design system for apps: design tokens, a framework-free stylesheet of layout and components, and a curated set of [Lucide](https://lucide.dev) icons. It lays out app shells, sign-in pages and one-page service sites, with motion that explains change and stops for users who prefer less of it. It needs no JavaScript and no build step, so it suits server-rendered pages under a strict Content-Security-Policy. The admin UIs of [Origin](https://github.com/openlinkos/origin) and [registry-mirrors-relay](https://github.com/openlinkos/registry-mirrors-relay) use it.

```bash
pnpm add -D @openlinkos/ui
```

| File | Contents |
| --- | --- |
| `@openlinkos/ui/ui.css` | Everything, in cascade layers: reset, tokens, base, layout, components, utilities |
| `@openlinkos/ui/tokens.css` | The token layer alone, for pages that only want the variables |
| `@openlinkos/ui/tokens.json` | Every token resolved for light and dark mode, and per brand where it varies |
| `@openlinkos/ui/tokens.light.json`, `tokens.dark.json` | The resolved tokens as trees, for design tools |
| `@openlinkos/ui/icons.svg` | The icons as an SVG sprite of `<symbol>`s |
| `@openlinkos/ui/icons.json` | The same icons as `{ lucide, viewBox, icons: { name: "<path …/>" } }`, to inline only what a page uses |
| `@openlinkos/ui/fonts/*` | Geist and Geist Mono (variable woff2, SIL Open Font License), referenced by `ui.css` as `fonts/…` |

Copy the files into your app's static assets at build time, keeping `fonts/` next to `ui.css`; nothing is loaded from a CDN.

## Documentation

- [Principles](docs/principles.md): how the system is built and why, with the practices it takes from other design systems.
- [Components](docs/components.md): markup, variants, states, accessibility and guidance for each component.
- [Token reference](docs/tokens.md): every token with its light and dark value, generated from [`tokens/`](tokens).
- [`demo/`](demo): an app page, every component, a sign-in page, and a service site. Run `node demo/serve.ts` here and open http://127.0.0.1:4321/demo/.

## Tokens

The sources are [W3C Design Tokens Community Group](https://www.designtokens.org/) files in [`tokens/`](tokens), in three tiers:

1. **Palette**: 12-step colour scales (neutral, the brand accent, success, warning, danger, info), generated in OKLCH from one solid colour each, with the step semantics of Radix Colors. Variables `--ol-palette-<scale>-<step>`.
2. **Semantic tokens**: what a value is for, such as `--ol-color-fg-muted`, `--ol-color-accent-solid-hover`, `--ol-space-4`, `--ol-radius-control`, `--ol-shadow-lg`, `--ol-duration-fast`, and the chart palette, `--ol-color-series-1` to `-8`, whose first slot is the brand accent. Components use only these.
3. **Component variables**: a few knobs inside components, such as `--ol-btn-height` or `--ol-stack-gap`.

Text tokens reach 4.5:1 on every surface, and control edges, quiet icons, the focus ring and every chart series 3:1, for every brand in both modes; neighbouring chart series also stay apart for colour-blind readers. The tests check every pair.

## Brand, theme, density

```html
<html data-theme="dark">          <!-- optional: force light or dark; default follows the system -->
<body data-brand="origin">        <!-- the accent of a brand in brand/brands.json; default OpenLinkOS -->
<div data-density="comfortable">  <!-- optional: larger controls; default is compact -->
```

All three attributes work on any element, so one page can mix brands or densities. Colours switch between light and dark through `light-dark()`, following `color-scheme`.

## Layers

`ui.css` declares `@layer ol.reset, ol.tokens, ol.base, ol.layout, ol.components, ol.utilities`. Your own CSS, outside any layer, always wins over the kit without raising specificity. To change a token, redefine the variable; to change a component, write a normal rule.

## Icons

```html
<svg class="ol-icon" aria-hidden="true"><use href="/assets/icons.svg#search"/></svg>
```

Icons take their colour from `currentColor` and their stroke from `.ol-icon`; sizes are `.ol-icon-sm` (14px), the default (16px) and `.ol-icon-lg` (20px). Server-rendered pages can inline the symbols they use from `icons.json` and reference them as `#search`, which avoids a request and any cross-origin concern. The available names are in [`src/icons.ts`](src/icons.ts); to add one, add its Lucide name there. Lucide is ISC-licensed; its licence ships as `LICENSE-lucide.txt`.

## Browser support

The kit targets current Chrome, Edge, Firefox and Safari. It relies on `light-dark()`, `color-mix()`, cascade layers, container queries, `:has()`, logical properties and the Popover API. Newer features are progressive: CSS anchor positioning places menus next to their button (elsewhere they open centred), invoker commands open dialogs without script, `field-sizing` grows text areas, `text-autospace` and `text-spacing-trim` refine Chinese typography, cross-document view transitions carry the app from page to page, `::details-content` opens disclosures smoothly, scroll-driven animations frame a site's header as the page scrolls, and `sibling-index()` lets bars rise one after another.

`ui.css` opts same-origin navigations into view transitions. An app that wants plain navigations adds `@view-transition { navigation: none; }` to its own stylesheet.

## Building

```bash
pnpm build   # writes dist/ and docs/tokens.md
pnpm test    # contrast and chart palette for every brand and mode, variables, icons, demo pages
```

## Licence

MIT for the code; the bundled Lucide icons are ISC. The OpenLinkOS and LinkOS names and marks are not covered: see [openlinkos.com/brand](https://openlinkos.com/brand).
