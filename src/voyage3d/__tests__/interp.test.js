import { describe, it, expect } from 'vitest'
import { clamp01, interp } from '../interp'

describe('interp', () => {
  it('clamps below and above the input range', () => {
    expect(interp(-1, [0, 1], [10, 20])).toBe(10)
    expect(interp(2, [0, 1], [10, 20])).toBe(20)
  })
  it('interpolates linearly inside a segment', () => {
    expect(interp(0.25, [0, 0.5, 1], [0, 1, 0])).toBeCloseTo(0.5)
    expect(interp(0.75, [0, 0.5, 1], [0, 1, 0])).toBeCloseTo(0.5)
  })
  it('clamp01 bounds to [0, 1]', () => {
    expect(clamp01(-0.2)).toBe(0)
    expect(clamp01(0.4)).toBe(0.4)
    expect(clamp01(3)).toBe(1)
  })
})
