# Personal Website: Build Spec for Claude Code

Last updated: 2026-11-25. Supersedes every earlier version, including the dark/techy spec and the first light-theme spec.

## Goal
Static personal career site for Stephen, sent to recruiters. LinkedIn-style sections plus a human side ("Beyond work"). Target roles (the Contact "Open to" row, two groups): Startups and growth companies (senior strategy and operations leadership, such as Chief of Staff or Head of Strategy & Operations) and Big Tech (strategy and operations leadership, such as Chief of Staff or Senior Manager, Strategy & Operations), leading a small team at a company of roughly 1,000 to 5,000 people or fewer (about $180K to $220K base). Seattle-based, open to relocating (WA, TX, CA, NY, MA, SC, CO, UT) plus remote/hybrid.

## Source of truth for design and content
- The finished design is `design/Main.dc.html` in this repo (a Design Component: markup, CSS and one script in a single file; open it in a browser or read it as text). It is also published as the claude.ai artifact "Stephen — Personal Website": https://claude.ai/artifact/EYd7mipGDavQYu92LniX6i. Match it visually and copy text verbatim. Do not rewrite Stephen's wording.
- In `design/Main.dc.html`, images appear as `/_blob/<id>`. `source-images/image-manifest.json` maps every id to a real file in `source-images/`, with alt text and where it is used.
- Stephen's resume was compared line by line with the site on 2026-11-21 and the differences were resolved (see Decisions). The site text is now the reference. Do not "fix" content on your own; ask.
- `MOTION.md` (same folder) is the animation spec.

## Stack (decided)
- Astro, static output only (`output: 'static'`). No SSR, no server, no database, no auth.
- Content in structured files (JSON or YAML: `profile`, `roles`, `education`, `recommendations`, `trips`, `gallery`, `competencies`, `results`, `howIWork`) so a future multi-user profile product could reuse the schema. Templates read from these files. The search index is generated from the same files at build time (see Search).
- Fonts: system stack only, `-apple-system, BlinkMacSystemFont, 'SF Pro Display', 'SF Pro Text', 'Helvetica Neue', Inter, 'Segoe UI', Arial, sans-serif`. No webfonts, no Google Fonts.
- Hosting: GitHub Pages at the default `username.github.io` for now. Custom domain later (not chosen yet).
- Interactivity must work under the strict CSP, so ship one small external script file (no inline scripts, no inline event handlers). The design file uses inline handlers and an inline script; port them to the external file. Use native `<details>` and CSS wherever possible.

## Design (decided: Apple-style, light and minimal)
- Look: white and soft-gray alternating full-width sections, one blue accent, big semibold headlines with tight letter-spacing, generous whitespace, rounded 28px cards without borders, hairline dividers, no emojis, no mono type, no bordered pill clutter.
- Tokens (light): bg `#FFFFFF`, alt bg `#F5F5F7`, hairline `#D2D2D7` / `#E8E8ED`, text `#1D1D1F`, secondary `#424245`, tertiary `#5C5C61`, muted `#6E6E73` (both darkened from the original to meet WCAG AA), accent text `#0066CC`, button fill `#0071E3` with white text. Nav link rest `#58585C`, hover `#000000`.
- Tokens (dark): bg `#000000`, alt `#121214`, card `#1D1D1F`, hairline `#3A3A3C` / `#2A2A2D`, text `#F5F5F7`, secondary `#D2D2D7`, tertiary `#A1A1A6`, accent `#2997FF`. Nav link rest `#C7C7CC`, hover `#FFFFFF`.
- Award pill colors (TIME pill): light bg `#FFF3DC` / text `#9A4A00`; dark bg `rgba(255,159,10,0.16)` / text `#FFB340`.
- Focus: every interactive element gets a visible `:focus-visible` ring in the accent color (`--ring`). Hover styles live inside `@media (hover:hover)` so touch devices never get stuck hovers.
- Theme toggle (sun/moon in the nav). Default to the visitor's system preference (`prefers-color-scheme`), follow system changes until the visitor picks, remember the choice, and avoid a flash of wrong theme in a CSP-compatible way (external script in `<head>`, set `data-theme` before paint). `color-scheme` meta is set.
- Layout: max content width 1080px, fluid, must work at phone width. Touch targets at least 44px (below 860px the small controls grow to 44px). Contrast at least 4.5:1. Respect `prefers-reduced-motion`.
- Sticky translucent top nav (48px): personal mark + name, links, Search button, theme toggle. Links hidden on narrow screens except name, search and toggle.
- **Personal mark**: Stephen's illustrated black-and-white hooded portrait. 28px round mark beside his name in the nav, 96px round portrait in Beyond work. It is an opaque image on a white circle in both themes (do not invert it in dark mode; inverting turns the face into a negative). The current source is only about 288x360px, so never display it larger than about 100px until Stephen provides a higher-resolution version (ask him to regenerate it at 1024px or larger).
- Print: a print stylesheet exists (hides nav and search, expands all details, no animations, avoids breaking figures). It currently prints about 24 pages; a one-page resume-style print view is an optional later task.

## Page structure (in order)
Skip link ("Skip to content") first, then the nav, then `<main id="main">`.
1. Nav: round personal mark + "Stephen Carras", links (Results, About, Experience, Education, Recommendations, Contact), Search button (⌘K hint), theme toggle.
2. Hero (centered, `id="top"`): round headshot, name, headline "Turning ideas into execution.", three-sentence sub-line ("Data-driven leader with a strategic vision." / "Two startups." / "Bridging hardware, AI, security and business." Each sentence is `display:inline-block` so a phrase never splits), one button: "Contact me" (opens the popup). There is no resume download anywhere. Then "Seattle, WA · Penn State MBA & M.S. in Cybersecurity", the wide Seattle skyline image (4:1, not cropped), and "Experience across Boeing · T-Mobile · FTSE Russell · InductEV · Constellation Energy".
3. Results (gray, `id="results"`): "Results that moved the business." Four tiles in a 2x2 grid: $13.4M (new revenue potential unlocked in 8 months by a 5-person strategy team, Startup · Series C), $3.46M (future-proofed the network for higher production rates, Boeing), 37 days (facility WiFi upgrade delivered without impacting production-rate targets, Boeing), 150K (unassigned assets traced; unknown-owner backlog cut 30%, T-Mobile). This section also owns the named view timeline `--res` (see MOTION.md).
4. About (white, `id="about"`): bold lead paragraph, then all body paragraphs shown in full (no Read more / Show less toggle; removed at Stephen's request 2026-11-22). All paragraph gaps equal (26px). The text ends with "I'd love to connect." Then Expertise & Tools (gray, `id="focus"`): 12 highlighted chips (mostly AI tools plus three leadership skills: Claude & Claude Code, Cursor, OpenAI Codex, AI Agents & MCP Multi-Agent Workflows, Anthropic & OpenAI APIs, ChatGPT, Gemini, Perplexity, Microsoft 365 Copilot, Cross-Functional & People Leadership, Executive & Board Communication, Organizational Change Management), "Show all 52 +" (count computed from the data) shows every item in two labelled blocks: Skills (AI & Transformation, Leadership, Business Strategy & Operations) then Tools (AI Tools, Data & Analytics, Platforms & Infrastructure).
5. Experience (white, `id="experience"`): per company a sticky left column (logo, name, pills, header line) and a right column of roles. Each role is collapsed behind "About this role +" (native `<details>`). See "Role and company format".
6. Education (gray, `id="education"`): Penn State, sticky left column like Experience; four degrees (MBA 3.93 GPA, M.S. Cybersecurity Analytics and Operations 3.97 cumulative GPA summa cum laude, and two bachelor's degrees with **no GPA shown**); MBA (19) and M.S. (10) coursework collapsed.
7. How I work (white, `id="how"`): lead sentence plus six items in a 3-column grid: Hands-off, with a clear rhythm / Hands-on when it counts / Start with the data / Keep the long view / Learn the whole business / Simplify until it's obvious (built an internal tool with Amazon Kiro that lets division executives at a Fortune 500 company track manufacturing milestones in real time; no outcome metric yet).
8. Recommendations (gray, `id="recommendations"`): "What people say." Four horizontal scroll-snap cards, newest first: Collin Long (Aug 28, 2025), Kevin Murphy (Dec 9, 2023), Allen Khaligh, Kelsey Heick. Quotes clamp with Read more / Show less. Quote typos ("inisitatives", "pursing", "recommend course of action") are the writers' own words and stay verbatim. A "Swipe or scroll to read more" hint with a nudging arrow sits above the track with round previous/next buttons. The carousel loops (see Behaviors). Cards and the previous/next buttons are white (`--card`) on the gray band.
9. Beyond work (white, `id="beyond"`), in this order: intro line, the **photo gallery with "A little about me"**, Trips & places carousel (Toronto, Seoul, Florence, Rome, Jeju Island; loops), Hobbies & interests, Favorite books, Music, then "Ask me about" and "Now" cards.
10. Contact (gray, `id="contact"`): "Let's talk.", buttons Email me and LinkedIn (no resume button), rows for Open to, Reply time, Where (grouped by state).
11. Footer: two small lines, "Designed and built with Claude" and "Views expressed on this site are my own." Nothing else (no copyright line, no links).

## Role and company format (decided, keep uniform)
Every role shows three lines under its title:
1. `Full-time · {duration}` (all roles are full-time, including InductEV Strategic Advisor)
2. `{Mon YYYY} – {Mon YYYY | Present}`
3. `{City, State, Country} · {On-site | Hybrid | Remote}` (a role may have only a country, or no location line)
Every company header (left column) shows `Full-time · {total tenure}`, computed from the earliest start to the latest end (or today). Pills under the company name:
- InductEV: grey-blue "Company acquired", then an amber link pill "TIME Best Inventions 2024 ↗" to https://time.com/collections/best-inventions-2024/7094804/inductev-wireless-charging-network/ (opens in a new tab, screen-reader text says so).
- FTSE Russell: grey pill "An LSEG Business".
- Atlantian Labs (formerly shown as "Stealth Startup"): grey pill "Company shut down", and an "AL" initials tile in place of a logo.
Inside an expanded role, in this order: a short paragraph, then plain bullets, then a quiet skills line. The bullets for Boeing (3 roles), T-Mobile, InductEV Senior Manager, FTSE Russell and Atlantian Labs are Stephen's resume bullets word for word. Roles not on the resume (InductEV Strategic Advisor, Constellation Energy, the two early Momentum Dynamics roles) keep their existing text.

## Search (built, must be ported)
A full-screen search overlay opened by the nav button, ⌘/Ctrl+K, or `/`. Esc closes. Behavior:
- Index is generated at build time from the content files (about 160 entries). Kinds, in ranking priority: Company, Role, Skill, Tool, Education, Coursework, Result, Recommendation, About, How I work, Place, Interest, Book, Music, Ask me about, Now, Recognition, Contact, Jump to. Entries with the same title are merged into one row with combined kinds (for example "Music · Now") so there are never duplicates.
- Matching: lowercase, accent-stripped (NFD) tokens; every token must match the entry's haystack text; titles that start with the query score higher; ties broken by kind priority. Haystack text must never contain template placeholders. Company rows show "Full-time" as their subtitle (not a computed duration).
- Empty query shows quick jumps (the sections, Contact me, LinkedIn) and suggestion pills: Boeing, AI strategy, Tableau, Penn State, Startups, Leadership.
- Nothing is highlighted until the visitor hovers or uses arrow keys. Hovering the header, heading or pills clears the highlight. Enter with no highlight opens the top result.
- Choosing a result closes the overlay, scrolls to the target, opens it if it is collapsed (role, coursework, Expertise & Tools), and flashes a soft highlight for 2s. A recommender's name opens and scrolls to that person's card in the carousel. Contact me opens the popup. LinkedIn opens in a new tab.
- Accessibility: combobox/listbox pattern (`role="combobox"`, `aria-controls`, `aria-activedescendant`, options with ids), a live-region result count, focus trap, focus returns to the opener on close, page scroll locked while open.
- **Maintenance rule:** every new recommendation, role, trip, book and so on must be added to its content file so it appears in the index automatically. If a recommender is missing from the recommendations file, search cannot jump to that card.

## Behaviors to implement exactly
- **Durations are computed**, never typed. Each role stores `start` and `end` as `YYYY-MM` (`end` null means Present). Months count inclusively (start month through end month), like LinkedIn: for example Jun 2020 to Nov 2023 is 3 yrs 6 mos. Company totals are computed from the earliest start to the latest end (or today). The current Boeing role and Boeing total must keep counting up: compute client-side, or rebuild monthly with a scheduled GitHub Action. Do not leave a stale number. Ended roles may be static.
- **Contact me popup**: modal with focus trap, Escape and backdrop click to close, close button, `role="dialog"` `aria-modal="true"`, returns focus to the opener. Content order: LinkedIn (linkedin.com/in/stephencarras), then email with a Copy button (live-region confirmation), then "Usually within 1–2 business days." No resume row.
- **Email me**: the `mailto:` address is assembled at runtime (split string) with the subject "Hello Stephen". Click tries to open the visitor's mail app. If no mail app takes focus within about 2 seconds (no window blur, page still visible), open the contact popup so the visitor can copy the address. Inside an iframe, open the `mailto:` with `window.open`.
- **Looping carousels**: Recommendations, Trips & places and the photo gallery all loop endlessly. Render the cards once in HTML and add the two clone sets in JS (clones are `aria-hidden="true"` and their links and buttons get `tabindex="-1"`, so crawlers and screen readers see each item once). Start scrolled to the middle set. After scrolling stops (about 140ms), if the position leaves the middle set, jump by exactly one set width with scroll-snap temporarily off. Previous/next buttons scroll by one card (smooth, `auto` for reduced motion). Tracks are `role="region"` with an `aria-label`, keyboard focusable.
- **Photo gallery (Beyond work)**: two columns that wrap on narrow screens. Left: the 96px personal mark, heading "A little about me", a short paragraph (Stephen edits it). Right: the swipe track in the style of swiping photos in iMessage: scroll-snap (`x mandatory`, `start`), each slide 88% of the track width at 4:3 with 28px corners so the next photo peeks in, 14px gap, hidden scrollbar, "Swipe through" caption and round 44px previous/next buttons. Photos in order: driftwood sunset, Seattle skyline, beach silhouettes, snow-capped mountains, hilltop view toward Mount Rainier, Rainier close-up. Alt text describes the image only. No dots, autoplay or lightbox.
- Recommendation Read more / Show less: the quote's height animates between a clamp (5 lines) and its measured full height; the button has `aria-expanded`.
- Recommendations: no "Write a recommendation" button at launch.
- Beyond work: no placeholder links. A Spotify/Apple Music link is omitted until Stephen provides a public playlist URL (link out only, no embed).
- External links open in a new tab with `rel="noopener noreferrer"` and visually hidden "(opens in a new tab)" text.

## Accessibility (already built, keep)
Skip link, `<main>` landmark, one `h1`, ordered headings, `aria-expanded` on every toggle, `aria-live` on the copy button, `role="status"` on the search count, visible focus rings, 44px touch targets on mobile, WCAG AA contrast in both themes, reduced-motion support everywhere (see MOTION.md). Run an accessibility check (axe or Lighthouse) before launch.

## Sharing and first impression
Assets are in `site-assets/`: `og-image.png` (1200x630), `favicon.ico`, `favicon-32.png`, `favicon-48.png`, `apple-touch-icon.png`, `icon-192.png`, `icon-512.png`, `site.webmanifest`, `head-snippet.html`, `404.html`. `head-snippet.html` holds the full `<head>` (title "Stephen Carras | Strategy & Operations Leader", description, Open Graph and Twitter tags, icons, manifest, `color-scheme`, referrer policy, CSP). **The site URL is `https://stephencarras.com`, set once as `site` in `astro.config.mjs`; the canonical link, Open Graph URLs and the JSON-LD schema are built from it. Change that one line for a custom domain.** Open Graph title: "Stephen Carras | Turning ideas into execution". The 404 page matches the site. Do not use em dashes anywhere in site copy or metadata (Stephen asked for them to be removed); use commas, colons, periods or a pipe in titles. En dashes in date ranges are fine.

## Content rules
- Do not invent content. Anything missing is asked for, not filled in.
- Boeing is a current employer. Stephen confirmed with Boeing that the content as written (including the Kiro tool description and the numbers) is fine to publish. Keep wording exactly as in the design.
- Do not publish a home address or phone number. There is no resume download.
- Photos: strip EXIF/GPS at build time, resize (max about 1200px for gallery photos, 960px for cards, 640px for the headshot), `loading="lazy"` below the fold, meaningful alt text. Add width and height (or aspect-ratio) to every image to prevent layout shift. A blur or skeleton placeholder while images load is a good Astro-side improvement.
- Trip and gallery photos: Stephen confirmed he is okay with the current photos. Gallery images are only 480x360, so they look soft on large or high-density screens; use originals if he supplies them.
- Logos are trademarks of those companies; keep them small and used only to identify the employer.

## Privacy and consent (resolved)
- Resume PDF: not published, no download link. Phone number and Gmail address are not in the HTML as plain text; the email is built at runtime.
- Recommendations: all four people (Allen Khaligh, Kelsey Heick, Collin Long, Kevin Murphy) confirmed Stephen may publish their quote and photo.
- Boeing: Stephen confirmed external posting is fine.
- Gallery silhouettes photo: Stephen is comfortable with it.

## Security requirements (non-negotiable)
Repo and account
1. Passkey/2FA on the GitHub account. Recovery codes stored offline.
2. Branch protection on `main`: PR required, status checks required, no force-push, linear history.
3. Signed commits (SSH or GPG) and "require signed commits" on `main`.
4. Secret scanning + push protection enabled. Never commit `.env` files. Add a `.gitignore` first.
5. `SECURITY.md` with a reporting contact.

Supply chain
6. Commit the lockfile. `npm ci` in CI. Minimal dependencies, review every addition.
7. Dependabot for npm and GitHub Actions. CodeQL enabled.
8. All GitHub Actions pinned to full commit SHAs. Workflow `permissions:` least privilege (`contents: read`; `pages: write` and `id-token: write` only on the deploy job).
9. Deploy via the official GitHub Pages Actions flow, no long-lived token.

Site hardening
10. No third-party scripts, trackers, fonts, or embeds. No inline scripts or inline event handlers. (The design file uses inline styles and an inline script; move them to a stylesheet and an external script.)
11. Strict CSP via `<meta http-equiv="Content-Security-Policy">`: `default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; base-uri 'none'; form-action 'none'`. Meta CSP cannot cover `frame-ancestors`. Note: `mailto:` links and `window.location` to `mailto:` are not blocked by this policy.
12. External links `rel="noopener noreferrer"`. `<meta name="referrer" content="strict-origin-when-cross-origin">`.
13. HTTPS enforced in Pages settings. Add `/.well-known/security.txt`.
14. Lighthouse and accessibility check before launch.

## Known limitation to revisit
GitHub Pages cannot set custom response headers (HSTS preload, `frame-ancestors`, Permissions-Policy, COOP/COEP). For full header control later: Cloudflare in front, or Cloudflare Pages with the code still on GitHub. When adding a custom domain, verify it in GitHub account settings to prevent subdomain takeover and never leave dangling DNS records.

## Assets (all provided in this repo)
- `source-images/`: 25 images (hero headshot, personal mark, Seattle banner, 7 company logos, 4 recommender photos, 5 trip photos, 6 gallery photos) plus `image-manifest.json` (id, file, where used, alt text). Atlantian Labs has no logo; it uses the "AL" tile.
- `site-assets/`: sharing image, favicons, manifest, head snippet, 404 page.
- Still wanted from Stephen when he has them: a higher-resolution personal mark (original is about 288x360), originals of the 480x360 gallery photos, and a wider Seattle banner (about 1400px).

## Decisions made with Stephen (2026-11-21)
- Resume download removed from hero, Contact section, popup and search.
- "Stealth Startup" renamed "Atlantian Labs". "Constellation" renamed "Constellation Energy" everywhere.
- Undergraduate GPAs (3.8 and 3.4) removed. Graduate GPAs stay.
- Boeing Lead role stays "Auburn, Washington · On-site" on the site, even though his resume says Seattle, Hybrid (he will update the resume).
- Boeing bullet says VP briefings "reach Boeing's CIO, CEO, and Board" (his resume wording); the About paragraph says he briefs "VPs and Directors" monthly. Both stay.
- InductEV Strategic Advisor stays as a separate full-time role even though its dates overlap Senior Manager (Jan 2019 to Jun 2020).
- T-Mobile title is "Engineer, Cybersecurity | Strategy & Transformation Lead".
- InductEV Senior Manager: reports to the CEO, location Renton, Washington · Remote, paragraph says "formerly Momentum Dynamics".
- The "Apple simplicity" fun fact was tried and removed; it does not belong anywhere right now.

## Decisions made with Stephen (2026-11-25)
- Placement rule: Claude Code and Amazon Kiro are named only in Experience, "How I work" and Expertise & Tools. Personal hobbies (AI podcasts, biographies, trips, GitHub profile, Muse, Netflix) appear only in Beyond work. About names neither.
- InductEV Strategic Advisor and Senior Manager dates were re-checked and are correct; the overlap is real.
- Core competencies: Microsoft 365, Visio and Smartsheet removed (28 total). Salesforce stays. (Superseded 2026-11-25, see below.)
- Section renamed "Expertise & Tools" (anchor stays `#focus`) and split into Skills and Tools blocks, 52 items. Microsoft 365, Visio and Smartsheet are back in (Platforms & Infrastructure). In search, Skills-block items are kind "Skill" and Tools-block items are kind "Tool".

## Open items
- Domain name and whether the repo is public or private (not decided).
- Higher-resolution personal mark; use it as the favicon source once available.
- Optional: add resume context lines (for example "Supporting 737, 767, 777 & 787 programs", "acquired by Electreon") back to roles.
- Optional: an outcome metric for the "Simplify until it's obvious" card.
- Optional: a force-directed "through-line" career graph (proposal only: about 25 to 30 nodes, five capability hubs, companies on a time axis, list fallback on phones, no CDN). Stephen has not decided whether to build it or whether the panel should be dark.
- Optional: one-page printable resume view.
- Spotify or Apple Music public playlist link, and a third "Ask me about" bullet (both omitted for now).
- Known small nits: FTSE Russell and Atlantian Labs each have a paragraph that nearly repeats their single bullet(s); the T-Mobile skills line is still security-heavy while the bullets are strategy-focused.
- Test on a real device: carousel loops, Email me fallback, system dark default.

## Definition of done
- `npm ci && npm run build` succeeds.
- Deployed via GitHub Actions to Pages.
- Visual match to `design/Main.dc.html` in light and dark at 1440px and 390px widths.
- Durations match the computed values; search, popup, carousels and all toggles are keyboard-accessible; no console errors under the strict CSP.
- All security items checked off in `SECURITY-CHECKLIST.md` in the repo.
