import { createContext, useContext, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { progress } from './store'
import { layoutFor } from './camera/stations'

const LayoutContext = createContext(null)

export const useLayout = () => useContext(LayoutContext)

const derive = () => ({ version: progress.measure.version, ...layoutFor(progress.measure) })

/** Re-derives stations and body scales whenever the shell re-measures the DOM (mount, resize, fonts). */
export default function LayoutProvider({ children }) {
  const [layout, setLayout] = useState(derive)
  useFrame(() => {
    if (progress.measure.version !== layout.version) setLayout(derive())
  })
  return <LayoutContext.Provider value={layout}>{children}</LayoutContext.Provider>
}
