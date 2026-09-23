import { clamp01 } from './interp'

/**
 * Scene windows on the voyage's progress p (0..1), derived from the real DOM
 * sections so the 3D camera, the audio and the text can never disagree.
 *
 *   start ──── dwell (stage pinned) ──── dwellEnd ──── fly (next scene scrolls in) ──── end
 *
 * A pinned scene's stage is sticky for (height − viewport) of scroll, then the
 * next section scrolls up over it; that hand-over is where the camera flies.
 */
export function computeWindows(sections, maxScroll, viewportHeight) {
  if (!sections.length || maxScroll <= 0) return []
  const last = sections.length - 1
  return sections.map((s, i) => {
    const start = i === 0 ? 0 : clamp01(s.top / maxScroll)
    const end = i === last ? 1 : clamp01(sections[i + 1].top / maxScroll)
    const pinnedEnd = clamp01((s.top + Math.max(s.height - viewportHeight, 0)) / maxScroll)
    const dwellEnd = i === last ? 1 : Math.min(Math.max(pinnedEnd, start), end)
    return { id: s.id, start, dwellEnd, end }
  })
}

/** Which scene p is in, how far through its dwell, and how far through its fly-out. */
export function locate(windows, p) {
  if (!windows.length) return { index: 0, dwell: 0, travel: 0 }
  let index = windows.length - 1
  for (let i = 0; i < windows.length; i++) {
    if (p < windows[i].end) {
      index = i
      break
    }
  }
  const w = windows[index]
  const dwellSpan = w.dwellEnd - w.start
  const flySpan = w.end - w.dwellEnd
  const dwell = dwellSpan > 0 ? clamp01((p - w.start) / dwellSpan) : 1
  const travel = flySpan > 0 && p > w.dwellEnd ? clamp01((p - w.dwellEnd) / flySpan) : 0
  return { index, dwell, travel }
}

/**
 * A scene's own progress, unclamped — the same number framer-motion's
 * useScroll({ offset: ['start start', 'end end'] }) gives the DOM scene
 * (before its clamp), so 3D keyframes can reuse the DOM keyframes verbatim.
 * −1 for an unknown id.
 */
export function sceneProgress(windows, p, id) {
  const w = windows.find((x) => x.id === id)
  if (!w) return -1
  const span = w.dwellEnd - w.start
  if (span <= 0) return p >= w.start ? 1 : 0
  return (p - w.start) / span
}

/** Document-space top and height of each scene section. */
export function measureSections(ids, doc = document) {
  const scrollY = doc.defaultView ? doc.defaultView.scrollY : 0
  return ids
    .map((id) => doc.getElementById(id))
    .filter(Boolean)
    .map((el) => ({ id: el.id, top: el.getBoundingClientRect().top + scrollY, height: el.offsetHeight }))
}

/**
 * Layout offset of `el` inside `ancestor`, ignoring CSS transforms (framer
 * moves the beats and cards while they animate in — a slot must be measured
 * where it will rest). null if `ancestor` is not on the offsetParent chain.
 */
export function offsetWithin(el, ancestor) {
  let x = 0
  let y = 0
  let node = el
  while (node && node !== ancestor) {
    x += node.offsetLeft
    y += node.offsetTop
    node = node.offsetParent
  }
  return node === ancestor ? { x, y } : null
}

/**
 * Every [data-slot] box, relative to its pinned stage. A slot hidden on this
 * layout (zero size — e.g. short phones drop the twin-light visuals) is omitted.
 */
export function measureSlots(doc = document) {
  const slots = {}
  for (const el of doc.querySelectorAll('[data-slot]')) {
    const stage = el.closest('.scn-stage')
    const at = stage && offsetWithin(el, stage)
    if (!at || el.offsetWidth === 0 || el.offsetHeight === 0) continue
    slots[el.dataset.slot] = { x: at.x, y: at.y, w: el.offsetWidth, h: el.offsetHeight }
  }
  return slots
}
