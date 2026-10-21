// Round nine: the round-two Plug (open cell, node in the opening), varied to move away from
// the software marks it resembled (Caplo, FastLabel, IMEI.info, Esper): the opening moves,
// the cell turns, the node changes size. node scripts/round9.ts <outDir>

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { polar, polyline, round } from './geometry.ts';

type Pt = [number, number];
const INK = '#0f172a';
const ACCENT = '#0891b2';
const ngon = (n: number, cx: number, cy: number, r: number, start: number): Pt[] =>
  Array.from({ length: n }, (_, i) => polar(cx, cy, r, start + (360 / n) * i));
const s = (d: string): string => `<path class="ink" d="${d}"/>`;
const dot = ([x, y]: Pt, r: number): string =>
  `<circle class="accent-f" cx="${round(x)}" cy="${round(y)}" r="${r}"/>`;
const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const open = (v: Pt[], i: number): string =>
  polyline(Array.from({ length: v.length }, (_, k) => v[(i + 1 + k) % v.length]));

/** Open cell: hexagon starting at `start` degrees, edge `edge` removed, node of radius `r`. */
const plug = (start: number, edge: number, r: number, R = 18): string => {
  const v = ngon(6, 24, 24, R, start);
  return s(open(v, edge)) + dot(mid(v[edge], v[(edge + 1) % 6]), r);
};

export const round9: Record<string, { name: string; svg: () => string }> = {
  'left-gap': { name: 'Opening on the left edge', svg: () => plug(-90, 4, 4.5) },
  'lower-left-gap': { name: 'Opening on the lower-left edge', svg: () => plug(-90, 3, 4.5) },
  'flat-top': {
    name: 'Flat-top cell, opening on the upper-right edge',
    svg: () => plug(-60, 5, 4.5),
  },
  'flat-right': { name: 'Flat-top cell, opening on the right edge', svg: () => plug(-60, 0, 4.5) },
  stopper: {
    name: 'Node larger than the opening, seated like a stopper',
    svg: () => plug(-90, 0, 7.5, 17),
  },
  'lower-right-gap': { name: 'Opening on the lower-right edge', svg: () => plug(-90, 2, 4.5) },
};

const style =
  `<style>.ink{fill:none;stroke:${INK};stroke-width:4;stroke-linecap:round;stroke-linejoin:round}` +
  `.accent-f{fill:${ACCENT}}</style>`;
const check = (inner: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 64 64"><rect x="-8" y="-8" width="64" height="64" fill="#fff"/>${style}${inner}</svg>`;

if (import.meta.main) {
  const out = process.argv[2] ?? 'concepts/check';
  mkdirSync(out, { recursive: true });
  const ids = Object.keys(round9);
  for (const id of ids) {
    writeFileSync(
      join(out, `r9-${id}.png`),
      new Resvg(check(round9[id].svg()), { fitTo: { mode: 'width', value: 512 } }).render().asPng(),
    );
  }
  const cell = 64;
  const sheet =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${ids.length * cell} ${cell}"><rect width="100%" height="100%" fill="#fff"/>${style}` +
    ids
      .map((id, i) => `<g transform="translate(${i * cell + 8} 8)">${round9[id].svg()}</g>`)
      .join('') +
    '</svg>';
  writeFileSync(
    join(out, 'r9-sheet.png'),
    new Resvg(sheet, { fitTo: { mode: 'width', value: 1152 } }).render().asPng(),
  );
  console.log('rendered', ids.join(', '));
}
