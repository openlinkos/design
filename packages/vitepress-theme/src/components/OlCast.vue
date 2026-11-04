<script setup lang="ts">
// OlCast: a terminal recording (asciinema). The poster is what a reader without JavaScript, or
// one who prefers reduced motion, always sees; with both, a play button loads the site's own copy
// of asciinema-player (the `player` address, UMD bundle exposing `AsciinemaPlayer`) and starts the
// recording. The recording itself is never autoplayed, and never for reduced motion.

import { useData } from 'vitepress';
import { computed, nextTick, onMounted, ref } from 'vue';
import { COMPONENTS } from '../config/strings.js';
import { localeOfLang } from '../shared/lang.js';

/** Players already loaded, by their script address, so several casts on a page share one load. */
const loaded = new Map<string, Promise<void>>();

const props = defineProps<{
  /** The recording, an asciicast file (`.cast`). */
  src?: string;
  /** The player's script, the UMD bundle that exposes `AsciinemaPlayer`; the site serves its own copy. */
  player?: string;
  /** The player's stylesheet, when the bundle needs one linked separately. */
  playerCss?: string;
  /** A static screenshot of the recording, shown without JavaScript and for reduced motion. */
  poster: string;
  /** What the poster shows; empty when it only decorates. */
  alt?: string;
  /** A line under the recording. */
  caption?: string;
}>();

const { lang } = useData();
const t = computed(() => COMPONENTS[localeOfLang(lang.value)]);
const host = ref<HTMLElement | null>(null);
const canPlay = ref(false);
const playing = ref(false);
const failed = ref(false);

const loadPlayer = (url: string): Promise<void> => {
  const existing = loaded.get(url);
  if (existing) return existing;
  const load = new Promise<void>((resolve, reject) => {
    const script = document.createElement('script');
    script.src = url;
    script.async = true;
    script.onload = () => resolve();
    script.onerror = () => reject(new Error(`could not load ${url}`));
    document.head.append(script);
    if (props.playerCss && !document.querySelector(`link[data-olc-cast-css]`)) {
      const link = document.createElement('link');
      link.rel = 'stylesheet';
      link.href = props.playerCss;
      link.setAttribute('data-olc-cast-css', '');
      document.head.append(link);
    }
  });
  loaded.set(url, load);
  return load;
};

const play = async (): Promise<void> => {
  if (!props.src || !props.player) return;
  try {
    await loadPlayer(props.player);
    playing.value = true;
    await nextTick();
    const globalThisPlayer = (
      window as unknown as {
        AsciinemaPlayer?: {
          create: (
            src: string,
            container: HTMLElement,
            options: Record<string, unknown>,
          ) => unknown;
        };
      }
    ).AsciinemaPlayer;
    if (!host.value || !globalThisPlayer) throw new Error('AsciinemaPlayer is missing');
    globalThisPlayer.create(props.src, host.value, {
      autoPlay: true,
      controls: true,
      fit: 'width',
      idleTimeLimit: 2,
    });
  } catch {
    playing.value = false;
    failed.value = true;
  }
};

// Decided after mount, not during render: the server cannot know the reader's motion
// preference, and a mismatch would break hydration.
onMounted(() => {
  const reduced = window.matchMedia?.('(prefers-reduced-motion: reduce)').matches ?? false;
  canPlay.value = !reduced && Boolean(props.src && props.player);
});
</script>

<template>
  <figure class="olc-cast">
    <div class="olc-cast-frame">
      <img v-if="!playing" class="olc-cast-poster" :src="poster" :alt="alt ?? ''" loading="lazy" />
      <div v-show="playing" ref="host" class="olc-cast-host" />
      <button
        v-if="canPlay && !playing"
        type="button"
        class="olc-cast-play"
        @click="play()"
      >
        {{ t.play }}
      </button>
      <span v-if="failed" class="olc-cast-error" role="status">{{ t.castError }}</span>
    </div>
    <figcaption v-if="caption" class="olc-cast-caption">{{ caption }}</figcaption>
  </figure>
</template>

<style scoped>
.olc-cast-frame {
  position: relative;
  overflow: hidden;
  border: 1px solid var(--ol-color-border);
  border-radius: var(--ol-radius-frame);
  background: var(--ol-color-bg-subtle);
  box-shadow: var(--ol-shadow-lg);
}

.olc-cast-poster,
.olc-cast-host {
  display: block;
  width: 100%;
}

.olc-cast-host {
  min-height: 12rem;
  margin: 0;
  padding: var(--ol-space-2);
}

.olc-cast-play {
  position: absolute;
  inset-block-end: var(--ol-space-4);
  inset-inline-end: var(--ol-space-4);
  display: inline-flex;
  height: var(--ol-size-control-md);
  align-items: center;
  justify-content: center;
  padding-inline: var(--ol-space-3);
  border: 1px solid var(--ol-color-accent-border);
  border-radius: var(--ol-radius-control);
  background: var(--ol-color-accent-solid);
  box-shadow: var(--ol-shadow-md);
  color: var(--ol-color-accent-on-solid);
  font-family: inherit;
  font-size: var(--ol-font-size-sm);
  font-weight: var(--ol-font-weight-medium);
  cursor: pointer;
}

.olc-cast-play:hover {
  background: var(--ol-color-accent-solid-hover);
}

.olc-cast-play:focus-visible {
  outline: var(--ol-focus-width) solid var(--ol-color-focus-ring);
  outline-offset: var(--ol-focus-offset);
}

.olc-cast-error {
  position: absolute;
  inset-block-end: var(--ol-space-4);
  inset-inline-start: var(--ol-space-4);
  padding: var(--ol-space-1-5) var(--ol-space-2-5);
  border: 1px solid var(--ol-color-danger-border);
  border-radius: var(--ol-radius-control);
  background: var(--ol-color-danger-bg);
  color: var(--ol-color-danger-text);
  font-size: var(--ol-font-size-xs);
}

.olc-cast-caption {
  margin-block-start: var(--ol-space-2);
  color: var(--ol-color-fg-subtle);
  font-size: var(--ol-font-size-sm);
  line-height: var(--ol-line-height-sm);
}

@media (prefers-reduced-motion: reduce) {
  .olc-cast-play {
    display: none;
  }
}
</style>
