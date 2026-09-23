import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Html } from '@react-three/drei'
import { AdditiveBlending, BufferAttribute, BufferGeometry, ShaderMaterial, Vector3 } from 'three'
import { streaksVertex, streaksFragment } from '../shaders/streaks.glsl'
import { useQuality } from '../quality/QualityProvider'
import { useSceneVisibility } from '../useSceneVisibility'
import { progress } from '../store'
import { sceneProgress } from '../sceneWindows'
import { interp } from '../interp'
import { mulberry32 } from '../random'
import { ORIGINS_CENTER } from '../camera/stations'
import { ORIGIN_METEORS } from '../../data/voyage'

const DIR = new Vector3(1, -0.5, 0.15).normalize()
const PATH = 200 // a meteor's loop length along DIR

/*
 * The four labelled fundamentals, placed where the old DOM meteors sat
 * (x%, y% of the field → world units around ORIGINS_CENTER), each drifting
 * along DIR with scroll at its old relative speed.
 */
const LABELLED = [
  { offset: [-46, 19, 0], speed: 1.1 },
  { offset: [13, 25, -10], speed: 0.85 },
  { offset: [24, -7, 5], speed: 1.45 },
  { offset: [-42, -10, 10], speed: 1.2 },
]

function Shower({ count, trail }) {
  const data = useMemo(() => {
    const rand = mulberry32(11)
    const base = new Float32Array(count * 3)
    const speed = new Float32Array(count)
    const phase = new Float32Array(count)
    const len = new Float32Array(count)
    const head = new Float32Array(count * 2)
    const amber = new Float32Array(count * 2)
    for (let i = 0; i < count; i++) {
      base[i * 3] = ORIGINS_CENTER[0] + (rand() - 0.5) * 180
      base[i * 3 + 1] = ORIGINS_CENTER[1] + (rand() - 0.5) * 100
      base[i * 3 + 2] = ORIGINS_CENTER[2] + (rand() - 0.5) * 120
      speed[i] = 20 + rand() * 30
      phase[i] = rand() * PATH
      len[i] = (4 + rand() * 6) * trail
      head[i * 2] = 0
      head[i * 2 + 1] = 1
      const a = rand() < 0.06 ? 1 : 0
      amber[i * 2] = a
      amber[i * 2 + 1] = a
    }
    const geometry = new BufferGeometry()
    geometry.setAttribute('position', new BufferAttribute(new Float32Array(count * 6), 3))
    geometry.setAttribute('aHead', new BufferAttribute(head, 1))
    geometry.setAttribute('aAmber', new BufferAttribute(amber, 1))
    return { base, speed, phase, len, geometry }
  }, [count, trail])

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: streaksVertex,
        fragmentShader: streaksFragment,
        uniforms: { uOpacity: { value: 0.8 } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [],
  )

  useEffect(() => () => data.geometry.dispose(), [data])
  useEffect(() => () => material.dispose(), [material])

  const ref = useRef()
  useFrame((state) => {
    if (!ref.current?.parent?.visible) return
    const t = state.clock.elapsedTime
    const pos = data.geometry.attributes.position.array
    for (let i = 0; i < count; i++) {
      const s = ((t * data.speed[i] + data.phase[i]) % PATH) - PATH / 2
      const hx = data.base[i * 3] + DIR.x * s
      const hy = data.base[i * 3 + 1] + DIR.y * s
      const hz = data.base[i * 3 + 2] + DIR.z * s
      const l = data.len[i]
      pos.set([hx - DIR.x * l, hy - DIR.y * l, hz - DIR.z * l, hx, hy, hz], i * 6)
    }
    data.geometry.attributes.position.needsUpdate = true
  })

  return <lineSegments ref={ref} geometry={data.geometry} material={material} frustumCulled={false} />
}

function LabelledMeteor({ label, amber, offset, speed, labelRef }) {
  const ref = useRef()
  useFrame(() => {
    const v = sceneProgress(progress.windows, progress.p, 'origins')
    const travel = interp(v, [0, 1], [-15, 25]) * speed
    ref.current.position.set(
      ORIGINS_CENTER[0] + offset[0] + DIR.x * travel,
      ORIGINS_CENTER[1] + offset[1] + DIR.y * travel,
      ORIGINS_CENTER[2] + offset[2] + DIR.z * travel,
    )
    if (labelRef.current) labelRef.current.style.opacity = String(interp(v, [-0.2, 0.05, 0.9, 1.1], [0, 1, 1, 0]))
  })
  return (
    <mesh ref={ref}>
      <sphereGeometry args={[0.9, 16, 12]} />
      <meshBasicMaterial color={amber ? '#f5a93d' : '#ededef'} toneMapped={false} />
      <Html center position={[0, -2.4, 0]} zIndexRange={[0, 0]} style={{ pointerEvents: 'none' }}>
        <span ref={labelRef} className={`mono moon-label${amber ? ' amber' : ''}`} aria-hidden="true" style={{ opacity: 0 }}>
          {label}
        </span>
      </Html>
    </mesh>
  )
}

/** Origin field: a background meteor shower plus the four labelled fundamentals. */
export default function MeteorField() {
  const { settings } = useQuality()
  const group = useRef()
  const labels = [useRef(), useRef(), useRef(), useRef()]
  useSceneVisibility(group, ['origins'])
  return (
    <group ref={group}>
      <Shower count={settings.meteors} trail={settings.trail} />
      {ORIGIN_METEORS.map((m, i) => (
        <LabelledMeteor key={m.label} {...m} {...LABELLED[i]} labelRef={labels[i]} />
      ))}
    </group>
  )
}
