// Round ten: simpler, line-only sketches in a single colour, for a first pick by eye before any
// screening. node scripts/round10.ts <outHtml>

import { writeFileSync } from 'node:fs';
import { arc, circlePath, round } from './geometry.ts';

type Mark = { name: string; idea: string; svg: () => string };

/** Stroke in the current colour; `gap` masks are used for over/under crossings. */
const s = (d: string, extra = ''): string => `<path class="l" d="${d}"${extra}/>`;
const dot = (x: number, y: number, r: number): string =>
  `<circle class="f" cx="${x}" cy="${y}" r="${r}"/>`;
const under = (id: string, x: number, y: number, ux: number, uy: number, len = 4.2): string => {
  const n = Math.hypot(ux, uy);
  const [dx, dy] = [(ux / n) * len, (uy / n) * len];
  return (
    `<mask id="${id}" maskUnits="userSpaceOnUse" x="-10" y="-10" width="68" height="68">` +
    '<rect x="-10" y="-10" width="68" height="68" fill="#fff"/>' +
    `<path d="M${round(x - dx)} ${round(y - dy)}L${round(x + dx)} ${round(y + dy)}" stroke="#000" stroke-width="7.4"/></mask>`
  );
};

export const sketches: Mark[] = [
  {
    name: 'Knot',
    idea: 'A line tied once: link, and the knot you tie to remember.',
    svg: () =>
      under('k1', 24, 21, 1, 1) +
      s('M6 34C14 34 18 30 24 21S32 6 24 6 16 16 24 21 34 34 42 34', ' mask="url(#k1)"') +
      s('M20.2 15.7C21.4 18.6 22.6 19.7 24 21'),
  },
  {
    name: 'Hook and ring',
    idea: 'A hook catching a ring: two things joined, simply.',
    svg: () =>
      under('h1', 27.5, 26, 1, 0) +
      s(circlePath(32, 31, 9), ' mask="url(#h1)"') +
      s('M16 6V26A8 8 0 0 0 32 26V22'),
  },
  {
    name: 'O into L',
    idea: 'One stroke draws an O, leaves it, and becomes an L.',
    svg: () => s(`${arc(20, 18, 11, 100, 440)}L31 30V40H42`),
  },
  {
    name: 'Two hooks',
    idea: 'Two U-shaped lines hooked into each other: the simplest link.',
    svg: () =>
      under('t1', 24, 18, 1, 0) +
      s('M12 6V22A6 6 0 0 0 24 22V12', ' mask="url(#t1)"') +
      s('M36 42V26A6 6 0 0 0 24 26V36'.replace('A6 6 0 0 0', 'A6 6 0 0 0')) +
      s('M18 18H30'),
  },
  {
    name: 'Spiral home',
    idea: 'A line winding in to its origin.',
    svg: () => {
      let d = '';
      let r = 19;
      let a = -90;
      const pts: string[] = [];
      for (let i = 0; i <= 64; i++) {
        const t = (a * Math.PI) / 180;
        pts.push(`${i ? 'L' : 'M'}${round(24 + r * Math.cos(t))} ${round(24 + r * Math.sin(t))}`);
        a += 9;
        r -= 0.24;
      }
      d = pts.join('');
      return s(d);
    },
  },
  {
    name: 'Horizon',
    idea: 'An open circle resting on a line: a point of origin, a beginning.',
    svg: () => s(arc(24, 22, 12, 140, 400)) + s('M6 38H42'),
  },
  {
    name: 'Brackets',
    idea: 'Two arcs facing each other, held by one line between them.',
    svg: () => s(arc(18, 24, 14, 120, 240)) + s(arc(30, 24, 14, -60, 60)) + s('M17 24H31'),
  },
  {
    name: 'Seam',
    idea: 'Two edges stitched together: open parts, joined.',
    svg: () =>
      s('M14 6C6 18 6 30 14 42') + s('M34 6C42 18 42 30 34 42') + s('M13 15H35M11 24H37M13 33H35'),
  },
  {
    name: 'Bridge',
    idea: 'An arch and its deck: a link across.',
    svg: () =>
      s('M6 30H42') +
      s(arc(24, 38, 16, 180, 360)) +
      s('M14 30V22M24 30V22M34 30V22'.replace(/V22/g, 'V27')),
  },
  {
    name: 'Three rings',
    idea: 'Three nodes, each a ring, linked in a row.',
    svg: () =>
      s(circlePath(10, 24, 5)) +
      s(circlePath(24, 24, 5)) +
      s(circlePath(38, 24, 5)) +
      s('M15 24H19M29 24H33'),
  },
  {
    name: 'Step path',
    idea: 'A path that climbs two steps to a ring.',
    svg: () => s('M6 40H16V30H26V20H31') + s(circlePath(37, 14, 6)),
  },
  {
    name: 'Wave through',
    idea: 'A wave passing through an open ring.',
    svg: () =>
      under('w1', 16.8, 24, 1, -0.6) +
      s(arc(24, 24, 15, 20, 340), ' mask="url(#w1)"') +
      s('M4 24C10 14 16 14 22 24S34 34 44 24'),
  },
  {
    name: 'Open infinity',
    idea: 'A figure eight left open at one end.',
    svg: () => s('M24 24C18 14 6 14 6 24S18 34 24 24 30 14 42 18'),
  },
  {
    name: 'Rings of an O',
    idea: 'An O drawn as two offset strokes, one inside the other.',
    svg: () => s(arc(24, 24, 18, -60, 200)) + s(arc(24, 24, 10, 120, 380)),
  },
  {
    name: 'Corner and arc',
    idea: 'An L and the arc it holds: origin and reach.',
    svg: () => s('M8 6V40H42') + s(arc(8, 40, 22, -90, 0)),
  },
  {
    name: 'OS',
    idea: 'An O and an S drawn as one continuous line.',
    svg: () => s(`${arc(15, 24, 9, 0, 360 - 0.01)}`) + s('M41 13A6 6 0 1 0 35 19A6 6 0 1 1 29 25'),
  },
];

const palettes = [
  { name: 'Ink', light: '#111827', dark: '#f3f4f6' },
  { name: 'Indigo', light: '#4f46e5', dark: '#a5b4fc' },
  { name: 'Emerald', light: '#059669', dark: '#6ee7b7' },
];

const svgOf = (m: Mark, color: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48"><style>.l{fill:none;stroke:${color};stroke-width:4;stroke-linecap:round;stroke-linejoin:round}.f{fill:${color}}</style>${m.svg()}</svg>`;
const data = (svg: string): string =>
  `data:image/svg+xml;base64,${Buffer.from(svg).toString('base64')}`;

const shown = sketches.filter((m) => !['Knot', 'O into L', 'Two hooks', 'Bridge'].includes(m.name));
const cards = shown
  .map(
    (m, i) =>
      `<div class="card"><div class="num">${i + 1}</div><div class="marks">${palettes
        .map((p) => `<span class="lt"><img src="${data(svgOf(m, p.light))}"></span>`)
        .join(
          '',
        )}<span class="dk"><img src="${data(svgOf(m, palettes[0].dark))}"></span></div><b>${m.name}</b><p>${m.idea}</p></div>`,
  )
  .join('');

writeFileSync(
  process.argv[2] ?? 'concepts/sketches.html',
  `<!doctype html><html lang="en"><meta charset="utf-8"><title>Line sketches · round ten</title><style>
body{font-family:Inter,'Segoe UI',system-ui,'Microsoft YaHei';padding:28px 40px;background:#f8fafc;color:#111827}
h1{margin:0 0 6px}.lead{color:#475569;margin:0 0 24px}
.grid{display:grid;grid-template-columns:repeat(4,1fr);gap:16px}
.card{background:#fff;border:1px solid #e5e7eb;border-radius:14px;padding:16px;position:relative}
.num{position:absolute;top:10px;left:12px;font-weight:700;color:#9ca3af}
.marks{display:flex;gap:6px;margin:14px 0 10px}.marks span{display:flex;padding:8px;border-radius:10px}.lt{background:#fff;border:1px solid #f1f5f9}.dk{background:#18181b}
.marks img{width:52px;height:52px}b{font-size:15px}p{margin:4px 0 0;color:#4b5563;font-size:13px}
</style><h1>Line sketches · pick the ones you like by number</h1><p class="lead">Single colour, one 4-unit line, round ends. Each shown in ink, indigo and emerald, and on dark. Screening and refinement come after your pick.</p><div class="grid">${cards}</div></html>`,
);
console.log('wrote sketches');
