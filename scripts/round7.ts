// Round seven: still monoline, round caps and a cyan accent, but built from more specific
// gestures than "outline + dot": ligatures of the wordmark's own letters (O, L) and
// threading (one stroke passing over and under another).
// node scripts/round7.ts <outDir>  → <outDir>/r7-<id>.png and r7-sheet.png

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { arc, circlePath, line, polar, polyline, round } from './geometry.ts';

type Pt = [number, number];
const INK = '#0f172a';
const ACCENT = '#0891b2';
const s = (cls: 'ink' | 'accent', d: string, extra = ''): string =>
  `<path class="${cls}" d="${d}"${extra}/>`;
const dot = (cls: 'ink-f' | 'accent-f', [x, y]: Pt, r: number): string =>
  `<circle class="${cls}" cx="${round(x)}" cy="${round(y)}" r="${r}"/>`;
const ngon = (n: number, cx: number, cy: number, r: number, start: number): Pt[] =>
  Array.from({ length: n }, (_, i) => polar(cx, cy, r, start + (360 / n) * i));

/** A mask that hides a band of the under-passing stroke around (cx, cy) along direction (ux, uy). */
const gap = (id: string, [cx, cy]: Pt, [ux, uy]: Pt, len = 4.4): string => {
  const n = Math.hypot(ux, uy);
  const [dx, dy] = [(ux / n) * len, (uy / n) * len];
  return (
    `<mask id="${id}" maskUnits="userSpaceOnUse" x="-10" y="-10" width="68" height="68">` +
    '<rect x="-10" y="-10" width="68" height="68" fill="#fff"/>' +
    `<path d="M${round(cx - dx)} ${round(cy - dy)}L${round(cx + dx)} ${round(cy + dy)}" stroke="#000" stroke-width="7.6"/></mask>`
  );
};

const hex = ngon(6, 24, 24, 18, -90);

export const round7: Record<string, { name: string; svg: () => string }> = {
  'ol-tangent': {
    name: 'OL ligature: the O leans on the stem of the L',
    svg: () =>
      s('ink', circlePath(16.5, 27, 10.5)) +
      s(
        'accent',
        polyline([
          [31, 7],
          [31, 40],
          [41, 40],
        ]),
      ),
  },
  'hex-tail': {
    name: 'Hexagonal O whose right edge runs on into the foot of an L',
    svg: () => {
      const h = ngon(6, 21, 22, 15.5, -90);
      return (
        s('ink', polyline([h[1], h[0], h[5], h[4], h[3], h[2]])) +
        s('accent', polyline([h[1], h[2], [h[2][0], 41], [43, 41]]))
      );
    },
  },
  'l-to-o': {
    name: 'One stroke: down, along, and round into an O',
    svg: () =>
      s('ink', 'M9 7V33A8 8 0 0 0 17 41H22') + s('accent', `${arc(31, 32, 9, 180, 540 - 0.01)}`),
  },
  'hook-ring': {
    name: 'A ring hung on the foot of an L',
    svg: () => {
      // L: stem x=12 from 6 to 38, foot to x=40. Ring centred on the foot, threaded through it.
      const c: Pt = [30, 38];
      const r = 8;
      return (
        gap('u', [c[0] - r, 38], [1, 0]) +
        s(
          'ink',
          polyline([
            [12, 6],
            [12, 38],
            [40, 38],
          ]),
        ) +
        s('accent', circlePath(c[0], c[1] - 0.01, r), ' mask="url(#u)"')
      );
    },
  },
  threaded: {
    name: 'A cell with one thread passing through it, under then over',
    svg: () => {
      // The thread enters under the left edge and leaves over the right edge.
      const a: Pt = [5, 33];
      const b: Pt = [43, 15];
      const enter: Pt = [hex[4][0], 33 - ((hex[4][0] - 5) * 18) / 38];
      return (
        gap('t', enter, [0, 1]) +
        s('ink', polyline(hex, true)) +
        s('accent', line(a[0], a[1], b[0], b[1]), ' mask="url(#t)"')
      );
    },
  },
  keyring: {
    name: 'An open cell whose free end hooks a small ring',
    svg: () => {
      const v = ngon(6, 22, 26, 16, -90);
      const c: Pt = [36, 12];
      const r = 6.5;
      return (
        gap('k', [33.5, 17.2], [1, -0.55], 3.4) +
        s('ink', polyline([v[1], v[2], v[3], v[4], v[5], v[0], [33.5, 17.2]])) +
        s('accent', circlePath(c[0], c[1], r), '') +
        s('ink', line(30, 19.5, 33.5, 17.2))
      );
    },
  },
  twist: {
    name: 'A cell drawn as a band that crosses itself once at the top',
    svg: () => {
      const v = hex;
      const p0: Pt = [v[0][0] + 6, v[0][1] + 2];
      return (
        gap('w', [24, 6.2], [1, 0.58]) +
        s(
          'ink',
          polyline([
            p0,
            [v[0][0] - 3, v[0][1] + 0.5],
            v[5],
            v[4],
            v[3],
            v[2],
            v[1],
            [v[0][0] + 3, v[0][1] + 0.5],
            [v[0][0] - 6, v[0][1] + 2],
          ]),
          ' mask="url(#w)"',
        ) +
        ''
      );
    },
  },
  'ol-bridge': {
    name: 'O and L joined by a short bridge, node at the end of the L',
    svg: () =>
      s('ink', circlePath(15, 18, 9)) +
      s(
        'accent',
        polyline([
          [24, 18],
          [32, 18],
          [32, 38],
        ]),
      ) +
      dot('accent-f', [32, 39], 0.01) +
      s('accent', line(32, 38, 41, 38)),
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
  const ids = Object.keys(round7);
  for (const id of ids) {
    writeFileSync(
      join(out, `r7-${id}.png`),
      new Resvg(check(round7[id].svg()), { fitTo: { mode: 'width', value: 512 } }).render().asPng(),
    );
  }
  const cell = 64;
  const cols = 8;
  const sheet =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cols * cell} ${Math.ceil(ids.length / cols) * cell}"><rect width="100%" height="100%" fill="#fff"/>${style}` +
    ids
      .map(
        (id, i) =>
          `<g transform="translate(${(i % cols) * cell + 8} ${Math.floor(i / cols) * cell + 8})">${round7[
            id
          ]
            .svg()
            .replace(/id="(\w+)"/g, `id="$1${i}"`)
            .replace(/url\(#(\w+)\)/g, `url(#$1${i})`)}</g>`,
      )
      .join('') +
    '</svg>';
  writeFileSync(
    join(out, 'r7-sheet.png'),
    new Resvg(sheet, { fitTo: { mode: 'width', value: 1536 } }).render().asPng(),
  );
  console.log('rendered', ids.join(', '));
}
