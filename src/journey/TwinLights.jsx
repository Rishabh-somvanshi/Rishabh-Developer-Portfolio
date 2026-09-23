import { m, useTransform } from 'framer-motion'
import { useScene } from './hooks'
import { studies } from '../data/content'
import { IconArrow } from '../components/Reveal'

const wedding = studies[0]
const expense = studies[1]

function StudyCard({ s, log }) {
  return (
    <div className="world-card study-card-j">
      <p className="kicker">Self-made light · {s.id}</p>
      <h3 className="world-h">{s.name}</h3>
      <p className="world-log">{log}</p>
      <p className="scene-body sm">{s.tagline}</p>
      <p className="scene-body sm dim">{s.outcome}</p>
      <div className="tags world-tags">
        {s.tags.slice(0, 3).map((t) => (
          <span key={t} className="tag">
            {t}
          </span>
        ))}
      </div>
      <a className="link-arrow" href={s.url} target="_blank" rel="noopener noreferrer">
        {s.urlLabel} <IconArrow />
      </a>
    </div>
  )
}

/** Scene 7 — TWIN LIGHTS. The two projects he lit himself. */
export default function TwinLights() {
  const { ref, p, height } = useScene(225)

  const introO = useTransform(p, [0.01, 0.07, 0.16, 0.22], [0, 1, 1, 0])
  const introY = useTransform(p, [0.01, 0.07], [40, 0])

  const beatAO = useTransform(p, [0.19, 0.26, 0.52, 0.58], [0, 1, 1, 0])
  const beatAY = useTransform(p, [0.19, 0.26], [44, 0])

  const beatBO = useTransform(p, [0.58, 0.64, 0.96, 1], [0, 1, 1, 0])
  const beatBY = useTransform(p, [0.58, 0.64], [44, 0])

  return (
    <section ref={ref} id="stars" className="scn" style={{ height }}>
      <div className="scn-stage">
        <m.div className="scene-copy center abs" style={{ opacity: introO, y: introY }}>
          <p className="kicker">Entry 05 · Light of my own</p>
          <h2 className="scene-h">Not everything out here was found.</h2>
          <p className="scene-body">
            Two lights in the void, lit by hand, on my own time. Both still burning
            — live, in use, zero backend.
          </p>
        </m.div>

        <m.div className="beat world-stage" style={{ opacity: beatAO, y: beatAY }}>
          <div className="world-visual">
            <div className="twin-slot" data-slot="nova" aria-hidden="true" />
            <div className="world-tag mono">Supernova · went off beautifully</div>
          </div>
          <StudyCard
            s={wedding}
            log="A 500-guest, five-ceremony wedding is chaos with a guest list. Compressed into one command centre until it shone."
          />
        </m.div>

        <m.div className="beat world-stage flip" style={{ opacity: beatBO, y: beatBY }}>
          <div className="world-visual">
            <div className="twin-slot" data-slot="pulsar" aria-hidden="true" />
            <div className="world-tag mono">Pulsar · keeps perfect time</div>
          </div>
          <StudyCard
            s={expense}
            log="A pulsar keeps perfect time. So does a habit — when logging a spend takes seconds, not forms."
          />
        </m.div>
      </div>
    </section>
  )
}
