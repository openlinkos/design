// Round five: the cell is itself a link. Two half cells interlock at the top and bottom
// (one passes over at the top crossing and under at the bottom), so no dot or lifted edge
// is needed. node scripts/round5.ts <outDir>
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { hexagon, polyline, round } from './geometry.ts';

const INK = '#0f172a';
const ACCENT = '#0891b2';
const s = (cls: string, d: string, extra = ''): string => `<path class="${cls}" d="${d}"${extra}/>`;
/** Cuts a gap into the under-passing stroke: a band 6.6 wide along the over-passing segment. */
const cut = (
  id: string,
  [x0, y0]: [number, number],
  [x1, y1]: [number, number],
  [cx, cy]: [number, number],
): string => {
  const len = Math.hypot(x1 - x0, y1 - y0);
  const [ux, uy] = [(x1 - x0) / len, (y1 - y0) / len];
  const half = 4.2;
  return (
    `<mask id="${id}" maskUnits="userSpaceOnUse" x="-10" y="-10" width="68" height="68">` +
    `<rect x="-10" y="-10" width="68" height="68" fill="#fff"/>` +
    `<path d="M${round(cx - ux * half)} ${round(cy - uy * half)}L${round(cx + ux * half)} ${round(cy + uy * half)}" stroke="#000" stroke-width="7.4" stroke-linecap="butt"/></mask>`
  );
};

/** Left and right half cells, overlapping by `overlap` so their top and bottom edges cross. */
export function interlocked(overlap = 6, r = 18, dot = false): string {
  const cx = 24;
  const left = hexagon(cx + overlap / 2, 24, r);
  const right = hexagon(cx - overlap / 2, 24, r);
  const L = polyline([left[0], left[5], left[4], left[3]]);
  const R = polyline([right[0], right[1], right[2], right[3]]);
  // Crossings: the top edges cross at x = cx, the bottom edges too (by symmetry).
  const dy = (overlap / 2) * Math.tan(Math.PI / 6);
  const top: [number, number] = [cx, 24 - r + dy];
  const bottom: [number, number] = [cx, 24 + r - dy];
  return (
    // At the top the left (ink) edge passes over; at the bottom the right (accent) edge does.
    cut('top', left[5], left[0], top) +
    cut('bottom', right[2], right[3], bottom) +
    // Left passes over at the top (right is cut there); right passes over at the bottom.
    s('accent', R, ' mask="url(#top)"') +
    s('ink', L, ' mask="url(#bottom)"') +
    (dot ? `<circle class="accent-f" cx="24" cy="24" r="4.5"/>` : '')
  );
}

const style =
  `<style>.ink,.accent{fill:none;stroke-width:4;stroke-linecap:round;stroke-linejoin:round}` +
  `.ink{stroke:${INK}}.accent{stroke:${ACCENT}}.ink-f{fill:${INK}}.accent-f{fill:${ACCENT}}</style>`;
const check = (inner: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 64 64"><rect x="-8" y="-8" width="64" height="64" fill="#fff"/>${style}${inner}</svg>`;

export const round5: Record<string, () => string> = {
  'weave-6': () => interlocked(6),
  'weave-10': () => interlocked(10),
  'weave-6-dot': () => interlocked(6, 18, true),
};

if (import.meta.main) {
  const out = process.argv[2] ?? 'concepts/check';
  mkdirSync(out, { recursive: true });
  for (const [id, svg] of Object.entries(round5)) {
    writeFileSync(
      join(out, `r5-${id}.png`),
      new Resvg(check(svg()), { fitTo: { mode: 'width', value: 512 } }).render().asPng(),
    );
  }
  console.log('rendered', Object.keys(round5).join(', '));
}
