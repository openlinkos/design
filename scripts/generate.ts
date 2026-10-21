// Generates every brand asset into brand/out/<brand>/ from brand/brands.json and brand/marks.ts.
// The output is committed; CI regenerates it and fails if anything differs.
// Usage: node scripts/generate.ts

import { createHash } from 'node:crypto';
import { mkdirSync, rmSync, writeFileSync } from 'node:fs';
import { dirname, join, relative } from 'node:path';
import { fileURLToPath } from 'node:url';
import { Resvg } from '@resvg/resvg-js';
import { type Brand, INK, loadBrands, TILE } from '../brand/brands.ts';
import { type Colours, lockupSvg, markSvg, tileSvg } from '../brand/marks.ts';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const outRoot = join(root, 'brand', 'out');

const png = (svg: string, width: number): Buffer =>
  Buffer.from(
    new Resvg(svg, { fitTo: { mode: 'width', value: width }, font: { loadSystemFonts: false } })
      .render()
      .asPng(),
  );

/** An ICO file whose entries are PNG images (supported by every current browser). */
export const ico = (images: Array<{ size: number; data: Buffer }>): Buffer => {
  const header = Buffer.alloc(6);
  header.writeUInt16LE(0, 0);
  header.writeUInt16LE(1, 2);
  header.writeUInt16LE(images.length, 4);
  const dir = Buffer.alloc(16 * images.length);
  let offset = 6 + dir.length;
  images.forEach(({ size, data }, i) => {
    const e = i * 16;
    dir.writeUInt8(size >= 256 ? 0 : size, e);
    dir.writeUInt8(size >= 256 ? 0 : size, e + 1);
    dir.writeUInt8(0, e + 2);
    dir.writeUInt8(0, e + 3);
    dir.writeUInt16LE(1, e + 4);
    dir.writeUInt16LE(32, e + 6);
    dir.writeUInt32LE(data.length, e + 8);
    dir.writeUInt32LE(offset, e + 12);
    offset += data.length;
  });
  return Buffer.concat([header, dir, ...images.map((i) => i.data)]);
};

/** A wide card (Open Graph image, GitHub social preview): lockup centred on the tile colour. */
const card = (b: Brand, dark: Colours, w: number, h: number): string => {
  const l = lockupSvg(b.mark, dark, b.word, b.descriptor);
  const lockupHeight = h * 0.3;
  const scale = lockupHeight / 48;
  const lw = l.width * scale;
  const x = (w - lw) / 2;
  const y = (h - lockupHeight) / 2;
  const inner = l.svg.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '');
  return (
    `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${w} ${h}"><rect width="${w}" height="${h}" fill="${TILE}"/>` +
    `<g transform="translate(${x.toFixed(2)} ${y.toFixed(2)}) scale(${scale.toFixed(4)})">${inner}</g>` +
    `<rect x="${(w / 2 - 36).toFixed(0)}" y="${(h * 0.78).toFixed(0)}" width="72" height="6" rx="3" fill="${dark.accent}"/></svg>`
  );
};

const files: Array<{ path: string; data: Buffer | string }> = [];
const add = (b: Brand, path: string, data: Buffer | string): void => {
  files.push({ path: join(b.id, path), data });
};

for (const b of loadBrands()) {
  const light: Colours = { ink: INK.light, accent: b.colors.mark.light };
  const dark: Colours = { ink: INK.dark, accent: b.colors.mark.dark };
  const black: Colours = { ink: '#000000', accent: '#000000' };
  const white: Colours = { ink: '#ffffff', accent: '#ffffff' };

  // Web: favicons, app icons, manifest, Open Graph image, navigation logos.
  add(b, 'web/favicon.svg', markSvg(b.mark, light, { small: true, dark }));
  add(
    b,
    'web/favicon.ico',
    ico(
      [16, 32, 48].map((size) => ({
        size,
        data: png(markSvg(b.mark, light, { small: size <= 32 }), size),
      })),
    ),
  );
  add(
    b,
    'web/apple-touch-icon.png',
    png(tileSvg(b.mark, dark, TILE, { bleed: true, scale: 0.66 }), 180),
  );
  add(b, 'web/icon-192.png', png(tileSvg(b.mark, dark, TILE), 192));
  add(b, 'web/icon-512.png', png(tileSvg(b.mark, dark, TILE), 512));
  add(
    b,
    'web/icon-maskable-512.png',
    png(tileSvg(b.mark, dark, TILE, { bleed: true, scale: 0.56 }), 512),
  );
  add(
    b,
    'web/site.webmanifest',
    `${JSON.stringify(
      {
        name: b.name,
        short_name: b.name,
        icons: [
          { src: '/icon-192.png', sizes: '192x192', type: 'image/png' },
          { src: '/icon-512.png', sizes: '512x512', type: 'image/png' },
          {
            src: '/icon-maskable-512.png',
            sizes: '512x512',
            type: 'image/png',
            purpose: 'maskable',
          },
        ],
        theme_color: TILE,
        background_color: '#ffffff',
        display: 'browser',
      },
      null,
      2,
    )}\n`,
  );
  add(b, 'web/og.png', png(card(b, dark, 1200, 630), 1200));
  add(b, 'web/logo.svg', markSvg(b.mark, light));
  add(b, 'web/logo-dark.svg', markSvg(b.mark, dark));

  // GitHub: social preview, avatar, README headers.
  add(b, 'github/social-preview.png', png(card(b, dark, 1280, 640), 1280));
  add(b, 'github/avatar.png', png(tileSvg(b.mark, dark, TILE, { bleed: true, scale: 0.62 }), 500));
  add(b, 'github/readme-light.svg', lockupSvg(b.mark, light, b.word, b.descriptor).svg);
  add(b, 'github/readme-dark.svg', lockupSvg(b.mark, dark, b.word, b.descriptor).svg);

  // Kit: the mark and lockup in every colourway, plus a large raster.
  add(b, 'kit/mark.svg', markSvg(b.mark, light));
  add(b, 'kit/mark-dark.svg', markSvg(b.mark, dark));
  add(b, 'kit/mark-black.svg', markSvg(b.mark, black));
  add(b, 'kit/mark-white.svg', markSvg(b.mark, white));
  add(b, 'kit/lockup.svg', lockupSvg(b.mark, light, b.word, b.descriptor).svg);
  add(b, 'kit/lockup-dark.svg', lockupSvg(b.mark, dark, b.word, b.descriptor).svg);
  add(b, 'kit/mark-1024.png', png(markSvg(b.mark, light), 1024));
}

rmSync(outRoot, { recursive: true, force: true });
const manifest: Record<string, Array<{ file: string; bytes: number; sha256: string }>> = {};
for (const f of files) {
  const target = join(outRoot, f.path);
  mkdirSync(dirname(target), { recursive: true });
  const data = typeof f.data === 'string' ? Buffer.from(f.data) : f.data;
  writeFileSync(target, data);
  const brand = f.path.split(/[\\/]/)[0];
  manifest[brand] ??= [];
  manifest[brand].push({
    file: relative(join(outRoot, brand), target).replaceAll('\\', '/'),
    bytes: data.length,
    sha256: createHash('sha256').update(data).digest('hex'),
  });
}
writeFileSync(join(outRoot, 'manifest.json'), `${JSON.stringify(manifest, null, 2)}\n`);
console.log(
  `Generated ${files.length} files for ${Object.keys(manifest).length} brands in brand/out/`,
);
