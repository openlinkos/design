# AGENTS.md

Instructions for AI coding agents working in this repository. `CLAUDE.md` is a symlink to this file; edit `AGENTS.md` only. On Windows checkouts without symlink support, `CLAUDE.md` appears as a 9-byte text file containing `AGENTS.md`. Do not edit it.

## Project

The OpenLinkOS design system: the brand marks of OpenLinkOS (open-source projects such as Origin) and LinkOS (hosted services such as LinkOS Mirrors), the assets generated from them, and `@openlinkos/vitepress-theme`, the shared theme for every OpenLinkOS and LinkOS site. Sites get the brand, bilingual (English and Simplified Chinese) UI strings, language detection, metadata, and the bilingual coverage check from the theme.

## Commands

```bash
pnpm install
pnpm gen          # regenerate brand/out/ from brand/brands.json, brand/marks.ts, brand/wordmark.ts
pnpm build        # build packages/vitepress-theme into dist/ (tsc, plus the CSS and brand files)
pnpm test         # vitest: brand registry, contrast rules, generated assets, theme (unit and playground builds)
pnpm lint         # biome check
pnpm lint:fix     # biome check --write
pnpm docs:dev     # the playground site (playground/) with live reload; run pnpm build first
pnpm docs:build   # build the playground, including the bilingual coverage check
```

Read [BRAND.md](BRAND.md) before changing a mark, a colour, or the asset set, and [packages/vitepress-theme/README.md](packages/vitepress-theme/README.md) before changing the theme. The theme ships the generated assets, so run `pnpm build` after `pnpm gen`.

## Rules

- **Marks are geometry.** Brand marks and wordmarks are drawn on a 48-unit grid with round-capped strokes, as paths only: no `<text>`, filters, external references, or embedded fonts. Colours come from classes (`ink`, `accent`, `ink-f`, `accent-f`), never inline, so one geometry renders every colourway.
- **Generated files are reproducible.** Never hand-edit `brand/out/`; change the source or the generator, run `pnpm gen`, and commit both. CI fails if the committed output differs from a fresh run on Linux or Windows.
- **The marks are not MIT-licensed.** The code is MIT; the OpenLinkOS and LinkOS names and marks are governed by the brand guidelines on openlinkos.com/brand.
- **Use English** for code, comments, docs, and commit messages. Keep `README.zh-CN.md` in sync with `README.md`.
- **Ask before adding dependencies**, and pin every dependency to an exact version.
- **No deployment or server configuration** in this repository.

## Releases

`@openlinkos/vitepress-theme` is published to npm by `.github/workflows/release.yml`. To release, bump `version` in `packages/vitepress-theme/package.json`, commit, then tag `v<version>` and push the tag. A maintainer approves the run in the `npm` environment; npm trusted publishing attaches provenance. Never publish from a workstation.

## Git

- Maintainers commit directly to `master`. External contributions come in through pull requests.
- Run `pnpm lint` and `pnpm test` (and `pnpm gen` when the brand changes) before every commit, then commit and push once a change is complete and verified.
- Use Conventional Commits in English: `<type>(<scope>): <summary>`, where type is one of `feat | fix | docs | refactor | test | perf | build | ci | chore`.
- Do not add attribution trailers such as `Co-Authored-By`. The project's `.claude/settings.json` blanks Claude Code's commit and PR attribution to enforce this.
