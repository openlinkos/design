# Components

Every component of `@openlinkos/ui`: what it is for, its markup, variants and states, what accessibility needs from the page, and how to use it well. All of them work without JavaScript. [`demo/components.html`](../demo/components.html) shows each one, [`demo/index.html`](../demo/index.html) an app page, [`demo/auth.html`](../demo/auth.html) a sign-in page and [`demo/site.html`](../demo/site.html) a service site; run `node demo/serve.ts` in `packages/ui` and open http://127.0.0.1:4321/demo/.

States use one convention everywhere: hover and press come from `:hover` and `:active`, keyboard focus from `:focus-visible` (one 2px ring, see [principles](principles.md#accessibility)), and the rest from ARIA attributes the page needs anyway: `aria-current`, `aria-pressed`, `aria-selected`, `aria-invalid`, `aria-busy`, `aria-disabled`, `aria-sort`. Styling by ARIA keeps the visual state and the accessible state from drifting apart.

## App shell {#app-shell}

The frame of an app: a sidebar on the shell colour, and one floating content panel that scrolls on its own, with a sticky top bar, the content, and a footer.

```html
<a class="ol-skip-link" href="#main">Skip to content</a>
<div class="ol-app">
  <aside class="ol-sidebar">
    <input type="checkbox" id="nav" class="ol-nav-toggle">
    <div class="ol-sidebar-head">
      <a class="ol-brand" href="/">…mark… Origin</a><span class="ol-brand-tag">Admin</span>
      <label for="nav" class="ol-btn ol-btn-ghost ol-btn-icon ol-nav-toggle-button" aria-label="Menu">…</label>
    </div>
    <nav class="ol-nav" aria-label="Main">
      <div class="ol-nav-group">
        <div class="ol-nav-label">Memory</div>
        <a class="ol-nav-item" href="/timeline" aria-current="page">…icon… Timeline</a>
      </div>
    </nav>
    <div class="ol-sidebar-foot">
      <fieldset class="ol-segmented ol-segmented-block"><legend class="ol-sr-only">Theme</legend>…</fieldset>
      <button class="ol-sidebar-account" type="button" popovertarget="account">
        <span class="ol-avatar ol-avatar-sm">A</span>
        <span class="ol-sidebar-account-text"><span class="ol-sidebar-account-name">admin</span><span class="ol-sidebar-account-meta">Administrator</span></span>
        …chevrons-up-down icon…
      </button>
      <div class="ol-menu ol-menu-above" id="account" popover>…</div>
    </div>
  </aside>
  <div class="ol-main">
    <header class="ol-topbar"><ol class="ol-breadcrumb">…</ol><div class="ol-topbar-actions">…</div></header>
    <main class="ol-content" id="main" tabindex="-1">…</main>
    <footer class="ol-footer">…</footer>
  </div>
</div>
```

- Below 860px the panel becomes the page, the sidebar becomes a bar, and the checkbox opens the menu, so navigation needs no script.
- The current navigation item is lifted onto the panel's surface with its icon in the brand colour.
- Mark the current page with `aria-current="page"`; `.ol-nav-count` shows a number after an item.
- Group navigation by task, at most about five items per group. Name groups with nouns.
- Keep the skip link first in the body.
- The foot of the sidebar holds the theme switch and the signed-in account. `.ol-sidebar-account` shows the avatar, the name and the role, and opens the account's menu above it: the account's own page, the [language](#language), and signing out, last. Settings of the app itself belong in its navigation, not in this menu.
- Moving between pages, the sidebar holds still and the panel cross-fades; see [motion](#motion).

## Workbench {#workbench}

The frame of a dense tool, such as a console or an admin UI, that uses the full width: `.ol-app-workbench` on `.ol-app`. The sidebar sits on the recessed colour and the content on the surface, divided by hairlines, and the page scrolls under a sticky top bar that also heads it. [`demo/workbench.html`](../demo/workbench.html) shows each layout.

```html
<a class="ol-skip-link" href="#main">Skip to content</a>
<div class="ol-app ol-app-workbench">
  <aside class="ol-sidebar" id="nav" popover aria-label="Sections">
    <div class="ol-sidebar-head"><a class="ol-brand" href="/" aria-label="Origin">…mark… <span>Origin</span></a><span class="ol-brand-tag">Hub</span></div>
    <nav class="ol-nav" aria-label="Sections">
      <div class="ol-nav-group">
        <a class="ol-nav-item" href="/sessions" title="Sessions" aria-current="page">…icon… <span class="ol-nav-text">Sessions</span><span class="ol-nav-count">1,042</span></a>
      </div>
    </nav>
    <div class="ol-sidebar-foot">
      <div class="ol-sidebar-status ol-status-success" title="Synced 2 minutes ago"><span class="ol-dot"></span><span>Synced 2 minutes ago</span></div>
      <button class="ol-sidebar-account" type="button" popovertarget="prefs">…</button>
      <div class="ol-menu ol-menu-above" id="prefs" popover>…theme, language, sign out…</div>
    </div>
  </aside>
  <div class="ol-main">
    <header class="ol-topbar">
      <button class="ol-btn ol-btn-ghost ol-btn-icon ol-btn-sm ol-nav-open" type="button" popovertarget="nav" aria-label="Menu">…menu icon…</button>
      <nav aria-label="Breadcrumb"><ol class="ol-breadcrumb"><li><a href="/sessions">Sessions</a></li></ol></nav>
      <h1 class="ol-topbar-title"><span class="ol-topbar-title-text">Recalls</span><span class="ol-topbar-count">6</span></h1>
      <div class="ol-topbar-actions">
        <form class="ol-search" role="search">…</form>
        <a class="ol-btn ol-btn-ghost ol-btn-icon ol-btn-sm ol-topbar-search-link" href="/search">…search icon… <span class="ol-sr-only">Search</span></a>
      </div>
    </header>
    <main class="ol-content" id="main" tabindex="-1">…</main>
  </div>
</div>
```

It has three window size classes, by the width of the viewport, as Material 3 has:

| Class | Width | The sidebar | The top bar |
| --- | --- | --- | --- |
| Wide | 1200px and up | 15rem, with labels, group names, and counts | breadcrumb, title, actions, search |
| Medium | 860 to 1200px | a rail of icons (`--ol-size-rail`), its labels as tooltips and for assistive technology | search becomes a link (`.ol-topbar-search-link`) |
| Narrow | 860px and less | a sheet from the start edge, opened by `.ol-nav-open` | the menu button, the page right above, the title |

The sidebar is a popover: shown in place where there is room, and on narrow screens opened in the top layer, with a backdrop, light dismiss, and Escape, all without script. A browser without popovers ignores the attribute and shows it in place. The page's heading is the `h1` in the top bar, after the breadcrumb of the pages above it, so a page never says its title twice.

Inside the content, a pane that does not fit folds away into a sheet or below the content, never out of reach. The layouts follow the content's width (container queries), not the viewport's:

- **`.ol-layout-filters`**, a list with its filters: an `.ol-sheet.ol-facets` and an `.ol-layout-main` with the `.ol-filterbar` and the list. From 52rem the filters stand on the left; narrower, the filter bar's `.ol-sheet-open` button opens them. Show the filters that are on as `.ol-filter-tag`s in the filter bar, links that remove them, so that what is filtered shows at every width.
- **`.ol-layout-list-detail`**, a list beside the item shown, such as a session's turns beside the turn: an `.ol-sheet` and the detail. From 60rem the list stands on the left, sticky under the top bar; narrower, a `.ol-sheet-open` button in the detail opens it.
- **`.ol-layout-supporting`**, main content with a side column of details: from 52rem the side column is on the right, 16 to 20rem wide; narrower, it follows the main content. Put an `.ol-stack` in each.
- **`.ol-layout-dashboard`**, two columns, 2:1, from 60rem; narrower, the main column comes first. Put the most telling panels first in each column.

```html
<div class="ol-layout-filters">
  <aside class="ol-sheet ol-facets" id="filters" popover aria-label="Filters">
    <div class="ol-sheet-head"><h2 class="ol-sheet-title">Filters</h2><button … popovertarget="filters" popovertargetaction="hide" aria-label="Close">…</button></div>
    <section class="ol-facet-group">
      <h2 class="ol-facet-head">Agent <a href="?">Clear</a></h2>
      <ul class="ol-facet-list"><li><a class="ol-facet" href="?" aria-current="true">
        <span class="ol-facet-check" aria-hidden="true">…check icon…</span><span class="ol-facet-label">codex</span><span class="ol-facet-count">12</span></a></li></ul>
    </section>
  </aside>
  <section class="ol-layout-main">
    <div class="ol-filterbar">
      <form class="ol-search" role="search">…</form>
      <div class="ol-cluster"><a class="ol-chip" href="?range=7d">7 days</a><a class="ol-chip" href="?" aria-current="true">30 days</a></div>
      <a class="ol-filter-tag" href="?" title="Remove this filter"><span>codex</span>…x icon…</a>
      <div class="ol-filterbar-end">…sort menu… <button class="ol-btn ol-btn-secondary ol-btn-sm ol-sheet-open" popovertarget="filters">…Filters <span class="ol-count">1</span></button></div>
    </div>
    <div class="ol-table-wrap"><table class="ol-table ol-table-compact ol-table-stack">…</table></div>
  </section>
</div>
```

- Every filter is a link to the same list with one parameter changed, so the list needs no script and every state has a URL.
- A facet counts what choosing it would leave, under every other filter but its own. Mark a chosen value `aria-current="true"`: it shows a checked box. Not `role="checkbox"`, since a link does not toggle with Space.
- Keep the content dense: compact tables, 13px text, panels in place of separate cards.

## Page structure {#page-structure}

`.ol-page-header` holds `.ol-page-heading` (`.ol-page-title`, `.ol-page-description`, and rarely `.ol-eyebrow` for a real parent, such as the session an event belongs to) and `.ol-page-actions`. `.ol-section` groups a region, with `.ol-section-header` (`-title`, `-description`, `-actions`). Layout primitives: `.ol-grid` with `-2`, `-3` or `-sidebar` (columns follow the container width), `.ol-stack` (vertical; `--ol-stack-gap`), `.ol-cluster` (wrapping row; `--ol-cluster-gap`), `.ol-split` (two ends). Sections side by side in a grid start level with each other.

Details of the object a page shows: `.ol-title-row` puts badges after a title; `<ul class="ol-page-meta">` lists facts with icons under it; `.ol-notices` stacks alerts between the header and the content.

- One `h1` per page, in `.ol-page-title`. Put at most one primary action in `.ol-page-actions`.
- No label above every heading, no metadata joined with middle dots, no arrows appended to link text.
- Separate sections with headings and space before reaching for frames.

## Sign-in {#sign-in}

A brand panel beside the form. The panel draws the brand's mark large as an origin point, with rings spreading from it at widening intervals, and states what the product is in one line.

```html
<main class="ol-auth">
  <aside class="ol-auth-aside">
    <div class="ol-auth-rings" aria-hidden="true"><img class="ol-rings-mark" src="logo-dark.svg" alt=""></div>
    <a class="ol-auth-brand" href="/">…mark… Origin</a>
    <p class="ol-auth-statement">Local-first, cross-agent memory for your AI coding agents.</p>
    <p class="ol-auth-meta">memory.example.com</p>
  </aside>
  <div class="ol-auth-body">
    <div class="ol-auth-card">
      <h1 class="ol-auth-title">Sign in</h1>
      <p>Enter the admin password of this hub.</p>
      <form>…</form>
    </div>
    <div class="ol-auth-foot"><span>Origin 0.2.0</span><a href="…">Documentation</a>…language menu…</div>
  </div>
</main>
```

- Without the aside, `.ol-auth` centres a framed card on the shell: use it for errors and other single-card pages.
- On narrow screens the panel becomes a band above the form, and the drawing scales down.
- The rings use the brand's mark colour (`--ol-color-mark-inverse`) and disappear in forced-colours mode. They animate in once, unless the user prefers reduced motion.
- At the origin goes the brand's own mark, its version for dark backgrounds, as `.ol-rings-mark` (an `<img>` or an inline `<svg>`, whose `.ol-brand-accent` or `.ol-brand-accent-line` shapes take the mark's colour). Without one, a ring and a dot stand for it, in the proportions of Origin's mark.
- The footer holds the version, links, and the [language menu](#language), opening above it (`.ol-menu-above`).
- The statement says what the product is; it is not a slogan.

## Service sites {#site}

One public page about one service, such as a mirror's usage page: a header with the brand, links to the page's sections and its tools; a hero; sections; and a footer. The hero is the page's one bold moment: a dark panel where the brand's mark sends rings across, and every few seconds one more ring leaves it.

```html
<header class="ol-site-header">
  <a class="ol-brand" href="/">…mark… LinkOS Mirrors</a>
  <nav class="ol-site-nav" aria-label="On this page"><a href="#start">Get started</a>…</nav>
  <div class="ol-site-tools">…language menu…<fieldset class="ol-segmented ol-segmented-icons">…</fieldset></div>
</header>
<main id="main">
  <section class="ol-hero" aria-labelledby="hero-title">
    <div class="ol-hero-rings" aria-hidden="true"><img class="ol-rings-mark" src="logo-dark.svg" alt=""></div>
    <div class="ol-hero-body">
      <a class="ol-status ol-status-success" href="#status"><span class="ol-dot ol-dot-live"></span>All mirrors are up</a>
      <h1 class="ol-hero-title" id="hero-title">Container images, pulled through a mirror</h1>
      <p class="ol-hero-lead">Docker Hub, GitHub, Quay, Google and Kubernetes registries through one address each.</p>
      <div class="ol-hero-actions"><a class="ol-btn ol-btn-primary ol-btn-lg" href="#start">Get started</a>…</div>
    </div>
  </section>
  <section class="ol-site-section" id="start" aria-labelledby="start-title">
    <div class="ol-site-section-header"><h2 class="ol-site-section-title" id="start-title">Get started</h2><p class="ol-site-section-description">…</p></div>
    …
  </section>
</main>
<footer class="ol-site-footer"><div>…brand, .ol-site-footer-note…</div><div class="ol-site-footer-links">…</div></footer>
```

- The header, sections and footer span the page and keep their content in one column, 68rem wide (`--ol-site-width`); `.ol-site-section-band` gives a section a band of colour. Grids inside a section follow the column's width, as in an app.
- The header is sticky; at the top of the page it sits on the page, and it takes its frame as the page scrolls, where the browser supports scroll-driven animations. Anchors land clear of it, and scroll there smoothly unless the user prefers reduced motion. A script may mark the section in view with `aria-current="true"` on its link.
- Below 860px the header takes two rows: the brand and the first tool (the language), then the section links, which scroll sideways and fade at the end, with the other tools after them.
- `.ol-hero-rings` draws the rings as on the [sign-in page](#sign-in). Put the brand's mark for dark backgrounds inside as `.ol-rings-mark` (an `<img>` or an inline `<svg>`); without one, a ring and a dot stand for it. On the dark panel, secondary and ghost buttons, links, focus and status pills take the panel's colours; the primary button keeps the brand's.
- Spend the boldness on the hero and nowhere else: sections are plain headings, text and the usual components. Say in the hero what the service does and what it costs, show its state, and offer the first step.
- The page works without script. A script can switch [tabs](#navigation), fill in a status, or convert an input; keep what it writes to text.

## Buttons {#buttons}

```html
<button class="ol-btn ol-btn-primary" type="button">Create token</button>
<a class="ol-btn ol-btn-secondary" href="/connect">Connect an agent</a>
<button class="ol-btn ol-btn-ghost ol-btn-icon" type="button" aria-label="Copy">…icon…</button>
```

| Variant | Use |
| --- | --- |
| `-primary` | The one main action of a view. |
| `-secondary` | Other actions. |
| `-soft` | Emphasis without the weight of a solid button. |
| `-ghost` | Low-emphasis and toolbar actions. |
| `-danger` | A confirmed destructive action. |
| `-danger-soft` | Entry points to destructive flows ("Forget…"). |
| `-link` | An action that reads as text. |

Sizes: `-xs` (24px, the minimum target), `-sm` (28px), default (32px; 36px in comfortable density), `-lg` (40px). `-icon` makes a square button and needs `aria-label`; `-block` fills the width; `.ol-btn-group` joins buttons.

States: `disabled` or `aria-disabled="true"` (for links) dims the button. `aria-busy="true"` replaces the label with a spinner and keeps the width; keep the label in the DOM so it is still announced.

- Label buttons with a verb and its object: "Create token", not "OK".
- Prefer leaving a button enabled and explaining a problem over disabling it without a reason.

## Forms {#forms}

```html
<div class="ol-field">
  <label class="ol-label" for="name">Name <span class="ol-required">*</span></label>
  <input class="ol-input" id="name" required aria-describedby="name-hint name-error" aria-invalid="true">
  <p class="ol-hint" id="name-hint">Lowercase letters and digits.</p>
  <p class="ol-field-error" id="name-error">…icon… Use lowercase letters.</p>
</div>
```

Controls: `.ol-input` (`-sm`, `-lg`, `-mono`), `.ol-select`, `.ol-textarea` (grows with its content where supported), `.ol-input-group` with `.ol-addon` or a button, `.ol-search` (leading icon), `.ol-checkbox`, `.ol-radio`, and `.ol-switch` (a checkbox with `role="switch"`), each inside a `<label class="ol-check">`. Group related checks in `<fieldset class="ol-fieldset">` with a `legend`. `.ol-form` stacks fields; `.ol-form-actions` ends a form; `.ol-toolbar` lays filters in a row (`.ol-grow` fills; a `.ol-check` sits level with the controls; an `.ol-section` after it gets space; as a panel's body or the last thing in its box it adds no space below).

States: hover darkens the edge, focus shows the ring, `aria-invalid="true"` turns the edge red, `disabled` greys the control, `readonly` tints it.

- Every control has a visible label; placeholders are examples, not labels.
- Put the error next to the field and say how to fix it. Do not rely on red alone: the error text and icon carry it.
- Control edges reach 3:1 against the page (WCAG 1.4.11), so the field is visible without its label.
- In forced-colours mode, checkboxes, radios, switches and selects fall back to the platform's own controls.

## Settings {#settings}

Edit a setting where it is used: the limits on the limits page, a site's links on the page about that site. Two layouts serve this.

`.ol-settings` lists one setting per row, its name and what it does at the start, its control at the end. In a panel it loses its own frame, and the panel's footer saves it: a note at the start, the buttons at the end.

```html
<form class="ol-panel" method="post">
  <div class="ol-panel-header"><h2 class="ol-panel-title">…icon… Default limits</h2></div>
  <div class="ol-settings">
    <div class="ol-setting">
      <div class="ol-setting-text"><label class="ol-setting-title" for="rate">Manifests a second</label>
        <p class="ol-setting-description" id="rate-hint">Per client address. 0 turns the limit off.</p></div>
      <div class="ol-setting-control"><input class="ol-input" id="rate" aria-describedby="rate-hint"></div>
    </div>
  </div>
  <div class="ol-panel-footer"><span>Changes apply at once.</span><button class="ol-btn ol-btn-primary ol-btn-sm">Save limits</button></div>
</form>
```

`.ol-form-section` splits a long form into parts, each with its name and purpose (`-header`, `-title`, `-description`) beside its fields (`-body`), or above them where the content is narrower than 48rem. A line divides the sections.

- Name the save button after what it saves ("Save limits"), and say in the footer when changes take effect.
- Keep a setting's description to one sentence about what changes; put the rest in the documentation.

## Tables {#tables}

```html
<div class="ol-table-wrap">
  <table class="ol-table">
    <thead><tr><th aria-sort="descending"><button type="button">Last push</button></th><th class="ol-num">Events</th></tr></thead>
    <tbody><tr aria-selected="true"><td>4 min ago</td><td class="ol-num">31,980</td></tr></tbody>
  </table>
</div>
```

Density: `-compact`, default, `-relaxed`. `-sticky` keeps the heading row visible. Cells: `.ol-num` (right-aligned, tabular figures), `.ol-actions` (shrinks to its buttons), `.ol-cell-title` and `.ol-cell-sub` (a name with a second line). Sortable headings carry `aria-sort` and a button; selected rows `aria-selected="true"`.

Rows in groups, such as a timeline by day: give each group its own `<tbody>`, headed by `<tr class="ol-table-group"><th colspan="…" scope="rowgroup">Today</th></tr>`.

A row that stands for something with a page of its own, such as an account: mark its name's link `.ol-row-link`, and the whole row becomes that link's target; other links and buttons in the row stay on top. Put a row's actions in a menu behind an icon button in the last cell, labelled with the row's name:

```html
<tr>
  <td><span class="ol-entity"><span class="ol-avatar ol-avatar-sm ol-series-3">CI</span><span class="ol-entity-text">
    <a class="ol-entity-title ol-row-link" href="/users/ci-runner">ci-runner</a><span class="ol-entity-sub">Build machines</span></span></span></td>
  …
  <td class="ol-actions"><button class="ol-btn ol-btn-ghost ol-btn-sm ol-btn-icon" popovertarget="row-ci" aria-label="Actions for ci-runner">…ellipsis icon…</button>
    <div class="ol-menu ol-menu-end" id="row-ci" popover>…</div></td>
</tr>
```

- Right-align numbers and keep units in the heading.
- On narrow screens tables scroll sideways; do not hide columns that carry meaning.
- A list read row by row, such as sessions, can restack instead: with `.ol-table-stack`, where its frame is narrower than 40rem, each row becomes its first cell on a line of its own and the other cells after it, each named by its column from `data-label` (`<td class="ol-num" data-label="Turns">12</td>`). Every column stays; nothing scrolls sideways. Leave `data-label` off a cell whose value names itself, such as an agent or a time.

## Stats {#stats}

`.ol-stats` holds `.ol-stat` items (`-label`, `-value`, `-meta`; `a.ol-stat` links to detail). `.ol-stat-row` sets the value beside a small chart, such as an `.ol-sparkline` of the last 30 days; an `.ol-stackbar` or `.ol-ratio` placed in the stat itself runs under the value. An `.ol-stat-icon` inside the label shows the figure's icon on an accent tint, or a tone with `.ol-tone-success`, `-warning` or `-danger`. Show three to five figures that answer "is everything all right?". `.ol-trend-up` and `.ol-trend-down` colour a change; also state the direction in words.

## Description lists, compact lists, feeds {#lists}

`.ol-dl` lays `dt`/`dd` pairs in two columns; `dt.ol-dl-sub` indents a sub-row under the one before; `.ol-dl-stack` puts each term above its value, for a narrow column such as a detail page's side panel. `.ol-list` is a compact list in one frame: each item a title (`.ol-list-title`, often a link, kept to one line) over a line of facts (`.ol-list-meta`). `.ol-list-row` puts the title on one line with a value (`.ol-list-value`), a badge or a quiet link; a meter can sit under it. Inside a panel the list loses its own frame.

```html
<ul class="ol-list">
  <li>
    <span class="ol-list-row"><a class="ol-list-title" href="/sessions?project=origin">origin</a><span class="ol-list-value">14,026 events</span></span>
    <meter class="ol-meter ol-meter-series" max="14026" value="14026">14,026 events</meter>
    <span class="ol-list-meta"><span>12 sessions</span><span>2026-10-23 22:39</span></span>
  </li>
</ul>
```

Use a compact list for a short "latest" or "most active" list beside other content; use a table when readers compare columns.

`.ol-feed` lists events: `.ol-feed-item` with `data-role` (`user`, `assistant`, `tool`, `system`) and optionally `data-highlight="true"`, an `.ol-feed-avatar`, `.ol-feed-meta`, and `.ol-feed-body` (pre-wrapped text; tool output in monospace).

## Badges, counts, avatars, entities {#badges}

`.ol-badge` with a tone (`-accent`, `-success`, `-warning`, `-danger`, `-info`; neutral by default), optionally `-solid`, `-outline`, `-square` (tags), or `-mono` (an identifier, such as an agent's name or a version); add `.ol-dot` for a status dot. `.ol-count` shows a number next to a label. `.ol-avatar` (`-sm`, `-lg`) shows initials, an icon, or an image; with `.ol-series-<n>` it takes a tint of that [series colour](principles.md#chart-series), so people in a list are told apart at a glance. Derive the slot from the name, such as a hash of it, so a person keeps their colour; the initials stay in the text colour (tested at 4.5:1).

`.ol-entity` is someone or something named: an avatar or icon, then `.ol-entity-text` with `.ol-entity-title` (often a link) over `.ol-entity-sub`, both kept to one line. Use it in table cells, a menu's header (`.ol-menu-header`) and a detail page's title row.

- A badge states a status or category in one or two words. Never make it the only way to act.

## Chips {#chips}

Small, muted notes in a flow of content, such as a command an agent ran or context it added. A chip is a `<span>`, a `<details>` that opens to show the whole text, or a link.

```html
<span class="ol-chip ol-chip-mono">…icon… <span class="ol-chip-label">/model opus</span><a class="ol-quiet-link" href="…" aria-label="Open the event">…icon…</a></span>

<details class="ol-chip ol-chip-mono">
  <summary>…icon… <span class="ol-chip-label">local-command-caveat: The messages below…</span></summary>
  <pre class="ol-chip-detail">The whole text, kept as written.</pre>
  <div class="ol-chip-foot"><a class="ol-quiet-link" href="…" aria-label="Open the event">…icon…</a></div>
</details>

<nav aria-label="Days"><ol class="ol-cluster">
  <li><a class="ol-chip" href="?day=2026-10-22" aria-current="true">Oct 22</a></li>
</ol></nav>
```

`.ol-chip-label` keeps to one line and ends with an ellipsis. Modifiers: `-mono` sets the label in monospace (commands, paths), `-accent` marks the chip that stands for the main item (a command where a prompt would be), `-lg` is larger. Open, a disclosure chip takes the full width, on a line of its own in a row of chips, and `.ol-chip-detail` scrolls after 20rem. Linked chips form a wrapping set, such as the days of a session; mark the current one `aria-current="true"` (or `"page"`). Group chips in an `.ol-cluster`.

- A chip is a note, not a control: one that opens is a disclosure, one that navigates is a link. For an action, use a button.
- Keep labels to the gist; the detail holds the rest.

## Status pills, uptime strips, steps {#status}

`.ol-status` states the overall state of a service in a few words: a dot in its tone (`-success`, `-warning`, `-danger`, `-info`; neutral without one), then the words. As a link it leads to the detail. `.ol-dot-live` sends a ring from the dot every few seconds, for a state that is being watched live.

```html
<a class="ol-status ol-status-success" href="#status"><span class="ol-dot ol-dot-live"></span>All mirrors are up</a>
```

`.ol-uptime` shows how something did over time, one cell per period, oldest first: `-ok`, `-degraded` or `-down`, and no class for a period without data. Cells keep to half a rem wide (`-lg`: taller, up to a rem), dim around the one the pointer is on, and rise one after another when the page draws them.

```html
<div class="ol-uptime" role="img" aria-label="Last 24 hours: up except at 14:00, when 96% of checks passed">
  <span class="ol-uptime-ok" title="13:00 100%"></span><span class="ol-uptime-degraded" title="14:00 96%"></span>…
</div>
```

- The strip is one image to assistive technology: its label says in words what it shows, and each cell's `title` gives its period and figure to pointer users. Put the figure (99.7% available) in text beside it.
- In forced-colours mode, periods with data take the text colour and periods that were down the highlight colour.

`.ol-steps` numbers what to do, in order, on a line that joins the numbers: each `<li>` starts with an `.ol-step-title` and holds what the step needs, such as a code block.

## Code and secrets {#code}

`.ol-code` frames a `<pre>`, optionally with `.ol-code-label` and a copy button (`.ol-copy`, wired by the app). The button sits in the label; without one it sits beside the code, which scrolls clear of it. `.ol-code-wrap` wraps long single lines, such as raw JSON, instead of scrolling. `.ol-quote` sets words quoted from a source; `.ol-text-pre` shows stored text whole, keeping line breaks. `.ol-mono` sets inline text in monospace; `.ol-kbd` shows a key. `.ol-secret` shows a value that is displayed once, selects entirely on click, and wraps anywhere.

## Charts {#charts}

Charts are SVG the app draws on the server, styled by classes: no script, no inline style, no colours in the markup. Series take the [chart palette](principles.md#chart-series): `.ol-series-1` to `-8` set `--ol-series` from `--ol-color-series-<n>` on a mark, a swatch, a meter, or a group of them. Slot 1 is the brand accent.

| Slot | Colour | Light | Dark |
| --- | --- | --- | --- |
| 1 | the brand accent | `accent-9` | `accent-10` |
| 2 | orange | `#eb6200` | `#f57323` |
| 3 | cyan | `#0f9cd0` | `#21b3ed` |
| 4 | pink | `#e04a99` | `#eb5ca4` |
| 5 | green | `#4ea200` | `#5bb832` |
| 6 | purple | `#c06ada` | `#c978e2` |
| 7 | gold | `#b88a00` | `#dca81c` |
| 8 | red | `#cc3430` | `#e94646` |

A stacked column chart:

```html
<figure class="ol-chart">
  <svg class="ol-chart-svg" viewBox="0 0 720 200" role="img" aria-labelledby="c-title c-desc" focusable="false">
    <title id="c-title">Events per day, last 30 days</title>
    <desc id="c-desc">15,449 events; the busiest day was Oct 19, with 6,294.</desc>
    <line class="ol-chart-grid" x1="40" x2="714" y1="93" y2="93"/>
    <text class="ol-chart-tick" x="34" y="96.5" text-anchor="end">4K</text>
    <g class="ol-chart-col">
      <title>Oct 19: 6,294, claude-code 6,000, codex 294</title>
      <rect class="ol-chart-hit" x="…" y="10" width="…" height="166"/>
      <rect class="ol-chart-bar ol-series-1" x="…" y="…" width="16" height="…"/>
      <path class="ol-chart-bar ol-series-2" d="…"/>
      <text class="ol-chart-label" x="…" y="192" text-anchor="middle">Oct 19</text>
    </g>
    <line class="ol-chart-axis" x1="40" x2="714" y1="176" y2="176"/>
  </svg>
  <figcaption class="ol-chart-caption">
    <ul class="ol-legend">
      <li><span class="ol-swatch ol-series-1" aria-hidden="true"></span>claude-code <span class="ol-legend-value">15,151</span></li>
      <li><span class="ol-swatch ol-series-2" aria-hidden="true"></span>codex <span class="ol-legend-value">298</span></li>
    </ul>
    <p class="ol-hint">15,449 events in the last 30 days; the busiest day was Oct 19, with 6,294.</p>
  </figcaption>
  <details class="ol-details ol-chart-table">
    <summary>Show the numbers</summary>
    <div class="ol-table-wrap"><table class="ol-table ol-table-compact">…</table></div>
  </details>
</figure>
```

Parts: `.ol-chart-grid` (gridlines) and `.ol-chart-axis` (the baseline) are hairlines that stay 1px however the SVG scales; `.ol-chart-tick` and `.ol-chart-label` are axis text in `fg-subtle`; `.ol-chart-bar` fills, `.ol-chart-line` strokes 2px, `.ol-chart-area` tints the area under a line (draw it first), and `.ol-chart-dot` fills with a ring in the surface colour, each in its series colour. A series that means good or bad takes `.ol-series-success`, `-warning` or `-danger` instead of a slot. `.ol-chart-col` groups a column: its transparent `.ol-chart-hit` band, the full height of the plot and wider than the bar, shades on hover, and its `<title>` shows the numbers. To let keyboard users step through the columns, give each group `tabindex="0"` and an `aria-label`; the band then shows the focus ring. Most charts need not: the table holds every number.

Legends: `<ul class="ol-legend">` with a `.ol-swatch` (a square; `.ol-swatch-line` for a line series), the series' name, and optionally its total in `.ol-legend-value`. `.ol-legend-item` lays out one swatch and name on its own, such as in a table cell.

Bars rise from the baseline when the page draws them, column after column where the browser can count siblings (`sibling-index()`); lines draw from the start, and dots follow. Reduced motion shows the chart at once.

**Fluid charts.** A chart whose width follows its column at every width draws its plot alone in the SVG, stretched to its box (`.ol-chart-fluid`, `preserveAspectRatio="none"`, its viewBox the plot itself), and its text as HTML beside it, so that the text stays at 11px however wide the chart is: `.ol-chart-plot` holds an `.ol-chart-y` with the labels from top to bottom, the SVG, and an `.ol-chart-x` with one cell per column, most of them empty. Lines and gridlines keep one pixel (`vector-effect: non-scaling-stroke`); round bar ends lightly, as they stretch with the plot. `.ol-chart-plot-sm` makes a short plot, for a histogram above a list. Inside a panel's body a chart drops its own frame.

```html
<div class="ol-chart-plot">
  <div class="ol-chart-y" aria-hidden="true"><span>20K</span><span>10K</span><span>0</span></div>
  <svg class="ol-chart-svg ol-chart-fluid" viewBox="0 0 720 100" preserveAspectRatio="none" role="img" aria-labelledby="…">…</svg>
  <div class="ol-chart-x" aria-hidden="true"><span>10/01</span><span></span>…<span>Today</span></div>
</div>
```

**Small charts.** `.ol-sparkline` is the shape of a figure over time beside it: an SVG with an `.ol-sparkline-area` and an `.ol-sparkline-line`, in the accent or the series set on it. `.ol-stackbar` is one bar split into parts in their series (`<rect class="ol-series-2" …/>`), as wide as their shares, such as entries by kind. `.ol-ratio` is a part of a whole against the largest whole of a list, with an `.ol-ratio-track`, an `.ol-ratio-whole`, and an `.ol-ratio-part`, such as recalls used of those made. Each is one image to assistive technology: give it `role="img"` and a label that says its numbers.

Meters in a series colour show one value against the largest of a list: `<meter class="ol-meter ol-meter-series" max="14026" value="526">526 events</meter>`, slot 1 unless a `.ol-series-<n>` says otherwise. They ignore `low`, `high` and `optimum`.

- Give every chart a title and a one-line summary (`<title>`, `<desc>` and the caption), a legend when it has two or more series, and its numbers in a table. Colour is never the only way to tell series apart.
- Assign slots in order and keep each with the thing it stands for, whatever else is shown. Past eight series, fold the smallest into "Other" or split the chart; never reuse a colour.
- Text never takes a series colour; the swatch beside it carries the series.
- Draw the SVG at about the size it is shown (a `viewBox` width near the column's width), so 11px axis text stays near 11px. Keep bars to about 16–24 units wide, round only their data end, and leave a 2-unit gap between stacked segments, where the surface shows through.
- A series that means good or bad (errors, passes) takes the status tones with an icon and words, not a series colour.
- In forced-colours mode, marks and swatches all take the text colour; the legend's words and the table carry the series.

## Prose {#prose}

Content written elsewhere, such as Markdown a person or an agent wrote, rendered to plain HTML. The elements need no classes.

```html
<div class="ol-prose ol-prose-sm">
  <h4>Rollback, done</h4>
  <p>The deploy script keeps the previous release; see <code>scripts/deploy.sh</code> and the <a href="…">runbook</a>.</p>
  <ol><li>Back up the release.</li><li>Deploy, then check health.</li></ol>
  <blockquote><p>Only the latest release is kept.</p></blockquote>
  <div class="ol-code"><div class="ol-code-label">bash</div><pre><code>./scripts/deploy.sh</code></pre></div>
  <div class="ol-prose-table"><table>
    <thead><tr><th>Step</th><th class="ol-align-end">Seconds</th><th>Notes</th></tr></thead>
    <tbody><tr><td>Back up</td><td class="ol-align-end">2</td><td class="ol-cell-wrap">A long note that wraps.</td></tr></tbody>
  </table></div>
</div>
```

`.ol-prose` sets text at 14px with a 1.7 line height (1.75 in Chinese); `.ol-prose-sm` sets it at 13px, for prose inside a feed, a list or a card. Blocks are spaced evenly, with more room before headings. Headings step down by level, and h4 to h6 stay at the prose's own size, so an app that shows a document inside a page can map its levels to h4 and below. Lists keep their markers, quotes get a rule, links are underlined, and inline code takes the kit's code style. A code block is a `.ol-code` (with a label) or a bare `<pre>`, which gets the same frame.

Wrap each table in `.ol-prose-table`, which scrolls sideways. Cells keep to one line so columns stay readable; `.ol-cell-wrap` lets a long cell wrap, at least 14rem wide. `.ol-align-start`, `-center` and `-end` align cells, here or anywhere.

- Render untrusted text with an escaping renderer: prose styles markup, it does not sanitise it.
- Keep a document's headings below the page's own: an `h1` in a message is not the page's title.

## Alerts, banners, toasts {#alerts}

```html
<div class="ol-alert ol-alert-warning">
  …icon…
  <div class="ol-alert-body"><p class="ol-alert-title">Title</p><p>What happened and what to do.</p></div>
</div>
```

Tones: neutral, `-info`, `-success`, `-warning`, `-danger`; `.ol-alert-actions` adds buttons. `.ol-banner` (`-warning`, `-danger`) spans the top of the page for a system-wide state.

`.ol-toaster` with `.ol-toast` items shows a transient confirmation, typically rendered by the server after a redirect. A tone (`-success`, `-info`, `-warning`, `-danger`) colours its icon. `.ol-toast-auto` leaves by itself after six seconds, with no script; pointing at it or focusing inside it holds it.

```html
<div class="ol-toaster" role="status"><div class="ol-toast ol-toast-success ol-toast-auto">…icon… Limits saved.</div></div>
```

`.ol-flash` briefly highlights a value that has just changed, such as a live figure: add it when the value changes and remove it on `animationend`, so it can flash again.

- Use `role="alert"` only for errors that need attention now; use `role="status"` for confirmations.
- Lead with what happened, then what to do. Pair colour with an icon and words.
- A toast that leaves holds only a confirmation. Anything the reader must read or act on, such as an error or a secret shown once, belongs in an alert on the page.

## Progress, skeletons, spinners, empty states {#progress}

Style the native `<progress class="ol-progress">` and `<meter class="ol-meter">` so assistive technology reads their values; meters colour themselves by `low`, `high` and `optimum`, and fill in from the start when the page draws them. `.ol-skeleton` holds space while content loads (mark the region `aria-busy="true"`); `.ol-spinner` shows pending work next to text.

`.ol-empty` explains an empty view: `.ol-empty-icon` (drawn at the centre of faint rings), `.ol-empty-title`, `.ol-empty-text`, and one action that fills it.

## Panels, cards, dividers, disclosures, folds {#containers}

`.ol-panel` frames grouped detail: `-header` (with `-title`), `-body`, `-footer`; `-danger` marks a destructive zone. A footer with buttons saves the panel: its note stays at the start and the buttons go to the end, on a quiet tint. `.ol-card` is one item of a collection, often a link that lifts towards the pointer; `.ol-card-row` lays a title and a badge, or facts, at both ends of a line, and the last row sits at the card's foot. The card a URL's `#fragment` points at is outlined in the accent and scrolls clear of the top bar. `.ol-divider` separates content, with optional text. `<details class="ol-details">` reveals secondary detail; several `<details class="ol-accordion">` with the same `name` open one at a time. Disclosures, accordions and folds open and close smoothly where the browser can animate to their content's height.

A fold puts a run of steps behind one summary line that says what is inside: counts by kind, and how they went.

```html
<details class="ol-fold">
  <summary>
    <span class="ol-fold-title">…icon… 14 tool calls</span>
    <span class="ol-fold-meta"><span>Grep 4</span><span>Bash 3</span><span>4 more</span></span>
    <span class="ol-fold-meta"><span class="ol-tone-success">…icon… 12<span class="ol-sr-only"> succeeded</span></span><span class="ol-tone-danger">…icon… 2<span class="ol-sr-only"> failed</span></span></span>
    <span class="ol-fold-end">2 messages</span>
  </summary>
  <ol class="ol-fold-body">…</ol>
</details>
```

`.ol-fold-meta` lays out facts, each an icon and a number or a few words; `.ol-fold-end` goes to the end of the line. The tone utilities `.ol-tone-accent`, `-success`, `-warning`, `-danger` and `-info` colour text and icons; pair them with an icon and words, here words for screen readers.

- Frame only what belongs together. A page of identical framed boxes reads as noise.
- Say on the summary line of a fold what it holds, so readers can decide whether to open it. Leave it open when it is what the reader came for.

## Tabs, segmented controls, pagination, quiet links {#navigation}

`.ol-tabs` with `.ol-tab` links switches between URLs (mark the current one `aria-current="page"`). For panels switched by script, use the ARIA tabs pattern with the same classes: `<div class="ol-tabs" role="tablist">` holding `<button class="ol-tab" role="tab" aria-selected="true" aria-controls="…">`, and `.ol-tab-panel` with `role="tabpanel"`; the script moves `aria-selected` and handles the arrow keys. `.ol-pager` shows a summary and previous/next links.

`.ol-segmented` holds mutually exclusive buttons (`aria-pressed`) or links (`aria-current="true"`), such as a theme switch; `-block` fills the width of its container. Group the options in a `<fieldset>` with a visually hidden `<legend>`, and put each label in a `<span>`. Where the options do not fit, one with an icon shows only its icon (screen readers still read the label), and one without ends its label with an ellipsis. `-icons` always shows only the icons, for a header; give each option an `aria-label` and a `title`.

- Label a theme switch Auto, Light and Dark (自动, 浅色, 深色): one short word each.

`.ol-quiet-link` is a small link, often only an icon, that stays out of the way until wanted, such as the source of every line in a feed: `<a class="ol-quiet-link" href="/event?id=…" aria-label="Open the event">…icon…</a>`. At rest its icon is `--ol-color-icon-subtle` (3:1) and its text `fg-subtle` (4.5:1); hover and focus fill it. It keeps a 24px target. An icon-only quiet link needs a text alternative, hidden text in `.ol-sr-only` or an `aria-label`; a `title` can add the id for pointer users.

## Menus, popovers, dialogs {#overlays}

```html
<button class="ol-btn ol-btn-secondary" popovertarget="more">More</button>
<div class="ol-menu" id="more" popover>
  <div class="ol-menu-label">Token laptop</div>
  <a class="ol-menu-item" href="…">…icon… View device</a>
  <hr class="ol-menu-separator">
  <form method="post"><button class="ol-menu-item ol-menu-item-danger">Revoke</button></form>
</div>
```

Menus and popovers use the Popover API: the browser opens them from `popovertarget`, closes them on Escape or an outside click, and puts them in the top layer. Where CSS anchor positioning is supported they open below their button, at least as wide as it (`.ol-menu-end` aligns to its end, `.ol-menu-above` opens above it, as at the foot of the sidebar) and flip when there is no room; elsewhere they open centred. They slide out of their button and close quicker than they open. `.ol-popover` holds richer content.

**Sheets.** `.ol-sheet` is a pane that slides in from the start edge (`.ol-sheet-end`: the end) above the page, for what a narrow screen has no room for beside the content: the navigation, a list's filters, the list of a list-detail layout. It is a popover too, so the backdrop, an outside click, and Escape close it, and focus returns to its button. Head it with `.ol-sheet-head`, an `.ol-sheet-title`, and a close button (`popovertargetaction="hide"`). The [workbench](#workbench) layouts show the same element in place where there is room, so a pane is written once.

Inside a menu: `.ol-menu-label` names a group of items, `.ol-menu-separator` divides groups, `.ol-menu-header` says who or what the menu is about (often an `.ol-entity`), and `.ol-menu-item-end` puts a shortcut or a current value at an item's end. The chosen one of several options gets a check mark at its end: mark it `aria-current="true"` in a plain menu of links or buttons, or `aria-checked="true"` on `role="menuitemradio"` in a `role="menu"` that a script drives with the arrow keys.

### Language menus {#language}

A language switch is a menu, the same in every app and site: its button shows the language now in use, and the menu lists every language in that language, with the current one checked.

```html
<button class="ol-btn ol-btn-ghost ol-btn-sm" type="button" popovertarget="language">…languages icon… 简体中文 …chevron-down icon…</button>
<div class="ol-menu" id="language" popover>
  <a class="ol-menu-item" href="?lang=zh-CN" lang="zh-CN" hreflang="zh-CN" aria-current="true">简体中文</a>
  <a class="ol-menu-item" href="?lang=en" lang="en" hreflang="en">English</a>
</div>
```

- Write each language in its own language (English, 简体中文), never translated into the page's language, and mark it with `lang` so it is read in that language.
- Show the current language on the button, not the other one: a button that says "English" on a Chinese page reads as a label, not as a switch.
- Put the switch where people look for it: in the account menu of an app, in the footer of a sign-in page, at the end of a site's header.
- A form that posts the choice works as well as links: use `<form method="post">` with a `<button class="ol-menu-item">` per language.

`<dialog class="ol-dialog">` (`-header`, `-title`, `-body`, `-footer`) opens with `command="show-modal" commandfor="id"` or `showModal()`, traps focus, and closes with Escape. Give it `aria-labelledby`.

- Menus hold actions on one object; put destructive items last, after a separator.
- Use a dialog only to confirm something consequential; prefer inline confirmation otherwise.

## Motion {#motion}

Motion explains change: where something came from, what just changed, that the page is alive. It never delays the reader, and none of it plays for users who prefer reduced motion. Durations and easings come from the motion tokens: 100 ms for hover and press, 160 ms for small things entering, 240 ms for larger ones, 400 ms for content and data arriving; the standard curve within the screen, a decelerating one for what enters, an accelerating one for what leaves.

| What moves | How |
| --- | --- |
| Moving between pages | `ui.css` opts same-origin navigations into cross-document view transitions: the sidebar holds still and the content panel cross-fades. To turn them off, add `@view-transition { navigation: none; }` to the app's stylesheet. |
| A page's content | Its first blocks rise into place one after another, 40 ms apart. |
| Data | Chart bars rise from the baseline, lines draw, meters and progress bars fill, uptime cells rise one after another. |
| Overlays | Menus and popovers slide out of their button; dialogs and their backdrop fade in; toasts rise in and, with `-auto`, leave. |
| Disclosures | Details, accordions and folds open to their content's height. |
| Changes | `.ol-flash` highlights a value that has just changed. |
| Life | The hero sends a ring from the brand's mark every few seconds; `.ol-dot-live` pings. |
| Response | Linked cards lift towards the pointer; uptime cells dim around the one pointed at; the site header takes its frame as the page scrolls. |

- Animate opacity and transforms, which the browser moves without laying out the page again. Nothing the reader is reading moves.
- Entrances run once, when the page draws them; loops are reserved for life (the hero, a live dot) and pending work (a spinner, a skeleton).
