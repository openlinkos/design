// Round four: the Hex/Node direction again, with variants that keep its look but move away from
// the marks a reverse image search matched in round two (an open hexagon with a dot in the gap,
// a hexagon with a centre dot, a cube in a hexagon).
// node scripts/round4.ts <outDir>  → <outDir>/r4-<id>.png (512 px, white) and r4-sheet.png.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { hexagon, line, polyline, round } from './geometry.ts';

const INK = '#0f172a';
const ACCENT = '#0891b2';
const s = (cls: 'ink' | 'accent', d: string): string => `<path class="${cls}" d="${d}"/>`;
const dot = (cls: 'ink-f' | 'accent-f', [x, y]: [number, number], r: number): string =>
  `<circle class="${cls}" cx="${round(x)}" cy="${round(y)}" r="${r}"/>`;
const mid = (a: [number, number], b: [number, number]): [number, number] => [
  (a[0] + b[0]) / 2,
  (a[1] + b[1]) / 2,
];
const lerp = (a: [number, number], b: [number, number], t: number): [number, number] => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
];

const H = hexagon(24, 24, 18);
const C: [number, number] = [24, 24];
const closedHex = (cls: 'ink' | 'accent', h = H): string => s(cls, polyline(h, true));

export const variants: Record<
  string,
  { group: 'master' | 'origin' | 'linkos'; name: string; svg: () => string }
> = {
  // --- Master: the cell is open and linked to the outside. -------------------------------
  'm-b1': {
    group: 'master',
    name: 'B1 · node and link (round two)',
    svg: () => {
      const m = mid(H[0], H[1]);
      return (
        s('ink', polyline([H[1], H[2], H[3], H[4], H[5], H[0]])) +
        s('accent', line(24, 24, m[0], m[1])) +
        dot('accent-f', C, 4.5) +
        dot('accent-f', m, 3.5)
      );
    },
  },
  'm-tether': {
    group: 'master',
    name: 'Tether · node outside the cell, linked through the opening',
    svg: () => {
      // A smaller cell (r 15) sits lower-left; the link leaves through the open edge to a node outside.
      const h = hexagon(21, 27, 15);
      const m = mid(h[0], h[1]);
      const out: [number, number] = [38.5, 9.5];
      return (
        s('ink', polyline([h[1], h[2], h[3], h[4], h[5], h[0]])) +
        s('accent', line(21, 27, out[0], out[1])) +
        dot('accent-f', out, 4.5) +
        dot('ink-f', [21, 27], 3.5) +
        (m ? '' : '')
      );
    },
  },
  'm-hook': {
    group: 'master',
    name: 'Hook · the outline turns inward and ends in the node',
    svg: () =>
      s('ink', polyline([H[1], H[2], H[3], H[4], H[5], H[0]])) +
      s('accent', polyline([H[0], lerp(H[0], H[1], 0.5), C])) +
      dot('accent-f', C, 4.5),
  },
  'm-cell': {
    group: 'master',
    name: 'Cell · a small solid cell in the opening instead of a dot',
    svg: () => {
      const m = mid(H[0], H[1]);
      return (
        s('ink', polyline([H[1], H[2], H[3], H[4], H[5], H[0]])) +
        `<path class="accent-f" d="${polyline(hexagon(m[0], m[1], 5.5), true)}"/>`
      );
    },
  },
  'm-split': {
    group: 'master',
    name: 'Split · two half cells, offset and joined by a link',
    svg: () => {
      const a = hexagon(21, 24, 16);
      const b = hexagon(27, 24, 16);
      return (
        s('ink', polyline([a[0], a[5], a[4], a[3]])) +
        s('accent', polyline([b[0], b[1], b[2], b[3]])) +
        s('ink', line(a[0][0], a[0][1], b[0][0], b[0][1]).replace(/^/, ''))
      );
    },
  },
  'm-gate': {
    group: 'master',
    name: 'Gate · the open edge swings inward as a link to the centre node',
    svg: () =>
      s('ink', polyline([H[1], H[2], H[3], H[4], H[5], H[0]])) +
      s('accent', line(H[1][0], H[1][1], 27, 19)) +
      dot('accent-f', C, 4.5),
  },
  // --- Origin: the origin point. -------------------------------------------------------
  'o-root': {
    group: 'origin',
    name: 'Root · centre node with a line down to the base vertex',
    svg: () =>
      closedHex('ink') + s('accent', line(24, 24, H[3][0], H[3][1])) + dot('accent-f', C, 5),
  },
  'o-open': {
    group: 'origin',
    name: 'Open cell · the master opening, with the node at the centre',
    svg: () => s('ink', polyline([H[1], H[2], H[3], H[4], H[5], H[0]])) + dot('accent-f', C, 5.5),
  },
  'o-axes': {
    group: 'origin',
    name: 'Axes · two axes meeting at the origin',
    svg: () =>
      closedHex('ink') +
      s(
        'accent',
        polyline([
          [24, 14],
          [24, 30],
          [36, 30],
        ]),
      ) +
      dot('accent-f', [24, 30], 3.6),
  },
  // --- LinkOS: the service line. -------------------------------------------------------
  'l-pair': {
    group: 'linkos',
    name: 'Pair · two nodes linked across the cell',
    svg: () =>
      closedHex('ink') +
      s('accent', line(16.5, 28.5, 31.5, 19.5)) +
      dot('accent-f', [16.5, 28.5], 4) +
      dot('accent-f', [31.5, 19.5], 4),
  },
  'l-chain': {
    group: 'linkos',
    name: 'Chain · a link of two half cells inside the cell',
    svg: () => {
      const a = hexagon(19, 24, 7);
      const b = hexagon(29, 24, 7);
      return (
        closedHex('ink') +
        s('accent', polyline([a[0], a[5], a[4], a[3]])) +
        s('accent', polyline([b[0], b[1], b[2], b[3]])) +
        s('accent', line(19, 24, 29, 24))
      );
    },
  },
  'l-mirror': {
    group: 'linkos',
    name: 'Mirror · the cell with its right half doubled, as a reflection',
    svg: () =>
      closedHex('ink') + s('accent', polyline([H[0], C, H[3]])) + dot('accent-f', [31, 24], 3.6),
  },
  'm-offset': {
    group: 'master',
    name: 'Offset edge · the upper-right edge is pulled outward as a separate accent stroke',
    svg: () => {
      // Shift the edge V0→V1 outward along its normal by 5.5 units.
      const nx = Math.cos((-60 * Math.PI) / 180) * 5.5;
      const ny = Math.sin((-60 * Math.PI) / 180) * 5.5;
      const h = hexagon(23, 26, 16.5);
      return (
        s('ink', polyline([h[1], h[2], h[3], h[4], h[5], h[0]])) +
        s('accent', line(h[0][0] + nx, h[0][1] + ny, h[1][0] + nx, h[1][1] + ny))
      );
    },
  },
  'm-offset-node': {
    group: 'master',
    name: 'Offset edge + node · as above, with a node at the centre',
    svg: () => {
      const nx = Math.cos((-60 * Math.PI) / 180) * 5.5;
      const ny = Math.sin((-60 * Math.PI) / 180) * 5.5;
      const h = hexagon(23, 26, 16.5);
      return (
        s('ink', polyline([h[1], h[2], h[3], h[4], h[5], h[0]])) +
        s('accent', line(h[0][0] + nx, h[0][1] + ny, h[1][0] + nx, h[1][1] + ny)) +
        dot('accent-f', [23, 26], 4.5)
      );
    },
  },
  'm-soft': {
    group: 'master',
    name: 'Soft cell · a rounded hexagon, open, node in the opening',
    svg: () => {
      // Rounded hexagon via quadratic corners; the upper-right edge is left open.
      const h = hexagon(24, 24, 18);
      const k = 0.32;
      const seq = [1, 2, 3, 4, 5, 0];
      let d = '';
      seq.forEach((i, n) => {
        const v = h[i];
        const prev = h[(i + 5) % 6];
        const next = h[(i + 1) % 6];
        const a = lerp(v, prev, k);
        const b = lerp(v, next, k);
        if (n === 0)
          d += `M${round(v[0])} ${round(v[1] + 0)}`.replace(
            /.*/,
            `M${round(lerp(v, next, 0)[0])} ${round(lerp(v, next, 0)[1])}`,
          );
        if (n === 0) d = `M${round(b[0])} ${round(b[1])}`;
        else if (n === seq.length - 1)
          d += `L${round(a[0])} ${round(a[1])}Q${round(v[0])} ${round(v[1])} ${round(lerp(v, h[1], 0.18)[0])} ${round(lerp(v, h[1], 0.18)[1])}`;
        else
          d += `L${round(a[0])} ${round(a[1])}Q${round(v[0])} ${round(v[1])} ${round(b[0])} ${round(b[1])}`;
      });
      const m = lerp(h[0], h[1], 0.62);
      return s('ink', d) + dot('accent-f', m, 4.5);
    },
  },
  // The lifted-edge family: one cell, a different edge lifted per brand.
  'f-origin': {
    group: 'origin',
    name: 'Lifted left edge · Origin',
    svg: () => lifted(4),
  },
  'f-linkos': {
    group: 'linkos',
    name: 'Lifted right edge · LinkOS',
    svg: () => lifted(1),
  },
};

/** The cell with edge k (vertex k → vertex k+1) pulled outward along its normal. */
export function lifted(k: number, shift = 5.5): string {
  const h = hexagon(24, 24, 16.5);
  const a = h[k];
  const b = h[(k + 1) % 6];
  const mx = (a[0] + b[0]) / 2 - 24;
  const my = (a[1] + b[1]) / 2 - 24;
  const len = Math.hypot(mx, my);
  const [nx, ny] = [(mx / len) * shift, (my / len) * shift];
  const rest = [1, 2, 3, 4, 5, 6].map((i) => h[(k + 1 + i - 1) % 6]);
  return s('ink', polyline(rest)) + s('accent', line(a[0] + nx, a[1] + ny, b[0] + nx, b[1] + ny));
}

const style =
  `<style>.ink,.accent{fill:none;stroke-width:4;stroke-linecap:round;stroke-linejoin:round}` +
  `.ink{stroke:${INK}}.accent{stroke:${ACCENT}}.ink-f{fill:${INK}}.accent-f{fill:${ACCENT}}</style>`;

export const checkSvg = (inner: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 64 64"><rect x="-8" y="-8" width="64" height="64" fill="#fff"/>${style}${inner}</svg>`;

if (import.meta.main) {
  const out = process.argv[2] ?? 'concepts/check';
  mkdirSync(out, { recursive: true });
  const ids = Object.keys(variants);
  for (const id of ids) {
    const png = new Resvg(checkSvg(variants[id].svg()), { fitTo: { mode: 'width', value: 512 } })
      .render()
      .asPng();
    writeFileSync(join(out, `r4-${id}.png`), png);
  }
  const cell = 64;
  const cols = 6;
  const sheet =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cols * cell} ${Math.ceil(ids.length / cols) * cell}"><rect width="100%" height="100%" fill="#fff"/>${style}` +
    ids
      .map(
        (id, i) =>
          `<g transform="translate(${(i % cols) * cell + 8} ${Math.floor(i / cols) * cell + 8})">${variants[id].svg()}</g>`,
      )
      .join('') +
    '</svg>';
  writeFileSync(
    join(out, 'r4-sheet.png'),
    new Resvg(sheet, { fitTo: { mode: 'width', value: 1152 } }).render().asPng(),
  );
  console.log('rendered', ids.join(', '));
}
