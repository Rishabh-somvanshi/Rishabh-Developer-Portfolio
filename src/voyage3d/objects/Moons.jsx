import { useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { progress } from '../store'
import { sceneProgress } from '../sceneWindows'
import { clamp01, interp } from '../interp'
import { useStill } from '../MotionContext'
import { MOON_AWARDS, MOON_RISE } from '../../data/voyage'

const MOON_TONES = ['#b9b9c0', '#a7a7ae', '#8f8f97']

/**
 * Three award moons rise into orbit one by one as the reader arrives at
 * Mercantile (same rise times as the old DOM moons). The labels are
 * decorative; the names are also in the card's caption for screen readers
 * and the 2D fallback.
 */
export default function Moons({ radius }) {
  const moons = useRef([])
  const labels = useRef([])
  const still = useStill()

  useFrame((state) => {
    const v = sceneProgress(progress.windows, progress.p, 'mercantile')
    const presence = interp(v, [-0.3, 0, 1, 1.3], [0, 1, 1, 0])
    // Orbit angle is self-driven (t); rise (v, above) is scroll-driven and stays.
    const t = still ? 0 : state.clock.elapsedTime
    MOON_AWARDS.forEach((_, i) => {
      const moon = moons.current[i]
      if (!moon) return
      const rise = clamp01((v - MOON_RISE[i]) / 0.11)
      const orbit = radius * (1.7 + i * 0.28)
      const a = i * 2.1 + t * 0.15
      moon.position.set(
        Math.cos(a) * orbit,
        -(1 - rise) * radius * 0.8 + Math.sin(a * 0.7) * radius * 0.15,
        Math.sin(a) * orbit * 0.45,
      )
      moon.scale.setScalar(Math.max(rise, 0.0001))
      const label = labels.current[i]
      if (label) label.style.opacity = String(rise * presence)
    })
  })

  return MOON_AWARDS.map((award, i) => (
    <mesh key={award} ref={(el) => (moons.current[i] = el)}>
      <sphereGeometry args={[radius * 0.13, 32, 24]} />
      <meshStandardMaterial color={MOON_TONES[i]} roughness={0.9} />
      <Html center position={[0, radius * 0.24, 0]} zIndexRange={[0, 0]} style={{ pointerEvents: 'none' }}>
        <span ref={(el) => (labels.current[i] = el)} className="mono moon-label" aria-hidden="true" style={{ opacity: 0 }}>
          {award}
        </span>
      </Html>
    </mesh>
  ))
}
