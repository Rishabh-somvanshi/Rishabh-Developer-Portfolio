import { useMemo } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stats } from '@react-three/drei'
import QualityProvider from './quality/QualityProvider'
import LayoutProvider from './LayoutProvider'
import Scene from './Scene'
import { initialTier } from './quality/tiers'
import { CAMERA_FOV } from './camera/framing'
import { isCoarsePointer } from '../journey/hooks'

const DEBUG = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug')

/**
 * If the GPU drops the context, three restores it automatically once the
 * loss is preventDefault()ed — that is the one restore attempt. No restore
 * within 2 s → hand the voyage to the 2D starfield.
 */
function watchContextLoss(gl, onFail) {
  const canvas = gl.domElement
  let timer = null
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault()
    timer = setTimeout(onFail, 2000)
  })
  canvas.addEventListener('webglcontextrestored', () => clearTimeout(timer))
}

/** The voyage's 3D world — the lazy chunk entry. Errors propagate to the shell's WebGLBoundary. */
export default function World({ reduced, onFail }) {
  const coarse = useMemo(isCoarsePointer, [])
  return (
    <Canvas
      className="voyage-canvas"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      dpr={1}
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      camera={{ fov: CAMERA_FOV, near: 0.1, far: 3000, position: [0, 0, 40] }}
      onCreated={({ gl }) => watchContextLoss(gl, onFail)}
    >
      <color attach="background" args={['#0a0a0b']} />
      <QualityProvider initial={initialTier({ coarse })}>
        <LayoutProvider>
          <Scene reduced={reduced} />
        </LayoutProvider>
      </QualityProvider>
      {DEBUG && <Stats />}
    </Canvas>
  )
}
