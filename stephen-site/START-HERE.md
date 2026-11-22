# START HERE: from this folder to a live site on GitHub

Written for Stephen on 2026-11-21. Follow the parts in order. Every step says what to do and how you know it worked. Anything in `<angle brackets>` is something you fill in.

**What is in this folder**

| Path | What it is |
|---|---|
| `CLAUDE.md` | The full build spec. Claude Code reads this file automatically when you open it in this folder. |
| `MOTION.md` | The animation spec (companion to CLAUDE.md). |
| `design/Main.dc.html` | The finished design. Open it in a browser to see the site; Claude Code copies text and styling from it. |
| `source-images/` | All 25 images, plus `image-manifest.json` (which image is used where, with alt text). |
| `site-assets/` | Share preview image, favicons, web manifest, `<head>` snippet, 404 page. |

Live preview of the design: https://claude.ai/artifact/EYd7mipGDavQYu92LniX6i

---

## Part 1. Install the tools (one time, about 15 minutes)

1. **Git.** In a terminal run `git --version`. If it prints a version, skip. Otherwise install from https://git-scm.com/downloads.
2. **Node.js (current LTS, version 20 or newer).** Run `node --version`. If it is older than 20 or missing, install the LTS from https://nodejs.org.
3. **Claude Code.** Follow the install instructions at https://docs.claude.com/en/docs/claude-code/overview, then run `claude --version` to confirm. Sign in with your Claude account the first time you run `claude`.
4. **GitHub account hardening (do this before creating anything).**
   - GitHub, top-right profile photo, Settings, "Password and authentication".
   - Add a **passkey** (or an authenticator app) as two-factor authentication.
   - Download the **recovery codes** and store them offline (printed or on a drive that is not your laptop). If you lose both your device and these codes you can lose the account.
   - Optional but recommended: a second passkey or hardware key as a backup.

**How you know it worked:** `git --version`, `node --version` and `claude --version` all print a version, and your GitHub account shows 2FA enabled.

---

## Part 2. Decide two things and create the repository

**Decision 1: the repository name (this sets your web address).**
- Recommended: name the repo exactly `<your-github-username>.github.io`. Your site then lives at `https://<your-github-username>.github.io/` with a clean address.
- If you name it anything else (for example `personal-website`), the address becomes `https://<your-github-username>.github.io/personal-website/`, and the site must be built with a `base` path. That works but is more fragile. Pick the first option unless you already use that name.

**Decision 2: public or private.**
- Recommended: **public**. GitHub Pages is free for public repositories. Private repos need a paid GitHub plan to publish Pages. Nothing sensitive is in this repo (no phone number, no resume, no secrets; the email is assembled at runtime), and the security spec assumes a public repo with secret scanning on.
- Because the repo is public, never commit passwords, API keys or `.env` files. Part 5 turns on a safety net that blocks accidental pushes of secrets.

**Create the repo**
1. github.com, "+" top right, "New repository".
2. Name: from Decision 1. Visibility: from Decision 2.
3. Tick "Add a README file" off (leave the repo empty is also fine) and choose the **Node** `.gitignore` template if offered. License: your choice (MIT is common; "none" is also fine for a personal site).
4. Click "Create repository".

**Clone it to your computer**
```bash
cd ~/Documents            # or wherever you keep projects
git clone git@github.com:<your-github-username>/<repo-name>.git
```
If `git@github.com` asks for a key you have not set up, use the HTTPS URL GitHub shows under the green "Code" button instead. Part 5 sets up an SSH key properly.

---

## Part 3. Put this folder into the repo

1. Unzip `stephen-site-handoff.zip`. Inside is a folder called `stephen-site`.
2. Copy **everything inside** `stephen-site` (not the folder itself) into your cloned repo folder. You should now see `CLAUDE.md`, `MOTION.md`, `START-HERE.md`, `design/`, `source-images/` and `site-assets/` at the top level of the repo.
3. Commit the starting point:
```bash
cd <repo-name>
git add .
git commit -m "Add design, assets and build spec"
git push origin main
```

**How you know it worked:** on github.com, your repo shows those folders.

---

## Part 4. Build the site with Claude Code

1. In a terminal, `cd` into the repo folder and run `claude`.
2. Claude Code reads `CLAUDE.md` on its own. Start in **plan mode** (press Shift+Tab until it says plan mode, or type `/plan`) so it shows you a plan before changing files.
3. Paste this as your first message:

```text
Read CLAUDE.md and MOTION.md in full, then open design/Main.dc.html and source-images/image-manifest.json.

Goal: rebuild the design in design/Main.dc.html as an Astro static site that follows CLAUDE.md exactly, deployable to GitHub Pages.

Rules:
- Copy all text verbatim from the design. Do not rewrite, add or remove content. If something is missing or unclear, ask me before inventing anything.
- Move the content into structured data files (roles, education, recommendations, trips, gallery, competencies, results, how I work) and generate pages and the search index from them.
- The strict CSP in CLAUDE.md forbids inline scripts, inline event handlers and inline styles in the final output. Use one external script file and a stylesheet. Configure Astro so nothing gets inlined (for example build.inlineStylesheets set to 'never' and vite.build.assetsInlineLimit set to 0) and verify in the built HTML.
- Use only the images in source-images/. Resize and strip EXIF at build time as the spec says.
- Work in the phases below. After each phase, run the build, tell me what you verified, and wait for my OK before the next phase. Work on a branch, not main.

Phases:
1. Scaffold Astro, content data files, base layout, the head from site-assets/head-snippet.html (leave the YOUR-DOMAIN placeholder), tokens and light/dark theme with no flash.
2. All sections and styling, matching the design at 1440px and 390px, light and dark.
3. Interactions: Contact popup, Email me with fallback, About and role expand/collapse, recommendation read more, looping carousels, copy-email button.
4. Search overlay with the build-time index.
5. Motion per MOTION.md, including reduced-motion and print.
6. Security and deployment: CSP, SECURITY.md, security.txt, SECURITY-CHECKLIST.md, .gitignore, Dependabot, CodeQL, and a GitHub Pages deploy workflow with actions pinned to full commit SHAs and least-privilege permissions.
7. QA: accessibility check, Lighthouse, keyboard walkthrough, console clean under the CSP.

Start by showing me your plan for phase 1 and listing any questions.
```

4. Review each phase. After a phase, open the dev server it starts (usually `http://localhost:4321`) and compare it with the design file side by side. Say what is different; Claude Code fixes it.
5. When a phase is good, ask Claude Code to commit and open a pull request. Merge it on GitHub (Part 5 sets up the rules that apply).

**Tips**
- If a response feels off from the design, say "compare to design/Main.dc.html" and name the section.
- Keep Claude Code on a branch (for example `build/phase-1`). Never let it push straight to `main` once protection is on.
- If it asks a question about content, answer from `CLAUDE.md` ("Decisions made with Stephen"). If the answer is not there, tell it to leave the design's version as is.

---

## Part 5. GitHub settings (security checklist)

Do these once the repo exists. Menu names can shift slightly; look for the closest match.

**5.1 SSH signing key (signed commits)**
```bash
ssh-keygen -t ed25519 -C "<your email>" -f ~/.ssh/id_ed25519_signing
git config --global gpg.format ssh
git config --global user.signingkey ~/.ssh/id_ed25519_signing.pub
git config --global commit.gpgsign true
```
Then GitHub, Settings, "SSH and GPG keys", "New SSH key", Key type **Signing Key**, paste the contents of `~/.ssh/id_ed25519_signing.pub`. (Add the same key again as an **Authentication Key** if you also want to push over SSH.) Commit once; on GitHub the commit should show a "Verified" badge.

**5.2 Turn on Pages**
Repo, Settings, Pages, Build and deployment, Source: **GitHub Actions**. (Do not choose "Deploy from a branch".) After Claude Code's workflow runs, the same page shows your live address. Tick **Enforce HTTPS**.

**5.3 Branch protection on `main`**
Repo, Settings, Rules, Rulesets (or Branches, "Add branch protection rule"). Target `main` and turn on:
- Require a pull request before merging. Because you are the only developer, set required approvals to **0** (you cannot approve your own PR).
- Require status checks to pass (add the build check once the workflow has run once).
- Require signed commits.
- Require linear history.
- Block force pushes and block deletions.

**5.4 Secret scanning and Dependabot**
Repo, Settings, "Code security" (or "Advanced Security"):
- Enable **Secret scanning** and **Push protection**.
- Enable **Dependabot alerts** and **Dependabot security updates**.
- Enable **Code scanning** with CodeQL ("default setup" is fine).
Claude Code adds the `dependabot.yml` file for version updates in phase 6.

**5.5 Reporting contact**
Claude Code creates `SECURITY.md` and `/.well-known/security.txt`. When it asks for a contact, give it the email you want people to use, or tell it to use GitHub's private vulnerability reporting (Settings, "Code security", "Private vulnerability reporting", enable).

---

## Part 6. Before you announce it: final checks

Do these on the live address after the first deploy.

1. **Open it on your phone**, in light and dark mode (phone settings, Display). Scroll everything.
2. **Carousels loop:** swipe the recommendations, the trips and the photo gallery past the last card. You should arrive back at the first.
3. **Email me:** click it. Your mail app should open with a draft to you and the subject "Hello Stephen". With no mail app, the contact popup should appear so you can copy the address.
4. **Search:** press ⌘K (Ctrl+K on Windows) or `/`. Try "Boeing", "Collin", "Atlantian", "Tableau". Searching a recommender's name should open that card.
5. **Keyboard only:** press Tab through the whole page. A visible ring should follow you, the popup and search should trap focus, Esc should close them.
6. **Durations:** check the Boeing role says 3+ months and counts forward each month; compare older roles with the design.
7. **Console:** open the browser developer tools, Console tab. There should be no red errors (a CSP violation would show here).
8. **Lighthouse:** in Chrome developer tools, Lighthouse tab, run for mobile. Aim for 90+ in Performance, Accessibility, Best Practices and SEO.
9. **Share preview:** paste the live address into LinkedIn's Post Inspector (https://www.linkedin.com/post-inspector/) and check the image and title. If it shows an old or missing image, click "Inspect" again to refresh.
10. **Replace the placeholder:** search the repo for `YOUR-DOMAIN` and replace it with the real address (it appears in the share-preview and canonical tags). Commit, push, and re-run step 9.

---

## Part 7. Custom domain (later, optional)

1. Buy the domain from a registrar.
2. **Before** pointing DNS at GitHub: GitHub, Settings, "Pages" (account level, not the repo), "Add a domain", and complete the TXT-record verification. This stops anyone else from claiming your domain on GitHub.
3. Repo, Settings, Pages, "Custom domain": enter it, save, then tick Enforce HTTPS once the certificate is ready.
4. Add the DNS records GitHub lists (A records for an apex domain, or a CNAME for `www`).
5. Never leave a DNS record pointing at GitHub Pages after you stop using a domain; that is how subdomain takeovers happen.
6. Update `YOUR-DOMAIN` (Part 6, step 10) to the new domain.

GitHub Pages cannot set some security headers (HSTS preload, frame-ancestors, Permissions-Policy). If you want those later, put Cloudflare in front or host on Cloudflare Pages with the code still on GitHub. `CLAUDE.md` has the details.

---

## Part 8. Keeping the site up to date

- **Edit content** in the data files Claude Code created (roles, recommendations, and so on), not in the page templates. Ask Claude Code to make the change and open a PR; the search index updates automatically from the same files.
- **New recommendation:** add it to the recommendations data file (including its photo in `source-images/`). If you skip the data file, search will not find it.
- **New role or job change:** add the role with `start` and `end` as `YYYY-MM` (`end` empty for current). Durations compute themselves.
- **Monthly counters:** the current role's duration must keep counting. Either it is computed in the browser, or the repo has a scheduled monthly rebuild; ask Claude Code which it used.
- **Dependency updates:** Dependabot opens pull requests. Skim them, let the build check pass, then merge.
- **No resume download:** by design. If you ever add one, publish a version without your phone number.

---

## Part 9. If something goes wrong

| Symptom | Likely cause and fix |
|---|---|
| Site shows a blank page or no styles on GitHub Pages | The repo name does not match the `<username>.github.io` pattern and the `base` path is not set. Tell Claude Code the live address and ask it to fix the Astro `base` setting. |
| Console shows "Refused to execute inline script" | Something is still inlined, which the CSP blocks. Ask Claude Code to find inline scripts or styles in the built HTML (`dist/`) and move them to external files. |
| Theme flashes white before turning dark | The theme script must be an external, blocking script in `<head>` that sets the theme before first paint. |
| `git push` rejected | Branch protection is working. Push a branch and open a pull request instead. |
| Commits show "Unverified" | The signing key is not added as a **Signing Key** in GitHub, or `commit.gpgsign` is off. Redo 5.1. |
| Workflow fails with a permissions error | The deploy job needs `pages: write` and `id-token: write` (only that job). Ask Claude Code to check the workflow permissions. |
| Share preview is stale | LinkedIn caches previews. Re-run the Post Inspector. |
| Claude Code starts rewriting your wording | Stop it and say: "Copy text verbatim from design/Main.dc.html. Do not edit content." |

---

## What is still open (from `CLAUDE.md`)

- Domain name; public vs private repo (Part 2 recommends public).
- A higher-resolution personal mark (the file is about 288x360) and originals of the 480x360 gallery photos.
- Optional: the career "through-line" graph, an outcome number for the Kiro card, a one-page printable version.
- Your resume still says Seattle (Hybrid) for the current Boeing role; the site says Auburn (On-site). Update the resume to match.
