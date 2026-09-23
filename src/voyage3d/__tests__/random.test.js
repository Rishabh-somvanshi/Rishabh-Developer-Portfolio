import { describe, it, expect } from 'vitest'
import { mulberry32 } from '../random'

describe('mulberry32', () => {
  it('is deterministic per seed and stays in [0, 1)', () => {
    const a = mulberry32(7)
    const b = mulberry32(7)
    for (let i = 0; i < 1000; i++) {
      const x = a()
      expect(x).toBe(b())
      expect(x).toBeGreaterThanOrEqual(0)
      expect(x).toBeLessThan(1)
    }
  })
})
