import { sceneProgress } from '../sceneWindows'
import { clamp01, interp } from '../interp'
import { warpCurve } from '../fxCurves'
import { METEOR_PASSES } from '../../data/voyage'

/**
 * The score as pure maths: where the reader is → what every voice should do.
 * The engine turns this into AudioParam ramps. Everything is in one key
 * family (C major / A minor), so any crossfade stays in tune.
 */
export const NEUTRAL_CUTOFF = 12000
export const REST_CUTOFF = 4000
export const V_MAX = 0.12 // p-units per second that count as a fast scroll
export const MAX_EVENT_STEP = 0.05 // a bigger p jump in one frame is a HUD jump, not a scroll

/** Equal-power crossfade from the current scene into the next while the camera flies. */
export function voiceGains({ index, travel }, n) {
  const gains = new Array(n).fill(0)
  const i = Math.min(index, n - 1)
  if (travel <= 0 || i >= n - 1) {
    gains[i] = 1
    return gains
  }
  const a = (travel * Math.PI) / 2
  gains[i] = Math.cos(a)
  gains[i + 1] = Math.sin(a)
  return gains
}

/** Time dilates: pitch sinks an octave, the filter closes, silence at the horizon, then the pad returns. */
export function singularityShape(v) {
  if (v < 0 || v > 1) return { bend: 0, cutoff: NEUTRAL_CUTOFF, duck: 1 }
  const bend = v <= 0.42 ? interp(v, [0.02, 0.42], [0, -1200]) : 0
  const cutoff =
    v <= 0.47 ? interp(v, [0.02, 0.42], [NEUTRAL_CUTOFF, 300]) : interp(v, [0.47, 0.57], [300, NEUTRAL_CUTOFF])
  const duck = interp(v, [0.4, 0.42, 0.47, 0.52], [1, 0, 0, 1])
  return { bend, cutoff, duck }
}

/** Flying sounds like motion; stopping leaves only the dwell pad. */
export function motionLayer(velocity) {
  const k = clamp01(velocity / V_MAX)
  return { whoosh: 0.35 * k, cutoff: REST_CUTOFF + (NEUTRAL_CUTOFF - REST_CUTOFF) * k }
}

/** Supernova detonation, scrubbed by scroll (same keys as the 3D shockwave). */
export function novaEnvelope(v) {
  return interp(v, [0.16, 0.26, 0.48], [0, 1, 0])
}

/**
 * The track's playback rate through the singularity: 0 cents (no bend) → 1×,
 * −1200 cents (a full octave down) → 0.8×, linear between, clamped at both
 * ends. `preservesPitch` is set false on the element so pitch actually sinks
 * with the rate instead of being corrected back out.
 */
export function rateForBend(cents) {
  return interp(cents, [-1200, 0], [0.8, 1])
}

export function mixFor(store, sceneIds) {
  const { windows, p } = store
  const sing = singularityShape(sceneProgress(windows, p, 'singularity'))
  const motion = motionLayer(store.velocity)
  return {
    gains: voiceGains(store, sceneIds.length),
    cutoff: Math.min(sing.cutoff, motion.cutoff),
    duck: sing.duck,
    whoosh: motion.whoosh * sing.duck,
    params: {
      singularity: { bend: sing.bend },
      stars: { nova: novaEnvelope(sceneProgress(windows, p, 'stars')) },
      reentry: { heat: warpCurve(sceneProgress(windows, p, 'reentry')) },
    },
  }
}

/**
 * One-shot cues, keyed to the same scene progress the visuals use. The moon
 * and shield cues are gone — their voices (mercantile's bell, vault's ping)
 * were tonal pads/one-shots removed in R4 along with the rest of the tonal
 * score; only the meteor whooshes remain (origins is non-tonal SFX).
 */
export const EVENTS = [...METEOR_PASSES.map(({ at, pan }) => ({ scene: 'origins', at, name: 'meteor', arg: pan }))]

/** Cues crossed while scrolling forwards between two frames. */
export function eventsBetween(prevP, p, windows) {
  if (p <= prevP || p - prevP > MAX_EVENT_STEP) return []
  return EVENTS.filter((e) => {
    const a = sceneProgress(windows, prevP, e.scene)
    const b = sceneProgress(windows, p, e.scene)
    return a < e.at && b >= e.at
  })
}
