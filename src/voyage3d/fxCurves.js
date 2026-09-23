/**
 * Scene-progress → effect-strength curves, shared by the 2D fallback starfield
 * (via fx.current) and the 3D world, so both render the same story.
 */

/** Re-entry: stars stretch into streaks. `v` is the reentry scene's progress. */
export function warpCurve(v) {
  if (v > 0.08 && v < 0.45) return (v - 0.08) / 0.37
  if (v >= 0.45 && v < 0.78) return 1
  if (v >= 0.78) return Math.max(1 - (v - 0.78) / 0.2, 0)
  return 0
}

/** Singularity: gravitational lensing strength. `v` is the singularity scene's progress. */
export function wellCurve(v) {
  if (v > 0.02 && v < 0.42) return Math.min((v - 0.02) / 0.14, 1)
  if (v >= 0.42 && v < 0.8) return Math.max(1 - (v - 0.42) / 0.2, 0.25)
  if (v >= 0.8) return Math.max(0.25 - (v - 0.8) / 0.15, 0)
  return 0
}
