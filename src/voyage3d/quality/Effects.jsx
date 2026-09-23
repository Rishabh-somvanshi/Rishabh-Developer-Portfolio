import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { EffectComposer, Bloom } from '@react-three/postprocessing'
import { Effect } from 'postprocessing'
import { Uniform, Vector2, Vector3 } from 'three'
import { useQuality } from './QualityProvider'
import { progress } from '../store'
import { sceneProgress } from '../sceneWindows'
import { wellCurve } from '../fxCurves'
import { BODIES } from '../camera/stations'

/**
 * Gravitational lensing as a screen-space UV warp: pixels near the black
 * hole sample from closer to its centre, so the stars behind it appear
 * pushed outward into a ring. Strength follows the same wellCurve the 2D
 * fallback starfield uses.
 */
const lensingFragment = /* glsl */ `
uniform vec2 uCenter;
uniform float uStrength;
uniform float uRadius;
uniform float uAspect;

void mainUv(inout vec2 uv) {
  vec2 d = uv - uCenter;
  d.x *= uAspect;
  float r = max(length(d), 1e-4);
  float bend = min(uStrength * uRadius * uRadius / r, r * 0.9);
  vec2 dir = d / r;
  dir.x /= uAspect;
  uv -= dir * bend;
}

void mainImage(const in vec4 inputColor, const in vec2 uv, out vec4 outputColor) {
  outputColor = inputColor;
}
`

class LensingEffect extends Effect {
  constructor() {
    super('LensingEffect', lensingFragment, {
      uniforms: new Map([
        ['uCenter', new Uniform(new Vector2(0.5, 0.5))],
        ['uStrength', new Uniform(0)],
        ['uRadius', new Uniform(0.05)],
        ['uAspect', new Uniform(1)],
      ]),
    })
  }
}

const HOLE = new Vector3(...BODIES.blackHole.center)
const LENS_REACH = 4 // lens radius in horizon radii

function Lensing() {
  const effect = useMemo(() => new LensingEffect(), [])
  const projected = useMemo(() => new Vector3(), [])
  useEffect(() => () => effect.dispose(), [effect])

  useFrame(({ camera, size }) => {
    const u = effect.uniforms
    projected.copy(HOLE).project(camera)
    const inView = projected.z > -1 && projected.z < 1
    const v = sceneProgress(progress.windows, progress.p, 'singularity')
    u.get('uStrength').value = inView ? wellCurve(v) : 0
    u.get('uCenter').value.set((projected.x + 1) / 2, (projected.y + 1) / 2)
    u.get('uAspect').value = size.width / size.height
    const dist = camera.position.distanceTo(HOLE)
    const tanHalf = Math.tan(((camera.fov * Math.PI) / 180) / 2)
    u.get('uRadius').value = ((BODIES.blackHole.radius * LENS_REACH) / (dist * tanHalf)) / 2
  })

  return <primitive object={effect} dispose={null} />
}

/** Post-processing per tier. Vignette and grain stay the DOM .voyage-atmosphere layer. */
export default function Effects() {
  const { settings } = useQuality()
  if (!settings.bloom) return null
  return (
    <EffectComposer multisampling={0}>
      <Bloom
        mipmapBlur
        intensity={0.9}
        luminanceThreshold={0.6}
        luminanceSmoothing={0.2}
        resolutionScale={settings.bloomScale}
      />
      {settings.lensing === 'screen' && <Lensing />}
    </EffectComposer>
  )
}
