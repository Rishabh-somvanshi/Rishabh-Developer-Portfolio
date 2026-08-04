import { useEffect, useRef, useState } from 'react'
import { LazyMotion, domAnimation, MotionConfig } from 'framer-motion'
import Nav from './components/Nav'
import Hero from './components/Hero'
import Experience from './components/Experience'
import CaseStudies from './components/CaseStudies'
import Skills from './components/Skills'
import Contact from './components/Contact'
import Journey from './journey/Journey'
import { identity } from './data/content'

const WORK_HASHES = new Set(['#overview', '#experience', '#work', '#skills', '#contact']) // dossier anchors

/**
 * Two ways in:
 *  - The voyage (default): a scroll-driven journey home through the career.
 *  - The dossier: the dense classic view, one click away for hurried readers.
 * Deep links to classic anchors, and reduced-motion users, land on the dossier.
 */
function initialMode() {
  if (typeof window === 'undefined') return 'voyage'
  try {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return 'work'
  } catch {
    /* matchMedia unavailable — default to voyage */
  }
  return WORK_HASHES.has(window.location.hash) ? 'work' : 'voyage'
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
          document.querySelector(hash)?.scrollIntoView()
        })
      }
      return
    }
    window.scrollTo({ top: 0, behavior: 'instant' })
  }, [mode])

  const skip = () => {
    setMode('work')
    window.history.replaceState(null, '', '#overview')
  }

  const voyage = () => {
    setMode('voyage')
    window.history.replaceState(null, '', window.location.pathname + window.location.search)
  }

  return (
    <LazyMotion features={domAnimation} strict>
      <MotionConfig reducedMotion="user">
        {mode === 'voyage' ? (
          <>
            <button className="skip-link" onClick={skip} type="button">
              Skip to content
            </button>
            <Journey onSkip={skip} />
          </>
        ) : (
          <>
            <a className="skip-link" href="#experience">
              Skip to content
            </a>
            <Nav onVoyage={voyage} />
            <main id="overview">
              <Hero />
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
