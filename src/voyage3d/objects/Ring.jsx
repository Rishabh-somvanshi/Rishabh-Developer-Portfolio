import { useEffect, useMemo } from 'react'
import { useTexture } from '@react-three/drei'
import { Color, DoubleSide, ShaderMaterial, SRGBColorSpace } from 'three'
import { ringVertex, ringFragment } from '../shaders/ring.glsl'

/**
 * Banded ring, tilted like the old SVG rings (tilt in degrees). With `map`
 * (a URL, e.g. the saturn ring alpha strip), the ring samples that texture
 * radially instead of the procedural band pattern, tinted by `color`.
 */
export default function Ring({ radius, color, tilt = -18, map }) {
  const inner = radius * 1.3
  const outer = radius * 1.75 // retired SVG rings reached 1.72 × radius
  const textures = useTexture(map ? { map } : {})
  const mapTex = textures.map

  useEffect(() => {
    if (mapTex) {
      mapTex.colorSpace = SRGBColorSpace
      mapTex.anisotropy = 4
    }
  }, [mapTex])

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: ringVertex,
        fragmentShader: ringFragment,
        uniforms: {
          uColor: { value: new Color(color) },
          uInner: { value: inner },
          uOuter: { value: outer },
          uMap: { value: mapTex ?? null },
          uUseMap: { value: mapTex ? 1 : 0 },
        },
        transparent: true,
        depthWrite: false,
        side: DoubleSide,
      }),
    // Built once: color/inner/outer/map are static per-world configuration.
    [],
  )
  useEffect(() => () => material.dispose(), [material])
  return (
    <mesh material={material} rotation={[-Math.PI / 2 + 0.35, 0, (tilt * Math.PI) / 180]}>
      <ringGeometry args={[inner, outer, 128, 1]} />
    </mesh>
  )
}
