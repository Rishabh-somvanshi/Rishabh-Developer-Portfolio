import { useRef } from 'react'
import { m, useTransform } from 'framer-motion'
import { useScene, useOverflowShift } from './hooks'
import { progress } from '../voyage3d/store'

/**
 * Scene template — a world flyby. The planet itself lives in the 3D world
 * (src/voyage3d); this scene reserves its slot — the same box the old SVG
 * planet filled, so every tuned breakpoint still holds — and the camera
 * frames the 3D planet into it. Everything on the card is the real résumé
 * entry.
 */
export default function WorldScene({ id, entry, world, epithet, log, exp, flip, moons, current, height = 175 }) {
  const { ref, p, height: h } = useScene(height)

  const tagO = useTransform(p, [0, 0.08, 0.96, 1], [0, 1, 1, 0.5])
  const cardO = useTransform(p, [0.03, 0.14, 0.95, 1], [0, 1, 1, 0])
  const cardRise = useTransform(p, [0.03, 0.15], [48, 0])
  const cardRef = useRef(null)
  const cardShift = useOverflowShift(cardRef, p, [0.26, 0.88], (px) => (progress.shift[id] = px))
  const cardY = useTransform([cardRise, cardShift], ([rise, shift]) => rise + shift)
  const bulletsO = useTransform(p, [0.11, 0.26], [0, 1])
  const bulletsY = useTransform(p, [0.11, 0.26], [26, 0])
  const moonCap = useTransform(p, [0.46, 0.56], [0, 1])

  return (
    <section ref={ref} id={id} className="scn" style={{ height: h }}>
      <div className={`scn-stage world-stage${flip ? ' flip' : ''}`}>
        <div className="world-visual">
          <div className="planet planet-slot" data-slot={id} aria-hidden="true" />
          <m.div className="world-tag mono" style={{ opacity: tagO }} aria-hidden="true">
            {world} · {epithet}
          </m.div>
        </div>

        <m.div ref={cardRef} className="world-card" style={{ opacity: cardO, y: cardY }}>
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
              Three moons rose in six months — {moons.join(' · ')}.
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
