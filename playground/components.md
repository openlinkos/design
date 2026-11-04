# Components

The landing-page components of the theme, registered by the site's theme file and used in its Markdown. Their styles use `@openlinkos/ui` tokens only, so every colour, size and radius follows the design system, in light and dark, at any width.

```ts
import Theme from '@openlinkos/vitepress-theme';
import { OlBand, OlCast, OlHero, OlLogos, OlSteps } from '@openlinkos/vitepress-theme/components';

export default {
  ...Theme,
  enhanceApp(ctx) {
    for (const [name, component] of Object.entries({ OlBand, OlCast, OlHero, OlLogos, OlSteps })) {
      ctx.app.component(name, component);
    }
    Theme.enhanceApp?.(ctx);
  },
};
```

## OlHero {#olhero}

The first screen: title, lead, actions, one command with a copy button, and media on the right (the media moves under the words below 960 px). Slots: `title`, `lead`, `actions`, `meta`, `media`; prop: `command`.

<OlHero command="pnpm add -D @openlinkos/vitepress-theme">
  <template #title>The OpenLinkOS VitePress theme</template>
  <template #lead>Brand, two languages, metadata and a layer for agents, for every site of the family.</template>
  <template #actions>
    <a href="/guide">Read the guide</a>
    <a class="ghost" href="https://github.com/openlinkos/design">GitHub</a>
  </template>
  <template #media>
    <img src="/cast-poster.svg" alt="A terminal where a service is probed from three locations" />
  </template>
</OlHero>

## OlSteps {#olsteps}

A numbered timeline, one row per step, each with an optional screenshot or output beside it (under it below 960 px). Prop: `steps`, a list of `{ title, text, media, alt }`.

<OlSteps :steps="[
  { title: 'Probed from where users are', text: 'Several locations check each service; the catalogue holds the targets.', media: '/cast-poster.svg', alt: 'A terminal where a service is probed from three locations' },
  { title: 'The alert wakes an agent', text: 'The alert carries its evidence, so the agent starts with the facts.' },
  { title: 'Fixed through the channel', text: 'The agent reaches the machine without holding a key; every command is recorded.' },
]" />

## OlCast {#olcast}

A terminal recording: the poster is what a reader without JavaScript, or one who prefers reduced motion, always sees; with both, the play button loads the player (`player`, the site's own copy of asciinema-player) and starts the recording. Props: `src`, `player`, `player-css`, `poster`, `alt`, `caption`.

<OlCast
  src="/demo.cast"
  player="https://unpkg.com/asciinema-player@3.17.0/dist/bundle/asciinema-player.min.js"
  player-css="https://unpkg.com/asciinema-player@3.17.0/dist/bundle/asciinema-player.css"
  poster="/cast-poster.svg"
  alt="A terminal where a service is probed from three locations"
  caption="A hand-written recording; a real site records its own."
/>

## OlLogos {#ollogos}

A row of names, as logos or as text when no image reads on both a light and a dark page. Props: `items`, a list of `{ name, src, href }`, and `label` for screen readers.

<OlLogos
  label="Works with these agent clients"
  :items="[
    { name: 'Claude Code', href: 'https://code.claude.com/docs/claude-code' },
    { name: 'Codex', href: 'https://developers.openai.com/codex/' },
    { name: 'Cursor', href: 'https://cursor.com/' },
    { name: 'any MCP client' },
  ]"
/>

## OlBand {#olband}

The closing call to action, one panel on the brand colour. Slots: `title`, `text`, `actions` (links; `class="ghost"` for a quiet one).

<OlBand>
  <template #title>Put the components on your page</template>
  <template #text>The theme carries the brand, the languages and the layer for agents; the components carry the first screen.</template>
  <template #actions>
    <a href="/guide">Read the guide</a>
    <a class="ghost" href="https://github.com/openlinkos/design">GitHub</a>
  </template>
</OlBand>
