import { m, useTransform } from 'framer-motion'
import { useScene } from './hooks'
import { experience } from '../data/content'

const edu = experience.find((e) => e.education)

/*
 * The fundamentals as glowing meteors — every one of them lit,
 * each with a real tail. Positions are % of the meteor field.
 */
const METEORS = [
  { label: 'Data structures', x: '8%', y: '18%', angle: 24, len: 130, speed: 1.1, size: 1.05 },
  { label: 'Algorithms', x: '62%', y: '8%', angle: 20, len: 150, speed: 0.85, size: 1.2 },
  { label: 'C · Python', x: '72%', y: '62%', angle: 26, len: 115, speed: 1.45, size: 0.95 },
  { label: '5★ HackerRank', x: '12%', y: '66%', angle: 21, len: 165, speed: 1.2, size: 1.3, amber: true },
]

function Meteor({ mt, p }) {
  // drift forward along its own axis of travel — head leads, tail trails
  const travel = useTransform(p, [0, 1], [-70 * mt.speed, 130 * mt.speed])
  return (
    <div className="meteor-slot" style={{ left: mt.x, top: mt.y }}>
      <div className="meteor-rot" style={{ transform: `rotate(${mt.angle}deg)` }}>
        <m.div className={`meteor${mt.amber ? ' amber' : ''}`} style={{ x: travel, scale: mt.size }}>
          <span className="meteor-tail" style={{ width: mt.len }} />
          <span className="meteor-glow" />
          <span className="meteor-head" />
          <span
            className={`mono meteor-label${mt.amber ? ' amber' : ''}`}
            style={{ transform: `rotate(${-mt.angle}deg)` }}
          >
            {mt.label}
          </span>
        </m.div>
      </div>
    </div>
  )
}

/** ORIGIN FIELD — SRM, 2015–2019: the debris the ship was built from. */
export default function Origins() {
  const { ref, p, height } = useScene(165)

  const copyO = useTransform(p, [0.01, 0.1, 0.9, 1], [0, 1, 1, 0])
  const copyY = useTransform(p, [0.01, 0.1], [40, 0])

  return (
    <section ref={ref} id="origins" className="scn" style={{ height }}>
      <div className="scn-stage origins-stage">
        <div className="meteor-field" aria-hidden="true">
          {METEORS.map((mt) => (
            <Meteor key={mt.label} mt={mt} p={p} />
          ))}
        </div>

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
