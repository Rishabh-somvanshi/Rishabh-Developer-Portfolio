import { useEffect, useMemo, useRef } from 'react'
import { AdditiveBlending, Color, ShaderMaterial } from 'three'
import Planet3D from './Planet3D'
import { glowVertex, glowFragment } from '../shaders/glow.glsl'
import { useSceneVisibility } from '../useSceneVisibility'
import { BODIES } from '../camera/stations'

/* Earth at dawn: the palette of the old CSS horizon (#35606b → #12262e). */
const EARTH = { top: '#35606b', bottom: '#12262e', band: '#22434e' }

/**
 * Earth's own sun, not the scene's SUN_DIR: aimed from behind and above the
 * limb so the camera (home station, looking almost straight down −z at the
 * globe from above) sees mostly night side, with a thin dawn crescent along
 * the near-top edge instead of a face-lit daylight dome.
 */
const EARTH_SUN_DIR = [-0.2, 0.45, -0.87]

/** Home. Night-side city lights, a teal limb, and the sun cresting behind it. */
export default function Earth() {
  const group = useRef()
  useSceneVisibility(group, ['home'])
  const sunrise = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: glowVertex,
        fragmentShader: glowFragment,
        uniforms: { uColor: { value: new Color('#e8942a') }, uIntensity: { value: 0.55 }, uRing: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [],
  )
  useEffect(() => () => sunrise.dispose(), [sunrise])

  return (
    <group ref={group}>
      <Planet3D
        {...BODIES.earth}
        palette={EARTH}
        spin={0.01}
        aura="#8fc0b4"
        map="/textures/earth_day.webp"
        nightMap="/textures/earth_night.webp"
        cloudMap="/textures/earth_clouds.webp"
        sunDir={EARTH_SUN_DIR}
      />
      {/* Glow plane behind the limb, positioned toward EARTH_SUN_DIR from the
          globe's centre so it lines up with the actual dawn terminator, not
          the old face-on one. Its x shrinks with the sun's smaller sideways
          lean (was tuned against a −0.6 x component, now −0.2) and it sits
          nearer the pole (y) than the sub-solar point so it reads as glow
          just above the visible limb rather than mid-disc; z stays behind
          Earth's centre so it's occluded except right at the rim. */}
      <mesh material={sunrise} position={[-16, -34, -840]}>
        <planeGeometry args={[260, 120]} />
      </mesh>
    </group>
  )
}
