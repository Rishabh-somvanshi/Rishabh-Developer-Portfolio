import { m, useTransform, useMotionValueEvent } from 'framer-motion'
import { useScene } from './hooks'
import { hero } from '../data/content'

/** Scene 9 — RE-ENTRY. The numbers earned on the way, burning in. */
export default function Reentry({ fx, reduced }) {
  const { ref, p, height } = useScene(150)

  useMotionValueEvent(p, 'change', (v) => {
    if (reduced) return
    let warp = 0
    if (v > 0.08 && v < 0.45) warp = (v - 0.08) / 0.37
    else if (v >= 0.45 && v < 0.78) warp = 1
    else if (v >= 0.78) warp = Math.max(1 - (v - 0.78) / 0.2, 0)
    fx.current.warp = warp
  })

  const heatO = useTransform(p, [0.16, 0.55, 0.97], [0, 0.55, 0.2])
  const headO = useTransform(p, [0.03, 0.13, 0.92, 1], [0, 1, 1, 0])

  const stats = hero.stats
  const statCopy = [
    'years of React, end to end',
    'Fortune 500 clients served',
    'client awards in six months',
  ]

  return (
    <section ref={ref} id="reentry" className="scn" style={{ height }}>
      <div className="scn-stage reentry-stage">
        <m.div className="reentry-heat" style={{ opacity: heatO }} aria-hidden="true" />
        <m.div className="scene-copy center" style={{ opacity: headO }}>
          <p className="kicker">Entry 07 · Re-entry</p>
          <h2 className="scene-h">Falling, finally, on purpose.</h2>
          <div className="reentry-stats">
            {stats.map((s, i) => {
              const start = 0.16 + i * 0.09
              return (
                <Stat key={s.label} p={p} start={start} val={`${s.val}${s.suffix}`} label={statCopy[i]} />
              )
            })}
          </div>
          <p className="scene-body dim">
            Speed is only frightening if you haven&rsquo;t earned it.
          </p>
        </m.div>
      </div>
    </section>
  )
}

function Stat({ p, start, val, label }) {
  const o = useTransform(p, [start, start + 0.1], [0, 1])
  const y = useTransform(p, [start, start + 0.12], [36, 0])
  const blur = useTransform(p, [start, start + 0.12], ['blur(8px)', 'blur(0px)'])
  return (
    <m.div className="reentry-stat" style={{ opacity: o, y, filter: blur }}>
      <span className="reentry-val">{val}</span>
      <span className="mono reentry-lbl">{label}</span>
    </m.div>
  )
}
