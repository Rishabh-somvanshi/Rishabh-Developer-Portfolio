import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { useTexture } from '@react-three/drei'
import { AdditiveBlending, BackSide, Color, ShaderMaterial, SRGBColorSpace, Vector3 } from 'three'
import { planetVertex, planetFragment } from '../shaders/planet.glsl'
import { atmosphereVertex, atmosphereFragment } from '../shaders/atmosphere.glsl'
import { cloudsFragment } from '../shaders/clouds.glsl'
import { useQuality } from '../quality/QualityProvider'
import { useStill } from '../MotionContext'
import { SUN_DIR } from '../camera/stations'

/**
 * A world's surface. `map` (a URL) switches the shader from procedural fbm
 * to a photo texture sampled by sphere UV — realism then comes from
 * rotation only, not a time-driven morph. `tint` multiplies the texture to
 * keep each world's palette; `nightMap` adds real night-side lights (Earth);
 * `cloudMap` gives the cloud layer its own texture instead of procedural
 * noise. `children` (rings, moons) sit in the outer group so they don't
 * spin with the surface. `physical` swaps the shader for a
 * MeshPhysicalMaterial (Porcelain's glaze) — `map` still applies to it.
 * `onFrame(material, t)` lets a world drive its own uniforms from scroll
 * (the Vault's shield). `sunDir` overrides the one global sun for a single
 * world (Earth, seen mostly night-side at dawn) — defaults to SUN_DIR.
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
  map = null,
  tint = '#ffffff',
  nightMap = null,
  cloudMap = null,
  physical = null,
  sunDir = SUN_DIR,
  onFrame,
  children,
}) {
  const { settings } = useQuality()
  const still = useStill()
  const spinRef = useRef()
  const cloudRef = useRef()
  const sun = () => new Vector3(...sunDir)

  const urls = useMemo(() => {
    const u = {}
    if (map) u.map = map
    if (nightMap) u.nightMap = nightMap
    if (cloudMap) u.cloudMap = cloudMap
    return u
  }, [map, nightMap, cloudMap])
  const textures = useTexture(urls)
  const { map: mapTex, nightMap: nightTex, cloudMap: cloudTex } = textures

  useEffect(() => {
    if (mapTex) {
      mapTex.colorSpace = SRGBColorSpace
      mapTex.anisotropy = 4
    }
    if (nightTex) {
      nightTex.colorSpace = SRGBColorSpace
      nightTex.anisotropy = 4
    }
  }, [mapTex, nightTex])

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
              uMap: { value: mapTex ?? null },
              uUseMap: { value: mapTex ? 1 : 0 },
              uTint: { value: new Color(tint) },
              uNightMap: { value: nightTex ?? null },
              uUseNight: { value: nightTex ? 1 : 0 },
            },
          }),
    // Built once per world: these props (and the resolved textures, already
    // loaded by the time this renders — see the Suspense boundary in Scene)
    // are static configuration.
    [],
  )

  const atmosphere = useMemo(
    () =>
      aura ? new ShaderMaterial({
        vertexShader: atmosphereVertex,
        fragmentShader: atmosphereFragment,
        uniforms: { uColor: { value: new Color(aura) }, uIntensity: { value: 0.6 }, uSunDir: { value: sun() } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
        side: BackSide,
      }) : null,
    [],
  )

  const cloudLayer = useMemo(
    () =>
      cloudTex ? new ShaderMaterial({
        vertexShader: planetVertex,
        fragmentShader: cloudsFragment,
        uniforms: { uSunDir: { value: sun() }, uCloudMap: { value: cloudTex } },
        transparent: true,
        depthWrite: false,
      }) : null,
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
    // Reduced motion holds the aura pulse at its t=0 frame instead of
    // advancing it (B3) — spin is gated separately since it's an
    // incremental rotation, not driven off this same clock read.
    const t = still ? 0 : state.clock.elapsedTime
    if (surface) {
      surface.uniforms.uTime.value = t
      surface.uniforms.uOctaves.value = settings.octaves
    }
    if (atmosphere && auraPulseHz) {
      atmosphere.uniforms.uIntensity.value = 0.85 + 0.25 * Math.sin(t * Math.PI * 2 * auraPulseHz)
    }
    if (spinRef.current && !still) spinRef.current.rotation.y += delta * spin
    if (cloudRef.current && !still) cloudRef.current.rotation.y += delta * spin * 0.4
    onFrame?.(surface, t)
  })

  return (
    <group position={center} scale={scale}>
      <group ref={spinRef}>
        <mesh material={surface ?? undefined}>
          {flat ? <icosahedronGeometry args={[radius, 3]} /> : <sphereGeometry args={[radius, 96, 64]} />}
          {physical && <meshPhysicalMaterial {...physical} map={mapTex ?? physical.map} />}
        </mesh>
      </group>
      {cloudLayer && (
        <group ref={cloudRef}>
          <mesh material={cloudLayer} visible={settings.clouds}>
            <sphereGeometry args={[radius * 1.012, 64, 48]} />
          </mesh>
        </group>
      )}
      {atmosphere && (
        <mesh material={atmosphere} scale={1.04}>
          <sphereGeometry args={[radius, 64, 48]} />
        </mesh>
      )}
      {children}
    </group>
  )
}
