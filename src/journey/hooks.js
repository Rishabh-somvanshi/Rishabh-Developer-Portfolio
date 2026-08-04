import { useEffect, useMemo, useRef } from 'react'
import { useScroll, useSpring, useReducedMotion } from 'framer-motion'
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
 * Pinned-scene progress, damped so it settles with weight instead of
 * tracking the wheel 1:1. Scene height shrinks on touch so each scene needs
 * less thumb.
 */
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
    height: `${Math.round(vh * (coarse ? 0.74 : 1))}vh`,
  }
}
