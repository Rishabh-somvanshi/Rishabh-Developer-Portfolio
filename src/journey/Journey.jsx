import { useEffect, useMemo, useRef } from 'react'
import { useReducedMotion } from 'framer-motion'
import Lenis from 'lenis'
import Starfield from './Starfield'
import Hud from './Hud'
import Launch from './Launch'
import Origins from './Origins'
import WorldScene from './WorldScene'
import TwinLights from './TwinLights'
import Singularity from './Singularity'
import Reentry from './Reentry'
import Home from './Home'
import { WORLD_VISUALS } from './Planet'
import { WORLDS } from '../data/voyage'
import { isCoarsePointer } from './hooks'
import { setLenis } from './lenisController'
import '../styles/journey.css'

/** The voyage — a scroll-driven journey home through six and a half years. */
export default function Journey({ onSkip }) {
  const fx = useRef({ warp: 0, well: 0, wellX: 0.5, wellY: 0.42 })
  const reduced = useReducedMotion()
  // Computed once, like useScene does — a pointer type doesn't change mid-session.
  const coarse = useMemo(isCoarsePointer, [])

  // safety: never leave FX on when scenes unmount mid-scroll
  useEffect(() => {
    const f = fx.current
    return () => {
      f.warp = 0
      f.well = 0
    }
  }, [])

  // Smooth the voyage's actual scroll position with Lenis — the dossier
  // never mounts this component, so it never loads or initialises Lenis.
  // Gated off entirely (native scroll instead) for:
  //  - prefers-reduced-motion: smoothing is motion the user asked not to have.
  //  - coarse pointers: touch already has native momentum scrolling that
  //    Lenis can only make feel worse by hijacking it.
  useEffect(() => {
    if (reduced || coarse) return undefined

    const lenis = new Lenis()
    setLenis(lenis)

    let frame = requestAnimationFrame(function raf(time) {
      lenis.raf(time)
      frame = requestAnimationFrame(raf)
    })

    return () => {
      cancelAnimationFrame(frame)
      setLenis(null)
      lenis.destroy()
    }
  }, [reduced, coarse])

  return (
    <div className="journey" id="top">
      <Starfield fx={fx} still={!!reduced} />
      <div className="voyage-atmosphere" aria-hidden="true" />
      <Hud onSkip={onSkip} />
      <main>
        <Launch onSkip={onSkip} />
        {WORLDS.map((w) => (
          <WorldScene key={w.id} {...w} visual={WORLD_VISUALS[w.id]} />
        ))}
        <Origins />
        <TwinLights />
        <Singularity fx={fx} reduced={reduced} />
        <Reentry fx={fx} reduced={reduced} />
        <Home onSkip={onSkip} />
      </main>
    </div>
  )
}
