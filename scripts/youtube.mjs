#!/usr/bin/env node
// What a thumbnail competes with: the real YouTube search results for a topic.
//   node youtube.mjs "<search words>" <out folder> [--count 12]
// Saves <out>/thumbs/*.jpg, <out>/results.json and <out>/grid.png (the results as a viewer sees them).
// For looking and standing out only: never copy a thumbnail.
import fs from 'node:fs';
import path from 'node:path';
import { UA, render } from './lib.mjs';

const a = process.argv.slice(2);
const count = a.includes('--count') ? Number(a[a.indexOf('--count') + 1]) : 12;
const [query, out] = a.filter((x, i) => !x.startsWith('--') && a[i - 1] !== '--count');
if (!query || !out) { console.error('usage: node youtube.mjs "<search words>" <out folder> [--count 12]'); process.exit(2); }
fs.mkdirSync(path.join(out, 'thumbs'), { recursive: true });

const url = `https://www.youtube.com/results?search_query=${encodeURIComponent(query)}&hl=en&gl=US`;
const r = await fetch(url, { headers: { 'user-agent': UA, 'accept-language': 'en-US,en;q=0.9', cookie: 'SOCS=CAI; CONSENT=YES+1' }, signal: AbortSignal.timeout(30000) });
const html = await r.text();
const m = html.match(/var ytInitialData = (\{.*?\});<\/script>/s);
if (!m) { console.error(`Could not read YouTube results (HTTP ${r.status}). Use your web search tool instead.`); process.exit(3); }
const vids = [];
JSON.stringify(JSON.parse(m[1]), (k, v) => {
  if (k === 'videoRenderer' && v?.videoId) vids.push({
    id: v.videoId,
    title: (v.title?.runs || []).map((x) => x.text).join(''),
    channel: v.ownerText?.runs?.[0]?.text || '',
    views: v.viewCountText?.simpleText || '',
    age: v.publishedTimeText?.simpleText || '',
    length: v.lengthText?.simpleText || '',
  });
  return v;
});
const list = vids.slice(0, count);
for (const v of list) {
  for (const q of ['maxresdefault', 'hqdefault']) {
    try {
      const t = await fetch(`https://i.ytimg.com/vi/${v.id}/${q}.jpg`, { signal: AbortSignal.timeout(15000) });
      if (t.ok) { const buf = Buffer.from(await t.arrayBuffer()); if (buf.length > 5000) { v.thumb = `thumbs/${v.id}.jpg`; fs.writeFileSync(path.join(out, v.thumb), buf); break; } }
    } catch {}
  }
}
fs.writeFileSync(path.join(out, 'results.json'), JSON.stringify({ query, results: list }, null, 2));

// The results as a grid, like the YouTube home/search page
const esc = (s) => s.replace(/[&<>"]/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
const cards = list.filter((v) => v.thumb).map((v) => `<div class="c"><div class="t"><img src="${v.thumb}"><span>${esc(v.length)}</span></div><b>${esc(v.title)}</b><i>${esc(v.channel)} · ${esc(v.views)} · ${esc(v.age)}</i></div>`).join('');
fs.writeFileSync(path.join(out, 'grid.html'), `<!doctype html><meta charset="utf-8"><style>*{margin:0;box-sizing:border-box}body{width:1400px;height:1000px;background:#fff;font:14px Roboto,Arial,sans-serif;padding:24px;display:grid;grid-template-columns:repeat(4,1fr);gap:28px 16px;align-content:start}
.t{position:relative;aspect-ratio:16/9;border-radius:12px;overflow:hidden;background:#eee}.t img{width:100%;height:100%;object-fit:cover}.t span{position:absolute;right:6px;bottom:6px;background:#000c;color:#fff;font-size:12px;padding:1px 4px;border-radius:4px}
b{display:block;margin-top:10px;font-weight:600;color:#0f0f0f;line-height:1.35;max-height:2.7em;overflow:hidden}i{display:block;font-style:normal;color:#606060;font-size:12.5px;margin-top:4px}</style>${cards}`);
try { render(path.join(out, 'grid.html'), path.join(out, 'grid.png'), 1400, 1000); } catch {}
for (const v of list) console.log(`${v.views.padEnd(16)} ${v.age.padEnd(10)} ${v.title}  (${v.channel})`);
console.log(`\n${list.length} results · thumbnails in ${path.join(out, 'thumbs')} · grid ${path.join(out, 'grid.png')}`);
