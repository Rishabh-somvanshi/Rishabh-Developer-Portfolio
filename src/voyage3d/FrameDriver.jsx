import { useEffect, useRef } from 'react'
import { useThree } from '@react-three/fiber'
import { progress } from './store'
import { shouldRender, RENDER_INTERVAL_MS } from './renderThrottle'

/**
 * Drives rendering when the Canvas is `frameloop="demand"` (coarse pointers
 * only — see World.jsx). Runs its own rAF loop, throttled to ~30 renders/s,
 * and calls R3F's invalidate() when `shouldRender` says to: ambient motion
 * (not `still`) renders every throttled tick so twinkle/spin/pulse keep
 * animating; reduced motion (`still`) only renders when the progress store
 * has actually moved (`progress.p` or `progress.measure.version` changed),
 * so scroll still shows up within ~33 ms but nothing self-animates.
 *
 * Paused while the tab is hidden (`document.visibilityState`) — no point
 * spending battery invalidating a canvas nobody can see.
 */
export default function FrameDriver({ still }) {
  const invalidate = useThree((state) => state.invalidate)
  const lastRender = useRef(null)
  const lastP = useRef(progress.p)
  const lastVersion = useRef(progress.measure.version)

  useEffect(() => {
    let raf = requestAnimationFrame(tick)
    function tick() {
      raf = requestAnimationFrame(tick)
      if (document.visibilityState !== 'visible') return
      const changed = progress.p !== lastP.current || progress.measure.version !== lastVersion.current
      const now = performance.now()
      if (!shouldRender({ now, last: lastRender.current, minInterval: RENDER_INTERVAL_MS, still, changed })) return
      lastRender.current = now
      lastP.current = progress.p
      lastVersion.current = progress.measure.version
      invalidate()
    }
    return () => cancelAnimationFrame(raf)
  }, [invalidate, still])

  return null
}
