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

// --- Minimal HTML tokenizer ----------------------------------------------------------
// Matching tags with regexes over raw HTML misses real browser behaviour: end tags like
// `</script >` or `</SCRIPT foo>`, ">" inside quoted attribute values, comments, and
// entity-encoded attribute values. This follows the HTML parsing rules closely enough
// for these checks:
// - comments, doctypes and other markup declarations are skipped;
// - attribute values are parsed with their quoting and entity-decoded;
// - raw-text elements end where a browser ends them: at "</name" followed by
//   whitespace, "/" or ">", in any letter case.
// Each yielded tag: { name, attrs: Map(lowercase name -> decoded value), raw, body, pos }.
const RAW_TEXT = new Set(['script', 'style', 'textarea', 'title', 'xmp', 'iframe', 'noembed', 'noframes']);
const NAMED_ENTITIES = { amp: '&', lt: '<', gt: '>', quot: '"', apos: "'", colon: ':', tab: '\t', newline: '\n', nbsp: ' ', sol: '/', lpar: '(', rpar: ')' };
const decodeEntities = (v) =>
  v.replace(/&(?:#(\d+)|#x([0-9a-f]+)|([a-z]+));?/gi, (m, dec, hex, name) => {
    if (name) return NAMED_ENTITIES[name.toLowerCase()] ?? m;
    const cp = dec ? Number(dec) : parseInt(hex, 16);
    return cp > 0 && cp <= 0x10ffff ? String.fromCodePoint(cp) : '�';
  });

function* tags(src) {
  const TAG_NAME = /[a-zA-Z][^\s/>]*/y;
  const ATTR = /([^\s"'>/=][^\s"'>/=]*)(?:\s*=\s*(?:"([^"]*)"|'([^']*)'|([^\s>]+)))?/y;
  let i = 0;
  while (i < src.length) {
    const lt = src.indexOf('<', i);
    if (lt < 0) return;
    if (src.startsWith('<!--', lt)) {
      const end = src.indexOf('-->', lt + 4);
      i = end < 0 ? src.length : end + 3;
      continue;
    }
    const closing = src[lt + 1] === '/';
    TAG_NAME.lastIndex = lt + (closing ? 2 : 1);
    const nm = TAG_NAME.exec(src);
    if (!nm) {
      // "<!doctype>", "<?...>", "</>" or a stray "<" in text.
      i = /[!?/]/.test(src[lt + 1] ?? '') ? Math.max(src.indexOf('>', lt), lt) + 1 : lt + 1;
      continue;
    }
    const name = nm[0].toLowerCase();
    const attrs = new Map();
    let j = TAG_NAME.lastIndex;
    while (j < src.length && src[j] !== '>') {
      if (/[\s/]/.test(src[j])) {
        j++;
        continue;
      }
      ATTR.lastIndex = j;
      const a = ATTR.exec(src);
      if (!a) {
        j++;
        continue;
      }
      const key = a[1].toLowerCase();
      if (!attrs.has(key)) attrs.set(key, decodeEntities(a[2] ?? a[3] ?? a[4] ?? ''));
      j = ATTR.lastIndex;
    }
    const tagEnd = Math.min(j + 1, src.length);
    i = tagEnd;
    if (closing) continue;
    let body = '';
    if (RAW_TEXT.has(name)) {
      const endRe = new RegExp(`</${name}(?=[\\s/>])`, 'gi');
      endRe.lastIndex = tagEnd;
      const end = endRe.exec(src);
      const stop = end ? end.index : src.length;
      body = src.slice(tagEnd, stop);
      const gt = end ? src.indexOf('>', stop) : -1;
      i = gt < 0 ? src.length : gt + 1;
    }
    yield { name, attrs, raw: src.slice(lt, tagEnd), body, pos: lt };
  }
}

/** Browsers ignore ASCII whitespace and control characters inside URL schemes. */
const scheme = (v) => v.replace(/[\u0000- ]/g, '').toLowerCase();
const isExternal = (v) => /^(?:[a-z][a-z0-9+.-]*:)?\/\//.test(scheme(v)) || /^https?:/.test(scheme(v));
const srcsetUrls = (v) => v.split(',').map((c) => c.trim().split(/\s+/)[0]).filter(Boolean);
const URL_ATTRS = ['src', 'href', 'srcset', 'poster', 'data', 'action', 'formaction', 'xlink:href', 'background'];
const urlValues = (attrs) =>
  URL_ATTRS.filter((k) => attrs.has(k)).flatMap((k) => (k === 'srcset' ? srcsetUrls(attrs.get(k)) : [attrs.get(k)]));
// Elements whose URL attributes make the browser fetch something (links in <a> don't).
const LOADS = new Set(['script', 'link', 'img', 'source', 'iframe', 'embed', 'object', 'video', 'audio', 'track', 'input', 'image', 'frame']);
const DATA_SCRIPT_TYPES = new Set(['application/ld+json', 'application/json']);
const CSP =
  "default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; base-uri 'none'; form-action 'none'";

/** All problems this file's HTML checks find in one page. */
function htmlProblems(s) {
  const out = [];
  let cspPos = -1;
  let firstLoadPos = -1;
  for (const t of tags(s)) {
    const { name, attrs } = t;
    const short = t.raw.slice(0, 100);
    if (name === 'script') {
      const type = (attrs.get('type') ?? '').trim().toLowerCase();
      // Non-executable data blocks (JSON-LD, the search index) are not governed by script-src.
      const isData = DATA_SCRIPT_TYPES.has(type);
      const src = attrs.get('src');
      if (src === undefined && !isData) out.push(`inline <script>: ${(t.raw + t.body).slice(0, 80)}`);
      if (src !== undefined && t.body.trim()) out.push('<script src> with inline body');
      if (src !== undefined && isExternal(src)) out.push(`third-party script: ${src}`);
    }
    if (name === 'style') out.push('inline <style> element');
    if (attrs.has('style')) out.push(`style= attribute: ${short}`);
    for (const k of attrs.keys()) if (k.startsWith('on')) out.push(`inline event handler (${k}): ${short}`);
    for (const v of urlValues(attrs)) {
      const sc = scheme(v);
      if (sc.startsWith('data:')) out.push(`data: URI: ${short}`);
      if (sc.startsWith('javascript:') || sc.startsWith('vbscript:')) out.push(`script URL: ${short}`);
      const canonical = name === 'link' && /(^|\s)canonical(\s|$)/i.test(attrs.get('rel') ?? '');
      if (LOADS.has(name) && isExternal(v) && !canonical) out.push(`third-party resource: ${v}`);
    }
    if (name === 'meta' && (attrs.get('http-equiv') ?? '').toLowerCase() === 'content-security-policy') {
      if (cspPos < 0) cspPos = t.pos;
      if ((attrs.get('content') ?? '').trim() !== CSP) out.push(`CSP differs from CLAUDE.md: ${attrs.get('content')}`);
    }
    if (firstLoadPos < 0 && (name === 'script' || name === 'link' || name === 'style')) firstLoadPos = t.pos;
  }
  // A meta CSP only governs what comes after it.
  if (cspPos < 0) out.push('missing CSP meta tag');
  else if (firstLoadPos >= 0 && firstLoadPos < cspPos) out.push('CSP meta tag comes after a script or stylesheet');
  if (s.includes('YOUR-DOMAIN')) out.push('YOUR-DOMAIN placeholder left in the page (set `site` in astro.config.mjs)');
  return out;
}

// --- Self-test: the detectors must catch the tricky cases, or this check is worthless ---
{
  const page = (head, body = '') =>
    `<!doctype html><html><head><meta http-equiv="Content-Security-Policy" content="${CSP}">${head}</head><body>${body}</body></html>`;
  // The end-tag cases hide a violation *after* a data block whose end tag is unusual:
  // a parser that misses the end tag swallows the violation into the block's body.
  const expectFlag = [
    ['end tag with a space', page('<script type="application/json">{}</script ><script>alert(1)</script>')],
    ['end tag with junk, uppercase', page('<script type="application/ld+json">{}</SCRIPT foo="bar"><img src="/a.png" onerror="x()"></script>')],
    ['end tag with a slash', page('<script type="application/json">{}</script/><p style="x">a</p></script>')],
    ['end tag with a newline', page('<script type="application/json">{}</script\n><script>alert(1)</script>')],
    ['">" inside a quoted attribute', page('<script data-x="a>b">alert(1)</script>')],
    ['src only in a quoted value', page('<script data-note="src=/x.js">alert(1)</script>')],
    ['inline style element', page('<STYLE>p{}</STYLE >')],
    ['unquoted style attribute', page('', '<p STYLE=color:red>x</p>')],
    ['uppercase event handler', page('', '<img src="/a.png" ONERROR="x()">')],
    ['javascript: hidden by an entity and tab', page('', '<a href="java&#x09;script&colon;alert(1)">x</a>')],
    ['data: URI in srcset', page('', '<img src="/a.png" srcset="/a.png 1x, data:image/png;base64,AA 2x">')],
    ['protocol-relative third-party image', page('', "<img src='//evil.example/x.png'>")],
    ['third-party script', page('<script src="https://cdn.example/x.js"></script>')],
    ['script with src and a body', page('<script src="/x.js">alert(1)</script>')],
    ['missing CSP', '<html><head><script src="/x.js"></script></head></html>'],
    ['weakened CSP', page('').replace("script-src 'self'", "script-src 'self' 'unsafe-inline'")],
    ['CSP after a script', `<head><script src="/a.js"></script><meta http-equiv="content-security-policy" content="${CSP}"></head>`],
  ];
  const expectClean = [
    ['script in a comment', page('<!-- <script>alert(1)</script> -->')],
    ['JSON-LD data block', page('<script type="application/ld+json">{"a":"</scri"}</script>')],
    ['text that looks like a tag inside a data block', page('<script type="application/json">["<style>"]</script >')],
    ['canonical link to the site', page('<link rel="canonical" href="https://stephen-carras.github.io/">')],
    ['ordinary external link', page('', '<a href="https://www.linkedin.com/" rel="noopener noreferrer">x</a>')],
  ];
  const broken = [
    ...expectFlag.filter(([, h]) => htmlProblems(h).length === 0).map(([n]) => `not flagged: ${n}`),
    ...expectClean.filter(([, h]) => htmlProblems(h).length > 0).map(([n, h]) => `false alarm: ${n} (${htmlProblems(h)[0]})`),
  ];
  if (broken.length) {
    console.error(`check-dist: self-test failed, the HTML checks are broken\n  ${broken.join('\n  ')}`);
    process.exit(1);
  }
}

// --- HTML: nothing the CSP would block --------------------------------------------
for (const f of html) {
  for (const p of htmlProblems(fs.readFileSync(f, 'utf8'))) fail(f, p);
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
  const all = [...tags(s)];
  const raw = all.find(
    (t) => t.name === 'script' && t.attrs.get('id') === 'search-index' && t.attrs.get('type') === 'application/json',
  )?.body;
  if (!raw) fail(home, 'search index data block missing');
  else {
    let idx = [];
    try {
      idx = JSON.parse(raw);
    } catch (e) {
      fail(home, `search index is not valid JSON: ${e.message}`);
    }
    const ids = new Set(all.filter((t) => t.attrs.has('id')).map((t) => t.attrs.get('id')));
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

// --- security.txt (RFC 9116): present, with Contact and an Expires under a year away --
{
  const f = path.join(DIST, '.well-known', 'security.txt');
  if (!fs.existsSync(f)) fail(f, 'missing /.well-known/security.txt');
  else {
    const t = fs.readFileSync(f, 'utf8');
    if (!/^Contact: https:\/\//m.test(t)) fail(f, 'security.txt has no Contact');
    const exp = Date.parse(t.match(/^Expires: (.+)$/m)?.[1] ?? '');
    if (!(exp > Date.now() && exp < Date.now() + 365 * 864e5)) fail(f, 'security.txt Expires missing or not within a year');
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
