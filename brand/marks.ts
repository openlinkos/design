// The OpenLinkOS marks. Every mark sits on a 48-unit grid with a 4-unit margin and is drawn with
// round-capped strokes: 4 units normally, 5.5 units for the small variant used at 32 px and
// below. Colours come from classes only, so one geometry renders every colourway:
//   .ink / .accent      stroked shapes
//   .ink-f / .accent-f  filled shapes

import { beacon } from './beacon.ts';
import { arc, circlePath } from './geometry.ts';
import { wordmark } from './wordmark.ts';

export type MarkId = 'rings' | 'ring-dot' | 'beacon';

/** A mark's geometry for a stroke width: SVG elements coloured by the classes above. */
export type Draw = (stroke: number) => string;

/** A registered mark, or any geometry drawn the same way (brand/proposals/ uses this). */
export type MarkRef = MarkId | Draw;

export interface Colours {
  ink: string;
  accent: string;
}

const path = (cls: string, d: string): string => `<path class="${cls}" d="${d}"/>`;

/**
 * Two rings that interlock: each passes under the other once. Centres are 14 apart and the
 * radius is 10, so the rings cross at x = 24, y = 24 ± 7.14 (−45.6° and 134.4° on the
 * left and right ring). The gap left where a ring passes under is the stroke width plus 1.25
 * units of clearance on each side.
 */
const rings = (stroke: number): string => {
  const half = (((stroke + 2.5) / 10) * (180 / Math.PI)) / 2;
  return (
    path('ink', arc(17, 24, 10, -45.6 + half, 360 - 45.6 - half)) +
    path('accent', arc(31, 24, 10, 134.4 + half, 360 + 134.4 - half))
  );
};

/** A ring and its centre point: the origin. */
const ringDot = (stroke: number): string =>
  path('ink', circlePath(24, 24, 15)) +
  `<circle class="accent-f" cx="24" cy="24" r="${stroke > 4 ? 6 : 5}"/>`;

export const marks: Record<MarkId, Draw> = {
  rings,
  'ring-dot': ringDot,
  beacon,
};

const draw = (m: MarkRef): Draw => (typeof m === 'string' ? marks[m] : m);

export const STROKE = 4;
export const SMALL_STROKE = 5.5;

export const style = (c: Colours, stroke: number, dark?: Colours): string =>
  '<style>' +
  `.ink,.accent{fill:none;stroke-width:${stroke};stroke-linecap:round;stroke-linejoin:round}` +
  `.ink{stroke:${c.ink}}.accent{stroke:${c.accent}}.ink-f{fill:${c.ink}}.accent-f{fill:${c.accent}}` +
  (dark
    ? `@media (prefers-color-scheme:dark){.ink{stroke:${dark.ink}}.accent{stroke:${dark.accent}}` +
      `.ink-f{fill:${dark.ink}}.accent-f{fill:${dark.accent}}}`
    : '') +
  '</style>';

/** The mark alone, 48 × 48. */
export const markSvg = (
  id: MarkRef,
  c: Colours,
  opts: { small?: boolean; dark?: Colours } = {},
): string => {
  const stroke = opts.small ? SMALL_STROKE : STROKE;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${style(c, stroke, opts.dark)}${draw(id)(stroke)}</svg>`;
};

/** The mark on a rounded tile (app icons, avatars). `bleed` fills the whole square. */
export const tileSvg = (
  id: MarkRef,
  c: Colours,
  tile: string,
  opts: { bleed?: boolean; scale?: number } = {},
): string => {
  const scale = opts.scale ?? 0.7;
  const offset = (48 - 48 * scale) / 2;
  const bg = opts.bleed
    ? `<rect width="48" height="48" fill="${tile}"/>`
    : `<rect width="48" height="48" rx="10.5" fill="${tile}"/>`;
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${style(c, STROKE)}${bg}` +
    `<g transform="translate(${offset} ${offset}) scale(${scale})">${draw(id)(STROKE)}</g></svg>`
  );
};

/** Wordmark geometry: cap height 15 font units scaled to 21.75, stroke 2.6 font units (≈ 3.8). */
const WORD_SCALE = 1.45;
const WORD_STROKE = 2.6;
const BASELINE = 35;

export interface Lockup {
  svg: string;
  width: number;
}

/** Mark, wordmark and an optional descriptor, 48 units tall. */
export const lockupSvg = (id: MarkRef, c: Colours, word: string, descriptor?: string): Lockup => {
  const w = wordmark(word);
  const x0 = 48 + 13;
  let width = x0 + w.width * WORD_SCALE + 4;
  let desc = '';
  if (descriptor) {
    const d = wordmark(descriptor);
    const dx = width + 8;
    desc = `<path class="accent" style="stroke-width:${WORD_STROKE}" transform="translate(${dx} ${BASELINE}) scale(${WORD_SCALE})" d="${d.d}"/>`;
    width = dx + d.width * WORD_SCALE + 4;
  }
  width = Math.ceil(width);
  return {
    width,
    svg:
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${width} 48">${style(c, STROKE)}${draw(id)(STROKE)}` +
      `<path class="ink" style="stroke-width:${WORD_STROKE}" transform="translate(${x0} ${BASELINE}) scale(${WORD_SCALE})" d="${w.d}"/>${desc}</svg>`,
  };
};
