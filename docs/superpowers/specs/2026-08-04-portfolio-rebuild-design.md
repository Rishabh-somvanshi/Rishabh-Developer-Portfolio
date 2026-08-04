# Portfolio Rebuild — Design

**Date:** 2026-08-04
**Owner:** Rishabh Somvanshi
**Live site:** https://rishabh-somvanshi-developer.netlify.app/
**Netlify site id:** `2d5eec84-5d58-4732-bcc9-95bc43b2a749`

## Problem

The portfolio is used as a link in live job applications. Two complaints: it is
laggy, and it has UI/UX problems. Investigation of the deployed site found a
third, larger problem underneath both.

### Finding 1 — the site already contains a fast, recruiter-first view

The app ships two view modes. The default is a scroll-driven space narrative
("the voyage"). The second is a conventional résumé dossier ("classic"),
reachable at `/#overview`.

Measured on a cold load at 1280×720:

| Metric | Voyage (default) | Classic (`#overview`) |
| --- | ---: | ---: |
| Infinite CSS animations | 15 | 0 |
| Elements with `filter: blur()` | 13 | 0 |
| Elements with `backdrop-filter` | 1 | 0 |
| DOM nodes | 637 | 436 |
| Scroll height | 12,923 px | 6,606 px |

All measured lag is attributable to the voyage view. The classic view is already
fast and already leads with role, tenure, clients, résumé, and email.

The classic view's only entry point is a button reading "Prefer the dossier?
Open the classic view →" positioned at the bottom of 12,923 px of narrative.
The mode is not persisted (`localStorage` is empty on the deployed site).
In practice no recruiter reaches it.

### Finding 2 — specific causes of lag in the voyage view

- 15 permanently-running infinite animations, including `spin` on a 380 px
  `pulsar-beam` and `nova-rays`, `aura-pulse` on a 230 px SVG circle,
  4× `meteor-pulse`, 4× `floaty` on 261 px blocks. These run whether or not the
  element is on screen.
- 13 elements with `filter: blur()`, several large and simultaneously animated:
  `pulsar-beam` (380×380, blur 3px + spin), `earth-sunrise` (896×128, blur 2px),
  3× `reentry-stat` (blur 8px). Animating a blurred element forces a full
  repaint of its area every frame. This is the most expensive pattern present.
- framer-motion `MotionValue`s driving 48 inline transforms and 41 inline
  opacities across a 12,923 px document.
- `backdrop-filter: blur(10px)` on the skip button.
- 1 `<canvas>`, 16 `<svg>`.

The two hand-written scroll listeners are **not** a problem — both are passive
and rAF-throttled, and set only a boolean or an index. The cost is paint and
compositing, not JavaScript.

### Finding 3 — the source code no longer exists

- Netlify reports the production deploy (2026-07-15) as `deploy_source: "drop"`,
  `manual_deploy: true`, `has_source_zip: false`, with no commit, branch, or
  linked repository. It was a drag-and-drop of a built `dist/`.
- Sourcemaps return 404; the bundle contains no `sourceMappingURL`.
- The GitHub account `Rishabh-somvanshi` has no portfolio repository; its newest
  push is from 2024.
- Full sweeps of `D:\` and the user profile found no matching Vite project.
  `D:\Resumes\Rishabh\Portfolio` is the *older* Naruto-themed single-file site,
  byte-identical to what `rishabh-somvanshi-dev.netlify.app` serves.

Recoverable from the deployed artefacts: all copy, the complete design-token
system, fonts, colours, section structure, and both view modes. The minified
bundle is not worth reverse-engineering component-by-component.

## Goals

1. The landing view is the recruiter dossier, and it is fast.
2. The voyage is preserved, made smooth, and entered only by explicit choice.
3. The source lives in git and is never lost again.
4. The production URL never breaks, because it is in live applications.

## Non-goals

- Rewriting résumé copy or claims. Content is carried over as-is.
- Changing the visual identity. The existing token system is kept.
- Adding a backend, CMS, or analytics.
- Cleaning up the user's GitHub profile (noted as a separate concern).

## Approach

Rebuild as a fresh Vite + React + TypeScript project in `D:\Portfolio`, faithful
to the current design, with the view-mode defaults inverted.

### Routing and view modes

- `/` renders the **dossier** (current classic view). This is the default.
- The voyage is opt-in via an explicit control in the dossier hero
  ("Take the voyage →").
- `/#overview` continues to resolve to the dossier, so links already pasted into
  applications keep working.
- `/#voyage` deep-links straight into the voyage.
- The chosen mode persists in `localStorage` and is restored on next visit.
  An explicit hash in the URL always wins over the stored preference, so a
  pasted `#overview` link opens the dossier regardless of prior state.
- Deep links to dossier sections (`#experience`, `#work`, `#skills`,
  `#contact`) work on cold load.

### Content inventory (carried over verbatim)

- **Hero** — eyebrow "Senior Frontend Engineer · React"; name; the 6.5+ years
  summary naming UnitedHealth Group, Albertsons, Fiserv, Estée Lauder; résumé
  download; email; current-role line (Senior Developer @ Accenture —
  UnitedHealth Group (Optum) · Noida, India).
- **Stats** — 6.5+ years of React; 4 Fortune 500 clients; 3 awards in 6 months.
- **Experience** — four roles, each with dates, duration, title, company ·
  client, bullets, and tech chips:
  - Senior Developer, Accenture · UnitedHealth Group — Optum · Curo
    (May 2024 — Present)
  - Application Developer, TCS · Albertsons (Jul 2023 — May 2024), incl. the
    three client awards
  - Technology Analyst, Infosys · Fiserv (Nov 2021 — Jun 2023)
  - Senior Systems Engineer, Infosys · Estée Lauder (Dec 2019 — Nov 2021)
- **Projects** — Wedding Command Centre
  (https://wedding-commander.netlify.app/); Expense Tracker
  (https://expense-tracker-monumental.netlify.app/).
- **Skills** — Core Frontend; UI Systems; Integration & Security;
  Tools & Practices.
- **Education** — SRM University 2015–2019, B.Tech, 84.44%, DSA, C/Python,
  5★ HackerRank.
- **Contact** — rishabhsomvanshi@gmail.com; résumé;
  linkedin.com/in/rishabh-somvanshi-149103135;
  github.com/Rishabh-somvanshi.
- **Voyage** — ten scenes retained: launch, curo, mercantile, vault, porcelain,
  origins, stars, singularity, reentry, home, with their existing narrative copy.

### Design tokens (carried over)

Fonts: Inter (body), Space Grotesk (display), JetBrains Mono (mono).
Core colours: `--bg: #0a0a0b`, `--surface: #111113`, `--surface-2: #18181b`,
`--text: #ededef`, `--text-2: #a7a7ae`, `--text-3: #82828b`,
`--accent: #e8942a`, `--accent-bright: #f5a93d`,
`--accent-dim: rgba(232,148,42,.13)`, `--border: rgba(255,255,255,.08)`,
`--border-strong: rgba(255,255,255,.16)`.
Layout: `--container: 68rem`, `--radius: 8px`, `--radius-lg: 12px`,
`--ease: cubic-bezier(.21,.47,.32,.98)`, the `--s1`…`--s16` spacing scale, and
the `--fs-*` type scale including `--fs-hero: clamp(2.875rem, 1.6rem + 6.4vw, 5.5rem)`.

### Performance work (voyage)

- Replace animated `filter: blur()` with pre-baked radial-gradient or SVG
  assets. Nothing that is blurred may also be animated.
- Gate every scene's animations behind `IntersectionObserver`; off-screen scenes
  run nothing.
- Apply `content-visibility: auto` with `contain-intrinsic-size` to off-screen
  scenes.
- Restrict animation to `transform` and `opacity` only.
- Replace `backdrop-filter` with a solid or alpha background.
- Full `prefers-reduced-motion: reduce` coverage across every animation.
- A reduced-effects tier for small viewports and low
  `navigator.hardwareConcurrency` / `deviceMemory`.

### Acceptance criteria

- Dossier at `/`: zero infinite animations, zero `filter: blur()`, zero
  `backdrop-filter` — matching what the current classic view already achieves.
- Voyage: no frame longer than 34 ms during a scripted full-page scroll on a
  1280×720 viewport; zero animations running while scrolled past a scene.
- `prefers-reduced-motion: reduce` disables all non-essential motion in both views.
- All links resolve 200: résumé PDF, both project sites, LinkedIn, GitHub, mailto.
- OG/Twitter meta and `og.png` preserved so shared links keep their preview card.
- Keyboard reachable: résumé and contact from the first screen without scrolling.

## Backup strategy

Three layers. The production URL is not touched until the rebuild is approved.

1. **Netlify deploy permalink** — the current build is permanently frozen at
   `https://6a579a0ae8a9feae7900273f--rishabh-somvanshi-developer.netlify.app`.
   Netlify does not overwrite deploy permalinks.
2. **In-repo mirror** — the deployed output (`index.html`, both assets, `og.png`,
   `favicon.svg`, résumé PDF) is committed at `backup/live-2026-07-15/`.
3. **Preview-first deploys** — the rebuild publishes to a Netlify preview URL.
   Production is updated only on explicit approval.

## Interim mitigation

Available immediately, no deploy required: use
`https://rishabh-somvanshi-developer.netlify.app/#overview` in job applications.
It cold-loads the fast dossier view. The OG preview card is unaffected, because
the meta tags are static in `index.html`.

## Risks

- **Visual fidelity drift.** The rebuild is reconstructed from the rendered DOM
  and minified CSS, not original source. Mitigated by the committed mirror for
  side-by-side comparison.
- **Production URL breakage.** Mitigated by preview-first deploys and by keeping
  `#overview` resolving to the dossier.
- **GitHub push requires credentials.** The `gh` CLI is not installed and no
  git remote is configured; publishing the repo needs the user's action.
- **Frame-timing verification needs a visible browser.** `requestAnimationFrame`
  does not run while the automation browser pane is hidden, so the 34 ms frame
  criterion cannot be measured headlessly. Verification runs against a local
  dev server with the pane displayed; the structural criteria (animation count,
  blur count, node count, scroll height) are measurable either way and act as
  the primary gate.
