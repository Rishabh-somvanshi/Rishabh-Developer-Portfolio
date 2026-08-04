import { m, useTransform } from 'framer-motion'
import { useScene } from './hooks'
import Planet from './Planet'

const MOON_TONES = ['#b9b9c0', '#a7a7ae', '#8f8f97']

function Moon({ p, award, i }) {
  const start = 0.3 + i * 0.08
  const y = useTransform(p, [start, start + 0.11], [46, 0])
  const o = useTransform(p, [start, start + 0.09], [0, 1])
  return (
    <m.div className={`moon moon-${i}`} style={{ y, opacity: o }}>
      <svg viewBox="0 0 44 44" aria-hidden="true">
        <defs>
          <radialGradient id={`moon-g-${i}`} cx="36%" cy="30%" r="80%">
            <stop offset="0%" stopColor={MOON_TONES[i]} />
            <stop offset="100%" stopColor="#1c1c20" />
          </radialGradient>
        </defs>
        <circle cx="22" cy="22" r="17" fill={`url(#moon-g-${i})`} stroke="rgba(237,237,239,0.14)" strokeWidth="1" />
      </svg>
      <span className="mono moon-label">{award}</span>
    </m.div>
  )
}

function Moons({ p, awards }) {
  // three moons rise, staggered — one per client award
  return (
    <div className="moons">
      {awards.map((a, i) => (
        <Moon key={a} p={p} award={a} i={i} />
      ))}
    </div>
  )
}

/**
 * Scene template — a world flyby. The planet swings in on one side,
 * the mission log card unfolds on the other. Everything on the card
 * is the real resume entry.
 */
export default function WorldScene({ id, entry, world, epithet, log, exp, visual, flip, moons, current, height = 175 }) {
  const { ref, p, height: h } = useScene(height)

  const side = flip ? -1 : 1
  const plX = useTransform(p, [0, 0.16, 0.94, 1], [side * 300, 0, 0, side * -50])
  const plScale = useTransform(p, [0, 0.16], [0.6, 1])
  const plO = useTransform(p, [0, 0.08, 0.96, 1], [0, 1, 1, 0.5])

  const cardO = useTransform(p, [0.03, 0.14, 0.95, 1], [0, 1, 1, 0])
  const cardY = useTransform(p, [0.03, 0.15], [48, 0])
  const bulletsO = useTransform(p, [0.11, 0.26], [0, 1])
  const bulletsY = useTransform(p, [0.11, 0.26], [26, 0])
  const moonCap = useTransform(p, [0.46, 0.56], [0, 1])

  return (
    <section ref={ref} id={id} className="scn" style={{ height: h }}>
      <div className={`scn-stage world-stage${flip ? ' flip' : ''}`}>
        <m.div className="world-visual" style={{ x: plX, scale: plScale, opacity: plO }}>
          <div className="float-slower">
            <Planet world={visual} />
            {moons && <Moons p={p} awards={moons} />}
          </div>
          <div className="world-tag mono" aria-hidden="true">
            {world} · {epithet}
          </div>
        </m.div>

        <m.div className="world-card" style={{ opacity: cardO, y: cardY }}>
          <p className="kicker">
            Entry {entry} · World: {world}
          </p>
          <h2 className="world-h">
            {exp.role}
            <span className="world-org"> — {exp.org}{exp.client ? `, ${exp.client.split('—')[0].trim()}` : ''}</span>
          </h2>
          <p className="mono world-dates">
            {exp.dates} · {exp.duration}
            {current && (
              <span className="current-chip">
                <i className="pulse" /> Current station
              </span>
            )}
          </p>
          <p className="world-log">{log}</p>

          <m.ul className="world-points" style={{ opacity: bulletsO, y: bulletsY }}>
            {exp.points.map((pt) => (
              <li key={pt.slice(0, 24)}>{pt}</li>
            ))}
          </m.ul>

          {moons && (
            <m.p className="mono moon-caption" style={{ opacity: moonCap }}>
              Three moons rose in six months.
            </m.p>
          )}

          <div className="tags world-tags">
            {exp.tags.map((t) => (
              <span key={t} className="tag">
                {t}
              </span>
            ))}
          </div>
        </m.div>
      </div>
    </section>
  )
}
