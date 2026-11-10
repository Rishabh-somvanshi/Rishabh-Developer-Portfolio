import { voyageTextures, textureUrls } from '../data/voyage'
import { hasWebGL2 } from '../voyage3d/webgl'

/**
 * Getting the voyage on screen fast. It is three downloads — the shell chunk,
 * the 3D world chunk, the planet textures — that used to start one after
 * another (each only once the previous had arrived and rendered). Here they
 * start together, and can start early: on idle after the résumé view has
 * loaded (code only), on hover/touch of a voyage button, and on entry.
 *
 * App and Journey lazy-load through these same two functions, so a warmed
 * import() is the one React then renders.
 */
export const loadJourney = () => import('../journey/Journey')
export const loadWorld = () => import('../voyage3d/World')

const started = { code: false, textures: false }
const kept = [] // hold the Image objects so their downloads aren't collected mid-flight

export function _resetWarm() {
  started.code = false
  started.textures = false
  kept.length = 0
}

/** Not on Data Saver, and not on a link too slow to spare the bytes. */
export function canPrefetch(connection = typeof navigator !== 'undefined' ? navigator.connection : undefined) {
  if (!connection) return true
  if (connection.saveData) return false
  return !/(^|-)2g$|^3g$/.test(connection.effectiveType || '')
}

/**
 * Start downloading the voyage. Safe to call any number of times.
 * `textures: true` when the visitor is clearly heading in (hover, touch, entry);
 * `coarse` picks the phone texture set (see voyageTextures).
 */
export function warmVoyage({
  textures = false,
  coarse = false,
  webgl = hasWebGL2(),
  loaders = { journey: loadJourney, world: loadWorld },
  makeImage = () => new Image(),
} = {}) {
  if (!started.code) {
    started.code = true
    const retry = () => {
      started.code = false
    }
    loaders.journey().catch(retry)
    if (webgl) loaders.world().catch(retry)
  }
  if (textures && webgl && !started.textures) {
    started.textures = true
    for (const url of textureUrls(voyageTextures({ coarse }))) {
      const img = makeImage()
      img.crossOrigin = 'anonymous' // the same request three's loader makes, so the cache entry is shared
      img.src = url
      kept.push(img)
    }
  }
}
