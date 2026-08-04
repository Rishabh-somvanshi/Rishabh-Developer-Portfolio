import { m } from 'framer-motion'
import { identity, hero } from '../data/content'
import { fadeUp, stagger, IconDownload, IconMail } from './Reveal'

export default function Hero() {
  return (
    <section className="hero" id="top" aria-label="Introduction">
      <div className="hero-veil" aria-hidden="true" />
      <div className="hero-grid" aria-hidden="true" />
      <div className="container hero-content">
        <m.div initial="hidden" animate="show" variants={stagger(0.09)}>
          <m.p className="kicker" variants={fadeUp}>
            {identity.title}
          </m.p>

          <m.h1 variants={fadeUp}>
            Rishabh
            <br />
            Somvanshi<span className="dot">.</span>
          </m.h1>

          <m.p className="hero-lead" variants={fadeUp}>
            {hero.lead.map((part, i) =>
              part.strong ? <strong key={i}>{part.t}</strong> : <span key={i}>{part.t}</span>
            )}
          </m.p>

          <m.div className="hero-cta" variants={fadeUp}>
            <a className="btn btn-primary" href={identity.resume} download>
              <IconDownload />
              Download résumé
            </a>
            <a className="btn btn-ghost" href={`mailto:${identity.email}`}>
              <IconMail />
              {identity.email}
            </a>
          </m.div>

          <m.p className="hero-meta" variants={fadeUp}>
            <span className="pulse" aria-hidden="true" />
            <span>
              Currently — {identity.currently} · {identity.location}
            </span>
          </m.p>

          <m.div className="hero-stats" variants={stagger(0.09)}>
            {hero.stats.map((s) => (
              <m.div key={s.label} variants={fadeUp}>
                <div className="val">
                  {s.val}
                  <em>{s.suffix}</em>
                </div>
                <div className="lbl">{s.label}</div>
              </m.div>
            ))}
          </m.div>
        </m.div>
      </div>
    </section>
  )
}
