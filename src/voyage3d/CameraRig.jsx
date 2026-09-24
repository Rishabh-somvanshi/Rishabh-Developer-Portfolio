import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { progress } from './store'
import { cameraS, cameraSReduced } from './camera/path'
import { pxToWorldY } from './camera/framing'
import { buildCurves } from './camera/curves'
import { useLayout } from './LayoutProvider'
import { SCENE_IDS } from '../data/voyage'

const N = SCENE_IDS.length

/** Flies the one camera along the station splines, driven by the progress store. */
export default function CameraRig({ reduced }) {
  const layout = useLayout()
  const curves = useMemo(() => buildCurves(layout.stations), [layout])
  const camera = useThree((s) => s.camera)
  const pos = useMemo(() => new Vector3(), [])
  const look = useMemo(() => new Vector3(), [])
  const smoothLook = useMemo(() => new Vector3(), [])
  const initialised = useRef(false)

  useFrame((_, delta) => {
    const s = reduced ? cameraSReduced(progress, N) : cameraS(progress, N)
    const u = s / (N - 1)
    curves.position.getPoint(u, pos)
    curves.target.getPoint(u, look)
    // Phones: a card too tall for its stage slides up while pinned; drop the
    // camera by the same screen distance at the body's depth so the planet
    // rises with it, easing back out as the camera flies on to the next world.
    const px = progress.shift[SCENE_IDS[progress.index]] ?? 0
    if (px !== 0) {
      const st = layout.stations[progress.index]
      const depth = Math.abs(st.position[2] - st.target[2])
      const dy = pxToWorldY(px, progress.measure.viewport.h, depth, camera.fov) * (1 - progress.travel)
      pos.y += dy
      look.y += dy
    }
    if (reduced || !initialised.current) {
      camera.position.copy(pos)
      smoothLook.copy(look)
      initialised.current = true
    } else {
      // Lenis already smooths desktop scroll; this only settles touch scrolling and HUD jumps.
      const k = 1 - Math.exp(-delta * 6)
      camera.position.lerp(pos, k)
      smoothLook.lerp(look, k)
    }
    camera.lookAt(smoothLook)
  })

  return null
}
