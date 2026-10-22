// The token pipeline: reads the design tokens in tokens/*.tokens.json (W3C Design Tokens Community
// Group format), expands palette anchors into 12-step scales for light and dark mode (see color.ts),
// resolves references for every mode and brand, and returns flat, resolved tokens for the emitters.
//
// Extensions used in the sources (all under "com.openlinkos"):
//   scale:   on a colour token in `palette`, expands it into steps 1–12 plus the accessible extras
//            `text-subtle` (4.5:1), `border-input` (3:1) and `border-input-hover` (3.5:1).
//   dark:    the value in dark mode, when it differs from $value (light mode).
//   density: values for `data-density` variants, keyed by density name.
//   brand:   on the `accent` palette group, marks it as generated per brand from brand/brands.json.

import { readdirSync, readFileSync } from 'node:fs';
import { join } from 'node:path';
import { type Brand, loadBrands } from '../../../brand/brands.ts';
import {
  contrast,
  hexToOklch,
  type Mode,
  oklchToHex,
  onSolid,
  type Scale,
  scale,
} from './color.ts';

export const MODES = ['light', 'dark'] as const satisfies readonly Mode[];
export const EXT = 'com.openlinkos';
export const DEFAULT_BRAND = 'openlinkos';

type Json = string | number | boolean | null | Json[] | { [key: string]: Json };
interface TokenNode {
  $value?: Json;
  $type?: string;
  $description?: string;
  $deprecated?: boolean | string;
  $extensions?: Record<string, Json>;
  [key: string]: Json | undefined;
}

/** A token after flattening: its path, type, and raw values per mode (references unresolved). */
export interface RawToken {
  path: string[];
  type: string;
  description?: string;
  /** DTCG $deprecated: true, or a message such as "Use {color.fg-muted}". */
  deprecated?: boolean | string;
  value: Record<Mode, Json>;
  density?: Record<string, Json>;
  /** A CSS unit for number tokens (com.openlinkos.unit), such as em for letter spacing. */
  unit?: string;
}

/** A token with every reference resolved, as CSS-ready strings. */
export interface ResolvedToken {
  name: string;
  path: string[];
  type: string;
  description?: string;
  deprecated?: boolean | string;
  /** CSS value per mode for the default brand. */
  css: Record<Mode, string>;
  /** CSS value per brand and mode, for brand-dependent tokens. */
  brands?: Record<string, Record<Mode, string>>;
  density?: Record<string, string>;
}

const isToken = (node: Json | undefined): node is TokenNode & { $value: Json } =>
  typeof node === 'object' && node !== null && !Array.isArray(node) && '$value' in node;

const ext = (node: TokenNode, key: string): Json | undefined => {
  const e = node.$extensions?.[EXT];
  return typeof e === 'object' && e !== null && !Array.isArray(e) ? e[key] : undefined;
};

/** Read and deep-merge every tokens/*.tokens.json file. Two files may not define the same token. */
export function loadSources(dir: string): Record<string, Json> {
  const tree: Record<string, Json> = {};
  const merge = (into: Record<string, Json>, from: Record<string, Json>, at: string[]): void => {
    for (const [key, value] of Object.entries(from)) {
      const existing = into[key];
      if (existing === undefined) {
        into[key] = value;
      } else if (
        !isToken(existing) &&
        !isToken(value) &&
        typeof existing === 'object' &&
        typeof value === 'object' &&
        existing &&
        value &&
        !Array.isArray(existing) &&
        !Array.isArray(value)
      ) {
        merge(existing as Record<string, Json>, value as Record<string, Json>, [...at, key]);
      } else if (!key.startsWith('$')) {
        throw new Error(`token ${[...at, key].join('.')} is defined twice`);
      }
    }
  };
  for (const file of readdirSync(dir)
    .filter((f) => f.endsWith('.tokens.json'))
    .sort()) {
    merge(tree, JSON.parse(readFileSync(join(dir, file), 'utf8')), []);
  }
  return tree;
}

/** A colour value as #rrggbb: a hex string, or a DTCG colour object with `hex` or sRGB components. */
export function colourHex(value: Json): string | null {
  if (typeof value === 'string' && /^#[0-9a-f]{6}$/i.test(value)) return value.toLowerCase();
  if (typeof value === 'object' && value !== null && !Array.isArray(value)) {
    if (typeof value.hex === 'string') return value.hex.toLowerCase();
    if (value.colorSpace === 'srgb' && Array.isArray(value.components)) {
      const [r, g, b] = value.components.map((c) => Math.round(Number(c) * 255));
      return `#${[r, g, b].map((c) => (c ?? 0).toString(16).padStart(2, '0')).join('')}`;
    }
  }
  return null;
}

const colourObject = (hex: string): Json => {
  const comps = [1, 3, 5].map((i) =>
    Number((Number.parseInt(hex.slice(i, i + 2), 16) / 255).toFixed(4)),
  );
  return { colorSpace: 'srgb', components: comps, hex };
};

/** The accessible extras added to every generated scale. */
function extras(steps: Scale, mode: Mode): Record<string, string> {
  // Every surface the extras sit on: steps 1–3 (step 3 is the light shell and the dark overlay),
  // and white surfaces in light mode.
  const backgrounds =
    mode === 'light' ? [steps[0], steps[1], steps[2], '#ffffff'] : [steps[0], steps[1], steps[2]];
  const solve = (from: string, ratio: number): string => {
    let c = hexToOklch(from);
    for (let i = 0; i < 200; i++) {
      const hex = oklchToHex(c);
      if (backgrounds.every((bg) => contrast(hex, bg) >= ratio)) return hex;
      c = { ...c, l: c.l + (mode === 'light' ? -0.004 : 0.004) };
    }
    throw new Error(`cannot reach ${ratio}:1 from ${from}`);
  };
  return {
    'text-subtle': solve(steps[9], 4.5),
    'border-input': solve(steps[7], 3),
    'border-input-hover': solve(steps[7], 3.6),
    'on-solid': onSolid(
      steps[8],
      mode === 'light' ? steps[11] : scale({ solid: steps[8], mode: 'light', kind: 'accent' })[11],
    ),
  };
}

/** Palette steps as a token subtree for one mode: { "1": {$value}, …, "12", extras }. */
function scaleTree(solid: string, kind: 'neutral' | 'accent', mode: Mode): Record<string, Json> {
  const steps = scale({ solid, mode, kind });
  const out: Record<string, Json> = {};
  steps.forEach((hex, i) => {
    out[String(i + 1)] = { $type: 'color', $value: colourObject(hex) };
  });
  for (const [k, hex] of Object.entries(extras(steps, mode)))
    out[k] = { $type: 'color', $value: colourObject(hex) };
  return out;
}

/**
 * The palette for one mode and brand: anchors in `palette` with the scale extension become scales;
 * the `accent` group is generated from the brand's solid colours.
 */
export function expandPalette(
  tree: Record<string, Json>,
  mode: Mode,
  brand: Brand,
): Record<string, Json> {
  const palette = (tree.palette ?? {}) as Record<string, Json>;
  const out: Record<string, Json> = {};
  for (const [name, node] of Object.entries(palette)) {
    if (name.startsWith('$')) continue;
    if (isToken(node)) {
      const kind = ext(node, 'scale');
      const hex = colourHex(mode === 'dark' ? (ext(node, 'dark') ?? node.$value) : node.$value);
      if (!hex) throw new Error(`palette.${name}: expected a colour`);
      out[name] = kind === 'neutral' || kind === 'accent' ? scaleTree(hex, kind, mode) : node;
      continue;
    }
    if (ext(node as TokenNode, 'brand') === true) {
      out[name] = {
        ...scaleTree(brand.colors.brand[mode][2], 'accent', mode),
        mark: { $type: 'color', $value: colourObject(brand.colors.mark[mode]) },
        // The mark on a dark brand panel in either mode.
        'mark-inverse': { $type: 'color', $value: colourObject(brand.colors.mark.dark) },
      };
      continue;
    }
    out[name] = node;
  }
  return out;
}

/** Flatten the non-palette tokens, inheriting $type from enclosing groups. */
export function flatten(tree: Record<string, Json>): RawToken[] {
  const out: RawToken[] = [];
  const walk = (node: Record<string, Json>, path: string[], inherited?: string): void => {
    const type = (node.$type as string | undefined) ?? inherited;
    if (isToken(node)) {
      if (!type) throw new Error(`token ${path.join('.')} has no $type`);
      const dark = ext(node, 'dark');
      const density = ext(node, 'density');
      const unit = ext(node, 'unit');
      out.push({
        path,
        type,
        description: node.$description,
        deprecated: node.$deprecated,
        value: { light: node.$value, dark: dark ?? node.$value },
        density:
          density && typeof density === 'object' && !Array.isArray(density) ? density : undefined,
        unit: typeof unit === 'string' ? unit : undefined,
      });
      return;
    }
    for (const [key, child] of Object.entries(node)) {
      if (
        key.startsWith('$') ||
        typeof child !== 'object' ||
        child === null ||
        Array.isArray(child)
      )
        continue;
      walk(child as Record<string, Json>, [...path, key], type);
    }
  };
  for (const [key, child] of Object.entries(tree)) {
    if (key === 'palette' || key.startsWith('$')) continue;
    walk(child as Record<string, Json>, [key]);
  }
  return out;
}

const REF = /\{([^{}]+)\}/g;

/** Look up a dotted path in a tree. */
function lookup(tree: Record<string, Json>, dotted: string): TokenNode | undefined {
  let node: Json | undefined = tree;
  for (const part of dotted.split('.')) {
    if (typeof node !== 'object' || node === null || Array.isArray(node)) return undefined;
    node = (node as Record<string, Json>)[part];
  }
  return isToken(node) ? node : undefined;
}

const px = (d: Json): string => {
  if (typeof d === 'object' && d !== null && !Array.isArray(d) && 'value' in d) {
    const v = Number(d.value);
    return v === 0 ? '0' : `${v}${String(d.unit)}`;
  }
  return String(d);
};

/** A resolved value as CSS, by DTCG type. `unit` applies to number tokens. */
export function toCss(type: string, value: Json, unit?: string): string {
  switch (type) {
    case 'color': {
      if (typeof value === 'string') return value;
      const hex = colourHex(value);
      const alpha =
        typeof value === 'object' && value && !Array.isArray(value) ? value.alpha : undefined;
      if (hex && (alpha === undefined || alpha === 1)) return hex;
      if (hex) {
        const [r, g, b] = [1, 3, 5].map((i) => Number.parseInt(hex.slice(i, i + 2), 16));
        return `rgb(${r} ${g} ${b} / ${Number(alpha)})`;
      }
      throw new Error(`bad colour ${JSON.stringify(value)}`);
    }
    case 'dimension':
    case 'duration':
      return px(value);
    case 'cubicBezier':
      return `cubic-bezier(${(value as number[]).join(', ')})`;
    case 'fontFamily':
      return (Array.isArray(value) ? value : [value])
        .map((f) => (/^[a-z-]+$/i.test(String(f)) && !/\s/.test(String(f)) ? String(f) : `"${f}"`))
        .join(', ');
    case 'fontWeight':
      return String(value);
    case 'number':
      return unit && Number(value) !== 0 ? `${value}${unit}` : String(value);
    case 'typography': {
      const t = value as Record<string, Json>;
      const family = toCss('fontFamily', t.fontFamily ?? 'sans-serif');
      return `${t.fontWeight ?? 400} ${px(t.fontSize ?? '1rem')}/${px(t.lineHeight ?? 'normal')} ${family}`;
    }
    case 'shadow': {
      const layers = Array.isArray(value) ? value : [value];
      return layers
        .map((l) => {
          const s = l as Record<string, Json>;
          return [
            s.inset ? 'inset' : '',
            px(s.offsetX ?? 0),
            px(s.offsetY ?? 0),
            px(s.blur ?? 0),
            px(s.spread ?? 0),
            toCss('color', s.color ?? '#000000'),
          ]
            .filter(Boolean)
            .join(' ');
        })
        .join(', ');
    }
    default:
      return String(value);
  }
}

/** Resolve references in a value against a tree (recursively), returning the referenced raw value. */
function resolveValue(value: Json, tree: Record<string, Json>, mode: Mode, seen: string[]): Json {
  if (typeof value === 'string') {
    const whole = /^\{([^{}]+)\}$/.exec(value);
    if (whole?.[1]) {
      const name = whole[1];
      if (seen.includes(name)) throw new Error(`reference cycle: ${[...seen, name].join(' -> ')}`);
      const target = lookup(tree, name);
      if (!target) throw new Error(`unresolved reference {${name}}`);
      const raw = mode === 'dark' ? (ext(target, 'dark') ?? target.$value) : target.$value;
      return resolveValue(raw, tree, mode, [...seen, name]);
    }
    if (REF.test(value)) throw new Error(`references must be whole values: ${value}`);
    return value;
  }
  if (Array.isArray(value)) return value.map((v) => resolveValue(v, tree, mode, seen));
  if (typeof value === 'object' && value !== null) {
    return Object.fromEntries(
      Object.entries(value).map(([k, v]) => [k, resolveValue(v, tree, mode, seen)]),
    );
  }
  return value;
}

/** Whether a raw value refers, directly or through other tokens, to the per-brand accent palette. */
function usesAccent(value: Json, tree: Record<string, Json>): boolean {
  const text = JSON.stringify(value);
  if (text.includes('{palette.accent.')) return true;
  for (const m of text.matchAll(REF)) {
    const target = m[1] ? lookup(tree, m[1]) : undefined;
    if (target && m[1] && !m[1].startsWith('palette.') && usesAccent(target.$value, tree))
      return true;
  }
  return false;
}

export const cssName = (path: string[]): string => `--ol-${path.join('-')}`;

/** Every token resolved for both modes, the default brand, every brand (for accent tokens), and densities. */
export function resolveTokens(dir: string): ResolvedToken[] {
  const sources = loadSources(dir);
  const brands = loadBrands();
  const brand = (id: string): Brand => {
    const b = brands.find((x) => x.id === id);
    if (!b) throw new Error(`unknown brand ${id}`);
    return b;
  };
  const treeFor = (mode: Mode, b: Brand): Record<string, Json> => ({
    ...sources,
    palette: expandPalette(sources, mode, b),
  });
  const trees = new Map<string, Record<string, Json>>();
  const tree = (mode: Mode, id: string): Record<string, Json> => {
    const key = `${mode}:${id}`;
    if (!trees.has(key)) trees.set(key, treeFor(mode, brand(id)));
    return trees.get(key) as Record<string, Json>;
  };
  const tokens = flatten(sources);
  return tokens.map((t) => {
    const perBrand = usesAccent(t.value.light, sources) || usesAccent(t.value.dark, sources);
    const css = (id: string): Record<Mode, string> =>
      Object.fromEntries(
        MODES.map((m) => [m, toCss(t.type, resolveValue(t.value[m], tree(m, id), m, []), t.unit)]),
      ) as Record<Mode, string>;
    const resolved: ResolvedToken = {
      name: cssName(t.path),
      path: t.path,
      type: t.type,
      description: t.description,
      deprecated: t.deprecated,
      css: css(DEFAULT_BRAND),
    };
    if (perBrand) resolved.brands = Object.fromEntries(brands.map((b) => [b.id, css(b.id)]));
    if (t.density) {
      resolved.density = Object.fromEntries(
        Object.entries(t.density).map(([k, v]) => [
          k,
          toCss(t.type, resolveValue(v, tree('light', DEFAULT_BRAND), 'light', []), t.unit),
        ]),
      );
    }
    return resolved;
  });
}

// CSS emission. References stay references (var()), so brand and density overrides only redefine
// the variables they change and every semantic token follows.

const paletteVar = (path: string[]): string => `--ol-${path.join('-')}`;

/** A raw (unresolved) value as CSS, with references to other tokens as var(). */
function cssValue(type: string, value: Json, unit?: string): string {
  if (typeof value === 'string') {
    const whole = /^\{([^{}]+)\}$/.exec(value);
    if (whole?.[1]) return `var(${paletteVar(whole[1].split('.'))})`;
  }
  switch (type) {
    case 'typography': {
      const t = value as Record<string, Json>;
      const part = (v: Json | undefined, ty: string): string => cssValue(ty, v ?? '', undefined);
      return `${part(t.fontWeight, 'fontWeight')} ${part(t.fontSize, 'dimension')}/${part(t.lineHeight, 'dimension')} ${part(t.fontFamily, 'fontFamily')}`;
    }
    case 'shadow': {
      const layers = Array.isArray(value) ? value : [value];
      return layers
        .map((l) => {
          const s = l as Record<string, Json>;
          return [
            s.inset ? 'inset' : '',
            cssValue('dimension', s.offsetX ?? 0),
            cssValue('dimension', s.offsetY ?? 0),
            cssValue('dimension', s.blur ?? 0),
            cssValue('dimension', s.spread ?? 0),
            cssValue('color', s.color ?? '#000000'),
          ]
            .filter(Boolean)
            .join(' ');
        })
        .join(', ');
    }
    default:
      return toCss(type, value, unit);
  }
}

/** One declaration per mode: equal values once, colours that differ as light-dark(). */
function modal(type: string, light: string, dark: string): string {
  if (light === dark) return light;
  if (type !== 'color') throw new Error(`only colours may differ by mode (${light} / ${dark})`);
  return `light-dark(${light}, ${dark})`;
}

export interface TokenCss {
  root: string[];
  brands: Record<string, string[]>;
  densities: Record<string, string[]>;
}

/** The declarations of the token layer. */
export function tokenCss(dir: string): TokenCss {
  const sources = loadSources(dir);
  const brands = loadBrands();
  const palette = (mode: Mode, b: Brand): Record<string, Json> => expandPalette(sources, mode, b);
  const scales = (b: Brand, only?: string): string[] => {
    const light = palette('light', b);
    const dark = palette('dark', b);
    const out: string[] = [];
    for (const [name, steps] of Object.entries(light)) {
      if (only !== undefined && name !== only) continue;
      if (only === undefined && name === 'accent' && b.id !== DEFAULT_BRAND) continue;
      for (const [step, node] of Object.entries(steps as Record<string, Json>)) {
        const l = toCss('color', (node as TokenNode).$value ?? '');
        const d = toCss(
          'color',
          ((dark[name] as Record<string, Json>)[step] as TokenNode).$value ?? '',
        );
        out.push(`${paletteVar(['palette', name, step])}: ${modal('color', l, d)};`);
      }
    }
    return out;
  };
  const defaultBrand = brands.find((b) => b.id === DEFAULT_BRAND) as Brand;
  const root = [...scales(defaultBrand)];
  const densities: Record<string, string[]> = {};
  // Custom properties substitute var() where they are declared, so a brand block must redeclare
  // every token that depends on the accent, not only the accent palette.
  const accentDependent: string[] = [];
  for (const t of flatten(sources)) {
    const light = cssValue(t.type, t.value.light, t.unit);
    const dark = cssValue(t.type, t.value.dark, t.unit);
    const decl = `${cssName(t.path)}: ${modal(t.type, light, dark)};`;
    root.push(decl);
    if (usesAccent(t.value.light, sources) || usesAccent(t.value.dark, sources)) {
      accentDependent.push(decl);
    }
    for (const [density, v] of Object.entries(t.density ?? {})) {
      densities[density] ??= [];
      densities[density].push(`${cssName(t.path)}: ${cssValue(t.type, v, t.unit)};`);
    }
  }
  const perBrand = Object.fromEntries(
    brands.map((b) => [b.id, [...scales(b, 'accent'), ...accentDependent]]),
  );
  return { root, brands: perBrand, densities };
}
