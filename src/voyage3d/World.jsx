import { useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stats } from '@react-three/drei'
import QualityProvider from './quality/QualityProvider'
import LayoutProvider from './LayoutProvider'
import Scene from './Scene'
import { initialTier, tierOverride, TIER_SETTINGS } from './quality/tiers'
import { CAMERA_FOV } from './camera/framing'
import { isCoarsePointer } from '../journey/hooks'

const DEBUG = typeof window !== 'undefined' && new URLSearchParams(window.location.search).has('debug')

/**
 * If the GPU drops the context, three restores it automatically once the
 * loss is preventDefault()ed — that is the one restore attempt. No restore
 * within 2 s → hand the voyage to the 2D starfield. A canvas that is being
 * torn down (unmount, hot reload) also loses its context, and is not a failure.
 */
function watchContextLoss(gl, onFail) {
  const canvas = gl.domElement
  let timer = null
  canvas.addEventListener('webglcontextlost', (e) => {
    e.preventDefault()
    clearTimeout(timer)
    timer = setTimeout(() => { if (canvas.isConnected) onFail() }, 2000)
  })
  canvas.addEventListener('webglcontextrestored', () => clearTimeout(timer))
}

/** The voyage's 3D world — the lazy chunk entry. Errors propagate to the shell's WebGLBoundary. */
export default function World({ reduced, onFail }) {
  const coarse = useMemo(isCoarsePointer, [])
  // ?tier=low|medium|high pins the tier for colour-pipeline verification (B2):
  // the governor is locked so it never steps away from the requested tier.
  const override = useMemo(() => tierOverride(window.location.search), [])
  const initial = useMemo(() => override ?? initialTier({ coarse }), [override, coarse])
  // The tier's own dpr, not the Canvas default: R3F reapplies the `dpr` prop
  // on every resize, so leaving it at a fixed 1 wipes QualityProvider's
  // setDpr(1.5 | 2) on the first rotation/URL-bar change (B1). The Canvas
  // prop is now the live source of truth; QualityProvider updates it here.
  const [dpr, setDpr] = useState(() => Math.min(TIER_SETTINGS[initial].dpr, window.devicePixelRatio || 1))
  return (
    <Canvas
      className="voyage-canvas"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      aria-hidden="true"
      dpr={dpr}
      flat
      gl={{ antialias: false, powerPreference: 'high-performance' }}
      camera={{ fov: CAMERA_FOV, near: 0.1, far: 3000, position: [0, 0, 40] }}
      onCreated={({ gl }) => watchContextLoss(gl, onFail)}
    >
      <color attach="background" args={['#0a0a0b']} />
      <QualityProvider initial={initial} locked={!!override} onDpr={setDpr}>
        <LayoutProvider>
          <Scene reduced={reduced} />
        </LayoutProvider>
      </QualityProvider>
      {DEBUG && <Stats />}
    </Canvas>
  )
}
