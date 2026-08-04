import { useEffect, useState } from 'react'
import { identity } from '../data/content' // single content source

const LINKS = [
  { n: '01', label: 'Experience', href: '#experience' },
  { n: '02', label: 'Work', href: '#work' },
  { n: '03', label: 'Skills', href: '#skills' },
  { n: '04', label: 'Contact', href: '#contact' },
]

export default function Nav({ onVoyage }) {
  const [scrolled, setScrolled] = useState(false)

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 8)
    onScroll()
    window.addEventListener('scroll', onScroll, { passive: true })
    return () => window.removeEventListener('scroll', onScroll)
  }, [])

  return (
    <header className={`nav${scrolled ? ' scrolled' : ''}`}>
      <div className="container nav-inner">
        <a href="#top" className="nav-logo" aria-label="Rishabh Somvanshi — home">
          rs<span className="dot">.</span>
        </a>
        <nav className="nav-links" aria-label="Primary">
          {onVoyage && (
            <button className="nav-voyage" onClick={onVoyage} type="button">
              <span>00</span>Voyage
            </button>
          )}
          {LINKS.map((l) => (
            <a key={l.n} href={l.href}>
              <span>{l.n}</span>
              {l.label}
            </a>
          ))}
          <a className="btn btn-ghost" href={identity.resume} download>
            Résumé
          </a>
        </nav>
      </div>
    </header>
  )
}
