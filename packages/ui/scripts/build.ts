// Builds dist/ from tokens/ and src/, and regenerates docs/tokens.md:
//   ui.css            every layer: reset, tokens, base, layout, components, utilities
//   tokens.css        the token layer alone, for pages that only want the variables
//   tokens.json       every token resolved for light and dark mode (and per brand where it varies)
//   tokens.light.json and tokens.dark.json   the resolved tokens as DTCG trees (default brand)
//   icons.svg, icons.json, LICENSE-lucide.txt   the curated Lucide icons
//   fonts/            Geist and Geist Mono (variable woff2) and their licence, referenced by ui.css
// Usage: node scripts/build.ts

import { copyFileSync, mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';
import { ICONS } from '../src/icons.ts';
import { MODES, type ResolvedToken, resolveTokens, tokenCss } from '../src/tokens.ts';

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..');
const dist = join(pkg, 'dist');
const tokensDir = join(pkg, 'tokens');
const { version } = JSON.parse(readFileSync(join(pkg, 'package.json'), 'utf8')) as {
  version: string;
};

/** Cascade layers, lowest first. Unlayered app CSS always wins over all of them. */
const LAYERS = ['reset', 'tokens', 'base', 'layout', 'components', 'utilities'] as const;
/** Hand-written sources per layer, in cascade order. */
const SOURCES: Record<(typeof LAYERS)[number], string[]> = {
  reset: ['css/reset.css'],
  tokens: [],
  base: ['css/base.css'],
  layout: ['css/layout.css', 'css/site.css'],
  components: [
    'css/components/button.css',
    'css/components/form.css',
    'css/components/data.css',
    'css/components/chart.css',
    'css/components/display.css',
    'css/components/feedback.css',
    'css/components/container.css',
    'css/components/navigation.css',
    'css/components/overlay.css',
    'css/components/prose.css',
    'css/components/context.css',
  ],
  utilities: ['css/utilities.css'],
};

const indent = (text: string): string =>
  text
    .split('\n')
    .map((l) => (l ? `  ${l}` : l))
    .join('\n');
const block = (selector: string, decls: string[]): string =>
  `${selector} {\n${decls.map((d) => `  ${d}`).join('\n')}\n}`;

function tokenLayer(): string {
  const { root, brands, densities } = tokenCss(tokensDir);
  return [
    block(':root', ['color-scheme: light dark;', ...root]),
    ':root[data-theme="light"] {\n  color-scheme: light;\n}',
    ':root[data-theme="dark"] {\n  color-scheme: dark;\n}',
    ...Object.entries(brands).map(([id, decls]) => block(`[data-brand="${id}"]`, decls)),
    ...Object.entries(densities).map(([d, decls]) => block(`[data-density="${d}"]`, decls)),
  ].join('\n\n');
}

const layer = (name: string, body: string): string => `@layer ol.${name} {\n${indent(body)}\n}`;
const read = (file: string): string => readFileSync(join(pkg, 'src', file), 'utf8').trim();

rmSync(dist, { recursive: true, force: true });
mkdirSync(dist, { recursive: true });

const header = `/*! @openlinkos/ui ${version} | MIT | https://github.com/openlinkos/design */`;
const tokens = tokenLayer();
const order = `@layer ${LAYERS.map((l) => `ol.${l}`).join(', ')};`;
const layers = LAYERS.map((l) =>
  layer(l, l === 'tokens' ? tokens : SOURCES[l].map(read).join('\n\n')),
);
// Font faces and the global at-rules stay outside the layers; the font files sit next to the
// stylesheet.
const fonts = read('css/fonts.css');
const globalRules = read('css/global.css');
writeFileSync(
  join(dist, 'ui.css'),
  `${[header, order, fonts, globalRules, ...layers].join('\n\n')}\n`,
);
mkdirSync(join(dist, 'fonts'));
for (const file of ['Geist-Variable.woff2', 'GeistMono-Variable.woff2', 'LICENSE-geist.txt']) {
  copyFileSync(join(pkg, 'fonts', file), join(dist, 'fonts', file));
}
writeFileSync(
  join(dist, 'tokens.css'),
  `${[header, '@layer ol.tokens;', layer('tokens', tokens)].join('\n\n')}\n`,
);

// Resolved tokens for scripts, design tools and documentation.
const resolved = resolveTokens(tokensDir);
const flat = Object.fromEntries(
  resolved.map((t) => [
    t.name,
    {
      type: t.type,
      ...(t.description ? { description: t.description } : {}),
      ...(t.deprecated ? { deprecated: t.deprecated } : {}),
      light: t.css.light,
      dark: t.css.dark,
      ...(t.brands ? { brands: t.brands } : {}),
      ...(t.density ? { density: t.density } : {}),
    },
  ]),
);
writeFileSync(join(dist, 'tokens.json'), `${JSON.stringify(flat, null, 2)}\n`);
for (const mode of MODES) {
  const tree: Record<string, unknown> = {};
  for (const t of resolved) {
    let node = tree;
    for (const part of t.path.slice(0, -1)) {
      node[part] ??= {};
      node = node[part] as Record<string, unknown>;
    }
    node[t.path.at(-1) as string] = { $type: 'string', $value: t.css[mode] };
  }
  writeFileSync(join(dist, `tokens.${mode}.json`), `${JSON.stringify(tree, null, 2)}\n`);
}

// Icons.
const lucide = dirname(createRequire(import.meta.url).resolve('lucide-static/package.json'));
const lucideVersion = (
  JSON.parse(readFileSync(join(lucide, 'package.json'), 'utf8')) as { version: string }
).version;
function iconBody(name: string): string {
  let svg: string;
  try {
    svg = readFileSync(join(lucide, 'icons', `${name}.svg`), 'utf8');
  } catch {
    throw new Error(`Lucide ${lucideVersion} has no icon "${name}" (packages/ui/src/icons.ts)`);
  }
  const body = /<svg[^>]*>([\s\S]*)<\/svg>/.exec(svg.replace(/<!--[\s\S]*?-->/g, ''))?.[1];
  if (!body) throw new Error(`cannot read Lucide icon ${name}`);
  return body.replace(/>\s+</g, '><').trim();
}
const bodies = Object.fromEntries(ICONS.map((name) => [name, iconBody(name)]));
writeFileSync(
  join(dist, 'icons.svg'),
  `${[
    '<svg xmlns="http://www.w3.org/2000/svg">',
    `<!-- Lucide ${lucideVersion} (https://lucide.dev), ISC licence: see LICENSE-lucide.txt. Style with .ol-icon. -->`,
    ...ICONS.map((name) => `<symbol id="${name}" viewBox="0 0 24 24">${bodies[name]}</symbol>`),
    '</svg>',
  ].join('\n')}\n`,
);
writeFileSync(
  join(dist, 'icons.json'),
  `${JSON.stringify({ lucide: lucideVersion, viewBox: '0 0 24 24', icons: bodies }, null, 2)}\n`,
);
copyFileSync(join(lucide, 'LICENSE'), join(dist, 'LICENSE-lucide.txt'));

// The token reference, committed so it can be read on GitHub; the tests fail if it is stale.
writeFileSync(join(pkg, 'docs', 'tokens.md'), tokenReference(resolved));

console.log(
  `Built dist/ (${resolved.length} tokens, ${ICONS.length} icons, Lucide ${lucideVersion})`,
);

function deprecation(t: ResolvedToken): string {
  if (!t.deprecated) return '';
  return t.deprecated === true ? '**Deprecated.** ' : `**Deprecated:** ${t.deprecated} `;
}

function tokenReference(all: ResolvedToken[]): string {
  const groups = new Map<string, ResolvedToken[]>();
  for (const t of all) {
    const key =
      t.path[0] === 'color' && t.path.length > 2 ? `color.${t.path[1]}` : (t.path[0] ?? '');
    groups.set(key, [...(groups.get(key) ?? []), t]);
  }
  const titles: Record<string, string> = {
    color: 'Colour: surfaces, text and lines',
    'color.accent': 'Colour: brand accent',
    'color.success': 'Colour: success',
    'color.warning': 'Colour: warning',
    'color.danger': 'Colour: danger',
    'color.info': 'Colour: info',
    'color.series': 'Colour: chart series',
    space: 'Space',
    size: 'Size',
    radius: 'Radius',
    font: 'Font',
    'line-height': 'Line height',
    tracking: 'Letter spacing',
    text: 'Type presets',
    duration: 'Motion: duration',
    ease: 'Motion: easing',
    shadow: 'Elevation',
    z: 'Stacking',
    focus: 'Focus',
  };
  const cell = (v: string): string => `\`${v.replaceAll('|', '\\|')}\``;
  const lines = [
    '<!-- Generated by packages/ui/scripts/build.ts from packages/ui/tokens. Do not edit. -->',
    '',
    '# Token reference',
    '',
    `Every token of \`@openlinkos/ui\` ${version}, resolved for light and dark mode with the OpenLinkOS accent. Accent tokens take each brand's colours under \`data-brand\`; size tokens marked with a density change under \`data-density\`. The sources are the DTCG files in [\`tokens/\`](../tokens).`,
  ];
  for (const [key, tokens] of groups) {
    lines.push(
      '',
      `## ${titles[key] ?? key}`,
      '',
      '| Token | Light | Dark | Use |',
      '| --- | --- | --- | --- |',
    );
    for (const t of tokens) {
      const dark = t.css.dark === t.css.light ? '=' : cell(t.css.dark);
      const density = t.density
        ? ` (${Object.entries(t.density)
            .map(([d, v]) => `${d}: ${v}`)
            .join(', ')})`
        : '';
      lines.push(
        `| \`${t.name}\` | ${cell(t.css.light)}${density} | ${dark} | ${deprecation(t)}${t.description ?? ''} |`,
      );
    }
  }
  return `${lines.join('\n')}\n`;
}
