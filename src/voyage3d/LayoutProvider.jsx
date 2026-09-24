import { createContext, useContext, useEffect, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { progress } from './store'
import { layoutFor } from './camera/stations'

const LayoutContext = createContext(null)

export const useLayout = () => useContext(LayoutContext)

const derive = () => ({ version: progress.measure.version, ...layoutFor(progress.measure) })

/** Re-derives stations, body scales and the lens whenever the shell re-measures the DOM (mount, resize, fonts). */
export default function LayoutProvider({ children }) {
  const [layout, setLayout] = useState(derive)
  const camera = useThree((s) => s.camera)
  // the stations were framed for this lens (wider in portrait) — the camera must match
  useEffect(() => {
    if (camera.fov === layout.fov) return
    camera.fov = layout.fov
    camera.updateProjectionMatrix()
  }, [camera, layout.fov])
  useFrame(() => {
    if (progress.measure.version !== layout.version) setLayout(derive())
  })
  return <LayoutContext.Provider value={layout}>{children}</LayoutContext.Provider>
}
