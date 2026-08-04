/**
 * Holds the voyage's live Lenis instance so anything outside Journey.jsx
 * (currently Hud.jsx) can drive scrolling through it instead of fighting it
 * with native `window.scrollTo({ behavior: 'smooth' })`.
 *
 * Why a plain module singleton instead of React context: Journey.jsx creates
 * and destroys the instance imperatively inside an effect — there is no
 * render-visible state change to propagate, so a context provider would just
 * be a re-render trigger wrapped around the same external mutable box. Hud
 * already reaches past props into the DOM directly (it reads scroll position
 * and section elements by id), so a small imperative module matches the
 * existing style here rather than introducing a second pattern for one
 * value. Deliberately not attached to `window` — this module is the only
 * access point.
 */
let instance = null

/** Called by Journey.jsx after it creates/destroys its Lenis instance. */
export function setLenis(lenis) {
  instance = lenis
}

export function getLenis() {
  return instance
}

/**
 * Scroll to `target` (anything Lenis's own `scrollTo` accepts: a number of
 * pixels, a selector, or an element) using the live Lenis instance when the
 * voyage has one running. Falls back to native smooth scrolling when it
 * doesn't — reduced motion, a coarse pointer, or a call that races the
 * voyage's init effect.
 */
export function scrollTo(target, options) {
  if (instance) {
    instance.scrollTo(target, options)
    return
  }
  const top =
    typeof target === 'number'
      ? target
      : target && typeof target.getBoundingClientRect === 'function'
        ? target.getBoundingClientRect().top + window.scrollY
        : null
  if (top === null) return
  window.scrollTo({ top, behavior: 'smooth' })
}
