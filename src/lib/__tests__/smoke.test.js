import { describe, it, expect } from 'vitest'

describe('test environment', () => {
  it('provides a jsdom window with matchMedia-capable location', () => {
    expect(typeof window).toBe('object')
    expect(window.location.hash).toBe('')
  })

  it('provides a working localStorage', () => {
    window.localStorage.setItem('probe', 'ok')
    expect(window.localStorage.getItem('probe')).toBe('ok')
    window.localStorage.removeItem('probe')
  })
})
