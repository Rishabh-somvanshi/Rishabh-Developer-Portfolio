import { useMemo, useRef } from 'react'
import { useScroll } from 'framer-motion'

export const EASE = [0.21, 0.47, 0.32, 0.98]

const isCoarsePointer = () =>
  typeof window !== 'undefined' &&
  window.matchMedia &&
  window.matchMedia('(pointer: coarse)').matches

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
  return { ref, p: scrollYProgress }
}
