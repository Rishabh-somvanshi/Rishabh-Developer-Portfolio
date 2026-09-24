import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { useScene } from '../hooks'

// Same shape as the mock in observeInView.test.js: records the constructor's
// rootMargin option and every element passed to observe().
let observed
let observerOptions

beforeEach(() => {
  observed = []
  observerOptions = null
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb, options) {
        this.cb = cb
        observerOptions = options
      }
      observe(el) {
        observed.push(el)
      }
      disconnect() {}
    },
  )
})

afterEach(cleanup)

/**
 * Minimal stand-in for a scene component — exercises useScene exactly the
 * way every real scene (e.g. WorldScene) does: a ref from useScene attached
 * to the section that owns the pinned-scroll progress.
 */
function TestScene() {
  const { ref, height } = useScene(100)
  return <section ref={ref} data-testid="test-scene" style={{ height }} />
}

describe('useScene parking', () => {
  it('observes its own section element so it can be parked off-screen', () => {
    const { getByTestId } = render(<TestScene />)
    const section = getByTestId('test-scene')

    expect(observed).toEqual([section])
    expect(observerOptions).toEqual({ rootMargin: '200px' })
  })
})

describe('sceneHeightVh', () => {
  it('keeps desktop scenes at their authored height', async () => {
    const { sceneHeightVh } = await import('../hooks')
    expect(sceneHeightVh(175, false)).toBe(175)
    expect(sceneHeightVh(150, false)).toBe(150)
  })

  it('gives every phone scene a real pin — at least 45vh of scroll past its own screen', async () => {
    const { sceneHeightVh } = await import('../hooks')
    for (const vh of [150, 165, 175, 185, 225, 235]) {
      expect(sceneHeightVh(vh, true)).toBeGreaterThanOrEqual(145)
      expect(sceneHeightVh(vh, true)).toBeLessThanOrEqual(vh)
    }
  })
})

describe('overflowShift', () => {
  it('slides an overflowing card up by exactly its overflow across the range', async () => {
    const { overflowShift } = await import('../hooks')
    expect(overflowShift(0.1, 120, [0.2, 0.8])).toBe(0)
    expect(overflowShift(0.5, 120, [0.2, 0.8])).toBeCloseTo(-60)
    expect(overflowShift(0.8, 120, [0.2, 0.8])).toBeCloseTo(-120)
    expect(overflowShift(1, 120, [0.2, 0.8])).toBeCloseTo(-120)
  })

  it('never moves a card that fits', async () => {
    const { overflowShift } = await import('../hooks')
    expect(overflowShift(0.5, 0, [0.2, 0.8])).toBe(0)
    expect(overflowShift(0.5, -30, [0.2, 0.8])).toBe(0)
  })
})
