export const TIER_ORDER = ['low', 'medium', 'high']
const MAX_FRAME_MS = 250 // longer frames are hitches or a resumed tab, not a verdict on the device

export const TIER_SETTINGS = {
  low: { dpr: 1, bloom: false, bloomScale: 0, lensing: 'static', stars: 2500, octaves: 2, clouds: false, meteors: 80, trail: 0.45, msaa: 0, segments: [64, 48] },
  medium: { dpr: 1.5, bloom: true, bloomScale: 0.5, lensing: 'sprite', stars: 10000, octaves: 3, clouds: true, meteors: 200, trail: 0.75, msaa: 2, segments: [96, 64] },
  high: { dpr: 2, bloom: true, bloomScale: 1, lensing: 'screen', stars: 20000, octaves: 5, clouds: true, meteors: 400, trail: 1, msaa: 4, segments: [96, 64] },
}

/**
 * Phones start conservative; desktops start in the middle. Coarse-pointer
 * devices stay on their starting tier by design (LOW unless `?tier=`
 * overrides) — since R5 the FPS governor is frozen on coarse pointers
 * (QualityProvider `capped`), because the 30 fps render cap makes the
 * ≥55 fps "up" path unreachable.
 */
export function initialTier({ coarse }) {
  return coarse ? 'low' : 'medium'
}

/** Phones render at least this sharp: 1× on a 3× screen left planets soft and jagged. */
const PHONE_MIN_DPR = 1.5

/**
 * Canvas pixel ratio for a tier. Phones stay on LOW for its lighter scene but
 * render at 1.5× — the 30 fps demand loop leaves the fill-rate headroom, and a
 * lone planet on a small screen is where softness shows most.
 */
export function dprFor(tier, { coarse, deviceDpr }) {
  const want = coarse ? Math.max(TIER_SETTINGS[tier].dpr, PHONE_MIN_DPR) : TIER_SETTINGS[tier].dpr
  return Math.min(want, deviceDpr || 1)
}

/**
 * Reads `?tier=low|medium|high` from a location.search string, for pinning
 * the tier during colour-pipeline verification (B2). Anything else — absent,
 * misspelled, unsupported — is null, so the caller falls back to initialTier.
 */
export function tierOverride(search) {
  const value = new URLSearchParams(search).get('tier')
  return TIER_ORDER.includes(value) ? value : null
}

export function stepTier(tier, direction) {
  const i = TIER_ORDER.indexOf(tier) + (direction === 'up' ? 1 : -1)
  return TIER_ORDER[Math.min(Math.max(i, 0), TIER_ORDER.length - 1)]
}

/**
 * Watches frame times and asks for a tier change when the frame rate is
 * sustained outside the comfortable band. Frame time is smoothed (EMA) so a
 * single GC hitch neither triggers nor resets anything. After `maxSwitches`
 * changes it locks, so a device on the edge doesn't ping-pong forever.
 *
 * One-way ratchet on 'up': once the governor has stepped down (the device
 * couldn't sustain the tier it was on), it never steps back up again — only
 * further downs until it locks. Without this, up → down → up re-locks onto
 * the exact tier that just failed (A2).
 */
export function createFpsGovernor({ upFps = 55, upMs = 3000, downFps = 40, downMs = 2000, maxSwitches = 3 } = {}) {
  let ema = null
  let above = 0
  let below = 0
  let switches = 0
  let steppedDown = false

  return {
    get locked() {
      return switches >= maxSwitches
    },
    sample(dtMs, { canUp, canDown }) {
      if (switches >= maxSwitches || !(dtMs > 0) || dtMs > MAX_FRAME_MS) return null
      ema = ema === null ? dtMs : ema * 0.9 + dtMs * 0.1
      const fps = 1000 / ema
      if (fps >= upFps) {
        above += dtMs
        below = 0
      } else if (fps < downFps) {
        below += dtMs
        above = 0
      } else {
        above = 0
        below = 0
      }
      if (above >= upMs) {
        above = 0
        if (!canUp || steppedDown) return null
        switches++
        return 'up'
      }
      if (below >= downMs) {
        below = 0
        if (!canDown) return null
        switches++
        steppedDown = true
        return 'down'
      }
      return null
    },
  }
}
