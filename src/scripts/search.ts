// Site search overlay. The index (built from the content files) is read from the
// JSON data block in the page. Combobox + listbox pattern: focus stays in the input
// and aria-activedescendant points at the highlighted option.
import { scrollItemIntoTrack } from './carousel';
import { openContact } from './contact';
import { setAbout, setRec } from './folds';
import { $$, scrollBehavior, trapFocus } from './util';

interface Entry {
  k: string;
  t: string;
  s: string;
  h: string;
  r: number;
  i?: string;
  o?: string;
  a?: 'contact' | 'linkedin' | 'rec';
  u?: string;
  rc?: string;
  q?: 1;
}

const MAX_RESULTS = 8;
const FLASH_MS = 2000;

const norm = (x: string) =>
  x.toLowerCase().normalize('NFD').replace(/[̀-ͯ]/g, '').replace(/\s+/g, ' ').trim();

/** Every token must appear in the haystack. Titles that start with a token score
    highest, then word starts, then anywhere in the title, then haystack-only.
    Ties go to the kind priority, then index order. */
export function search(index: Entry[], query: string): Entry[] {
  const toks = norm(query).split(' ').filter(Boolean);
  if (!toks.length) return index.filter((e) => e.q);
  const scored: { e: Entry; sc: number }[] = [];
  index.forEach((e, n) => {
    const title = norm(e.t);
    let sc = 0;
    for (const t of toks) {
      if (!e.h.includes(t)) return;
      if (title.startsWith(t)) sc += 8;
      else if (title.includes(' ' + t)) sc += 6;
      else if (title.includes(t)) sc += 4;
      else sc += 1;
    }
    scored.push({ e, sc: sc * 100 - e.r * 3 - n / 1000 });
  });
  return scored
    .sort((a, b) => b.sc - a.sc)
    .slice(0, MAX_RESULTS)
    .map((x) => x.e);
}

export function initSearch() {
  const dialog = document.getElementById('srch') as HTMLDialogElement | null;
  const data = document.getElementById('search-index');
  if (!dialog || !data) return;
  const index: Entry[] = JSON.parse(data.textContent || '[]');

  const input = dialog.querySelector<HTMLInputElement>('[data-search-input]')!;
  const list = dialog.querySelector<HTMLElement>('#srl')!;
  const heading = dialog.querySelector<HTMLElement>('[data-search-heading]')!;
  const none = dialog.querySelector<HTMLElement>('[data-search-none]')!;
  const sugs = dialog.querySelector<HTMLElement>('[data-search-sugs]')!;
  const status = dialog.querySelector<HTMLElement>('[data-search-status]')!;

  let results: Entry[] = [];
  let sel = -1; // nothing highlighted until hover or arrow keys
  let opener: HTMLElement | null = null;
  let restoreFocus = true;

  function highlight(n: number) {
    sel = n;
    const opts = $$('[role="option"]', list);
    opts.forEach((o, i) => o.setAttribute('aria-selected', String(i === n)));
    if (n >= 0 && opts[n]) {
      input.setAttribute('aria-activedescendant', opts[n].id);
      opts[n].scrollIntoView({ block: 'nearest' });
    } else {
      input.removeAttribute('aria-activedescendant');
    }
  }

  function render() {
    const q = input.value;
    const typed = norm(q).length > 0;
    results = search(index, q);
    list.replaceChildren(
      ...results.map((e, n) => {
        const b = document.createElement('button');
        b.type = 'button';
        b.className = 'sr';
        b.id = `sr-${n}`;
        b.tabIndex = -1;
        b.setAttribute('role', 'option');
        b.setAttribute('aria-selected', 'false');
        const txt = document.createElement('span');
        txt.className = 'sr-txt';
        const t = document.createElement('span');
        t.className = 'sr-t';
        t.textContent = e.t;
        txt.append(t);
        if (e.s) {
          const s = document.createElement('span');
          s.className = 'sr-s';
          s.textContent = e.s;
          txt.append(s);
        }
        const k = document.createElement('span');
        k.className = 'sr-k';
        k.textContent = e.k;
        b.append(txt, k);
        b.addEventListener('click', () => choose(e));
        // mousemove (not mouseenter) so a list redrawn under a resting pointer
        // doesn't highlight anything by itself.
        b.addEventListener('mousemove', () => sel !== n && highlight(n));
        return b;
      }),
    );
    const has = results.length > 0;
    heading.hidden = !has;
    heading.textContent = (typed ? heading.dataset.results : heading.dataset.jump) || '';
    list.hidden = !has;
    none.hidden = has || !typed;
    if (!has && typed) none.textContent = (none.dataset.text || '').replace('{q}', q.trim());
    sugs.hidden = typed && has;
    status.textContent = !typed ? '' : has ? `${results.length} ${results.length === 1 ? 'result' : 'results'}` : 'No results';
    highlight(-1);
  }

  function open() {
    if (dialog!.open) return;
    const other = document.querySelector<HTMLDialogElement>('dialog[open]');
    if (other) other.close();
    opener = (document.activeElement as HTMLElement | null) ?? null;
    if (opener === document.body) opener = null;
    restoreFocus = true;
    input.value = '';
    render();
    dialog!.showModal();
    input.focus();
  }

  function close() {
    dialog!.close();
  }

  dialog.addEventListener('close', () => {
    const r = opener;
    opener = null;
    if (restoreFocus && r && document.contains(r)) r.focus({ preventScroll: true });
  });

  /** Close, then go to the result. */
  function choose(e: Entry) {
    close();
    if (e.a === 'contact') {
      // The popup takes over focus and returns it to the search button.
      openContact(document.querySelector<HTMLElement>('[data-open-search]'));
      return;
    }
    if (e.a === 'linkedin' && e.u) {
      window.open(e.u, '_blank', 'noopener,noreferrer');
      return;
    }
    const smooth = scrollBehavior();
    if (e.a === 'rec' && e.rc) {
      document.getElementById('recommendations')?.scrollIntoView({ behavior: smooth, block: 'start' });
      window.setTimeout(() => {
        const card = document.getElementById(`rec-${e.rc}`);
        if (!card) return;
        setRec(e.rc!, true);
        scrollItemIntoTrack(card);
        flash(card);
      }, smooth === 'smooth' ? 450 : 0);
      return;
    }
    if (e.o === 'about-more') setAbout(true);
    else if (e.o) {
      const d = document.getElementById(e.o);
      if (d instanceof HTMLDetailsElement) d.open = true;
    }
    const el = e.i ? document.getElementById(e.i) : null;
    if (!el) return;
    requestAnimationFrame(() => {
      el.scrollIntoView({ behavior: smooth, block: 'start' });
      if (/^(r|cw)-/.test(el.id)) flash(el);
    });
  }

  function flash(el: HTMLElement) {
    el.classList.remove('flash');
    void el.offsetWidth; // restart the animation
    el.classList.add('flash');
    window.setTimeout(() => el.classList.remove('flash'), FLASH_MS + 100);
  }

  input.addEventListener('input', render);
  input.addEventListener('keydown', (ev) => {
    const n = results.length;
    if (ev.key === 'ArrowDown') {
      ev.preventDefault();
      if (n) highlight((sel + 1) % n);
    } else if (ev.key === 'ArrowUp') {
      ev.preventDefault();
      if (n) highlight(sel < 0 ? n - 1 : (sel - 1 + n) % n);
    } else if (ev.key === 'Enter') {
      ev.preventDefault();
      const pick = results[sel < 0 ? 0 : sel];
      if (pick) choose(pick);
    }
  });
  $$('[data-clear-sel]', dialog).forEach((el) => el.addEventListener('mouseenter', () => sel !== -1 && highlight(-1)));
  $$<HTMLButtonElement>('[data-sug]', dialog).forEach((b) =>
    b.addEventListener('click', () => {
      input.value = b.dataset.sug || '';
      render();
      input.focus();
    }),
  );
  dialog.addEventListener('click', (ev) => {
    if (ev.target === dialog) close();
  });
  $$('[data-close-dialog]', dialog).forEach((b) => b.addEventListener('click', close));
  trapFocus(dialog);

  $$('[data-open-search]').forEach((b) => b.addEventListener('click', open));
  document.addEventListener('keydown', (ev) => {
    if ((ev.key === 'k' || ev.key === 'K') && (ev.metaKey || ev.ctrlKey) && !ev.altKey && !ev.shiftKey) {
      ev.preventDefault();
      if (dialog.open) input.focus();
      else open();
      return;
    }
    if (ev.key !== '/' || ev.metaKey || ev.ctrlKey || ev.altKey || dialog.open) return;
    const t = ev.target as HTMLElement | null;
    const typing = !!t && (t.isContentEditable || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName));
    if (typing || document.querySelector('dialog[open]')) return;
    ev.preventDefault();
    open();
  });
}
