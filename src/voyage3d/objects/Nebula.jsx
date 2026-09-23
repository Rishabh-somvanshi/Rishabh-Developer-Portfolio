import { useEffect, useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { ShaderMaterial } from 'three'
import { nebulaVertex, nebulaFragment } from '../shaders/nebula.glsl'
import { useStill } from '../MotionContext'

/** A faint amber-teal veil at the far end of the voyage, behind everything. */
export default function Nebula() {
  const still = useStill()
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: nebulaVertex,
        fragmentShader: nebulaFragment,
        uniforms: { uTime: { value: 0 } },
        transparent: true,
        depthWrite: false,
      }),
    [],
  )
  useEffect(() => () => material.dispose(), [material])
  useFrame((_, delta) => {
    if (!still) material.uniforms.uTime.value += delta
  })
  return (
    <mesh position={[0, 0, -1400]} material={material}>
      <planeGeometry args={[2400, 1600]} />
    </mesh>
  )
}
