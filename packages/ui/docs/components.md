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

`.ol-page-header` holds `.ol-page-heading` (`.ol-page-title`, `.ol-page-description`, and rarely `.ol-eyebrow` for a real parent, such as the session an event belongs to) and `.ol-page-actions`. `.ol-section` groups a region, with `.ol-section-header` (`-title`, `-description`, `-actions`). Layout primitives: `.ol-grid` with `-2`, `-3` or `-sidebar` (columns follow the container width), `.ol-stack` (vertical; `--ol-stack-gap`), `.ol-cluster` (wrapping row; `--ol-cluster-gap`), `.ol-split` (two ends).

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

- Right-align numbers and keep units in the heading.
- On narrow screens tables scroll sideways; do not hide columns that carry meaning.

## Stats {#stats}

`.ol-stats` holds `.ol-stat` items (`-label`, `-value`, `-meta`; `a.ol-stat` links to detail). An `.ol-stat-icon` inside the label shows the figure's icon on an accent tint, or a tone with `.ol-tone-success`, `-warning` or `-danger`. Show three to five figures that answer "is everything all right?". `.ol-trend-up` and `.ol-trend-down` colour a change; also state the direction in words.

## Description lists, feeds {#lists}

`.ol-dl` lays `dt`/`dd` pairs in two columns; `dt.ol-dl-sub` indents a sub-row under the one before. `.ol-feed` lists events: `.ol-feed-item` with `data-role` (`user`, `assistant`, `tool`, `system`) and optionally `data-highlight="true"`, an `.ol-feed-avatar`, `.ol-feed-meta`, and `.ol-feed-body` (pre-wrapped text; tool output in monospace).

## Badges, counts, avatars {#badges}

`.ol-badge` with a tone (`-accent`, `-success`, `-warning`, `-danger`, `-info`; neutral by default), optionally `-solid`, `-outline`, or `-square` (tags); add `.ol-dot` for a status dot. `.ol-count` shows a number next to a label. `.ol-avatar` (`-sm`, `-lg`) shows initials, an icon, or an image.

- A badge states a status or category in one or two words. Never make it the only way to act.

## Code and secrets {#code}

`.ol-code` frames a `<pre>`, optionally with `.ol-code-label` and a copy button (`.ol-copy`, wired by the app). `.ol-code-wrap` wraps long single lines, such as raw JSON, instead of scrolling. `.ol-quote` sets words quoted from a source; `.ol-text-pre` shows stored text whole, keeping line breaks. `.ol-mono` sets inline text in monospace; `.ol-kbd` shows a key. `.ol-secret` shows a value that is displayed once, selects entirely on click, and wraps anywhere.

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

## Panels, cards, dividers, disclosures {#containers}

`.ol-panel` frames grouped detail: `-header` (with `-title`), `-body`, `-footer`; `-danger` marks a destructive zone. `.ol-card` is one item of a collection, often a link. `.ol-divider` separates content, with optional text. `<details class="ol-details">` reveals secondary detail; several `<details class="ol-accordion">` with the same `name` open one at a time.

- Frame only what belongs together. A page of identical framed boxes reads as noise.

## Tabs, segmented controls, pagination {#navigation}

`.ol-tabs` with `.ol-tab` links switches between URLs (mark the current one `aria-current="page"`). For panels switched by script, use the ARIA tabs pattern instead. `.ol-segmented` holds mutually exclusive buttons (`aria-pressed`) or links (`aria-current="true"`), such as a theme switch; `-block` fills the width. `.ol-pager` shows a summary and previous/next links.

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
