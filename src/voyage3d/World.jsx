import { useMemo, useState } from 'react'
import { Canvas } from '@react-three/fiber'
import { Stats } from '@react-three/drei'
import QualityProvider from './quality/QualityProvider'
import LayoutProvider from './LayoutProvider'
import Scene from './Scene'
import FrameDriver from './FrameDriver'
import { initialTier, tierOverride, dprFor } from './quality/tiers'
import { fovFor } from './camera/framing'
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
  const [dpr, setDpr] = useState(() => dprFor(initial, { coarse, deviceDpr: window.devicePixelRatio }))
  // Created once: R3F re-applies a changed camera prop on every resize, which
  // would fight LayoutProvider — it owns the lens (fovFor) after mount.
  const camera = useMemo(() => ({ fov: fovFor(window.innerWidth / window.innerHeight), near: 0.1, far: 3000, position: [0, 0, 40] }), [])
  return (
    <Canvas
      className="voyage-canvas"
      style={{ position: 'fixed', inset: 0, zIndex: 0, pointerEvents: 'none' }}
      aria-hidden="true"
      dpr={dpr}
      flat
      // Coarse pointers (phones) only render on demand — a small FrameDriver
      // below invalidates() at ~30 fps instead of every vsync, roughly
      // halving GPU/battery draw. Desktop keeps the default "always" loop.
      frameloop={coarse ? 'demand' : 'always'}
      gl={{ antialias: true, powerPreference: 'high-performance' }}
      camera={camera}
      onCreated={({ gl }) => watchContextLoss(gl, onFail)}
    >
      <color attach="background" args={['#0a0a0b']} />
      <QualityProvider initial={initial} locked={!!override} capped={coarse} onDpr={setDpr}>
        <LayoutProvider>
          <Scene reduced={reduced} />
        </LayoutProvider>
      </QualityProvider>
      {coarse && <FrameDriver still={reduced} />}
      {DEBUG && <Stats />}
    </Canvas>
  )
}
