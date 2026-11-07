# Changelog

Changes to `@openlinkos/vitepress-theme`, newest first. It shares its version with `@openlinkos/ui`; releases before 0.7.0 are described in the git history.

## 0.8.0-rc.3

### Fixed

- `llms.txt` links a section's landing page (`guide/index.md`) at the address its Markdown is served at, `/guide/index.md`, instead of `/guide/.md`, which answered 404; `llms-full.txt` names the same address as the page's source. A sidebar link to a directory (`/guide/`) now finds that directory's `index.md`, so landing pages stay in their sidebar section instead of falling into the closing "Pages" list.
- Sidebars keyed by directory make one `llms.txt` section per top-level group, named by its text, as a single sidebar always did, instead of one section per directory named by its path (`guide/`). A page outside any group, such as a section's landing page, joins the group after it.
- The LinkOS Status link in the footer and the LinkOS menu points at `status.linkos.io`.

## 0.8.0-rc.2

### Fixed

- The published package depends on `@openlinkos/ui` by its version. 0.8.0-rc.1 went out with the monorepo's `workspace:*` range and could not be installed outside this repository; the release now publishes the tarball `pnpm pack` makes, which rewrites the range, and stops if a packed manifest still has one.

## 0.8.0-rc.1

### Added

- **A layer for agents** (`llms`, on by default): `/llms.txt` and `/llms-full.txt` per locale, built from the site's sidebars (one section per group, pages in sidebar order, home-layout pages left out), and every page served as its Markdown source at its own address with `.md` appended (`/guide/x.md`, `/zh/guide/x.md`, `/index.md`), in the dev server and in the build. English is the source of truth: the root files list the English pages, `/zh/llms.txt` and `/zh/llms-full.txt` the Chinese ones, and each index points to the other. `llms: false` turns the layer off; the build stops if the site's `public/` provides one of the files.
- **Page actions** on every doc page, at the top of the content and in the page's language: copy the page as Markdown (fetching the page's `.md`), open it in Claude (`claude.ai/new?q=`, documented by Anthropic) or in ChatGPT (`chatgpt.com/?q=`, an undocumented parameter) with `Read <address>.md and answer questions about it.` prefilled. Plain DOM, no Vue import; the strings live in the theme's string tables (`PAGE_ACTIONS`).
- **Landing-page components**, `@openlinkos/vitepress-theme/components`: `OlHero` (title, lead, actions, a `command` with a copy button, a media slot), `OlSteps` (a numbered timeline with media), `OlCast` (an asciinema recording: a poster is all a reader without JavaScript or with reduced motion sees; with both, the play button loads the site's own copy of asciinema-player and the recording starts on click), `OlLogos` (a row of names) and `OlBand` (the closing call to action). They ship as single-file components for the site's own Vite build to compile; `vue` is now a peer dependency (≥ 3.5) for that path. Their styles use `@openlinkos/ui` tokens only.
- The theme loads `@openlinkos/ui`'s design tokens on every page (`@openlinkos/ui` is a dependency) and sets `data-brand` in the head, so the components follow the brand's palette in light and dark.

### Changed

- The reserved files a site's `public/` must not provide now include `llms.txt`, `llms-full.txt`, `zh/llms.txt` and `zh/llms-full.txt`; the build stops, as before, when one of them clashes.

## 0.7.1

### Added

- `footer.note`: one line of the site's own in the footer, under the description in the brand block, as a string for both languages or `{ en, zh }`. The shared columns stay. A site of the master brand that is not the organization's own, such as linkos.org, has no attribution line; it says who runs it with the note (`{ en: 'The free public services are run by the LinkOS team', zh: 'LinkOS 免费公共服务由 LinkOS 团队运营' }`).
- `legal: { privacy, links }`: `privacy` points the privacy notice at the site's own (`{ en: '/privacy', zh: '/zh/privacy' }`) or leaves it out (`false`).

### Changed

- `legal` adds to the privacy notice instead of replacing it. The bottom row is the copyright, the privacy notice, then the site's links. The build stops, saying what to do, if a site's `legal` repeats the notice (an entry named "Privacy" or "隐私说明", or with its address): sites that listed it to keep it next to a licence or terms link now leave it out.
- The footer is on every page, pages with a sidebar included, beside the sidebar. VitePress hides it there; `footer: false` in a page's frontmatter still leaves it out.
- The family menu links to the site itself by paths, as the footer does: on linkos.org, LinkOS Mirrors is `/mirrors` and All services `/`, on linkos.io LinkOS home is `/`, on origin.openlinkos.com Origin is `/`, on beacon.openlinkos.com Beacon is `/`. They open in the same tab, without the external-link icon, and work on `vitepress preview`. The menu's label does not light up on those pages; the link inside does.
- The LinkOS description in `brands.json` says free public services: "The team behind OpenLinkOS and the LinkOS free public services", "OpenLinkOS 开源项目和 LinkOS 免费公共服务背后的团队". The services group stays 公共服务 in the menu and the footer.

### Upgrading from 0.7.0

- Remove the Privacy entry from `legal` (Origin, Beacon), or, with a privacy notice of the site's own, move it to `legal.privacy` (linkos.org).
- Move a "run by" line out of the locale `description` into `footer.note`.

## 0.7.0

### Added

- The Beacon brand (`brand: 'beacon'`): its favicons, app icons, web manifest, Open Graph image, README headers and brand kit, and Beacon in the family menu and the footer. Its colour is signal orange; its mark is the family ring opened at the top and the bottom around the fire, the signal going both ways along the wall.

### Changed

- The family menu and the footer have two groups: **Open-source projects** (开源项目) with LinkOS Mirrors, Origin and Beacon, and **Free public services** (公共服务) with LinkOS Mirrors and LinkOS Status, followed by the link to all services. Under the projects, LinkOS Mirrors links to its repository, openlinkos/registry-mirrors; under the services, to linkos.org.
- OpenLinkOS Agent is no longer listed in the family menu or the footer. Its brand files are still published under `/brand/agent/` with `brandKit`, so links to them keep working, and `brand: 'agent'` still works.
- `brand/brands.json` in `dist/`: `nav` is now a list of groups (empty for a brand that is not listed) instead of one group or `null`, and an entry may name its GitHub repository (`repo`).
