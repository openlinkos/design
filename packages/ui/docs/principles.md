# Principles

How `@openlinkos/ui` is built, and which practice of an established design system each decision follows. Sources were checked on 2026-10-22.

## Look and feel {#look}

**One quiet frame, one memorable moment.** The app is a sidebar on a soft shell colour and a single floating content panel that scrolls on its own. Navigation stays put, and the page reads as one object instead of a stack of boxes. The kit spends its boldness in one place: the sign-in page, where the brand's mark is drawn large as an origin point with rings spreading from it at widening intervals. The same rings return faintly behind empty states. Everything else stays disciplined.

**Hierarchy before decoration.** Frames are earned: sections and headings come first, a panel groups related detail, and a card is one item of a collection. Radii differ by role (6px controls, 10px containers, 14px for the content panel and dialogs) instead of one radius on everything. The brand accent marks what matters (the current page, the primary action, focus, selection, links, stat icons, the first series of a chart) and nothing else.

**Type with character, set solid.** Latin text uses [Geist](https://github.com/vercel/geist-font) and Geist Mono (SIL Open Font License, bundled, no CDN); monospace is reserved for real code, ids and tokens. Chinese falls back to the platform's own fonts.

**No template chrome.** The kit has no uppercase label style, does not join metadata with middle dots, does not append arrows to link text, and gives every button a verb and its object. Write sentence case.

## Tokens {#tokens}

**W3C Design Tokens format.** Sources are `.tokens.json` files in the [DTCG 2025.10](https://www.designtokens.org/TR/2025.10/) format: groups and tokens with `$value`, `$type` (inherited from groups), `$description` and `$deprecated`; references as `{group.token}`; colours as `{ colorSpace, components, hex }`; dimensions as `{ value, unit }` in px or rem. Typography presets give `lineHeight` as a multiplier, as the format requires. Kit-specific data lives under `$extensions["com.openlinkos"]`, the reverse-domain form the spec asks for: the dark-mode value, density variants, a unit for number tokens, and the scale and brand markers of palette anchors.

**Three tiers.** Like Primer (base, functional, component), Spectrum (global, semantic, component) and Material (ref, sys, comp):

1. **Palette**, `--ol-palette-<scale>-<step>`: raw scales. Components never use them directly.
2. **Semantic tokens**, named by purpose: `--ol-color-fg-muted`, `--ol-color-accent-solid-hover`, `--ol-space-4`, `--ol-radius-control`, `--ol-shadow-lg`. Interaction states are suffixes (`-hover`, `-active`), as in Primer's `-rest/-hover/-active` and Polaris's `-hover/-active`. Disabled is a role of its own (`fg-disabled`), as in Atlassian's `color.text.disabled` and Carbon's `$text-disabled`.
3. **Component variables**, a few knobs per component (`--ol-btn-height`, `--ol-stack-gap`), the role Primer's `--button-primary-bgColor-hover` plays.

**Surfaces by role.** `shell`, `bg`, `bg-subtle`, `surface` and `surface-overlay` follow Atlassian's elevation surfaces (`elevation.surface`, `.sunken`, `.raised`, `.overlay`) and Carbon's layers: a component asks for the surface it sits on, not a grey.

**Modes in one stylesheet.** Light and dark values sit side by side and are emitted with `light-dark()`, following `color-scheme`. DTCG's Resolver module describes themes as separate files combined by a resolver. The kit keeps both modes in one source per token instead, so a token can never exist in one mode and not the other.

**References survive into CSS.** Semantic variables point at palette variables with `var()`, so a brand only redefines its accent palette. Custom properties resolve `var()` where they are declared, so brand blocks also redeclare the tokens that depend on the accent.

**Generated reference, tested.** [`tokens.md`](tokens.md) lists every token with its light and dark value, generated from the sources the way Atlassian's token pages come from token metadata. CI fails if it is stale. `$deprecated` tokens are marked there and in `tokens.json`, as Primer marks deprecated tokens.

## Colour {#colour}

**12-step scales with fixed meanings.** Every scale follows the step semantics of [Radix Colors](https://www.radix-ui.com/colors/docs/palette-composition/understanding-the-scale):

| Steps | Use |
| --- | --- |
| 1–2 | app and subtle backgrounds |
| 3–5 | UI element backgrounds: rest, hover, pressed or selected |
| 6–8 | borders: subtle, UI element, hover |
| 9–10 | solid fills and their hover |
| 11–12 | low- and high-contrast text |

Dark scales are designed separately, not inverted, as in Radix.

**Generated in OKLCH from one colour.** Each scale comes from one solid colour (step 9): the lightness and relative chroma of each step follow a Radix reference scale, at the solid's hue. Like the Radix custom palette generator, the solid stays exactly the input colour. Out-of-gamut colours lose chroma at constant lightness and hue, the gamut-mapping approach of [CSS Color 4](https://www.w3.org/TR/css-color-4/#css-gamut-mapping), so a scale never shifts in lightness or hue. The values are computed at build time because browsers clip rather than map. A test reproduces Radix indigo from its solid.

**Contrast is computed, then tested.** Steps 11 and 12 are moved until they reach 4.5:1 and 7:1 on steps 1–3. Each scale also gets accessible extras: `text-subtle` (4.5:1), `border-input` (3:1), `border-input-hover`, and `on-solid`. `on-solid` is white, or the dark step 12 where white fails, as Radix Themes does for amber and the other light colours. The tests check every brand in both modes:

- text on every surface: 4.5:1;
- every tone's text on its own tint and on every surface: 4.5:1;
- text on solid fills: 4.5:1;
- control edges, quiet icons (`icon-subtle`) and the focus ring on every surface: 3:1;
- the brand panel's text (4.5:1) and mark (3:1);
- the chart series, as [below](#chart-series).

WCAG 2 is the measure, since APCA is not adopted and WCAG 3's contrast method is not settled.

**Brands share everything but the accent.** `data-brand="<id>"` swaps the accent scale for any brand in `brand/brands.json`; neutral and status colours stay common.

### Chart series {#chart-series}

**A categorical palette in a fixed order.** Charts colour their series from eight slots, `--ol-color-series-1` to `-8`: the brand accent first, then orange, cyan, pink, green, purple, gold and red. Each slot has its own light and dark value, chosen for its mode rather than inverted. A slot stays with the thing it stands for, so a filter that hides one series does not repaint the others, and colours are never cycled: past eight series, fold the smallest into one "Other" series or split the chart. As in [Carbon's categorical palettes](https://carbondesignsystem.com/data-visualization/color-palettes/), the order is part of the design: a stacked bar or a line chart puts neighbouring series next to each other, and a small chart shows its first few series together, so those are the pairs that must stand apart, for colour-blind readers too.

**Separation is computed, then tested.** Distances are measured in OKLab (ΔE ×100, where about 2 is just noticeable), for normal vision and for protanopia and deuteranopia simulated at full severity with the model of [Machado, Oliveira and Fernandes (2009)](https://www.inf.ufrgs.br/~oliveira/pubs_files/CVD_Simulation/CVD_Simulation.html), applied to linear sRGB. Red–green deficiencies, which these model at their most severe, affect about one man in twelve. The tests check every brand in both modes:

- every series against the surface and the page: 3:1 (WCAG 1.4.11), with no exceptions;
- neighbouring series, and every pair among the first four: ΔE 15 for normal vision and 8 under both simulations;
- the accent against every other series: ΔE 15, so no brand's accent has a twin in the palette.

Pairs further apart than neighbours can still be close for a colour-blind reader (green and red, for one), so colour is never the only channel: a chart with two or more series has a legend, its text stays in text colours rather than series colours, and its numbers are in a table (WCAG 1.4.1). Series colours mean identity, not status: a series that means good or bad takes the status tones, with an icon and words.

## Scales {#scales}

| Scale | Values | Comparable |
| --- | --- | --- |
| Type | 11, 12, 13, 14 (body), 16, 20, 24, 36 px with line heights 14, 16, 20, 22, 24, 28, 32, 44 | Carbon body-01 14/20, Ant Design and TDesign 14/22, Geist copy 14/20 |
| Space | a 4px grid, named by multiples of 4px (`space-4` = 16px) | Polaris `space-100` = 4px, Atlassian `space.100` = 8px |
| Controls | 24, 28, 32 (default), 40 px; 36 and 44 in comfortable density | Primer 24/28/32/40/48, shadcn 32/36/40 |
| Radius | 3, 4, 6, 10, 14 px and full, by role | Primer 3/6/12, Fluent 2/4/6/8 |
| Elevation | xs, sm, md, lg, xl | Primer resting and floating shadows, Fluent shadow2–64 |
| Motion | 100, 160, 240 ms; standard (0.2, 0, 0, 1), enter, exit | Material 3 standard easing, Carbon productive durations |
| Stacking | sticky 100, dropdown 1000, overlay 1100, toast 1300 | Primer, Fluent; overlays use the top layer instead |

## Accessibility {#accessibility}

The kit is built to [WCAG 2.2](https://www.w3.org/TR/WCAG22/) AA and meets these AAA criteria where it can.

| Criterion | How the kit meets it |
| --- | --- |
| 1.4.1 Use of colour | Charts come with a legend and a table, links in prose are underlined, and states pair colour with an icon or words. |
| 1.4.3 Contrast | Text reaches 4.5:1, enforced by tests. |
| 1.4.11 Non-text contrast | Form controls, the focus ring, status dots, quiet icons and chart series reach 3:1. |
| 2.4.7 Focus visible, 2.4.13 Focus appearance | One focus style everywhere: a solid 2px ring (`:focus-visible`) with an offset, 3:1 against every surface. Inputs add a soft halo around it. |
| 2.4.11 Focus not obscured | The scrolling panel sets `scroll-padding` for its sticky top bar. |
| 2.5.8 Target size | Controls are at least 24px; `size-target-min` sets the floor. |

**State by ARIA.** Components style `aria-current`, `aria-pressed`, `aria-selected`, `aria-invalid`, `aria-busy`, `aria-disabled` and `aria-sort`, so the visual state and the state assistive technology reads cannot drift apart.

**Native first.** Forms style native controls. Progress and meters are `<progress>` and `<meter>`. Disclosures are `<details>`, with `name` for accordions. Menus and popovers use the Popover API, and dialogs are `<dialog>`. Browsers supply keyboard handling, light dismiss and focus return.

**Preferences.**
- **`prefers-reduced-motion`:** removes animation.
- **`prefers-contrast: more`:** firms up lines and secondary text.
- **`forced-colors`:** focus, current items, segmented choices and frames switch to system colours (Highlight, CanvasText). Shadows disappear in forced colours, so state never relies on a shadow alone. Checkboxes, radios, switches and selects fall back to the platform's controls.

## Chinese typography {#chinese}

Following the W3C [clreq](https://www.w3.org/TR/clreq/) requirements:

- **Fonts:** Geist for Latin, then PingFang SC, Hiragino Sans GB, Microsoft YaHei, and Noto Sans CJK SC / Source Han Sans SC. This is the order Arco and Semi use; `system-ui` comes after the named fonts.
- **Full-width punctuation:** on Chinese pages, Geist is loaded without curly quotes, the middle dot, the em dash and the ellipsis, so those characters take their full-width forms from the Chinese font.
- **Tracking:** none; tight tracking resets to 0, because Chinese text is set solid.
- **Line height:** interface text keeps 14/22, as Ant Design and TDesign do. Running text (`.ol-text-prose`) gets 1.75, within clreq's 1.5–2.
- **Spacing:** `text-autospace` adds space between Han and Latin text, and `text-spacing-trim` trims punctuation, where the browser supports them.

## CSS architecture {#css}

**Cascade layers.** `ui.css` declares `@layer ol.reset, ol.tokens, ol.base, ol.layout, ol.components, ol.utilities`, as Tailwind v4 and daisyUI 5 do. App CSS outside the layers always wins, without specificity games.

**No JavaScript, strict CSP.** Every component works with server-rendered HTML and no script: the narrow-screen menu is a checkbox, menus use `popovertarget`, dialogs use `command`/`commandfor`, disclosures use `<details>`. No inline styles are needed, and fonts, icons and styles are files the app serves itself.

**Modern CSS with fallbacks.**

| Feature | Use | Status, and the fallback where needed |
| --- | --- | --- |
| Logical properties | all spacing | Widely available |
| Container queries | grids | Widely available |
| `:has()` | layout | Widely available |
| `color-mix()` | tints and rims | Widely available |
| `light-dark()` | colour modes | Widely available from November 2026 |
| Popover API | menus and popovers | Newly available |
| `@starting-style` | entry transitions | Newly available |
| Anchor positioning | menus beside their button | Enhancement; elsewhere they open centred |
| Invoker commands | dialogs without script | Enhancement; elsewhere use `showModal()` |
| `field-sizing` | textareas that grow | Enhancement; elsewhere the text area keeps its rows |
| `text-autospace`, `text-spacing-trim` | Chinese spacing | Enhancement; ignored elsewhere |

**Icons.** A curated subset of [Lucide](https://lucide.dev) (ISC), shipped as a sprite and as JSON so server-rendered pages can inline only the symbols they use. Icons take `currentColor`, so they follow text colour, forced colours and dark mode.

## Documentation {#documentation}

Each component in [components.md](components.md) gives its purpose, markup, variants, sizes and states, what accessibility needs from the page, and do and don't guidance, the structure Primer, Carbon and Atlassian use for their component pages. The demo pages show every class, and a test fails if a demo uses a class or icon the kit does not define, or an inline style.
