import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, Color, ShaderMaterial } from 'three'
import { shellVertex, shellFragment } from '../shaders/shell.glsl'
import { useLayout } from '../LayoutProvider'
import { useSceneVisibility } from '../useSceneVisibility'
import { progress } from '../store'
import { sceneProgress } from '../sceneWindows'
import { interp } from '../interp'

const shell = () =>
  new ShaderMaterial({
    vertexShader: shellVertex,
    fragmentShader: shellFragment,
    uniforms: { uColor: { value: new Color('#f5a93d') }, uOpacity: { value: 0 } },
    transparent: true,
    depthWrite: false,
    blending: AdditiveBlending,
  })

/**
 * Wedding Command Centre — "went off beautifully". Detonation scrubbed by
 * scroll with the same keyframes the CSS supernova used; visible only during
 * beat A of the twin-lights scene.
 */
export default function Supernova() {
  const { twin } = useLayout()
  const group = useRef()
  const core = useRef()
  const rings = useRef([])
  const mats = useMemo(() => [shell(), shell()], [])
  useEffect(() => () => mats.forEach((m) => m.dispose()), [mats])
  useSceneVisibility(group, ['stars'])

  useFrame(() => {
    if (!twin.nova) return
    const v = sceneProgress(progress.windows, progress.p, 'stars')
    const beat = interp(v, [0.19, 0.26, 0.52, 0.58], [0, 1, 1, 0])
    core.current.scale.setScalar(Math.max(interp(v, [0.16, 0.26, 0.48], [0.4, 1.18, 1]) * beat, 0.0001))
    const r1 = interp(v, [0.18, 0.4], [0.15, 1.5])
    const r2 = interp(v, [0.22, 0.48], [0.1, 1.9])
    rings.current[0].scale.setScalar(r1)
    rings.current[1].scale.setScalar(r2)
    mats[0].uniforms.uOpacity.value = interp(v, [0.18, 0.28, 0.44], [0, 0.8, 0]) * beat
    mats[1].uniforms.uOpacity.value = interp(v, [0.22, 0.32, 0.5], [0, 0.55, 0]) * beat
  })

  if (!twin.nova) return null
  const r = twin.nova.radius
  return (
    <group ref={group} position={twin.nova.position}>
      <mesh ref={core}>
        <sphereGeometry args={[r * 0.35, 32, 24]} />
        <meshBasicMaterial color="#ffd9a0" toneMapped={false} />
      </mesh>
      {mats.map((m, i) => (
        <mesh key={i} ref={(el) => (rings.current[i] = el)} material={m}>
          <sphereGeometry args={[r, 48, 32]} />
        </mesh>
      ))}
    </group>
  )
}
