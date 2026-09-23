import { describe, it, expect } from 'vitest'
import { cameraS, cameraSReduced, travelFx } from '../path'
import { computeWindows, locate } from '../../sceneWindows'

const N = 10
const VH = 800
const sections = Array.from({ length: N }, (_, i) => ({ id: `s${i}`, top: i * 1600, height: 1600 }))
const MAX = N * 1600 - VH
const windows = computeWindows(sections, MAX, VH)

describe('cameraS', () => {
  it('never moves backwards as the reader scrolls forwards', () => {
    let prev = -Infinity
    for (let k = 0; k <= 2000; k++) {
      const s = cameraS(locate(windows, k / 2000), N)
      expect(s).toBeGreaterThanOrEqual(prev - 1e-9)
      prev = s
    }
  })
  it('arrives exactly at each station when its scene starts', () => {
    for (let i = 0; i < N; i++) {
      expect(cameraS(locate(windows, windows[i].start + 1e-9), N)).toBeCloseTo(i, 5)
    }
  })
  it('stays within [0, n − 1] and is always finite', () => {
    for (const p of [0, 0.5, 1]) {
      const s = cameraS(locate(windows, p), N)
      expect(Number.isFinite(s)).toBe(true)
      expect(s).toBeGreaterThanOrEqual(0)
      expect(s).toBeLessThanOrEqual(N - 1)
    }
  })
})

describe('cameraSReduced', () => {
  it('cuts to the next station halfway through the hand-over, never between', () => {
    expect(cameraSReduced({ index: 3, travel: 0.49 }, N)).toBe(3)
    expect(cameraSReduced({ index: 3, travel: 0.5 }, N)).toBe(4)
    expect(cameraSReduced({ index: N - 1, travel: 1 }, N)).toBe(N - 1)
  })
})

describe('travelFx', () => {
  it('is 0 at rest and peaks mid-flight', () => {
    expect(travelFx({ travel: 0 })).toBe(0)
    expect(travelFx({ travel: 0.5 })).toBeCloseTo(1)
    expect(travelFx({ travel: 1 })).toBeCloseTo(0)
  })
})
