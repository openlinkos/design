# Changelog

Changes to `@openlinkos/ui`, newest first. It shares its version with `@openlinkos/vitepress-theme`; releases before 0.7.0 are described in the git history.

## 0.8.0-rc.2

No changes to the package; released with `@openlinkos/vitepress-theme` 0.8.0-rc.2, which can now be installed from npm.

## 0.8.0-rc.1

No changes to the package; released with `@openlinkos/vitepress-theme` 0.8.0-rc.1, whose version it shares and which now depends on it for the design tokens.

## 0.7.1

No changes to the package; released with `@openlinkos/vitepress-theme` 0.7.1, whose version it shares.

## 0.7.0

### Added

- The `beacon` brand. `data-brand="beacon"` takes Beacon's accent scale, generated from its solid colour in `brand/brands.json`: signal orange, `#b84400` for solids and links, with the mark in `#e55900` on light and `#ff7728` on dark.

### Changed

- Chart series: a slot that would be the twin of the brand accent (ΔE under 15 in either mode) gives way, in that brand only and in both modes, to a reserve colour: blue (`#2563eb` / `#3a74f1`), then teal (`#008e82` / `#31c3b5`). The slot keeps its place, and the series tests still hold for every brand. A warm accent sits among the palette's orange, gold and red, so without this no fire-coloured accent could pass them. For Beacon, slot 2 (orange) becomes blue and slot 8 (red) becomes teal; every other brand keeps the palette as it was. See [Chart series](docs/principles.md#chart-series).
