import { m } from 'framer-motion'
import { skills } from '../data/content'
import { Reveal, SectionHead, fadeUp, stagger } from './Reveal'

export default function Skills() {
  return (
    <section id="skills" aria-labelledby="skills-title">
      <div className="container">
        <SectionHead num="03" title="Skills & Stack" note="Grouped, not a tag wall" id="skills-title" />

        <m.div
          className="skills-grid"
          initial="hidden"
          whileInView="show"
          viewport={{ once: true, margin: '-80px' }}
          variants={stagger(0.09)}
        >
          {skills.groups.map((g) => (
            <m.div className="skill-card" key={g.label} variants={fadeUp}>
              <span className="mono">{g.label}</span>
              <ul>
                {g.items.map((item) => (
                  <li key={item.name}>
                    {item.name}
                    {item.note && <span className="n">{item.note}</span>}
                  </li>
                ))}
              </ul>
            </m.div>
          ))}
        </m.div>

        <Reveal className="domains" delay={0.1}>
          <span className="mono">Domains</span>
          {skills.domains.map((d) => (
            <span className="dom" key={d}>
              {d}
            </span>
          ))}
        </Reveal>

        <Reveal as="p" className="creds" delay={0.15}>
          <span>Credentials —</span> {skills.credentials}
        </Reveal>
      </div>
    </section>
  )
}
