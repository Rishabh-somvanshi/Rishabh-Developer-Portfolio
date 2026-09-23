import { describe, it, expect } from 'vitest'
import { shouldRender, RENDER_INTERVAL_MS } from '../renderThrottle'

describe('shouldRender', () => {
  it('renders the very first sample regardless of motion state', () => {
    expect(shouldRender({ now: 1000, last: null, minInterval: RENDER_INTERVAL_MS, still: false, changed: false })).toBe(true)
    expect(shouldRender({ now: 1000, last: null, minInterval: RENDER_INTERVAL_MS, still: true, changed: false })).toBe(true)
  })

  it('throttles ambient motion to the minimum interval, ignoring `changed`', () => {
    expect(shouldRender({ now: 1010, last: 1000, minInterval: 33, still: false, changed: false })).toBe(false)
    expect(shouldRender({ now: 1034, last: 1000, minInterval: 33, still: false, changed: false })).toBe(true)
    expect(shouldRender({ now: 1034, last: 1000, minInterval: 33, still: false, changed: true })).toBe(true)
  })

  it('under reduced motion, stays idle until the progress store changes', () => {
    expect(shouldRender({ now: 5000, last: 1000, minInterval: 33, still: true, changed: false })).toBe(false)
  })

  it('under reduced motion, a scroll change still renders, but coalesced to the throttle', () => {
    // Changed, but inside the throttle window since the last render — wait.
    expect(shouldRender({ now: 1010, last: 1000, minInterval: 33, still: true, changed: true })).toBe(false)
    // Changed, and the throttle window has elapsed — render.
    expect(shouldRender({ now: 1040, last: 1000, minInterval: 33, still: true, changed: true })).toBe(true)
  })

  it('is a pure function of its inputs (no hidden clock/state)', () => {
    const args = { now: 2000, last: 1950, minInterval: 33, still: false, changed: false }
    expect(shouldRender(args)).toBe(shouldRender({ ...args }))
  })
})
