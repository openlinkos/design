# Changelog

Changes to `@openlinkos/vitepress-theme`, newest first. It shares its version with `@openlinkos/ui`; releases before 0.7.0 are described in the git history.

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
