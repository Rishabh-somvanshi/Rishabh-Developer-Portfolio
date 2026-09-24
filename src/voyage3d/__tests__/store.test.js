import { describe, it, expect } from 'vitest'
import { createProgressStore, updateProgress, setMeasure, resetProgress } from '../store'

describe('progress store', () => {
  it('maps scroll to p in [0, 1]', () => {
    const s = createProgressStore()
    updateProgress(s, { scrollY: 500, maxScroll: 1000, now: 0 })
    expect(s.p).toBe(0.5)
    updateProgress(s, { scrollY: 5000, maxScroll: 1000, now: 16 })
    expect(s.p).toBe(1)
  })
  it('smooths velocity in p-units per second and never goes negative', () => {
    const s = createProgressStore()
    updateProgress(s, { scrollY: 0, maxScroll: 1000, now: 0 })
    updateProgress(s, { scrollY: 100, maxScroll: 1000, now: 100 }) // 0.1 p in 0.1 s = 1 p/s instant
    expect(s.velocity).toBeGreaterThan(0)
    expect(s.velocity).toBeLessThan(1)
    updateProgress(s, { scrollY: 0, maxScroll: 1000, now: 200 })
    expect(s.velocity).toBeGreaterThan(0)
  })
  it('bumps the measure version and relocates on setMeasure', () => {
    const s = createProgressStore()
    const windows = [{ id: 'a', start: 0, dwellEnd: 0.5, end: 1 }]
    setMeasure(s, { windows, viewport: { w: 100, h: 50 }, slots: {} })
    expect(s.measure.version).toBe(1)
    expect(s.windows).toBe(windows)
  })
  it('resets in place', () => {
    const s = createProgressStore()
    updateProgress(s, { scrollY: 500, maxScroll: 1000, now: 0 })
    resetProgress(s)
    expect(s.p).toBe(0)
    expect(s.measure.version).toBe(0)
  })
})

describe('shift', () => {
  it('starts with no scene slid', async () => {
    const { createProgressStore } = await import('../store')
    expect(createProgressStore().shift).toEqual({})
  })
})
