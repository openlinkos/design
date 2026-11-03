// The page actions of a doc page: copy the page as Markdown, or open it in Claude or ChatGPT with
// the page's address prefilled. Plain DOM, like the rest of the theme's browser code (it never
// imports Vue): the toolbar is put at the top of the doc content, and re-pointed on every
// navigation, because VitePress re-renders the page around it. Hydration (which settles late,
// under Suspense) drops a node put in before it is done, so the bar heals itself: a body observer
// re-inserts it whenever it goes missing.

import type { Router } from 'vitepress';
import { PAGE_ACTIONS } from '../config/strings.js';
import { localeOfPath } from '../shared/lang.js';

/** Claude prefills the composer from `q` (documented); ChatGPT does the same, unofficially. */
const CLAUDE = 'https://claude.ai/new?q=';
const CHATGPT = 'https://chatgpt.com/?q=';

/** The address of this page as Markdown: the page's own address with `.md` appended. */
const markdownUrl = (): string => {
  const path = location.pathname.replace(/\.html$/, '');
  return path.endsWith('/') ? `${path}index.md` : `${path}.md`;
};

export const installPageActions = (router?: Router): void => {
  if (typeof window === 'undefined' || typeof document === 'undefined') return;

  let bar: HTMLDivElement | undefined;
  let copyButton: HTMLButtonElement | undefined;
  let claudeLink: HTMLAnchorElement | undefined;
  let chatgptLink: HTMLAnchorElement | undefined;
  let resetTimer: ReturnType<typeof setTimeout> | undefined;

  const strings = () => PAGE_ACTIONS[localeOfPath(location.pathname)];

  const link = (className: string): HTMLAnchorElement => {
    const a = document.createElement('a');
    a.className = className;
    a.target = '_blank';
    a.rel = 'noopener noreferrer';
    return a;
  };

  const copy = async (button: HTMLButtonElement): Promise<void> => {
    const s = strings();
    const say = (text: string): void => {
      button.textContent = text;
      clearTimeout(resetTimer);
      resetTimer = setTimeout(() => {
        button.textContent = strings().copy;
      }, 2000);
    };
    try {
      const response = await fetch(markdownUrl());
      if (!response.ok) throw new Error(`HTTP ${response.status}`);
      await navigator.clipboard.writeText(await response.text());
      say(s.copied);
    } catch {
      say(s.copyFailed);
    }
  };

  const build = (): HTMLDivElement => {
    const s = strings();
    const div = document.createElement('div');
    div.className = 'ol-page-actions';
    div.setAttribute('aria-label', s.label);
    div.setAttribute('role', 'group');
    copyButton = document.createElement('button');
    copyButton.className = 'ol-page-action';
    copyButton.type = 'button';
    copyButton.textContent = s.copy;
    copyButton.addEventListener('click', () => {
      if (copyButton) void copy(copyButton);
    });
    claudeLink = link('ol-page-action');
    claudeLink.textContent = s.openClaude;
    chatgptLink = link('ol-page-action');
    chatgptLink.textContent = s.openChatGPT;
    div.append(copyButton, claudeLink, chatgptLink);
    return div;
  };

  const container = (): Element | null =>
    document.querySelector('.VPDoc .content .content-container');

  const sync = (): void => {
    try {
      const target = container();
      if (!target) return;
      bar ??= build();
      if (!bar.isConnected || bar.parentElement !== target) target.prepend(bar);
      const s = strings();
      const url = new URL(markdownUrl(), location.origin).href;
      const prompt = s.prompt.replace('{url}', url);
      if (copyButton) copyButton.textContent = s.copy;
      if (claudeLink) {
        claudeLink.textContent = s.openClaude;
        claudeLink.href = `${CLAUDE}${encodeURIComponent(prompt)}`;
      }
      if (chatgptLink) {
        chatgptLink.textContent = s.openChatGPT;
        chatgptLink.href = `${CHATGPT}${encodeURIComponent(prompt)}`;
      }
    } catch {
      /* never let the toolbar break the page */
    }
  };

  // The bar goes in only once the page has been quiet for a moment: VitePress hydrates under
  // Suspense, and a node put in while hydration is still patching is dropped again — so wait for
  // the tree to settle instead of racing it. A timer, not an animation frame: frames do not run
  // in a tab nobody is looking at.
  let timer: ReturnType<typeof setTimeout> | undefined;
  const settle = (): void => {
    clearTimeout(timer);
    timer = setTimeout(sync, 400);
  };
  new MutationObserver(settle).observe(document.body, { childList: true, subtree: true });

  if (router) {
    const previous = router.onAfterRouteChanged;
    router.onAfterRouteChanged = (to: string) => {
      previous?.(to);
      settle();
    };
  }
  settle();
};
