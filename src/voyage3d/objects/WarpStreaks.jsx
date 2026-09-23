import { useEffect, useMemo, useRef } from 'react'
import { useFrame } from '@react-three/fiber'
import { AdditiveBlending, BufferAttribute, BufferGeometry, ShaderMaterial } from 'three'
import { warpVertex, warpFragment } from '../shaders/warp.glsl'
import { useQuality } from '../quality/QualityProvider'
import { progress } from '../store'
import { sceneProgress } from '../sceneWindows'
import { travelFx } from '../camera/path'
import { warpCurve } from '../fxCurves'
import { mulberry32 } from '../random'

/**
 * Stars stretching into streaks: lightly during every flight between
 * stations, fully during re-entry. Rides with the camera.
 */
export default function WarpStreaks() {
  const { settings } = useQuality()
  const count = settings.meteors * 2
  const group = useRef()

  const geometry = useMemo(() => {
    const rand = mulberry32(23)
    const pos = new Float32Array(count * 6)
    const head = new Float32Array(count * 2)
    const baseZ = new Float32Array(count * 2)
    for (let i = 0; i < count; i++) {
      const a = rand() * Math.PI * 2
      const r = 4 + rand() * 36
      const z = -5 - rand() * 115
      for (let k = 0; k < 2; k++) {
        pos.set([Math.cos(a) * r, Math.sin(a) * r, 0], (i * 2 + k) * 3)
        head[i * 2 + k] = k
        baseZ[i * 2 + k] = z
      }
    }
    const g = new BufferGeometry()
    g.setAttribute('position', new BufferAttribute(pos, 3))
    g.setAttribute('aHead', new BufferAttribute(head, 1))
    g.setAttribute('aBaseZ', new BufferAttribute(baseZ, 1))
    return g
  }, [count])

  const material = useMemo(
    () =>
      new ShaderMaterial({
        vertexShader: warpVertex,
        fragmentShader: warpFragment,
        uniforms: { uTime: { value: 0 }, uSpeed: { value: 40 }, uLen: { value: 2 }, uOpacity: { value: 0 } },
        transparent: true,
        depthWrite: false,
        blending: AdditiveBlending,
      }),
    [],
  )
  useEffect(() => () => geometry.dispose(), [geometry])
  useEffect(() => () => material.dispose(), [material])

  useFrame((state) => {
    const w = Math.max(travelFx(progress) * 0.35, warpCurve(sceneProgress(progress.windows, progress.p, 'reentry')))
    group.current.visible = w > 0.02
    if (!group.current.visible) return
    group.current.position.copy(state.camera.position)
    group.current.quaternion.copy(state.camera.quaternion)
    const u = material.uniforms
    u.uTime.value = state.clock.elapsedTime
    u.uSpeed.value = 40 + w * 160
    u.uLen.value = 2 + w * 28
    u.uOpacity.value = w
  })

  return (
    <group ref={group}>
      <lineSegments geometry={geometry} material={material} frustumCulled={false} />
    </group>
  )
}
