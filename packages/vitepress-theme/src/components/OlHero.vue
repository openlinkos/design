<script setup lang="ts">
// OlHero: the first screen of a product page. The words on the left (title, lead, actions, one
// command with a copy button), media on the right (a recording, a screenshot); the media moves
// under the words on narrow screens. Styles use @openlinkos/ui tokens only.

import { useData } from 'vitepress';
import { computed, ref } from 'vue';
import { COMPONENTS } from '../config/strings.js';
import { localeOfLang } from '../shared/lang.js';

const props = defineProps<{
  /** The command shown under the actions with a copy button, such as a quickstart command. */
  command?: string;
}>();

const { lang } = useData();
const t = computed(() => COMPONENTS[localeOfLang(lang.value)]);
const copied = ref(false);

const copy = async (): Promise<void> => {
  if (!props.command) return;
  try {
    await navigator.clipboard.writeText(props.command);
    copied.value = true;
    setTimeout(() => {
      copied.value = false;
    }, 2000);
  } catch {
    /* the clipboard is unavailable (an insecure context); the command stays selectable */
  }
};
</script>

<template>
  <section class="olc-hero">
    <div class="olc-hero-body">
      <h1 class="olc-hero-title"><slot name="title" /></h1>
      <p class="olc-hero-lead"><slot name="lead" /></p>
      <div class="olc-hero-actions"><slot name="actions" /></div>
      <div v-if="command" class="olc-hero-command">
        <code class="olc-hero-command-code">{{ command }}</code>
        <button type="button" class="olc-hero-command-copy" @click="copy">
          {{ copied ? t.copied : t.copyCommand }}
        </button>
      </div>
      <p class="olc-hero-meta"><slot name="meta" /></p>
    </div>
    <div class="olc-hero-media"><slot name="media" /></div>
  </section>
</template>

<style scoped>
.olc-hero {
  display: grid;
  grid-template-columns: minmax(0, 1.15fr) minmax(0, 1fr);
  gap: var(--ol-space-10) var(--ol-space-10);
  align-items: center;
  padding-block: var(--ol-space-12) var(--ol-space-8);
}

.olc-hero-body {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--ol-space-5);
}

.olc-hero-title {
  margin: 0;
  font-size: clamp(var(--ol-font-size-3xl), 4.6vw, var(--ol-font-size-4xl));
  font-weight: var(--ol-font-weight-semibold);
  line-height: 1.12;
  letter-spacing: calc(var(--ol-tracking-tight) * 2);
  text-wrap: balance;
}

.olc-hero-lead {
  margin: 0;
  max-width: 34em;
  color: var(--ol-color-fg-muted);
  font-size: var(--ol-font-size-xl);
  line-height: var(--ol-line-height-xl);
  text-wrap: pretty;
}

.olc-hero-actions {
  display: flex;
  flex-wrap: wrap;
  gap: var(--ol-space-3);
}

/* Links in the actions read as buttons; a link marked quiet (`class="ghost"`) sits beside them. */
.olc-hero-actions :deep(a) {
  display: inline-flex;
  height: var(--ol-size-control-lg);
  align-items: center;
  justify-content: center;
  padding-inline: var(--ol-space-4);
  border: 1px solid color-mix(in oklab, var(--ol-color-accent-solid) 82%, #000);
  border-radius: var(--ol-radius-control);
  background: var(--ol-color-accent-solid);
  box-shadow: inset 0 1px 0 var(--ol-color-highlight), var(--ol-shadow-xs);
  color: var(--ol-color-accent-on-solid);
  font-size: var(--ol-font-size-md);
  font-weight: var(--ol-font-weight-medium);
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
}

.olc-hero-actions :deep(a:hover) {
  background: var(--ol-color-accent-solid-hover);
}

.olc-hero-actions :deep(a.ghost) {
  border-color: var(--ol-color-border-strong);
  background: var(--ol-color-surface);
  box-shadow: var(--ol-shadow-xs);
  color: var(--ol-color-fg);
}

.olc-hero-actions :deep(a.ghost:hover) {
  background: var(--ol-color-fill-hover);
}

.olc-hero-actions :deep(a:focus-visible) {
  outline: var(--ol-focus-width) solid var(--ol-color-focus-ring);
  outline-offset: var(--ol-focus-offset);
}

.olc-hero-meta {
  margin: 0;
  color: var(--ol-color-fg-subtle);
  font-size: var(--ol-font-size-sm);
  line-height: var(--ol-line-height-sm);
}

.olc-hero-command {
  display: flex;
  width: 100%;
  max-width: 36rem;
  align-items: stretch;
  gap: var(--ol-space-2);
}

.olc-hero-command-code {
  display: block;
  min-width: 0;
  flex: 1;
  overflow-x: auto;
  padding: var(--ol-space-2-5) var(--ol-space-3);
  border: 1px solid var(--ol-color-border);
  border-radius: var(--ol-radius-control);
  background: var(--ol-color-bg-subtle);
  color: var(--ol-color-fg);
  font-family: var(--ol-font-family-mono);
  font-size: var(--ol-font-size-sm);
  line-height: var(--ol-line-height-sm);
  white-space: nowrap;
}

.olc-hero-command-copy {
  flex: none;
  min-width: var(--ol-size-target-min);
  height: auto;
  padding-inline: var(--ol-space-2-5);
  border: 1px solid var(--ol-color-border);
  border-radius: var(--ol-radius-control);
  background: var(--ol-color-surface);
  color: var(--ol-color-fg-muted);
  font-family: inherit;
  font-size: var(--ol-font-size-xs);
  white-space: nowrap;
  cursor: pointer;
}

.olc-hero-command-copy:hover {
  background: var(--ol-color-fill-hover);
  color: var(--ol-color-fg);
}

.olc-hero-media {
  min-width: 0;
}

.olc-hero-media :deep(img),
.olc-hero-media :deep(video) {
  display: block;
  width: 100%;
  border: 1px solid var(--ol-color-border);
  border-radius: var(--ol-radius-frame);
  box-shadow: var(--ol-shadow-lg);
}

@media (max-width: 959px) {
  .olc-hero {
    grid-template-columns: minmax(0, 1fr);
    gap: var(--ol-space-8);
    padding-block: var(--ol-space-8) var(--ol-space-4);
  }
}
</style>
