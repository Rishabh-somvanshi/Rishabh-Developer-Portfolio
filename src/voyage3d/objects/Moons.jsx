import { useEffect, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { SRGBColorSpace } from 'three'
import { progress } from '../store'
import { sceneProgress } from '../sceneWindows'
import { clamp01 } from '../interp'
import { useStill } from '../MotionContext'
import { MOON_AWARDS, MOON_RISE } from '../../data/voyage'
// Orbit radii, as a multiple of the planet's own radius. The slot the DOM
// reserves for a framed planet is ~1.6 r wide (see camera/framing.js's FILL),
// so the widest orbit (1.5 r) plus the moon's own radius still lands inside
// it — nothing pokes out of the planet's box into the card/HUD rail.
const ORBIT_FACTOR = [1.2, 1.35, 1.5]

/**
 * Three award moons rise into orbit one by one as the reader arrives at
 * Mercantile (same rise times as the old DOM moons). No in-scene labels —
 * at the tighter 30° lens they'd sit on top of the planet — the award names
 * live in the card's caption for screen readers and the 2D fallback.
 */
export default function Moons({ radius, map }) {
  const moons = useRef([])
  const still = useStill()
  const textures = useTexture(map ? { map } : {})
  const moonTex = textures.map

  useEffect(() => {
    if (moonTex) {
      moonTex.colorSpace = SRGBColorSpace
      moonTex.anisotropy = 4
    }
  }, [moonTex])

  useFrame((state) => {
    const v = sceneProgress(progress.windows, progress.p, 'mercantile')
    // Orbit angle is self-driven (t); rise (v, above) is scroll-driven and stays.
    const t = still ? 0 : state.clock.elapsedTime
    MOON_AWARDS.forEach((_, i) => {
      const moon = moons.current[i]
      if (!moon) return
      const rise = clamp01((v - MOON_RISE[i]) / 0.11)
      const orbit = radius * ORBIT_FACTOR[i]
      const a = i * 2.1 + t * 0.15
      moon.position.set(
        Math.cos(a) * orbit,
        -(1 - rise) * radius * 0.6 + Math.sin(a * 0.7) * radius * 0.15,
        Math.sin(a) * orbit * 0.35,
      )
      moon.scale.setScalar(Math.max(rise, 0.0001))
    })
  })

  return MOON_AWARDS.map((award, i) => (
    <mesh key={award} ref={(el) => (moons.current[i] = el)}>
      <sphereGeometry args={[radius * 0.13, 32, 24]} />
      <meshStandardMaterial map={moonTex} roughness={0.9} />
    </mesh>
  ))
}
