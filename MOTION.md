# Motion spec (companion to CLAUDE.md)

Last updated: 2026-11-27.

Everything is CSS-only except the carousel loops, the search jump, the Expertise & Tools pill morph, the section latch and the lazy section photos, which need a little JavaScript (bundled from `src/scripts/`, never inline). All animation is wrapped in `@media (prefers-reduced-motion: no-preference)`. Scroll-driven parts go inside `@supports (animation-timeline: view())`; browsers without support, and visitors who reduce motion, just see static content. Reference implementation: the `<style>` block in `design/Main.dc.html`.

## Load (hero, time-based)
`.ld` class: fade up 28px over 1.3s, `cubic-bezier(.22,.7,.2,1)`, staggered by `--d` (0 to 6, 180ms each, 300ms base), set with the classes `d1` to `d6` (no class means 0). The CSP forbids inline `style="--d:…"`. Order: headshot, name, headline, sub-line, button, location block. The headshot and name are scroll-animated, so their `.ld` sits on wrapper divs (`<div class="ld">`, `<div class="ld d1">`), never on `.hport` or `.hname` themselves. Never put `.ld` on an element that also has a scroll-driven animation. The hero photo fades in over 2.2s (`hfade`, opacity only) only where motion is allowed but scroll-driven animations are unsupported. Where they are supported, the intro below fades it in instead; under reduced motion it is simply there.

## Hero scroll (screen only, `--hero` view timeline)
The hero is a 395vh run (`.hrun`) with a sticky stage (`.hstage`) under the nav. All ranges are on `--hero`. At scroll 0 the timeline is at about cover 94vh, so the intro starts almost at once.

- **Opening frame:** the stage (`.hbox`) is the page background (`var(--bg)`: white in light mode, black in dark). Centred on it: the portrait at 2x (192px, still round) and, under it, the name as "stephen-carras_" with a blinking underscore. The star photo and scrim are at opacity 0, and the headline, subline, button and location (`.hrest`) are at opacity 0.
- **Name markup** (`Hero.astro`, built from `profile.name`): `.hname` holds an `.sr-only` "Stephen Carras" for screen readers and an `aria-hidden` `.hni` with the letters. Each word's first letter is a cell (`.hlc`, `display: inline-grid`) with a lowercase `.lo` and a capital `.up` stacked in `grid-area: 1/1`. The words are joined by `.hy` (an inline-block 0.3em wide holding a hyphen `<i>`), and the name ends with `.hus` (an inline-block holding the `.cur` underscore). At rest, `.lo`, the hyphen and `.hus` are at opacity 0 and `.hus` is 0 wide, so the static label reads "Stephen Carras". (`.hl` would collide with Expertise & Tools' featured row.)
- **Intro** (in order):
  - The portrait (`hpup`, ease) shrinks from scale 2 and rises into its 96px place: from `translateY(50svh - 134px - var(--hpad))`, cover 100vh to 138vh.
  - The name (`hnameup`, ease) travels up with it: from `translateY(50svh - 76px - var(--hpad))` at `clamp(48px,7vw,92px)`, line-height 1, letter-spacing -0.045em, to its resting 22px label under the portrait: cover 100vh to 138vh.
  - `--hpad` is the hero copy's top padding (`.hcopy`, `sections.css`): `clamp(36px, 8vh, 88px)`, with `8svh` in its own `@supports` block. The padding and the centring formulas read the same variable, so a screen that changes the padding keeps the opening centred. The start positions use svh, the same unit as the phone and touch stage.
  - During the travel (linear, cover 108vh to 132vh): `.lo` and the hyphen fade out (`hmout`), `.up` fades in (`hmin`), and `.hus` fades out while collapsing from 0.6em to 0 wide (`hmus`).
  - The star photo and scrim fade in (`hfadein`, linear, cover 105vh to 140vh). Over the same range the name's colour goes from `var(--t0)` to `rgba(255,255,255,.95)`, with its text shadow fading in (`hncol`). `.hbg` and `.hscrim` set `animation-duration: 1ms` so the 2.2s load fade can't stretch the scroll fade.
  - `.hrest` (headline, subline, Contact button, and the "Experience across" and location block inside `.hloc`) fades in after the name lands (`hfadein`, cover 140vh to 162vh). It is in the layout the whole time, so nothing moves when it appears.
- **Then, 75vh later than before the intro existed:** the copy and location fade up and out (`hout`, cover 175vh to 205vh), the photo zooms to 1.12 (`hzoom`, cover 100vh to 305vh), a page-background layer fades over the stage (`hfadein`, cover 190vh to 275vh), then the statement and its sub-line fade in where they rest, opacity only (`hfadein`; cover 295vh to 345vh and 307vh to 357vh). The fully assembled hero holds for about 13vh, between 162vh and 175vh.
- **Statement cursor:** a decorative bar cursor (`<span class="cur cur-bar" aria-hidden="true">`) follows "both." with no space. `.hstmt .cur-bar` makes it 0.06em by 0.8em with a 0.1em gap. It blinks like the other cursors (see Cursors).
- **Phones and touch tablets** (`max-width: 640px`, or `hover: none` and `pointer: coarse`): the same run and ranges in svh (395svh), so the stage (`calc(100svh - var(--nav-h))`) fits the visible area with the browser toolbars showing.
  - **Toolbar hidden:** the screen is then 100lvh tall, taller than the stage. Only the background layers reach down the extra `(100lvh - 100svh)`; the stage, copy, portrait and statement keep svh and do not move. This is inside `@supports (height: 100lvh)`:
    - `.hbg` (the photo) has `bottom: calc(100svh - 100lvh)` and `overflow: hidden`, so the zoom is clipped at its own box.
    - `.hblank` (the cover that fades the photo out) has the same `bottom`.
    - `.hscrim::after` is a solid `rgba(0,0,0,.6)` band (the scrim's last stop) under the scrim, `top: 100%`, `calc(100lvh - 100svh)` tall. The scrim itself is unchanged.
    - So the layers can reach past the stage, `.hstage` and `.hbox` are `overflow: visible`, and `.hrun` is `overflow: clip` so the overhang never reaches into Results.
  - The photo box is taller than the visible screen while the toolbar shows, so with `object-fit: cover` the photo is slightly larger than before (about 13% on a portrait phone), the same in both toolbar states.
- **Phones only** (`max-width: 640px`, a separate block after the main one): the portrait stays in the phone layout at 72px (14px below it), and the intro runs the same way as on larger screens.
  - The portrait uses `hpupm`: from `translateY(50svh - var(--hpo, 90px) - var(--hpad))` at scale 2, to rest. The name uses `hnamem`: from `translateY(50svh - var(--hno, 44px) - var(--hpad))` at 9.5vw. Both travel over the touch block's svh ranges, and the name morphs as above.
  - **Short phones** (`max-width: 640px` and `max-height: 700px`, `sections.css`): `--hpad: 20px`, the portrait is 56px (10px below it), and `--hpo: 82px` and `--hno: 40px` are the start offsets for that size. `.hloc` has `padding-bottom: max(16px, calc(env(safe-area-inset-bottom) + 12px))`, so the copy and both bottom lines fit the visible area. The motion block repeats the 56px size in a nested `max-height: 700px` query, because its 72px rule is `!important` and comes later. At `max-height: 620px` the subline, button, location and experience lines also get smaller type and spacing.
  - Measured in headless Chrome, the opening portrait and name are centred within 1 to 2px on phones 553 to 844px tall.
- **Reduced motion and unsupported browsers:** the static photo hero, label "Stephen Carras", nothing blinks. Then the statement band.
- Print shows the name as plain dark text (`.hname` and `.hni` are in the print colour rules).

## Scroll-driven (view timelines, `linear` easing, `fill-mode: both`)
- **Results look** (all screen sizes, `sections.css`, screen only):
  - The Seattle skyline is the section's `::before` (`source-images/results-seattle-skyline.jpg`, 2000px JPEG q78, referenced from CSS), centered 50% 55% / cover. A vertical gradient (`rgba(0,0,0,.32)` at the top, `.12` at 40%, `.4` at the bottom) is layered above it in the same background, and `filter: saturate(.85) brightness(.92)` mutes both.
  - The section has `position: relative`, `isolation: isolate` and `overflow: clip`, so the `::before` sits at `z-index: -1` under the content and is clipped at the section edges.
  - The section redefines `--t0` (white), `--t2` (white .9) and `--m` (white .72), so the title and tile text turn white in light and dark mode alike.
  - Tiles are frosted dark glass: `rgba(12,14,20,.3)`, a 1px `rgba(255,255,255,.22)` border and `backdrop-filter: blur(10px) saturate(1.1)`.
  - Print keeps the plain light section.
- **Results, pinned build** (only at `min-width: 900px` and `min-height: 820px`, inside the motion wrappers):
  - `#results` is `calc(100svh + 45svh)` tall with no top or bottom padding. The photo (`::before`) is sticky at `top: 0`, exactly one screen tall, full bleed (`width: calc(100% + 64px)`, `margin-left: -32px`), and takes no space (`margin-bottom: -100svh`). Where lvh is supported it is 100lvh tall instead (`margin-bottom: -100lvh`, own `@supports` block), so it still covers the screen when a browser toolbar slides away (see Backdrop height).
  - The content wrapper (`#results > .wrap`) is sticky at `top: 0`, 100svh tall, with the title and grid centered as one block. Both stay pinned for 45svh of scroll.
  - Everything runs on the section's `--res` timeline, where `cover 100svh` is the section top at the screen top (photo fully in):
    - the title (`sfade`): `cover 100svh` to `cover 110svh`
    - the tiles (`rvl` / `rvr`): `cover 104svh` to `cover 128svh`
    - the numbers (`rvn`): `cover 110svh` to `cover 133svh`
  - So the full photo shows first, then the title fades in and the cards come together.
  - Smaller or shorter screens don't pin. They keep the normal layout and the per-tile reveals below.
- **Results heading** (`rv-u`, when not pinned): opacity 0 and translateY 56px to rest, range `entry 0` to `entry 340px`.
- **Results tiles** (`rs-l`, `rs-r`, `rs-n`, when not pinned): each tile declares its own timeline (`view-timeline: --tile block`). `rs-l` and `rs-r` (keyframes `rvl` / `rvr`: translateX -/+220px, translateY 90px, scale .84 to rest) run `cover 0svh` to `cover 33svh`, so each tile is assembled by the time its top reaches the 2/3 line. The left and right tiles of a row share a position, so they move together. The number (`rs-n`, keyframes `rvn`: translateY 70px, scale .9) runs `cover 6svh` to `cover 33svh`. `#results` is at least 100svh tall with its content centered (`sections.css`).
- **Section entrances** (every section after Results; About, Experience, How I work and Beyond work differ, see their own entries below):
  - Each section declares `view-timeline: --sec block`. One animation (`sfade`: opacity 0 and translateY 24px to rest) on that timeline drives the whole section.
  - The title gets `.rise-a`; the text, images and buttons get `.rise-b` on their wrappers. Both run the same range, so everything fades up together, never one element at a time. This includes the Expertise "Show all" wrapper (`.comp-more`) and the Contact buttons (`.contact-btns`), which stay hidden until the text appears. `.rise-c` is reserved and uses the same range.
  - Ranges are measured from the section's top entering the bottom of the screen, so a section that grows (Show all, an opened role) does not move them.
  - **Expertise & Tools and Let's talk** have a blank lead-in band (`padding-top: var(--band)`, 20svh, page background, nothing visible in it) and fade over `cover 92svh` to `cover 107svh`, starting with the title about 28% from the top and ending near the top. Expertise & Tools starts at the same point but takes half the scroll: `cover 92svh` to `cover 99.5svh`.
    - Expertise & Tools' title sits 96px higher than the band alone would put it: `padding-top: calc(var(--band) - 96px)`. With "Show all" open, the bottom padding matches the top (`section#focus:has(#comp-all[open])`); without `:has()` it keeps the 12svh runway. Under reduced motion it keeps the normal 96px padding.
  - **Education and What people say** have no band. Each fills at least one screen with its content centred (`sections.css`, screen only), and fades over `cover 85svh` to `cover 100svh`, so it is fully in exactly when the section top reaches the screen top and the content is centred.
    - What people say is a flex column (`justify-content: center`, `padding: 8svh 32px`; its `.wrap` needs `width: 100%`).
    - Education is not a flex column, because opening a program's coursework grows the section and flex centring would push the title up. Its padding centres the closed content instead: `max(6svh, calc((100svh - 790px) / 2))` top and bottom. 790px is the closed content height at desktop widths (795px at 1440 and 1280, 781px at 1024); re-measure it if Education's content changes.
  - The end of each range comes from the section's `--rise-end` custom property (in svh: Expertise & Tools 99.5, Education and What people say 100, Let's talk 107, About, Experience, How I work and Beyond work 120), read as `cover calc(var(--rise-end) * 1svh)` where the range uses it. It is also the latch point.
  - **Latch** (`src/scripts/section-latch.ts`): once a section has fully faded in, it stays in. The script adds `lat` to the section when its top reaches `(100 - --rise-end)` svh, the point where the animation already rests at its last frame, so there is no jump. `section.lat .rise-*` sets `animation: none`, `opacity: 1` and `transform: none`. Scrolling up keeps it visible. `lat` is removed only when the section top is at or below the bottom of the screen (the whole section is out of view), so scrolling back down replays the fade.
    - The script reads `--rise-end` with `getComputedStyle`, so CSS and script share one value. It measures svh with a hidden fixed 100svh probe (`.svh-probe`), falling back to `innerHeight`.
    - It runs at most once per frame (requestAnimationFrame) on scroll (passive, capture), and also on resize, at start and on load, so a `#hash` load or a long jump latches every section already passed.
    - No timers, no fade-out. It does nothing under reduced motion or without `animation-timeline` support.
    - Elements marked `.rv-own` run their own `view()` timelines: Beyond work's `.bbody` elements, and every Experience company after the first. `section.lat` skips them (`:not(.rv-own)`). The script latches each one separately (`.rise-b.lat`) once its own fade has ended, and releases them all together with the section. That point is measured from the bottom of the screen: `0.45 * min(height, vh)` for `entry 0% entry 45%` (Beyond), or 260px for `entry 0px entry 260px` (Experience, set per section id in the script).
  - Expertise & Tools and Let's talk have `padding-bottom: var(--runway)` (12svh).
  - Expertise & Tools is at least 130svh tall (border-box), so Experience never peeks in below it while it is collapsed. Contact is at least 100svh, so the page can scroll far enough for its fade to finish, even on very tall screens.
  - Anchors and nav links:
    - Let's talk uses `scroll-margin-top: calc(var(--nav-h) + 24px - var(--band))`, so a jump lands with the title 72px from the top, fully faded in, instead of in the blank band. Expertise & Tools uses `calc(var(--nav-h) + 12px - (var(--band) - 96px))`, landing with the title 60px from the top, fully faded in on screens 800px tall or more.
    - Education and What people say use `scroll-margin-top: 0`, landing centred, fully in and already latched.
  - The bands, runways and the 130svh/100svh minimum heights exist only inside the motion wrappers. Reduced motion and unsupported browsers keep the normal 96px section padding, except for Education and What people say, whose centring is screen-only layout.
- **Wave sections look** (About, Experience and How I work, class `.wave`; all screen sizes, `sections.css`, screen only):
  - The photo follows the site theme. Every theme-dependent value is a `--wv*` token in `global.css`, set in `:root` (light), `:root[data-theme='dark']` and the no-JS `prefers-color-scheme: dark` block, so the theme toggle and a system switch change the image and colours together. The section reads them: `background: var(--wvbg)`, `::before` `background: var(--wvov)` and `filter: var(--wvfl)`, `.photo-on::before` `background: var(--wvov), var(--wvimg) 50% 50% / cover no-repeat`.
  - **Light:** a pale white wave (`source-images/wave-light-background.jpg`, 2000x3000 JPEG q80, about 114KB, from `white-wave-themed-picture.avif`) under a faint white gradient (`rgba(255,255,255,.1)` to `0` at 45% to `.12`), no filter, base `#f5f5f7`. Dark text: `--t0`/`--t1` `#1d1d1f`, `--t2` `#424245`, `--t3` `#3c3c41`, `--m` `#55555a`, `--hair` black .14, `--hair2` black .08, `--cardw` white .6, `--bga` black .04, `--accbg` black .06, and `--accent` and `--ring` `#0055aa` (`#0066cc` measured as low as 3.81:1 on the photo; `#0055aa` is at least 4.99:1). No text shadow, no accent brightening.
  - **Dark:** a dark grayscale wave (`source-images/wave-dark-background.jpg`, 2000x1125 JPEG q80, about 184KB, from the 3840x2160 `wave-themed-dark-wallpaper.jpg`) under a vertical gradient (`rgba(0,0,0,.45)` to `.38` at 50% to `.55`), `filter: brightness(1) contrast(1.05)`, base `#050607`. White text: `--t0`/`--t1` white, `--t2` white .92, `--t3` .94, `--m` .86, `--hair` .2, `--hair2` .12, `--cardw` white .09, `--bga` white .06, `--accbg` white .12, and `--accent` and `--ring` `#2997ff` (the light-theme `#0066cc` measured 3.6:1 on the "Company acquired" pill). Headings, paragraphs and list items get `text-shadow: 0 1px 3px rgba(0,0,0,.5), 0 2px 22px rgba(0,0,0,.55)` (`--wvts`), and the accent text ("Key impact +", "Company acquired") gets `filter: brightness(1.4)` (`--wvacc`).
  - The section sets `--bg` to `var(--wvbg)` too.
  - It is pinned behind the whole section the same way as Beyond work: sticky `::before` at `top: 0`, one screen tall (100svh, or 100lvh where supported; see Backdrop height), full bleed (`width: calc(100% + 64px)`, `margin-left: -32px`), with a matching negative `margin-bottom`. The section has `position: relative`, `isolation: isolate`, `overflow: clip`, `display: block` and `padding: 0 32px` (no top padding, so the photo starts flush with the section top).
  - Lazy like Beyond work: `section-photos.ts` adds `photo-on` to each `.wave` about two screens away, and only `.wave.photo-on::before` has the `url()`.
  - Two blocks: `.wrap.bstage` (the title; in How I work also the lead sentence), 25svh from the top, and `.wrap.bbody` (the rest, 112px bottom padding). The first block in `.bbody` sits 56px below the stage in About and How I work, and 40px in Experience. No pinned title and no extra scroll runway.
  - Print keeps the plain light sections.
- **Wave sections entrance** (inside the motion wrappers):
  - On `--sec`, where `cover 100svh` is the section top at the screen top (photo fully in, title 25% down): the title fades over `cover 88svh` to `cover 100svh`, How I work's lead sentence over `cover 90svh` to `cover 102svh`, and the content right beneath over `cover 92svh` to `cover 104svh` (About's paragraphs, How I work's six items, Experience's first company).
  - Every Experience company after the first (`.rv-own`) fades on its own timeline as it enters: `animation-timeline: view()`, `entry 0px` to `entry 260px`.
  - Opacity only (`ofade`), nothing slides up.
  - `--rise-end: 120` is the latch point.
  - Anchors land with the title just under the nav, past the end of every fade: `scroll-margin-top: calc(var(--nav-h) + 24px - 25svh)`.
- **Beyond work look** (all screen sizes, `sections.css`, screen only):
  - The airplane window (`source-images/beyond-airplane-window.jpg`, 2000x1125 JPEG q80, about 89KB, from `airplane-window-travel-picture.webp`) is the section's `::before`, centered 50% 50% / cover. Two gradients sit above it in the same background: left to right `rgba(0,0,0,.5)` to `.28` at 62% to `.18`, and top to bottom `.3` to `.2` at 45% to `.42`. `filter: saturate(.9) brightness(.8)` mutes them. The section's base colour is `#0b0c10`.
  - Unlike Results, the photo is pinned behind the whole section: the `::before` is sticky at `top: 0`, exactly one screen tall (100svh, or 100lvh where supported; see Backdrop height), full bleed (`width: calc(100% + 64px)`, `margin-left: -32px`, cancelling the section's 32px side padding), and takes no space (a matching negative `margin-bottom`). Everything scrolls up over it, and it leaves with the section's bottom edge. The section has `position: relative`, `isolation: isolate`, `overflow: clip` and `padding: 0 32px`.
  - The photo layer loads only when the section is about two screens away: `src/scripts/section-photos.ts` adds `photo-on` to `#beyond` and each `.wave` (IntersectionObserver, `rootMargin: 200% 0px`), and only `#beyond.photo-on::before` has the `url()`. Loading it with the page pushed the hero's LCP back 130 to 380ms on a slow connection. Before that, and without JS, the section shows its dark base and gradients, so the white text still reads.
  - The section redefines its colour tokens (`--t0`/`--t1` white, `--t2` white .92, `--t3` .94, `--m` .74, `--hair` .22, `--hair2` .12, `--cardw` `rgba(12,14,20,.34)`, `--bga` white .08, `--bg` white .16, `--accent` and `--ring` `#2997ff`), the same in light and dark mode. The `--bg` override makes the hobby pills and "Full list" buttons translucent.
  - Cards and the round gallery buttons are frosted glass: the `--cardw` fill, a 1px `rgba(255,255,255,.22)` border, `backdrop-filter: blur(10px) saturate(1.1)`. Headings, paragraphs, "Swipe through" and the trip captions on the photo get `text-shadow: 0 1px 3px rgba(0,0,0,.4), 0 2px 24px rgba(0,0,0,.5)`; text inside cards gets none.
  - Two blocks: `.bstage` (at least one screen, the title and intro centered in `.bpin`) and `.wrap.bbody` (everything else, 112px bottom padding). The "Full list" pop-ups sit after the section so they keep the page's normal colours.
  - Print keeps the plain light section.
- **Beyond work entrance** (inside the motion wrappers):
  - No blank band or runway: the first screen is the photo. Anchors land at the fully-in point (`scroll-margin-top: calc((100 - var(--rise-end)) * 1svh - 1px)`, about -20svh).
  - On the section's `--sec` timeline (`cover 100svh` = section top at the screen top, photo fully in): the title (`.rise-a`) fades over `cover 100svh` to `cover 110svh`, the intro (`.rise-b`) over `cover 106svh` to `cover 120svh` (`--rise-end: 120`, also the latch point).
  - At `min-width: 900px` and `min-height: 820px`, `.bstage` is `calc(100svh + 45svh)` tall and `.bpin` is sticky at `top: 0`, 100svh tall, centered, so the title and intro stay pinned over the photo for 45svh of scroll. Smaller or shorter screens keep the title block in normal flow with the same ranges.
  - Everything in `.bbody` (`.rv-own`) fades on its own timeline as it enters: `animation-timeline: view()`, `animation-range: entry 0% entry 45%` (`sfade`), and is latched per element (see Latch).
  - Reduced motion and unsupported browsers: no fades, no pinning of the title block; the photo is still a fixed backdrop behind the section.
- **Backdrop height** (the sticky photo layers: `.wave::before`, `#beyond::before`, and the pinned `#results::before`):
  - Each is `height: 100svh; margin-bottom: -100svh`, then, in a separate `@supports (height: 100lvh)` block after it, `height: 100lvh; margin-bottom: -100lvh`. lvh is the screen height with a phone's browser toolbar hidden, so the photo still covers the screen once the toolbar slides away. With the toolbar showing, the extra part sits below the screen.
  - Only the photo layers use lvh. The content pins (`#results > .wrap`, `.bpin`, `.wave .bstage`, `#beyond .bstage`) stay svh, so text stays centred in the visible area.
  - The section's `overflow: clip` cuts the layer at the section's bottom edge, so it never shows in the next section and never changes the page height.
  - Side effect: with `background-size: cover`, a portrait phone shows the photos about 13% larger than with svh (750/664 on an iPhone-sized screen), with a little more cropped at the bottom. The size no longer changes when the toolbar moves.
  - Desktop has no collapsing toolbar, so svh equals lvh there and nothing changes.
- **Cursors** (decorative, `aria-hidden`, never part of the readable text):
  - `.cur` (`sections.css`) is an inline-block. `.cur-b` draws a block (0.44em by 0.78em) and `.cur-bar` a thin bar (0.07em by 0.82em); both are empty spans used with `.cur`.
  - The blink (`curblink`, 1.1s `step-end`, infinite) is in the plain `prefers-reduced-motion: no-preference` block, not the `@supports` one, so it works without scroll-driven animations and is static under reduced motion.
  - Where they appear:
    - underscore: "About Stephen", "A little about me", the footer "stephen_", and the hero intro name
    - block: Experience
    - bar: How I work and the hero statement
  - Static code-style prefixes (`.cmt`, monospace, `--m`): `//` Expertise & Tools, `#` Education, `>` What people say, `~/` Beyond work.
- **Scroll progress bar**: a 2px accent line at the bottom of the nav (`.prog`), `scaleX` 0 to 1 using `animation-timeline: scroll(root)`.
- Keyframe names are global: check that a name is unused before adding one (`hfade` is the hero photo's fade, so the section fade is `sfade`). Class names are global too: the hero's letter cell is `.hlc` because `.hl` is the Expertise & Tools featured row.

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

## Smooth scrolling (section links)
- In-page links (the nav, its home link to `#top`, the skip link, the hero's education link, Contact links) scroll smoothly: `html { scroll-behavior: var(--page-scroll, auto) }` in `global.css`, under `prefers-reduced-motion: no-preference`.
- Smooth turns on 1s after the page starts. `html` runs a 1ms animation (`pagesmooth`, `animation-delay: 1s`, `fill-mode: forwards`) that sets the unregistered custom property `--page-scroll` to `smooth`. Unregistered custom properties animate discretely and hold their value. Browsers also apply `scroll-behavior` to the jump to a `#hash` on load, which must stay instant.
- `scroll-behavior` is not inherited and only affects the root scroller, so inner scrollers are unchanged (the carousels' loop jumps stay instant). Scripted scrolls that pass a `behavior` keep it.
- Landing positions are the same as with instant jumps; only the travel is animated. Chrome caps a smooth scroll at about 1.5s, however far it goes (Results to Contact took 1490ms). No custom JS easing.
- Reduced motion: `scroll-behavior: auto !important`, instant.

## Hint and nudge
`.hint-a` (the arrow beside "Swipe or scroll to read more"): translateX 0 to 5px and back, 1.8s ease-in-out, infinite. Only under `no-preference`.

## Carousels (JavaScript, small)
Recommendations, Trips & places and the photo gallery loop endlessly. JS adds two clone sets, starts at the middle set, and jumps by one set width after scrolling settles (about 140ms) with scroll-snap temporarily off, so the visitor never sees the jump. Previous/next buttons use `scrollBy`, smooth unless reduced motion. Clones are `aria-hidden` and not focusable. No autoplay.

## Reduced motion and print
- `prefers-reduced-motion: reduce`: all `ld`, `rv-u`, `rs-*` and `rise-*` classes render in their final state, the blank bands are gone, the hero has no intro (static photo hero, "Stephen Carras"), cursors don't blink, the photos behind Results, the wave sections and Beyond work are still there (Beyond's and the waves' still pinned), the section latch does nothing, Show all toggles without the morph (`opacity: 1`, no transform), details open and close instantly, `scroll-behavior: auto` everywhere (including scripted `scrollTo`, `scrollBy`, `scrollIntoView`), no nudge arrow.
- Print: animations off, everything visible, all `<details>` expanded, figures not split across pages.

## Rules that matter
- **Never put a view-timeline animation on an element inside a horizontal scroller** (recommendation cards, trips, gallery track). The timeline attaches to the nearest scroller (the horizontal track), not the page. Animate the wrapper outside the scroller instead (`.rise-b` on the Recommendations and Trips wrappers).
- Put `overflow-x: clip` on any section containing side-sliding cards so they enter from the screen edge and never cause a horizontal scrollbar (the Results section has `overflow: clip`, which covers it).
- `.ld` goes on wrapper divs, never on an element with a scroll animation: its `animation` shorthand would replace the scroll animation. Note that a wrapper holding the load animation's transform becomes the containing block for absolutely positioned children.
- Sticky columns (Experience, Education) are inside `.rise-b` rows. That is fine because the animation ends with `transform: none`. Sticky and scroll ancestors use `overflow: clip`, never `hidden` or `auto`.
- Use svh, not vh, for new heights and ranges, so phone toolbars don't throw them off. Every browser with view timelines supports svh. The exception is a full-screen backdrop layer (a photo behind content), which uses lvh so it still covers the screen when the toolbar hides; the content over it stays svh (see Backdrop height).
- Put the svh or lvh value in its own `@supports` block after the fallback. The build's CSS minifier keeps only the last of two declarations in one rule (`height: 100svh; height: 100lvh` becomes just `100lvh`), which removes the fallback.
- Write animations as longhands (`animation-name`, `animation-timeline`, ...). The build's CSS minifier folds an `animation` shorthand plus `animation-timeline` into an invalid shorthand. After any motion change, check the built CSS in `dist/_astro/`.
- The company column (`.co-side`) is sticky only from 880px up, where it sits beside the roles. Below that it stacks above them in normal flow and, as a scroll-driven enhancement, fades out and lifts 12px as it leaves the top of the screen (`cof`, range `exit 0%` to `exit 75%`). No fade under reduced motion or where `animation-timeline` is unsupported.
- A scale transform from a reveal animation makes elements measure smaller than they are mid-animation. When checking tap-target sizes, measure after the animation finishes.
- Keep it restrained: no autoplay, no parallax on text, no count-up on the Results numbers (they are credibility claims).
- Verify in headless Chrome by scrolling to set positions and reading the computed opacity of the title, text, image and buttons. They must change together, from 0 in the band to 1.
