import { m, useTransform, useMotionValueEvent } from 'framer-motion'
import { useScene } from './hooks'
import Astronaut from './Astronaut'
import { skills } from '../data/content'

function BlackHole({ scale, opacity }) {
  return (
    <m.div className="bh" style={{ scale, opacity }} aria-hidden="true">
      <span className="bh-disk" />
      <span className="bh-photon" />
      <span className="bh-core" />
      <span className="bh-lens" />
    </m.div>
  )
}

/**
 * Scene 8 — THE SINGULARITY. The hardest problems have gravity.
 * Beat A: approach — time dilates, the starfield bends.
 * Beat B: what came out the other side — the full skill manifest.
 */
export default function Singularity({ fx, reduced }) {
  const { ref, p, height } = useScene(235)

  // drive the starfield lens
  useMotionValueEvent(p, 'change', (v) => {
    if (reduced) return
    let well = 0
    if (v > 0.02 && v < 0.42) well = Math.min((v - 0.02) / 0.14, 1)
    else if (v >= 0.42 && v < 0.8) well = Math.max(1 - (v - 0.42) / 0.2, 0.25)
    else if (v >= 0.8) well = Math.max(0.25 - (v - 0.8) / 0.15, 0)
    fx.current.well = well
    fx.current.wellX = 0.5
    fx.current.wellY = 0.42
  })

  const bhScale = useTransform(p, [0.01, 0.24, 0.48, 0.6], [0.5, 1, 1, 0.34])
  const bhO = useTransform(p, [0, 0.06, 0.52, 0.63], [0, 1, 1, 0.18])

  const copyO = useTransform(p, [0.03, 0.12, 0.32, 0.4], [0, 1, 1, 0])
  const spread = useTransform(p, [0.05, 0.4], ['0.14em', '0.62em'])
  const spreadO = useTransform(p, [0.07, 0.16, 0.38, 0.44], [0, 1, 1, 0])

  const astY = useTransform(p, [0.02, 0.4], [180, -30])
  const astS = useTransform(p, [0.02, 0.4], [0.8, 0.4])
  const astSY = useTransform(p, [0.18, 0.4], [1, 1.35])
  const astO = useTransform(p, [0.02, 0.1, 0.34, 0.42], [0, 0.95, 0.95, 0])

  const manO = useTransform(p, [0.47, 0.57, 0.96, 1], [0, 1, 1, 0])
  const manY = useTransform(p, [0.47, 0.59], [64, 0])

  return (
    <section ref={ref} id="singularity" className="scn" style={{ height }}>
      <div className="scn-stage sing-stage">
        <BlackHole scale={bhScale} opacity={bhO} />

        <m.div className="sing-astronaut" style={{ y: astY, scale: astS, scaleY: astSY, opacity: astO }}>
          <Astronaut pose="drift" />
        </m.div>

        <m.div className="scene-copy center sing-copy" style={{ opacity: copyO }}>
          <p className="kicker">Entry 06 · The singularity</p>
          <h2 className="scene-h">Some problems you don&rsquo;t route around.</h2>
          <p className="scene-body">
            You go in. Time stretches. You come out someone who has done it.
          </p>
        </m.div>

        <m.p className="mono dilate" style={{ letterSpacing: spread, opacity: spreadO }} aria-hidden="true">
          time dilates here
        </m.p>

        <m.div className="manifest" style={{ opacity: manO, y: manY }}>
          <p className="kicker">Recovered flight data</p>
          <h2 className="scene-h sm">Every hard orbit leaves instruments behind.</h2>
          <div className="manifest-grid">
            {skills.groups.map((g) => (
              <div key={g.label} className="skill-card manifest-card">
                <span className="mono">{g.label}</span>
                <ul>
                  {g.items.map((it) => (
                    <li key={it.name}>
                      {it.name}
                      {it.note && <span className="n">{it.note}</span>}
                    </li>
                  ))}
                </ul>
              </div>
            ))}
          </div>
          <p className="mono manifest-domains">
            Fields surveyed — {skills.domains.join(' · ')}
          </p>
        </m.div>
      </div>
    </section>
  )
}
