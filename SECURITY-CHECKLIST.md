# Security checklist

Tracks the "Security requirements (non-negotiable)" in CLAUDE.md. **[x]** = done and
in the repo. **[ ]** = a GitHub account or repository setting only Stephen can change
(nothing in the code can do it). Tick them off as they're done.

## Repo and account

- [ ] **1. Passkey/2FA on the GitHub account; recovery codes stored offline.**
      github.com → Settings → Password and authentication.
- [ ] **2. Branch protection on `main`.** Repo → Settings → Rules → Rulesets → New branch
      ruleset, target `main`, and turn on:
  - Restrict deletions
  - Require linear history
  - Require a pull request before merging
  - Require status checks to pass: add **Build and check** (from
    `.github/workflows/deploy.yml`) and the two **CodeQL** checks once they have run once
  - Block force pushes
  - Require signed commits (item 3)
- [ ] **3. Signed commits.** Set up an SSH signing key locally
      (`git config --global gpg.format ssh`, `user.signingkey`, `commit.gpgsign true`), add
      the same key on GitHub as a *Signing key*, and keep "Require signed commits" in the
      ruleset. The commits on the build branches so far are unsigned; squash-merging them
      through a PR on GitHub produces a signed (GitHub-verified) commit on `main`.
- [ ] **4. Secret scanning and push protection.** Repo → Settings → Advanced Security
      (or "Code security"): enable Secret scanning and Push protection.
  - [x] `.gitignore` excludes `.env`, `.env.*`, `node_modules`, `dist`, `.astro`, and
        `.claude/settings.local.json`
- [x] **5. `SECURITY.md`** with a reporting contact (GitHub private vulnerability reporting).
  - [ ] Turn the form on: Repo → Settings → Advanced Security → **Private vulnerability
        reporting → Enable**. This needs the repo to be **public**.

## Supply chain

- [x] **6. Lockfile committed; `npm ci` in CI; minimal dependencies.** Two runtime
      dependencies (`astro`, `sharp`) at exact versions. CI runs
      `npm ci --ignore-scripts`, and `.npmrc` sets `ignore-scripts=true` locally too, so no
      dependency can run an install script. CI also runs `npm audit --omit=dev --audit-level=high`.
- [x] **7. Dependabot** for npm and GitHub Actions (`.github/dependabot.yml`, weekly, with
      a 7-day cooldown on brand-new releases). **CodeQL** (`.github/workflows/codeql.yml`,
      JavaScript/TypeScript and Actions, `security-extended` queries).
  - [ ] Enable Dependabot alerts and security updates: Repo → Settings → Advanced Security.
- [x] **8. Actions pinned to full commit SHAs**, release noted in a comment. Workflow
      `permissions: {}` at the top; the build job gets `contents: read`, the deploy job only
      `pages: write` and `id-token: write`, CodeQL only `contents: read` and
      `security-events: write`. Checkout uses `persist-credentials: false`.
- [x] **9. Official Pages Actions flow** (`upload-pages-artifact` → `deploy-pages`), OIDC,
      no long-lived token.
  - [ ] Repo → Settings → Pages → Build and deployment → Source: **GitHub Actions**.
  - [ ] Repo → Settings → Environments → `github-pages` → Deployment branches: **main only**.

## Site hardening (verified on every build by `npm run check:dist`)

- [x] **10. No third-party scripts, trackers, fonts or embeds; no inline scripts, styles
      or event handlers.** One external script bundle, one blocking `/theme.js`, external
      stylesheets. JSON-LD and the search index are non-executable data blocks.
- [x] **11. Strict CSP meta** on every page:
      `default-src 'self'; img-src 'self' data:; style-src 'self'; script-src 'self'; base-uri 'none'; form-action 'none'`.
      Verified in Chrome: no violations on any page or interaction.
- [x] **12. External links** use `rel="noopener noreferrer"` with "(opens in a new tab)"
      text; `<meta name="referrer" content="strict-origin-when-cross-origin">`.
- [x] **13. `/.well-known/security.txt`** (RFC 9116), generated at build time; `Expires` is
      180 days out and the monthly scheduled rebuild keeps it fresh.
  - [ ] Repo → Settings → Pages → **Enforce HTTPS** (available once the first deploy is live).
- [x] **14. Lighthouse and accessibility check before launch** (2026-11-22, local build).
      Lighthouse 100/100/100/100 (performance, accessibility, best practices, SEO) on mobile
      and desktop; the 404 page scores 100/100/100 and SEO 63 only because it is
      deliberately `noindex`. axe-core 4.14: no violations in light and dark, at 1440px
      and 390px, with everything expanded, and with search and the contact popup open.
  - [ ] Re-run Lighthouse against the live URL after the first deploy.

Also checked by `check:dist`: images carry no EXIF/GPS/XMP, no unreferenced originals in
`dist/_astro`, no plain-text email address, no `YOUR-DOMAIN` placeholder, a valid search
index whose targets all exist.

## Known limitation (from CLAUDE.md)

GitHub Pages can't set response headers, so there is no HSTS preload, `frame-ancestors`
(clickjacking protection), Permissions-Policy or COOP/COEP. A meta CSP cannot cover
`frame-ancestors`. Revisit with Cloudflare in front (or Cloudflare Pages) when the custom
domain is chosen. When adding the domain, verify it in GitHub account settings first (to
prevent subdomain takeover) and never leave dangling DNS records.
