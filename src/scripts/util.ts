// Small shared helpers.

export const reducedMotion = () => window.matchMedia('(prefers-reduced-motion: reduce)').matches;

/** 'smooth' unless the visitor prefers reduced motion. */
export const scrollBehavior = (): ScrollBehavior => (reducedMotion() ? 'auto' : 'smooth');

export const $$ = <T extends Element = HTMLElement>(sel: string, root: ParentNode = document) =>
  Array.from(root.querySelectorAll<T>(sel));

const FOCUSABLE =
  'a[href], button:not([disabled]), input:not([disabled]), select, textarea, [tabindex]:not([tabindex="-1"])';

/** Keep Tab / Shift+Tab cycling inside `box` (a modal), instead of escaping to the
    browser UI after the last control. */
export function trapFocus(box: HTMLElement) {
  box.addEventListener('keydown', (e) => {
    if (e.key !== 'Tab') return;
    // Only real Tab stops: visible, and not taken out of the order with tabindex="-1"
    // (search results are buttons with tabindex -1; arrow keys reach them instead).
    const f = $$(FOCUSABLE, box).filter(
      (el) => el.tabIndex >= 0 && (el.offsetParent !== null || el === document.activeElement),
    );
    if (!f.length) return;
    const first = f[0];
    const last = f[f.length - 1];
    const cur = document.activeElement as HTMLElement | null;
    if (e.shiftKey && (cur === first || !box.contains(cur))) {
      e.preventDefault();
      last.focus();
    } else if (!e.shiftKey && (cur === last || !box.contains(cur))) {
      e.preventDefault();
      first.focus();
    }
  });
}
