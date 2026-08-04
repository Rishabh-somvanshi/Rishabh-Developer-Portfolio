import { identity } from '../data/content'
import { Reveal, SectionHead, IconArrow, IconDownload } from './Reveal'

export default function Contact() {
  return (
    <section id="contact" className="contact" aria-labelledby="contact-title">
      <div className="container">
        <SectionHead num="04" title="Contact" note={identity.location} id="contact-title" />

        <Reveal>
          <p className="contact-big">
            Hiring a senior React engineer who ships<span className="dot">?</span>
          </p>
          <p className="contact-sub">
            I'm open to senior frontend roles and conversations about interesting React problems.
            Email is the fastest way to reach me.
          </p>
        </Reveal>

        <Reveal delay={0.1}>
          <a className="contact-email" href={`mailto:${identity.email}`}>
            {identity.email}
            <IconArrow />
          </a>
        </Reveal>

        <Reveal className="contact-links" delay={0.18}>
          <a href={identity.linkedin} target="_blank" rel="noopener noreferrer">
            LinkedIn <IconArrow />
          </a>
          <a href={identity.github} target="_blank" rel="noopener noreferrer">
            GitHub <IconArrow />
          </a>
          <a href={identity.resume} download>
            Résumé PDF <IconDownload />
          </a>
        </Reveal>
      </div>
    </section>
  )
}
