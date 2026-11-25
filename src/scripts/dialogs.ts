// Generic modal pop-ups: a button with data-open-dialog="<id>" opens <dialog id="<id>">.
// Same pattern as the contact popup (contact.ts): showModal() gives Escape, inertness and
// the modal role; the close button has autofocus so focus lands there on open. Here:
// backdrop click, Tab trap, close button, and focus back to the opener on close.
// Page scroll lock is CSS (html:has(dialog[open]) in sections.css).
import { $$, trapFocus } from './util';

export function initDialogs() {
  $$<HTMLButtonElement>('[data-open-dialog]').forEach((btn) => {
    const dialog = document.getElementById(btn.dataset.openDialog!) as HTMLDialogElement | null;
    if (!dialog) return;
    btn.addEventListener('click', () => {
      if (!dialog.open) dialog.showModal();
    });
    dialog.addEventListener('click', (e) => {
      if (e.target === dialog) dialog.close();
    });
    trapFocus(dialog);
    $$('[data-close-dialog]', dialog).forEach((b) => b.addEventListener('click', () => dialog.close()));
    dialog.addEventListener('close', () => {
      if (document.contains(btn)) btn.focus({ preventScroll: true });
    });
  });
}
