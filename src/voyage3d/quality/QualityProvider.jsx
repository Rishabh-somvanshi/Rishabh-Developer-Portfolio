import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useFrame, useThree } from '@react-three/fiber'
import { TIER_SETTINGS, TIER_ORDER, stepTier, createFpsGovernor } from './tiers'

const QualityContext = createContext({ tier: 'medium', settings: TIER_SETTINGS.medium })

export const useQuality = () => useContext(QualityContext)

/** Owns the quality tier. Tier changes are rare, so they are React state; frame timing is not. */
export default function QualityProvider({ initial, children }) {
  const [tier, setTier] = useState(initial)
  const governor = useMemo(() => createFpsGovernor(), [])
  const setDpr = useThree((s) => s.setDpr)
  const settings = TIER_SETTINGS[tier]

  useEffect(() => {
    setDpr(Math.min(settings.dpr, window.devicePixelRatio || 1))
  }, [setDpr, settings.dpr])

  useFrame((_, delta) => {
    // A long frame after a hidden tab or a jank spike is not a verdict on the device.
    if (delta > 0.25) return
    const i = TIER_ORDER.indexOf(tier)
    const step = governor.sample(delta * 1000, { canUp: i < TIER_ORDER.length - 1, canDown: i > 0 })
    if (step) setTier((t) => stepTier(t, step))
  })

  const value = useMemo(() => ({ tier, settings }), [tier, settings])
  return <QualityContext.Provider value={value}>{children}</QualityContext.Provider>
}
