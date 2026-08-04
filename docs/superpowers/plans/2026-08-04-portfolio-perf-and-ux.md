# Portfolio Performance & UX Implementation Plan

> **Status:** This plan was fully executed on branch `feat/perf-and-ux`,
> including the final pre-merge review's follow-up fixes. The checkboxes
> below were never ticked off by hand as work landed, so they should not be
> read as tracking progress — see `.superpowers/sdd/progress.md` for the
> authoritative per-task record (what was done, in what commit, and the
> review/report trail for each task).

> **For agentic workers:** REQUIRED SUB-SKILL: Use superpowers:subagent-driven-development (recommended) or superpowers:executing-plans to implement this plan task-by-task. Steps use checkbox (`- [ ]`) syntax for tracking.

**Goal:** Land recruiters on the fast dossier view by default, make the voyage opt-in, and rebuild the voyage's motion so it is both smooth and cinematic.

**Architecture:** The app already ships two view modes in `src/App.jsx` — `voyage` and `work` (the dossier). The default flips to `work`, with the voyage reachable by an explicit control and by `#voyage`. Voyage performance work targets **paint cost**, not JavaScript: every `filter: blur()` that is also animated is replaced with a pre-baked gradient, off-screen scenes are gated with `IntersectionObserver` and `content-visibility`, and scroll motion is damped via framer-motion's `useSpring` in `src/journey/hooks.js`.

**Tech Stack:** Vite 5, React 18, framer-motion 11, plain CSS with custom properties. Tests: Vitest 2 + jsdom (added by Task 1).

## Global Constraints

- Node 25.8.2, npm 11.11.1 on Windows. Shell is Git Bash or PowerShell.
- Repo root is `D:\Portfolio`. All paths below are relative to it.
- Do **not** edit `backup/live-2026-07-15/**` — it is the frozen reference copy of production.
- Do **not** change résumé copy or claims. Content lives in `src/data/content.js` and is out of scope.
- Design tokens are fixed: `--bg: #0a0a0b`, `--surface: #111113`, `--surface-2: #18181b`, `--text: #ededef`, `--text-2: #a7a7ae`, `--text-3: #82828b`, `--accent: #e8942a`, `--accent-bright: #f5a93d`, `--accent-dim: rgba(232,148,42,.13)`, `--border: rgba(255,255,255,.08)`, `--border-strong: rgba(255,255,255,.16)`, `--container: 68rem`, `--radius: 8px`, `--radius-lg: 12px`, `--ease: cubic-bezier(.21,.47,.32,.98)`.
- Dossier anchors that must keep resolving to the dossier: `#overview`, `#experience`, `#work`, `#skills`, `#contact`.
- `npm run build` must succeed at the end of every task.
- Commit after every task.

---

### Task 1: Test infrastructure

**Files:**
- Modify: `package.json`
- Create: `vitest.config.js`
- Create: `src/lib/__tests__/smoke.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `npm test` runs Vitest once and exits; `npm run test:watch` watches. Test files live in `__tests__` folders beside the code, named `*.test.js`.

- [ ] **Step 1: Install dev dependencies**

```bash
cd /d/Portfolio && npm install -D vitest@^2.1.0 jsdom@^25.0.0 --no-audit --no-fund
```

- [ ] **Step 2: Create `vitest.config.js`**

```js
import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    environment: 'jsdom',
    include: ['src/**/*.test.js'],
    restoreMocks: true,
  },
})
```

Import from `vitest/config`, not `vite` — the latter has no `test` key in its type surface and only works by accident.

- [ ] **Step 3: Add scripts to `package.json`**

Add to the `"scripts"` object, keeping `dev`, `build`, `preview` unchanged:

```json
    "test": "vitest run",
    "test:watch": "vitest"
```

- [ ] **Step 4: Write a smoke test proving jsdom is wired up**

Create `src/lib/__tests__/smoke.test.js`:

```js
import { describe, it, expect } from 'vitest'

describe('test environment', () => {
  it('provides a jsdom window with matchMedia-capable location', () => {
    expect(typeof window).toBe('object')
    expect(window.location.hash).toBe('')
  })

  it('provides a working localStorage', () => {
    window.localStorage.setItem('probe', 'ok')
    expect(window.localStorage.getItem('probe')).toBe('ok')
    window.localStorage.removeItem('probe')
  })
})
```

- [ ] **Step 5: Run the tests**

Run: `cd /d/Portfolio && npm test`
Expected: PASS, 2 tests passed.

- [ ] **Step 6: Verify the build still works**

Run: `cd /d/Portfolio && npm run build`
Expected: `✓ built in ...`, emits `dist/assets/index-*.js`.

- [ ] **Step 7: Commit**

```bash
cd /d/Portfolio && git add package.json package-lock.json vitest.config.js src/lib/__tests__/smoke.test.js && git commit -m "test: add vitest + jsdom test infrastructure"
```

---

### Task 2: View-mode resolution

Extracts mode selection out of `App.jsx` into a tested pure module, flips the default to the dossier, and adds persistence.

**Files:**
- Create: `src/lib/viewMode.js`
- Create: `src/lib/__tests__/viewMode.test.js`

**Interfaces:**
- Consumes: nothing.
- Produces:
  - `DOSSIER_HASHES: Set<string>` — `#overview`, `#experience`, `#work`, `#skills`, `#contact`
  - `VOYAGE_HASH: string` — `'#voyage'`
  - `STORAGE_KEY: string` — `'rs.viewMode'`
  - `resolveInitialMode({ hash, stored, prefersReducedMotion }): 'work' | 'voyage'` — pure, no globals
  - `readStoredMode(): 'work' | 'voyage' | null`
  - `writeStoredMode(mode: 'work' | 'voyage'): void`

**Precedence, highest first:** explicit hash → reduced-motion → stored preference → default `'work'`.

- [ ] **Step 1: Write the failing tests**

Create `src/lib/__tests__/viewMode.test.js`:

```js
import { describe, it, expect, beforeEach } from 'vitest'
import {
  DOSSIER_HASHES,
  VOYAGE_HASH,
  STORAGE_KEY,
  resolveInitialMode,
  readStoredMode,
  writeStoredMode,
} from '../viewMode'

describe('resolveInitialMode', () => {
  const base = { hash: '', stored: null, prefersReducedMotion: false }

  it('defaults to the dossier when nothing else applies', () => {
    expect(resolveInitialMode(base)).toBe('work')
  })

  it('honours an explicit #voyage hash', () => {
    expect(resolveInitialMode({ ...base, hash: '#voyage' })).toBe('voyage')
  })

  it('lets an explicit hash beat a conflicting stored preference', () => {
    expect(resolveInitialMode({ ...base, hash: '#voyage', stored: 'work' })).toBe('voyage')
    expect(resolveInitialMode({ ...base, hash: '#overview', stored: 'voyage' })).toBe('work')
  })

  it('routes every dossier anchor to the dossier', () => {
    for (const hash of DOSSIER_HASHES) {
      expect(resolveInitialMode({ ...base, hash })).toBe('work')
    }
  })

  it('forces the dossier for reduced-motion users even with a stored voyage preference', () => {
    expect(
      resolveInitialMode({ ...base, stored: 'voyage', prefersReducedMotion: true }),
    ).toBe('work')
  })

  it('still honours an explicit #voyage hash over reduced-motion', () => {
    expect(
      resolveInitialMode({ ...base, hash: VOYAGE_HASH, prefersReducedMotion: true }),
    ).toBe('voyage')
  })

  it('falls back to a stored preference when no hash is present', () => {
    expect(resolveInitialMode({ ...base, stored: 'voyage' })).toBe('voyage')
    expect(resolveInitialMode({ ...base, stored: 'work' })).toBe('work')
  })

  it('ignores an unrecognised stored value', () => {
    expect(resolveInitialMode({ ...base, stored: 'nonsense' })).toBe('work')
  })

  it('ignores an unrecognised hash', () => {
    expect(resolveInitialMode({ ...base, hash: '#nope' })).toBe('work')
  })
})

describe('stored mode', () => {
  beforeEach(() => window.localStorage.clear())

  it('round-trips a value', () => {
    writeStoredMode('voyage')
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('voyage')
    expect(readStoredMode()).toBe('voyage')
  })

  it('returns null when nothing is stored', () => {
    expect(readStoredMode()).toBeNull()
  })

  it('returns null for a corrupt stored value', () => {
    window.localStorage.setItem(STORAGE_KEY, 'garbage')
    expect(readStoredMode()).toBeNull()
  })

  it('does not throw when storage is unavailable', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage')
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('blocked')
      },
    })
    expect(() => writeStoredMode('work')).not.toThrow()
    expect(readStoredMode()).toBeNull()
    Object.defineProperty(window, 'localStorage', original)
  })
})
```

- [ ] **Step 2: Run the tests to verify they fail**

Run: `cd /d/Portfolio && npm test`
Expected: FAIL — `Failed to resolve import "../viewMode"`.

- [ ] **Step 3: Write the implementation**

Create `src/lib/viewMode.js`:

```js
/**
 * Which of the two views the app opens on.
 *
 * The dossier is the default: it is the fast view, and it is what a recruiter
 * following a link from a job application needs to see first. The voyage is
 * opt-in — chosen deliberately, deep-linked, or remembered from last visit.
 */

export const DOSSIER_HASHES = new Set([
  '#overview',
  '#experience',
  '#work',
  '#skills',
  '#contact',
])

export const VOYAGE_HASH = '#voyage'
export const STORAGE_KEY = 'rs.viewMode'

const MODES = new Set(['work', 'voyage'])

/**
 * Resolve the opening mode. Pure — callers supply the environment.
 *
 * Precedence, highest first:
 *   1. an explicit hash, so a pasted link always lands where it says
 *   2. reduced-motion, which rules out the voyage
 *   3. the visitor's remembered choice
 *   4. the dossier
 */
export function resolveInitialMode({ hash, stored, prefersReducedMotion }) {
  if (hash === VOYAGE_HASH) return 'voyage'
  if (DOSSIER_HASHES.has(hash)) return 'work'
  if (prefersReducedMotion) return 'work'
  if (MODES.has(stored)) return stored
  return 'work'
}

export function readStoredMode() {
  try {
    const value = window.localStorage.getItem(STORAGE_KEY)
    return MODES.has(value) ? value : null
  } catch {
    return null // private mode, blocked storage — not worth failing over
  }
}

export function writeStoredMode(mode) {
  try {
    window.localStorage.setItem(STORAGE_KEY, mode)
  } catch {
    /* ignore — persistence is a nicety, not a requirement */
  }
}
```

- [ ] **Step 4: Run the tests to verify they pass**

Run: `cd /d/Portfolio && npm test`
Expected: PASS, 15 tests passed.

- [ ] **Step 5: Commit**

```bash
cd /d/Portfolio && git add src/lib/viewMode.js src/lib/__tests__/viewMode.test.js && git commit -m "feat: add tested view-mode resolution defaulting to the dossier"
```

---

### Task 3: Wire the new resolution into the app

**Files:**
- Modify: `src/App.jsx` (replaces `initialMode` at lines 12–28, and the `skip`/`voyage` handlers at 65–73)

**Interfaces:**
- Consumes: `resolveInitialMode`, `readStoredMode`, `writeStoredMode`, `VOYAGE_HASH` from `src/lib/viewMode.js`.
- Produces: `App` renders the dossier by default; `enterVoyage()` and `exitVoyage()` persist the choice.

- [ ] **Step 1: Replace the import block and `initialMode`**

In `src/App.jsx`, replace lines 12–28 (the `WORK_HASHES` constant, the doc comment, and `initialMode`) with:

```js
import {
  VOYAGE_HASH,
  resolveInitialMode,
  readStoredMode,
  writeStoredMode,
} from './lib/viewMode'

/**
 * Two ways in:
 *  - The dossier (default): the dense classic view a hurried reader wants.
 *  - The voyage: a scroll-driven journey home through the career, opt-in.
 * An explicit hash always wins, so a pasted link lands where it says.
 */
function initialMode() {
  if (typeof window === 'undefined') return 'work'
  let prefersReducedMotion = false
  try {
    prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    /* matchMedia unavailable — treat as no preference */
  }
  return resolveInitialMode({
    hash: window.location.hash,
    stored: readStoredMode(),
    prefersReducedMotion,
  })
}
```

Keep the existing `import { useEffect, useRef, useState } from 'react'` and the other component imports exactly as they are.

- [ ] **Step 2: Replace the mode handlers**

Replace the `skip` and `voyage` functions (lines 65–73) with:

```js
  const exitVoyage = () => {
    setMode('work')
    writeStoredMode('work')
    window.history.replaceState(null, '', '#overview')
  }

  const enterVoyage = () => {
    setMode('voyage')
    writeStoredMode('voyage')
    window.history.replaceState(null, '', VOYAGE_HASH)
  }
```

- [ ] **Step 3: Update the call sites**

In the returned JSX, rename the handler references:
- `onClick={skip}` becomes `onClick={exitVoyage}`
- `<Journey onSkip={skip} />` becomes `<Journey onSkip={exitVoyage} />`
- `<Nav onVoyage={voyage} />` becomes `<Nav onVoyage={enterVoyage} />`

- [ ] **Step 4: Verify the build**

Run: `cd /d/Portfolio && npm run build`
Expected: `✓ built in ...` with no unresolved-import errors.

- [ ] **Step 5: Verify by hand in the dev server**

Run: `cd /d/Portfolio && npm run dev`

Check, then stop the server:
1. `http://localhost:5173/` opens the **dossier**.
2. `http://localhost:5173/#voyage` opens the **voyage**.
3. `http://localhost:5173/#overview` opens the **dossier**.
4. Entering the voyage, then reloading bare `/`, reopens the **voyage** (persistence).
5. With the preference stored as voyage, `/#overview` still opens the **dossier** (hash wins).

- [ ] **Step 6: Commit**

```bash
cd /d/Portfolio && git add src/App.jsx && git commit -m "feat: land on the dossier by default, make the voyage opt-in and persistent"
```

---

### Task 4: Voyage entry point in the dossier hero

The dossier's only current route into the voyage is `Nav`. Add a visible, keyboard-reachable control in the hero.

**Files:**
- Modify: `src/components/Hero.jsx`
- Modify: `src/App.jsx` (pass `onVoyage` to `Hero`)
- Modify: `src/styles/global.css` (append the `.hero-voyage` rule)

**Interfaces:**
- Consumes: `enterVoyage` from Task 3.
- Produces: `<Hero onVoyage={fn} />`.

- [ ] **Step 1: Accept the prop**

In `src/components/Hero.jsx`, change line 5 from `export default function Hero() {` to:

```jsx
export default function Hero({ onVoyage }) {
```

- [ ] **Step 2: Render the control**

Insert between the closing `</m.div>` of `.hero-stats` (line 56) and the closing `</m.div>` of the stagger wrapper (line 57), so it sits last in the staggered reveal:

```jsx
          <m.div variants={fadeUp}>
            <button type="button" className="hero-voyage mono" onClick={onVoyage}>
              Take the voyage
              <span aria-hidden="true"> →</span>
            </button>
          </m.div>
```

- [ ] **Step 3: Pass the handler in `src/App.jsx`**

Change `<Hero />` to `<Hero onVoyage={enterVoyage} />`.

- [ ] **Step 4: Style it**

Append to `src/styles/global.css`:

```css
/* Entry to the voyage — deliberately quieter than the résumé and contact CTAs,
   so it reads as an aside rather than competing with them. */
.hero-voyage {
  margin-top: var(--s3);
  padding: 0;
  border: 0;
  background: none;
  color: var(--text-3);
  font-family: var(--font-mono);
  font-size: var(--fs-xs);
  letter-spacing: 0.06em;
  cursor: pointer;
  transition: color 0.16s ease;
}

.hero-voyage:hover,
.hero-voyage:focus-visible {
  color: var(--accent);
}
```

- [ ] **Step 5: Verify**

Run: `cd /d/Portfolio && npm run build && npm run dev`

Confirm on `http://localhost:5173/`: the control appears under the hero CTAs, is reachable by <kbd>Tab</kbd>, shows a visible focus ring, and switches to the voyage when activated by <kbd>Enter</kbd>. Stop the server.

- [ ] **Step 6: Commit**

```bash
cd /d/Portfolio && git add src/components/Hero.jsx src/App.jsx src/styles/global.css && git commit -m "feat: add a voyage entry point to the dossier hero"
```

---

### Task 5: Remove animated blur from the voyage

The measured cause of the lag. An element that is both blurred and animated repaints its whole area every frame. Each one below is replaced with a pre-baked gradient that costs nothing to composite.

**Files:**
- Create: `src/styles/__tests__/noAnimatedBlur.test.js`
- Modify: `src/styles/journey.css` (lines 638–640 `.pulsar-beam`, 711–713 `.bh-disk`, 570–572 `.nova-core`, 694–696 `.bh-photon`, 719–720 `.bh-lens`, 927–928 `.earth-sunrise`, 329–330 `.meteor-tail`, 137–139 `.hud` backdrop-filter)

**Interfaces:**
- Consumes: nothing.
- Produces: no consumable API. Guarded by a test that fails if animated blur is reintroduced.

- [ ] **Step 1: Write the failing guard test**

Create `src/styles/__tests__/noAnimatedBlur.test.js`:

```js
import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'

const css = readFileSync(
  fileURLToPath(new URL('../journey.css', import.meta.url)),
  'utf8',
)

/** Split a stylesheet into { selector, body } pairs, ignoring at-rule preludes. */
function rules(source) {
  const out = []
  const re = /([^{}]+)\{([^{}]*)\}/g
  let match
  while ((match = re.exec(source))) {
    const selector = match[1].trim()
    if (selector.startsWith('@')) continue
    out.push({ selector, body: match[2] })
  }
  return out
}

describe('journey.css paint cost', () => {
  it('never animates a blurred element', () => {
    const offenders = rules(css)
      .filter((r) => /filter:\s*[^;]*blur\(/.test(r.body) && /animation:/.test(r.body))
      .map((r) => r.selector)
    expect(offenders).toEqual([])
  })

  it('does not use backdrop-filter', () => {
    const offenders = rules(css)
      .filter((r) => /backdrop-filter:/.test(r.body))
      .map((r) => r.selector)
    expect(offenders).toEqual([])
  })
})
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd /d/Portfolio && npm test -- noAnimatedBlur`
Expected: FAIL. First assertion lists `.pulsar-beam` and `.bh-disk`; second lists the HUD rule.

- [ ] **Step 3: Replace `.pulsar-beam` (around line 636)**

The 380×380 spinning blurred beam — the single most expensive element. Drop the blur; soften the gradient stops instead so the edge stays feathered.

```css
.pulsar-beam {
  background: conic-gradient(
    from 0deg,
    transparent 0deg,
    rgba(237, 237, 239, 0) 12deg,
    rgba(237, 237, 239, 0.16) 26deg,
    rgba(237, 237, 239, 0.34) 45deg,
    rgba(237, 237, 239, 0.16) 64deg,
    rgba(237, 237, 239, 0) 78deg,
    transparent 180deg,
    rgba(237, 237, 239, 0) 192deg,
    rgba(237, 237, 239, 0.16) 206deg,
    rgba(237, 237, 239, 0.34) 225deg,
    rgba(237, 237, 239, 0.16) 244deg,
    rgba(237, 237, 239, 0) 258deg,
    transparent 360deg
  );
  animation: spin 3.2s linear infinite;
  will-change: transform;
}
```

Delete the `filter: blur(3px);` declaration from this rule.

- [ ] **Step 4: Replace `.bh-disk` (around line 709)**

Gargantua's accretion disk. Same treatment — feathered gradient, no blur.

```css
.bh-disk {
  background: conic-gradient(
    from 0deg,
    rgba(232, 148, 42, 0) 0deg,
    rgba(232, 148, 42, 0.34) 40deg,
    rgba(255, 214, 148, 0.72) 92deg,
    rgba(245, 169, 61, 0.5) 150deg,
    rgba(232, 148, 42, 0.16) 220deg,
    rgba(232, 148, 42, 0.42) 300deg,
    rgba(232, 148, 42, 0) 360deg
  );
  animation: spin 14s linear infinite;
  will-change: transform;
}
```

Delete the `filter: blur(5px);` declaration.

- [ ] **Step 5: Remove blur from the three static elements**

These are not animated, so they are cheaper — but they still force an offscreen buffer, and the gradients already carry the softness.

- `.nova-core` (around line 570): delete `filter: blur(1px);`
- `.bh-photon` (around line 694): delete `filter: blur(1px);`
- `.bh-lens` (around line 719): delete `filter: blur(2px);`

- [ ] **Step 6: Replace `.earth-sunrise` blur (around line 926)**

896 px wide — the largest blurred surface on the page. The gradient's own falloff replaces it.

```css
.earth-sunrise {
  background: radial-gradient(
    ellipse 50% 100% at 50% 100%,
    rgba(232, 148, 42, 0.4) 0%,
    rgba(232, 148, 42, 0.22) 38%,
    rgba(232, 148, 42, 0.08) 60%,
    transparent 78%
  );
}
```

Delete the `filter: blur(2px);` declaration.

- [ ] **Step 7: Remove the meteor-tail blur (around line 329)**

`blur(0.4px)` is below the threshold of visibility but still allocates a buffer per meteor. Delete `filter: blur(0.4px);` from `.meteor-tail`.

- [ ] **Step 8: Replace the HUD backdrop-filter (around line 137)**

`backdrop-filter` forces a readback of everything behind the element on every frame it moves. The HUD sits over the starfield, so an opaque-enough surface is indistinguishable.

```css
  background: rgba(17, 17, 19, 0.94);
```

Delete both the `backdrop-filter: blur(10px);` and `-webkit-backdrop-filter: blur(10px);` declarations.

- [ ] **Step 9: Run the guard test**

Run: `cd /d/Portfolio && npm test -- noAnimatedBlur`
Expected: PASS, 2 tests passed.

- [ ] **Step 10: Verify it still looks right**

Run: `cd /d/Portfolio && npm run dev`

Visit `http://localhost:5173/#voyage` and scroll to the singularity and re-entry scenes. The accretion disk and pulsar beam should still read as soft-edged glows. Stop the server.

- [ ] **Step 11: Commit**

```bash
cd /d/Portfolio && git add src/styles/journey.css src/styles/__tests__/noAnimatedBlur.test.js && git commit -m "perf: replace animated blur with pre-baked gradients in the voyage"
```

---

### Task 6: Stop off-screen scenes animating

Fifteen infinite animations currently run whether or not their scene is visible.

**Files:**
- Create: `src/journey/observeInView.js`
- Create: `src/journey/__tests__/observeInView.test.js`
- Modify: `src/journey/hooks.js` (`useScene` and `usePin`)
- Modify: `src/styles/journey.css` (append)

**Interfaces:**
- Consumes: `useScene` / `usePin` from `src/journey/hooks.js` (Task 7 also edits this file — if Task 7 ran first, keep its damping intact).
- Produces: `observeInView(el, onChange, { rootMargin?: string }): () => void` — calls `onChange(boolean)` as the element enters and leaves, returns a cleanup function. Calls `onChange(true)` immediately and returns a no-op when `IntersectionObserver` is unavailable.

**Why the hook and not each component:** six components render `.scn` — `Launch`, `Origins`, `Reentry`, `Singularity`, `TwinLights`, `WorldScene` — and all six call `useScene()`. The most expensive animations (`.pulsar-beam`, `.nova-rays` in `TwinLights`; `.bh-disk` in `Singularity`) are *not* in `WorldScene`. Parking belongs in the shared primitive that already owns the ref, so no scene can be missed and there is one place to change.

- [ ] **Step 1: Write the failing test**

Create `src/journey/__tests__/observeInView.test.js`:

```js
import { describe, it, expect, vi, beforeEach } from 'vitest'
import { observeInView } from '../observeInView'

let trigger
let observed
let disconnected

beforeEach(() => {
  trigger = null
  observed = []
  disconnected = 0
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb) {
        trigger = cb
      }
      observe(el) {
        observed.push(el)
      }
      disconnect() {
        disconnected++
      }
    },
  )
})

describe('observeInView', () => {
  it('observes the element it is given', () => {
    const el = document.createElement('div')
    observeInView(el, () => {})
    expect(observed).toEqual([el])
  })

  it('reports entering and leaving', () => {
    const seen = []
    observeInView(document.createElement('div'), (v) => seen.push(v))
    trigger([{ isIntersecting: true }])
    trigger([{ isIntersecting: false }])
    expect(seen).toEqual([true, false])
  })

  it('uses the last entry when several arrive at once', () => {
    const seen = []
    observeInView(document.createElement('div'), (v) => seen.push(v))
    trigger([{ isIntersecting: true }, { isIntersecting: false }])
    expect(seen).toEqual([false])
  })

  it('passes rootMargin through and disconnects on cleanup', () => {
    const stop = observeInView(document.createElement('div'), () => {}, {
      rootMargin: '50px',
    })
    stop()
    expect(disconnected).toBe(1)
  })

  it('reports visible and no-ops when IntersectionObserver is missing', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const seen = []
    const stop = observeInView(document.createElement('div'), (v) => seen.push(v))
    expect(seen).toEqual([true])
    expect(() => stop()).not.toThrow()
  })

  it('reports visible and no-ops when there is no element', () => {
    const seen = []
    const stop = observeInView(null, (v) => seen.push(v))
    expect(seen).toEqual([true])
    expect(() => stop()).not.toThrow()
  })
})
```

- [ ] **Step 2: Run the test to confirm it fails**

Run: `cd /d/Portfolio && npm test -- observeInView`
Expected: FAIL — `Failed to resolve import "../observeInView"`.

- [ ] **Step 3: Write the implementation**

Create `src/journey/observeInView.js`:

```js
/**
 * Call back as an element enters and leaves the viewport.
 *
 * Used to park a scene while it is scrolled past. Fifteen infinite animations
 * run across the voyage and almost none are visible at any moment, so parking
 * the off-screen ones is most of the win.
 *
 * Where IntersectionObserver is unavailable, reports visible and does nothing
 * further — a permanently frozen scene would be a worse failure than paying
 * for animation.
 */
export function observeInView(el, onChange, { rootMargin = '200px' } = {}) {
  if (typeof IntersectionObserver === 'undefined' || !el) {
    onChange(true)
    return () => {}
  }

  const observer = new IntersectionObserver(
    (entries) => onChange(entries[entries.length - 1].isIntersecting),
    { rootMargin },
  )
  observer.observe(el)
  return () => observer.disconnect()
}
```

- [ ] **Step 4: Run the test to verify it passes**

Run: `cd /d/Portfolio && npm test -- observeInView`
Expected: PASS, 6 tests passed.

- [ ] **Step 5: Apply parking inside `useScene` and `usePin`**

In `src/journey/hooks.js`, add to the imports:

```js
import { useEffect } from 'react'
import { observeInView } from './observeInView'
```

Add this helper above `useScene`:

```js
/**
 * Toggle the parked class on a scene as it enters and leaves view.
 *
 * Applied here rather than in each scene component: all six scenes go through
 * useScene/usePin, and the costliest animations are not in the one component
 * it would be easy to remember to change.
 */
function useParkWhenOffScreen(ref) {
  useEffect(
    () =>
      observeInView(ref.current, (inView) => {
        ref.current?.classList.toggle('scn-parked', !inView)
      }),
    [ref],
  )
}
```

Then call `useParkWhenOffScreen(ref)` inside both `useScene` and `usePin`, immediately after their `useScroll(...)` call.

- [ ] **Step 6: Add the parking styles**

Append to `src/styles/journey.css`:

```css
/* A scene scrolled well out of view pays nothing: its animations stop and the
   browser is free to skip rendering its subtree entirely. contain-intrinsic-size
   keeps the scroll height stable so parking cannot shift layout. */
.scn-parked *,
.scn-parked *::before,
.scn-parked *::after {
  animation-play-state: paused !important;
}

.scn-parked {
  content-visibility: auto;
  contain-intrinsic-size: auto 100vh;
}
```

- [ ] **Step 7: Verify nothing shifts, and that every scene parks**

Run: `cd /d/Portfolio && npm run build && npm run dev`

On `http://localhost:5173/#voyage`, scroll the full page top to bottom and back. Scene positions must not jump, and each world's planet and card must still animate in as it enters.

Then confirm parking reaches the expensive scenes — with the singularity scrolled out of view, run in the console:

```js
[...document.querySelectorAll('.scn')].map((s) => [s.id, s.classList.contains('scn-parked')])
```

Expected: every scene except the one or two currently on screen reports `true`, and `singularity` and `stars` are among them when scrolled away. Stop the server.

- [ ] **Step 8: Commit**

```bash
cd /d/Portfolio && git add src/journey/observeInView.js src/journey/__tests__/observeInView.test.js src/journey/hooks.js src/styles/journey.css && git commit -m "perf: park animations and rendering for off-screen voyage scenes"
```

---

### Task 7: Inertial scroll — the dreamy part

Every scene already reads its progress from `useScene()` / `usePin()`, so damping applied there makes the whole voyage float.

**Files:**
- Modify: `src/journey/hooks.js`

**Interfaces:**
- Consumes: nothing.
- Produces: `useScene(vh)` and `usePin()` keep their existing shapes — `{ ref, p, height }` and `{ ref, p }` — but `p` is now a damped `MotionValue`. No call site changes.

- [ ] **Step 1: Rewrite `src/journey/hooks.js`**

```js
import { useMemo, useRef } from 'react'
import { useScroll, useSpring, useReducedMotion } from 'framer-motion'

export const EASE = [0.21, 0.47, 0.32, 0.98]

/**
 * Scroll damping. Heavy and slow on purpose — the voyage should feel like a
 * ship with mass, not a value bound 1:1 to the wheel. Low stiffness plus high
 * damping gives a long, unhurried settle with no overshoot.
 */
const GLIDE = { stiffness: 42, damping: 22, mass: 1.1, restDelta: 0.0005 }

const isCoarsePointer = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(pointer: coarse)').matches

/**
 * Damped pinned-scene progress. Reduced-motion users get the raw value, since
 * the drift itself is motion they have asked not to see.
 */
function useGlide(raw) {
  const reduced = useReducedMotion()
  const smooth = useSpring(raw, GLIDE)
  return reduced ? raw : smooth
}

/** Pinned-scene progress. Scene height shrinks on touch so each needs less thumb. */
export function useScene(vh) {
  const ref = useRef(null)
  const coarse = useMemo(isCoarsePointer, [])
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })
  return {
    ref,
    p: useGlide(scrollYProgress),
    height: `${Math.round(vh * (coarse ? 0.74 : 1))}vh`,
  }
}

/** Raw pinned progress (full height), damped the same way. */
export function usePin() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })
  return { ref, p: useGlide(scrollYProgress) }
}
```

- [ ] **Step 2: Verify the build**

Run: `cd /d/Portfolio && npm run build`
Expected: `✓ built in ...`.

- [ ] **Step 3: Feel it**

Run: `cd /d/Portfolio && npm run dev`

On `http://localhost:5173/#voyage`, scroll with a mouse wheel in short bursts. Planets and cards should continue settling for a beat after the wheel stops, with no visible overshoot or wobble. If it feels sluggish rather than weighty, raise `stiffness` toward 55; if it wobbles, raise `damping`. Stop the server.

- [ ] **Step 4: Confirm reduced-motion still bypasses damping**

In the dev server, open DevTools → Rendering → *Emulate CSS prefers-reduced-motion: reduce*, reload `/#voyage`, and confirm scene progress tracks the scroll exactly with no drift.

- [ ] **Step 5: Commit**

```bash
cd /d/Portfolio && git add src/journey/hooks.js && git commit -m "feat: damp voyage scroll progress for weighted, cinematic motion"
```

---

### Task 8: Interstellar atmosphere

Grain and vignette do most of the cinematic work for almost no cost — one fixed overlay element, no per-frame work.

**Files:**
- Modify: `src/journey/Journey.jsx`
- Modify: `src/styles/journey.css` (append)

**Interfaces:**
- Consumes: nothing.
- Produces: a `.voyage-atmosphere` overlay inside `.journey`.

- [ ] **Step 1: Add the overlay element**

In `src/journey/Journey.jsx`, immediately after `<Starfield fx={fx} still={!!reduced} />`:

```jsx
      <div className="voyage-atmosphere" aria-hidden="true" />
```

- [ ] **Step 2: Style it**

Append to `src/styles/journey.css`:

```css
/* Film grain and vignette. A single fixed, non-interactive layer: the grain is
   an inline SVG turbulence tile, so there is no network request and nothing
   animates. Cheap, and it does most of the cinematic work. */
.voyage-atmosphere {
  position: fixed;
  inset: 0;
  z-index: 3;
  pointer-events: none;
  background-image:
    radial-gradient(ellipse 120% 90% at 50% 50%, transparent 42%, rgba(0, 0, 0, 0.55) 100%),
    url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='140' height='140'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='140' height='140' filter='url(%23n)' opacity='0.4'/%3E%3C/svg%3E");
  background-size: cover, 140px 140px;
  opacity: 0.5;
  mix-blend-mode: soft-light;
}

@media (prefers-reduced-motion: reduce) {
  .voyage-atmosphere {
    opacity: 0.32;
  }
}
```

- [ ] **Step 3: Add Gargantua's lensed arc**

The film's signature silhouette is the disk seen edge-on *plus* the lensed image of its far side arcing over the top of the shadow. `.bh-lens` currently only sits behind it. Append to `src/styles/journey.css`:

```css
/* The far side of the accretion disk, lensed up and over the event horizon —
   the shape that makes the silhouette read as Gargantua rather than a ring.
   A bordered ellipse clipped to its top half; no blur, no animation. */
.bh-arc {
  position: absolute;
  left: 50%;
  top: 50%;
  width: 200px;
  height: 116px;
  translate: -50% -50%;
  border-radius: 50%;
  border-top: 3px solid rgba(255, 214, 148, 0.78);
  border-left: 2px solid rgba(245, 169, 61, 0.34);
  border-right: 2px solid rgba(245, 169, 61, 0.34);
  border-bottom: none;
  clip-path: inset(0 0 46% 0);
  pointer-events: none;
}

@media (max-width: 760px) {
  .bh-arc {
    width: 150px;
    height: 88px;
  }
}
```

- [ ] **Step 4: Render the arc**

Run `cd /d/Portfolio && grep -n "bh-disk\|bh-photon\|bh-lens" src/journey/Singularity.jsx` to find the black-hole element group, then add `<span className="bh-arc" />` as a sibling immediately after the `bh-disk` element.

- [ ] **Step 5: Verify**

Run: `cd /d/Portfolio && npm run build && npm run dev`

On `/#voyage`, scroll to the singularity. Confirm: a subtle darkening toward the screen edges, a fine grain over the starfield, and a bright arc curving over the top of the black hole. The grain should be barely perceptible — if it reads as noise rather than texture, lower `.voyage-atmosphere` `opacity` to `0.38`. Confirm links and buttons still respond, since the overlay must not capture clicks. Stop the server.

- [ ] **Step 6: Commit**

```bash
cd /d/Portfolio && git add src/journey/Journey.jsx src/journey/Singularity.jsx src/styles/journey.css && git commit -m "feat: add film grain, vignette, and Gargantua's lensed arc to the voyage"
```

---

### Task 9: Complete the reduced-motion coverage

The current rule at `journey.css:1162` lists selectors by hand and has already drifted — `.meteor-glow` was dropped from it.

**Files:**
- Modify: `src/styles/journey.css` (the `@media (prefers-reduced-motion: reduce)` block around line 1160)
- Modify: `src/styles/__tests__/noAnimatedBlur.test.js` (add a coverage assertion)

**Interfaces:**
- Consumes: nothing.
- Produces: no consumable API.

- [ ] **Step 1: Add the failing assertion**

Append inside the existing `describe('journey.css paint cost', ...)` block in `src/styles/__tests__/noAnimatedBlur.test.js`:

```js
  /**
   * Extract every reduced-motion block by scanning balanced braces. There is
   * more than one such block in this file, and a regex spanning to the last
   * closing brace would silently match across unrelated rules.
   */
  function reducedMotionBlocks(source) {
    const blocks = []
    const opener = /@media\s*\(prefers-reduced-motion:\s*reduce\)\s*\{/g
    let match
    while ((match = opener.exec(source))) {
      let depth = 1
      let i = match.index + match[0].length
      const start = i
      while (i < source.length && depth > 0) {
        if (source[i] === '{') depth++
        else if (source[i] === '}') depth--
        i++
      }
      blocks.push(source.slice(start, i - 1))
    }
    return blocks
  }

  it('stops every animation under reduced motion, without naming selectors', () => {
    const blocks = reducedMotionBlocks(css)
    expect(blocks.length, 'no reduced-motion block found').toBeGreaterThan(0)
    const wildcard = blocks.some((b) =>
      /(^|[\s,{])\*\s*,[\s\S]*?animation:\s*none\s*!important/.test(b),
    )
    expect(wildcard, 'no wildcard animation:none rule under reduced motion').toBe(true)
  })
```

- [ ] **Step 2: Run it to confirm it fails**

Run: `cd /d/Portfolio && npm test -- noAnimatedBlur`
Expected: FAIL on the new assertion — the block enumerates selectors instead of using a wildcard.

- [ ] **Step 3: Replace the hand-maintained selector list**

Replace the `.float-slow, .float-slower, .nova-rays, ... { animation: none !important }` rule inside the reduced-motion block with a wildcard, so no future animation can be missed:

```css
  *,
  *::before,
  *::after {
    animation: none !important;
    transition-duration: 0.01ms !important;
    scroll-behavior: auto !important;
  }
```

- [ ] **Step 4: Run the tests**

Run: `cd /d/Portfolio && npm test`
Expected: PASS, all tests.

- [ ] **Step 5: Verify visually**

Run: `cd /d/Portfolio && npm run dev`

With *Emulate CSS prefers-reduced-motion: reduce* enabled, load `/#voyage` directly. Nothing should move — no spin, no float, no pulse, and the starfield should render a single static frame. Stop the server.

- [ ] **Step 6: Commit**

```bash
cd /d/Portfolio && git add src/styles/journey.css src/styles/__tests__/noAnimatedBlur.test.js && git commit -m "fix: stop every animation under reduced motion, not a hand-listed subset"
```

---

### Task 10: Reduced-effects tier for small and low-powered devices

**Files:**
- Modify: `src/styles/journey.css` (append)

**Interfaces:**
- Consumes: nothing.
- Produces: no consumable API.

- [ ] **Step 1: Append the tier**

```css
/* Phones do the least well with large composited glows, and they are where the
   lag was most obvious. Drop the widest, softest layers and slow the rest —
   the scene still reads, at a fraction of the fill cost. */
@media (max-width: 760px) {
  .nova-rays,
  .pulsar-beam,
  .bh-lens {
    display: none;
  }

  .bh-disk {
    animation-duration: 26s;
  }

  .voyage-atmosphere {
    opacity: 0.34;
  }
}
```

- [ ] **Step 2: Verify at mobile width**

Run: `cd /d/Portfolio && npm run build && npm run dev`

In DevTools device toolbar at 390×844, load `/#voyage` and scroll through the singularity scene. It should stay legible and scroll smoothly. Stop the server.

- [ ] **Step 3: Commit**

```bash
cd /d/Portfolio && git add src/styles/journey.css && git commit -m "perf: drop the widest glow layers on small screens"
```

---

### Task 11: Verify against the acceptance criteria

Confirms the spec's measurable criteria on a real build before anything is deployed.

**Files:**
- Create: `scripts/audit.js`

**Interfaces:**
- Consumes: a running preview server.
- Produces: `node scripts/audit.js` prints the measured counts. Run against `npm run preview`.

- [ ] **Step 1: Write the audit snippet**

Create `scripts/audit.js`. This is pasted into the browser console rather than run by Node — it needs a live document.

```js
/**
 * Paste into the DevTools console on a built preview to check the spec's
 * measurable acceptance criteria. Run once on `/` and once on `/#voyage`.
 */
;(() => {
  const all = [...document.querySelectorAll('*')]
  const infinite = all.filter((el) => {
    const cs = getComputedStyle(el)
    return cs.animationName !== 'none' && cs.animationIterationCount === 'infinite'
  })
  const blurred = all.filter((el) => /blur\(/.test(getComputedStyle(el).filter))
  const backdrop = all.filter((el) => getComputedStyle(el).backdropFilter !== 'none')
  const both = blurred.filter((el) => getComputedStyle(el).animationName !== 'none')

  console.table({
    hash: location.hash || '(none)',
    nodes: all.length,
    scrollHeight: document.body.scrollHeight,
    infiniteAnimations: infinite.length,
    blurredElements: blurred.length,
    backdropFilters: backdrop.length,
    blurredAndAnimated: both.length,
  })
  return { infinite, blurred, backdrop, both }
})()
```

- [ ] **Step 2: Build and serve**

```bash
cd /d/Portfolio && npm run build && npm run preview
```

- [ ] **Step 3: Audit the dossier**

Load `http://localhost:4173/` and run the snippet.

Expected, per the spec: `infiniteAnimations: 0`, `blurredElements: 0`, `backdropFilters: 0`.

- [ ] **Step 4: Audit the voyage**

Load `http://localhost:4173/#voyage` and run the snippet.

Expected: `blurredAndAnimated: 0` and `backdropFilters: 0`. `infiniteAnimations` will be non-zero — that is correct, the voyage is meant to move; what matters is that off-screen scenes are parked, verified in Task 6.

- [ ] **Step 5: Measure frame timing**

With `/#voyage` loaded and the window **visible** (rAF does not run in a hidden window), run:

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

Expected per the spec: `framesOver34ms: 0`. Record the actual numbers — if any frames exceed 34 ms, note which scene was on screen and investigate before deploying.

- [ ] **Step 6: Confirm the dossier content is unchanged**

```bash
cd /d/Portfolio && node -e "
const fs=require('fs');
const a=fs.readFileSync('backup/live-2026-07-15/index.html','utf8');
const b=fs.readFileSync('dist/index.html','utf8');
const meta=s=>[...s.matchAll(/<meta[^>]*>/g)].map(m=>m[0]).sort().join('\n');
console.log(meta(a)===meta(b)?'meta tags unchanged':'META TAGS DIFFER');
"
```

Expected: `meta tags unchanged` — the OG card must survive so links already in applications keep their preview.

- [ ] **Step 7: Check every outbound link still resolves**

```bash
cd /d/Portfolio && for u in \
  "https://rishabh-somvanshi-developer.netlify.app/Rishabh_Somvanshi_Resume.pdf" \
  "https://wedding-commander.netlify.app/" \
  "https://expense-tracker-monumental.netlify.app/" \
  "https://linkedin.com/in/rishabh-somvanshi-149103135" \
  "https://github.com/Rishabh-somvanshi"; do
  printf '%-70s %s\n' "$u" "$(curl -o /dev/null -s -w '%{http_code}' -L "$u")"
done
```

Expected: `200` for each.

- [ ] **Step 8: Commit**

```bash
cd /d/Portfolio && git add scripts/audit.js && git commit -m "test: add an acceptance-criteria audit snippet"
```

---

## Deliberate deviations from the spec

Recorded here so a reviewer can challenge them rather than discover them.

- **Hardware-based effect tiering was dropped.** The spec asks for a reduced-effects tier keyed on `navigator.deviceMemory` and `hardwareConcurrency` as well as viewport. Task 10 uses viewport only. `deviceMemory` is unimplemented in Safari and Firefox, and `hardwareConcurrency` correlates poorly with GPU fill rate, which is what actually costs here. A width media query is the more reliable proxy and adds no JavaScript. If measurement later shows specific devices struggling, revisit with real data.
- **The palette tokens are unchanged.** The spec's aesthetic section calls for a "deeper near-black base", but the Global Constraints fix `--bg: #0a0a0b`. The deepening is achieved by the vignette in Task 8, which darkens the frame edges without touching the tokens the dossier also depends on.
- **Long crossfades and slower reveal timing are not separately tasked.** Task 7's damping changes the timing of every scene transition at once, which covers the intent. If the result still feels hurried after Task 7, tune the per-scene `useTransform` input ranges in `WorldScene.jsx` then — tuning before feeling the damped result would be guesswork.

## Deferred — needs the user

These are outside the plan because they need credentials or a decision that is not mine to make.

- **Push to GitHub.** The remote `https://github.com/Rishabh-somvanshi/Portfolio.git` is configured but authentication fails — no credential helper is set up on this machine. Rick runs `git push -u origin main` once from his own terminal in `D:\Portfolio` to let Git Credential Manager cache a browser login; after that, pushes work.
- **Deploy.** Per the spec, the rebuild goes to a Netlify **preview** URL first, and production is updated only on Rick's explicit approval. The production URL is in live job applications.
