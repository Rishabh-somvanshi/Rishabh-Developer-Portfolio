import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup, fireEvent } from '@testing-library/react'
import Journey from '../Journey'

// Mutable so individual tests can vary the snapshot SoundToggle captures at
// mount (see the 'm' key test below for why).
let snapshot = { muted: false, state: 'idle', needsGesture: true }

const engine = {
  getSnapshot: () => snapshot,
  subscribe: () => () => {},
  getAnalyser: () => null,
  startFromGesture: vi.fn(),
  onVisibility: vi.fn(),
  update: vi.fn(),
  trigger: vi.fn(),
  dispose: vi.fn(),
  toggleMuted: vi.fn(),
}

vi.mock('../../voyage3d/audio/engine', () => ({
  createAudioEngine: () => engine,
}))

// Same stubs as Journey.fallback.test.jsx: jsdom has no IntersectionObserver
// and no 2D canvas backend.
beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(
    new Proxy({}, { get: (t, k) => (k in t ? t[k] : () => {}), set: (t, k, v) => ((t[k] = v), true) }),
  )
  snapshot = { muted: false, state: 'idle', needsGesture: true }
  engine.startFromGesture.mockClear()
  engine.onVisibility.mockClear()
  engine.dispose.mockClear()
  engine.toggleMuted.mockClear()
})
afterEach(cleanup)

describe('Journey gesture wiring', () => {
  it('starts audio on pointerup anywhere', () => {
    render(<Journey onSkip={() => {}} />)
    fireEvent.pointerUp(document.body)
    expect(engine.startFromGesture).toHaveBeenCalled()
  })

  it('does not start audio on pointerdown alone (browsers refuse the gesture grant on it for touch)', () => {
    render(<Journey onSkip={() => {}} />)
    fireEvent.pointerDown(document.body)
    expect(engine.startFromGesture).not.toHaveBeenCalled()
  })

  it('does not start audio for the M key (the sound toggle handles it itself)', () => {
    // Hud always renders SoundToggle alongside Journey's own gesture
    // listener, and SoundToggle has its own window-level 'm' handler (by
    // design — see the comment above the gesture effect in Journey.jsx).
    // With needsGesture: true, that handler would itself call
    // startFromGesture() on 'm', which would mask whether *Journey's own*
    // listener correctly skips 'm' (the thing this test checks). Starting
    // from needsGesture: false routes SoundToggle's own handler to
    // toggleMuted() instead, isolating the assertion to Journey's listener.
    snapshot = { muted: false, state: 'idle', needsGesture: false }
    render(<Journey onSkip={() => {}} />)
    fireEvent.keyDown(document.body, { key: 'm' })
    expect(engine.startFromGesture).not.toHaveBeenCalled()
  })

  it('notifies the engine on visibility change', () => {
    render(<Journey onSkip={() => {}} />)
    fireEvent(document, new Event('visibilitychange'))
    expect(engine.onVisibility).toHaveBeenCalled()
  })

  it('disposes the engine on unmount', () => {
    const { unmount } = render(<Journey onSkip={() => {}} />)
    unmount()
    expect(engine.dispose).toHaveBeenCalledTimes(1)
  })
})
