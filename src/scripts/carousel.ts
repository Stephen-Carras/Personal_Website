// Looping carousels (Recommendations, Trips & places, photo gallery).
// Items are rendered once in the HTML. Here we add a clone set before and after
// (aria-hidden, links and buttons tabindex="-1", ids removed), start on the middle
// set, and once scrolling settles (~140ms) jump by exactly one set width with
// scroll-snap off if the position has left the middle set. Prev/next scroll one item.
import { $$, scrollBehavior } from './util';

const SETTLE_MS = 140;

function makeClone(item: HTMLElement): HTMLElement {
  const c = item.cloneNode(true) as HTMLElement;
  c.setAttribute('aria-hidden', 'true');
  c.dataset.clone = '';
  c.removeAttribute('id');
  $$('[id]', c).forEach((el) => el.removeAttribute('id'));
  $$('[aria-controls]', c).forEach((el) => el.removeAttribute('aria-controls'));
  $$('a, button, [tabindex]', c).forEach((el) => el.setAttribute('tabindex', '-1'));
  return c;
}

function setupLoop(track: HTMLElement) {
  const originals = Array.from(track.children) as HTMLElement[];
  const n = originals.length;
  if (n < 2) return;
  const before = document.createDocumentFragment();
  const after = document.createDocumentFragment();
  originals.forEach((it) => {
    before.appendChild(makeClone(it));
    after.appendChild(makeClone(it));
  });
  track.prepend(before);
  track.append(after);

  const items = () => Array.from(track.children) as HTMLElement[];
  /** Width of one full set: distance from the first item to its first copy. */
  const setWidth = () => {
    const all = items();
    return all[n].offsetLeft - all[0].offsetLeft;
  };
  // Snap off for the jump (CSSOM style, allowed by the CSP), back on next frame.
  const jump = (x: number) => {
    track.style.scrollSnapType = 'none';
    track.scrollLeft = x;
    requestAnimationFrame(() => (track.style.scrollSnapType = ''));
  };

  jump(track.scrollLeft + setWidth());

  let timer = 0;
  track.addEventListener(
    'scroll',
    () => {
      window.clearTimeout(timer);
      timer = window.setTimeout(() => {
        const w = setWidth();
        if (!w) return;
        const x = track.scrollLeft;
        if (x < w * 0.5) jump(x + w);
        else if (x >= w * 1.5) jump(x - w);
      }, SETTLE_MS);
    },
    { passive: true },
  );
}

/** Distance between two neighbouring items (item width plus gap). */
function step(track: HTMLElement) {
  const all = Array.from(track.children) as HTMLElement[];
  return all.length > 1 ? all[1].offsetLeft - all[0].offsetLeft : track.clientWidth;
}

export function scrollTrack(track: HTMLElement, dir: 1 | -1) {
  track.scrollBy({ left: dir * step(track), behavior: scrollBehavior() });
}

/** Scroll a track so the (middle-set) item is at its start. */
export function scrollItemIntoTrack(item: HTMLElement) {
  const track = item.parentElement;
  if (!track) return;
  const first = track.firstElementChild as HTMLElement;
  track.scrollTo({ left: item.offsetLeft - first.offsetLeft, behavior: scrollBehavior() });
}

export function initCarousels() {
  $$('[data-loop]').forEach(setupLoop);
  $$('[data-track-prev], [data-track-next]').forEach((btn) => {
    btn.addEventListener('click', () => {
      const id = btn.dataset.trackPrev || btn.dataset.trackNext;
      const track = id ? document.getElementById(id) : null;
      if (track) scrollTrack(track, btn.dataset.trackPrev ? -1 : 1);
    });
  });
}
