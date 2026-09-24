import { TRACK } from '../../data/voyage'

/**
 * Browsers only let audio start inside a user gesture. The "Take the voyage"
 * click is that gesture, but it happens before the voyage chunk has loaded,
 * so App.jsx calls primeAudio() synchronously in the click handler and the
 * engine adopts the context (and the track element) once it mounts. Tiny on
 * purpose: this module ships in the main bundle. The file is never
 * requested outside this gesture or a deep-link's first tap/click/keydown
 * (see engine.js's startFromGesture) — never eagerly on the résumé view.
 */
let primed = null

export function getAudioContextClass() {
  if (typeof window === 'undefined') return null
  return window.AudioContext || window.webkitAudioContext || null
}

/**
 * Creates the track's <audio> element and starts it playing, inside
 * whatever gesture is calling this. Degrades silently: if Audio isn't
 * available, or play() throws or rejects (autoplay refused, the file 404s,
 * decoding fails), this returns null / swallows the rejection rather than
 * throwing — the engine treats a null element as "no track this session".
 */
export function createTrackElement(src = TRACK.src) {
  if (typeof Audio === 'undefined') return null
  try {
    const el = new Audio(src)
    el.preload = 'auto'
    el.play?.()?.catch?.(() => {})
    return el
  } catch {
    return null
  }
}

export function primeAudio() {
  if (primed) return
  const Ctx = getAudioContextClass()
  let ctx = null
  if (Ctx) {
    try {
      ctx = new Ctx()
    } catch {
      ctx = null // e.g. too many contexts — the voyage simply starts silent
    }
  }
  primed = { ctx, element: createTrackElement() }
}

/** Always returns `{ ctx, element }` — both null when nothing was primed. */
export function takePrimedContext() {
  const p = primed
  primed = null
  return p ?? { ctx: null, element: null }
}
