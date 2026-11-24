#!/usr/bin/env node
// The designer's eye tests on a finished render, in one sheet:
//   1. SQUINT  - heavy blur: what still stands out is what the eye goes to first.
//   2. VALUE   - grayscale: does the entry point win on light/dark contrast alone (not only colour)?
//   3. GLANCE  - the real small size people first meet it at (feed, wall from afar).
//   4. IN CONTEXT (with --among) - the design placed between its real neighbours (e.g. YouTube results).
//   node attention.mjs <design.png> <out.png> [--glance 240] [--among <folder of images>] [--open]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { render, pngInfo, openFile } from './lib.mjs';

const a = process.argv.slice(2);
const opt = (n, d) => (a.includes(n) ? a[a.indexOf(n) + 1] : d);
const [img, out] = a.filter((x, i) => !x.startsWith('--') && !['--glance', '--among'].includes(a[i - 1]));
if (!img || !out) { console.error('usage: node attention.mjs <design.png> <out.png> [--glance 240] [--among <folder>] [--open]'); process.exit(2); }
const { width, height } = pngInfo(img);
const ratio = width / height;
const src = pathToFileURL(path.resolve(img)).href;
const panelW = ratio >= 1 ? 560 : 360, panelH = Math.round(panelW / ratio);
const glanceW = Number(opt('--glance', ratio >= 1 ? 240 : 160));

let among = [];
const dir = opt('--among', null);
if (dir) among = fs.readdirSync(dir).filter((f) => /\.(jpe?g|png|webp)$/i.test(f)).slice(0, 11).map((f) => pathToFileURL(path.resolve(dir, f)).href);
const ctxCols = 4, ctxW = 300, ctxH = Math.round(ctxW / ratio);
const ctxItems = among.length ? (() => { const all = [...among]; all.splice(Math.min(5, all.length), 0, src); return all; })() : [];
const ctxRows = Math.ceil(ctxItems.length / ctxCols);

const W = Math.max(panelW * 3 + 80, ctxCols * ctxW + 3 * 14 + 40);
const H = 70 + panelH + 40 + (ctxItems.length ? 60 + ctxRows * (ctxH + 14) : 0) + 20;
const html = `<!doctype html><meta charset="utf-8"><style>*{margin:0;box-sizing:border-box}
body{width:${W}px;height:${H}px;background:#e9e8e4;font:600 15px system-ui,sans-serif;color:#222;padding:20px}
.row{display:flex;gap:20px;align-items:flex-start}h3{font-size:15px;margin:0 0 8px}figure{display:flex;flex-direction:column}
.p{width:${panelW}px;height:${panelH}px;background:#fff center/contain no-repeat url("${src}")}
.blur{filter:blur(${Math.round(panelW / 45)}px)}.gray{filter:grayscale(1)}
.g{width:${panelW}px;height:${panelH}px;display:flex;align-items:center;justify-content:center;background:#fff}
.g img{width:${glanceW}px}.ctx{display:grid;grid-template-columns:repeat(${ctxCols},${ctxW}px);gap:14px;margin-top:8px}
.ctx img{width:${ctxW}px;height:${ctxH}px;object-fit:cover;border-radius:10px;display:block}.me{outline:4px solid #ff2d55;outline-offset:3px}
</style>
<div class="row">
<figure><h3>1 · Squint: what still pops?</h3><div class="p blur"></div></figure>
<figure><h3>2 · Value: wins without colour?</h3><div class="p gray"></div></figure>
<figure><h3>3 · Glance: real size (${glanceW}px)</h3><div class="g"><img src="${src}"></div></figure>
</div>
${ctxItems.length ? `<h3 style="margin-top:30px">4 · In context: does yours (red outline) win the scan?</h3><div class="ctx">${ctxItems.map((s) => `<img src="${s}"${s === src ? ' class="me"' : ''}>`).join('')}</div>` : ''}`;
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'designer-att-')), 'att.html');
fs.writeFileSync(tmp, html);
try {
  const r = render(tmp, out, W, H, 1);
  console.log(`ok ${r.file} ${r.width}x${r.height}`);
  if (a.includes('--open')) openFile(r.file);
} catch (e) { console.error(String(e.message || e)); process.exit(1); }
