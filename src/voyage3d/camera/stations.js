import { SCENE_IDS, WORLDS } from '../../data/voyage'
import { frameBody, placeInSlot, defaultSlot } from './framing'

const normalize = (v) => {
  const l = Math.hypot(...v)
  return v.map((c) => c / l)
}

/** One distant sun lights every body: upper-left, more from the side than the
 * viewer so each world shows a real terminator instead of face-on daylight. */
export const SUN_DIR = normalize([-0.75, 0.3, 0.45])

/**
 * World layout. The path runs down −z and spirals in toward Earth — the way
 * home runs back through time. Radii are base sizes; worlds are rescaled per
 * layout by frameBody.
 */
export const BODIES = {
  curo: { center: [0, 0, -60], radius: 10 },
  mercantile: { center: [40, 8, -140], radius: 13 },
  vault: { center: [-30, -6, -220], radius: 9 },
  porcelain: { center: [25, 10, -300], radius: 9 },
  blackHole: { center: [0, 0, -540], radius: 5 },
  earth: { center: [0, -140, -760], radius: 100 },
}

export const ORIGINS_CENTER = [0, 0, -380]

/** Stations that don't frame a world slot. `stars` must face straight down −z (placeInSlot relies on it). */
export const FIXED_STATIONS = {
  launch: { position: [0, 0, 40], target: [0, 0, -60] },
  origins: { position: [0, 0, -340], target: [0, 0, -400] },
  stars: { position: [0, 0, -410], target: [0, 0, -470] },
  singularity: { position: [0, -2, -495], target: [0, -4.4, -540] },
  reentry: { position: [30, -10, -590], target: [0, -40, -680] },
  home: { position: [0, -25, -690], target: [0, -28, -800] },
}

/** How far in front of the twin-lights camera the supernova and pulsar sit. */
export const TWIN_DEPTH = 60

export const TWIN_DEFAULTS = {
  nova: { position: [-14, 0, -470], radius: 5 },
  pulsar: { position: [14, 0, -470], radius: 5 },
}

const FLIP = Object.fromEntries(WORLDS.map((w) => [w.id, w.flip]))

/**
 * Every station and layout-dependent size, from one DOM measurement
 * ({ viewport: {w, h}, slots: {id: {x, y, w, h}} }). Pure.
 */
export function layoutFor(measure) {
  const { viewport, slots } = measure
  const scales = {}
  const stations = SCENE_IDS.map((id) => {
    if (id in FLIP) {
      const framed = frameBody(BODIES[id], slots[id] ?? defaultSlot(FLIP[id], viewport), viewport)
      scales[id] = framed.scale
      return { id, position: framed.position, target: framed.target }
    }
    return { id, ...FIXED_STATIONS[id] }
  })

  // Measured and missing = the layout hides that visual (short phones): show nothing.
  const measured = Object.keys(slots).length > 0
  const twin = {}
  for (const key of ['nova', 'pulsar']) {
    if (slots[key]) twin[key] = placeInSlot(FIXED_STATIONS.stars.position, slots[key], viewport, TWIN_DEPTH)
    else twin[key] = measured ? null : TWIN_DEFAULTS[key]
  }
  return { stations, scales, twin }
}
