// Renders marks to PNG for reverse-image similarity checks: node scripts/render-check.ts <outDir>
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { concepts, ink, type MarkId } from './concepts.ts';

const out = process.argv[2] ?? 'concepts/check';
mkdirSync(out, { recursive: true });
for (const c of concepts) {
  for (const id of Object.keys(c.marks) as MarkId[]) {
    const accent = c.accents[id].light;
    const svg =
      `<svg xmlns="http://www.w3.org/2000/svg" viewBox="-8 -8 64 64"><rect x="-8" y="-8" width="64" height="64" fill="#fff"/>` +
      `<style>.ink,.accent{fill:none;stroke-width:4;stroke-linecap:round;stroke-linejoin:round}.ink{stroke:${ink.light}}.accent{stroke:${accent}}.ink-f{fill:${ink.light}}.accent-f{fill:${accent}}</style>` +
      `${c.marks[id]()}</svg>`;
    const png = new Resvg(svg, {
      fitTo: { mode: 'width', value: 512 },
      font: { loadSystemFonts: false },
    })
      .render()
      .asPng();
    writeFileSync(join(out, `${c.id}-${id}.png`), png);
  }
}
console.log('rendered to', out);
