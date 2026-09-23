import { describe, it, expect } from 'vitest'
import { blackHoleScale, BH_SIZE } from '../blackHoleScale'

describe('blackHoleScale', () => {
  it('exports BH_SIZE as 0.55', () => {
    expect(BH_SIZE).toBe(0.55)
  })

  it('blackHoleScale(0) ≈ 0.275 (BH_SIZE × 0.5)', () => {
    expect(blackHoleScale(0)).toBeCloseTo(0.275, 3)
  })

  it('blackHoleScale(0.3) ≈ 0.55 (BH_SIZE × 1)', () => {
    expect(blackHoleScale(0.3)).toBeCloseTo(0.55, 3)
  })

  it('blackHoleScale(1) ≈ 0.187 (BH_SIZE × 0.34)', () => {
    expect(blackHoleScale(1)).toBeCloseTo(0.55 * 0.34, 3)
  })
})
