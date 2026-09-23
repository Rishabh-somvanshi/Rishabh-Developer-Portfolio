import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup, fireEvent, act } from '@testing-library/react'
import SoundToggle from '../SoundToggle'
import Hud from '../../../journey/Hud'

function fakeEngine(initial = {}) {
  let snap = { muted: false, state: 'running', needsGesture: false, ...initial }
  const subs = new Set()
  return {
    getSnapshot: () => snap,
    subscribe: (fn) => {
      subs.add(fn)
      return () => subs.delete(fn)
    },
    getAnalyser: () => null,
    toggleMuted: vi.fn(),
    startFromGesture: vi.fn(),
    push(next) {
      snap = { ...snap, ...next }
      subs.forEach((fn) => fn(snap))
    },
  }
}

afterEach(cleanup)

describe('SoundToggle', () => {
  it('is a pressed "Sound" toggle while playing, and toggles on click', () => {
    const engine = fakeEngine()
    const { getByRole } = render(<SoundToggle engine={engine} />)
    const btn = getByRole('button', { name: 'Sound' })
    expect(btn.getAttribute('aria-pressed')).toBe('true')
    fireEvent.click(btn)
    expect(engine.toggleMuted).toHaveBeenCalledTimes(1)
  })

  it('reflects engine changes', () => {
    const engine = fakeEngine()
    const { getByRole } = render(<SoundToggle engine={engine} />)
    act(() => engine.push({ muted: true, state: 'suspended' }))
    expect(getByRole('button', { name: 'Sound' }).getAttribute('aria-pressed')).toBe('false')
  })

  it('invites a tap, and starts audio on it, when a gesture is still needed', () => {
    const engine = fakeEngine({ state: 'idle', needsGesture: true })
    const { getByRole, getByText } = render(<SoundToggle engine={engine} />)
    expect(getByText(/tap for sound/i)).toBeTruthy()
    fireEvent.click(getByRole('button', { name: 'Sound' }))
    expect(engine.startFromGesture).toHaveBeenCalledTimes(1)
    expect(engine.toggleMuted).not.toHaveBeenCalled()
  })

  it('toggles on M from anywhere except text fields', () => {
    const engine = fakeEngine()
    const { container } = render(
      <>
        <SoundToggle engine={engine} />
        <input aria-label="field" />
      </>,
    )
    fireEvent.keyDown(window, { key: 'm' })
    expect(engine.toggleMuted).toHaveBeenCalledTimes(1)
    fireEvent.keyDown(container.querySelector('input'), { key: 'm' })
    fireEvent.keyDown(window, { key: 'm', ctrlKey: true })
    expect(engine.toggleMuted).toHaveBeenCalledTimes(1)
  })
})

describe('Hud sound slot', () => {
  it('shows the toggle only for a supported engine', () => {
    const { queryByRole, rerender } = render(<Hud onSkip={() => {}} />)
    expect(queryByRole('button', { name: 'Sound' })).toBeNull()
    rerender(<Hud onSkip={() => {}} engine={fakeEngine({ state: 'unsupported' })} />)
    expect(queryByRole('button', { name: 'Sound' })).toBeNull()
    rerender(<Hud onSkip={() => {}} engine={fakeEngine()} />)
    expect(queryByRole('button', { name: 'Sound' })).not.toBeNull()
  })
})
