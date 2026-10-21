// Round-two logo concepts: the Hex/Node direction (round one, commit 28ead5e, also had Link and
// Aperture). Every mark sits on a 48-unit grid with a 4-unit margin and is drawn with 4-unit
// round-capped strokes. Colours are applied through classes only:
//   .ink / .accent      stroked shapes
//   .ink-f / .accent-f  filled shapes (dots)
// so one geometry renders in light, dark and mono colourways.
//
// The system: a hexagonal cell. The OpenLinkOS master mark is the cell opened on one side;
// products are closed cells with one inner glyph (Origin: the origin point); the LinkOS
// service line is the closed cell with the isometric cube of the legacy LinkOS mark.

import { hexagon, line, polar, polyline } from './geometry.ts';
import { candidates } from './round3.ts';

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

const origin = (): string => closed('ink') + dotAt('accent-f', C, 6);
const linkos = (): string =>
  closed('ink') +
  p('accent', [hex[5], hex[1], hex[3]].map(([x, y]) => line(24, 24, x, y)).join(''));

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

const blue = {
  accents: { ...cyan.accents, openlinkos: { light: '#2563eb', dark: '#6b9bff' } },
  text: { ...cyan.text, openlinkos: { light: '#1d4ed8', dark: '#6b9bff' } },
};

const plug = (): string => open('ink') + dotAt('accent-f', mid, 4.5);

export const concepts: Concept[] = [
  {
    id: 'h',
    name: 'H · 开 本 互',
    idea: 'Round three. Four- and five-stroke Chinese characters drawn with the monoline construction, one accent stroke each: 开 "open" for OpenLinkOS, 本 "root, origin" for Origin, 互 "inter-, mutual" (as in 互联, to interconnect) for LinkOS. Screened with Google Lens and Baidu image search: no logo matches, only the characters themselves in fonts.',
    ...cyan,
    marks: {
      openlinkos: candidates['kai-2'].svg,
      origin: candidates.ben.svg,
      linkos: candidates['hu-2'].svg,
    },
  },

  {
    id: 'b1',
    name: 'B1 · Node and link',
    idea: 'Round one: a node at the centre, linked out through the opening to a second node.',
    ...cyan,
    marks: {
      openlinkos: () =>
        open('ink') +
        p('accent', line(24, 24, mid[0], mid[1])) +
        dotAt('accent-f', C, 4.5) +
        dotAt('accent-f', mid, 3.5),
      origin,
      linkos,
    },
  },
  {
    id: 'b2',
    name: 'B2 · Plug',
    idea: 'A single node sits in the opening: the cell is open, and this is where it connects.',
    ...cyan,
    marks: { openlinkos: plug, origin, linkos },
  },
  {
    id: 'b3',
    name: 'B3 · Hub',
    idea: 'A larger centre node with one link reaching out through the opening; no second dot.',
    ...cyan,
    marks: {
      openlinkos: () =>
        open('ink') + p('accent', line(24, 24, mid[0], mid[1])) + dotAt('accent-f', C, 6),
      origin,
      linkos,
    },
  },
  {
    id: 'b4',
    name: 'B4 · Lid',
    idea: 'The upper-right edge swings open like a lid, with a node inside: an open box.',
    ...cyan,
    marks: {
      openlinkos: () => {
        const tip = polar(hex[0][0], hex[0][1], 18, 5);
        return (
          p('ink', polyline([hex[1], hex[2], hex[3], hex[4], hex[5], hex[0]])) +
          p('accent', line(hex[0][0], hex[0][1], tip[0], tip[1])) +
          dotAt('accent-f', C, 5.5)
        );
      },
      origin,
      linkos,
    },
  },
  {
    id: 'b2-blue',
    name: 'B2 · Plug, blue master colour',
    idea: 'Same as B2 with a blue master colour, to separate OpenLinkOS more clearly from the green LinkOS line.',
    ...blue,
    marks: { openlinkos: plug, origin, linkos },
  },
];

export const ink: Palette = { light: '#0f172a', dark: '#e2e8f0' };
export const tile = '#0f172a';
