<script setup lang="ts">
// OlLogos: a row of the names a page is for or works with (agent clients, tools), as logos or,
// without an image, as names. Styles use @openlinkos/ui tokens only.

import type { OlLogo } from './types.js';

defineProps<{
  items: OlLogo[];
  /** What the list is of, for screen readers; the names alone when not set. */
  label?: string;
}>();
</script>

<template>
  <ul class="olc-logos" :aria-label="label">
    <li v-for="item in items" :key="item.name" class="olc-logo">
      <a v-if="item.href" :href="item.href" class="olc-logo-link" rel="noopener noreferrer">
        <img v-if="item.src" :src="item.src" :alt="item.name" loading="lazy" />
        <span v-else>{{ item.name }}</span>
      </a>
      <template v-else>
        <img v-if="item.src" :src="item.src" :alt="item.name" loading="lazy" />
        <span v-else class="olc-logo-name">{{ item.name }}</span>
      </template>
    </li>
  </ul>
</template>

<style scoped>
.olc-logos {
  display: flex;
  margin: 0;
  padding: 0;
  flex-wrap: wrap;
  align-items: center;
  justify-content: center;
  gap: var(--ol-space-6) var(--ol-space-8);
  list-style: none;
}

.olc-logo {
  display: flex;
  min-width: 0;
}

.olc-logo-link {
  display: inline-flex;
  align-items: center;
}

.olc-logo img {
  display: block;
  height: var(--ol-size-icon-lg);
  width: auto;
  opacity: 0.72;
}

.olc-logo a:hover img {
  opacity: 1;
}

.olc-logo-name {
  color: var(--ol-color-fg-muted);
  font-size: var(--ol-font-size-md);
  font-weight: var(--ol-font-weight-medium);
}

.olc-logo-link > span {
  color: var(--ol-color-fg-muted);
  font-size: var(--ol-font-size-md);
  font-weight: var(--ol-font-weight-medium);
}

.olc-logo a:focus-visible {
  outline: var(--ol-focus-width) solid var(--ol-color-focus-ring);
  outline-offset: var(--ol-focus-offset);
  border-radius: var(--ol-radius-xs);
}
</style>
