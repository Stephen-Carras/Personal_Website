// Expertise & Tools pill morph. When "Show all" opens, the featured chips glide to
// their twins in the full list (matched by text); on "Show fewer" they glide back.
// FLIP with fixed-position clones on the Web Animations API: measure the chips, toggle
// the <details>, measure again, then fly a clone of each chip between the two places
// while the real chip is hidden. Only position, width, font size and padding change.
// The native <details> stays in charge: Enter and Space on the summary fire the same
// click, and the open state and its announcement are the browser's own. Visitors who
// prefer reduced motion, or whose browser lacks scroll-driven animations (the motion
// CSS is gated on the same check), get the plain toggle.
import { $$, reducedMotion } from './util';

const DURATION = 760;
const STAGGER = 30;
const EASE = 'cubic-bezier(0.22, 0.7, 0.2, 1)'; // --ease

type Box = { left: number; top: number; width: number; fontSize: string; padding: string };

const name = (el: Element) => (el.textContent || '').trim();

function measure(els: HTMLElement[]) {
  const m = new Map<string, Box>();
  els.forEach((el) => {
    const r = el.getBoundingClientRect();
    const cs = getComputedStyle(el);
    m.set(name(el), { left: r.left, top: r.top, width: r.width, fontSize: cs.fontSize, padding: cs.padding });
  });
  return m;
}

function morph(details: HTMLDetailsElement, comp: HTMLElement, hl: HTMLElement): Promise<unknown> {
  const opening = !details.open;
  const featured = $$('.comp-chip', hl);
  const names = new Set(featured.map(name));
  const items = $$('.comp-item', details);
  const twins = items.filter((el) => names.has(name(el)));

  // .meas stops every animation and transition inside, so nothing is read mid-flight
  // and the list opens or closes at once; the rows' own entrance plays after it.
  comp.classList.add('meas');
  const first = measure(opening ? featured : twins);
  if (opening) {
    hl.style.display = 'none';
    details.open = true;
  } else {
    items.forEach((el) => el.classList.remove('mland'));
    details.open = false;
    hl.style.display = ''; // back to the stylesheet's display: flex
  }
  const targets = opening ? twins : featured;
  const last = measure(targets);
  // Landing twins skip their pop: the clone already brings them in.
  if (opening) twins.forEach((el) => el.classList.add('mland'));
  void comp.offsetWidth;
  comp.classList.remove('meas');

  const flights = targets.map((real, k) => {
    const a = first.get(name(real));
    const b = last.get(name(real));
    if (!a || !b) return Promise.resolve();
    const c = document.createElement('span');
    c.className = 'comp-chip mclone';
    c.textContent = name(real);
    c.setAttribute('aria-hidden', 'true');
    comp.appendChild(c);
    // Fixed position, measured against wherever left 0 / top 0 actually lands, in case
    // an ancestor is a containing block.
    const o = c.getBoundingClientRect();
    real.classList.add('mfly');
    const anim = c.animate(
      [
        { left: `${a.left - o.left}px`, top: `${a.top - o.top}px`, width: `${a.width}px`, fontSize: a.fontSize, padding: a.padding },
        { left: `${b.left - o.left}px`, top: `${b.top - o.top}px`, width: `${b.width}px`, fontSize: b.fontSize, padding: b.padding },
      ],
      { duration: DURATION, delay: k * STAGGER, easing: EASE, fill: 'both' },
    );
    return anim.finished
      .catch(() => undefined)
      .then(() => {
        real.classList.remove('mfly');
        c.remove();
      });
  });
  return Promise.all(flights);
}

export function initCompMorph() {
  const details = document.getElementById('comp-all') as HTMLDetailsElement | null;
  const summary = details?.querySelector('summary');
  const comp = details?.closest<HTMLElement>('.comp');
  const hl = comp?.querySelector<HTMLElement>('.hl');
  if (!details || !summary || !comp || !hl) return;
  let busy = false;
  summary.addEventListener('click', (e) => {
    if (busy) {
      e.preventDefault(); // a second click mid-flight does nothing
      return;
    }
    if (reducedMotion() || !CSS.supports('animation-timeline: view()')) return;
    e.preventDefault();
    busy = true;
    morph(details, comp, hl).finally(() => {
      busy = false;
    });
  });
}
