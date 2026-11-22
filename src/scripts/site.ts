// The site's one external script (bundled by Astro). No inline handlers anywhere:
// everything is wired here with addEventListener. Later phases add the popup,
// carousels, search and the rest.
import { dateRange, duration } from '../lib/dates';

/* ------------------------------------------------------------------------
   Theme. public/theme.js already set data-theme before paint. Here: the
   toggle, remembering the visitor's choice, and following system changes
   until the visitor picks.
   ------------------------------------------------------------------------ */
type Theme = 'light' | 'dark';
const root = document.documentElement;
const mq = window.matchMedia('(prefers-color-scheme: dark)');

function saved(): Theme | null {
  try {
    const t = localStorage.getItem('theme');
    return t === 'light' || t === 'dark' ? t : null;
  } catch {
    return null;
  }
}

function apply(theme: Theme) {
  root.setAttribute('data-theme', theme);
  const label = theme === 'dark' ? 'Switch to light mode' : 'Switch to dark mode';
  document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((b) => {
    b.setAttribute('aria-label', label);
  });
  // Keep the browser UI color in step with the chosen theme, not just the system one.
  const color = theme === 'dark' ? '#000000' : '#FFFFFF';
  document.querySelectorAll<HTMLMetaElement>('meta[name="theme-color"]').forEach((m) => {
    m.content = color;
  });
}

apply((root.getAttribute('data-theme') as Theme) || (mq.matches ? 'dark' : 'light'));

document.querySelectorAll<HTMLButtonElement>('[data-theme-toggle]').forEach((b) => {
  b.addEventListener('click', () => {
    const next: Theme = root.getAttribute('data-theme') === 'dark' ? 'light' : 'dark';
    apply(next);
    try {
      localStorage.setItem('theme', next);
    } catch {
      /* storage blocked: the choice lasts for this page view only */
    }
  });
});

mq.addEventListener('change', (e) => {
  if (!saved()) apply(e.matches ? 'dark' : 'light');
});

/* ------------------------------------------------------------------------
   Durations. Built at build time; elements for open-ended roles carry
   data-start (and no data-end), so recompute them here to stay current.
   ------------------------------------------------------------------------ */
document.querySelectorAll<HTMLElement>('[data-dur-start]').forEach((el) => {
  const start = el.dataset.durStart!;
  const end = el.dataset.durEnd || null;
  const prefix = el.dataset.durPrefix ?? '';
  el.textContent = prefix + duration(start, end);
});
document.querySelectorAll<HTMLElement>('[data-range-start]').forEach((el) => {
  el.textContent = dateRange(el.dataset.rangeStart!, el.dataset.rangeEnd || null);
});
