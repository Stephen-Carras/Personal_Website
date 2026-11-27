// Section background photos (sections.css: #beyond.photo-on::before, the airplane
// window, and .wave.photo-on::before, the dark waves behind About, Experience and How I
// work) are fetched only once their section is within about two screens of the
// viewport, so they never compete with the hero image for bandwidth on first load
// (the Beyond photo used to push the hero's LCP back by 130 to 380ms on a slow
// connection). Until then, and without JS, each section shows its dark base colour
// with the same gradients, so the white text still reads.

export function initSectionPhotos() {
  const els = [...document.querySelectorAll<HTMLElement>('#beyond, .wave')];
  if (!els.length) return;
  if (!('IntersectionObserver' in window)) {
    els.forEach((s) => s.classList.add('photo-on'));
    return;
  }
  const io = new IntersectionObserver(
    (entries) => {
      for (const e of entries) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('photo-on');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '200% 0px' },
  );
  els.forEach((s) => io.observe(s));
}
