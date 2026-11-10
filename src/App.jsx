import { lazy, Suspense, useEffect, useMemo, useRef, useState } from 'react'
import { LazyMotion, domAnimation, MotionConfig } from 'framer-motion'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Experience from './components/Experience'
import CaseStudies from './components/CaseStudies'
import Skills from './components/Skills'
import Contact from './components/Contact'
import ChunkErrorBoundary from './components/ChunkErrorBoundary'
import VoyageLoading from './components/VoyageLoading'
import { identity } from './data/content'
import {
  VOYAGE_HASH,
  resolveInitialMode,
  readStoredMode,
  writeStoredMode,
} from './lib/viewMode'
import { primeAudio } from './voyage3d/audio/context'
import { track } from './lib/analytics'
import { loadJourney, warmVoyage, canPrefetch } from './lib/voyagePreload'
import { isCoarsePointer } from './journey/hooks'

// The voyage is opt-in and heavy (the 3D world lazy-loads a second chunk of its
// own). The résumé view never needs any of it to render; lib/voyagePreload
// decides when it is worth fetching ahead of the click.
const Journey = lazy(loadJourney)

/**
 * Two ways in:
 *  - The dossier (default): the dense classic view a hurried reader wants.
 *  - The voyage: a scroll-driven journey home through the career, opt-in.
 * An explicit hash always wins, so a pasted link lands where it says.
 */
function initialMode() {
  if (typeof window === 'undefined') return 'work'
  let prefersReducedMotion = false
  try {
    prefersReducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)').matches
  } catch {
    /* matchMedia unavailable — treat as no preference */
  }
  return resolveInitialMode({
    hash: window.location.hash,
    stored: readStoredMode(),
    prefersReducedMotion,
  })
}

function Footer() {
  return (
    <footer>
      <div className="container footer-inner">
        <span>© 2026 {identity.name}</span>
        <span>
          <a href={identity.github} target="_blank" rel="noopener noreferrer">
            Designed &amp; built by hand
          </a>
          {' · React + Framer Motion'}
        </span>
      </div>
    </footer>
  )
}

export default function App() {
  const [mode, setMode] = useState(initialMode)
  const firstRender = useRef(true)

  // reset scroll when switching modes (but honor a deep-link anchor on load)
  useEffect(() => {
    if (firstRender.current) {
      firstRender.current = false
      const { hash } = window.location
      if (mode === 'work' && hash && hash !== '#overview') {
        requestAnimationFrame(() => {
          try {
            document.querySelector(hash)?.scrollIntoView()
          } catch {
            /* malformed hash (e.g. #utm_source=x, #!x) is not a valid
               selector — ignore it rather than throw inside the rAF
               callback */
          }
        })
      }
      return
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [mode])

  // visitor stats: which view each visitor actually saw — the one they landed in and any switch
  useEffect(() => {
    track(mode === 'voyage' ? 'voyage-opened' : 'resume-view-opened')
  }, [mode])

  const coarse = useMemo(isCoarsePointer, [])

  // Each view is a history entry, so the browser's Back button moves between
  // them instead of leaving the site (it used to: the switch only replaced the URL).
  useEffect(() => {
    // a remembered voyage opens without its hash — label it, so Back can return to it
    if (mode === 'voyage' && window.location.hash !== VOYAGE_HASH) {
      window.history.replaceState(null, '', VOYAGE_HASH)
    }
    const onPop = () => {
      const next = window.location.hash === VOYAGE_HASH ? 'voyage' : 'work'
      setMode(next)
      writeStoredMode(next)
    }
    window.addEventListener('popstate', onPop)
    return () => window.removeEventListener('popstate', onPop)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- label once, on load
  }, [])

  // Fetch the voyage's code while the résumé view sits idle, so the click is instant.
  useEffect(() => {
    if (mode !== 'work' || !canPrefetch()) return undefined
    const idle = window.requestIdleCallback
      ? window.requestIdleCallback(() => warmVoyage(), { timeout: 5000 })
      : window.setTimeout(() => warmVoyage(), 3000)
    return () => (window.cancelIdleCallback ? window.cancelIdleCallback(idle) : window.clearTimeout(idle))
  }, [mode])

  // Hover, focus or touch on a voyage button: the visitor is on their way in.
  const voyageIntent = () => warmVoyage({ textures: true, coarse })

  const exitVoyage = () => {
    setMode('work')
    writeStoredMode('work')
    window.history.pushState(null, '', '#overview')
  }

  const enterVoyage = () => {
    // Must run synchronously inside the click: it's the user gesture the
    // browser requires before audio may start. The engine adopts it later.
    primeAudio()
    warmVoyage({ textures: true, coarse }) // everything at once, not one download after another
    setMode('voyage')
    writeStoredMode('voyage')
    window.history.pushState(null, '', VOYAGE_HASH)
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        {mode === 'voyage' ? (
          <>
            <button className="skip-link" onClick={exitVoyage} type="button">
              Skip to content
            </button>
            <ChunkErrorBoundary onError={exitVoyage}>
              <Suspense fallback={<VoyageLoading />}>
                <Journey onSkip={exitVoyage} />
              </Suspense>
            </ChunkErrorBoundary>
          </>
        ) : (
          <>
            <a className="skip-link" href="#experience">
              Skip to content
            </a>
            <Nav onVoyage={enterVoyage} onVoyageIntent={voyageIntent} />
            <main id="overview">
              <Hero onVoyage={enterVoyage} onVoyageIntent={voyageIntent} />
              <Experience />
              <CaseStudies />
              <Skills />
              <Contact />
            </main>
            <Footer />
          </>
        )}
      </MotionConfig>
    </LazyMotion>
  )
}
