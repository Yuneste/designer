#!/usr/bin/env node
// Render a design page to a PNG.
//   node render.mjs <page.html> <out.png> <width> <height> [--scale 2] [--open]
// width/height are the design's size in CSS pixels; --scale multiplies the pixels (2 = sharp print/retina).
import { render, openFile } from './lib.mjs';

const a = process.argv.slice(2);
const flag = (n) => a.includes(n);
const val = (n, d) => (a.includes(n) ? a[a.indexOf(n) + 1] : d);
const pos = a.filter((x, i) => !x.startsWith('--') && !(i > 0 && a[i - 1] === '--scale'));
const [html, out, w, h] = pos;
if (!html || !out || !w || !h) {
  console.error('usage: node render.mjs <page.html> <out.png> <width> <height> [--scale 2] [--open]');
  process.exit(2);
}
const scale = Number(val('--scale', 1));
try {
  const r = render(html, out, Number(w), Number(h), scale);
  const want = [Math.round(w * scale), Math.round(h * scale)];
  const ok = r.width === want[0] && r.height === want[1];
  console.log(`${ok ? 'ok' : 'SIZE MISMATCH'} ${r.file} ${r.width}x${r.height}${ok ? '' : ` (wanted ${want.join('x')})`}`);
  if (flag('--open')) openFile(r.file);
  process.exit(ok ? 0 : 1);
} catch (e) {
  console.error(String(e.message || e));
  process.exit(1);
}
