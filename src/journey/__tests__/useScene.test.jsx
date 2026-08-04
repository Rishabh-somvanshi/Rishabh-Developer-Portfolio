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
