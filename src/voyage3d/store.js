import { locate } from './sceneWindows'

/**
 * The voyage's single source of motion. A plain mutable object: the shell's
 * rAF ticker writes it, the 3D world's useFrame and the audio engine read it.
 * Never React state — it changes every frame, and nothing should re-render
 * because of it. Same module-singleton pattern as journey/lenisController.js.
 */
export function createProgressStore() {
  return {
    p: 0,
    velocity: 0, // p-units per second, smoothed, always ≥ 0
    index: 0,
    dwell: 0,
    travel: 0,
    lastTime: null,
    windows: [],
    measure: { version: 0, viewport: { w: 1280, h: 800 }, slots: {} },
    compiled: false, // set once the 3D world has pre-compiled its shaders
  }
}

export const progress = createProgressStore()

export function resetProgress(store) {
  Object.assign(store, createProgressStore())
}

const VELOCITY_SMOOTHING = 0.15

export function updateProgress(store, { scrollY, maxScroll, now }) {
  const p = maxScroll > 0 ? Math.min(Math.max(scrollY / maxScroll, 0), 1) : 0
  if (store.lastTime !== null) {
    const dt = (now - store.lastTime) / 1000
    if (dt > 0) {
      const instant = Math.abs(p - store.p) / dt
      store.velocity += (instant - store.velocity) * VELOCITY_SMOOTHING
    }
  }
  store.p = p
  store.lastTime = now
  Object.assign(store, locate(store.windows, p))
  return store
}

export function setMeasure(store, { windows, viewport, slots }) {
  store.windows = windows
  store.measure = { version: store.measure.version + 1, viewport, slots }
  Object.assign(store, locate(windows, store.p))
}
