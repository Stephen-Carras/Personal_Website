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
//
// Beyond work's .bbody elements fade on their own view() timelines (entry 0% to 45%),
// not the section's. Each gets its own "lat" once it is 45% entered (its fade has
// ended) and loses it with the section's, once the whole section is below the screen.

const IDS = ['about', 'focus', 'experience', 'education', 'how', 'recommendations', 'beyond', 'contact'];
const SELF = '.bbody .rise-a, .bbody .rise-b, .bbody .rise-c';
const SELF_END = 0.45; // matches animation-range: entry 0% entry 45%

export function initSectionLatch() {
  if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return;
  if (!CSS.supports('animation-timeline: view()')) return;

  const sections = IDS.map((id) => document.getElementById(id)).filter((s): s is HTMLElement => !!s);
  if (!sections.length) return;
  const own = sections.map((s) => [...s.querySelectorAll<HTMLElement>(SELF)]);

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
    const vh = document.documentElement.clientHeight; // the scrollport view() measures against
    sections.forEach((s, n) => {
      const top = s.getBoundingClientRect().top;
      if (!s.classList.contains('lat')) {
        if (top <= ((100 - ends[n]!) * svh) / 100) s.classList.add('lat');
      } else if (top >= svh) {
        s.classList.remove('lat');
      }
      if (top >= svh) {
        own[n]!.forEach((el) => el.classList.remove('lat'));
      } else {
        own[n]!.forEach((el) => {
          if (el.classList.contains('lat')) return;
          const r = el.getBoundingClientRect();
          // entry 45%: the top edge 45% of the entry distance (its height, or the screen
          // if it is taller) above the bottom of the screen.
          if (r.top <= vh - SELF_END * Math.min(r.height, vh)) el.classList.add('lat');
        });
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
