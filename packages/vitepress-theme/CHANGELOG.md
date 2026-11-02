# Changelog

Changes to `@openlinkos/vitepress-theme`, newest first. It shares its version with `@openlinkos/ui`; releases before 0.7.0 are described in the git history.

## 0.7.0

### Added

- The Beacon brand (`brand: 'beacon'`): its favicons, app icons, web manifest, Open Graph image, README headers and brand kit, and Beacon in the family menu and the footer. Its colour, signal orange, is final; its mark is provisional and may change in a later release.

### Changed

- The family menu and the footer have two groups: **Open-source projects** (开源项目) with LinkOS Mirrors, Origin and Beacon, and **Free public services** (公益服务) with LinkOS Mirrors and LinkOS Status, followed by the link to all services. Under the projects, LinkOS Mirrors links to its repository, openlinkos/registry-mirrors; under the services, to linkos.org.
- OpenLinkOS Agent is no longer listed in the family menu or the footer. Its brand files are still published under `/brand/agent/` with `brandKit`, so links to them keep working, and `brand: 'agent'` still works.
- `brand/brands.json` in `dist/`: `nav` is now a list of groups (empty for a brand that is not listed) instead of one group or `null`, and an entry may name its GitHub repository (`repo`).
