import { useEffect, useRef, useState } from 'react'
import { scrollTo as lenisScrollTo } from './lenisController'
import SoundToggle from '../voyage3d/audio/SoundToggle'

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

/** Voyage HUD — logo, sound, skip lane, and the constellation progress rail (a reading line on phones). */
export default function Hud({ onSkip, engine }) {
  const [active, setActive] = useState(0)
  const ticking = useRef(false)
  const bar = useRef(null)

  useEffect(() => {
    const measure = () => {
      const probe = window.scrollY + window.innerHeight * 0.45
      let idx = 0
      for (let i = 0; i < SCENES.length; i++) {
        const el = document.getElementById(SCENES[i].id)
        if (el && el.offsetTop <= probe) idx = i
      }
      setActive(idx)
      const max = document.documentElement.scrollHeight - window.innerHeight
      if (bar.current) bar.current.style.transform = `scaleX(${max > 0 ? Math.min(window.scrollY / max, 1) : 0})`
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
        {engine && engine.getSnapshot().state !== 'unsupported' && <SoundToggle engine={engine} />}
        <button className="hud-skip mono" onClick={onSkip} type="button">
          Résumé view →
        </button>
      </div>

      {/* phones: the dot rail sits on top of the text column, so they get a reading line instead */}
      <div className="hud-progress" aria-hidden="true">
        <i ref={bar} />
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
