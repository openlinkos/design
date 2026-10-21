// Builds dist/: compiles src/ with tsc, then copies the theme CSS and the brand data
// (brand/brands.json and the generated web, GitHub and kit files) into dist/brand/.
// Usage: node scripts/build.ts

import { execFileSync } from 'node:child_process';
import { copyFileSync, cpSync, existsSync, mkdirSync, readdirSync, rmSync } from 'node:fs';
import { createRequire } from 'node:module';
import { dirname, join } from 'node:path';
import { fileURLToPath } from 'node:url';

const pkg = join(dirname(fileURLToPath(import.meta.url)), '..');
const repo = join(pkg, '..', '..');
const dist = join(pkg, 'dist');

rmSync(dist, { recursive: true, force: true });

const tsc = createRequire(import.meta.url).resolve('typescript/bin/tsc');
execFileSync(process.execPath, [tsc, '-p', join(pkg, 'tsconfig.json')], { stdio: 'inherit' });

copyFileSync(join(pkg, 'src', 'theme', 'style.css'), join(dist, 'theme', 'style.css'));

const brand = join(repo, 'brand');
mkdirSync(join(dist, 'brand'), { recursive: true });
copyFileSync(join(brand, 'brands.json'), join(dist, 'brand', 'brands.json'));
for (const id of readdirSync(join(brand, 'out'), { withFileTypes: true })) {
  if (!id.isDirectory()) continue;
  for (const group of ['web', 'github', 'kit']) {
    const from = join(brand, 'out', id.name, group);
    if (existsSync(from))
      cpSync(from, join(dist, 'brand', 'out', id.name, group), { recursive: true });
  }
}

console.log('Built dist/');
