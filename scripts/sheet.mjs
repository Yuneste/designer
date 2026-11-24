#!/usr/bin/env node
// Put mock images side by side with big letters A, B, C... so the user can pick one.
//   node sheet.mjs <out.png> <img1.png> <img2.png> [img3.png ...] [--open]
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { render, pngInfo, openFile } from './lib.mjs';

const a = process.argv.slice(2);
const open = a.includes('--open');
const [out, ...imgs] = a.filter((x) => x !== '--open');
if (!out || imgs.length < 2) { console.error('usage: node sheet.mjs <out.png> <img1> <img2> [...] [--open]'); process.exit(2); }

const info = imgs.map((f) => pngInfo(f));
const ratio = info[0].width / info[0].height;
const cols = imgs.length <= 3 ? imgs.length : Math.ceil(Math.sqrt(imgs.length));
const rows = Math.ceil(imgs.length / cols);
const cellW = ratio >= 1 ? 640 : 420, cellH = Math.round(cellW / ratio);
const gap = 28, pad = 36, label = 56;
const W = pad * 2 + cols * cellW + (cols - 1) * gap;
const H = pad * 2 + rows * (cellH + label) + (rows - 1) * gap;
const cells = imgs.map((f, i) => `<figure><div class="l">${String.fromCharCode(65 + i)}</div><img src="${pathToFileURL(path.resolve(f)).href}"></figure>`).join('');
const html = `<!doctype html><meta charset="utf-8"><style>
*{margin:0;box-sizing:border-box}body{width:${W}px;height:${H}px;background:#f2f1ee;padding:${pad}px;font:700 34px system-ui,sans-serif;color:#111;
display:grid;grid-template-columns:repeat(${cols},${cellW}px);gap:${gap}px;align-content:start}
figure{display:flex;flex-direction:column}.l{height:${label}px}img{width:${cellW}px;height:${cellH}px;object-fit:contain;background:#fff;box-shadow:0 2px 14px #0002}
</style>${cells}`;
const tmp = path.join(fs.mkdtempSync(path.join(os.tmpdir(), 'designer-sheet-')), 'sheet.html');
fs.writeFileSync(tmp, html);
try {
  const r = render(tmp, out, W, H, 1);
  console.log(`ok ${r.file} ${r.width}x${r.height}`);
  if (open) openFile(r.file);
} catch (e) { console.error(String(e.message || e)); process.exit(1); }
