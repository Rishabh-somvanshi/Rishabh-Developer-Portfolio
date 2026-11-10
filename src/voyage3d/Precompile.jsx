import { useEffect } from 'react'
import { useThree } from '@react-three/fiber'

/**
 * Compile every material in the scene once, so no body hitches the frame it
 * first comes into view. gl.compile() walks the whole scene — hidden objects
 * included — so this never needs anything made visible for it.
 *
 * Place one inside each Suspense boundary, after the textured body: it then
 * runs when that body's textures have resolved and it has mounted. Later
 * passes are cheap (already-compiled programs are cached).
 */
export default function Precompile({ onDone }) {
  const gl = useThree((s) => s.gl)
  const scene = useThree((s) => s.scene)
  const camera = useThree((s) => s.camera)
  useEffect(() => {
    const id = requestAnimationFrame(() => {
      try {
        gl.compile(scene, camera)
      } catch {
        /* fall back to compiling lazily on first sight */
      }
      onDone?.()
    })
    return () => cancelAnimationFrame(id)
    // eslint-disable-next-line react-hooks/exhaustive-deps -- onDone is a one-shot signal
  }, [gl, scene, camera])
  return null
}
