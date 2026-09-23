import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import Journey from '../Journey'
import { WORLDS } from '../../data/voyage'

// Same stubs as App.test.jsx: jsdom has no IntersectionObserver and no 2D canvas backend.
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
})
afterEach(cleanup)

describe('voyage without WebGL (jsdom)', () => {
  it('falls back to the 2D starfield and never mounts the 3D canvas', () => {
    const { container } = render(<Journey onSkip={() => {}} />)
    expect(container.querySelector('canvas.starfield')).not.toBeNull()
    expect(container.querySelector('.voyage-canvas')).toBeNull()
  })

  it('still tells the whole story in text', () => {
    const { getByText } = render(<Journey onSkip={() => {}} />)
    for (const w of WORLDS) getByText(`Entry ${w.entry} · World: ${w.world}`)
    getByText(/Every voyage begins in a debris field/)
    getByText(/Not everything out here was found/)
    getByText(/route around/)
    getByText(/Falling, finally, on purpose/)
    getByText(/The voyage changed the traveler/)
  })

  it('hides the sound toggle when Web Audio is unavailable', () => {
    const { queryByRole } = render(<Journey onSkip={() => {}} />)
    expect(queryByRole('button', { name: 'Sound' })).toBeNull()
  })

  it('keeps the award names in text, and reserves every 3D slot', () => {
    const { getByText, container } = render(<Journey onSkip={() => {}} />)
    getByText(/Three moons rose in six months — Applause · Best Performer · On-The-Spot\./)
    const slots = [...container.querySelectorAll('[data-slot]')].map((el) => el.dataset.slot).sort()
    expect(slots).toEqual(['curo', 'mercantile', 'nova', 'porcelain', 'pulsar', 'vault'])
  })
})
