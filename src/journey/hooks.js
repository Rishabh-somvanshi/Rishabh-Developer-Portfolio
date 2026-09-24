import { useEffect, useMemo, useRef } from 'react'
import { useScroll, useSpring, useReducedMotion, useTransform } from 'framer-motion'
import { observeInView } from './observeInView'

export const EASE = [0.21, 0.47, 0.32, 0.98]

/**
 * Scene-progress damping. The scroll *position* itself is now smoothed by
 * Lenis (see Journey.jsx) — Lenis supplies the ship-with-mass inertia, this
 * spring only has to take the remaining edge off the already-smoothed
 * progress value so it doesn't track pixel-for-pixel. Higher stiffness and
 * lower mass than before, on purpose: with Lenis already smoothing the
 * input, a slow/heavy spring stacked on top double-applies inertia and reads
 * as mushy, laggy motion rather than weight. Do not soften this back toward
 * low-stiffness/high-mass values without also removing Lenis — the two are
 * tuned as one system.
 */
const GLIDE = { stiffness: 90, damping: 26, mass: 1, restDelta: 0.0005 }

export const isCoarsePointer = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(pointer: coarse)').matches

/**
 * Damped pinned-scene progress. Reduced-motion users get the raw value, since
 * the drift itself is motion they have asked not to see.
 */
function useGlide(raw) {
  const reduced = useReducedMotion()
  const smooth = useSpring(raw, GLIDE)
  return reduced ? raw : smooth
}

/**
 * Toggle the parked class on a scene as it enters and leaves view.
 *
 * Applied here rather than in each scene component: all six scenes go through
 * useScene, and the costliest animations are not in the one component it
 * would be easy to remember to change.
 */
function useParkWhenOffScreen(ref) {
  useEffect(
    () =>
      observeInView(ref.current, (inView) => {
        ref.current?.classList.toggle('scn-parked', !inView)
      }),
    [ref],
  )
}

/**
 * Scene length in vh. Phones get slightly shorter scenes than desktop (0.85×),
 * but never less than 145vh: a pinned scene needs real scroll past its own
 * screen, or its card only flashes by mid-fade and the 3D flight into the
 * next world is crammed into a thumb-flick. (The old 0.58× was tuned for the
 * 2D voyage; with the 3D camera it left several scenes shorter than the
 * screen itself, so they never pinned at all.)
 */
export function sceneHeightVh(vh, coarse) {
  return coarse ? Math.min(vh, Math.max(145, Math.round(vh * 0.85))) : vh
}

/** Pinned-scene progress, damped so it settles with weight instead of tracking the wheel 1:1. */
export function useScene(vh) {
  const ref = useRef(null)
  const coarse = useMemo(isCoarsePointer, [])
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })
  useParkWhenOffScreen(ref)
  return {
    ref,
    p: useGlide(scrollYProgress),
    height: `${sceneHeightVh(vh, coarse)}vh`,
  }
}

/**
 * Upward shift (px) for a card that overflows its pinned stage by `overflow`
 * px, at scene progress `v`: 0 before `range[0]`, the whole overflow after
 * `range[1]`, linear between. A card that fits never moves.
 */
export function overflowShift(v, overflow, [a, b]) {
  if (!(overflow > 0)) return 0
  const t = Math.min(Math.max((v - a) / (b - a), 0), 1)
  return t > 0 ? -overflow * t : 0
}

const SAFE_BOTTOM = 24 // px left clear under a card once it has slid all the way

/**
 * On a phone a world card can be taller than the room left under its planet.
 * Instead of clipping it (the pinned stage is overflow: hidden) or trimming the
 * résumé, the card slides up by exactly its overflow while the scene is
 * pinned — it reads like ordinary scrolling. Measured from layout (offsetTop),
 * never from the transformed box, so the slide can't feed back into itself.
 * `onShift(px)` hears every change (the 3D camera follows it).
 */
export function useOverflowShift(ref, p, range, onShift) {
  const overflow = useRef(0)
  const [a, b] = range
  useEffect(() => {
    const el = ref.current
    const stage = el?.closest('.beat') ?? el?.closest('.scn-stage')
    if (!el || !stage) return undefined
    const measure = () => {
      let top = 0
      for (let n = el; n && n !== stage; n = n.offsetParent) top += n.offsetTop
      overflow.current = top + el.offsetHeight - (stage.clientHeight - SAFE_BOTTOM)
    }
    measure()
    window.addEventListener('resize', measure)
    const ro = typeof ResizeObserver === 'undefined' ? null : new ResizeObserver(measure)
    ro?.observe(el)
    ro?.observe(stage)
    return () => {
      window.removeEventListener('resize', measure)
      ro?.disconnect()
    }
  }, [ref])
  const shift = useTransform(p, (v) => overflowShift(v, overflow.current, [a, b]))
  // the 3D camera follows the slide, so the planet rises with its card instead of being covered
  const report = useRef(onShift)
  report.current = onShift
  useEffect(() => shift.on('change', (v) => report.current?.(v)), [shift])
  return shift
}
