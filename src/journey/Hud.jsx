import { useEffect, useRef, useState } from 'react'
import { scrollTo as lenisScrollTo } from './lenisController'

export const SCENES = [
  { id: 'launch', label: 'Launch' },
  { id: 'curo', label: 'Curo · now' },
  { id: 'mercantile', label: 'Mercantile' },
  { id: 'vault', label: 'Vault' },
  { id: 'porcelain', label: 'Porcelain' },
  { id: 'origins', label: 'Origin field' },
  { id: 'stars', label: 'Twin lights' },
  { id: 'singularity', label: 'Singularity' },
  { id: 'reentry', label: 'Re-entry' },
  { id: 'home', label: 'Home' },
]

/** Voyage HUD — logo, skip lane, and the constellation progress rail. */
export default function Hud({ onSkip }) {
  const [active, setActive] = useState(0)
  const ticking = useRef(false)

  useEffect(() => {
    const measure = () => {
      const probe = window.scrollY + window.innerHeight * 0.45
      let idx = 0
      for (let i = 0; i < SCENES.length; i++) {
        const el = document.getElementById(SCENES[i].id)
        if (el && el.offsetTop <= probe) idx = i
      }
      setActive(idx)
      ticking.current = false
    }
    const onScroll = () => {
      if (!ticking.current) {
        ticking.current = true
        requestAnimationFrame(measure)
      }
    }
    measure()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  const goTo = (id) => {
    const el = document.getElementById(id)
    if (!el) return
    // land where the scene's content is already on stage, not at its blank start
    const pinned = Math.max(el.offsetHeight - window.innerHeight, 0)
    const top = id === 'home' ? el.offsetTop : el.offsetTop + pinned * 0.3
    // Native `behavior: 'smooth'` fights Lenis's own per-frame scroll writes
    // and either jumps or stutters; route through Lenis when it's running,
    // falling back to native smooth scroll when it isn't (reduced motion,
    // touch, or a click that races the voyage's init effect).
    lenisScrollTo(top)
  }

  return (
    <>
      <div className="hud-top">
        <button
          className="nav-logo hud-logo"
          onClick={() => lenisScrollTo(0)}
          aria-label="Back to launch"
          type="button"
        >
          rs<span className="dot">.</span>
        </button>
        <button className="hud-skip mono" onClick={onSkip} type="button">
          Résumé view →
        </button>
      </div>

      <nav className="hud-rail" aria-label="Voyage progress">
        {SCENES.map((s, i) => (
          <button
            key={s.id}
            className={`hud-dot${i === active ? ' on' : ''}${i < active ? ' past' : ''}`}
            onClick={() => goTo(s.id)}
            aria-label={s.label}
            aria-current={i === active ? 'step' : undefined}
            type="button"
          >
            <i />
            <span className="mono hud-dot-label">{s.label}</span>
          </button>
        ))}
      </nav>
    </>
  )
}
