// Round eight: a change of style — solid shapes, negative space and isometric forms instead of
// monoline outlines, still ink + cyan. node scripts/round8.ts <outDir>

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { arc, polar, polyline, round } from './geometry.ts';

type Pt = [number, number];
const INK = '#0f172a';
const CYAN = '#0891b2';
const CYAN_LIGHT = '#22d3ee';
const CYAN_DARK = '#0e7490';

const ngon = (n: number, cx: number, cy: number, r: number, start: number): Pt[] =>
  Array.from({ length: n }, (_, i) => polar(cx, cy, r, start + (360 / n) * i));
const fill = (color: string, d: string, extra = ''): string =>
  `<path fill="${color}" d="${d}"${extra}/>`;
/** Mask: white everywhere, black where `cut` (raw SVG) draws — black strokes/fills knock out. */
const knock = (id: string, cut: string): string =>
  `<mask id="${id}" maskUnits="userSpaceOnUse" x="-10" y="-10" width="68" height="68">` +
  `<rect x="-10" y="-10" width="68" height="68" fill="#fff"/>${cut}</mask>`;
const blackStroke = (d: string, w: number): string =>
  `<path d="${d}" fill="none" stroke="#000" stroke-width="${w}" stroke-linecap="round" stroke-linejoin="round"/>`;

const hexPts = ngon(6, 24, 24, 20, -90);
const hexD = polyline(hexPts, true);
/** Hexagon with rounded corners (quadratic), as a filled outline. */
const softHex = (cx: number, cy: number, r: number, k = 0.22): string => {
  const v = ngon(6, cx, cy, r, -90);
  const lerp = (a: Pt, b: Pt, t: number): Pt => [
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
  ];
  let d = '';
  v.forEach((p, i) => {
    const a = lerp(p, v[(i + 5) % 6], k);
    const b = lerp(p, v[(i + 1) % 6], k);
    d += `${i ? 'L' : 'M'}${round(a[0])} ${round(a[1])}Q${round(p[0])} ${round(p[1])} ${round(b[0])} ${round(b[1])}`;
  });
  return `${d}Z`;
};

export const round8: Record<string, { name: string; svg: () => string }> = {
  'o-l-knock': {
    name: 'A solid O with an L cut out that breaks through its edge',
    svg: () =>
      knock('m', blackStroke('M19 11V28H46', 6.5)) +
      `<circle cx="24" cy="24" r="20" fill="${CYAN}" mask="url(#m)"/>`,
  },
  'open-box': {
    name: 'Isometric box with its lid open',
    svg: () => {
      // Box: top at y≈20; faces left (ink) and right (cyan dark); lid hinged at the back edge, raised.
      const c: Pt = [24, 26];
      const L: Pt = [9, 17.5];
      const R: Pt = [39, 17.5];
      const B: Pt = [24, 9];
      const bottom: Pt = [24, 43];
      return (
        fill(INK, polyline([L, c, bottom, [9, 34.5]], true)) +
        fill(CYAN_DARK, polyline([c, R, [39, 34.5], bottom], true)) +
        fill(CYAN_LIGHT, polyline([L, B, [24, 1.5], [9, 10]], true)) +
        fill(CYAN, polyline([B, R, [39, 10], [24, 1.5]], true).replace('Z', 'Z'), ' opacity="0"')
      );
    },
  },
  'exploded-cube': {
    name: 'Isometric cell whose top face lifts away',
    svg: () => {
      const c: Pt = [24, 27];
      const top = (dy: number): string =>
        polyline(
          [
            [24, 10 + dy],
            [38.7, 18.5 + dy],
            [24, 27 + dy],
            [9.3, 18.5 + dy],
          ],
          true,
        );
      return (
        fill(INK, polyline([[9.3, 21.5], c, [24, 44], [9.3, 35.5]], true)) +
        fill(CYAN_DARK, polyline([c, [38.7, 21.5], [38.7, 35.5], [24, 44]], true)) +
        fill(CYAN, top(-6))
      );
    },
  },
  'ribbon-o': {
    name: 'A band folded into an O, its two ends overlapping',
    svg: () => {
      const outer = 20;
      const inner = 11;
      const band = (a0: number, a1: number): string => {
        const [x0, y0] = polar(24, 24, outer, a0);
        const [x1, y1] = polar(24, 24, outer, a1);
        const [x2, y2] = polar(24, 24, inner, a1);
        const [x3, y3] = polar(24, 24, inner, a0);
        const large = (((a1 - a0) % 360) + 360) % 360 > 180 ? 1 : 0;
        return `M${round(x0)} ${round(y0)}A${outer} ${outer} 0 ${large} 1 ${round(x1)} ${round(y1)}L${round(x2)} ${round(y2)}A${inner} ${inner} 0 ${large} 0 ${round(x3)} ${round(y3)}Z`;
      };
      return (
        fill(INK, band(-60, 250)) + fill(CYAN, band(250, 300)) + fill(CYAN_DARK, band(-75, -60))
      );
    },
  },
  'notched-tile': {
    name: 'A tile with a corner bitten out and a node emerging from the bite',
    svg: () =>
      knock('n', '<circle cx="40" cy="8" r="15" fill="#000"/>') +
      `<rect x="4" y="4" width="40" height="40" rx="11" fill="${INK}" mask="url(#n)"/>` +
      `<circle cx="40" cy="8" r="7.5" fill="${CYAN}"/>`,
  },
  'origin-axes': {
    name: 'Two solid axes forming an L, the origin marked where they meet',
    svg: () =>
      fill(INK, 'M7 7h9v25h25v9H11a4 4 0 0 1-4-4z') +
      `<circle cx="11.5" cy="36.5" r="7.5" fill="${CYAN}"/>`,
  },
  'neg-plug': {
    name: 'The round-two idea in negative space: a solid cell with the open cell and node cut in',
    svg: () =>
      knock(
        'p',
        blackStroke(
          polyline([
            ngon(6, 24, 24, 11, -90)[1],
            ...[2, 3, 4, 5, 0].map((i) => ngon(6, 24, 24, 11, -90)[i]),
          ]),
          4,
        ) +
          `<circle cx="${round((ngon(6, 24, 24, 11, -90)[0][0] + ngon(6, 24, 24, 11, -90)[1][0]) / 2)}" cy="${round((ngon(6, 24, 24, 11, -90)[0][1] + ngon(6, 24, 24, 11, -90)[1][1]) / 2)}" r="3.2" fill="#000"/>`,
      ) + fill(INK, softHex(24, 24, 21), ' mask="url(#p)"'),
  },
  'split-cell': {
    name: 'A solid cell split into two halves that slide apart along a link',
    svg: () => {
      const l = ngon(6, 21, 25, 18, -90);
      const r = ngon(6, 27, 23, 18, -90);
      return (
        fill(INK, polyline([l[0], l[5], l[4], l[3], [21, 25]], true)) +
        fill(CYAN, polyline([r[0], r[1], r[2], r[3], [27, 23]], true))
      );
    },
  },
  'twin-pills': {
    name: 'Two solid capsules linked at a right angle, one passing over the other',
    svg: () =>
      knock('q', blackStroke('M28 6V30', 13)) +
      `<rect x="6" y="15" width="30" height="10" rx="5" fill="${INK}" mask="url(#q)"/>` +
      `<rect x="23" y="6" width="10" height="34" rx="5" fill="${CYAN}"/>` +
      `<rect x="6" y="15" width="16" height="10" rx="5" fill="${INK}"/>`,
  },
  'quarter-o': {
    name: 'An O of four quarter blocks, one turned outward',
    svg: () => {
      const q = (cx: number, cy: number, a: number, color: string): string => {
        const [x0, y0] = polar(cx, cy, 18, a);
        const [x1, y1] = polar(cx, cy, 18, a + 90);
        const [x2, y2] = polar(cx, cy, 8, a + 90);
        const [x3, y3] = polar(cx, cy, 8, a);
        return fill(
          color,
          `M${round(x0)} ${round(y0)}A18 18 0 0 1 ${round(x1)} ${round(y1)}L${round(x2)} ${round(y2)}A8 8 0 0 0 ${round(x3)} ${round(y3)}Z`,
        );
      };
      return q(22, 26, 90, INK) + q(22, 26, 180, INK) + q(22, 26, 0, INK) + q(26, 22, 270, CYAN);
    },
  },
  'gate-arc': {
    name: 'A thick arc with a node passing through its opening (aperture as a solid band)',
    svg: () =>
      fill(
        INK,
        `${arc(24, 24, 20, -40, 250).replace(/^M/, 'M')}L${round(polar(24, 24, 11, 250)[0])} ${round(polar(24, 24, 11, 250)[1])}${arc(
          24,
          24,
          11,
          250,
          -40 + 360,
        )
          .replace(/^M[^A]+/, '')
          .replace(/A11 11 0 (\d) 1/, 'A11 11 0 $1 0')}Z`,
      ) +
      `<circle cx="${round(polar(24, 24, 15.5, -65)[0])}" cy="${round(polar(24, 24, 15.5, -65)[1])}" r="5.5" fill="${CYAN}"/>`,
  },
};

if (import.meta.main) {
  const out = process.argv[2] ?? 'concepts/check';
  mkdirSync(out, { recursive: true });
  const ids = Object.keys(round8);
  const wrap = (inner: string): string =>
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 64 64"><rect x="-8" y="-8" width="64" height="64" fill="#fff"/>${inner}</svg>`;
  for (const id of ids) {
    writeFileSync(
      join(out, `r8-${id}.png`),
      new Resvg(wrap(round8[id].svg()), { fitTo: { mode: 'width', value: 512 } }).render().asPng(),
    );
  }
  const cell = 64;
  const cols = 6;
  const sheet =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${cols * cell} ${Math.ceil(ids.length / cols) * cell}"><rect width="100%" height="100%" fill="#fff"/>` +
    ids
      .map(
        (id, i) =>
          `<g transform="translate(${(i % cols) * cell + 8} ${Math.floor(i / cols) * cell + 8})">${round8[
            id
          ]
            .svg()
            .replace(/id="(\w+)"/g, `id="$1${i}"`)
            .replace(/url\(#(\w+)\)/g, `url(#$1${i})`)}</g>`,
      )
      .join('') +
    '</svg>';
  writeFileSync(
    join(out, 'r8-sheet.png'),
    new Resvg(sheet, { fitTo: { mode: 'width', value: 1152 } }).render().asPng(),
  );
  console.log('rendered', ids.join(', '));
}
