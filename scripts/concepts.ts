// Round-one logo concepts. Every mark sits on a 48-unit grid with a 4-unit margin and is drawn
// with 4-unit round-capped strokes. Colours are applied through classes only:
//   .ink / .accent      stroked shapes
//   .ink-f / .accent-f  filled shapes (dots)
// so one geometry renders in light, dark and mono colourways.

import { arc, circlePath, hexagon, line, polyline, roundedRect } from './geometry.ts';

export type MarkId = 'openlinkos' | 'origin' | 'linkos';

export interface Concept {
  id: string;
  name: string;
  idea: string;
  /** Accent of the OpenLinkOS master mark in this direction. */
  accent: { light: string; dark: string };
  marks: Record<MarkId, () => string>;
}

const p = (cls: string, d: string, extra = ''): string => `<path class="${cls}" d="${d}"${extra}/>`;
const dotAt = (cls: string, x: number, y: number, r: number): string =>
  `<circle class="${cls}" cx="${x}" cy="${y}" r="${r}"/>`;

// --- A · Link: two rings that genuinely interlock (each passes under the other once). --------
const ringsInterlocked = (left: string, right: string): string => {
  // Centres 14 apart, radius 10: the rings cross at x = 24, y = 24 ± 7.14.
  // The left ring dips under at the top crossing (-45.6°), the right ring at the bottom (134.4°).
  const gap = 19;
  return [
    p(left, arc(17, 24, 10, -45.6 + gap, 360 - 45.6 - gap)),
    p(right, arc(31, 24, 10, 134.4 + gap, 360 + 134.4 - gap)),
  ].join('');
};

const squaresInterlocked = (a: string, b: string): string => {
  // Squares 20×20 (rx 6) centred at (18,20) and (30,28) cross at (28,18) and (20,30).
  // Masks cut the under-passing stroke so the overlap reads as a link on any background.
  const cut = (id: string, x: number, y: number, vertical: boolean): string =>
    `<mask id="${id}" maskUnits="userSpaceOnUse" x="0" y="0" width="48" height="48">` +
    '<rect width="48" height="48" fill="#fff"/>' +
    (vertical
      ? `<rect x="${x - 2.6}" y="${y - 3.4}" width="5.2" height="6.8" fill="#000"/>`
      : `<rect x="${x - 3.4}" y="${y - 2.6}" width="6.8" height="5.2" fill="#000"/>`) +
    '</mask>';
  return [
    cut('cut-a', 28, 18, true),
    cut('cut-b', 20, 30, true),
    p(a, roundedRect(18, 20, 20, 20, 6), ' mask="url(#cut-a)"'),
    p(b, roundedRect(30, 28, 20, 20, 6), ' mask="url(#cut-b)"'),
  ].join('');
};

// --- B · Hex/Node: a cell with one open side; nodes and links live inside. ----------------
const hex = hexagon(24, 24, 18);
const hexOpen = (cls: string): string =>
  // Drop the upper-right edge (vertex 0 → vertex 1): the cell is open to the outside.
  p(cls, polyline([hex[1], hex[2], hex[3], hex[4], hex[5], hex[0]]));
const hexClosed = (cls: string): string => p(cls, polyline(hex, true));
const openingMid: [number, number] = [(hex[0][0] + hex[1][0]) / 2, (hex[0][1] + hex[1][1]) / 2];

// --- C · Aperture: an open ring with a node passing through the opening. -------------------
const aperture = (cls: string): string => p(cls, arc(24, 24, 17, -45 + 38, 360 - 45 - 38));
const apertureNode = (cls: string): string => {
  const a = (-45 * Math.PI) / 180;
  return dotAt(cls, 24 + 17 * Math.cos(a), 24 + 17 * Math.sin(a), 4.5);
};

export const concepts: Concept[] = [
  {
    id: 'a',
    name: 'A · Link',
    idea: 'Two rings that truly interlock: open projects linked together. Evolves the current openlinkos.com rings.',
    accent: { light: '#2563eb', dark: '#6b9bff' },
    marks: {
      openlinkos: () => ringsInterlocked('ink', 'accent'),
      origin: () => p('ink', circlePath(24, 24, 15)) + dotAt('accent-f', 24, 24, 5),
      linkos: () => squaresInterlocked('ink', 'accent'),
    },
  },
  {
    id: 'b',
    name: 'B · Hex/Node',
    idea: 'A cell open on one side, with a node reaching out through the opening. Evolves the legacy LinkOS hexagon and cube.',
    accent: { light: '#0891b2', dark: '#22d3ee' },
    marks: {
      openlinkos: () =>
        hexOpen('ink') +
        p('accent', line(24, 24, openingMid[0], openingMid[1])) +
        dotAt('accent-f', 24, 24, 4.5) +
        dotAt('accent-f', openingMid[0], openingMid[1], 3.5),
      origin: () => hexClosed('ink') + dotAt('accent-f', 24, 24, 6),
      linkos: () =>
        hexClosed('ink') +
        p(
          'accent',
          `${line(24, 24, hex[5][0], hex[5][1])}${line(24, 24, hex[1][0], hex[1][1])}${line(24, 24, hex[3][0], hex[3][1])}`,
        ),
    },
  },
  {
    id: 'c',
    name: 'C · Aperture',
    idea: 'An open ring with a node passing through it: openness and a point of connection. Evolves the Origin rings.',
    accent: { light: '#7c3aed', dark: '#a78bfa' },
    marks: {
      openlinkos: () => aperture('ink') + apertureNode('accent-f'),
      origin: () => aperture('ink') + apertureNode('accent-f') + dotAt('accent-f', 24, 24, 5.5),
      linkos: () =>
        aperture('ink') + apertureNode('accent-f') + p('accent', roundedRect(24, 24, 14, 14, 4)),
    },
  },
];

/** Accents shared by every direction in round one, so the shapes are compared fairly. */
export const productAccent: Record<
  Exclude<MarkId, 'openlinkos'>,
  { light: string; dark: string }
> = {
  origin: { light: '#4f5bd5', dark: '#8b96ff' },
  linkos: { light: '#0d9b76', dark: '#34d399' },
};

export const ink = { light: '#0f172a', dark: '#e2e8f0' };
export const tile = '#0f172a';
