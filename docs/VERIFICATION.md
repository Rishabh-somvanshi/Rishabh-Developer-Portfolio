# Human verification checklist (Task 11)

This branch (`feat/perf-and-ux`) was built and reviewed in an environment
whose browser automation pane cannot composite frames — `window.innerHeight`
reports `0`, `requestAnimationFrame` never fires, and screenshots time out.
Every check below that needs a live, rendered, scrolling page could **not**
be run automatically and must be done by a human before this branch is
merged/deployed.

Everything that *could* be checked without a browser was automated in
`scripts/audit-static.mjs` (run via `npm run audit`) — see
`.superpowers/sdd/task-11-report.md` for that output. This document only
covers what's left.

Run `npm run dev` and keep it open for most of these; a couple call for
`npm run build && npm run preview` instead (noted where it matters).

---

## 0. Dossier checks (recruiter-facing view — check this first)

The dossier (`mode: 'work'`) is now the default, and its URL is already in
submitted job applications — a regression here is worse than anything in the
voyage. `src/lib/viewMode.js` and `src/App.jsx:56-72` are the code driving
this; `src/lib/__tests__/viewMode.test.js` and `src/__tests__/App.test.jsx`
cover the pure logic and the deep-link scroll effect under jsdom, but the
actual rendered behaviour — what a recruiter clicking a link from an
application actually sees — has not been visually confirmed.

For each row: clear site data (or use a fresh private window) before the
"cold" loads so `localStorage` starts empty.

| # | Steps | Expected |
|---|---|---|
| 0a | Clear `localStorage`. Load `/` | Dossier renders (Hero → Experience → Case Studies → Skills → Contact) |
| 0b | Clear `localStorage`. Load `/#experience` | Dossier renders, scrolled to the Experience section |
| 0c | Clear `localStorage`. Load `/#work` | Dossier renders, scrolled to the Case Studies (`#work`) section |
| 0d | Clear `localStorage`. Load `/#skills` | Dossier renders, scrolled to the Skills section |
| 0e | Clear `localStorage`. Load `/#contact` | Dossier renders, scrolled to the Contact section |
| 0f | Clear `localStorage`. Load `/#voyage` | Voyage renders (not the dossier) |
| 0g | From the dossier, click "Take the voyage" to enter the voyage, then reload bare `/` | Voyage renders again — the choice is remembered via `localStorage` |
| 0h | From the voyage, exit back to the dossier (skip link or exit control), then reload bare `/` | Dossier renders, and the address bar reads `#overview` |
| 0i | On the dossier, press Tab repeatedly until the "Take the voyage" control in the hero receives focus | A visible focus ring appears on the control |
| 0j | With "Take the voyage" focused, press Enter | The voyage opens, same as a click |

If any of 0a–0h show the wrong view, stop — do not deploy — this is the
exact regression this branch's default-mode flip could introduce.

---

## 1. DevTools acceptance-criteria audit (`scripts/audit.js`)

`scripts/audit.js` is a console snippet, not a Node script — paste its
contents into the DevTools console on a **built preview**, not `npm run dev`
(dev-mode React/HMR can leave extra nodes around that skew the counts).

```bash
cd /d/Portfolio && npm run build && npm run preview
```

### 1a. Dossier — `http://localhost:4173/`

Load the page, open DevTools console, paste in `scripts/audit.js`, read the
`console.table` output.

**Expected:**
| field | expected |
|---|---|
| `infiniteAnimations` | `0` |
| `blurredElements` | `0` |
| `backdropFilters` | `0` |

### 1b. Voyage — `http://localhost:4173/#voyage`

Reload at that URL (a hash-only navigation from `/` may not remount the
mode — do a full reload), paste the same snippet again.

**Expected:**
| field | expected |
|---|---|
| `blurredAndAnimated` | `0` |
| `backdropFilters` | `0` |
| `infiniteAnimations` | non-zero — **this is correct**, the voyage is meant to move. What matters is that scenes scrolled off-screen are parked (`scn-parked`, verified statically in Task 6) so they stop costing paint, not that the count is zero. |

If any of the "must be 0" fields come back non-zero, stop — do not deploy —
and diff against `git log` on `src/styles/journey.css` for what introduced
it. `scripts/audit-static.mjs` already checks the *built CSS* for the same
blur/backdrop-filter conditions and passed as of this report, so a non-zero
result here would most likely mean a component is setting `filter`/
`backdrop-filter` inline via a `style` prop rather than through the
stylesheet — check `.jsx` files, not just CSS.

---

## 2. Frame-timing measurement

With `/#voyage` loaded and the **window visible and focused** (`rAF` does
not run in a hidden/background tab), paste into the console:

```js
;(() =>
  new Promise((res) => {
    let frames = 0, long = 0, worst = 0, y = 0, last = performance.now()
    const start = last
    const step = () => {
      const now = performance.now()
      const d = now - last
      last = now
      frames++
      if (d > 34) long++
      if (d > worst) worst = d
      y += 26
      window.scrollTo(0, y)
      if (now - start < 6000 && y < document.body.scrollHeight) requestAnimationFrame(step)
      else res({ fps: +(frames / ((now - start) / 1000)).toFixed(1), framesOver34ms: long, worstFrameMs: Math.round(worst) })
    }
    requestAnimationFrame(step)
  }))()
```

**Expected per the spec:** `framesOver34ms: 0` (34ms ≈ dropping below 30fps
for a single frame).

Record the actual `fps` / `framesOver34ms` / `worstFrameMs`. If any frames
exceed 34ms, note which scene was on screen at that point in the 6-second
auto-scroll (dossier intro → pulsar → singularity → outro, roughly in that
order) before deciding whether to deploy — the singularity scene is the
most likely offender since it stacks the most layers (`bh-disk`, `bh-photon`,
`bh-core`, `bh-arc`, `bh-lens`, plus the `.voyage-atmosphere` overlay).

---

## 3. Scroll-damping feel check

`src/journey/hooks.js` drives every pinned scene's scroll progress through a
spring (`useGlide`), controlled by the `GLIDE` constant:

```js
const GLIDE = { stiffness: 42, damping: 22, mass: 1.1, restDelta: 0.0005 }
```

1. `npm run dev`, open `http://localhost:5173/#voyage`.
2. Scroll with a mouse wheel in short bursts (a few notches, then stop).
3. **Expected feel:** planets/cards keep drifting into their final position
   for a beat *after* the wheel stops — that's the spring settling. It
   should feel like a ship with mass, not 1:1 with the wheel, and it should
   **not** overshoot/bounce past the resting point.
4. **If it feels sluggish or laggy** (takes too long to start responding):
   raise `stiffness` toward `55` in `src/journey/hooks.js`. Higher stiffness
   = faster catch-up to the scroll target.
5. **If it wobbles or overshoots** (visibly bounces past the resting point
   before settling): raise `damping` above `22`. The intent is *no visible
   overshoot* — a bounce means damping is too low relative to
   stiffness/mass.
6. Also try touch/coarse-pointer scrolling if you have a touchscreen or
   trackpad available — this was only manually verified with a mouse wheel
   in prior task work.

---

## 4. Reduced-motion check

1. In Chrome DevTools: `Cmd/Ctrl+Shift+P` → "Rendering" → check *Emulate CSS
   media feature prefers-reduced-motion* → `reduce`.
2. Reload `http://localhost:5173/#voyage` (a fresh load, not just a toggle
   mid-scroll, since some state is read at mount).
3. **Expected:** nothing animates — no spin (pulsar beam, accretion disk),
   no float, no ping/pulse, no parallax drift from the scroll spring
   (progress should track the scroll exactly, no lag). The starfield should
   render a single static frame, not continuous motion.
4. This is driven by the wildcard rule in `src/styles/journey.css`:
   ```css
   @media (prefers-reduced-motion: reduce) {
     *, *::before, *::after {
       animation: none !important;
       transition-duration: 0.01ms !important;
       scroll-behavior: auto !important;
     }
   }
   ```
   `scripts/audit-static.mjs` confirms this block and its wildcard exist in
   the built CSS, but cannot confirm the browser actually honors it or that
   nothing is animating through inline styles / motion values instead of
   CSS `animation` (framer-motion springs, e.g. the scroll damping in
   §3 above, bypass this rule on purpose via `useReducedMotion()` — verify
   those are *also* inert, not just CSS keyframe animations).
5. Turn the emulation back off when done.

---

## 5. Mobile check at 390×844

1. `npm run dev`, open DevTools device toolbar, set a custom size of
   **390×844** (iPhone 12/13-ish).
2. Load `/#voyage` and scroll through to the singularity scene.
3. **Expected:**
   - `.nova-rays` and `.bh-lens` are **absent** (hidden via
     `@media (max-width: 760px)` in `journey.css`).
   - `.pulsar-beam` is **still visible and animating** — it was
     deliberately kept on phones (it's compositor-only, no `filter: blur`,
     see item 6a below) since it's the element that visually reads as
     "pulsar."
   - `.bh-disk` spins slower (`animation-duration: 26s` vs. desktop's
     `14s`).
   - The scene stays legible and scrolls smoothly; the grain should look
     slightly fainter than desktop (`opacity: 0.16` vs. `0.22`, or `0.14` if
     you also have reduced-motion emulation on — reduced-motion wins over
     the phone default when both apply).
4. Also spot-check the dossier (`/`) at the same size for basic layout
   sanity — Task 10 only targeted the voyage view.

---

## 6. Specific visual items flagged during this branch's reviews

These four items were called out during implementation as places where the
CSS is correct on paper (verified by static analysis and the test suite)
but were never actually seen rendered. Check them specifically rather than
just glancing at the scene.

### 6a. `.pulsar-beam` amber colour and feather width

`src/styles/journey.css` (~line 627):

```css
.pulsar-beam {
  background: conic-gradient(
    from 0deg,
    rgba(245, 169, 61, 0.5) 0deg 10deg,
    transparent 13deg 177deg,
    rgba(245, 169, 61, 0.5) 180deg 190deg,
    transparent 193deg 357deg,
    rgba(245, 169, 61, 0.5) 360deg
  );
  animation: spin 3.2s linear infinite;
  will-change: transform;
}
```

`filter: blur(3px)` used to soften this beam's edges; it was removed for
paint-cost reasons (it's now compositor-only: transform + opacity, no
filter). The only "feathering" left is the 3° gap between each solid stop
(`10deg`→`13deg`, `190deg`→`193deg`) where the conic-gradient interpolates
color, i.e. a much narrower, harder transition than the blurred version had.

**Check:** does the beam's edge look like a soft, blurred taper (good) or a
visibly hard-edged wedge (worth reconsidering)? If it reads as too sharp,
the fix is to widen the transparent-to-`rgba(245,169,61,0.5)` transition
span in the gradient stops (e.g. `10deg`→`16deg` instead of `10deg`→`13deg`)
— do **not** reintroduce `filter: blur()`, that's the exact thing this
branch removed for performance and `scripts/audit-static.mjs` will fail the
build if it comes back.

### 6b. `.bh-lens` border (2px / 0.13 alpha)

`src/styles/journey.css` (~line 714):

```css
.bh-lens {
  width: 96%;
  aspect-ratio: 1;
  border: 2px solid rgba(245, 169, 61, 0.13);
  transform: rotate(-16deg) scaleY(0.55);
}
```

A very faint (13% alpha), thin (2px) rotated/squashed ring meant to suggest
lensing around the black hole, without being a distinct visible ring on its
own. It's hidden entirely on phones (`display: none` at ≤760px).

**Check on desktop:** is it visible at all as a subtle backdrop shape, or is
0.13 alpha + 2px effectively invisible against the scene (in which case it's
dead weight — either raise the alpha slightly or drop the element)? This is
a judgment call the spec leaves to eyeballing, not a pass/fail.

### 6c. Film grain strength (post `mix-blend-mode` removal)

`.voyage-atmosphere::after` used to blend the grain texture with
`mix-blend-mode: soft-light` at `opacity: 0.5`. That was removed (confirmed
via review as the single highest paint-cost item in Task 8 — a full-viewport
`position: fixed` element with a blend mode forces a per-pixel re-blend of
the entire viewport on every frame anything beneath it changes, which during
the voyage's continuous starfield/scene animation is effectively every
frame). The grain now uses plain `opacity: 0.22` on desktop (`0.16` on
phones, `0.14` under reduced motion) with no blend mode.

**Check:** does the grain still read as texture (good), or does it look too
flat/weak now compared to what a blended grain would look like (expected
trade-off, but worth confirming it isn't *invisible*)? **Also check the
opposite direction:** at `opacity: 0.22` on desktop, does the grain lift the
blacks enough to hurt legibility of `--text-3` body copy sitting on top of
it? A too-faint grain is a missed effect; a too-strong one is a readability
regression — both are worth flagging, not just the first. The exact rule and
reasoning is documented directly above `.voyage-atmosphere` in
`src/styles/journey.css`:

> Anyone who profiles this and finds the cost acceptable can restore the
> richer look by adding `mix-blend-mode: soft-light` to the `::after` rule
> below and raising its opacity back up toward 0.5.

That's the one-line switch: add `mix-blend-mode: soft-light;` inside
`.voyage-atmosphere::after` and raise `opacity` from `0.22` back toward
`0.5` — but only do this after re-measuring frame timing (§2 above) with it
on, since it's the exact change that was pulled out for cost.

### 6d. Gargantua arc position over the black hole shadow

`.bh-arc` (an amber-bordered half-ellipse meant to read as the far side of
the accretion disk, lensed up and over the event horizon) is deliberately
placed **after** `.bh-core` in the DOM (`src/journey/Singularity.jsx`), so
it paints on top of the opaque black core rather than being hidden behind
it. Final paint order in `.bh`: `bh-disk`, `bh-photon`, `bh-core`, `bh-arc`,
`bh-lens`.

**Check:** as the black hole scene comes into view, look for a bright
amber/cream arc curving over the **top** of the solid black core — it
should look like a bright rim hugging the shadow's upper edge, not a full
ring, not hidden behind the black core, and not floating disconnected above
it. If the arc appears to vanish behind the black circle, or cuts through
the amber disk/photon ring in a jarring way, that's a real bug — the DOM
order above should prevent both, but this was never visually confirmed.

---

## Summary table

| # | Check | Needs | Expected |
|---|---|---|---|
| 0a | Cold `/`, empty `localStorage` | `npm run dev` | Dossier |
| 0b–0e | Cold `/#experience`, `/#work`, `/#skills`, `/#contact` | `npm run dev` | Dossier, scrolled to that section |
| 0f | Cold `/#voyage` | `npm run dev` | Voyage |
| 0g | Enter voyage, reload bare `/` | `npm run dev` | Voyage (remembered) |
| 0h | Exit voyage, reload bare `/` | `npm run dev` | Dossier, URL reads `#overview` |
| 0i–0j | Tab to "Take the voyage", activate with Enter | `npm run dev` | Visible focus ring; Enter opens voyage |
| 1a | `scripts/audit.js` on `/` | preview build | `infiniteAnimations: 0`, `blurredElements: 0`, `backdropFilters: 0` |
| 1b | `scripts/audit.js` on `/#voyage` | preview build | `blurredAndAnimated: 0`, `backdropFilters: 0` (infinite non-zero OK) |
| 2 | Frame-timing snippet on `/#voyage` | visible window | `framesOver34ms: 0` |
| 3 | Scroll-damping feel | `npm run dev` | Weighty settle, no overshoot; tune `GLIDE` in `src/journey/hooks.js` if not |
| 4 | Reduced-motion emulation | DevTools Rendering tab | Nothing animates |
| 5 | 390×844 mobile check | DevTools device toolbar | `.nova-rays`/`.bh-lens` hidden, `.pulsar-beam` visible, disk spins slower |
| 6a | `.pulsar-beam` feather | Eyes on `/#voyage` | Soft-reading edge; if hard, widen gradient-stop span, not blur |
| 6b | `.bh-lens` visibility | Eyes on `/#voyage` desktop | Faint but present backdrop ring, or flag as dead weight |
| 6c | Film grain strength | Eyes on `/#voyage` | Reads as texture without hurting `--text-3` legibility; one-line switch documented in `journey.css` if too flat |
| 6d | Gargantua arc | Eyes on `/#voyage` singularity scene | Bright arc over top of black core, not hidden/disconnected |
