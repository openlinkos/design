<script setup lang="ts">
// OlBand: the closing call to action of a page, a panel on the brand colour with one thing to do
// next. Slots: title, text, actions. Styles use @openlinkos/ui tokens only.
</script>

<template>
  <section class="olc-band">
    <h2 class="olc-band-title"><slot name="title" /></h2>
    <p class="olc-band-text"><slot name="text" /></p>
    <div class="olc-band-actions"><slot name="actions" /></div>
  </section>
</template>

<style scoped>
.olc-band {
  display: flex;
  margin-block-start: var(--ol-space-12);
  padding: var(--ol-space-10) clamp(var(--ol-space-6), 6vw, var(--ol-space-16));
  flex-direction: column;
  align-items: center;
  gap: var(--ol-space-4);
  border: 1px solid color-mix(in srgb, var(--ol-color-on-brand-panel) 12%, transparent);
  border-radius: var(--ol-radius-frame);
  background: var(--ol-color-brand-panel);
  box-shadow: var(--ol-shadow-lg);
  color: var(--ol-color-on-brand-panel);
  text-align: center;
}

.olc-band-title {
  margin: 0;
  font-size: var(--ol-font-size-2xl);
  font-weight: var(--ol-font-weight-semibold);
  line-height: var(--ol-line-height-2xl);
  text-wrap: balance;
}

.olc-band-text {
  margin: 0;
  max-width: 46em;
  color: var(--ol-color-on-brand-panel-muted);
  font-size: var(--ol-font-size-lg);
  line-height: var(--ol-line-height-lg);
  text-wrap: pretty;
}

.olc-band-actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--ol-space-3);
  margin-block-start: var(--ol-space-2);
}

/* Links in the actions read as buttons on the panel. */
.olc-band-actions :deep(a) {
  display: inline-flex;
  height: var(--ol-size-control-md);
  align-items: center;
  justify-content: center;
  padding-inline: var(--ol-space-3);
  border: 1px solid color-mix(in oklab, var(--ol-color-accent-solid) 82%, #000);
  border-radius: var(--ol-radius-control);
  background: var(--ol-color-accent-solid);
  box-shadow: inset 0 1px 0 var(--ol-color-highlight), var(--ol-shadow-xs);
  color: var(--ol-color-accent-on-solid);
  font-size: var(--ol-font-size-sm);
  font-weight: var(--ol-font-weight-medium);
  line-height: 1;
  text-decoration: none;
  white-space: nowrap;
}

.olc-band-actions :deep(a:hover) {
  background: var(--ol-color-accent-solid-hover);
}

.olc-band-actions :deep(a:focus-visible) {
  outline: var(--ol-focus-width) solid var(--ol-color-on-brand-panel);
  outline-offset: var(--ol-focus-offset);
}

/* A link marked quiet (`class="ghost"`) sits beside the first as a ghost. */
.olc-band-actions :deep(a.ghost) {
  border-color: color-mix(in srgb, var(--ol-color-on-brand-panel) 32%, transparent);
  background: transparent;
  box-shadow: none;
  color: var(--ol-color-on-brand-panel);
}

.olc-band-actions :deep(a.ghost:hover) {
  background: color-mix(in srgb, var(--ol-color-on-brand-panel) 10%, transparent);
}
</style>
