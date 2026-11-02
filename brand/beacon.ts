// Beacon mark, candidate 1: Signal. A fire (the accent point at the centre) and its signal carried
// both ways along the wall: Origin's ring (radius 15 around the centre) opened at the top and the
// bottom, leaving two ink arcs of 100 degrees each (50 on either side of the horizontal).
// 48-unit grid, 4-unit margin; stroke 4 units, 5.5 in the small variant; the fire grows from
// radius 5 to 6 with it, as Origin's point does.
//
// A drop-in for brand/beacon.ts: copy this file over it and run `pnpm gen`. It imports nothing,
// so it works from either place.

export const name = 'Signal';
export const zh = '烽信';
export const rationale =
  'A fire and the signal it sends to the towers on either side, as Beacon carries an alert to people and agents.';
export const caveat =
  'Close to common broadcast and radio icons, so it is the one screening is most likely to stop.';

const n = (v: number): string => String(Math.round(v * 1000) / 1000);

/** A clockwise arc around (24, 24) from angle a0 to a1 (degrees, clockwise from +x). */
const arc = (r: number, a0: number, a1: number): string => {
  const p = (deg: number): string => {
    const a = (deg * Math.PI) / 180;
    return `${n(24 + r * Math.cos(a))} ${n(24 + r * Math.sin(a))}`;
  };
  return `M${p(a0)}A${r} ${r} 0 0 1 ${p(a1)}`;
};

export const beacon = (stroke: number): string =>
  `<path class="ink" d="${arc(15, 130, 230)}"/>` +
  `<path class="ink" d="${arc(15, -50, 50)}"/>` +
  `<circle class="accent-f" cx="24" cy="24" r="${stroke > 4 ? 6 : 5}"/>`;
