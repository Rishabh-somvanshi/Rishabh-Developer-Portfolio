import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
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
import { WORLDS, SCENE_IDS } from '../data/voyage'
import { isCoarsePointer } from './hooks'
import { setLenis } from './lenisController'
import { progress, resetProgress, updateProgress, setMeasure } from '../voyage3d/store'
import { computeWindows, measureSections, measureSlots } from '../voyage3d/sceneWindows'
import { eventsBetween } from '../voyage3d/audio/score'
import { createAudioEngine } from '../voyage3d/audio/engine'
import { takePrimedContext } from '../voyage3d/audio/context'
import { hasWebGL2 } from '../voyage3d/webgl'
import WebGLBoundary from '../voyage3d/WebGLBoundary'
import '../styles/journey.css'

// The 3D world is its own chunk: the text and HUD render first, and the canvas
// fades in behind them when it arrives. There is no preloader screen.
const World = lazy(() => import('../voyage3d/World'))

function prefersReducedMotion() {
  try {
    return window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    return false
  }
}

/**
 * The voyage shell. It owns the one source of motion — the progress store —
 * and feeds it every frame to the audio engine; the 3D world reads the same
 * store in its own render loop. The text scenes keep their framer-motion
 * progress, which is the same number (see voyage3d/sceneWindows.js).
 */
export default function Journey({ onSkip }) {
  const fx = useRef({ warp: 0, well: 0, wellX: 0.5, wellY: 0.42 })
  const maxScroll = useRef(0)
  const reduced = useReducedMotion()
  // Computed once, like useScene does — a pointer type doesn't change mid-session.
  const coarse = useMemo(isCoarsePointer, [])
  const [worldFailed, setWorldFailed] = useState(() => !hasWebGL2())
  const [engine, setEngine] = useState(null)

  // safety: never leave FX on when scenes unmount mid-scroll
  useEffect(() => {
    const f = fx.current
    return () => {
      f.warp = 0
      f.well = 0
    }
  }, [])

  // Audio. The primed context (created in the entry click) is adopted here.
  // Under React.StrictMode in dev the effect runs twice; the first engine
  // closes the primed context on cleanup, so in dev the second one waits for
  // a tap. Production mounts once.
  useEffect(() => {
    const e = createAudioEngine({
      sceneIds: SCENE_IDS,
      primed: takePrimedContext(),
      reducedMotion: prefersReducedMotion(),
    })
    setEngine(e)
    return () => e.dispose()
  }, [])

  // Deep links arrive without a gesture: the first click/tap/key anywhere
  // starts the sound. Browsers grant audio activation on pointerup/keydown
  // (touch in particular refuses it on pointerdown — a scroll swipe is
  // pointerdown → pointercancel, not a gesture). The toggle and the M key
  // handle themselves, so they are skipped here — otherwise one press would
  // start and immediately mute.
  useEffect(() => {
    if (!engine) return undefined
    const onGesture = (e) => {
      if (e.type === 'keydown' && (e.key === 'm' || e.key === 'M')) return
      if (e.target?.closest?.('.hud-sound')) return
      engine.startFromGesture()
    }
    const onVisibility = () => engine.onVisibility(document.hidden)
    window.addEventListener('pointerup', onGesture)
    window.addEventListener('keydown', onGesture)
    document.addEventListener('visibilitychange', onVisibility)
    return () => {
      window.removeEventListener('pointerup', onGesture)
      window.removeEventListener('keydown', onGesture)
      document.removeEventListener('visibilitychange', onVisibility)
    }
  }, [engine])

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

  // Measure scene windows and DOM slots on mount, on resize, and once web
  // fonts settle (they change text heights, and with them every section top).
  useEffect(() => {
    let alive = true
    resetProgress(progress)
    const measure = () => {
      if (!alive) return
      const vh = window.innerHeight
      maxScroll.current = document.documentElement.scrollHeight - vh
      setMeasure(progress, {
        windows: computeWindows(measureSections(SCENE_IDS), maxScroll.current, vh),
        // The canvas is position: fixed; inset: 0, so its true height is the
        // layout viewport (innerHeight), not .scn-stage's 100svh — those two
        // diverge once the mobile URL bar collapses (B4).
        viewport: { w: window.innerWidth, h: window.innerHeight },
        slots: measureSlots(),
      })
    }
    measure()
    window.addEventListener('resize', measure)
    document.fonts?.ready.then(measure)
    return () => {
      alive = false
      window.removeEventListener('resize', measure)
    }
  }, [])

  // The ticker: scroll → store → audio, once per frame. maxScroll is cached by
  // measure() so this loop never forces a layout.
  useEffect(() => {
    let prevP = progress.p
    let frame = requestAnimationFrame(function tick(time) {
      updateProgress(progress, { scrollY: window.scrollY, maxScroll: maxScroll.current, now: time })
      if (engine) {
        engine.update(progress)
        for (const e of eventsBetween(prevP, progress.p, progress.windows)) engine.trigger(e.scene, e.name, e.arg)
      }
      prevP = progress.p
      frame = requestAnimationFrame(tick)
    })
    return () => cancelAnimationFrame(frame)
  }, [engine])

  return (
    <div className="journey" id="top">
      {worldFailed ? (
        <Starfield fx={fx} still={!!reduced} />
      ) : (
        <WebGLBoundary onFail={() => setWorldFailed(true)}>
          <Suspense fallback={null}>
            <World reduced={!!reduced} onFail={() => setWorldFailed(true)} />
          </Suspense>
        </WebGLBoundary>
      )}
      <div className="voyage-atmosphere" aria-hidden="true" />
      <Hud onSkip={onSkip} engine={engine} />
      <main>
        <Launch onSkip={onSkip} />
        {WORLDS.map((w) => (
          <WorldScene key={w.id} {...w} />
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
