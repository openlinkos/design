// Chinese defaults for strings that VitePress renders into the page from site-wide markdown
// options: custom container and GitHub alert titles, the code copy button, and header anchor
// labels. They apply only to pages under zh/.

import type { MarkdownOptions } from 'vitepress';
import { ZH_ALERTS, ZH_CONTAINERS, ZH_COPY_CODE } from './strings.js';

type MarkdownIt = Parameters<NonNullable<MarkdownOptions['config']>>[0];

/** The English labels in effect, so that only default titles are replaced. */
export interface EnglishLabels {
  /** Per alert type, the titles that count as the default rather than the author's own. */
  alerts: Record<string, string[]>;
  copyCode: string;
}

/**
 * English labels from the site's markdown options. VitePress 1.6 titles alerts with its built-in
 * labels and ignores `markdown.container`; both are accepted in case that changes.
 */
export const englishLabels = (options: MarkdownOptions | undefined): EnglishLabels => {
  const c = options?.container;
  const labels = (builtIn: string, configured: string | undefined): string[] =>
    configured ? [builtIn, configured] : [builtIn];
  return {
    alerts: {
      tip: labels('TIP', c?.tipLabel),
      note: labels('NOTE', c?.noteLabel),
      info: labels('INFO', c?.infoLabel),
      important: labels('IMPORTANT', c?.importantLabel),
      warning: labels('WARNING', c?.warningLabel),
      caution: labels('CAUTION', c?.cautionLabel),
      danger: labels('DANGER', c?.dangerLabel),
    },
    copyCode: options?.codeCopyButtonTitle || 'Copy Code',
  };
};

/** Whether a markdown-it env belongs to a Chinese page. */
export const isChinesePage = (env: unknown): boolean => {
  const path = (env as { relativePath?: unknown } | null)?.relativePath;
  return typeof path === 'string' && path.replaceAll('\\', '/').startsWith('zh/');
};

export const localizeMarkdown = (md: MarkdownIt, en: EnglishLabels): void => {
  const rules = md.renderer.rules;

  // Containers: `::: tip` without a title of its own gets the Chinese one.
  for (const [kind, label] of Object.entries(ZH_CONTAINERS)) {
    const name = `container_${kind}_open`;
    const render = rules[name];
    if (!render) continue;
    rules[name] = (tokens, idx, options, env, self) => {
      const token = tokens[idx];
      if (!isChinesePage(env) || token.info.trim().slice(kind.length).trim() !== '') {
        return render(tokens, idx, options, env, self);
      }
      const info = token.info;
      token.info = `${kind} ${label}`;
      try {
        return render(tokens, idx, options, env, self);
      } finally {
        token.info = info;
      }
    };
  }

  // GitHub alerts: the title is resolved while parsing, so replace it when it is the default.
  const alert = rules.github_alert_open;
  if (alert) {
    rules.github_alert_open = (tokens, idx, options, env, self) => {
      const meta = tokens[idx].meta as { title: string; type: string } | null;
      const zh = meta && ZH_ALERTS[meta.type];
      if (!meta || !zh || !isChinesePage(env) || !en.alerts[meta.type]?.includes(meta.title)) {
        return alert(tokens, idx, options, env, self);
      }
      tokens[idx].meta = { ...meta, title: zh };
      try {
        return alert(tokens, idx, options, env, self);
      } finally {
        tokens[idx].meta = meta;
      }
    };
  }

  // The copy button of code blocks.
  const fence = rules.fence;
  if (fence) {
    const english = `<button title="${en.copyCode}" class="copy">`;
    const chinese = `<button title="${ZH_COPY_CODE}" class="copy">`;
    rules.fence = (tokens, idx, options, env, self) => {
      const html = fence(tokens, idx, options, env, self);
      return isChinesePage(env) ? html.replace(english, () => chinese) : html;
    };
  }

  // Header anchors: `Permalink to "…"`.
  md.core.ruler.push('openlinkos_zh_permalinks', (state) => {
    if (!isChinesePage(state.env)) return;
    for (const token of state.tokens) {
      for (const child of token.children ?? []) {
        if (child.type !== 'link_open') continue;
        const match = /^Permalink to "([\s\S]*)"$/.exec(child.attrGet('aria-label') ?? '');
        // The title is the heading's source text; drop a trailing `{#id}` attribute block.
        const title = match?.[1].replace(/\s*\{[^{}]*\}\s*$/, '');
        if (title) child.attrSet('aria-label', `“${title}”的永久链接`);
      }
    }
  });
};
