// Beyond work's airplane photo (sections.css, #beyond.photo-on::before) is fetched only
// once the section is within about two screens of the viewport, so it never competes
// with the hero image for bandwidth on first load (it used to push the hero's LCP back
// by 130 to 380ms on a slow connection). Until then, and without JS, the section shows
// its dark base colour with the same gradients, so the white text still reads.

export function initBeyondPhoto() {
  const s = document.getElementById('beyond');
  if (!s) return;
  if (!('IntersectionObserver' in window)) {
    s.classList.add('photo-on');
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      if (entries.some((e) => e.isIntersecting)) {
        s.classList.add('photo-on');
        io.disconnect();
      }
    },
    { rootMargin: '200% 0px' },
  );
  io.observe(s);
}
