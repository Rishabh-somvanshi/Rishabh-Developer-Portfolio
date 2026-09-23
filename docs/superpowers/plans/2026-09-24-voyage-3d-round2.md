# Voyage 3D — Round 2 (Rick's first review)

> For agentic workers: execute task-by-task with superpowers:subagent-driven-development. Each task is a self-contained brief. TDD wherever logic can be pure; WebGL/GLSL parts are verified by build + the controller's browser pass.

**Context.** Round 1 (plan `2026-09-23-voyage-3d.md`) is merged on branch `feat/voyage-3d` and draft-deployed. Rick's feedback (2026-09-24): text unreadable where soft white shapes sit behind it; planets sit left of their slots on a full laptop screen; overlaps in the TCS (Mercantile) scene; planets look "fidgety and not real"; wants a real track (Pixabay: NastelBom — "Hip Hop Background", pixabay.com/music/beats-hiphop-background-355726/) with its drop timed to the voyage; phone experience: planets misplaced/cut off, laggy, text hard to read. Animations are smooth.

**Decisions (approved by Rick).** Photo textures (Solar System Scope, CC BY 4.0, credited) replace procedural planet surfaces — this lifts the round-1 "no texture files" rule for planets/moons/rings/Earth only. The generative pads are replaced by his chosen track; non-tonal one-shot SFX stay. Everything else in the round-1 Global Constraints still binds (bundle split, shell-side modules three-free, nothing per-frame in React state, no per-frame allocations, amber the only UI accent, résumé view unchanged, reduced motion honoured, WebGL2 fallback).

## Global constraints for round 2
- Branch `feat/voyage-3d`, repo `D:\Portfolio`; commits end with exactly `Co-Authored-By: Claude Opus 5.5 <noreply@anthropic.com>`; stage only your files; never `git add -A`; never touch `.superpowers/`.
- `npm run audit` must keep passing (entry three-free, shell three-free, world JS ≤ 300 KB gz, résumé entry smaller than pre-rebuild). Texture/audio files live in `public/` and are not part of JS budgets; they must only be requested once the voyage opens.
- No `backdrop-filter`, no animated `filter: blur` (existing CSS tests).
- Reduced motion: no self-driven motion (use `useStill()` from `src/voyage3d/MotionContext.jsx`).

---

## R1 — Readability
- Nebula (`src/voyage3d/objects/Nebula.jsx`, `shaders/nebula.glsl.js`): cut its alpha to ~30% of today's (0.1 → 0.03) and push the plane further back/out of the card areas (e.g. z −1400, and bias its mask away from the screen centre band) so no soft light shapes sit behind text.
- Text scrims (`src/styles/journey.css`): give every voyage text block a soft dark vignette so text contrast holds over any planet or star: `.world-card`, `.study-card-j`, `.scene-copy`, `.manifest`, `.reentry-stats` container (`.scene-copy` covers it), `.home-inner`. Implement as a `::before` pseudo-element on the block (`position:absolute; inset: -2rem -2.5rem; z-index:-1; pointer-events:none; background: radial-gradient(ellipse at center, rgba(10,10,11,0.78) 0%, rgba(10,10,11,0.55) 45%, rgba(10,10,11,0) 75%)`), the block itself `position: relative; isolation: isolate`. Stronger on phones (`@media (max-width: 900px)`: inner stop 0.86). No blur, no backdrop-filter.
- Test: extend `src/styles/__tests__/voyageCssCleanup.test.js` (or a new `voyageReadability.test.js`) to assert a `::before` scrim rule exists for `.world-card` and `.scene-copy` and contains no `blur(`/`backdrop-filter`.

## R2 — Framing
- `src/voyage3d/camera/path.js`: `DRIFT = 0` (the camera holds its station while a card is pinned; the dwell drift was sliding planets out of their slots). Update the doc comment. Path tests must stay green (monotonic, arrive at station).
- `src/voyage3d/camera/framing.js`: `CAMERA_FOV = 30` (a 50° lens on wide screens stretched off-centre planets into ovals). World.jsx already reads CAMERA_FOV for the Canvas camera. Framing tests are FOV-agnostic and must stay green; stations clearance test must stay green.
- `src/voyage3d/objects/Moons.jsx`: moons must stay inside the planet's slot box (slot half-width ≈ planet radius / 0.62 ≈ 1.6 r). Orbit radii `r × (1.2, 1.35, 1.5)`, orbit ellipse flattened (z factor 0.35), rise offset ≤ 0.6 r; label anchor just below each moon (`[0, -radius*0.22, 0]` in moon-local space) so labels don't drift toward the card/HUD rail.

## R3 — Photo-real planets
Sources are already downloaded to `D:\Portfolio\.textures-src\` (gitignored): `2k_jupiter.jpg, 2k_neptune.jpg, 2k_venus_atmosphere.jpg, 2k_mercury.jpg, 2k_moon.jpg, 2k_earth_daymap.jpg, 2k_earth_nightmap.jpg, 2k_earth_clouds.jpg, 2k_saturn_ring_alpha.png` (Solar System Scope, CC BY 4.0).
1. Tooling: `npm install -D sharp`. Script `scripts/textures.mjs` (`npm run textures`) converts to `public/textures/*.webp`: jupiter, neptune, venus, earth_day, earth_night → 2048×1024 q80; mercury, moon → 1024×512 q78; earth_clouds → 2048×1024 q70 (greyscale is fine); saturn_ring → keep alpha, 1024×64 lossless webp. Commit the WebP outputs + `public/textures/CREDITS.md` (source URL, licence, which body uses which file). Report total bytes (target ≤ 2 MB).
2. `Planet3D` gets texture support while keeping today's lighting model (single SUN_DIR, soft terminator, amber night lights for Mercantile/Earth, Vault seams + shield sweep): new optional props `map` (albedo texture), `tint` (colour multiplied/mixed in to keep each world's palette), `nightMap` (Earth), `cloudMap`. When `map` is given the surface shader samples it by the sphere UV instead of fbm; the surface no longer morphs over time — realism comes from rotation only. Cloud layer = textured sphere 1.012 r rotating slowly (0.4× surface spin), alpha from the cloud map's luminance. Atmosphere thinner/softer: scale 1.04, fresnel power 4, lower intensity. Add limb darkening (`day *= mix(0.75, 1.0, pow(max(dot(n, viewDir),0.), 0.35))`).
3. Mapping: Curo = neptune tinted toward `#6fa398` + earth_clouds layer, aura pulse kept; Mercantile = jupiter (little/no tint) + amber night lights, moons = moon texture; Vault = mercury tinted toward `#7c98a1`, faceted look dropped (smooth sphere) but seams + shield kept, ring = saturn_ring alpha tinted `#77878d`; Porcelain = venus under MeshPhysicalMaterial clearcoat (map on the physical material), never rotates, ring tinted `#a08a82`; Earth = earth_day + earth_night (night lights on the dark side) + earth_clouds.
4. Loading: textures load via drei `useTexture` inside a `<Suspense fallback={null}>` wrapping the bodies only (stars/nebula/camera render immediately). Set `colorSpace = SRGBColorSpace` on albedo maps, anisotropy 4. Precompile must run after textures resolve (e.g. Precompile inside the same Suspense, or re-run when bodies mount).
5. Anti-aliasing: `<Canvas gl={{ antialias: true }}>` (LOW, no composer); EffectComposer `multisampling` from a new tier setting `msaa` (low 0, medium 2, high 4) in `quality/tiers.js` (update its tests).
6. Credits: Home footer line gains ` · Planet textures: Solar System Scope (CC BY 4.0)` linking https://www.solarsystemscope.com/textures/ (Rick approved).
7. `chunkBoundary`/audit stay green; report the World chunk gz.

## R4 — Music: Rick's track, drop on cue
Track file (Rick downloads it): `public/audio/voyage.mp3`. Timing constants in `src/data/voyage.js`: `TRACK = { src: '/audio/voyage.mp3', introEnd: <s>, dropAt: <s> }` (the controller supplies the numbers after analysing the file).
- Playback through Web Audio so mute/limiter/lowpass/duck/visibility/dispose keep working: an `HTMLAudioElement` → `createMediaElementSource` → the engine's bus.
- Gesture: browsers require play() inside the gesture. `primeAudio()` (called synchronously in the "Take the voyage" click) also creates the audio element and calls `play()`; the engine adopts both. The deep-link path creates/plays it inside `startFromGesture()`.
- Score: from 0 the track plays its intro, looping [0, introEnd) until the reader's first flight into Curo (store.index === 0 && store.travel > 0.5, or index ≥ 1); then a 0.15 s fade-out → seek to `dropAt` → fade-in, and the rest plays; at the end it loops [dropAt, duration). Singularity: `bend` (0 → −1200 cents) maps to `playbackRate` 1 → 0.8 (set `preservesPitch = false` so pitch sinks with time), lowpass + silence at the horizon as today, then back to 1.
- Voices: drop the tonal pads and the bed; keep non-tonal SFX only: origins meteor whooshes, supernova boom (nova), pulsar tick, re-entry rumble (heat). Remove moon bells, vault ping, launch glints, porcelain bells, arpeggio (tests updated accordingly; oscillator budget still holds).
- Mute/visibility/dispose pause/resume the element too; the file must not be requested until the voyage opens (preload none until primed).
- Tests: engine tests for intro-loop → drop switch (fake element with currentTime/playbackRate/play/pause), the singularity rate mapping as a pure function in `score.js`, and the gesture path.

## R5 — Phone
- Frame cap: on coarse pointers the Canvas uses `frameloop="demand"` and a small `FrameDriver` component calls `invalidate()` at most ~30 times/s while the page is visible (halves GPU/battery on phones; desktop unchanged). Reduced motion: still render on scroll (scroll changes invalidate too).
- LOW tier lighter: stars 4000 → 2500; planet sphere segments 64×48 on LOW (96×64 otherwise).
- Text: R1's stronger phone scrim.
- Planets misplaced/cut off: the controller diagnoses in phone emulation after R2/R3 and files concrete fixes (expected causes: DRIFT and FOV — fixed in R2).
