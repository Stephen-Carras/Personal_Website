# Motion spec (companion to CLAUDE.md)

Last updated: 2026-11-26.

Everything is CSS-only except the carousel loops, the search jump and the Expertise & Tools pill morph, which need a little JavaScript (bundled from `src/scripts/`, never inline). All animation is wrapped in `@media (prefers-reduced-motion: no-preference)`. Scroll-driven parts go inside `@supports (animation-timeline: view())`; browsers without support, and visitors who reduce motion, just see static content. Reference implementation: the `<style>` block in `design/Main.dc.html`.

## Load (hero, time-based)
`.ld` class: fade up 28px over 1.3s, `cubic-bezier(.22,.7,.2,1)`, staggered by `--d` (0 to 6, 180ms each, 300ms base). Order: headshot, name, headline, sub-line, buttons, location line, Seattle banner. The hero photo fades in over 2.2s (`hfade`, opacity only). Never put `.ld` on an element that also has a scroll-driven animation.

## Hero scroll (screen only, `--hero` view timeline)
The hero is a 320vh run (`.hrun`) with a sticky stage (`.hstage`) under the nav. The copy and location line fade up and out (`hout`, cover 100vh to 130vh), the photo zooms to 1.12 (`hzoom`, cover 100vh to 230vh), a page-background layer fades over the stage (`hfadein`, cover 115vh to 200vh), then the statement and its sub-line fade in where they rest, opacity only with no movement (`hfadein`; cover 220vh to 270vh and 232vh to 282vh). On phones and touch tablets the same values are in svh. Reduced motion and unsupported browsers get the static photo hero, then the statement band.

## Scroll-driven (view timelines, `linear` easing, `fill-mode: both`)
- **Results heading** (`rv-u`): opacity 0 and translateY 56px to rest, range `entry 0` to `entry 340px`.
- **Results tiles** (`rs-l`, `rs-r`, `rs-n`): each tile declares its own timeline (`view-timeline: --tile block`). `rs-l` and `rs-r` (keyframes `rvl` / `rvr`: translateX -/+220px, translateY 90px, scale .84 to rest) run `cover 0svh` to `cover 33svh`, so each tile is assembled by the time its top reaches the 2/3 line. The left and right tiles of a row share a position, so they move together. The number (`rs-n`, keyframes `rvn`: translateY 70px, scale .9) runs `cover 6svh` to `cover 33svh`. `#results` is at least 100svh tall with its content centered (`sections.css`).
- **Section entrances** (About, Expertise & Tools, Experience, Education, How I work, What people say, Beyond work, Let's talk):
  - Each section declares `view-timeline: --sec block`. One animation (`sfade`: opacity 0 and translateY 24px to rest) on that timeline drives the whole section.
  - The title gets `.rise-a`; the text, images and buttons get `.rise-b` on their wrappers. Both run the same range, so everything fades up together, never one element at a time. This includes the Expertise "Show all" wrapper (`.comp-more`) and the Contact buttons (`.contact-btns`), which stay hidden until the text appears. `.rise-c` is reserved and uses the same range.
  - Blank lead-in band: `padding-top: var(--band)`, page background, nothing visible in it. About uses 40svh. The rest use 20svh.
  - Ranges are measured from the section's top entering the bottom of the screen, so a section that grows (Show all, an opened role) does not move them.
  - **About** fades over `cover 100svh` to `cover 115svh`. It starts as the section top reaches the top of the screen (Results fully gone) and ends with the title about 25% from the top.
  - **The rest** fade over `cover 92svh` to `cover 107svh`. They start with the title about 28% from the top and end near the top.
  - **Expertise & Tools** starts at the same point but takes half the scroll: `cover 92svh` to `cover 99.5svh`.
  - `padding-bottom: var(--runway)` (12svh) after each section.
  - Expertise & Tools is at least 130svh tall (border-box), so Experience never peeks in below it while it is collapsed. Contact is at least 100svh, so the page can scroll far enough for its fade to finish, even on very tall screens.
  - Anchors and nav links: `scroll-margin-top: calc(var(--nav-h) + 24px - var(--band))`, so a jump lands with the title 72px from the top, fully faded in, instead of in the blank band.
  - The bands, runways and minimum heights exist only inside the motion wrappers. Reduced motion and unsupported browsers keep the normal 96px section padding.
- **Scroll progress bar**: a 2px accent line at the bottom of the nav (`.prog`), `scaleX` 0 to 1 using `animation-timeline: scroll(root)`.
- Keyframe names are global: check that a name is unused before adding one (`hfade` is the hero photo's fade, so the section fade is `sfade`).

## Expand and collapse (click-driven, native `<details>`)
- `details { interpolate-size: allow-keywords }` and `details::details-content` transitions height from 0 to auto (`.55s cubic-bezier(.22,.7,.2,1)`) plus opacity (`.45s`), with `content-visibility` as a discrete transition. This animates the role "About this role +" and Education coursework panels, and the Expertise & Tools "Show all" panel when the pill morph is off.
- Fallback when `::details-content` is unsupported (`@supports not selector(...)`): children fade and slide down 12px (`dopen`, `.5s`).
- **Expertise & Tools "Show all"** (inside the scroll-driven `@supports` block):
  - A soft accent glow behind the list (`xglow`, 1.4s, fades in and out).
  - Rows and block headings slide up 16px and fade in (`xrow`, .6s), staggered by `--rd` (70ms per row, from the running row index `d0` to `d5`).
  - The chips pop in (`xpop`, scale .86 to rest, .45s) after their row, with delay `--rd + --cd + 140ms`. `--cd` is 25ms per chip, set with `:nth-child`.
- **Pill morph** (`src/scripts/comp-morph.ts`). When "Show all" is toggled, the 12 featured chips glide to their twins in the full list, matched by text. On "Show fewer" they glide back.
  - A click handler on the `<summary>` of `#comp-all` runs the toggle itself. A busy flag ignores clicks until every flight lands.
  - Enter and Space on the summary fire the same click. The native `<details>` keeps its semantics and open state.
  - Steps: add `.meas` to `.comp`, which sets `animation: none` and `transition: none` on everything inside, so nothing is read mid-flight and the list opens or closes at once (the row and chip entrances play after it). Measure the chips, toggle, then measure again. On open the featured row (`.hl`) is hidden; on close its inline display is cleared, so the stylesheet's `display: flex` (and the `:has(details[open])` hide used by search) applies.
  - Flight: one fixed-position clone per chip (`.mclone`), appended to `.comp`. Each animates left, top, width, font size and padding between the two measured states (featured 18px / 11px 20px, full list 16px / 8px 16px) with the Web Animations API: 760ms, 30ms stagger, `--ease`. The real chip is hidden (`.mfly`) until its clone lands, and landing twins skip their pop (`.mland`).
  - Skipped under reduced motion and where `animation-timeline` is unsupported: those visitors get the plain toggle.
- Coursework chips pop in (`cwp`, scale .9 and 10px rise, `.5s`), staggered by `--k * 26ms`.
- Recommendation quotes animate their height between the 5-line clamp and the measured full height (a pixel value measured on click), not a keyframe.
- Search jump: after the overlay closes, the target scrolls into view and flashes a soft accent background (`flash`, 2s ease-out).

## Hint and nudge
`.hint-a` (the arrow beside "Swipe or scroll to read more"): translateX 0 to 5px and back, 1.8s ease-in-out, infinite. Only under `no-preference`.

## Carousels (JavaScript, small)
Recommendations, Trips & places and the photo gallery loop endlessly. JS adds two clone sets, starts at the middle set, and jumps by one set width after scrolling settles (about 140ms) with scroll-snap temporarily off, so the visitor never sees the jump. Previous/next buttons use `scrollBy`, smooth unless reduced motion. Clones are `aria-hidden` and not focusable. No autoplay.

## Reduced motion and print
- `prefers-reduced-motion: reduce`: all `ld`, `rv-u`, `rs-*` and `rise-*` classes render in their final state, the blank bands are gone, Show all toggles without the morph (`opacity: 1`, no transform), details open and close instantly, `scroll-behavior: auto` everywhere (including scripted `scrollTo`, `scrollBy`, `scrollIntoView`), no nudge arrow.
- Print: animations off, everything visible, all `<details>` expanded, figures not split across pages.

## Rules that matter
- **Never put a view-timeline animation on an element inside a horizontal scroller** (recommendation cards, trips, gallery track). The timeline attaches to the nearest scroller (the horizontal track), not the page. Animate the wrapper outside the scroller instead (`.rise-b` on the Recommendations and Trips wrappers).
- Put `overflow-x: clip` on any section containing side-sliding cards so they enter from the screen edge and never cause a horizontal scrollbar (the Results section has it).
- Sticky columns (Experience, Education) are inside `.rise-b` rows. That is fine because the animation ends with `transform: none`. Sticky and scroll ancestors use `overflow: clip`, never `hidden` or `auto`.
- Use svh, not vh, for new heights and ranges, so phone toolbars don't throw them off. Every browser with view timelines supports svh.
- Write animations as longhands (`animation-name`, `animation-timeline`, ...). The build's CSS minifier folds an `animation` shorthand plus `animation-timeline` into an invalid shorthand. After any motion change, check the built CSS in `dist/_astro/`.
- The company column (`.co-side`) is sticky only from 880px up, where it sits beside the roles. Below that it stacks above them in normal flow and, as a scroll-driven enhancement, fades out and lifts 12px as it leaves the top of the screen (`cof`, range `exit 0%` to `exit 75%`). No fade under reduced motion or where `animation-timeline` is unsupported.
- A scale transform from a reveal animation makes elements measure smaller than they are mid-animation. When checking tap-target sizes, measure after the animation finishes.
- Keep it restrained: no autoplay, no parallax on text, no count-up on the Results numbers (they are credibility claims).
- Verify in headless Chrome by scrolling to set positions and reading the computed opacity of the title, text, image and buttons. They must change together, from 0 in the band to 1.
