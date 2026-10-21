import { readFileSync } from 'node:fs';
import { describe, expect, it } from 'vitest';
import { INK, loadBrands } from '../brand/brands.ts';
import { lockupSvg, markSvg } from '../brand/marks.ts';

const out = new URL('../brand/out/', import.meta.url);
const read = (path: string): Buffer => readFileSync(new URL(path, out));

const luminance = (hex: string): number => {
  const [r, g, b] = [1, 3, 5].map((i) => {
    const v = Number.parseInt(hex.slice(i, i + 2), 16) / 255;
    return v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4;
  });
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
};
const contrast = (a: string, b: string): number => {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
};

/** Width and height from a PNG's IHDR chunk. */
const pngSize = (data: Buffer): [number, number] => {
  expect(data.subarray(1, 4).toString('ascii')).toBe('PNG');
  return [data.readUInt32BE(16), data.readUInt32BE(20)];
};

const brands = loadBrands();

describe('brands.json', () => {
  it('resolves every brand with complete colours', () => {
    expect(brands.map((b) => b.id)).toEqual([
      'openlinkos',
      'origin',
      'agent',
      'linkos',
      'linkos-mirrors',
      'linkos-status',
    ]);
    for (const b of brands) {
      expect(b.colors.brand.light).toHaveLength(3);
      expect(b.colors.brand.dark).toHaveLength(3);
      expect(b.url.en).toMatch(/^https:\/\//);
      expect(b.description.zh.length).toBeGreaterThan(0);
    }
  });

  it.each(brands.map((b) => [b.id, b] as const))('%s meets the contrast rules', (_, b) => {
    // Marks are graphics (3:1); brand-1 is text and links (4.5:1); brand-3 carries white text.
    expect(contrast(b.colors.mark.light, '#ffffff')).toBeGreaterThanOrEqual(3);
    expect(contrast(b.colors.mark.dark, '#1b1b1f')).toBeGreaterThanOrEqual(3);
    for (const bg of ['#ffffff', '#f6f6f7']) {
      expect(contrast(b.colors.brand.light[0], bg)).toBeGreaterThanOrEqual(4.5);
    }
    for (const bg of ['#1b1b1f', '#202127']) {
      expect(contrast(b.colors.brand.dark[0], bg)).toBeGreaterThanOrEqual(4.5);
    }
    expect(contrast('#ffffff', b.colors.brand.light[2])).toBeGreaterThanOrEqual(4.5);
    expect(contrast('#ffffff', b.colors.brand.dark[2])).toBeGreaterThanOrEqual(4.5);
  });
});

describe('marks', () => {
  it('use classes for every colour and contain no text, filters or external references', () => {
    for (const b of brands) {
      for (const svg of [
        markSvg(b.mark, { ink: INK.light, accent: b.colors.mark.light }),
        lockupSvg(b.mark, { ink: INK.light, accent: b.colors.mark.light }, b.word, b.descriptor)
          .svg,
      ]) {
        const body = svg.replace(/<style>.*<\/style>/, '');
        expect(body).not.toMatch(/<text|<filter|href=|#[0-9a-f]{6}/i);
      }
    }
  });
});

describe('generated assets', () => {
  const manifest = JSON.parse(read('manifest.json').toString()) as Record<
    string,
    Array<{ file: string; bytes: number }>
  >;

  it('exist for every brand', () => {
    expect(Object.keys(manifest).sort()).toEqual(brands.map((b) => b.id).sort());
    for (const files of Object.values(manifest)) expect(files).toHaveLength(21);
  });

  it.each(brands.map((b) => [b.id] as const))('%s rasters have the expected sizes', (id) => {
    const sizes: Record<string, [number, number]> = {
      'web/apple-touch-icon.png': [180, 180],
      'web/icon-192.png': [192, 192],
      'web/icon-512.png': [512, 512],
      'web/icon-maskable-512.png': [512, 512],
      'web/og.png': [1200, 630],
      'github/social-preview.png': [1280, 640],
      'github/avatar.png': [500, 500],
      'kit/mark-1024.png': [1024, 1024],
    };
    for (const [file, size] of Object.entries(sizes)) {
      expect(pngSize(read(`${id}/${file}`)), `${id}/${file}`).toEqual(size);
    }
  });

  it('favicon.ico holds 16, 32 and 48 px PNG entries', () => {
    const ico = read('openlinkos/web/favicon.ico');
    expect(ico.readUInt16LE(2)).toBe(1);
    expect(ico.readUInt16LE(4)).toBe(3);
    const entries = [0, 1, 2].map((i) => {
      const size = ico.readUInt8(6 + i * 16);
      const offset = ico.readUInt32LE(6 + i * 16 + 12);
      return [size, pngSize(ico.subarray(offset))[0]];
    });
    expect(entries).toEqual([
      [16, 16],
      [32, 32],
      [48, 48],
    ]);
  });

  it('web manifests list the icons', () => {
    const m = JSON.parse(read('origin/web/site.webmanifest').toString());
    expect(m.name).toBe('Origin');
    expect(m.icons.map((i: { src: string }) => i.src)).toEqual([
      '/icon-192.png',
      '/icon-512.png',
      '/icon-maskable-512.png',
    ]);
  });
});
