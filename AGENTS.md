# AGENTS.md

Instructions for AI coding agents working in this repository. `CLAUDE.md` is a symlink to this file; edit `AGENTS.md` only. On Windows checkouts without symlink support, `CLAUDE.md` appears as a 9-byte text file containing `AGENTS.md`. Do not edit it.

## Project

The OpenLinkOS design system: the brand marks of OpenLinkOS (open-source projects such as Origin) and LinkOS (hosted services such as LinkOS Mirrors), the assets generated from them, and `@openlinkos/vitepress-theme`, the shared theme for every OpenLinkOS and LinkOS site. Sites get the brand, bilingual (English and Simplified Chinese) UI strings, language detection, metadata, and the bilingual coverage check from the theme.

## Commands

```bash
pnpm install
pnpm gallery      # round-one logo concepts → concepts/gallery.html
pnpm lint         # biome check
pnpm lint:fix     # biome check --write
```

## Rules

- **Marks are geometry.** Brand marks and wordmarks are drawn on a 48-unit grid with round-capped strokes, as paths only: no `<text>`, filters, external references, or embedded fonts. Colours come from classes (`ink`, `accent`, `ink-f`, `accent-f`), never inline, so one geometry renders every colourway.
- **Generated files are reproducible.** Never hand-edit generated assets; change the source or the generator and regenerate.
- **The marks are not MIT-licensed.** The code is MIT; the OpenLinkOS and LinkOS names and marks are governed by the brand guidelines on openlinkos.com/brand.
- **Use English** for code, comments, docs, and commit messages. Keep `README.zh-CN.md` in sync with `README.md`.
- **Ask before adding dependencies**, and pin every dependency to an exact version.
- **No deployment or server configuration** in this repository.

## Git

- Maintainers commit directly to `master`. External contributions come in through pull requests.
- Run `pnpm lint` before every commit, then commit and push once a change is complete and verified.
- Use Conventional Commits in English: `<type>(<scope>): <summary>`, where type is one of `feat | fix | docs | refactor | test | perf | build | ci | chore`.
- Do not add attribution trailers such as `Co-Authored-By`. The project's `.claude/settings.json` blanks Claude Code's commit and PR attribution to enforce this.
