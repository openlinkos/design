// Round six: a batch of concepts in the round-two style (monoline, round caps, one cyan accent,
// openness), avoiding what screening or review ruled out: a hexagon with a dot, a lifted edge,
// Chinese characters, and shapes that read as common UI icons.
// node scripts/round6.ts <outDir>  → <outDir>/r6-<id>.png and r6-sheet.png

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { arc, line, polar, polyline, round } from './geometry.ts';

type Pt = [number, number];
const INK = '#0f172a';
const ACCENT = '#0891b2';
const s = (cls: 'ink' | 'accent', d: string): string => `<path class="${cls}" d="${d}"/>`;
const dot = (cls: 'ink-f' | 'accent-f', [x, y]: Pt, r: number): string =>
  `<circle class="${cls}" cx="${round(x)}" cy="${round(y)}" r="${r}"/>`;
const ring = (cls: 'ink' | 'accent', [x, y]: Pt, r: number): string =>
  `<circle class="${cls}" cx="${round(x)}" cy="${round(y)}" r="${r}"/>`;
const mid = (a: Pt, b: Pt): Pt => [(a[0] + b[0]) / 2, (a[1] + b[1]) / 2];
const lerp = (a: Pt, b: Pt, t: number): Pt => [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];

/** Regular n-gon; `start` is the angle of vertex 0 in degrees. */
const ngon = (n: number, cx: number, cy: number, r: number, start: number): Pt[] =>
  Array.from({ length: n }, (_, i) => polar(cx, cy, r, start + (360 / n) * i));
/** Polygon outline with edge i (vertex i → i+1) left out. */
const openPoly = (v: Pt[], i: number): string =>
  polyline(Array.from({ length: v.length }, (_, k) => v[(i + 1 + k) % v.length]));

const hex = ngon(6, 24, 24, 18, -90);

export const round6: Record<string, { name: string; svg: () => string }> = {
  pentagon: {
    name: 'Open pentagon, node in the gap',
    svg: () => {
      const v = ngon(5, 24, 25.5, 19, -90);
      return s('ink', openPoly(v, 0)) + dot('accent-f', mid(v[0], v[1]), 4.5);
    },
  },
  octagon: {
    name: 'Open octagon, node in the gap',
    svg: () => {
      const v = ngon(8, 24, 24, 19, -112.5);
      return s('ink', openPoly(v, 1)) + dot('accent-f', mid(v[1], v[2]), 4.2);
    },
  },
  diamond: {
    name: 'Open diamond, node in the gap',
    svg: () => {
      const v = ngon(4, 24, 24, 19, -90);
      return s('ink', openPoly(v, 0)) + dot('accent-f', mid(v[0], v[1]), 4.5);
    },
  },
  stadium: {
    name: 'Open capsule, node in the gap',
    svg: () =>
      s('ink', `M33 13A9 9 0 0 0 15 13V35A9 9 0 0 0 33 35V24`) + dot('accent-f', [33, 13], 4.5),
  },
  spiral: {
    name: 'Hexagonal spiral ending in a node',
    svg: () => {
      const pts: Pt[] = [];
      for (let k = 0; k <= 9; k++) pts.push(polar(24, 24, 19 - k * 1.55, -90 + 60 * k));
      return s('ink', polyline(pts)) + dot('accent-f', pts[pts.length - 1], 3.6);
    },
  },
  notch: {
    name: 'Cell with a port: one vertex bitten in, node seated in the port',
    svg: () => {
      // Replace vertex 1 with an inward arc between points 35% along its two edges.
      const a = lerp(hex[1], hex[0], 0.35);
      const b = lerp(hex[1], hex[2], 0.35);
      const d =
        `M${round(b[0])} ${round(b[1])}` +
        [hex[2], hex[3], hex[4], hex[5], hex[0]]
          .map(([x, y]) => `L${round(x)} ${round(y)}`)
          .join('') +
        `L${round(a[0])} ${round(a[1])}A7 7 0 0 0 ${round(b[0])} ${round(b[1])}`;
      return s('ink', d) + dot('accent-f', lerp(hex[1], [24, 24], 0.06), 4);
    },
  },
  double: {
    name: 'Two nested open cells, node at the outer gap',
    svg: () => {
      const inner = ngon(6, 24, 24, 9.5, -90);
      return (
        s('ink', openPoly(hex, 0)) +
        s('accent', openPoly(inner, 0)) +
        dot('accent-f', mid(hex[0], hex[1]), 4)
      );
    },
  },
  segmented: {
    name: 'Cell of three chevrons, node in one joint',
    svg: () => {
      const g = 0.16;
      const parts = [[lerp(hex[5], hex[4], g), hex[5], hex[0], lerp(hex[0], hex[1], 1 - g - 0.6)]];
      const c1 = polyline([lerp(hex[1], hex[0], g), hex[1], hex[2], lerp(hex[2], hex[3], 1 - g)]);
      const c2 = polyline([lerp(hex[3], hex[2], g), hex[3], hex[4], lerp(hex[4], hex[5], 1 - g)]);
      const c3 = polyline([lerp(hex[5], hex[4], g), hex[5], hex[0], lerp(hex[0], hex[1], 1 - g)]);
      return s('ink', c2 + c3) + s('accent', c1) + (parts.length ? '' : '');
    },
  },
  halves: {
    name: 'Two half cells facing each other, node between',
    svg: () =>
      s('ink', polyline([lerp(hex[0], hex[5], 0.2), hex[5], hex[4], lerp(hex[3], hex[4], 0.2)])) +
      s('ink', polyline([lerp(hex[0], hex[1], 0.2), hex[1], hex[2], lerp(hex[3], hex[2], 0.2)])) +
      dot('accent-f', [24, 24], 4.5),
  },
  dumbbell: {
    name: 'Two small cells linked',
    svg: () => {
      const a = ngon(6, 14, 30, 9, -90);
      const b = ngon(6, 34, 18, 9, -90);
      return (
        s('ink', polyline(a, true)) +
        s('ink', polyline(b, true)) +
        s('accent', line(20.5, 26, 27.5, 22))
      );
    },
  },
  connector: {
    name: 'A link turning a corner, from a ring to a node',
    svg: () =>
      ring('ink', [13, 13], 5.5) +
      s('accent', `M13 18.5V29A6 6 0 0 0 19 35H31`) +
      dot('accent-f', [35.5, 35], 4.5),
  },
  'open-ring-pair': {
    name: 'Ring and open ring, interlinked',
    svg: () => ring('ink', [18, 24], 10) + s('accent', arc(30, 24, 10, 210, 510 - 60)),
  },
  arch: {
    name: 'Arch over a node: a gateway',
    svg: () => s('ink', `M10 40V24A14 14 0 0 1 38 24V40`) + dot('accent-f', [24, 30], 4.5),
  },
  'step-cell': {
    name: 'Cell with a stepped edge that could lock into the next',
    svg: () => {
      const a = lerp(hex[1], hex[2], 0.3);
      const b = lerp(hex[1], hex[2], 0.7);
      return (
        s('ink', polyline([b, hex[2], hex[3], hex[4], hex[5], hex[0], hex[1], a])) +
        s('accent', polyline([a, [a[0] - 6, a[1]], [b[0] - 6, b[1]], b]))
      );
    },
  },
};

const style =
  `<style>.ink,.accent{fill:none;stroke-width:4;stroke-linecap:round;stroke-linejoin:round}` +
  `.ink{stroke:${INK}}.accent{stroke:${ACCENT}}.ink-f{fill:${INK}}.accent-f{fill:${ACCENT}}</style>`;
const check = (inner: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 64 64"><rect x="-8" y="-8" width="64" height="64" fill="#fff"/>${style}${inner}</svg>`;

if (import.meta.main) {
  const out = process.argv[2] ?? 'concepts/check';
  mkdirSync(out, { recursive: true });
  const ids = Object.keys(round6);
  for (const id of ids) {
    writeFileSync(
      join(out, `r6-${id}.png`),
      new Resvg(check(round6[id].svg()), { fitTo: { mode: 'width', value: 512 } }).render().asPng(),
    );
  }
  const cell = 64;
  const cols = 7;
  const sheet =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cols * cell} ${Math.ceil(ids.length / cols) * cell}"><rect width="100%" height="100%" fill="#fff"/>${style}` +
    ids
      .map(
        (id, i) =>
          `<g transform="translate(${(i % cols) * cell + 8} ${Math.floor(i / cols) * cell + 8})">${round6[id].svg()}</g>`,
      )
      .join('') +
    '</svg>';
  writeFileSync(
    join(out, 'r6-sheet.png'),
    new Resvg(sheet, { fitTo: { mode: 'width', value: 1344 } }).render().asPng(),
  );
  console.log('rendered', ids.join(', '));
}
