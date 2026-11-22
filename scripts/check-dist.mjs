// Checks the built site in dist/ against the strict CSP and privacy rules in CLAUDE.md.
// Run after `npm run build`:  npm run check:dist
// Exits non-zero on any problem so CI can block the deploy.
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const DIST = path.resolve('dist');
const problems = [];
const fail = (file, msg) => problems.push(`${path.relative(DIST, file)}: ${msg}`);

function walk(dir) {
  return fs.readdirSync(dir, { withFileTypes: true }).flatMap((d) => {
    const p = path.join(dir, d.name);
    return d.isDirectory() ? walk(p) : [p];
  });
}

if (!fs.existsSync(DIST)) {
  console.error('dist/ not found. Run `npm run build` first.');
  process.exit(1);
}

const files = walk(DIST);
const html = files.filter((f) => f.endsWith('.html'));
const css = files.filter((f) => f.endsWith('.css'));
const js = files.filter((f) => f.endsWith('.js'));
const images = files.filter((f) => /\.(jpe?g|png|webp|avif|gif)$/i.test(f));

// --- HTML: nothing the CSP would block --------------------------------------------
for (const f of html) {
  const s = fs.readFileSync(f, 'utf8');

  for (const m of s.matchAll(/<script\b([^>]*)>([\s\S]*?)<\/script>/gi)) {
    const attrs = m[1];
    // Non-executable data blocks (JSON-LD, the search index) are not governed by script-src.
    const isData = /type\s*=\s*["']?application\/(?:ld\+)?json/i.test(attrs);
    const hasSrc = /\bsrc\s*=/i.test(attrs);
    if (!hasSrc && !isData) fail(f, `inline <script>: ${m[0].slice(0, 80)}`);
    if (hasSrc && m[2].trim()) fail(f, '<script src> with inline body');
    const src = attrs.match(/\bsrc\s*=\s*["']([^"']+)/i)?.[1];
    if (src && /^(https?:)?\/\//i.test(src)) fail(f, `third-party script: ${src}`);
  }
  if (/<style\b/i.test(s)) fail(f, 'inline <style> element');
  // Attributes are matched only inside tags; text content is ignored.
  for (const tag of s.matchAll(/<[a-z][^>]*>/gi)) {
    const t = tag[0];
    if (/\sstyle\s*=/i.test(t)) fail(f, `style= attribute: ${t.slice(0, 100)}`);
    const on = t.match(/\son[a-z]+\s*=/i);
    if (on) fail(f, `inline event handler (${on[0].trim()}): ${t.slice(0, 100)}`);
    if (/\b(?:src|href|srcset|poster)\s*=\s*["']?\s*data:/i.test(t)) fail(f, `data: URI: ${t.slice(0, 100)}`);
    if (/\bhref\s*=\s*["']?\s*javascript:/i.test(t)) fail(f, `javascript: URL: ${t.slice(0, 100)}`);
    const ext = t.match(/<(?:link|img|source|iframe|embed|object)\b[^>]*\b(?:src|href)\s*=\s*["']((?:https?:)?\/\/[^"']+)/i);
    if (ext && !/^https:\/\/YOUR-DOMAIN\//.test(ext[1]) && !/rel=["']?canonical/i.test(t)) {
      fail(f, `third-party resource: ${ext[1]}`);
    }
  }
  if (!s.includes('http-equiv="Content-Security-Policy"')) fail(f, 'missing CSP meta tag');
}

// --- CSS: no data: URIs or remote imports ------------------------------------------
for (const f of css) {
  const s = fs.readFileSync(f, 'utf8');
  if (/url\(\s*["']?data:/i.test(s)) fail(f, 'data: URI in CSS');
  if (/@import\s+(url\()?\s*["']?(https?:)?\/\//i.test(s)) fail(f, 'remote @import in CSS');
}

// --- Assets: every file in dist/_astro must be referenced (catches leaked originals) --
const referencing = [...html, ...css, ...js].map((f) => fs.readFileSync(f, 'utf8')).join('\n');
for (const f of files.filter((f) => f.includes(`${path.sep}_astro${path.sep}`))) {
  if (!referencing.includes(path.basename(f))) fail(f, 'unreferenced build asset (leaked original?)');
}

// --- Images: no EXIF / GPS / XMP / IPTC metadata ------------------------------------
for (const f of images) {
  try {
    const meta = await sharp(f).metadata();
    for (const k of ['exif', 'xmp', 'iptc']) if (meta[k]) fail(f, `image carries ${k.toUpperCase()} metadata`);
  } catch (e) {
    if (!f.endsWith('.ico')) fail(f, `could not read image: ${e.message}`);
  }
}

// --- Search index: well formed, no placeholders, every target exists on the page ----
const home = html.find((f) => path.relative(DIST, f) === 'index.html');
if (home) {
  const s = fs.readFileSync(home, 'utf8');
  const raw = s.match(/<script type="application\/json" id="search-index">([\s\S]*?)<\/script>/)?.[1];
  if (!raw) fail(home, 'search index data block missing');
  else {
    let idx = [];
    try {
      idx = JSON.parse(raw);
    } catch (e) {
      fail(home, `search index is not valid JSON: ${e.message}`);
    }
    const ids = new Set([...s.matchAll(/\sid="([^"]+)"/g)].map((m) => m[1]));
    const titles = new Set();
    for (const e of idx) {
      if (titles.has(e.t)) fail(home, `search: duplicate title "${e.t}"`);
      titles.add(e.t);
      for (const k of ['t', 's', 'h']) {
        if (/\{|\}|undefined|\[object/.test(e[k] ?? '')) fail(home, `search: placeholder in ${k} of "${e.t}"`);
      }
      for (const k of ['i', 'o']) if (e[k] && !ids.has(e[k])) fail(home, `search: "${e.t}" targets missing #${e[k]}`);
      if (e.a === 'rec' && !ids.has(`rec-${e.rc}`)) fail(home, `search: no card for recommender "${e.t}"`);
      if (!e.i && !e.a) fail(home, `search: "${e.t}" has no target`);
    }
  }
}

// --- No plain-text email address anywhere in the output -----------------------------
for (const f of [...html, ...js]) {
  if (/[a-z0-9._%+-]+@gmail\.com/i.test(fs.readFileSync(f, 'utf8'))) fail(f, 'plain-text email address');
}

if (problems.length) {
  console.error(`check-dist: ${problems.length} problem(s)\n  ` + problems.join('\n  '));
  process.exit(1);
}
console.log(
  `check-dist: OK (${html.length} HTML, ${css.length} CSS, ${js.length} JS, ${images.length} images checked)`,
);
