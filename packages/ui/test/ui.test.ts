import { execFileSync } from 'node:child_process';
import { readdirSync, readFileSync } from 'node:fs';
import { beforeAll, describe, expect, it } from 'vitest';
import { loadBrands } from '../../../brand/brands.ts';
import { composite, contrast, deltaE, hexToOklch, scale } from '../src/color.ts';
import { ICONS } from '../src/icons.ts';

const pkg = new URL('../', import.meta.url);
const read = (path: string): string => readFileSync(new URL(path, pkg), 'utf8');

interface Token {
  type: string;
  light: string;
  dark: string;
  brands?: Record<string, { light: string; dark: string }>;
}

let css: string;
let tokens: Record<string, Token>;

beforeAll(() => {
  execFileSync(process.execPath, ['scripts/build.ts'], { cwd: pkg, stdio: 'pipe' });
  css = read('dist/ui.css');
  tokens = JSON.parse(read('dist/tokens.json'));
});

/** An opaque #rrggbb for a resolved colour; translucent colours are composited over `bg`. */
const opaque = (value: string, bg: string): string => {
  const m = /^rgb\((\d+) (\d+) (\d+) \/ ([\d.]+)\)$/.exec(value);
  if (!m) return value;
  const hex = `#${[m[1], m[2], m[3]].map((v) => Number(v).toString(16).padStart(2, '0')).join('')}`;
  return composite(hex, Number(m[4]), bg);
};

describe('scales', () => {
  it('reproduce Radix indigo from its solid within a small perceptual distance', () => {
    const radix = {
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
    };
    for (const mode of ['light', 'dark'] as const) {
      const ours = scale({ solid: '#3e63dd', mode, kind: 'accent' });
      ours.forEach((hex, i) => {
        const a = hexToOklch(hex);
        const b = hexToOklch(radix[mode][i] as string);
        expect(Math.abs(a.l - b.l), `${mode} step ${i + 1}`).toBeLessThan(0.025);
      });
    }
  });
});

describe('colour difference', () => {
  it('measures distance in OKLab and simulates colour vision deficiency', () => {
    expect(deltaE('#ffffff', '#000000')).toBeCloseTo(100, 3);
    // Greys look the same to everyone.
    for (const vision of ['protan', 'deutan'] as const) {
      expect(deltaE('#777777', '#333333', vision)).toBeCloseTo(deltaE('#777777', '#333333'), 3);
    }
    // A red and a green far apart for most readers merge for a deuteranope.
    expect(deltaE('#d62728', '#2ca02c')).toBeGreaterThan(30);
    expect(deltaE('#d62728', '#2ca02c', 'deutan')).toBeLessThan(5);
  });
});

describe('colour contrast for every brand and mode', () => {
  const brands = loadBrands().map((b) => b.id);
  const modes = ['light', 'dark'] as const;
  const value = (name: string, brand: string, mode: (typeof modes)[number]): string => {
    const t = tokens[name];
    if (!t) throw new Error(`no token ${name}`);
    return (t.brands?.[brand] ?? t)[mode];
  };
  const surfaces = ['shell', 'bg', 'bg-subtle', 'surface', 'surface-overlay'];

  for (const brand of brands) {
    for (const mode of modes) {
      const c = (n: string): string => value(`--ol-color-${n}`, brand, mode);
      const ratio = (fg: string, back: string): number =>
        contrast(opaque(c(fg), c('bg')), opaque(c(back), c('bg')));

      it(`${brand} ${mode}: text reaches 4.5:1 on every surface`, () => {
        for (const s of surfaces) {
          for (const t of ['fg', 'fg-muted', 'fg-subtle']) {
            expect(ratio(t, s), `${t} on ${s}`).toBeGreaterThanOrEqual(4.5);
          }
        }
        expect(ratio('fg-muted', 'fill'), 'fg-muted on fill').toBeGreaterThanOrEqual(4.5);
      });

      it(`${brand} ${mode}: tones read on the page, on their tints, and on their solids`, () => {
        for (const tone of ['accent', 'success', 'warning', 'danger', 'info']) {
          for (const s of [...surfaces, `${tone}-bg`]) {
            expect(ratio(`${tone}-text`, s), `${tone}-text on ${s}`).toBeGreaterThanOrEqual(4.5);
          }
          expect(
            ratio(`${tone}-on-solid`, `${tone}-solid`),
            `${tone} on solid`,
          ).toBeGreaterThanOrEqual(4.5);
        }
      });

      it(`${brand} ${mode}: the brand panel keeps its text and mark readable`, () => {
        expect(ratio('on-brand-panel', 'brand-panel')).toBeGreaterThanOrEqual(4.5);
        expect(ratio('on-brand-panel-muted', 'brand-panel')).toBeGreaterThanOrEqual(4.5);
        expect(ratio('mark-inverse', 'brand-panel')).toBeGreaterThanOrEqual(3);
      });

      it(`${brand} ${mode}: control edges, quiet icons and the focus ring reach 3:1`, () => {
        for (const s of surfaces) {
          expect(ratio('border-input', s), `border-input on ${s}`).toBeGreaterThanOrEqual(3);
          expect(ratio('icon-subtle', s), `icon-subtle on ${s}`).toBeGreaterThanOrEqual(3);
          expect(ratio('focus-ring', s), `focus-ring on ${s}`).toBeGreaterThanOrEqual(3);
        }
      });

      // The chart palette. Distances are OKLab ×100 (deltaE); colour-blind readers are simulated
      // with protanopia and deuteranopia at full severity. Charts draw on the surface, inside a
      // frame that sits on the page.
      const series = (): string[] => [1, 2, 3, 4, 5, 6, 7, 8].map((n) => c(`series-${n}`));
      const apart = (a: number, b: number): void => {
        const [x, y] = [series()[a] as string, series()[b] as string];
        const pair = `series ${a + 1} and ${b + 1}`;
        expect(deltaE(x, y), `${pair}, normal vision`).toBeGreaterThanOrEqual(15);
        for (const vision of ['protan', 'deutan'] as const) {
          expect(deltaE(x, y, vision), `${pair}, ${vision}`).toBeGreaterThanOrEqual(8);
        }
      };

      it(`${brand} ${mode}: every chart series reaches 3:1 where charts are drawn`, () => {
        for (const [i, colour] of series().entries()) {
          for (const s of ['surface', 'bg']) {
            expect(contrast(colour, c(s)), `series ${i + 1} on ${s}`).toBeGreaterThanOrEqual(3);
          }
        }
      });

      it(`${brand} ${mode}: neighbouring series, and the first four, stay apart for every reader`, () => {
        for (let i = 0; i < 7; i++) apart(i, i + 1);
        for (let i = 0; i < 4; i++) for (let j = i + 2; j < 4; j++) apart(i, j);
      });

      it(`${brand} ${mode}: the accent has no twin among the other series`, () => {
        const [accent, ...others] = series();
        for (const [i, colour] of others.entries()) {
          expect(deltaE(accent as string, colour), `series 1 and ${i + 2}`).toBeGreaterThanOrEqual(
            15,
          );
        }
      });
    }
  }
});

describe('build', () => {
  it('declares the layers in order and stamps the version', () => {
    const { version } = JSON.parse(read('package.json')) as { version: string };
    expect(css.startsWith(`/*! @openlinkos/ui ${version} | MIT`)).toBe(true);
    expect(css).toContain(
      '@layer ol.reset, ol.tokens, ol.base, ol.layout, ol.components, ol.utilities;',
    );
    for (const brand of loadBrands()) expect(css).toContain(`[data-brand="${brand.id}"] {`);
    expect(css).toContain('[data-density="comfortable"] {');
  });

  it('defines every variable it uses without a fallback', () => {
    const defined = new Set([...css.matchAll(/(--ol-[a-z0-9-]+)\s*:/g)].map((m) => m[1]));
    for (const m of css.matchAll(/var\((--ol-[a-z0-9-]+)\s*([,)])/g)) {
      if (m[2] === ',') continue; // a component knob with a fallback
      expect(defined, m[1]).toContain(m[1]);
    }
    for (const name of Object.keys(tokens)) expect(defined, name).toContain(name);
  });

  it('ships the fonts its font faces reference, with their licence', () => {
    const urls = [...css.matchAll(/url\("(fonts\/[^"]+)"\)/g)].map((m) => m[1] as string);
    expect(new Set(urls)).toEqual(
      new Set(['fonts/Geist-Variable.woff2', 'fonts/GeistMono-Variable.woff2']),
    );
    for (const url of urls) {
      const font = readFileSync(new URL(`dist/${url}`, pkg));
      expect(font.subarray(0, 4).toString('latin1'), url).toBe('wOF2');
    }
    expect(read('dist/fonts/LICENSE-geist.txt')).toMatch(/SIL Open Font License/);
    // Font faces sit outside the layers, before the first layer block.
    expect(css.indexOf('@font-face')).toBeLessThan(css.indexOf('@layer ol.reset {'));
  });

  it('ships every listed icon once, styled only by CSS', () => {
    const sprite = read('dist/icons.svg');
    const json = JSON.parse(read('dist/icons.json')) as { icons: Record<string, string> };
    expect(new Set(ICONS).size).toBe(ICONS.length);
    const ids = [...sprite.matchAll(/<symbol id="([^"]+)" viewBox="0 0 24 24">/g)].map((m) => m[1]);
    expect(ids).toEqual([...ICONS]);
    expect(Object.keys(json.icons)).toEqual([...ICONS]);
    for (const body of Object.values(json.icons)) {
      // Colours follow currentColor, so CSS styles every icon; Lucide fills a few dots with it.
      expect(body.replaceAll('fill="currentColor"', '')).not.toMatch(/stroke=|fill=|<script|<!--/);
    }
    expect(read('dist/LICENSE-lucide.txt')).toMatch(/ISC/);
  });

  it('defines every class and icon the demo pages use, and the pages need no inline style', () => {
    const demos = readdirSync(new URL('demo/', pkg)).filter((f) => f.endsWith('.html'));
    expect(demos.length).toBeGreaterThan(2);
    for (const file of demos) {
      const html = read(`demo/${file}`);
      expect(html, `${file} uses a style attribute`).not.toMatch(/\sstyle=/);
      const classes = new Set(
        [...html.matchAll(/class="([^"]+)"/g)].flatMap((m) =>
          (m[1] ?? '').split(/\s+/).filter((c) => c.startsWith('ol-')),
        ),
      );
      for (const cls of classes) {
        expect(css, `${file}: .${cls}`).toMatch(new RegExp(`.${cls}(?![a-z0-9-])`));
      }
      for (const [, icon] of html.matchAll(/icons\.svg#([a-z0-9-]+)/g)) {
        expect(ICONS as readonly string[], `${file}: ${icon}`).toContain(icon);
      }
    }
  });
});
