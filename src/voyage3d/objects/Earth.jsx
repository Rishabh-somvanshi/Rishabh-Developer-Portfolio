import { useEffect, useMemo, useRef } from 'react'
import { AdditiveBlending, Color, ShaderMaterial } from 'three'
import Planet3D from './Planet3D'
import { glowVertex, glowFragment } from '../shaders/glow.glsl'
import { useSceneVisibility } from '../useSceneVisibility'
import { BODIES } from '../camera/stations'

/* Earth at dawn: the palette of the old CSS horizon (#35606b → #12262e). */
const EARTH = { top: '#35606b', bottom: '#12262e', band: '#22434e' }

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
      <Planet3D {...BODIES.earth} palette={EARTH} spin={0.01} bandFreq={0} lights={1} aura="#8fc0b4" clouds />
      <mesh material={sunrise} position={[-40, -38, -880]}>
        <planeGeometry args={[260, 120]} />
      </mesh>
    </group>
  )
}
