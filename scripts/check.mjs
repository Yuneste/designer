#!/usr/bin/env node
// Checks that this computer can make designs: Node, a browser, exact sizes, JavaScript, web fonts, 3D (WebGL).
//   node check.mjs        -> PASS / WARN / FAIL lines, exit 1 on any FAIL
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { findBrowser, render, pngPixels, NO_BROWSER } from './lib.mjs';

let fails = 0;
const line = (s, m) => { if (s === 'FAIL') fails++; console.log(`${s.padEnd(4)}  ${m}`); };

const major = Number(process.versions.node.split('.')[0]);
line(major >= 18 ? 'PASS' : 'FAIL', `Node ${process.versions.node}${major >= 18 ? '' : ' (needs 18 or newer)'}`);
line('INFO', `${os.platform()} ${os.arch()} ${os.release()}`);

const browser = findBrowser();
if (!browser) { line('FAIL', NO_BROWSER); process.exit(1); }
line('PASS', `browser: ${browser}`);

// Test page: three tiles turn green when JavaScript ran, the web font loaded and WebGL works; orange/red otherwise.
const html = `<!doctype html><meta charset="utf-8">
<link rel="preconnect" href="https://fonts.googleapis.com"><link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anton&display=block" rel="stylesheet">
<style>*{margin:0}body{width:600px;height:200px;display:flex;background:#fff}div{flex:1;background:rgb(220,0,0)}</style>
<div id="js"></div><div id="font"></div><div id="gl"></div>
<span style="font-family:Anton;position:absolute;left:-999px">Test</span>
<script>
const G='rgb(0,200,0)', O='rgb(255,150,0)';
document.getElementById('js').style.background=G;
document.getElementById('font').style.background=O;
document.fonts.load('40px Anton').then(()=>{ if(document.fonts.check('40px Anton')) document.getElementById('font').style.background=G; });
try{ const c=document.createElement('canvas'); const g=c.getContext('webgl2')||c.getContext('webgl');
  document.getElementById('gl').style.background = g ? G : O; }catch(e){ document.getElementById('gl').style.background=O; }
</script>`;
const dir = fs.mkdtempSync(path.join(os.tmpdir(), 'designer-check-'));
fs.writeFileSync(path.join(dir, 'check.html'), html);
let px;
try {
  const r = render(path.join(dir, 'check.html'), path.join(dir, 'check.png'), 600, 200, 1);
  line(r.width === 600 && r.height === 200 ? 'PASS' : 'FAIL', `render size ${r.width}x${r.height} (wanted 600x200)`);
  const r2 = render(path.join(dir, 'check.html'), path.join(dir, 'check2.png'), 600, 200, 2);
  line(r2.width === 1200 && r2.height === 400 ? 'PASS' : 'FAIL', `sharp render (--scale 2) ${r2.width}x${r2.height} (wanted 1200x400)`);
  px = pngPixels(r.file);
} catch (e) { line('FAIL', String(e.message || e)); process.exit(1); }

const tile = (x) => { const [r, g] = px.at(x, 100); return g > 150 && r < 80 ? 'green' : r > 200 && g > 100 ? 'orange' : 'red'; };
const js = tile(100), font = tile(300), gl = tile(500);
line(js === 'green' ? 'PASS' : 'FAIL', `JavaScript in pages: ${js === 'green' ? 'runs' : 'did not run'}`);
line(font === 'green' ? 'PASS' : 'WARN', font === 'green' ? 'web fonts (Google Fonts) load'
  : 'web fonts did not load (offline or blocked). Designs fall back to local fonts; put .woff2 files next to the page for full control.');
line(gl === 'green' ? 'PASS' : 'WARN', gl === 'green' ? '3D (WebGL) works' : 'no WebGL: skip true 3D scenes, use the CSS "soft 3D" look instead');
try { fs.rmSync(dir, { recursive: true, force: true }); } catch {}
console.log(fails ? `\n${fails} problem(s). Fix the FAIL lines above.` : '\nReady to design.');
process.exit(fails ? 1 : 0);
