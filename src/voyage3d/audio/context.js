/**
 * Browsers only let audio start inside a user gesture. The "Take the voyage"
 * click is that gesture, but it happens before the voyage chunk has loaded,
 * so App.jsx calls primeAudio() synchronously in the click handler and the
 * engine adopts the context once it mounts. Tiny on purpose: this module
 * ships in the main bundle.
 */
let primed = null

export function getAudioContextClass() {
  if (typeof window === 'undefined') return null
  return window.AudioContext || window.webkitAudioContext || null
}

export function primeAudio() {
  if (primed) return
  const Ctx = getAudioContextClass()
  if (!Ctx) return
  try {
    primed = new Ctx()
  } catch {
    primed = null // e.g. too many contexts — the voyage simply starts silent
  }
}

export function takePrimedContext() {
  const ctx = primed
  primed = null
  return ctx
}
