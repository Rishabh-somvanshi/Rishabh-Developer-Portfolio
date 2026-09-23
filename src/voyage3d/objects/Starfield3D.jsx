import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, ShaderMaterial } from 'three'
import { starsVertex, starsFragment } from '../shaders/stars.glsl'
import { useQuality } from '../quality/QualityProvider'
import { useStill } from '../MotionContext'
import { mulberry32 } from '../random'

/** Every star along the whole voyage, in one draw call. 6% burn amber, as in the 2D field. */
export default function Starfield3D() {
  const { settings } = useQuality()
  const still = useStill()
  const count = settings.stars

  const geometry = useMemo(() => {
    const rand = mulberry32(7)
    const pos = new Float32Array(count * 3)
    const size = new Float32Array(count)
    const phase = new Float32Array(count)
    const amber = new Float32Array(count)
    for (let i = 0; i < count; i++) {
      pos[i * 3] = (rand() - 0.5) * 1400
      pos[i * 3 + 1] = (rand() - 0.5) * 1000
      pos[i * 3 + 2] = 200 - rand() * 1300
      size[i] = 0.6 + rand() * 1.6
      phase[i] = rand() * 6.2831
      amber[i] = rand() < 0.06 ? 1 : 0
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(pos, 3))
    g.setAttribute('aSize', new BufferAttribute(size, 1))
    g.setAttribute('aPhase', new BufferAttribute(phase, 1))
    g.setAttribute('aAmber', new BufferAttribute(amber, 1))
    return g
  }, [count])

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: starsVertex,
        fragmentShader: starsFragment,
        uniforms: { uTime: { value: 0 }, uPixelRatio: { value: 1 } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [],
  )

  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])

  useFrame((state, delta) => {
    if (!still) material.uniforms.uTime.value += delta
    material.uniforms.uPixelRatio.value = state.gl.getPixelRatio()
  })

  return <points geometry={geometry} material={material} frustumCulled={false} />
}
