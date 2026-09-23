import { interp } from './interp'

/** Overall black-hole size — the retired CSS black hole was ≤ 340px wide. */
export const BH_SIZE = 0.55

/**
 * The black hole's rendered scale at singularity-scene progress `v` — the retired CSS
 * keyframes (grow on approach, shrink once the manifest appears) × BH_SIZE. Shared so the
 * mesh and the screen-space lens can never disagree about how big the hole is.
 */
export function blackHoleScale(v) {
  return BH_SIZE * interp(v, [0.01, 0.24, 0.48, 0.6], [0.5, 1, 1, 0.34])
}
