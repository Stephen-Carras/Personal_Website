// Runs before first paint (blocking, external, first in <head>) so the page never
// flashes the wrong theme. A saved choice wins; otherwise follow the system setting.
// The toggle and live system-change handling live in the main script.
(function () {
  var t = null;
  try {
    t = localStorage.getItem('theme');
  } catch (e) {}
  if (t !== 'light' && t !== 'dark') {
    t = window.matchMedia && window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }
  document.documentElement.setAttribute('data-theme', t);
})();
