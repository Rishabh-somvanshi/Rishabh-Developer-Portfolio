import { createContext, useContext, useEffect, useMemo, useState } from 'react'
import { useFrame } from '@react-three/fiber'
import { TIER_SETTINGS, TIER_ORDER, stepTier, createFpsGovernor, dprFor } from './tiers'

const QualityContext = createContext({ tier: 'medium', settings: TIER_SETTINGS.medium })

export const useQuality = () => useContext(QualityContext)

/**
 * Owns the quality tier. Tier changes are rare, so they are React state;
 * frame timing is not. `onDpr` (not useThree's setDpr) pushes the tier's dpr
 * back up to World's own state, because the Canvas `dpr` prop is the value
 * R3F reapplies on every resize (B1) — setDpr here would just be undone.
 * `locked` (a `?tier=` debug override, see World/tiers.tierOverride) freezes
 * the governor so a tier picked for verification never drifts away.
 *
 * `capped` (coarse pointers — see World.jsx's `frameloop="demand"` +
 * FrameDriver) also freezes the governor. FrameDriver throttles renders to
 * ~30 fps by design, so once it's driving, `delta` reflects that self-imposed
 * cap rather than hardware headroom: fed to the governor as-is it reads as a
 * sustained sub-40fps device (33 ms/frame), which would either false-trigger
 * 'down' (harmless at the low-tier floor, but burns the switch budget and
 * locks the governor early) or make 'up' permanently unreachable (delta
 * never drops low enough to read ≥55 fps). Coarse devices keep whatever tier
 * `initial`/the `?tier=` override picked instead of drifting off throttle noise.
 */
export default function QualityProvider({ initial, locked = false, capped = false, onDpr, children }) {
  const [tier, setTier] = useState(initial)
  const governor = useMemo(() => createFpsGovernor(), [])
  const settings = TIER_SETTINGS[tier]

  useEffect(() => {
    onDpr?.(dprFor(tier, { coarse: capped, deviceDpr: window.devicePixelRatio }))
  }, [onDpr, tier, capped])

  useFrame((_, delta) => {
    if (locked || capped) return
    // A long frame after a hidden tab or a jank spike is not a verdict on the device.
    if (delta > 0.25) return
    const i = TIER_ORDER.indexOf(tier)
    const step = governor.sample(delta * 1000, { canUp: i < TIER_ORDER.length - 1, canDown: i > 0 })
    if (step) setTier((t) => stepTier(t, step))
  })

  const value = useMemo(() => ({ tier, settings }), [tier, settings])
  return <QualityContext.Provider value={value}>{children}</QualityContext.Provider>
}
