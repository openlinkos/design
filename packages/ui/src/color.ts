// Colour science for the token build: sRGB <-> OKLab/OKLCH, gamut mapping, WCAG 2 contrast, and
// 12-step scales. Scales follow the step semantics of Radix Colors (MIT, https://www.radix-ui.com/colors):
//
//   1  app background          2  subtle background
//   3  UI element background   4  hovered UI element      5  pressed or selected UI element
//   6  subtle border           7  UI element border       8  hovered border, focus ring
//   9  solid fill              10 hovered solid fill
//   11 low-contrast text       12 high-contrast text
//
// A scale is generated in OKLCH from a reference profile (the lightness and relative chroma of each
// step in a Radix scale) at the hue of a brand colour, with step 9 pinned to that colour. Text steps
// are then adjusted until they meet WCAG contrast on the background steps.

export type Rgb = [number, number, number];
export interface Oklch {
  l: number;
  c: number;
  h: number;
}
export type Mode = 'light' | 'dark';
export type Scale = [
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
  string,
];

const clamp01 = (v: number): number => Math.min(1, Math.max(0, v));

export function hexToRgb(hex: string): Rgb {
  const m = /^#([0-9a-f]{6})$/i.exec(hex);
  if (!m?.[1]) throw new Error(`expected #rrggbb, got ${hex}`);
  const v = m[1];
  return [0, 2, 4].map((i) => Number.parseInt(v.slice(i, i + 2), 16) / 255) as Rgb;
}

export function rgbToHex(rgb: Rgb): string {
  return `#${rgb
    .map((v) =>
      Math.round(clamp01(v) * 255)
        .toString(16)
        .padStart(2, '0'),
    )
    .join('')}`;
}

const toLinear = (v: number): number => (v <= 0.04045 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4);
const fromLinear = (v: number): number =>
  v <= 0.0031308 ? v * 12.92 : 1.055 * v ** (1 / 2.4) - 0.055;

/** OKLab from gamma-encoded sRGB (Björn Ottosson's matrices). */
function rgbToOklab([r, g, b]: Rgb): [number, number, number] {
  const [lr, lg, lb] = [toLinear(r), toLinear(g), toLinear(b)];
  const l = Math.cbrt(0.4122214708 * lr + 0.5363325363 * lg + 0.0514459929 * lb);
  const m = Math.cbrt(0.2119034982 * lr + 0.6806995451 * lg + 0.1073969566 * lb);
  const s = Math.cbrt(0.0883024619 * lr + 0.2817188376 * lg + 0.6299787005 * lb);
  return [
    0.2104542553 * l + 0.793617785 * m - 0.0040720468 * s,
    1.9779984951 * l - 2.428592205 * m + 0.4505937099 * s,
    0.0259040371 * l + 0.7827717662 * m - 0.808675766 * s,
  ];
}

/** Linear sRGB from OKLab; values outside [0, 1] are out of gamut. */
function oklabToLinear([L, a, b]: [number, number, number]): Rgb {
  const l = (L + 0.3963377774 * a + 0.2158037573 * b) ** 3;
  const m = (L - 0.1055613458 * a - 0.0638541728 * b) ** 3;
  const s = (L - 0.0894841775 * a - 1.291485548 * b) ** 3;
  return [
    4.0767416621 * l - 3.3077115913 * m + 0.2309699292 * s,
    -1.2684380046 * l + 2.6097574011 * m - 0.3413193965 * s,
    -0.0041960863 * l - 0.7034186147 * m + 1.707614701 * s,
  ];
}

export function hexToOklch(hex: string): Oklch {
  const [l, a, b] = rgbToOklab(hexToRgb(hex));
  const c = Math.hypot(a, b);
  const h = c < 1e-6 ? 0 : ((Math.atan2(b, a) * 180) / Math.PI + 360) % 360;
  return { l, c, h };
}

const lchToLinear = ({ l, c, h }: Oklch): Rgb => {
  const rad = (h * Math.PI) / 180;
  return oklabToLinear([l, c * Math.cos(rad), c * Math.sin(rad)]);
};
const inGamut = (rgb: Rgb): boolean => rgb.every((v) => v >= -1e-4 && v <= 1 + 1e-4);

/**
 * The sRGB colour for an OKLCH colour. Out-of-gamut colours keep their lightness and hue and lose
 * chroma until they fit (the CSS Color 4 approach without the perceptual tolerance), so a scale never
 * shifts in lightness or hue to fit sRGB.
 */
export function oklchToHex(colour: Oklch): string {
  let lo = 0;
  let hi = colour.c;
  if (!inGamut(lchToLinear(colour))) {
    for (let i = 0; i < 24; i++) {
      const mid = (lo + hi) / 2;
      if (inGamut(lchToLinear({ ...colour, c: mid }))) lo = mid;
      else hi = mid;
    }
    hi = lo;
  }
  const rgb = lchToLinear({ ...colour, c: hi });
  return rgbToHex(rgb.map((v) => fromLinear(clamp01(v))) as Rgb);
}

/** WCAG 2 relative luminance of an opaque colour. */
export function luminance(hex: string): number {
  const [r, g, b] = hexToRgb(hex).map(toLinear) as Rgb;
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** WCAG 2 contrast ratio of two opaque colours. */
export function contrast(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x) as [number, number];
  return (hi + 0.05) / (lo + 0.05);
}

/** A colour with alpha composited over an opaque background, as #rrggbb. */
export function composite(hex: string, alpha: number, background: string): string {
  const fg = hexToRgb(hex);
  const bg = hexToRgb(background);
  return rgbToHex(fg.map((v, i) => v * alpha + (bg[i] ?? 0) * (1 - alpha)) as Rgb);
}

/**
 * Reference profiles: the OKLCH lightness of each step, and its chroma relative to step 9, measured
 * from Radix Colors 3 (slate for neutrals, indigo for accents). Generated scales keep these shapes.
 */
const RADIX = {
  neutral: {
    light: [
      '#fcfcfd',
      '#f9f9fb',
      '#f0f0f3',
      '#e8e8ec',
      '#e0e1e6',
      '#d9d9e0',
      '#cdced6',
      '#b9bbc6',
      '#8b8d98',
      '#80838d',
      '#60646c',
      '#1c2024',
    ],
    dark: [
      '#111113',
      '#18191b',
      '#212225',
      '#272a2d',
      '#2e3135',
      '#363a3f',
      '#43484e',
      '#5a6169',
      '#696e77',
      '#777b84',
      '#b0b4ba',
      '#edeef0',
    ],
  },
  accent: {
    light: [
      '#fdfdfe',
      '#f7f9ff',
      '#edf2fe',
      '#e1e9ff',
      '#d2deff',
      '#c1d0ff',
      '#abbdf9',
      '#8da4ef',
      '#3e63dd',
      '#3358d4',
      '#3a5bc7',
      '#1f2d5c',
    ],
    dark: [
      '#11131f',
      '#141726',
      '#182449',
      '#1d2e62',
      '#253974',
      '#304384',
      '#3a4f97',
      '#435db1',
      '#3e63dd',
      '#5472e4',
      '#9eb1ff',
      '#d6e1ff',
    ],
  },
} as const;

interface Profile {
  l: number[];
  /** Chroma of each step divided by the chroma of step 9. */
  c: number[];
}

function profile(hexes: readonly string[]): Profile {
  const lch = hexes.map(hexToOklch);
  const c9 = lch[8]?.c || 1;
  return { l: lch.map((x) => x.l), c: lch.map((x) => x.c / c9) };
}

const PROFILES = {
  neutral: { light: profile(RADIX.neutral.light), dark: profile(RADIX.neutral.dark) },
  accent: { light: profile(RADIX.accent.light), dark: profile(RADIX.accent.dark) },
};

/** Move a colour's lightness until `ok` holds, towards black (light mode) or white (dark mode). */
function solve(start: Oklch, mode: Mode, ok: (hex: string) => boolean): string {
  let colour = start;
  for (let i = 0; i < 200 && !ok(oklchToHex(colour)); i++) {
    colour = { ...colour, l: colour.l + (mode === 'light' ? -0.005 : 0.005) };
  }
  return oklchToHex(colour);
}

export interface ScaleOptions {
  /** The solid colour (step 9). Its hue and chroma set the whole scale. */
  solid: string;
  mode: Mode;
  kind: 'neutral' | 'accent';
}

/**
 * A 12-step scale. Steps 1–8 and 10 follow the reference profile at the solid's hue; step 9 is the
 * solid itself; step 11 reaches 4.5:1 and step 12 reaches 7:1 against steps 1–3, so text on any
 * background step of its own scale meets WCAG AA (11) and AAA (12).
 */
export function scale({ solid, mode, kind }: ScaleOptions): Scale {
  const base = hexToOklch(solid);
  const p = PROFILES[kind][mode];
  const steps = p.l.map((l, i) => {
    if (i === 8) return solid;
    let lightness = l;
    // Step 10 is the hovered solid: offset from this solid as the reference offsets from its own.
    if (i === 9) lightness = base.l + ((p.l[9] ?? l) - (p.l[8] ?? l));
    return oklchToHex({ l: lightness, c: base.c * (p.c[i] ?? 0), h: base.h });
  }) as Scale;
  const backgrounds = steps.slice(0, 3);
  const meets = (ratio: number) => (hex: string) =>
    backgrounds.every((bg) => contrast(hex, bg) >= ratio);
  steps[10] = solve(hexToOklch(steps[10]), mode, meets(4.5));
  steps[11] = solve(hexToOklch(steps[11]), mode, meets(7));
  return steps;
}

/** The text colour for a solid fill: white when it reaches 4.5:1, else the scale's step 12 (light mode). */
export function onSolid(solid: string, darkText: string): string {
  return contrast('#ffffff', solid) >= 4.5 ? '#ffffff' : darkText;
}
