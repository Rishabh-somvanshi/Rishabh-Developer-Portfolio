import Astronaut from './Astronaut'
import { Reveal, IconMail, IconDownload, IconArrow } from '../components/Reveal'
import { identity } from '../data/content'

/** Scene 10 — HOME. Earth at dawn. The landing is the contact section. */
export default function Home({ onSkip }) {
  return (
    <section id="home" className="scn home-scn">
      <div className="home-inner container">
        <Reveal>
          <p className="kicker">Final entry · Home</p>
        </Reveal>
        <Reveal delay={0.06}>
          <h2 className="home-h">
            The voyage changed the traveler<span className="dot">.</span>
            <br />
            That was the point.
          </h2>
        </Reveal>
        <Reveal delay={0.12}>
          <p className="scene-body home-sub">
            Home isn&rsquo;t a coordinate out here — it&rsquo;s the next hard problem,
            with the right crew. If your team has one, my line is open.
          </p>
        </Reveal>
        <Reveal delay={0.16}>
          <p className="mono home-meta">
            <i className="pulse" /> {identity.currently} · {identity.location}
          </p>
        </Reveal>
        <Reveal delay={0.2}>
          <a className="contact-email" href={`mailto:${identity.email}`}>
            <IconMail /> {identity.email}
          </a>
        </Reveal>
        <Reveal delay={0.24}>
          <div className="home-actions">
            <a className="btn btn-primary" href={identity.resume} download>
              <IconDownload /> Download résumé
            </a>
            <a className="link-arrow" href={identity.linkedin} target="_blank" rel="noopener noreferrer">
              LinkedIn <IconArrow />
            </a>
            <a className="link-arrow" href={identity.github} target="_blank" rel="noopener noreferrer">
              GitHub <IconArrow />
            </a>
          </div>
        </Reveal>
        <Reveal delay={0.3}>
          <button className="home-dossier mono" onClick={onSkip} type="button">
            Prefer the dossier? Open the classic view →
          </button>
        </Reveal>
      </div>

      <div className="earth" aria-hidden="true">
        <Astronaut pose="stand" className="earth-astronaut" />
      </div>

      <footer className="home-footer mono" aria-label="Footer">
        © 2026 {identity.name} · Voyage designed &amp; built by hand · React Three Fiber · Web Audio
      </footer>
    </section>
  )
}
