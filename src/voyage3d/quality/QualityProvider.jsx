import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { TIER_SETTINGS, TIER_ORDER, stepTier, createFpsGovernor } from './tiers'

const QualityContext = createContext({ tier: 'medium', settings: TIER_SETTINGS.medium })

export const useQuality = () => useContext(QualityContext)

/**
 * Owns the quality tier. Tier changes are rare, so they are React state;
 * frame timing is not. `onDpr` (not useThree's setDpr) pushes the tier's dpr
 * back up to World's own state, because the Canvas `dpr` prop is the value
 * R3F reapplies on every resize (B1) — setDpr here would just be undone.
 * `locked` (a `?tier=` debug override, see World/tiers.tierOverride) freezes
 * the governor so a tier picked for verification never drifts away.
 */
export default function QualityProvider({ initial, locked = false, onDpr, children }) {
  const [tier, setTier] = useState(initial)
  const governor = useMemo(() => createFpsGovernor(), [])
  const settings = TIER_SETTINGS[tier]

  useEffect(() => {
    onDpr?.(Math.min(settings.dpr, window.devicePixelRatio || 1))
  }, [onDpr, settings.dpr])

  useFrame((_, delta) => {
    if (locked) return
    // A long frame after a hidden tab or a jank spike is not a verdict on the device.
    if (delta > 0.25) return
    const i = TIER_ORDER.indexOf(tier)
    const step = governor.sample(delta * 1000, { canUp: i < TIER_ORDER.length - 1, canDown: i > 0 })
    if (step) setTier((t) => stepTier(t, step))
  })

  const value = useMemo(() => ({ tier, settings }), [tier, settings])
  return <QualityContext.Provider value={value}>{children}</QualityContext.Provider>
}
