# Voyage 3D — Design Spec

**Date:** 2026-09-23
**Status:** Approved in brainstorming; awaiting written-spec review
**Scope:** Rebuild the opt-in Voyage mode as one continuous WebGL world with a
generative, scroll-reactive soundscape. The résumé view (dossier) is out of scope
and must not change, except that it stops shipping Voyage code.

---

## 1. Goals and non-goals

**Goals**

- Voyage feels like flying one camera through a single 3D world (reference:
  joseph-san.com), from Launch to Home, driven by scroll.
- Generative music synthesised live in the browser that follows the story and
  the scroll.
- Same experience on phones, with adaptive quality.
- No preloader gate: text content is visible in under 1s.
- Remove the black "dead scroll" frames between scenes.

**Non-goals**

- No changes to the résumé view's layout, content or behaviour.
- No new content. Every word in the Voyage stays as it is today.
- No audio files, textures or 3D model files. Everything is procedural.
- No separate "desktop-only" Voyage and no mobile gate.

## 2. Decisions made

| Decision | Choice |
|---|---|
| Camera model | One continuous world; scroll drives a single camera along a spline |
| Music | Generative Web Audio, scroll-reactive, no library (Tone.js is the fallback) |
| Mobile | Same 3D, adaptive quality tiers |
| Sound default | On at voyage entry (the entry click is the user gesture); obvious mute; remembered |
| 3D stack | React Three Fiber v8 (React 18 line) + drei + @react-three/postprocessing |

## 3. Architecture

### 3.1 Chunks

```
App ──React.lazy──► voyage-shell  (small)   text layer, HUD, Lenis, progress store, audio engine
                        └──React.lazy──► voyage-world (≤ 300 KB gz)  <Canvas>, three, R3F, drei, shaders
```

- `App.jsx` currently imports `Journey` eagerly. That import becomes `React.lazy`
  plus `Suspense`, so the résumé view no longer downloads any Voyage code.
- The shell renders text immediately. The world chunk loads behind it and fades in.

### 3.2 Layers

```
z0  <Canvas> fixed full-screen     one scene graph, one camera
z1  HTML text layer                existing scene sections (DOM: selectable, accessible)
z2  HUD                            logo · progress rail · SoundToggle · "Résumé view →"
--  AudioEngine                    plain JS module, not a React tree
```

### 3.3 Single source of motion

```
native scroll → Lenis (existing, gated off for touch/reduced motion)
             → progress store { p: 0..1, velocity }   (mutable ref, never React state)
                ├─ useFrame: CameraRig reads p → spline position/look-at
                ├─ framer-motion: text fades (existing useScene per section, unchanged)
                └─ AudioEngine: score(p, velocity) → voice gains, filters, pan
```

- `p = scrollY / (documentHeight − innerHeight)`. Lenis smooths it where Lenis is active.
- Scene windows on `p` come from the real DOM section offsets (`sceneWindows.js`),
  measured on mount and on resize. The DOM section heights stay the single
  source of timing, so text and camera cannot drift apart.
- Nothing at 60fps goes through React state.

### 3.4 Dwell / fly camera

- Each scene has a **station**: `{ position, target }`. The stations are joined
  by a CatmullRom spline (`THREE.CatmullRomCurve3`).
- In each scene's window, the camera **dwells** for the middle portion (slow
  drift/orbit while the card is readable). It **flies** between stations during
  the transition portion (fast; warp streaks, whoosh audio, cards hidden).
- The dwell/fly mapping is a monotonic easing from the scene window to the spline
  parameter, so scrolling backwards retraces exactly.
- The HUD rail's `goTo(id)` still scrolls to a section. The camera follows because
  it is driven by `p`.

### 3.5 World layout

Order of stations. The path spirals in toward Earth, because the way home runs
back through time:

```
LAUNCH (deep field) → CURO → MERCANTILE (+3 moons) → VAULT → PORCELAIN
→ ORIGIN FIELD → TWIN LIGHTS (supernova, pulsar) → SINGULARITY → RE-ENTRY → HOME (Earth)
```

Exact coordinates are tuned during implementation in `camera/stations.js`.

## 4. Visuals

### 4.1 Rules

- 100% procedural (shaders + geometry). Zero texture or model downloads.
- Keep the existing muted palettes (from `Planet.jsx` `WORLD_VISUALS`). Amber is
  the only accent, reserved for "you" moments (sun glint, 5★ meteor, current pulse).
- One directional "sun" light, so every body has a day/night side.
- Each world's visual idea comes from its log line.

### 4.2 Worlds

| World | Palette | Visual |
|---|---|---|
| Curo (current) | `#6fa398 → #1e3833`, teal aura | fbm continents; drifting cloud layer ("care moves like weather"); aura pulses at ~60 bpm, a heartbeat |
| Mercantile | `#c08b52 → #452b18` | gas giant with fast-flowing bands; 14 twinkling night-side city lights; 3 moons rise into orbit one by one, labelled Applause · Best Performer · On-The-Spot (drei `<Html>` DOM labels) |
| Vault | `#7c98a1 → #233238`, ring | faceted low-poly sphere with glowing meridian seams; a hex shield lattice sweeps the surface once on arrival (3-D Secure / OTP "gates") |
| Porcelain | `#c9a79b → #4a3733`, ring | glossy ceramic (`MeshPhysicalMaterial` clearcoat, faint iridescence); the only world that does not rotate ("product data had to hold still") |

### 4.3 Other scenes

| Scene | Visual | DOM content kept |
|---|---|---|
| Launch | deep field, faint amber nebula, camera creeps forward | name, sub, clients, chips, CTAs |
| Origins | instanced meteors streak past the camera with trails; 4 labelled (Data structures · Algorithms · C·Python · 5★ HackerRank, the last in amber) | copy |
| Twin Lights | Supernova: a shockwave shell detonating with scroll. Pulsar: a neutron star with two sweeping beams at a fixed period (= the audio tick) | both study cards |
| Singularity | accretion disk (brighter on its approaching side), event horizon, screen-space gravitational lensing of the starfield; the existing SVG astronaut as a billboard falling in and stretching | copy, "time dilates here", skill manifest |
| Re-entry | camera dives; stars stretch into warp streaks; heat glow at the screen edges | stats |
| Home | Earth at dawn: sun cresting the limb, night-side city lights, camera settles in low orbit | contact block; the standing astronaut stays a DOM illustration |

### 4.4 Post-processing

Selective bloom (bright elements only), soft vignette and light film grain,
all gated by tier (§6).

## 5. Audio

### 5.1 Graph (raw Web Audio API)

```
bed drone ─┐
scene voices ─┤→ per-voice gains → lowpass → ┬→ dry ──────┐
motion layer ─┤   (crossfaded)               ├→ reverb ───┤→ limiter (DynamicsCompressor) → master gain → destination
one-shots ────┘                              │  (generated impulse)
                                             └→ AnalyserNode → SoundToggle bars
```

### 5.2 Score

All in one key family (C major / A minor), so crossfades never clash. The arc
runs from tension to resolution.

| Scene | Sound |
|---|---|
| Launch | near silence; sparse high star-glints |
| Curo | warm Cmaj7 pad; volume swells at 60 bpm, locked to the aura pulse |
| Mercantile | brighter pad + faint 8th-note arpeggio; 3 bell pings as the moons rise |
| Vault | low tense drone (dissonant cluster); a metallic ping on the shield sweep |
| Porcelain | sparse glassy FM bells; no rhythm |
| Origins | filtered-noise whooshes panned with each meteor's screen x |
| Twin Lights | supernova: sub drop + noise burst, scrubbed by scroll; pulsar: a soft tick at the beam period |
| Singularity | pitch bends down + lowpass closes; total silence at the horizon; pad returns with the manifest |
| Re-entry | rumble rising with the warp |
| Home | resolves to a full, warm Cmaj9 |

### 5.3 Scroll mapping (`score.js`, pure)

- Scene weights from `p` → equal-power crossfade between neighbouring scene voices.
- `velocity` → whoosh gain + filter opening. Stopping leaves only the dwell pad.
- Screen x of the focal object → `StereoPannerNode`.

### 5.4 Lifecycle

| Event | Behaviour |
|---|---|
| "Take the voyage" click | create `AudioContext` inside the handler; 3s fade-in, unless the stored preference is muted |
| Deep link `#voyage` (no gesture) | context suspended; HUD shows "♪ tap for sound"; the first pointerdown/keydown resumes it |
| Mute (button or `M` key) | 0.3s ramp to 0, then `suspend()`; saved as `rs.sound` in localStorage (wrapped in try/catch like `viewMode.js`) |
| Tab hidden / visible | fade + suspend / resume |
| Exit to the résumé view | 0.5s fade, then `close()` |
| prefers-reduced-motion | sound off by default |
| CPU guard | live voices only for the current scene ±1; hard cap ~24 oscillators |
| Level | conservative master gain + limiter |

### 5.5 SoundToggle

A HUD button with equaliser bars driven by real analyser levels.
`aria-pressed`, accessible label "Sound on"/"Sound off", `M` shortcut.

## 6. Performance

### 6.1 Tiers (`quality/tiers.js`)

| | HIGH | MEDIUM | LOW |
|---|---|---|---|
| DPR | min(2, device) | 1.5 | 1 |
| Post | bloom + vignette + grain | bloom (half-res) | none |
| Lensing | screen-space warp | sprite ring | static glow ring |
| Stars | 20k | 10k | 4k |
| Planet noise octaves | 5 + clouds | 3 + clouds | 2, no clouds |
| Meteors | 400 with trails | 200 | 80, short trails |

- Start: coarse pointer → LOW; otherwise MEDIUM.
- drei `<PerformanceMonitor>` + `<AdaptiveDpr>`: FPS ≥ 55 for 3s → step up;
  FPS < 40 for 2s → step down; lock after 3 switches.

### 6.2 Loading

- The DOM text renders instantly. The canvas fades in when ready. There is no progress screen.
- `gl.compile(scene, camera)` runs during the Launch dwell to pre-compile every
  material, so no shader-compile hitch happens mid-scroll.

### 6.3 Fallbacks

| Condition | Behaviour |
|---|---|
| No WebGL / context creation fails | error boundary → DOM text over the existing 2D `Starfield.jsx` |
| Context lost mid-voyage | one restore attempt; otherwise the same 2D fallback |
| prefers-reduced-motion via `#voyage` | camera cuts between stations (no flight, no warp); sound off |
| Leaving the Voyage | dispose geometries, materials, render targets; close the AudioContext |

### 6.4 Budgets

- voyage-world chunk ≤ 300 KB gzipped.
- The résumé view's JS is smaller than on the current build.
- The Voyage's first content is the DOM name, not the canvas.
- 60 fps on a mid-range desktop; ≥ 45 fps on a mid-range Android.
- < 100 draw calls, < 300k triangles.

## 7. Files

### 7.1 New

```
src/data/voyage.js                     WORLDS + station data (moved out of Journey.jsx; palettes from Planet.jsx)
src/voyage3d/World.jsx                 <Canvas> root + WebGL error boundary
src/voyage3d/store.js                  mutable progress store
src/voyage3d/sceneWindows.js           pure: section offsets → windows
src/voyage3d/camera/stations.js
src/voyage3d/camera/CameraRig.jsx
src/voyage3d/objects/{Starfield3D,Planet3D,Moons,MeteorField,Supernova,Pulsar,BlackHole,ReentryStreaks,Earth,AstronautBillboard}.jsx
src/voyage3d/shaders/{planet,atmosphere,accretion,lensing,earth}.glsl.js
src/voyage3d/quality/{tiers.js,QualityProvider.jsx,Effects.jsx}
src/voyage3d/audio/{engine.js,voices.js,score.js,SoundToggle.jsx}
```

### 7.2 Modified

- `App.jsx`: lazy `Journey` + Suspense.
- `journey/Journey.jsx`: becomes the shell (Lenis, store feed, text sections, HUD, lazy `<World>`, audio lifecycle).
- `WorldScene`, `Origins`, `TwinLights`, `Singularity`, `Reentry`, `Home`: remove the decorative visuals, keep all copy and cards.
- `Hud.jsx`: add SoundToggle.
- Footer / Home credit: "React + Framer Motion" → "React Three Fiber · Web Audio".
- `package.json`: add `three`, `@react-three/fiber@8`, `@react-three/drei@9`, `@react-three/postprocessing@2`.
- `scripts/audit-static.mjs`: add chunk-size budgets.

### 7.3 Deleted

- `journey/Planet.jsx` (palettes move to `data/voyage.js`).
- The `journey.css` rules for planets, moons, nova, pulsar, `bh-*`, earth, meteors and `reentry-heat`.

### 7.4 Kept as is

`Launch.jsx`, `hooks.js`, `lenisController.js`, `observeInView.js`, `Astronaut.jsx`,
`Starfield.jsx` (now the 2D fallback), `lib/viewMode.js`, the whole résumé view.

## 8. Testing

**Unit (vitest).** Logic lives in pure modules so it can be tested without WebGL.

- `sceneWindows`: windows are contiguous and cover 0..1; they recompute on resize input.
- camera: p → station index; the dwell easing is monotonic; every p gives a finite position.
- `tiers`: FPS history → tier; step thresholds; lock after 3 switches.
- `score`: equal-power gains sum ≈ 1; silence at the horizon; velocity → whoosh.
- audio engine (mocked `AudioContext`): created only on a gesture; suspended when muted;
  closed on exit; `rs.sound` persisted and restored.
- Fallback: jsdom has no WebGL, so rendering the Voyage must show the 2D fallback and all scene text.
- Existing tests (`viewMode`, `smoke`, `storageShim`, `noAnimatedBlur`, `App`, `observeInView`, `useScene`) stay green.

**Build.** `npm run audit` enforces the §6.4 chunk budgets.

**Visual.** Screenshot every station at the desktop and mobile presets in the
browser pane. An FPS overlay is available behind `?debug`.

**Real device.** Rick does one pass on his phone before deploy.

## 9. Delivery

Branch `feat/voyage-3d` in `D:\Portfolio` → build → back up the current live `dist`
(same pattern as `backup/live-2026-07-15`) → Netlify deploy after the real-device pass.

## 10. Risks

| Risk | Mitigation |
|---|---|
| Phone GPU/thermal throttling | LOW tier default on touch; auto step-down; no post on LOW |
| Hand-built synthesis sounds cheap | swap voices to Tone.js, lazy-loaded in the shell chunk |
| Lensing pass is expensive | HIGH tier only; sprite/static substitutes below |
| Scroll/camera desync after resize or font load | windows re-measured on resize and `document.fonts.ready` |
| Bundle growth | separate world chunk; tree-shaken drei imports; audit budget fails the build |
