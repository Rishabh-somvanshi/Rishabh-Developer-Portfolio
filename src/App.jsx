import { lazy, Suspense, useEffect, useRef, useState } from 'react'
import { LazyMotion, domAnimation, MotionConfig } from 'framer-motion'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Experience from './components/Experience'
import CaseStudies from './components/CaseStudies'
import Skills from './components/Skills'
import Contact from './components/Contact'
import { identity } from './data/content'
import {
  VOYAGE_HASH,
  resolveInitialMode,
  readStoredMode,
  writeStoredMode,
} from './lib/viewMode'
import { primeAudio } from './voyage3d/audio/context'

// The voyage is opt-in and heavy (the 3D world lazy-loads a second chunk of its
// own). The résumé view never downloads any of it.
const Journey = lazy(() => import('./journey/Journey'))

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

  const exitVoyage = () => {
    setMode('work')
    writeStoredMode('work')
    window.history.replaceState(null, '', '#overview')
  }

  const enterVoyage = () => {
    // Must run synchronously inside the click: it's the user gesture the
    // browser requires before audio may start. The engine adopts it later.
    primeAudio()
    setMode('voyage')
    writeStoredMode('voyage')
    window.history.replaceState(null, '', VOYAGE_HASH)
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        {mode === 'voyage' ? (
          <>
            <button className="skip-link" onClick={exitVoyage} type="button">
              Skip to content
            </button>
            <Suspense fallback={<div className="journey" aria-busy="true" />}>
              <Journey onSkip={exitVoyage} />
            </Suspense>
          </>
        ) : (
          <>
            <a className="skip-link" href="#experience">
              Skip to content
            </a>
            <Nav onVoyage={enterVoyage} />
            <main id="overview">
              <Hero onVoyage={enterVoyage} />
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
