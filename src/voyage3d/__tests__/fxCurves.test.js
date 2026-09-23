import { describe, it, expect } from 'vitest'
import { warpCurve, wellCurve } from '../fxCurves'

describe('warpCurve (re-entry)', () => {
  it('is off before the dive, full mid-scene, off after', () => {
    expect(warpCurve(0)).toBe(0)
    expect(warpCurve(0.6)).toBe(1)
    expect(warpCurve(1)).toBe(0)
    expect(warpCurve(-0.5)).toBe(0)
  })
  it('ramps up between 0.08 and 0.45', () => {
    expect(warpCurve(0.265)).toBeCloseTo(0.5)
  })
})

describe('wellCurve (singularity)', () => {
  it('builds to full strength and relaxes to 0.25 before fading out', () => {
    expect(wellCurve(0.01)).toBe(0)
    expect(wellCurve(0.2)).toBe(1)
    expect(wellCurve(0.7)).toBe(0.25)
    expect(wellCurve(0.96)).toBe(0)
  })
})
