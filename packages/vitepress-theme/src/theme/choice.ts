// Records an explicit language choice: following a same-origin link into the other locale (the
// language menu, or any link the reader picks). Automatic redirects (location.replace) and
// back/forward navigation are not choices.

import { type Lang, localeOfPath, preferenceCookie } from '../shared/lang.js';

export const trackLanguageChoice = (domain: string | null): void => {
  // The locale on screen. VitePress's router handles clicks in a window capture listener and may
  // update the URL before document listeners run, so the locale is tracked here rather than
  // read from location at click time.
  let shown: Lang = localeOfPath(location.pathname);
  window.addEventListener('popstate', () => {
    shown = localeOfPath(location.pathname);
  });

  const onClick = (event: MouseEvent): void => {
    const target = event.target;
    if (!(target instanceof Element)) return;
    const link = target.closest('a[href]');
    const href = link?.getAttribute('href');
    if (!link || href == null) return;
    let url: URL;
    try {
      url = new URL(href, link.baseURI);
    } catch {
      return;
    }
    if (url.origin !== location.origin) return;
    const lang = localeOfPath(url.pathname);
    if (lang === shown) return;
    // biome-ignore lint/suspicious/noDocumentCookie: the Cookie Store API is missing from some supported browsers.
    document.cookie = preferenceCookie(lang, location, domain);
    const elsewhere =
      event.type === 'auxclick' ||
      event.ctrlKey ||
      event.metaKey ||
      event.shiftKey ||
      (link.getAttribute('target') ?? '_self') !== '_self';
    if (!elsewhere) shown = lang;
  };
  document.addEventListener('click', onClick, true);
  document.addEventListener('auxclick', onClick, true);
};
