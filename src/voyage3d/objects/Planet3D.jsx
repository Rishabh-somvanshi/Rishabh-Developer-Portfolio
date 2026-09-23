import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BackSide, Color, ShaderMaterial, Vector3 } from 'three'
import { planetVertex, planetFragment } from '../shaders/planet.glsl'
import { atmosphereVertex, atmosphereFragment } from '../shaders/atmosphere.glsl'
import { cloudsFragment } from '../shaders/clouds.glsl'
import { useQuality } from '../quality/QualityProvider'
import { useStill } from '../MotionContext'
import { SUN_DIR } from '../camera/stations'

const sun = () => new Vector3(...SUN_DIR)

/**
 * A procedural world. `children` (rings, moons) sit in the outer group so
 * they don't spin with the surface. `physical` swaps the shader for a
 * MeshPhysicalMaterial (Porcelain's glaze). `onFrame(material, t)` lets a
 * world drive its own uniforms from scroll (the Vault's shield).
 */
export default function Planet3D({
  center,
  radius,
  scale = 1,
  palette,
  spin = 0,
  flat = false,
  lights = 0,
  seams = false,
  bandFreq = 3,
  bandSpeed = 0.02,
  aura = null,
  auraPulseHz = 0,
  clouds = false,
  physical = null,
  onFrame,
  children,
}) {
  const { settings } = useQuality()
  const still = useStill()
  const spinRef = useRef()

  const surface = useMemo(
    () =>
      physical
        ? null
        : new ShaderMaterial({
            vertexShader: planetVertex,
            fragmentShader: planetFragment,
            uniforms: {
              uTop: { value: new Color(palette.top) },
              uBottom: { value: new Color(palette.bottom) },
              uBand: { value: new Color(palette.band) },
              uSunDir: { value: sun() },
              uTime: { value: 0 },
              uOctaves: { value: 3 },
              uBandFreq: { value: bandFreq },
              uBandSpeed: { value: bandSpeed },
              uLights: { value: lights ? 1 : 0 },
              uSeams: { value: seams ? 1 : 0 },
              uShield: { value: 0 },
              uFlat: { value: flat ? 1 : 0 },
            },
          }),
    // Built once per world: these props are static configuration.
    [],
  )

  const atmosphere = useMemo(
    () =>
      aura &&
      new ShaderMaterial({
        vertexShader: atmosphereVertex,
        fragmentShader: atmosphereFragment,
        uniforms: { uColor: { value: new Color(aura) }, uIntensity: { value: 1 }, uSunDir: { value: sun() } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: BackSide,
      }),
    [],
  )

  const cloudLayer = useMemo(
    () =>
      clouds &&
      new ShaderMaterial({
        vertexShader: planetVertex,
        fragmentShader: cloudsFragment,
        uniforms: { uSunDir: { value: sun() }, uTime: { value: 0 }, uOctaves: { value: 3 } },
        transparent: true,
        depthWrite: false,
      }),
    [],
  )

  useEffect(
    () => () => {
      surface?.dispose()
      atmosphere?.dispose()
      cloudLayer?.dispose()
    },
    [surface, atmosphere, cloudLayer],
  )

  useFrame((state, delta) => {
    // Reduced motion holds the surface/cloud/aura animation at its t=0 frame
    // instead of advancing it (B3) — spin is gated separately since it's an
    // incremental rotation, not driven off this same clock read.
    const t = still ? 0 : state.clock.elapsedTime
    if (surface) {
      surface.uniforms.uTime.value = t
      surface.uniforms.uOctaves.value = settings.octaves
    }
    if (cloudLayer) {
      cloudLayer.uniforms.uTime.value = t
      cloudLayer.uniforms.uOctaves.value = settings.octaves
    }
    if (atmosphere && auraPulseHz) {
      atmosphere.uniforms.uIntensity.value = 0.85 + 0.25 * Math.sin(t * Math.PI * 2 * auraPulseHz)
    }
    if (spinRef.current && !still) spinRef.current.rotation.y += delta * spin
    onFrame?.(surface, t)
  })

  return (
    <group position={center} scale={scale}>
      <group ref={spinRef}>
        <mesh material={surface ?? undefined}>
          {flat ? <icosahedronGeometry args={[radius, 3]} /> : <sphereGeometry args={[radius, 96, 64]} />}
          {physical && <meshPhysicalMaterial {...physical} />}
        </mesh>
        {cloudLayer && (
          <mesh material={cloudLayer} visible={settings.clouds}>
            <sphereGeometry args={[radius * 1.025, 64, 48]} />
          </mesh>
        )}
      </group>
      {atmosphere && (
        <mesh material={atmosphere} scale={1.12}>
          <sphereGeometry args={[radius, 64, 48]} />
        </mesh>
      )}
      {children}
    </group>
  )
}
