import { useMemo } from 'react'
import { useFrame } from '@react-three/fiber'
import { progress } from './store'
import { SCENE_IDS } from '../data/voyage'

/**
 * An object is visible only while one of its scenes is the *current* scene,
 * or while the camera is flying INTO it from the scene just before it. A
 * body must never sit behind another scene's card text, so simple adjacency
 * (previous/current/next) is too generous — it left the next planet visible
 * behind the current card, and the previous planet visible behind the next
 * one. Flying OUT of a scene still shows its body, because `index` holds
 * steady at the departing scene's index right up to the hand-over; it's only
 * flying IN — `index` already at the destination, `travel` counting up from
 * the previous scene — that needs the extra +1 lookahead.
 */
export function isVisibleIn(sceneIndices, { index, travel }) {
  return sceneIndices.some((i) => index === i || (index === i - 1 && travel > 0))
}

/**
 * Hide an object unless one of its scenes is current, or is being flown into
 * from this one — see `isVisibleIn`. Everything stays visible until the
 * shaders have been pre-compiled, so nothing compiles mid-flight.
 */
export function useSceneVisibility(ref, sceneIds) {
  const indices = useMemo(() => sceneIds.map((id) => SCENE_IDS.indexOf(id)), [sceneIds])
  useFrame(() => {
    if (!ref.current || !progress.compiled) return
    ref.current.visible = isVisibleIn(indices, progress)
  })
}
