import { createContext, useContext } from 'react'

const MotionContext = createContext(false)

/**
 * True when the reader asked for reduced motion: objects with self-driven
 * animation (twinkle, drift, spin, pulse, orbit, rotation) should hold still.
 * Scroll-driven changes — camera, moon rise, shield sweep, supernova
 * detonation, black-hole scale, warp from scroll — are untouched by this and
 * read `progress` directly, as before.
 */
export const useStill = () => useContext(MotionContext)

export default MotionContext
