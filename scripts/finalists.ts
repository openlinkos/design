// Preview of the two candidates that pass the "not confusable within software/AI" screen.
// node scripts/finalists.ts <outHtml> <evidenceDir>
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { Resvg } from '@resvg/resvg-js';
import { round8 } from './round8.ts';

const [out, evidence] = process.argv.slice(2);
const ids = ['exploded-cube', 'split-cell'] as const;
const svg = (inner: string, bg?: string): string =>
  `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 48 48">${bg ? `<rect width="48" height="48" rx="10.5" fill="${bg}"/><g transform="translate(7.2 7.2) scale(0.7)">${inner}</g>` : inner}</svg>`;
const dataSvg = (s: string): string =>
  `data:image/svg+xml;base64,${Buffer.from(s).toString('base64')}`;
const png = (s: string, w: number): string =>
  `data:image/png;base64,${Buffer.from(new Resvg(s, { fitTo: { mode: 'width', value: w } }).render().asPng()).toString('base64')}`;
const ev = (f: string): string =>
  `data:image/png;base64,${readFileSync(join(evidence, f)).toString('base64')}`;
const NAMES: Record<string, string> = {
  'exploded-cube': '掀顶立方体 · 一个打开的单元：顶面离开盒体，里面的东西向外开放',
  'split-cell': '一分为二的单元 · 两半沿中线错开，开放与连接同时成立',
};
const dark = (inner: string): string => inner.replaceAll('#0f172a', '#e2e8f0');
const rows = ids
  .map((id) => {
    const inner = round8[id].svg();
    return `<section><h2>${NAMES[id]}</h2>
<div class="row"><div class="light"><img width="160" src="${dataSvg(svg(inner))}"></div><div class="dark"><img width="160" src="${dataSvg(svg(dark(inner)))}"></div>
<div class="light"><img width="120" src="${dataSvg(svg(dark(inner), '#0f172a'))}"></div><div class="light"><img width="120" class="round" src="${dataSvg(svg(dark(inner), '#0f172a'))}"></div>
<div class="light px"><img width="16" src="${png(svg(inner), 16)}"><img width="32" src="${png(svg(inner), 32)}"><img width="64" class="zoom" src="${png(svg(inner), 16)}"></div></div>
<p class="note">相似性筛查（左为我们的方案，右为 Lens 最相似的结果）：</p><img class="ev" src="${ev(`r8-${id}-ev.png`)}"></section>`;
  })
  .join('');
writeFileSync(
  out,
  `<!doctype html><html lang="zh-CN"><meta charset="utf-8"><title>Logo 候选 · 同行不混淆</title><style>
body{font-family:system-ui,'Microsoft YaHei';padding:24px 40px;background:#f8fafc;color:#0f172a}section{background:#fff;border:1px solid #e2e8f0;border-radius:16px;padding:24px;margin:24px 0}
.row{display:flex;gap:14px;flex-wrap:wrap;align-items:center}.row>div{padding:16px;border-radius:12px;display:flex;gap:14px;align-items:center}.light{background:#fff;border:1px solid #e2e8f0}.dark{background:#1b1b1f}
.round{border-radius:50%}.zoom{image-rendering:pixelated}.ev{max-width:700px;display:block}.note{color:#475569}</style>
<h1>按「同行不混淆」标准通过的两个候选</h1><p>它们的最相似结果都不在软件/AI 行业。开口六边形 + 节点（B2 一族）在软件行业已有 Esper、IMEI.info、IBM Carbon、Caplo、FastLabel 等，未通过。</p>${rows}</html>`,
);
console.log('wrote', out);
