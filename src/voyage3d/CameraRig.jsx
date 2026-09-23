import { useMemo, useRef } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { Vector3 } from 'three'
import { progress } from './store'
import { cameraS, cameraSReduced } from './camera/path'
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
  const smoothLook = useRef(null)

  useFrame((_, delta) => {
    const s = reduced ? cameraSReduced(progress, N) : cameraS(progress, N)
    const u = s / (N - 1)
    curves.position.getPoint(u, pos)
    curves.target.getPoint(u, look)
    if (reduced || !smoothLook.current) {
      camera.position.copy(pos)
      smoothLook.current = look.clone()
    } else {
      // Lenis already smooths desktop scroll; this only settles touch scrolling and HUD jumps.
      const k = 1 - Math.exp(-delta * 6)
      camera.position.lerp(pos, k)
      smoothLook.current.lerp(look, k)
    }
    camera.lookAt(smoothLook.current)
  })

  return null
}
