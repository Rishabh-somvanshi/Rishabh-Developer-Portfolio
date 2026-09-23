import { describe, it, expect } from 'vitest'
import { TIER_SETTINGS, initialTier, stepTier, createFpsGovernor, tierOverride } from '../tiers'

const both = { canUp: true, canDown: true }
const run = (gov, fps, ms, opts = both) => {
  let result = null
  for (let t = 0; t < ms; t += 1000 / fps) result = gov.sample(1000 / fps, opts) ?? result
  return result
}

describe('tier settings', () => {
  it('match the spec table', () => {
    expect(TIER_SETTINGS.low).toMatchObject({ dpr: 1, bloom: false, stars: 4000, octaves: 2, clouds: false, meteors: 80 })
    expect(TIER_SETTINGS.medium).toMatchObject({ dpr: 1.5, bloom: true, bloomScale: 0.5, stars: 10000, octaves: 3, meteors: 200 })
    expect(TIER_SETTINGS.high).toMatchObject({ dpr: 2, lensing: 'screen', stars: 20000, octaves: 5, meteors: 400 })
  })
  it('start low on touch and medium on desktop', () => {
    expect(initialTier({ coarse: true })).toBe('low')
    expect(initialTier({ coarse: false })).toBe('medium')
  })
  it('step within bounds', () => {
    expect(stepTier('low', 'down')).toBe('low')
    expect(stepTier('low', 'up')).toBe('medium')
    expect(stepTier('high', 'up')).toBe('high')
  })
})

describe('tierOverride', () => {
  it('reads a valid ?tier= value', () => {
    expect(tierOverride('?tier=low')).toBe('low')
    expect(tierOverride('?tier=medium')).toBe('medium')
    expect(tierOverride('?tier=high')).toBe('high')
  })
  it('rejects an invalid value', () => {
    expect(tierOverride('?tier=ultra')).toBeNull()
    expect(tierOverride('?tier=')).toBeNull()
  })
  it('is null when absent', () => {
    expect(tierOverride('')).toBeNull()
    expect(tierOverride('?debug')).toBeNull()
  })
})

describe('createFpsGovernor', () => {
  it('steps up after 3 s at ≥ 55 fps, not before', () => {
    expect(run(createFpsGovernor(), 60, 2500)).toBeNull()
    expect(run(createFpsGovernor(), 60, 3300)).toBe('up')
  })
  it('steps down after 2 s under 40 fps', () => {
    expect(run(createFpsGovernor(), 30, 1500)).toBeNull()
    expect(run(createFpsGovernor(), 30, 2400)).toBe('down')
  })
  it('does nothing in the 40–55 band', () => {
    expect(run(createFpsGovernor(), 48, 10000)).toBeNull()
  })
  it('does not count a step it cannot take', () => {
    const gov = createFpsGovernor()
    expect(run(gov, 60, 4000, { canUp: false, canDown: true })).toBeNull()
    expect(gov.locked).toBe(false)
  })
  it('ignores a single very long frame (resumed tab)', () => {
    const gov = createFpsGovernor()
    expect(gov.sample(5000, both)).toBeNull()
    expect(run(gov, 60, 3300)).toBe('up')
  })
  it('does not count a down-step it cannot take', () => {
    const gov = createFpsGovernor()
    expect(run(gov, 30, 4000, { canUp: true, canDown: false })).toBeNull()
    expect(gov.locked).toBe(false)
  })
  it('locks after 3 switches', () => {
    const gov = createFpsGovernor()
    // Later runs are longer: the smoothed frame time takes a few hundred ms to cross each threshold.
    // Once a 'down' has happened, 'up' is disallowed (A2), so this sequence
    // uses three downs — still a possible real trajectory for a struggling device.
    expect(run(gov, 30, 3000)).toBe('down')
    expect(run(gov, 30, 3000)).toBe('down')
    expect(run(gov, 30, 3000)).toBe('down')
    expect(gov.locked).toBe(true)
    expect(run(gov, 60, 5000)).toBeNull()
  })

  it('never steps up again once it has stepped down (A2: no locking onto an unsustainable tier)', () => {
    const gov = createFpsGovernor()
    expect(run(gov, 60, 3300)).toBe('up')
    expect(run(gov, 30, 3000)).toBe('down')
    // Sustained 60fps for 5s should ask to go back up, but must not — the
    // tier it would return to is the one that already failed.
    expect(run(gov, 60, 5000)).toBeNull()
    expect(gov.locked).toBe(false)
  })
})
