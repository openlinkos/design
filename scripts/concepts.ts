// Logo concepts under review (earlier rounds are in git history: round one 28ead5e, round two
// and three 7928d65). Every mark sits on a 48-unit grid with a 4-unit margin and is drawn with
// 4-unit round-capped strokes. Colours are applied through classes only:
//   .ink / .accent      stroked shapes
//   .ink-f / .accent-f  filled shapes (dots)
// so one geometry renders in light, dark and mono colourways.

import { hexagon, line, polyline } from './geometry.ts';
import { variants } from './round4.ts';

export type MarkId = 'openlinkos' | 'origin' | 'linkos';

export interface Palette {
  light: string;
  dark: string;
}

export interface Concept {
  id: string;
  name: string;
  idea: string;
  /** Mark accents (graphics need 3:1) and text colours (links and buttons need 4.5:1). */
  accents: Record<MarkId, Palette>;
  text: Record<MarkId, Palette>;
  marks: Record<MarkId, () => string>;
}

const p = (cls: string, d: string): string => `<path class="${cls}" d="${d}"/>`;
const dotAt = (cls: string, [x, y]: [number, number], r: number): string =>
  `<circle class="${cls}" cx="${+x.toFixed(3)}" cy="${+y.toFixed(3)}" r="${r}"/>`;

const C: [number, number] = [24, 24];
const hex = hexagon(24, 24, 18);
const closed = (cls: string): string => p(cls, polyline(hex, true));
/** The cell without its upper-right edge (vertex 0 → vertex 1). */
const open = (cls: string): string =>
  p(cls, polyline([hex[1], hex[2], hex[3], hex[4], hex[5], hex[0]]));
const mid: [number, number] = [(hex[0][0] + hex[1][0]) / 2, (hex[0][1] + hex[1][1]) / 2];

const cyan = {
  accents: {
    openlinkos: { light: '#0891b2', dark: '#22d3ee' },
    origin: { light: '#4f5bd5', dark: '#8b96ff' },
    linkos: { light: '#0d9b76', dark: '#34d399' },
  },
  text: {
    openlinkos: { light: '#0e7490', dark: '#22d3ee' },
    origin: { light: '#4f5bd5', dark: '#8b96ff' },
    linkos: { light: '#047857', dark: '#34d399' },
  },
};

export const concepts: Concept[] = [
  {
    id: 'b2',
    name: 'B2 · Plug (round two, as you liked it)',
    idea: 'An open cell with a node in the opening; Origin is the closed cell with the origin point, LinkOS the cell with the cube of the legacy LinkOS mark. See the screening section: all three have close look-alikes.',
    ...cyan,
    marks: {
      openlinkos: () => open('ink') + dotAt('accent-f', mid, 4.5),
      origin: () => closed('ink') + dotAt('accent-f', C, 6),
      linkos: () =>
        closed('ink') +
        p('accent', [hex[5], hex[1], hex[3]].map(([x, y]) => line(24, 24, x, y)).join('')),
    },
  },
  {
    id: 'lifted',
    name: 'L · Lifted edge',
    idea: 'Round four. Keeps the open cell of B2 but drops the dot: one edge is lifted away from the cell as an accent stroke. The edge that is lifted identifies the brand (OpenLinkOS: upper right; Origin: left; LinkOS: right), the colour identifies the tier.',
    ...cyan,
    marks: {
      openlinkos: variants['m-offset'].svg,
      origin: variants['f-origin'].svg,
      linkos: variants['f-linkos'].svg,
    },
  },
];

export const ink: Palette = { light: '#0f172a', dark: '#e2e8f0' };
export const tile = '#0f172a';
