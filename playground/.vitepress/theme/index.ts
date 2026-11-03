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
