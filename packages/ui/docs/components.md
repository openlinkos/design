# Components

Every component of `@openlinkos/ui`: what it is for, its markup, variants and states, what accessibility needs from the page, and how to use it well. All of them work without JavaScript. [`demo/components.html`](../demo/components.html) shows each one; run `node demo/serve.ts` in `packages/ui` and open http://127.0.0.1:4321/demo/components.html.

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
    <div class="ol-sidebar-foot">…</div>
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
    <div class="ol-auth-rings" aria-hidden="true"></div>
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
    <div class="ol-auth-foot">…</div>
  </div>
</main>
```

- Without the aside, `.ol-auth` centres a framed card on the shell: use it for errors and other single-card pages.
- On narrow screens the panel becomes a band above the form, and the drawing scales down.
- The rings use the brand's mark colour (`--ol-color-mark-inverse`) and disappear in forced-colours mode. They animate in once, unless the user prefers reduced motion.
- The statement says what the product is; it is not a slogan.

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

Controls: `.ol-input` (`-sm`, `-lg`, `-mono`), `.ol-select`, `.ol-textarea` (grows with its content where supported), `.ol-input-group` with `.ol-addon` or a button, `.ol-search` (leading icon), `.ol-checkbox`, `.ol-radio`, and `.ol-switch` (a checkbox with `role="switch"`), each inside a `<label class="ol-check">`. Group related checks in `<fieldset class="ol-fieldset">` with a `legend`. `.ol-form` stacks fields; `.ol-form-actions` ends a form; `.ol-toolbar` lays filters in a row (`.ol-grow` fills; a `.ol-check` sits level with the controls; an `.ol-section` after it gets space).

States: hover darkens the edge, focus shows the ring, `aria-invalid="true"` turns the edge red, `disabled` greys the control, `readonly` tints it.

- Every control has a visible label; placeholders are examples, not labels.
- Put the error next to the field and say how to fix it. Do not rely on red alone: the error text and icon carry it.
- Control edges reach 3:1 against the page (WCAG 1.4.11), so the field is visible without its label.
- In forced-colours mode, checkboxes, radios, switches and selects fall back to the platform's own controls.

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

- Right-align numbers and keep units in the heading.
- On narrow screens tables scroll sideways; do not hide columns that carry meaning.

## Stats {#stats}

`.ol-stats` holds `.ol-stat` items (`-label`, `-value`, `-meta`; `a.ol-stat` links to detail). An `.ol-stat-icon` inside the label shows the figure's icon on an accent tint, or a tone with `.ol-tone-success`, `-warning` or `-danger`. Show three to five figures that answer "is everything all right?". `.ol-trend-up` and `.ol-trend-down` colour a change; also state the direction in words.

## Description lists, compact lists, feeds {#lists}

`.ol-dl` lays `dt`/`dd` pairs in two columns; `dt.ol-dl-sub` indents a sub-row under the one before. `.ol-list` is a compact list in one frame: each item a title (`.ol-list-title`, often a link, kept to one line) over a line of facts (`.ol-list-meta`). `.ol-list-row` puts the title on one line with a value (`.ol-list-value`), a badge or a quiet link; a meter can sit under it. Inside a panel the list loses its own frame.

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

## Badges, counts, avatars {#badges}

`.ol-badge` with a tone (`-accent`, `-success`, `-warning`, `-danger`, `-info`; neutral by default), optionally `-solid`, `-outline`, `-square` (tags), or `-mono` (an identifier, such as an agent's name or a version); add `.ol-dot` for a status dot. `.ol-count` shows a number next to a label. `.ol-avatar` (`-sm`, `-lg`) shows initials, an icon, or an image.

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

## Code and secrets {#code}

`.ol-code` frames a `<pre>`, optionally with `.ol-code-label` and a copy button (`.ol-copy`, wired by the app). `.ol-code-wrap` wraps long single lines, such as raw JSON, instead of scrolling. `.ol-quote` sets words quoted from a source; `.ol-text-pre` shows stored text whole, keeping line breaks. `.ol-mono` sets inline text in monospace; `.ol-kbd` shows a key. `.ol-secret` shows a value that is displayed once, selects entirely on click, and wraps anywhere.

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

Parts: `.ol-chart-grid` (gridlines) and `.ol-chart-axis` (the baseline) are hairlines that stay 1px however the SVG scales; `.ol-chart-tick` and `.ol-chart-label` are axis text in `fg-subtle`; `.ol-chart-bar` fills, `.ol-chart-line` strokes 2px, and `.ol-chart-dot` fills with a ring in the surface colour, each in its series colour. `.ol-chart-col` groups a column: its transparent `.ol-chart-hit` band, the full height of the plot and wider than the bar, shades on hover, and its `<title>` shows the numbers. To let keyboard users step through the columns, give each group `tabindex="0"` and an `aria-label`; the band then shows the focus ring. Most charts need not: the table holds every number.

Legends: `<ul class="ol-legend">` with a `.ol-swatch` (a square; `.ol-swatch-line` for a line series), the series' name, and optionally its total in `.ol-legend-value`. `.ol-legend-item` lays out one swatch and name on its own, such as in a table cell.

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

Tones: neutral, `-info`, `-success`, `-warning`, `-danger`; `.ol-alert-actions` adds buttons. `.ol-banner` (`-warning`, `-danger`) spans the top of the page for a system-wide state. `.ol-toaster` with `.ol-toast` items shows a transient confirmation, typically rendered by the server after a redirect.

- Use `role="alert"` only for errors that need attention now; use `role="status"` for confirmations.
- Lead with what happened, then what to do. Pair colour with an icon and words.

## Progress, skeletons, spinners, empty states {#progress}

Style the native `<progress class="ol-progress">` and `<meter class="ol-meter">` so assistive technology reads their values; meters colour themselves by `low`, `high` and `optimum`. `.ol-skeleton` holds space while content loads (mark the region `aria-busy="true"`); `.ol-spinner` shows pending work next to text.

`.ol-empty` explains an empty view: `.ol-empty-icon` (drawn at the centre of faint rings), `.ol-empty-title`, `.ol-empty-text`, and one action that fills it.

## Panels, cards, dividers, disclosures, folds {#containers}

`.ol-panel` frames grouped detail: `-header` (with `-title`), `-body`, `-footer`; `-danger` marks a destructive zone. `.ol-card` is one item of a collection, often a link; the card a URL's `#fragment` points at is outlined in the accent and scrolls clear of the top bar. `.ol-divider` separates content, with optional text. `<details class="ol-details">` reveals secondary detail; several `<details class="ol-accordion">` with the same `name` open one at a time.

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

`.ol-tabs` with `.ol-tab` links switches between URLs (mark the current one `aria-current="page"`). For panels switched by script, use the ARIA tabs pattern instead. `.ol-segmented` holds mutually exclusive buttons (`aria-pressed`) or links (`aria-current="true"`), such as a theme switch; `-block` fills the width. `.ol-pager` shows a summary and previous/next links.

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

Menus and popovers use the Popover API: the browser opens them from `popovertarget`, closes them on Escape or an outside click, and puts them in the top layer. Where CSS anchor positioning is supported they open below their button (`.ol-menu-end` aligns to its end); elsewhere they open centred. `.ol-popover` holds richer content.

`<dialog class="ol-dialog">` (`-header`, `-title`, `-body`, `-footer`) opens with `command="show-modal" commandfor="id"` or `showModal()`, traps focus, and closes with Escape. Give it `aria-labelledby`.

- Menus hold actions on one object; put destructive items last, after a separator.
- Use a dialog only to confirm something consequential; prefer inline confirmation otherwise.
