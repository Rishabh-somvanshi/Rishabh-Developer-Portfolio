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

**As of the Lenis change below, this is no longer the whole story** — the
scroll *position* is now smoothed by Lenis, and this spring only takes the
remaining edge off. Read §7 first if you're checking a fresh build; this
section covers the spring in isolation.

`src/journey/hooks.js` drives every pinned scene's scroll progress through a
spring (`useGlide`), controlled by the `GLIDE` constant:

```js
const GLIDE = { stiffness: 90, damping: 26, mass: 1, restDelta: 0.0005 }
```

1. `npm run dev`, open `http://localhost:5173/#voyage`.
2. Scroll with a mouse wheel in short bursts (a few notches, then stop).
3. **Expected feel:** planets/cards keep drifting into their final position
   for a brief beat *after* the wheel stops — that's the spring taking the
   edge off Lenis's already-smoothed scroll. It should read as a quick,
   crisp settle, not a long drift — the long, heavy drift is now Lenis's job
   (§7), not this spring's. It should **not** overshoot/bounce past the
   resting point either way.
4. **If it feels mushy or laggy** (motion trails noticeably behind the
   already-smoothed scroll, or the whole thing feels like it has two
   separate lags stacked on top of each other): that's the double-inertia
   problem this retune exists to avoid. Raise `stiffness` further (try
   `110`–`130`) and/or drop `mass` is already at its practical floor of `1`.
5. **If it wobbles or overshoots** (visibly bounces past the resting point
   before settling): raise `damping` above `26`. The intent is *no visible
   overshoot* — a bounce means damping is too low relative to
   stiffness/mass.
6. Also try touch/coarse-pointer scrolling if you have a touchscreen or
   trackpad available — Lenis is gated off on coarse pointers (§7), so this
   spring is the *only* smoothing touch users get; confirm it doesn't feel
   undersmoothed there compared to the Lenis-assisted desktop feel.

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

## 7. Lenis smooth scroll (this branch)

This branch adds [Lenis](https://github.com/darkroomengineering/lenis) to
smooth the voyage's actual scroll *position*, on top of the existing scene-
progress spring (§3). `src/journey/Journey.jsx` initialises it inside an
effect and destroys it on unmount; `src/journey/Hud.jsx` routes its two
programmatic-scroll buttons (the rail dots' `goTo`, and the logo's "back to
launch") through it via `src/journey/lenisController.js` instead of native
`window.scrollTo({ behavior: 'smooth' })`. None of this can be observed in
the browser automation pane used to build this branch — `requestAnimationFrame`
never fires there and `window.scrollY` stays `0` regardless of what the code
does, so the checks below were **not** run and must be done by a human.

### 7a. Voyage scroll glides and settles

1. `npm run dev`, open `http://localhost:5173/#voyage`.
2. Scroll with a mouse wheel — a few fast notches, then stop.
3. **Expected:** the page keeps gliding for a short beat after the wheel
   stops, with no snapping or hard stop, and no perceptible double-lag (the
   scene-progress spring in §3 was retuned specifically so its motion
   doesn't stack visibly on top of Lenis's — if you can see two distinct
   settles at different speeds, something's off).
4. Try holding the wheel scrolling continuously across several scenes —
   should stay smooth the whole way, no stutter at scene boundaries.

### 7b. Dossier still scrolls natively

1. Load `/` (not `/#voyage`).
2. Open DevTools → Elements, inspect `<html>`. **Expected:** no `lenis` or
   `lenis-smooth` class ever appears on it, on this page, at any point —
   those classes are Lenis's own markers and should only exist during an
   active voyage session. Scroll the dossier — it should feel exactly as it
   did before this branch (instant, native, no glide).
3. In the Network tab (or Sources), confirm no `lenis` chunk is fetched
   before the voyage is entered — Journey.jsx (and therefore its `import
   Lenis from 'lenis'`) is only reached once `mode === 'voyage'`, but this is
   worth a direct look rather than trusting the code path.

### 7c. Leaving the voyage restores native scrolling

1. Enter the voyage (`/#voyage` or "Take the voyage" from the dossier).
2. Scroll partway in, confirm the glide from §7a.
3. Exit back to the dossier (skip link or the exit control).
4. **Expected:** scrolling the dossier afterward is instant/native again —
   no residual glide, no leftover `lenis`/`lenis-smooth` class on `<html>`
   (check DevTools again). This confirms the `lenis.destroy()` cleanup in
   `Journey.jsx`'s effect actually ran on unmount.
5. Re-enter the voyage again after that and confirm it re-initialises
   cleanly (glide is back) — this exercises mount → unmount → remount, not
   just a single mount.

### 7d. HUD rail dots and logo button

1. In the voyage, click a few of the progress-rail dots on the right edge
   (out of order — e.g. jump straight to "Singularity" from "Launch").
2. **Expected:** each jump glides via Lenis to land in the right place (the
   same target position `goTo` computed before this branch — the destination
   math didn't change, only how the scroll gets there) — no instant jump, no
   fighting/stutter between two competing scroll animations.
3. Click the `rs.` logo button (top-left, "back to launch").
4. **Expected:** glides back to the top the same way.
5. While a rail-dot glide is still in flight, click a different dot.
   **Expected:** it retargets smoothly to the new destination rather than
   finishing the old scroll first or jumping.

### 7e. Keyboard scrolling still works

With the voyage loaded and no input focused elsewhere:

1. Press **Space** / **Page Down** — page should scroll down roughly a
   viewport (Lenis wraps native scroll rather than replacing it, so this is
   expected to keep working, but confirm directly).
2. Press **Page Up** — scrolls back up.
3. Press **Arrow Down** / **Arrow Up** repeatedly — small increments, same
   direction sense as before.
4. Press **Home** — jumps to the very top (launch).
5. Press **End** — jumps to the very bottom (home/outro).
6. Tab to one of the HUD rail-dot buttons and press **Enter**/**Space** —
   should trigger the same glide as a click (§7d).

### 7f. Scrollbar dragging

1. Drag the browser's scrollbar thumb up and down.
2. **Expected:** the page tracks the drag without fighting it — Lenis should
   not make scrollbar dragging feel laggy, jumpy, or disconnected from the
   thumb position.

### 7g. Touch and reduced-motion both fall back to native

1. **Touch:** DevTools device toolbar → any touch-capable device preset (or
   a real touchscreen/trackpad reporting `pointer: coarse`), reload
   `/#voyage`. Scroll. **Expected:** ordinary touch/trackpad momentum
   scrolling, no Lenis glide layered on top — check `<html>` in Elements and
   confirm it never gets a `lenis` class here. The scene-progress spring
   (§3) still applies; only the scroll-position smoothing is skipped.
2. **Reduced motion:** DevTools → `Cmd/Ctrl+Shift+P` → "Rendering" → emulate
   `prefers-reduced-motion: reduce`, reload `/#voyage` (fresh load — the
   gate is read once at mount). Scroll. **Expected:** native instant scroll,
   no glide, and again no `lenis` class on `<html>`. Combined with §4, this
   confirms reduced-motion strips out both the spring's drift and Lenis's
   glide, not just one of the two.
3. For both cases, click a HUD rail dot (§7d) and confirm it still jumps to
   the right place — `lenisController.scrollTo` falls back to native
   `window.scrollTo({ behavior: 'smooth' })` when no Lenis instance is
   registered, so it should still land correctly, just without the Lenis
   feel.

### If it feels wrong

Two independent knobs, tune the one that matches the symptom:

- **`GLIDE` in `src/journey/hooks.js`** — controls how the *scene-progress*
  spring (planets, cards, parallax) trails the now-smoothed scroll position.
  See §3 above for specific stiffness/damping guidance.
- **Lenis's own options in `src/journey/Journey.jsx`** (currently `new
  Lenis()` with all defaults — `duration: 1.2`s, `lerp: 0.1`, `wheelMultiplier:
  1`, etc.) — controls the *scroll position* glide itself. If the page-level
  glide feels too slow/heavy, lower `duration` or raise `lerp` (they're
  alternatives — the README notes `duration` is ignored once `lerp` is set);
  if it feels too twitchy/fast, do the opposite. See the [Lenis
  README](https://github.com/darkroomengineering/lenis#settings) (also
  vendored at `node_modules/lenis/README.md`) for the full options table.

If both feel off at once, tune Lenis first (it's now the primary source of
inertia) and only touch `GLIDE` afterward for whatever residual mismatch is
left between the spring and the now-different scroll feel.

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
| 3 | Scroll-damping feel (spring only, now paired with Lenis — see §7) | `npm run dev` | Crisp settle, no overshoot; tune `GLIDE` in `src/journey/hooks.js` if not |
| 4 | Reduced-motion emulation | DevTools Rendering tab | Nothing animates |
| 5 | 390×844 mobile check | DevTools device toolbar | `.nova-rays`/`.bh-lens` hidden, `.pulsar-beam` visible, disk spins slower |
| 6a | `.pulsar-beam` feather | Eyes on `/#voyage` | Soft-reading edge; if hard, widen gradient-stop span, not blur |
| 6b | `.bh-lens` visibility | Eyes on `/#voyage` desktop | Faint but present backdrop ring, or flag as dead weight |
| 6c | Film grain strength | Eyes on `/#voyage` | Reads as texture without hurting `--text-3` legibility; one-line switch documented in `journey.css` if too flat |
| 6d | Gargantua arc | Eyes on `/#voyage` singularity scene | Bright arc over top of black core, not hidden/disconnected |
| 7a | Voyage scroll glides and settles | `npm run dev` | Smooth glide after wheel stops, no double-lag against §3's spring |
| 7b | Dossier still scrolls natively | `npm run dev` on `/` | No `lenis`/`lenis-smooth` class on `<html>`; no Lenis chunk fetched before voyage entry |
| 7c | Exiting voyage restores native scroll | `npm run dev`, enter then exit voyage | No residual glide or `lenis` class after exit; re-entry re-initialises cleanly |
| 7d | HUD rail dots / logo button | `npm run dev` on `/#voyage` | Glides to target via Lenis; re-target mid-glide works, no fight/stutter |
| 7e | Keyboard scrolling in voyage | `npm run dev` on `/#voyage` | Space/PageDown/PageUp/arrows/Home/End all still work |
| 7f | Scrollbar dragging in voyage | `npm run dev` on `/#voyage` | Thumb drag tracks without lag or disconnect |
| 7g | Touch and reduced-motion fall back to native | DevTools device toolbar / Rendering tab | No Lenis glide, no `lenis` class on `<html>`; HUD jumps still land correctly |

---

## 8. Mobile fixes — real device required

The fixes below were built and checked by reading the relevant source files
and doing the box-model/pixel arithmetic by hand — **not** by looking at a
rendered phone. This environment's browser pane doesn't composite frames,
never fires `requestAnimationFrame`, and `window.scrollY` stays `0`, so none
of the following was seen with eyes. All of it needs a real phone (or, at
minimum, DevTools' device toolbar with CPU/network throttling and an actual
touch-capable viewport so `matchMedia('(pointer: coarse)')` reports `true`)
before this ships.

### 8a. HUD clearance (Problem 1)

On an actual phone at roughly 375×812 (or your own device's size), open
`/#voyage` and scroll through every scene. For each one, confirm the
"Résumé view →" button (top-right, `y 16–59`) never sits on top of readable
text or the meteor/beat graphics:

| Scene | What changed | What to check |
|---|---|---|
| origins | `.meteor-field`'s `top` raised from `7svh` to `max(7svh, 91px)`, `height` shortened to keep its bottom edge pinned at the original 33svh mark | First meteor doesn't start under the HUD; no new gap/overlap where the field meets `.origins-copy` |
| stars (twin lights) | `.beat` (supernova/pulsar panels) gets `padding-top: max(8svh, 91px)` and `align-content: start` instead of centering in the full viewport | Both beat panels (nova+card, pulsar+card) start clear of the HUD; card content isn't pushed off the bottom edge |
| reentry | `.reentry-stage` switched from `align-items: center; padding-top: 0` to `align-items: flex-start; padding-top: max(8svh, 91px)` | Kicker/heading start clear of the HUD; the three stacked stats and the closing line aren't clipped at the bottom — this is the one most likely to be tight on a short device, since the stats block is tall once it stacks to one column |
| home | `.home-scn` switched from `justify-content: center` to `justify-content: flex-end` | At the very bottom of the scroll (nothing left to scroll), the heading/contact block sits clear of the HUD, not flush against it. Also confirm the reveal-in-on-scroll animation for this section still triggers normally on the way down (justify-content change shouldn't affect that, but it changes *when* the content becomes visible relative to scroll position, so it's worth a look) |
| curo / mercantile / vault / porcelain / launch | unchanged | Re-confirm still clear — these were already fine and nothing in this fix touches their rules, but worth a spot check since they share `.scn-stage`'s base rule |

Also check the mercantile world's three award moons (top-right cluster of
small badges) don't sit under the HUD rail (the column of dots running down
the right edge) — `.moon-1`/`.moon-2`'s `right` offset moved from `4%`/`0%`
to `13%`/`11%` to pull them clear of it.

**Devices to test on, if available:** something ~375×812 (matches the
measurements this fix was based on) and something shorter, ~375×667 (an
iPhone SE-class device) — none of this fix's new padding values have the
launch scene's explicit `max-height: 600px` fallback, so a short device is
the one place this could still be tight, particularly the reentry stats
block.

### 8b. Scene length / dead scroll (Problem 2)

With a touch-capable viewport (so `useScene`'s `coarse` check is `true`),
scroll all the way through the voyage and gauge how much of each pinned
scene's scroll range is spent looking at a screen that isn't visibly
changing. The fix only changed one number (`0.74` → `0.58` in
`src/journey/hooks.js`), so this is a feel check, not a correctness check:

- Scenes should still fully play out their content (nothing should feel
  rushed or cut off) — the transform input ranges (0..1 progress) weren't
  touched, only how much physical scroll maps to that range.
- The stretches of "nothing happening" between beats should be noticeably
  shorter than before, without introducing a new problem where content
  changes faster than it can be read.
- If it now feels rushed on a real device, the multiplier is the one knob
  to retune (raise it back up in small steps); if there's still noticeable
  dead space, lower it further. Don't touch the per-scene `vh` values or
  any `useTransform` ranges to fix a feel issue here — see the updated
  comment on `useScene` for why.
