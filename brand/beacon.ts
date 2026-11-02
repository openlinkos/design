// Beacon mark: Raised fire. The tower is Origin's ring (radius 15 around the centre), opened at the
// top by 90 degrees; the fire, the accent point, sits in that opening on the rim, the moment the
// alarm leaves the tower. One fire, as the towers of the Great Wall lit one for a small alarm.
// 48-unit grid, 4-unit margin; stroke 4 units, 5.5 in the small variant; the fire grows from
// radius 5 to 6 with it, as Origin's point does.

export const name = 'Raised fire';
export const zh = '举火';
export const rationale =
  'The tower is the family ring, opened at the top; the fire is on the rim, leaving the tower: an alarm on its way to people and agents.';

const n = (v: number): string => String(Math.round(v * 1000) / 1000);

/** A point on the circle of radius r around (24, 24), at deg degrees clockwise from +x. */
const p = (r: number, deg: number): string => {
  const a = (deg * Math.PI) / 180;
  return `${n(24 + r * Math.cos(a))} ${n(24 + r * Math.sin(a))}`;
};

export const beacon = (stroke: number): string =>
  // the ring, clockwise from -45 degrees round to 225 degrees: 270 degrees of ink, the opening at the top
  `<path class="ink" d="M${p(15, -45)}A15 15 0 1 1 ${p(15, 225)}"/>` +
  `<circle class="accent-f" cx="24" cy="9" r="${stroke > 4 ? 6 : 5}"/>`;
