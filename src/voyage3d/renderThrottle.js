/**
 * Decision logic for the phone frame cap (R5). On coarse pointers the Canvas
 * runs `frameloop="demand"`; a small rAF loop in FrameDriver.jsx calls this
 * on every tick to decide whether to invalidate() — i.e. render a frame.
 *
 * Pure and dependency-free so it is unit-testable without three.js/jsdom.
 * Not shell-side: only FrameDriver.jsx (world chunk) imports it, so it is
 * not on the chunkBoundary SHELL_SIDE list. Named separately from
 * FrameDriver.jsx (not frameDriver.js) — Windows' case-insensitive
 * filesystem would otherwise collide the two module paths.
 *
 * Ambient motion (not `still`) renders at the throttle rate regardless of
 * `changed` — that's what keeps twinkle/spin/pulse animating at ~30 fps.
 * Reduced motion (`still`) has no self-driven motion, so it only renders
 * when the progress store changed (a scroll move), still coalesced to the
 * same throttle so a burst of scroll deltas doesn't exceed the cap.
 */
export const RENDER_INTERVAL_MS = 1000 / 30

export function shouldRender({ now, last, minInterval, still, changed }) {
  if (last === null) return true
  if (still && !changed) return false
  return now - last >= minInterval
}
