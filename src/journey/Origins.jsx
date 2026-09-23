import { m, useTransform } from 'framer-motion'
import { useScene } from './hooks'
import { experience } from '../data/content'

const edu = experience.find((e) => e.education)

/** ORIGIN FIELD — SRM, 2015–2019. The meteors are drawn by the 3D world. */
export default function Origins() {
  const { ref, p, height } = useScene(165)

  const copyO = useTransform(p, [0.01, 0.1, 0.9, 1], [0, 1, 1, 0])
  const copyY = useTransform(p, [0.01, 0.1], [40, 0])

  return (
    <section ref={ref} id="origins" className="scn" style={{ height }}>
      <div className="scn-stage origins-stage">
        <m.div className="scene-copy center origins-copy" style={{ opacity: copyO, y: copyY }}>
          <p className="kicker">Entry 00 · Where it started</p>
          <h2 className="scene-h">Every voyage begins in a debris field.</h2>
          <p className="scene-body">
            {edu.org}, 2015–2019. Electronics &amp; Communication on paper — but the
            pull was always toward the code. The fundamentals formed here, streak by
            streak, before there was ever a ship.
          </p>
          <p className="mono scene-meta">B.Tech · {edu.duration} · {edu.tags.join(' · ')}</p>
        </m.div>
      </div>
    </section>
  )
}
