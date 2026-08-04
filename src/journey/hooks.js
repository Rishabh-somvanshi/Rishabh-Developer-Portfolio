import { useEffect, useMemo, useRef } from 'react'
import { useScroll } from 'framer-motion'
import { observeInView } from './observeInView'

export const EASE = [0.21, 0.47, 0.32, 0.98]

const isCoarsePointer = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(pointer: coarse)').matches

/**
 * Toggle the parked class on a scene as it enters and leaves view.
 *
 * Applied here rather than in each scene component: all six scenes go through
 * useScene/usePin, and the costliest animations are not in the one component
 * it would be easy to remember to change.
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
 * Pinned-scene progress, tied 1:1 to the scroll position — no smoothing,
 * no lag. Scene height shrinks on touch so each scene needs less thumb.
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
    p: scrollYProgress,
    height: `${Math.round(vh * (coarse ? 0.74 : 1))}vh`,
  }
}

/** Raw pinned progress (full height) */
export function usePin() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start start', 'end end'],
  })
  useParkWhenOffScreen(ref)
  return { ref, p: scrollYProgress }
}
