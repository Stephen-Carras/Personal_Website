// Runs before first paint (blocking, external, first in <head>) so the page never
// flashes the wrong theme. A saved choice wins; otherwise follow the system setting.
// The toggle and live system-change handling live in the main script.
// It also adds the "js" class, so CSS can collapse JS-driven folds (About "Read more",
// recommendation quotes) only when the script can open them again.
(function () {
  var t = null;
  try {
    t = localStorage.getItem('theme');
  } catch (e) {}
  if (t !== 'light' && t !== 'dark') {
    t = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  var r = document.documentElement;
  r.setAttribute('data-theme', t);
  r.classList.add('js');
})();
