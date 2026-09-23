import { useEffect, useMemo } from 'react'
import { Color, DoubleSide, ShaderMaterial } from 'three'
import { ringVertex, ringFragment } from '../shaders/ring.glsl'

/** Banded ring, tilted like the old SVG rings (tilt in degrees). */
export default function Ring({ radius, color, tilt = -18 }) {
  const inner = radius * 1.3
  const outer = radius * 1.75 // retired SVG rings reached 1.72 × radius
  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: ringVertex,
        fragmentShader: ringFragment,
        uniforms: { uColor: { value: new Color(color) }, uInner: { value: inner }, uOuter: { value: outer } },
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
      }),
    [color, inner, outer],
  )
  useEffect(() => () => material.dispose(), [material])
  return (
    <mesh material={material} rotation={[-Math.PI / 2 + 0.35, 0, (tilt * Math.PI) / 180]}>
      <ringGeometry args={[inner, outer, 128, 1]} />
    </mesh>
  )
}
