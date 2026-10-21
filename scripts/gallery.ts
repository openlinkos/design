// Builds concepts/gallery.html: an offline preview of the current logo concepts in context.
// Run with `pnpm gallery`, then open the file in a browser.

import { writeFileSync } from 'node:fs';
import { Resvg } from '@resvg/resvg-js';
import { type Concept, concepts, ink, type MarkId, tile } from './concepts.ts';
import { wordmark } from './wordmark.ts';

interface Colors {
  ink: string;
  accent: string;
}

const style = (c: Colors, stroke: number): string =>
  `<style>.ink,.accent{fill:none;stroke-width:${stroke};stroke-linecap:round;stroke-linejoin:round}` +
  `.ink{stroke:${c.ink}}.accent{stroke:${c.accent}}.ink-f{fill:${c.ink}}.accent-f{fill:${c.accent}}</style>`;

const markSvg = (inner: string, c: Colors, stroke = 4): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${style(c, stroke)}${inner}</svg>`;

const tileSvg = (inner: string, c: Colors): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${style(c, 4)}` +
  `<rect width="48" height="48" rx="10.5" fill="${tile}"/>` +
  `<g transform="translate(7.2 7.2) scale(0.7)">${inner}</g></svg>`;

const SCALE = 1.45;
const lockupSvg = (inner: string, c: Colors, word: string, descriptor?: string): string => {
  const w = wordmark(word);
  const gap = 13;
  const x0 = 48 + gap;
  let width = x0 + w.width * SCALE + 4;
  let desc = '';
  if (descriptor) {
    const d = wordmark(descriptor);
    const dx = width + 8;
    desc = `<path class="accent" style="stroke-width:2.6" transform="translate(${dx} 35) scale(${SCALE})" d="${d.d}"/>`;
    width = dx + d.width * SCALE + 4;
  }
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${Math.ceil(width)} 48">${style(c, 4)}${inner}` +
    `<path class="ink" style="stroke-width:2.6" transform="translate(${x0} 35) scale(${SCALE})" d="${w.d}"/>${desc}</svg>`
  );
};

const dataSvg = (svg: string): string =>
  `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;
const dataPng = (svg: string, size: number): string => {
  const png = new Resvg(svg, {
    fitTo: { mode: 'width', value: size },
    font: { loadSystemFonts: false },
  })
    .render()
    .asPng();
  return `data:image/png;base64,${Buffer.from(png).toString('base64')}`;
};

const luminance = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string): string => {
  const [l1, l2] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return ((l1 + 0.05) / (l2 + 0.05)).toFixed(2);
};

const accentOf = (concept: Concept, id: MarkId, mode: 'light' | 'dark'): string =>
  concept.accents[id][mode];

const LABEL: Record<MarkId, { word: string; descriptor?: string; title: string }> = {
  openlinkos: { word: 'OpenLinkOS', title: 'OpenLinkOS' },
  origin: { word: 'Origin', title: 'Origin' },
  linkos: { word: 'LinkOS', descriptor: 'Mirrors', title: 'LinkOS Mirrors' },
};
const IDS: MarkId[] = ['openlinkos', 'origin', 'linkos'];

const section = (concept: Concept): string => {
  const light = (id: MarkId): Colors => ({
    ink: ink.light,
    accent: accentOf(concept, id, 'light'),
  });
  const dark = (id: MarkId): Colors => ({ ink: ink.dark, accent: accentOf(concept, id, 'dark') });
  const inner = (id: MarkId): string => concept.marks[id]();

  const marks = IDS.map(
    (id) => `
      <figure>
        <div class="pair">
          <div class="bg-light"><img width="96" height="96" src="${dataSvg(markSvg(inner(id), light(id)))}"></div>
          <div class="bg-dark"><img width="96" height="96" src="${dataSvg(markSvg(inner(id), dark(id)))}"></div>
          <div class="bg-light"><img width="96" height="96" src="${dataSvg(markSvg(inner(id), { ink: '#000', accent: '#000' }))}"></div>
          <div class="bg-light"><img width="96" height="96" src="${dataSvg(tileSvg(inner(id), dark(id)))}"></div>
          <div class="bg-light"><img class="avatar" width="96" height="96" src="${dataSvg(tileSvg(inner(id), dark(id)))}"></div>
        </div>
        <figcaption>${LABEL[id].title} — light · dark · mono · app icon · avatar</figcaption>
      </figure>`,
  ).join('');

  const small = IDS.map((id) => {
    const svgSmall = markSvg(inner(id), light(id), 5.5);
    const svgSmallDark = markSvg(inner(id), dark(id), 5.5);
    return `
      <figure>
        <div class="pair">
          <div class="bg-light px"><img width="16" height="16" src="${dataPng(svgSmall, 16)}"><img width="32" height="32" src="${dataPng(svgSmall, 32)}"><img class="zoom" width="64" height="64" src="${dataPng(svgSmall, 16)}"></div>
          <div class="bg-dark px"><img width="16" height="16" src="${dataPng(svgSmallDark, 16)}"><img width="32" height="32" src="${dataPng(svgSmallDark, 32)}"><img class="zoom" width="64" height="64" src="${dataPng(svgSmallDark, 16)}"></div>
        </div>
        <figcaption>${LABEL[id].title} — 16 px, 32 px, 16 px ×4 (rendered by resvg)</figcaption>
      </figure>`;
  }).join('');

  const lockups = IDS.map(
    (id) => `
      <div class="bg-light lockup"><img height="56" src="${dataSvg(lockupSvg(inner(id), light(id), LABEL[id].word, LABEL[id].descriptor))}"></div>
      <div class="bg-dark lockup"><img height="56" src="${dataSvg(lockupSvg(inner(id), dark(id), LABEL[id].word, LABEL[id].descriptor))}"></div>`,
  ).join('');

  const tab = (id: MarkId, mode: 'light' | 'dark'): string => `
      <div class="tab ${mode}"><img width="16" height="16" src="${dataPng(markSvg(inner(id), mode === 'light' ? light(id) : dark(id), 5.5), 16)}"><span>${LABEL[id].title} — ${id === 'origin' ? 'Local-first memory for AI agents' : 'Open infrastructure for the AI era'}</span><b>×</b></div>`;

  const nav = (id: MarkId, mode: 'light' | 'dark'): string => `
      <div class="nav ${mode}"><img width="24" height="24" src="${dataSvg(markSvg(inner(id), mode === 'light' ? light(id) : dark(id)))}"><strong>${LABEL[id].title}</strong><span class="grow"></span><span>Guide</span><span>Architecture</span><span>OpenLinkOS ▾</span><span>EN / 中文</span></div>`;

  const og = `
      <div class="og"><img height="92" src="${dataSvg(lockupSvg(inner('origin'), dark('origin'), 'Origin'))}"><p>Local-first, cross-agent memory for AI coding agents</p><small>origin.openlinkos.com</small></div>`;

  const readme = (mode: 'light' | 'dark'): string => `
      <div class="readme ${mode}"><img height="44" src="${dataSvg(lockupSvg(inner('origin'), mode === 'light' ? light('origin') : dark('origin'), 'Origin'))}"><p><b>Local-first, cross-agent personal memory for AI coding agents.</b></p><p class="badges"><span>CI passing</span><span>license MIT</span></p></div>`;

  const swatch = (name: string, kind: string, l: string, d: string, need: number): string => {
    const cl = Number(contrast(l, '#ffffff'));
    const cd = Number(contrast(d, '#1b1b1f'));
    const mark = (c: number): string => (c >= need ? '✓' : '✗');
    return `
      <div class="swatch"><i style="background:${l}"></i><i style="background:${d}"></i><span><b>${name}</b> ${kind}<br>${l} · ${cl}:1 on white ${mark(cl)}<br>${d} · ${cd}:1 on #1b1b1f ${mark(cd)}</span></div>`;
  };
  const swatches = [
    ...IDS.map((id) =>
      swatch(
        LABEL[id].title.split(' ')[0],
        'mark (≥3:1)',
        concept.accents[id].light,
        concept.accents[id].dark,
        3,
      ),
    ),
    ...IDS.map((id) =>
      swatch(
        LABEL[id].title.split(' ')[0],
        'text (≥4.5:1)',
        concept.text[id].light,
        concept.text[id].dark,
        4.5,
      ),
    ),
    swatch('Ink', '', ink.light, ink.dark, 4.5),
  ].join('');

  return `
  <section id="${concept.id}">
    <h2>${concept.name}</h2>
    <p class="idea">${concept.idea}</p>
    <h3>Marks</h3><div class="grid">${marks}</div>
    <h3>Small sizes</h3><div class="grid">${small}</div>
    <h3>Lockups</h3><div class="lockups">${lockups}</div>
    <h3>In context</h3>
    <div class="ctx">${tab('openlinkos', 'light')}${tab('origin', 'dark')}${tab('linkos', 'light')}</div>
    <div class="ctx">${nav('openlinkos', 'light')}${nav('origin', 'dark')}</div>
    <div class="ctx2">${og}${readme('light')}${readme('dark')}</div>
    <h3>Palette</h3><div class="swatches">${swatches}</div>
  </section>`;
};

const html = `<!doctype html>
<html lang="en"><head><meta charset="utf-8"><title>OpenLinkOS logo concepts · round 3</title>
<style>
  :root { font-family: Inter, "Segoe UI", system-ui, sans-serif; color: #0f172a; }
  body { margin: 0; padding: 32px 48px 96px; background: #f8fafc; }
  h1 { margin: 0 0 4px; } .lead { color: #475569; max-width: 900px; }
  nav.toc a { margin-right: 16px; }
  section { margin-top: 40px; padding: 28px 32px; background: #fff; border: 1px solid #e2e8f0; border-radius: 16px; }
  h2 { margin: 0; font-size: 26px; } h3 { margin: 28px 0 10px; font-size: 14px; text-transform: uppercase; letter-spacing: .08em; color: #64748b; }
  .idea { color: #334155; margin: 6px 0 0; }
  .grid { display: grid; gap: 16px; }
  figure { margin: 0; } figcaption { font-size: 12px; color: #64748b; margin-top: 6px; }
  .pair { display: flex; gap: 10px; flex-wrap: wrap; }
  .pair > div { padding: 14px; border-radius: 12px; display: flex; align-items: center; gap: 14px; }
  .bg-light { background: #ffffff; border: 1px solid #e2e8f0; } .bg-dark { background: #1b1b1f; border: 1px solid #1b1b1f; }
  .avatar { border-radius: 50%; }
  .px .zoom { image-rendering: pixelated; }
  .lockups { display: grid; grid-template-columns: 1fr 1fr; gap: 10px; }
  .lockup { padding: 22px; border-radius: 12px; }
  .ctx, .ctx2 { display: flex; gap: 14px; flex-wrap: wrap; margin-bottom: 14px; }
  .tab { display: flex; align-items: center; gap: 8px; padding: 8px 12px; width: 300px; border-radius: 10px 10px 0 0; font-size: 12px; }
  .tab span { flex: 1; white-space: nowrap; overflow: hidden; text-overflow: ellipsis; } .tab b { opacity: .5; font-weight: 400; }
  .tab.light { background: #fff; border: 1px solid #e2e8f0; color: #1f2937; } .tab.dark { background: #2b2d31; color: #e5e7eb; }
  .nav { display: flex; align-items: center; gap: 18px; padding: 0 22px; height: 64px; width: 640px; border-radius: 12px; font-size: 14px; }
  .nav strong { font-size: 16px; } .nav .grow { flex: 1; }
  .nav.light { background: #fff; border: 1px solid #e2e8f0; color: #3c3c43; } .nav.dark { background: #1b1b1f; color: #dfdfd6; }
  .og { width: 600px; height: 315px; background: ${tile}; border-radius: 12px; display: flex; flex-direction: column; justify-content: center; padding: 0 56px; box-sizing: border-box; color: #e2e8f0; }
  .og p { font-size: 20px; margin: 22px 0 8px; } .og small { color: #94a3b8; }
  .readme { width: 420px; padding: 24px; border-radius: 12px; font-size: 14px; }
  .readme.light { background: #fff; border: 1px solid #d0d7de; color: #1f2328; } .readme.dark { background: #0d1117; border: 1px solid #30363d; color: #e6edf3; }
  .badges span { display: inline-block; font-size: 11px; padding: 2px 6px; margin-right: 6px; border-radius: 3px; background: #555; color: #fff; }
  .swatches { display: grid; grid-template-columns: repeat(3, 1fr); gap: 12px; }
  .swatch { display: flex; gap: 8px; align-items: center; font-size: 12px; color: #334155; }
  .swatch i { width: 36px; height: 36px; border-radius: 8px; display: inline-block; }
</style></head>
<body>
  <h1>OpenLinkOS logo concepts · round 3</h1>
  <p class="lead">Direction B, refined. The system: a hexagonal cell on a 48-unit grid (4-unit margin, 4-unit round strokes, 5.5 at 16/32 px). The OpenLinkOS master mark is the cell opened on one side; products are closed cells with one inner glyph (Origin: the origin point); the LinkOS service line is the closed cell with the cube of the legacy LinkOS mark. B1–B4 vary only the master mark; the last section shows B2 with a blue master colour. Each palette lists mark colours (graphics need 3:1) and text colours for links and buttons (4.5:1).</p>
  <nav class="toc">${concepts.map((c) => `<a href="#${c.id}">${c.name}</a>`).join('')}</nav>
  ${concepts.map(section).join('')}
</body></html>`;

writeFileSync(new URL('../concepts/gallery.html', import.meta.url), html);
console.log('Wrote concepts/gallery.html');
