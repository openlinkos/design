// `@openlinkos/vitepress-theme/components`: the landing-page components (OlHero, OlSteps, OlCast,
// OlLogos, OlBand), shipped as Vue single-file components for the site's own Vite build to
// compile — the theme's compiled code never imports Vue, and these are compiled with the site.
//
// Register them in the site's theme:
//
//     import Theme from '@openlinkos/vitepress-theme';
//     import { OlHero, OlSteps, OlCast, OlLogos, OlBand } from '@openlinkos/vitepress-theme/components';
//
//     export default {
//       ...Theme,
//       enhanceApp(ctx) {
//         for (const [name, component] of Object.entries({ OlHero, OlSteps, OlCast, OlLogos, OlBand }))
//           ctx.app.component(name, component);
//         Theme.enhanceApp?.(ctx);
//       },
//     };

export { default as OlBand } from './OlBand.vue';
export { default as OlCast } from './OlCast.vue';
export { default as OlHero } from './OlHero.vue';
export { default as OlLogos } from './OlLogos.vue';
export { default as OlSteps } from './OlSteps.vue';
export type { OlLogo, OlStep } from './types.js';
