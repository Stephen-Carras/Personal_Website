// Contact popup, "Email me" with fallback, and the copy-email button.
// The address is assembled here from data attributes, so it never appears as plain
// text in the HTML.
import { $$, trapFocus } from './util';

const dialog = document.getElementById('cmod') as HTMLDialogElement | null;
let opener: HTMLElement | null = null;

function address(): { email: string; mailto: string } | null {
  const src = document.querySelector<HTMLElement>('[data-eu][data-ed]');
  if (!src) return null;
  const email = [src.dataset.eu, src.dataset.ed].join('@');
  const subject = encodeURIComponent(src.dataset.es || '');
  return { email, mailto: 'mai' + 'lto:' + email + (subject ? '?subject=' + subject : '') };
}

export function openContact(from?: HTMLElement | null) {
  if (!dialog || dialog.open) return;
  opener = from ?? (document.activeElement as HTMLElement | null);
  dialog.showModal();
}

function closeContact() {
  dialog?.close();
}

function initDialog() {
  if (!dialog) return;
  const addr = address();
  if (addr) {
    // <wbr> after the "@" so a narrow screen wraps there, not inside "gmail.com".
    const [user, domain] = addr.email.split('@');
    $$('[data-email-text]', dialog).forEach((el) =>
      el.replaceChildren(user, document.createElement('wbr'), '@' + domain),
    );
  }
  // A click whose target is the <dialog> itself landed on the backdrop: the content
  // fills the dialog box, so any click inside lands on a child element.
  dialog.addEventListener('click', (e) => {
    if (e.target === dialog) closeContact();
  });
  trapFocus(dialog);
  $$('[data-close-dialog]', dialog).forEach((b) => b.addEventListener('click', closeContact));
  dialog.addEventListener('close', () => {
    const r = opener;
    opener = null;
    if (r && document.contains(r)) r.focus({ preventScroll: true });
  });
  $$('[data-open-contact]').forEach((b) => b.addEventListener('click', () => openContact(b)));
}

/* "Email me": try the visitor's mail app. If nothing takes focus within about two
   seconds (no blur, page still visible), open the popup so they can copy the address.
   Inside an iframe, open the mailto: with window.open. */
function initEmailMe() {
  const addr = address();
  if (!addr) return;
  $$<HTMLAnchorElement>('a[data-email-me]').forEach((a) => {
    a.href = addr.mailto;
    a.addEventListener('click', (e) => {
      e.preventDefault();
      let left = false;
      const onLeave = () => (left = true);
      window.addEventListener('blur', onLeave, { once: true });
      document.addEventListener('visibilitychange', onLeave, { once: true });
      try {
        if (window.top !== window) window.open(addr.mailto, '_blank');
        else window.location.href = addr.mailto;
      } catch {
        left = false;
      }
      window.setTimeout(() => {
        window.removeEventListener('blur', onLeave);
        document.removeEventListener('visibilitychange', onLeave);
        if (!left && !document.hidden) openContact(a);
      }, 2000);
    });
  });
}

function initCopy() {
  const addr = address();
  const status = document.querySelector<HTMLElement>('[data-copy-status]');
  $$<HTMLButtonElement>('[data-copy-email]').forEach((btn) => {
    let timer = 0;
    btn.addEventListener('click', async () => {
      if (!addr) return;
      window.clearTimeout(timer);
      try {
        await navigator.clipboard.writeText(addr.email);
        btn.textContent = btn.dataset.copied || 'Copied';
        if (status) status.textContent = 'Email address copied';
        timer = window.setTimeout(() => {
          btn.textContent = btn.dataset.copy || 'Copy';
          if (status) status.textContent = '';
        }, 1800);
      } catch {
        // Clipboard blocked: select the address so it can be copied by hand.
        const text = dialog?.querySelector('[data-email-text]');
        if (text) {
          const range = document.createRange();
          range.selectNodeContents(text);
          const sel = window.getSelection();
          sel?.removeAllRanges();
          sel?.addRange(range);
        }
        if (status) status.textContent = 'Could not copy. The address is selected so you can copy it.';
      }
    });
  });
}

export function initContact() {
  initDialog();
  initEmailMe();
  initCopy();
}
