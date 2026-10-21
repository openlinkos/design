# Brand system

This document is for maintainers of this repository: how the marks are built, where the assets come from, and how to change them. The public usage rules (clear space, minimum sizes, do's and don'ts, downloads) live on the brand page at openlinkos.com/brand.

## Brands

Every brand is an entry in [`brand/brands.json`](brand/brands.json), the single source of truth:

| Id | Name | Tier | Mark | Accent |
| --- | --- | --- | --- | --- |
| `openlinkos` | OpenLinkOS | master | interlocked rings | blue |
| `origin` | Origin | product | ring and centre point | indigo |
| `agent` | OpenLinkOS Agent | product | interlocked rings | violet |
| `linkos` | LinkOS | line | interlocked rings | green |
| `linkos-mirrors` | LinkOS Mirrors | service | interlocked rings | green |
| `linkos-status` | LinkOS Status | service | interlocked rings | green |

OpenLinkOS is the umbrella brand of our open-source projects. LinkOS is our line of hosted services. Both share one visual system; the tier shows in the accent colour and the wordmark, not in a different mark.

An entry holds the name, tier and parent, the mark, the wordmark and an optional descriptor (drawn in the accent colour, for example "LinkOS **Mirrors**"), the URL and a one-line description in English and Chinese, the navigation group (`projects`, `services` or none), and the colours. A service can reuse its line's colours by naming it (`"colors": "linkos"`).

## Construction

- **Grid.** Marks sit on a 48-unit square with a 4-unit margin.
- **Line.** One stroke weight, 4 units, with round caps and joins. At 32 px and below the small variant uses 5.5 units so the mark stays legible; the favicon uses it.
- **Interlocked rings.** Two rings of radius 10, centres 14 apart. Each passes under the other once: the left ring at the upper crossing, the right ring at the lower one. The gap where a ring passes under is the stroke width plus 1.25 units on each side.
- **Ring and centre point.** A ring of radius 15 around a solid point of radius 5 (6 in the small variant).
- **Wordmark.** A monoline alphabet drawn as paths in [`brand/wordmark.ts`](brand/wordmark.ts) (x-height 11, cap height 15, descender 5, stroke 2.6 font units). In a lockup the wordmark is scaled by 1.45 so its stroke matches the mark, sits 13 units to the right of the mark, and the descriptor follows 8 units after the name. Brand names are always set in Latin letters, in every language.
- **Colour.** The left ring (or the ring around the origin) is ink; the accent is the brand colour. Ink is `#0f172a` on light backgrounds and `#e2e8f0` on dark ones. App icons and cards use the ink tile `#0f172a` with the dark colourway.
- **Paths only.** Marks contain no text, filters, external references, embedded fonts or inline colours; colours come from the classes `ink`, `accent`, `ink-f` and `accent-f`, so one geometry renders every colourway. The tests enforce this.

Contrast rules, also enforced by the tests: the mark accent reaches 3:1 against the page, brand-1 (text and links) reaches 4.5:1 on light and dark pages, and white text on brand-3 (solid buttons) reaches 4.5:1.

## Assets

`pnpm gen` writes every asset into `brand/out/<brand>/` and lists each file's size and SHA-256 in `brand/out/manifest.json`:

| Folder | Files |
| --- | --- |
| `web/` | `favicon.svg` (follows the system colour scheme), `favicon.ico` (16, 32 and 48 px), `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `icon-maskable-512.png`, `site.webmanifest`, `og.png` (1200 × 630), `logo.svg`, `logo-dark.svg` |
| `github/` | `social-preview.png` (1280 × 640), `avatar.png` (500 × 500), `readme-light.svg`, `readme-dark.svg` |
| `kit/` | `mark.svg`, `mark-dark.svg`, `mark-black.svg`, `mark-white.svg`, `lockup.svg`, `lockup-dark.svg`, `mark-1024.png` |

Raster images contain no text other than the drawn wordmark, so they are the same for every language. The output is committed and never edited by hand. CI regenerates it on Linux and Windows and fails if a single byte differs.

Sites do not copy these files: `@openlinkos/vitepress-theme` ships them and writes the brand's `web/` files to each site's root (and, with `brandKit`, every brand's files under `/brand/<id>/` on openlinkos.com). After regenerating, rebuild the theme with `pnpm build`.

## Changing the brand

1. Edit `brand/brands.json`, `brand/marks.ts` or `brand/wordmark.ts`.
2. Run `pnpm gen`, look at the result, and run `pnpm test`.
3. Commit the source change together with the regenerated `brand/out/`.

To add a product, add an entry to `brands.json` (reuse a mark, pick an accent that passes the contrast tests) and regenerate. A product gets its own mark only when it needs one; until then it uses the interlocked rings in its own colour.

## How the marks were chosen

The marks were chosen in October 2026 after twelve rounds of concepts. Every candidate was screened with a reverse image search (Google Lens, plus Baidu for Chinese brands), and the bar was set at "not confusable with an existing mark in software or AI". Simple geometric marks always have look-alikes somewhere, so a perfectly unique simple mark is not achievable. The concepts and screening scripts are in the git history of this repository.

The screening ruled out the following:

- **Open hexagon with a dot.** It is close to Caplo (agent memory), FastLabel, Esper, IMEI.info and IBM's Carbon Design System.
- **Cube in a hexagon.** It is close to webpack and the FinOps Foundation.
- **Interlocked rounded squares.** This is the generic link icon, and close to AutoLink.ai.
- **An open ring with a node.** It is close to Ionic and several AI products.

The interlocked rings were kept although they resemble Loop (a mortgage app) and Lookout IT (an IT services firm): two linked rings are a common motif rather than anyone's distinctive mark. The ring with a centre point is a generic bullseye. Neither should be registered as a trademark without a formal search; the names and wordmarks carry the brand.
