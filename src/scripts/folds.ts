// Recommendation quote clamps.
import { $$, reducedMotion } from './util';

/* Recommendation quotes: height animates between the 5-line clamp (CSS) and the
   measured full height. Every copy of a card (the carousel clones) stays in sync. */
const CLAMP_SLACK = 4;

function animateHeight(q: HTMLElement, open: boolean) {
  if (reducedMotion()) {
    q.classList.toggle('open', open);
    q.style.height = '';
    return;
  }
  const from = q.offsetHeight;
  q.style.height = from + 'px';
  q.classList.toggle('open', open);
  void q.offsetHeight; // commit the starting height before changing it
  q.style.height = (open ? q.scrollHeight : clampHeight(q)) + 'px';
  const done = (e: TransitionEvent) => {
    if (e.propertyName !== 'height') return;
    q.style.height = '';
    q.removeEventListener('transitionend', done);
  };
  q.addEventListener('transitionend', done);
}

function clampHeight(q: HTMLElement) {
  const lh = parseFloat(getComputedStyle(q).lineHeight) || 28.8;
  return Math.round(lh * 5);
}

export function setRec(id: string, open: boolean) {
  $$(`[data-rec-id="${id}"]`).forEach((card) => {
    const q = card.querySelector<HTMLElement>('.rec-q');
    const btn = card.querySelector<HTMLButtonElement>('[data-rec-toggle]');
    if (!q || !btn) return;
    if (q.classList.contains('open') !== open) animateHeight(q, open);
    btn.setAttribute('aria-expanded', String(open));
    btn.textContent = open ? 'Show less' : 'Read more';
  });
}

/** Hide "Read more" on quotes short enough to show in full. */
function fitCheck() {
  $$('.rec').forEach((card) => {
    const q = card.querySelector<HTMLElement>('.rec-q');
    const btn = card.querySelector<HTMLElement>('[data-rec-toggle]');
    if (!q || !btn || q.classList.contains('open')) return;
    const fits = q.scrollHeight <= clampHeight(q) + CLAMP_SLACK;
    q.classList.toggle('fits', fits);
    btn.hidden = fits;
  });
}

function initRecs() {
  document.addEventListener('click', (e) => {
    const btn = (e.target as Element).closest<HTMLButtonElement>('[data-rec-toggle]');
    if (!btn) return;
    const card = btn.closest<HTMLElement>('[data-rec-id]');
    if (!card) return;
    setRec(card.dataset.recId!, btn.getAttribute('aria-expanded') !== 'true');
  });
  fitCheck();
  let t = 0;
  window.addEventListener('resize', () => {
    window.clearTimeout(t);
    t = window.setTimeout(fitCheck, 150);
  });
}

export function initFolds() {
  initRecs();
}
