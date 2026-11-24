#!/usr/bin/env node
// Learn a brand from its own website or online store: screenshots, colours, fonts, logo, photos, words.
//   node site.mjs <url> <out folder>
// Writes <out>/desktop.png, <out>/mobile.png, <out>/images/*, <out>/site.json and prints a short summary.
// Use it only on the user's own business (their store, menu page, portfolio).
import fs from 'node:fs';
import path from 'node:path';
import { render, dumpDom, UA } from './lib.mjs';

const [url, out] = process.argv.slice(2);
if (!/^https?:\/\//.test(url || '') || !out) { console.error('usage: node site.mjs <https://...> <out folder>'); process.exit(2); }
fs.mkdirSync(path.join(out, 'images'), { recursive: true });
const abs = (u) => { try { return new URL(u.replace(/&amp;/g, '&'), url).href; } catch { return null; } };
const attr = (tag, name) => (tag.match(new RegExp(`\\b${name}\\s*=\\s*["']([^"']*)["']`, 'i')) || [])[1];

// 1. What it looks like
for (const [name, w, h] of [['desktop', 1440, 2000], ['mobile', 430, 1800]]) {
  try { render(url, path.join(out, `${name}.png`), w, h, 1, 10000); console.log(`screenshot ${name}.png`); }
  catch (e) { console.log(`screenshot ${name} failed: ${String(e.message).split('\n')[0]}`); }
}

// 2. What it is made of
let html = '';
try { html = dumpDom(url); } catch (e) { console.error(`could not read the page: ${e.message}`); }
const tags = (name) => html.match(new RegExp(`<${name}\\b[^>]*>`, 'gi')) || [];
const metas = Object.fromEntries(tags('meta').map((t) => [(attr(t, 'property') || attr(t, 'name') || '').toLowerCase(), attr(t, 'content')]).filter(([k, v]) => k && v));
const title = (html.match(/<title[^>]*>([^<]*)<\/title>/i) || [])[1]?.trim() || '';
const blocked = !html || /attention required|just a moment|access denied|are you a robot|verify you are human|captcha/i.test(title + ' ' + html.slice(0, 20000).replace(/<[^>]+>/g, ' ').slice(0, 3000));
if (blocked) {
  console.log(`BLOCKED: the site stops automated visits (${title || 'no page'}).
Do instead: look at desktop.png anyway (it may show the block page), then try your web fetch tool on the same link,
or ask the user for 2-3 screenshots of their site or social page plus their logo file.`);
  fs.writeFileSync(path.join(out, 'site.json'), JSON.stringify({ url, blocked: true, title }, null, 2));
  process.exit(3);
}

// CSS: inline <style> plus up to 6 linked stylesheets on the same site or font hosts
let css = (html.match(/<style[^>]*>[\s\S]*?<\/style>/gi) || []).join('\n') + '\n' + tags('[a-z]+').map((t) => attr(t, 'style') || '').join(';');
const sheets = tags('link').filter((t) => /stylesheet/i.test(attr(t, 'rel') || '')).map((t) => abs(attr(t, 'href') || '')).filter(Boolean).slice(0, 6);
for (const s of sheets) {
  try { const r = await fetch(s, { headers: { 'user-agent': UA }, signal: AbortSignal.timeout(15000) }); if (r.ok) css += '\n' + (await r.text()).slice(0, 2_000_000); } catch {}
}
css = css.replace(/&quot;|&#39;|&#x27;/g, '"');
const fontNames = new Map();
for (const m of css.matchAll(/font-family\s*:\s*([^;}{]+)/gi)) {
  const first = m[1].split(',')[0].trim().replace(/["']/g, '');
  if (first && !/^(inherit|initial|var\(|-apple-system|system-ui|sans-serif|serif|monospace|arial|helvetica)/i.test(first)) fontNames.set(first, (fontNames.get(first) || 0) + 1);
}
for (const s of sheets) { const f = s.match(/family=([^&:]+)/); if (f) fontNames.set(decodeURIComponent(f[1]).replace(/\+/g, ' '), 999); }
const colours = new Map();
const norm = (h) => { h = h.toLowerCase(); return h.length === 4 ? '#' + [...h.slice(1)].map((c) => c + c).join('') : h.slice(0, 7); };
for (const m of css.matchAll(/#[0-9a-f]{6}\b|#[0-9a-f]{3}\b/gi)) { const c = norm(m[0]); colours.set(c, (colours.get(c) || 0) + 1); }
for (const m of css.matchAll(/rgba?\(\s*(\d+)[ ,]+(\d+)[ ,]+(\d+)/gi)) { const c = '#' + [m[1], m[2], m[3]].map((n) => (+n).toString(16).padStart(2, '0')).join(''); colours.set(c, (colours.get(c) || 0) + 1); }
const top = (m, n) => [...m].sort((a, b) => b[1] - a[1]).slice(0, n);

// Images: logo first, then the share image, then the page's photos in order
const imgs = tags('img').map((t) => {
  const set = attr(t, 'srcset') || attr(t, 'data-srcset');
  const best = set ? set.split(',').map((s) => s.trim().split(/\s+/)).sort((a, b) => parseInt(b[1] || 0) - parseInt(a[1] || 0))[0][0] : null;
  return { src: abs(best || attr(t, 'src') || attr(t, 'data-src') || ''), alt: attr(t, 'alt') || '', logo: /logo/i.test(t) };
}).filter((i) => i.src && !i.src.startsWith('data:'));
const icon = tags('link').filter((t) => /apple-touch-icon|icon/i.test(attr(t, 'rel') || '')).map((t) => abs(attr(t, 'href') || '')).filter(Boolean);
const wanted = [
  ...imgs.filter((i) => i.logo).slice(0, 2).map((i) => ({ ...i, kind: 'logo' })),
  ...(metas['og:image'] ? [{ src: abs(metas['og:image']), alt: 'share image', kind: 'share' }] : []),
  ...icon.slice(-1).map((src) => ({ src, alt: 'site icon', kind: 'icon' })),
  ...imgs.filter((i) => !i.logo).map((i) => ({ ...i, kind: 'photo' })),
];
const seen = new Set(), saved = [];
for (const im of wanted) {
  if (saved.length >= 12 || seen.has(im.src)) continue;
  seen.add(im.src);
  try {
    const r = await fetch(im.src, { headers: { 'user-agent': UA, referer: url }, signal: AbortSignal.timeout(15000) });
    const type = r.headers.get('content-type') || '';
    if (!r.ok || !/image\//.test(type)) continue;
    const buf = Buffer.from(await r.arrayBuffer());
    if (buf.length < 3000 && im.kind === 'photo') continue; // skip tracking pixels and tiny icons
    const ext = (type.match(/image\/(png|jpeg|webp|svg\+xml|gif|avif)/) || [, 'img'])[1].replace('jpeg', 'jpg').replace('svg+xml', 'svg');
    const file = `images/${im.kind}-${saved.length + 1}.${ext}`;
    fs.writeFileSync(path.join(out, file), buf);
    saved.push({ file, kind: im.kind, alt: im.alt, kb: Math.round(buf.length / 1024), from: im.src });
  } catch {}
}

const text = html.replace(/<(script|style|noscript|svg)[\s\S]*?<\/\1>/gi, ' ').replace(/<[^>]+>/g, ' ').replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/\s+/g, ' ').trim();
const site = {
  url, title, description: metas['description'] || metas['og:description'] || '', themeColor: metas['theme-color'] || '',
  fonts: top(fontNames, 6).map(([f]) => f),
  colours: top(colours, 12).map(([c, n]) => ({ c, n })),
  prices: [...new Set(text.match(/(?:[$€£¥]\s?\d+(?:[.,]\d{2})?|\d+(?:[.,]\d{2})?\s?(?:€|EUR|USD|kr|zł))/g) || [])].slice(0, 30),
  images: saved,
  text: text.slice(0, 6000),
};
fs.writeFileSync(path.join(out, 'site.json'), JSON.stringify(site, null, 2));
console.log(`title: ${title}\nfonts: ${site.fonts.join(', ') || '(none found)'}\ncolours: ${site.colours.slice(0, 8).map((x) => x.c).join(' ')}\ntheme colour: ${site.themeColor || '-'}\nimages saved: ${saved.length} (${saved.map((s) => s.kind).join(', ')})\nprices seen: ${site.prices.slice(0, 8).join(' ') || '-'}\nfull data: ${path.join(out, 'site.json')}`);
