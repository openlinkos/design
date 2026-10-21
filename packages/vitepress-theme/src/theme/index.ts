// `@openlinkos/vitepress-theme`: the default theme with the OpenLinkOS brand and language
// preference tracking. It must not import `vue`: VitePress aliases `vue` to its own copy only in
// the client build, so a direct import could load a second Vue during SSR.

import { cookieDomain } from 'virtual:openlinkos/client';
import type { Theme } from 'vitepress';
import DefaultTheme from 'vitepress/theme';
import { trackLanguageChoice } from './choice.js';
import './style.css';
import 'virtual:openlinkos/brand.css';

const theme: Theme = {
  extends: DefaultTheme,
  enhanceApp() {
    if (typeof window !== 'undefined' && typeof document !== 'undefined') {
      trackLanguageChoice(cookieDomain);
    }
  },
};

export default theme;
