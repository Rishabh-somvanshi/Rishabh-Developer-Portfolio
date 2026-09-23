export const TIER_ORDER = ['low', 'medium', 'high']
const MAX_FRAME_MS = 250 // longer frames are hitches or a resumed tab, not a verdict on the device

export const TIER_SETTINGS = {
  low: { dpr: 1, bloom: false, bloomScale: 0, lensing: 'static', stars: 4000, octaves: 2, clouds: false, meteors: 80, trail: 0.45 },
  medium: { dpr: 1.5, bloom: true, bloomScale: 0.5, lensing: 'sprite', stars: 10000, octaves: 3, clouds: true, meteors: 200, trail: 0.75 },
  high: { dpr: 2, bloom: true, bloomScale: 1, lensing: 'screen', stars: 20000, octaves: 5, clouds: true, meteors: 400, trail: 1 },
}

/** Phones start conservative and earn their way up; desktops start in the middle. */
export function initialTier({ coarse }) {
  return coarse ? 'low' : 'medium'
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
 */
export function createFpsGovernor({ upFps = 55, upMs = 3000, downFps = 40, downMs = 2000, maxSwitches = 3 } = {}) {
  let ema = null
  let above = 0
  let below = 0
  let switches = 0

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
        if (!canUp) return null
        switches++
        return 'up'
      }
      if (below >= downMs) {
        below = 0
        if (!canDown) return null
        switches++
        return 'down'
      }
      return null
    },
  }
}
