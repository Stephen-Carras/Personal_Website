// Builds the site search index at build time from the content files.
// Kinds and ranking follow CLAUDE.md "Search". Entries with the same title are merged
// into one row with combined kinds (e.g. "Music · Now"), so there are no duplicates.
import { getCollection, getEntry } from 'astro:content';
import { inFileOrder } from './order';

/** Kind priority used to break score ties (first = highest). */
export const KIND_ORDER = [
  'Company', 'Role', 'Skill', 'Competency', 'Education', 'Coursework', 'Result',
  'Recommendation', 'About', 'How I work', 'Place', 'Interest', 'Book', 'Music',
  'Ask me about', 'Now', 'Recognition', 'Contact', 'Jump to',
] as const;
type Kind = (typeof KIND_ORDER)[number];

/** One row in the index, kept short because it ships inside the page. */
export interface SearchEntry {
  k: string; // kind(s), "Music · Now"
  t: string; // title
  s: string; // subtitle
  h: string; // haystack: normalized (lowercase, accents stripped) searchable text
  r: number; // kind rank, lower is better (for merged rows, the best of its kinds)
  i?: string; // element id to scroll to
  o?: string; // element id to open first (<details>, About fold)
  a?: 'contact' | 'linkedin' | 'rec'; // special action
  u?: string; // URL for linkedin
  rc?: string; // recommendation id for 'rec'
  q?: 1; // quick jump, shown when the box is empty
}

interface Draft extends Omit<SearchEntry, 'k' | 'h' | 'r'> {
  k: Kind;
  extra?: string;
}

/** Same normalization the browser uses on the query. */
export const norm = (x: string) =>
  x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

export async function buildSearchIndex(): Promise<SearchEntry[]> {
  const cfg = (await getEntry('search', 'main'))!.data;
  const profile = (await getEntry('profile', 'stephen'))!.data;
  const comp = (await getEntry('competencies', 'core'))!.data;
  const how = (await getEntry('howIWork', 'main'))!.data;
  const beyond = (await getEntry('beyond', 'main'))!.data;
  const companies = await inFileOrder('roles');
  const schools = await inFileOrder('education');
  const results = await inFileOrder('results');
  const trips = await inFileOrder('trips');
  const recs = await inFileOrder('recommendations');

  const out: Draft[] = [];

  // Quick jumps
  for (const j of cfg.jumpTo) {
    if (j.action === 'linkedin') {
      out.push({ k: 'Jump to', t: j.title, s: j.sub ?? profile.linkedin.label, a: 'linkedin', u: profile.linkedin.url, q: 1 });
    } else {
      out.push({ k: 'Jump to', t: j.title, s: j.sub ?? '', i: j.target, a: j.action, q: 1 });
    }
  }

  // Companies, their recognition, and roles
  const skills = new Map<string, { companies: string[]; role: string }>();
  for (const { id, data: co } of companies) {
    out.push({ k: 'Company', t: co.name, s: 'Full-time', i: `co-${id}`, extra: co.roles.map((r) => r.title).join(' ') });
    const award = co.pills?.find((p) => p.kind === 'award');
    if (award && cfg.recognition.company === id) {
      out.push({ k: 'Recognition', t: award.label, s: cfg.recognition.sub, i: `co-${id}`, extra: cfg.recognition.keywords });
    }
    for (const r of co.roles) {
      out.push({
        k: 'Role', t: r.title, s: co.name, i: `r-${r.id}`, o: `rd-${r.id}`,
        extra: [r.lead, r.summary, ...(r.bullets ?? [])].filter(Boolean).join(' '),
      });
      for (const sk of r.skills ?? []) {
        const e = skills.get(sk) ?? { companies: [], role: r.id };
        if (!e.companies.includes(co.name)) e.companies.push(co.name);
        skills.set(sk, e);
      }
    }
  }
  if (!companies.some((c) => c.id === cfg.recognition.company)) {
    throw new Error(`search.yaml recognition.company "${cfg.recognition.company}" is not in roles.yaml`);
  }
  for (const [name, e] of skills) {
    out.push({ k: 'Skill', t: name, s: e.companies.join(' · '), i: `r-${e.role}`, o: `rd-${e.role}` });
  }

  // Competencies (all of them live in the "Show all" panel)
  for (const g of comp.groups) {
    for (const item of g.items) out.push({ k: 'Competency', t: item, s: g.name, i: 'focus', o: 'comp-all' });
  }

  // Coursework, then schools and degrees
  for (const { data: school } of schools) {
    for (const d of school.degrees) {
      const label = cfg.education.degrees[d.id]?.coursework;
      if (d.coursework?.length && !label) throw new Error(`search.yaml: add education.degrees.${d.id}.coursework`);
      for (const c of d.coursework ?? []) out.push({ k: 'Coursework', t: c, s: label!, i: `cw-${d.id}`, o: `cw-${d.id}` });
    }
  }
  for (const { data: school } of schools) {
    out.push({ k: 'Education', t: school.school, s: cfg.education.school.sub, i: 'education', extra: cfg.education.school.keywords });
    for (const d of school.degrees) {
      out.push({
        k: 'Education', t: d.title, s: cfg.education.degrees[d.id]?.sub ?? d.detail ?? '', i: 'education',
        extra: [d.detail, d.note].filter(Boolean).join(' '),
      });
    }
  }
  for (const id of Object.keys(cfg.education.degrees)) {
    if (!schools.some((s) => s.data.degrees.some((d) => d.id === id))) throw new Error(`search.yaml: unknown degree "${id}"`);
  }

  for (const { data: r } of results) out.push({ k: 'Result', t: `${r.value} · ${r.label}`, s: r.source, i: 'results' });
  for (const it of how.items) out.push({ k: 'How I work', t: it.title, s: '', i: 'how', extra: it.text });
  for (const { data: t } of trips) out.push({ k: 'Place', t: t.place, s: t.country, i: 'beyond' });
  for (const h of beyond.hobbies.items) out.push({ k: 'Interest', t: h, s: beyond.hobbies.heading, i: 'beyond' });
  for (const b of beyond.books.items) out.push({ k: 'Book', t: b.title, s: b.author, i: 'beyond' });
  for (const m of beyond.music.items) out.push({ k: 'Music', t: m, s: '', i: 'beyond' });
  for (const a of beyond.askMeAbout.items) out.push({ k: 'Ask me about', t: a, s: '', i: 'beyond' });
  for (const n of beyond.now.items) out.push({ k: 'Now', t: n.text, s: n.label, i: 'beyond' });

  for (const { id, data: r } of recs) {
    out.push({ k: 'Recommendation', t: r.name, s: r.title, i: `rec-${id}`, a: 'rec', rc: id, extra: `${r.quote} ${r.relation}` });
  }

  const ab = profile.about;
  out.push({ k: 'About', t: cfg.about.title, s: cfg.about.sub, i: 'about', o: 'about-more', extra: [ab.lead, ab.body, ...ab.more].join(' ') });

  const c = profile.contact.rows;
  const where = c.where.places.map((p) => `${p.state} ${p.cities.join(' ')}`).join(' ');
  out.push({ k: 'Contact', t: c.openTo.label, s: c.openTo.value, i: 'contact', extra: `${where} ${c.where.also} ${cfg.contact.keywords}` });

  return merge(out);
}

/** Merge rows that share a title, then compute haystacks and validate them.
    (scripts/check-dist.mjs checks that every target id exists in the built page.) */
function merge(drafts: Draft[]): SearchEntry[] {
  const byTitle = new Map<string, { e: SearchEntry; kinds: Kind[]; subs: string[]; hay: string[] }>();
  for (const d of drafts) {
    const { extra, k, ...rest } = d;
    const hay = [d.t, d.s, extra ?? ''].join(' ');
    const cur = byTitle.get(d.t);
    if (!cur) {
      byTitle.set(d.t, { e: { ...rest, k, h: '', r: 0 }, kinds: [k], subs: d.s ? [d.s] : [], hay: [hay] });
      continue;
    }
    if (!cur.kinds.includes(k)) cur.kinds.push(k);
    for (const part of d.s ? d.s.split(' · ') : []) {
      if (!cur.subs.join(' · ').split(' · ').includes(part)) cur.subs.push(part);
    }
    cur.hay.push(hay);
    if (d.q) cur.e.q = 1;
  }

  return [...byTitle.values()].map(({ e, kinds, subs, hay }) => {
    e.k = kinds.join(' · ');
    e.s = subs.join(' · ');
    e.h = norm(hay.join(' '));
    e.r = Math.min(...kinds.map((k) => KIND_ORDER.indexOf(k)));
    for (const key of ['t', 's', 'h'] as const) {
      if (/\{[^}]*\}|\{\{|undefined|\[object/.test(e[key])) throw new Error(`Search entry "${e.t}" has a placeholder in ${key}: ${e[key]}`);
    }
    return e;
  });
}
