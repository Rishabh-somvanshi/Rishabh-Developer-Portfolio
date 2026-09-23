import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { progress } from './store'
import { SCENE_IDS } from '../data/voyage'

/**
 * Hide an object unless one of its scenes is current or adjacent — the cheap
 * way to keep draw calls under budget. Everything stays visible until the
 * shaders have been pre-compiled, so nothing compiles mid-flight.
 */
export function useSceneVisibility(ref, sceneIds) {
  const indices = useMemo(() => sceneIds.map((id) => SCENE_IDS.indexOf(id)), [sceneIds])
  useFrame(() => {
    if (!ref.current || !progress.compiled) return
    ref.current.visible = indices.some((i) => Math.abs(i - progress.index) <= 1)
  })
}
