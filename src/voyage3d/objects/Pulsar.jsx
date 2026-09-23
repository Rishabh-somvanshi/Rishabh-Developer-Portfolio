import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Color, DoubleSide, ShaderMaterial } from 'three'
import { beamVertex, beamFragment } from '../shaders/beam.glsl'
import { useLayout } from '../LayoutProvider'
import { useStill } from '../MotionContext'
import { useSceneVisibility } from '../useSceneVisibility'
import { progress } from '../store'
import { sceneProgress } from '../sceneWindows'
import { interp } from '../interp'
import { PULSAR_PERIOD_S } from '../../data/voyage'

const OMEGA = (Math.PI * 2) / PULSAR_PERIOD_S

/**
 * Expense Tracker — "keeps perfect time". A neutron star with two beams on a
 * tilted axis; one rotation per PULSAR_PERIOD_S, the same clock as the audio
 * tick. Visible only during beat B.
 */
export default function Pulsar() {
  const { twin } = useLayout()
  const still = useStill()
  const group = useRef()
  const spin = useRef()
  const core = useRef()
  const r = twin.pulsar?.radius ?? 1
  const height = r * 4
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: beamVertex,
        fragmentShader: beamFragment,
        uniforms: { uColor: { value: new Color('#dfe9ff') }, uOpacity: { value: 0 }, uHeight: { value: height } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: DoubleSide,
      }),
    [height],
  )
  useEffect(() => () => material.dispose(), [material])
  useSceneVisibility(group, ['stars'])

  useFrame((_, delta) => {
    if (!twin.pulsar) return
    const v = sceneProgress(progress.windows, progress.p, 'stars')
    const beat = interp(v, [0.58, 0.64, 0.96, 1], [0, 1, 1, 0])
    material.uniforms.uOpacity.value = beat
    core.current.scale.setScalar(Math.max(beat, 0.0001))
    if (!still) spin.current.rotation.y += delta * OMEGA
  })

  if (!twin.pulsar) return null
  return (
    <group ref={group} position={twin.pulsar.position}>
      <mesh ref={core}>
        <sphereGeometry args={[r * 0.18, 24, 16]} />
        <meshBasicMaterial color="#dfe9ff" toneMapped={false} />
      </mesh>
      <group ref={spin}>
        <group rotation={[0, 0, 0.6]}>
          {/* ConeGeometry's apex is at +height/2: the upper cone is flipped so both apexes meet at the star. */}
          <mesh material={material} position={[0, height / 2, 0]} rotation={[Math.PI, 0, 0]}>
            <coneGeometry args={[r * 0.45, height, 24, 1, true]} />
          </mesh>
          <mesh material={material} position={[0, -height / 2, 0]}>
            <coneGeometry args={[r * 0.45, height, 24, 1, true]} />
          </mesh>
        </group>
      </group>
    </group>
  )
}
