// Shared helpers. No npm packages: only Node (18+) and a Chromium-based browser already on the computer.
import { execFileSync, spawnSync } from 'node:child_process';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import zlib from 'node:zlib';
import { pathToFileURL } from 'node:url';

const HOME = os.homedir();
export const UA = 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/140.0.0.0 Safari/537.36';
const exists = (p) => { try { return !!p && fs.statSync(p).isFile(); } catch { return false; } };

function which(names) {
  const cmd = process.platform === 'win32' ? 'where' : 'which';
  for (const n of names) {
    const r = spawnSync(cmd, [n], { encoding: 'utf8' });
    if (r.status === 0) {
      const p = r.stdout.split(/\r?\n/).map((s) => s.trim()).find(Boolean);
      if (exists(p)) return p;
    }
  }
  return null;
}

// Browsers downloaded by Playwright, Puppeteer or `npx @puppeteer/browsers` (the fallback in the README).
function downloaded() {
  const roots = [
    path.join(HOME, '.cache', 'designer'),
    path.join(HOME, '.cache', 'puppeteer'),
    path.join(HOME, '.cache', 'ms-playwright'),
    path.join(HOME, 'Library', 'Caches', 'ms-playwright'),
    process.env.LOCALAPPDATA && path.join(process.env.LOCALAPPDATA, 'ms-playwright'),
  ].filter(Boolean);
  const names = new Set(['chrome', 'chrome.exe', 'chrome-headless-shell', 'chrome-headless-shell.exe', 'headless_shell', 'headless_shell.exe', 'Google Chrome for Testing']);
  const found = [];
  const walk = (dir, depth) => {
    if (depth > 5) return;
    let items = [];
    try { items = fs.readdirSync(dir, { withFileTypes: true }); } catch { return; }
    for (const it of items) {
      const p = path.join(dir, it.name);
      if (it.isDirectory()) walk(p, depth + 1);
      else if (names.has(it.name)) found.push(p);
    }
  };
  roots.forEach((r) => walk(r, 0));
  return found.sort().reverse()[0] || null; // newest version folder sorts last
}

export function findBrowser() {
  const env = process.env.DESIGNER_BROWSER || process.env.CHROME_PATH;
  if (env) return exists(env) ? env : null;
  const pf = process.env.ProgramFiles || 'C:\\Program Files';
  const pf86 = process.env['ProgramFiles(x86)'] || 'C:\\Program Files (x86)';
  const lad = process.env.LOCALAPPDATA || path.join(HOME, 'AppData', 'Local');
  const list = {
    win32: [
      path.join(pf, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(pf86, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(lad, 'Google', 'Chrome', 'Application', 'chrome.exe'),
      path.join(pf86, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(pf, 'Microsoft', 'Edge', 'Application', 'msedge.exe'),
      path.join(pf, 'BraveSoftware', 'Brave-Browser', 'Application', 'brave.exe'),
      path.join(lad, 'Chromium', 'Application', 'chrome.exe'),
    ],
    darwin: [
      '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
      '/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge',
      '/Applications/Chromium.app/Contents/MacOS/Chromium',
      '/Applications/Brave Browser.app/Contents/MacOS/Brave Browser',
      path.join(HOME, 'Applications', 'Google Chrome.app', 'Contents', 'MacOS', 'Google Chrome'),
    ],
  }[process.platform] || [];
  return list.find(exists)
    || which(['google-chrome', 'google-chrome-stable', 'chromium', 'chromium-browser', 'microsoft-edge', 'microsoft-edge-stable', 'brave-browser', 'chrome'])
    || downloaded();
}

export const NO_BROWSER = `No Chrome, Edge, Chromium or Brave found.
Fix (pick one):
  1. Install Google Chrome, or
  2. Download a small headless Chrome just for this skill (about 100 MB, no admin needed):
       npx @puppeteer/browsers install chrome-headless-shell@stable --path "${path.join(HOME, '.cache', 'designer')}"
  3. Or point to any Chromium browser: set DESIGNER_BROWSER=/full/path/to/browser`;

// Render one HTML file to a PNG of exactly width x height CSS pixels (times scale).
export function render(html, out, width, height, scale = 1, waitMs = 12000) {
  const browser = findBrowser();
  if (!browser) throw new Error(NO_BROWSER);
  const outAbs = path.resolve(out);
  fs.mkdirSync(path.dirname(outAbs), { recursive: true });
  try { fs.unlinkSync(outAbs); } catch {}
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'designer-'));
  const args = [
    '--headless=new', '--hide-scrollbars', '--mute-audio', '--no-first-run', '--no-default-browser-check',
    '--disable-extensions', '--disable-background-networking', '--disable-sync', '--enable-unsafe-swiftshader',
    '--allow-file-access-from-files', '--run-all-compositor-stages-before-draw', '--force-color-profile=srgb',
    `--user-data-dir=${profile}`, `--window-size=${Math.round(width)},${Math.round(height)}`,
    `--force-device-scale-factor=${scale}`, `--virtual-time-budget=${waitMs}`, `--screenshot=${outAbs}`,
  ];
  // Containers often run as root, where Chrome's sandbox refuses to start.
  if (process.platform === 'linux' && (process.getuid?.() === 0 || process.env.DESIGNER_NO_SANDBOX)) args.push('--no-sandbox');
  if (/^https?:\/\//.test(html)) args.push(`--user-agent=${UA}`, html); else args.push(pathToFileURL(path.resolve(html)).href);
  let err = '';
  try {
    execFileSync(browser, args, { stdio: ['ignore', 'ignore', 'pipe'], timeout: waitMs + 60000 });
  } catch (e) { err = String(e.stderr || e.message || e); }
  try { fs.rmSync(profile, { recursive: true, force: true }); } catch {}
  if (!exists(outAbs)) throw new Error(`The browser made no image.\nBrowser: ${browser}\n${err.slice(-1500)}`);
  return { file: outAbs, browser, ...pngInfo(outAbs) };
}

// ---- tiny PNG reader (size + pixels), enough to verify renders without packages ----
export function pngInfo(file) {
  const b = fs.readFileSync(file);
  return { width: b.readUInt32BE(16), height: b.readUInt32BE(20) };
}

export function pngPixels(file) {
  const b = fs.readFileSync(file);
  const width = b.readUInt32BE(16), height = b.readUInt32BE(20), depth = b[24], type = b[25];
  if (depth !== 8 || ![2, 6].includes(type)) throw new Error(`PNG type ${type}/${depth} not supported`);
  const bpp = type === 6 ? 4 : 3;
  const chunks = [];
  for (let i = 8; i < b.length;) {
    const len = b.readUInt32BE(i), t = b.toString('ascii', i + 4, i + 8);
    if (t === 'IDAT') chunks.push(b.subarray(i + 8, i + 8 + len));
    i += 12 + len;
  }
  const raw = zlib.inflateSync(Buffer.concat(chunks));
  const stride = width * bpp, px = Buffer.alloc(stride * height);
  for (let y = 0; y < height; y++) {
    const f = raw[y * (stride + 1)], src = y * (stride + 1) + 1, dst = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? px[dst + x - bpp] : 0, up = y ? px[dst - stride + x] : 0, ul = y && x >= bpp ? px[dst - stride + x - bpp] : 0;
      let v = raw[src + x];
      if (f === 1) v += a; else if (f === 2) v += up; else if (f === 3) v += (a + up) >> 1;
      else if (f === 4) { const p = a + up - ul, pa = Math.abs(p - a), pb = Math.abs(p - up), pc = Math.abs(p - ul); v += pa <= pb && pa <= pc ? a : pb <= pc ? up : ul; }
      px[dst + x] = v & 255;
    }
  }
  return { width, height, at: (x, y) => { const i = (y * width + x) * bpp; return [px[i], px[i + 1], px[i + 2]]; } };
}

// The page's HTML after its JavaScript ran (for reading a live website).
export function dumpDom(url, waitMs = 10000) {
  const browser = findBrowser();
  if (!browser) throw new Error(NO_BROWSER);
  const profile = fs.mkdtempSync(path.join(os.tmpdir(), 'designer-'));
  const args = ['--headless=new', '--no-first-run', '--no-default-browser-check', '--disable-extensions', '--mute-audio',
    `--user-data-dir=${profile}`, `--virtual-time-budget=${waitMs}`, '--window-size=1440,2000', `--user-agent=${UA}`, '--dump-dom', url];
  if (process.platform === 'linux' && (process.getuid?.() === 0 || process.env.DESIGNER_NO_SANDBOX)) args.splice(1, 0, '--no-sandbox');
  try {
    return execFileSync(browser, args, { encoding: 'utf8', maxBuffer: 64 << 20, stdio: ['ignore', 'pipe', 'ignore'], timeout: waitMs + 60000 });
  } finally { try { fs.rmSync(profile, { recursive: true, force: true }); } catch {} }
}

export function openFile(file) {
  const f = path.resolve(file);
  const [cmd, args] = process.platform === 'win32' ? ['cmd', ['/c', 'start', '""', f]] : process.platform === 'darwin' ? ['open', [f]] : ['xdg-open', [f]];
  try { spawnSync(cmd, args, { stdio: 'ignore', detached: true, windowsVerbatimArguments: process.platform === 'win32' }); } catch {}
}
