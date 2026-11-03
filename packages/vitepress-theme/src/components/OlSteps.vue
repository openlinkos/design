<script setup lang="ts">
// OlSteps: a numbered timeline of steps, each with an optional piece of media (a screenshot, an
// output) beside it, under it on narrow screens. Styles use @openlinkos/ui tokens only.

import type { OlStep } from './types.js';

defineProps<{ steps: OlStep[] }>();
</script>

<template>
  <ol class="olc-steps">
    <li v-for="(step, i) in steps" :key="step.title" class="olc-step">
      <div class="olc-step-marker" aria-hidden="true">{{ i + 1 }}</div>
      <div class="olc-step-body">
        <h3 class="olc-step-title">{{ step.title }}</h3>
        <p v-if="step.text" class="olc-step-text">{{ step.text }}</p>
      </div>
      <div v-if="step.media" class="olc-step-media">
        <img :src="step.media" :alt="step.alt ?? ''" loading="lazy" />
      </div>
    </li>
  </ol>
</template>

<style scoped>
.olc-steps {
  display: flex;
  margin: 0;
  padding: 0;
  flex-direction: column;
  gap: var(--ol-space-8);
  list-style: none;
}

.olc-step {
  display: grid;
  grid-template-columns: auto minmax(0, 1.1fr) minmax(0, 1fr);
  gap: var(--ol-space-5) var(--ol-space-5);
  padding-block-start: var(--ol-space-8);
  border-block-start: 1px solid var(--ol-color-border);
}

.olc-step:first-child {
  padding-block-start: 0;
  border-block-start: none;
}

.olc-step-marker {
  display: flex;
  width: var(--ol-size-control-md);
  height: var(--ol-size-control-md);
  flex: none;
  align-items: center;
  justify-content: center;
  border: 1px solid var(--ol-color-accent-border);
  border-radius: var(--ol-radius-full);
  background: var(--ol-color-accent-bg);
  color: var(--ol-color-accent-text);
  font-size: var(--ol-font-size-sm);
  font-weight: var(--ol-font-weight-semibold);
}

.olc-step-body {
  display: flex;
  min-width: 0;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--ol-space-2);
}

.olc-step-title {
  margin: 0;
  font-size: var(--ol-font-size-lg);
  font-weight: var(--ol-font-weight-semibold);
  line-height: var(--ol-line-height-lg);
}

.olc-step-text {
  margin: 0;
  max-width: 38em;
  color: var(--ol-color-fg-muted);
  line-height: var(--ol-line-height-md);
  text-wrap: pretty;
}

.olc-step-media {
  min-width: 0;
}

.olc-step-media img {
  display: block;
  width: 100%;
  border: 1px solid var(--ol-color-border);
  border-radius: var(--ol-radius-container);
  box-shadow: var(--ol-shadow-sm);
}

@media (max-width: 959px) {
  .olc-step {
    grid-template-columns: auto minmax(0, 1fr);
    gap: var(--ol-space-4) var(--ol-space-4);
  }

  .olc-step-media {
    grid-column: 2;
  }
}
</style>
