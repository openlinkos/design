// Round three: master-mark candidates chosen for distinctiveness, rendered for screening.
// node scripts/round3.ts <outDir>  → <outDir>/r3-<id>.png (512 px, white) and a contact sheet SVG.

import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { arc, circlePath, line, polar, polyline, round } from './geometry.ts';

const INK = '#0f172a';
const ACCENT = '#0e7490';
const s = (cls: 'ink' | 'accent', d: string, extra = ''): string =>
  `<path class="${cls}" d="${d}"${extra}/>`;
const dot = (cls: 'ink-f' | 'accent-f', x: number, y: number, r: number): string =>
  `<circle class="${cls}" cx="${round(x)}" cy="${round(y)}" r="${r}"/>`;

/** Masks a stroke out of a small window so the shape underneath reads as passing under. */
const under = (id: string, x: number, y: number, w: number, h: number): string =>
  `<mask id="${id}" maskUnits="userSpaceOnUse" x="-10" y="-10" width="68" height="68">` +
  `<rect x="-10" y="-10" width="68" height="68" fill="#fff"/><rect x="${round(x - w / 2)}" y="${round(y - h / 2)}" width="${w}" height="${h}" fill="#000"/></mask>`;

export const candidates: Record<string, { name: string; svg: () => string }> = {
  // An open carabiner: a link with a gate — it opens, and it connects anything.
  carabiner: {
    name: 'Carabiner',
    svg: () => {
      // A capsule 22 × 36 with the right straight side replaced by an inset, angled gate.
      const body = `M33 14A9 9 0 0 0 15 14V34A9 9 0 0 0 33 34V31`;
      return s('ink', body) + s('accent', line(33, 14, 28.5, 27.5));
    },
  },
  // A bead: a small ring threaded onto a large one (a node linked into a whole).
  bead: {
    name: 'Bead',
    svg: () => {
      // Big ring c(21,27) r13; small ring c(35,13) r6. Crossings computed from the two circles.
      const [cx1, cy1, r1, cx2, cy2, r2] = [21, 27, 13, 35, 13, 6.5];
      const d = Math.hypot(cx2 - cx1, cy2 - cy1);
      const a = (r1 * r1 - r2 * r2 + d * d) / (2 * d);
      const h = Math.sqrt(r1 * r1 - a * a);
      const mx = cx1 + (a * (cx2 - cx1)) / d;
      const my = cy1 + (a * (cy2 - cy1)) / d;
      const p1: [number, number] = [mx + (h * (cy2 - cy1)) / d, my - (h * (cx2 - cx1)) / d];
      const p2: [number, number] = [mx - (h * (cy2 - cy1)) / d, my + (h * (cx2 - cx1)) / d];
      return (
        under('u1', p1[0], p1[1], 7, 7) +
        under('u2', p2[0], p2[1], 7, 7) +
        s('ink', circlePath(cx1, cy1, r1), ' mask="url(#u1)"') +
        s('accent', circlePath(cx2, cy2, r2), ' mask="url(#u2)"')
      );
    },
  },
  // Two L strokes hooked through each other: Link, twice.
  'double-l': {
    name: 'Double L',
    svg: () =>
      under('v1', 13, 15, 7, 7) +
      under('v2', 35, 33, 7, 7) +
      s(
        'ink',
        polyline([
          [13, 6],
          [13, 33],
          [40, 33],
        ]),
        ' mask="url(#v2)"',
      ) +
      s(
        'accent',
        polyline([
          [35, 42],
          [35, 15],
          [8, 15],
        ]),
        ' mask="url(#v1)"',
      ),
  },
  // The Chinese character 开 ("open"), drawn on the grid as a monoline mark.
  kai: {
    name: '开 (open)',
    svg: () =>
      s('ink', line(10, 12, 38, 12)) +
      s('ink', line(7, 24, 41, 24)) +
      s('ink', `M19 12V27Q19 37 11 42`) +
      s('accent', line(30, 12, 30, 42)),
  },
  // A node and its link drawn as one stroke: a ring that leaves itself and ends in a dot.
  tether: {
    name: 'Tether',
    svg: () => {
      const [x0, y0] = polar(20, 22, 12, 45);
      return (
        s('ink', arc(20, 22, 12, 60, 390)) +
        s('accent', `M${round(x0)} ${round(y0)}L35 37`) +
        dot('accent-f', 37.5, 39.5, 4)
      );
    },
  },
  // Two open rings, gaps facing away from each other, joined by one bridge.
  bridge: {
    name: 'Bridge',
    svg: () =>
      s('ink', arc(15, 24, 9, 30, 330)) +
      s('ink', arc(33, 24, 9, 210, 510)) +
      s('accent', line(22.8, 19.5, 25.2, 28.5)),
  },
  // A folded strip: an O that is also a link, made of one stroke crossing itself once.
  fold: {
    name: 'Fold',
    svg: () =>
      under('f1', 24, 24, 7, 7) +
      s('ink', `M12 34V20A8 8 0 0 1 28 20V28A8 8 0 0 0 44 28`, '') +
      s('accent', `M36 14H22A8 8 0 0 0 22 30H40`, ' mask="url(#f1)"'),
  },
  // Origin of a graph: three nodes, two links, the corner open.
  corner: {
    name: 'Corner',
    svg: () =>
      s(
        'ink',
        polyline([
          [12, 14],
          [12, 36],
          [34, 36],
        ]),
      ) +
      dot('accent-f', 12, 12, 5) +
      dot('ink-f', 36, 36, 5) +
      s('accent', arc(12, 36, 22, -90, 0)),
  },
  // 开 / 元 / 互 refined: a family of four-stroke characters on the same grid.
  'kai-2': {
    name: '开 · OpenLinkOS',
    svg: () =>
      s('ink', line(12, 11, 36, 11)) +
      s('ink', line(7, 24, 41, 24)) +
      s('ink', 'M19 11V29Q19 38 10 42') +
      s('accent', line(30, 11, 30, 42)),
  },
  yuan: {
    name: '元 · Origin',
    svg: () =>
      s('ink', line(14, 10, 34, 10)) +
      s('ink', line(7, 21, 41, 21)) +
      s('ink', 'M19 21V28Q19 37 9 41') +
      s('accent', 'M29 21V35Q29 41 35 41H38Q41 41 41 37'),
  },
  hu: {
    name: '互 · LinkOS',
    svg: () =>
      s('ink', line(8, 9, 40, 9)) +
      s('ink', line(8, 39, 40, 39)) +
      s(
        'ink',
        polyline([
          [16, 9],
          [16, 27],
          [32, 27],
        ]),
      ) +
      s(
        'accent',
        polyline([
          [16, 21],
          [32, 21],
          [32, 39],
        ]),
      ),
  },
  // An O whose two halves are offset along a diagonal and joined: one ring, linked in two parts.
  'stepped-o': {
    name: 'Stepped O',
    svg: () =>
      s('ink', `${arc(20, 20, 12, 90, 270)}`) +
      s('ink', line(20, 8, 28, 16)) +
      s('accent', `${arc(28, 28, 12, 270, 450)}`) +
      s('accent', line(28, 40, 20, 32)),
  },
  ben: {
    name: '本 · Origin',
    svg: () =>
      s('ink', line(8, 15, 40, 15)) +
      s('ink', line(24, 6, 24, 42)) +
      s('ink', 'M23 16Q19 29 8 36') +
      s('ink', 'M25 16Q29 29 40 36') +
      s('accent', line(16, 33, 32, 33)),
  },
  'hu-2': {
    name: '互 · LinkOS (slanted hooks)',
    svg: () =>
      s('ink', line(8, 8, 40, 8)) +
      s('ink', line(8, 40, 40, 40)) +
      s(
        'ink',
        polyline([
          [17, 8],
          [13, 27],
          [31, 27],
        ]),
      ) +
      s(
        'accent',
        polyline([
          [17, 21],
          [35, 21],
          [31, 40],
        ]),
      ),
  },
};

const style =
  `<style>.ink,.accent{fill:none;stroke-width:4;stroke-linecap:round;stroke-linejoin:round}` +
  `.ink{stroke:${INK}}.accent{stroke:${ACCENT}}.ink-f{fill:${INK}}.accent-f{fill:${ACCENT}}</style>`;

export const sheetSvg = (inner: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 64 64"><rect x="-8" y="-8" width="64" height="64" fill="#fff"/>${style}${inner}</svg>`;

if (import.meta.main) {
  const out = process.argv[2] ?? 'concepts/check';
  mkdirSync(out, { recursive: true });
  const ids = Object.keys(candidates);
  for (const id of ids) {
    const png = new Resvg(sheetSvg(candidates[id].svg()), { fitTo: { mode: 'width', value: 512 } })
      .render()
      .asPng();
    writeFileSync(join(out, `r3-${id}.png`), png);
  }
  // Contact sheet: 4 per row with labels drawn as plain rectangles of colour only (no text).
  const cell = 64;
  const sheet =
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${4 * cell} ${Math.ceil(ids.length / 4) * cell}"><rect width="100%" height="100%" fill="#fff"/>${style}` +
    ids
      .map(
        (id, i) =>
          `<g transform="translate(${(i % 4) * cell + 8} ${Math.floor(i / 4) * cell + 8})">${candidates[
            id
          ]
            .svg()
            .replace(/id="(\w+)"/g, `id="$1-${i}"`)
            .replace(/url\(#(\w+)\)/g, `url(#$1-${i})`)}</g>`,
      )
      .join('') +
    '</svg>';
  writeFileSync(
    join(out, 'r3-sheet.png'),
    new Resvg(sheet, { fitTo: { mode: 'width', value: 1024 } }).render().asPng(),
  );
  console.log('rendered', ids.join(', '));
}
