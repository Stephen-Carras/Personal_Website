# Motion spec (companion to CLAUDE.md)

Last updated: 2026-11-21 (evening).

Everything is CSS-only except the carousel loops and the search jump, which need a little JavaScript (in the external script file). All animation is wrapped in `@media (prefers-reduced-motion: no-preference)`. Scroll-driven parts go inside `@supports (animation-timeline: view())`; browsers without support, and visitors who reduce motion, just see static content. Reference implementation: the `<style>` block in `design/Main.dc.html`.

## Load (hero, time-based)
`.ld` class: fade up 28px over 1.3s, `cubic-bezier(.22,.7,.2,1)`, staggered by `--d` (0 to 6, 180ms each, 300ms base). Order: headshot, name, headline, sub-line, buttons, location line, Seattle banner.

## Scroll-driven (view timelines, `linear` easing, `fill-mode: both`)
- `rv-u` (rise): opacity 0 and translateY 56px to rest. Range `entry` offset 0 to 340px, plus `--i * 40px` for staggering. Used on every h2, About paragraphs, Experience and Education rows, How I work items, every Beyond work block except Trips & places ("A little about me" and the gallery, and each row of cards, staggered 0 then 1), Contact rows.
- `rv-c` (chip pop): scale .8, translateY 26px to rest. Range `entry` 0 to 190px, plus `--i * 22px`. Used on the 11 highlighted Expertise & Tools chips.
- `rv-l` / `rv-r` (cards from the sides): translateX of -/+220px, translateY 90px, scale .84 to rest. Range `cover` from `--i * 3%` to `48% + --i * 3%`, so motion continues until the card is centered on screen, then it stays still. Not used in Beyond work.
- `rv-z` (zoom up): translateY 90px, scale .86 to rest. Range `cover 0%` to `cover 46%`. Used on Recommendations, Trips, and the "Let's talk." headline.
- `rv-n` (numbers): translateY 70px, scale .9, range `cover 6%` to `cover 46%`.
- **Results tiles use a named timeline** (`rs-l`, `rs-r`, `rs-n`): `#results` declares `view-timeline: --res block` and the tiles use `animation-timeline: --res`, so all four tiles and their numbers are driven by the whole section (not by each tile), which keeps the 2x2 grid moving together. `rs-l` and `rs-r` use range `cover var(--s) cover calc(100vh + 48px)` (`--s` is 200px for the top row and 450px for the bottom row), `rs-n` starts 60px later and ends at `100vh - 40px`. Left column enters from the left, right column from the right (same keyframes as `rv-l` / `rv-r`).
- Scroll progress bar: 2px accent line at the bottom of the nav (`.prog`), `scaleX` 0 to 1 using `animation-timeline: scroll(root)`.

## Expand and collapse (click-driven, native `<details>`)
- `details { interpolate-size: allow-keywords }` and `details::details-content` transitions height from 0 to auto (`.55s cubic-bezier(.22,.7,.2,1)`) plus opacity (`.45s`), with `content-visibility` as a discrete transition. This animates the role "About this role +", Education coursework and the competencies "Show all" panels.
- Fallback when `::details-content` is unsupported (`@supports not selector(...)`): children fade and slide down 12px (`dopen`, `.5s`).
- Expertise & Tools groups inside the open panel stagger by 70ms each (six rows, counted across the Skills and Tools blocks; each block heading arrives with its first row).
- Coursework chips pop in (`cwp`, scale .9 and 10px rise, `.5s`), staggered by `--k * 26ms`.
- Recommendation quotes animate their height between the 5-line clamp and the measured full height (a pixel value measured on click), not a keyframe.
- Search jump: after the overlay closes, the target scrolls into view and flashes a soft accent background (`flash`, 2s ease-out).

## Hint and nudge
`.hint-a` (the arrow beside "Swipe or scroll to read more"): translateX 0 to 5px and back, 1.8s ease-in-out, infinite. Only under `no-preference`.

## Carousels (JavaScript, small)
Recommendations, Trips & places and the photo gallery loop endlessly. JS adds two clone sets, starts at the middle set, and jumps by one set width after scrolling settles (about 140ms) with scroll-snap temporarily off, so the visitor never sees the jump. Previous/next buttons use `scrollBy`, smooth unless reduced motion. Clones are `aria-hidden` and not focusable. No autoplay.

## Reduced motion and print
- `prefers-reduced-motion: reduce`: all `ld`, `rv-*` and `rs-*` classes render in their final state (`opacity: 1`, no transform), details open and close instantly, `scroll-behavior: auto` everywhere (including scripted `scrollTo`, `scrollBy`, `scrollIntoView`), no nudge arrow.
- Print: animations off, everything visible, all `<details>` expanded, figures not split across pages.

## Rules that matter
- **Never put a view-timeline animation on an element inside a horizontal scroller** (recommendation cards, trips, gallery track). The timeline attaches to the nearest scroller (the horizontal track), not the page. Animate the wrapper outside the scroller instead (`rv-z` on the wrapper).
- Put `overflow-x: clip` on any section containing side-sliding cards so they enter from the screen edge and never cause a horizontal scrollbar (the Results section has it).
- Sticky columns (Experience, Education) are inside `rv-u` rows. That is fine because the animation ends with `transform: none`.
- The company column (`.co-side`) is sticky only from 880px up, where it sits beside the roles. Below that it stacks above them in normal flow and, as a scroll-driven enhancement, fades out and lifts 12px as it leaves the top of the screen (`cof`, range `exit 0%` to `exit 75%`). No fade under reduced motion or where `animation-timeline` is unsupported.
- A scale transform from a reveal animation makes elements measure smaller than they are mid-animation. When checking tap-target sizes, measure after the animation finishes.
- Keep it restrained: no autoplay, no parallax on text, no count-up on the Results numbers (they are credibility claims).
- Verify by rendering the page with an offset instead of scrolling (headless screenshots of scrolled documents come out blank).
