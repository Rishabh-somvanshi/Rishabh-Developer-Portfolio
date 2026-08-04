import { describe, it, expect } from 'vitest'

describe('localStorage polyfill (vitest.setup.js)', () => {
  it('round-trips an empty string instead of returning null', () => {
    window.localStorage.setItem('e', '')
    expect(window.localStorage.getItem('e')).toBe('')
  })

  it('round-trips a __proto__ key as a normal string, without prototype pollution', () => {
    window.localStorage.setItem('__proto__', 'x')
    expect(window.localStorage.getItem('__proto__')).toBe('x')
    expect(window.localStorage.length).toBe(1)
  })

  it('starts with length 0, proving storage is cleared between tests', () => {
    // The previous test wrote a `__proto__` key; if storage weren't reset
    // between tests via afterEach, length would still be 1 here.
    expect(window.localStorage.length).toBe(0)
  })
})
