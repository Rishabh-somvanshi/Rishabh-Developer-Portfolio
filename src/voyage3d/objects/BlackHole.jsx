import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { Billboard } from '@react-three/drei'
import { AdditiveBlending, Color, DoubleSide, ShaderMaterial } from 'three'
import { diskVertex, diskFragment } from '../shaders/disk.glsl'
import { glowVertex, glowFragment } from '../shaders/glow.glsl'
import { useQuality } from '../quality/QualityProvider'
import { useStill } from '../MotionContext'
import { useSceneVisibility } from '../useSceneVisibility'
import { progress } from '../store'
import { sceneProgress } from '../sceneWindows'
import { blackHoleScale } from '../blackHoleScale'
import { BODIES } from '../camera/stations'

const { center, radius: HORIZON } = BODIES.blackHole
const INNER = HORIZON * 1.3
const OUTER = HORIZON * 3.2

const disk = (upperOnly, outer) =>
  new ShaderMaterial({
    vertexShader: diskVertex,
    fragmentShader: diskFragment,
    uniforms: {
      uTime: { value: 0 },
      uInner: { value: INNER },
      uOuter: { value: outer },
      uUpperOnly: { value: upperOnly ? 1 : 0 },
      uOpacity: { value: 1 },
    },
    transparent: true,
    depthWrite: false,
    side: DoubleSide,
  })

/**
 * The singularity: event horizon, photon ring, a near edge-on accretion disk
 * and its lensed far side arching over the top. On HIGH the screen-space
 * lensing pass (Effects.jsx) bends the stars; below that a halo stands in:
 * rotating on MEDIUM, still on LOW.
 */
export default function BlackHole() {
  const { settings } = useQuality()
  const still = useStill()
  const group = useRef()
  const halo = useRef()
  const mats = useMemo(() => ({ flat: disk(false, OUTER), arc: disk(true, OUTER * 0.8) }), [])
  const glow = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: glowVertex,
        fragmentShader: glowFragment,
        uniforms: { uColor: { value: new Color('#f5a93d') }, uIntensity: { value: 0.5 }, uRing: { value: 0.3 } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [],
  )
  useEffect(
    () => () => {
      mats.flat.dispose()
      mats.arc.dispose()
      glow.dispose()
    },
    [mats, glow],
  )
  useSceneVisibility(group, ['singularity'])

  useFrame((state, delta) => {
    const v = sceneProgress(progress.windows, progress.p, 'singularity')
    group.current.scale.setScalar(blackHoleScale(v))
    // Disk streaks are self-driven off uTime; the group scale above (v) is scroll-driven and stays.
    const t = still ? 0 : state.clock.elapsedTime
    mats.flat.uniforms.uTime.value = t
    mats.arc.uniforms.uTime.value = t
    if (halo.current && settings.lensing === 'sprite' && !still) halo.current.rotation.z += delta * 0.2
  })

  return (
    <group ref={group} position={center}>
      <mesh>
        <sphereGeometry args={[HORIZON, 48, 32]} />
        <meshBasicMaterial color="#000000" />
      </mesh>
      <mesh rotation={[Math.PI / 2 - 0.22, 0, 0]}>
        <torusGeometry args={[HORIZON * 1.12, 0.12, 12, 96]} />
        <meshBasicMaterial color="#ffd694" toneMapped={false} />
      </mesh>
      <mesh material={mats.flat} rotation={[-1.35, 0, 0]}>
        <ringGeometry args={[INNER, OUTER, 128, 1]} />
      </mesh>
      <mesh material={mats.arc} position={[0, 0, -0.5]}>
        <ringGeometry args={[INNER, OUTER * 0.8, 128, 1]} />
      </mesh>
      {settings.lensing !== 'screen' && (
        <Billboard>
          <mesh ref={halo} material={glow}>
            <planeGeometry args={[OUTER * 2.6, OUTER * 2.6]} />
          </mesh>
        </Billboard>
      )}
    </group>
  )
}
