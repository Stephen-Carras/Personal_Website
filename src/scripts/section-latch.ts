// Section latch. The entrances from About to Let's talk are scroll-driven
// (motion.css, --sec timeline), so on their own they run backwards when scrolling up.
// Once a section has fully faded in, this adds "lat" (motion.css holds it at rest),
// and only removes it once the whole section is below the bottom of the screen, so
// coming back down replays the fade. No timers, no fade-out.
//
// The "fully in" point is each section's --rise-end (svh), the same custom property
// the CSS animation-range reads. Section top at (100 - end) svh = cover end svh.
// Off under reduced motion and without scroll-driven animations (the CSS entrance
// is off there too, so everything is already visible).

const IDS = ['about', 'focus', 'experience', 'education', 'how', 'recommendations', 'beyond', 'contact'];

export function initSectionLatch() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!CSS.supports('animation-timeline: view()')) return;

  const sections = IDS.map((id) => document.getElementById(id)).filter((s): s is HTMLElement => !!s);
  if (!sections.length) return;

  // 1svh in px: a hidden fixed 100svh probe (class in motion.css), innerHeight as fallback.
  const probe = document.createElement('div');
  probe.className = 'svh-probe';
  probe.setAttribute('aria-hidden', 'true');
  document.body.appendChild(probe);
  let svh = 0; // px for 100svh
  let ends: number[] = [];
  const measure = () => {
    svh = probe.offsetHeight || window.innerHeight;
    ends = sections.map((s) => parseFloat(getComputedStyle(s).getPropertyValue('--rise-end')) || 107);
  };

  const update = () => {
    sections.forEach((s, n) => {
      const top = s.getBoundingClientRect().top;
      if (!s.classList.contains('lat')) {
        if (top <= ((100 - ends[n]!) * svh) / 100) s.classList.add('lat');
      } else if (top >= svh) {
        s.classList.remove('lat');
      }
    });
  };

  let queued = false;
  const schedule = () => {
    if (queued) return;
    queued = true;
    requestAnimationFrame(() => {
      queued = false;
      update();
    });
  };

  measure();
  update(); // loaded scrolled down, or with a #hash: latch everything already passed
  window.addEventListener('scroll', schedule, { passive: true, capture: true });
  window.addEventListener('resize', () => {
    measure();
    schedule();
  });
  // The browser scrolls to a #hash (and restores scroll) after scripts run.
  window.addEventListener('load', schedule);
}
