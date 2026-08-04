import { useRef } from 'react'
import { m, useScroll, useSpring } from 'framer-motion'
import { experience } from '../data/content'
import { Reveal, SectionHead } from './Reveal'

function Entry({ e }) {
  return (
    <Reveal className="entry" as="div">
      <div className="entry-dates">
        {e.dates}
        <span className="dur">{e.duration}</span>
      </div>
      <div>
        <h3>{e.role}</h3>
        <p className="org">
          <strong>{e.org}</strong>
          {e.client && <> · Client: {e.client}</>}
        </p>
        <ul className="entry-points">
          {e.points.map((p, i) => (
            <li key={i}>{p}</li>
          ))}
        </ul>
        {e.award && <p className="entry-award">{e.award}</p>}
        <div className="tags">
          {e.tags.map((t) => (
            <span className="tag" key={t}>
              {t}
            </span>
          ))}
        </div>
      </div>
    </Reveal>
  )
}

export default function Experience() {
  const ref = useRef(null)
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ['start 0.8', 'end 0.75'],
  })
  const scaleY = useSpring(scrollYProgress, { stiffness: 70, damping: 24, mass: 0.6 })

  return (
    <section id="experience" aria-labelledby="experience-title">
      <div className="container">
        <SectionHead
          num="01"
          title="Experience"
          note="2019 — Present · 3 companies · 4 Fortune 500 clients"
          id="experience-title"
        />
        <div className="timeline" ref={ref}>
          <div className="timeline-rail" aria-hidden="true" />
          <m.div className="timeline-rail-fill" style={{ scaleY }} aria-hidden="true" />
          {experience.map((e) => (
            <Entry key={`${e.org}-${e.dates}`} e={e} />
          ))}
        </div>
      </div>
    </section>
  )
}
