// Geometry helpers shared by the concept sketches and the brand generator.
// Coordinates use the SVG convention: y grows downwards, angles are degrees clockwise from +x.

export const round = (n: number): string => {
  const v = Math.round(n * 1000) / 1000;
  return Object.is(v, -0) ? '0' : String(v);
};

export const polar = (cx: number, cy: number, r: number, deg: number): [number, number] => {
  const a = (deg * Math.PI) / 180;
  return [cx + r * Math.cos(a), cy + r * Math.sin(a)];
};

/** Clockwise arc from angle a0 to angle a1 (degrees), as a standalone path. */
export const arc = (cx: number, cy: number, r: number, a0: number, a1: number): string => {
  const sweep = (((a1 - a0) % 360) + 360) % 360;
  const [x0, y0] = polar(cx, cy, r, a0);
  const [x1, y1] = polar(cx, cy, r, a1);
  return `M${round(x0)} ${round(y0)}A${round(r)} ${round(r)} 0 ${sweep > 180 ? 1 : 0} 1 ${round(x1)} ${round(y1)}`;
};

export const line = (x0: number, y0: number, x1: number, y1: number): string =>
  `M${round(x0)} ${round(y0)}L${round(x1)} ${round(y1)}`;

export const polyline = (points: Array<[number, number]>, close = false): string =>
  points.map(([x, y], i) => `${i ? 'L' : 'M'}${round(x)} ${round(y)}`).join('') +
  (close ? 'Z' : '');

/** Vertices of a regular hexagon with a vertex at the top. */
export const hexagon = (cx: number, cy: number, r: number): Array<[number, number]> =>
  [-90, -30, 30, 90, 150, 210].map((deg) => polar(cx, cy, r, deg));

/** Rounded rectangle outline as a path, centred on (cx, cy). */
export const roundedRect = (cx: number, cy: number, w: number, h: number, rx: number): string => {
  const x = cx - w / 2;
  const y = cy - h / 2;
  return [
    `M${round(x + rx)} ${round(y)}`,
    `H${round(x + w - rx)}`,
    `A${round(rx)} ${round(rx)} 0 0 1 ${round(x + w)} ${round(y + rx)}`,
    `V${round(y + h - rx)}`,
    `A${round(rx)} ${round(rx)} 0 0 1 ${round(x + w - rx)} ${round(y + h)}`,
    `H${round(x + rx)}`,
    `A${round(rx)} ${round(rx)} 0 0 1 ${round(x)} ${round(y + h - rx)}`,
    `V${round(y + rx)}`,
    `A${round(rx)} ${round(rx)} 0 0 1 ${round(x + rx)} ${round(y)}`,
    'Z',
  ].join('');
};

/** Full circle as a path (two half arcs), so it can share the stroke classes. */
export const circlePath = (cx: number, cy: number, r: number): string =>
  `${arc(cx, cy, r, 0, 180)}${arc(cx, cy, r, 180, 360).replace(/^M[^A]+/, '')}`;
