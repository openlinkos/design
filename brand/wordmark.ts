// A small monoline alphabet for the OpenLinkOS wordmarks. Glyphs are centre lines drawn with a
// round-capped stroke, so wordmarks need no font files. Units: baseline at y = 0, y grows down,
// x-height 11, cap height 15, descender 5.

import { arc, line, polyline, round } from './geometry.ts';

const X = 11;
const H = 15;
const R = X / 2;

/** Counter-clockwise arc (decreasing angle) from a0 to a1. */
const arcCcw = (cx: number, cy: number, r: number, a0: number, a1: number): string => {
  const sweep = (((a0 - a1) % 360) + 360) % 360;
  const p = (deg: number): [number, number] => {
    const a = (deg * Math.PI) / 180;
    return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
  };
  const [x0, y0] = p(a0);
  const [x1, y1] = p(a1);
  return `M${round(x0)} ${round(y0)}A${round(r)} ${round(r)} 0 ${sweep > 180 ? 1 : 0} 0 ${round(x1)} ${round(y1)}`;
};

const circle = (cx: number, cy: number, r: number): string =>
  `${arc(cx, cy, r, 0, 180)}${arc(cx, cy, r, 180, 360).replace(/^M[^A]+/, '')}`;

const dot = (x: number, y: number): string => `M${round(x)} ${round(y)}h0`;

interface Glyph {
  /** Path data for a glyph whose left edge (centre line) sits at x = ox. */
  draw: (ox: number) => string;
  /** Width of the centre-line extent. */
  width: number;
}

const glyphs: Record<string, Glyph> = {
  O: { width: H, draw: (o) => circle(o + H / 2, -H / 2, H / 2) },
  o: { width: X, draw: (o) => circle(o + R, -R, R) },
  p: { width: X, draw: (o) => circle(o + R, -R, R) + line(o, -X, o, 5) },
  e: { width: X, draw: (o) => arc(o + R, -R, R, 40, 360) + line(o + X, -R, o, -R) },
  n: {
    width: X,
    draw: (o) => line(o, 0, o, -X) + arc(o + R, -R, R, 180, 360) + line(o + X, -R, o + X, 0),
  },
  i: { width: 0, draw: (o) => line(o, 0, o, -X) + dot(o, -X - 3.6) },
  L: {
    width: 9,
    draw: (o) =>
      polyline([
        [o, -H],
        [o, 0],
        [o + 9, 0],
      ]),
  },
  k: {
    width: 8,
    draw: (o) => line(o, 0, o, -H) + line(o + 8, -X, o, -3.4) + line(o + 3.1, -6.1, o + 8, 0),
  },
  S: {
    width: 7.5,
    draw: (o) =>
      arcCcw(o + 3.75, -11.25, 3.75, 330, 90) +
      arc(o + 3.75, -3.75, 3.75, 270, 150).replace(/^M[^A]+/, ''),
  },
  s: {
    width: 5.5,
    draw: (o) =>
      arcCcw(o + 2.75, -8.25, 2.75, 330, 90) +
      arc(o + 2.75, -2.75, 2.75, 270, 150).replace(/^M[^A]+/, ''),
  },
  r: { width: 8.25, draw: (o) => line(o, 0, o, -X) + arc(o + R, -R, R, 180, 300) },
  A: {
    width: 13,
    draw: (o) =>
      polyline([
        [o, 0],
        [o + 6.5, -H],
        [o + 13, 0],
      ]) + line(o + 2.6, -6, o + 10.4, -6),
  },
  a: { width: X, draw: (o) => circle(o + R, -R, R) + line(o + X, -X, o + X, 0) },
  t: {
    width: 6.5,
    draw: (o) =>
      `${line(o + 2.5, -14.5, o + 2.5, -2.5)}${arcCcw(o + 5, -2.5, 2.5, 180, 90)}L${round(o + 6.5)} 0` +
      line(o, -X, o + 6.5, -X),
  },
  u: {
    width: X,
    draw: (o) => line(o, -X, o, -R) + arcCcw(o + R, -R, R, 180, 0) + line(o + X, -X, o + X, 0),
  },
  g: {
    width: X,
    draw: (o) =>
      circle(o + R, -R, R) + line(o + X, -X, o + X, 0) + arc(o + X - 4.5, 0, 4.5, 0, 160),
  },
  M: {
    width: 13,
    draw: (o) =>
      polyline([
        [o, 0],
        [o, -H],
        [o + 6.5, -4],
        [o + 13, -H],
        [o + 13, 0],
      ]),
  },
};

/** Left side bearing of the S shapes: their centre lines start inside the advance box. */
const inset: Record<string, number> = { S: 0, s: 0 };

export interface Wordmark {
  d: string;
  width: number;
}

/** Sets a word in the monoline alphabet; `tracking` is the centre-line gap between glyphs. */
export const wordmark = (text: string, tracking = 4.6): Wordmark => {
  let x = 0;
  const parts: string[] = [];
  for (const [i, ch] of [...text].entries()) {
    const g = glyphs[ch];
    if (!g) throw new Error(`No glyph for "${ch}"`);
    if (i > 0) x += tracking;
    parts.push(g.draw(x + (inset[ch] ?? 0)));
    x += g.width;
  }
  return { d: parts.join(''), width: x };
};
