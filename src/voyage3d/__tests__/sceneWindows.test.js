import { describe, it, expect } from 'vitest'
import { computeWindows, locate, sceneProgress, offsetWithin, measureSlots } from '../sceneWindows'

// Three stacked scenes on an 800px viewport: 1200 + 1600 + 900 = 3700px page.
const VH = 800
const sections = [
  { id: 'a', top: 0, height: 1200 },
  { id: 'b', top: 1200, height: 1600 },
  { id: 'c', top: 2800, height: 900 },
]
const MAX = 3700 - VH // 2900
const windows = computeWindows(sections, MAX, VH)

describe('computeWindows', () => {
  it('produces contiguous windows covering 0..1', () => {
    expect(windows[0].start).toBe(0)
    expect(windows.at(-1).end).toBe(1)
    for (let i = 1; i < windows.length; i++) expect(windows[i].start).toBeCloseTo(windows[i - 1].end)
  })
  it('ends each dwell when the pinned stage releases (height − viewport)', () => {
    expect(windows[0].dwellEnd).toBeCloseTo(400 / MAX)
    expect(windows[1].dwellEnd).toBeCloseTo(2000 / MAX)
    expect(windows[2].dwellEnd).toBe(1) // the last scene never flies anywhere
  })
  it('returns [] when nothing can scroll', () => {
    expect(computeWindows(sections, 0, VH)).toEqual([])
    expect(computeWindows([], 100, VH)).toEqual([])
  })
})

describe('locate', () => {
  it('dwells, then travels, then hands over to the next scene', () => {
    const dwelling = locate(windows, 200 / MAX)
    expect(dwelling.index).toBe(0)
    expect(dwelling.dwell).toBeCloseTo(0.5)
    expect(dwelling.travel).toBe(0)
    const flying = locate(windows, 800 / MAX)
    expect(flying.index).toBe(0)
    expect(flying.dwell).toBe(1)
    expect(flying.travel).toBeCloseTo(0.5)
    expect(locate(windows, 1200 / MAX).index).toBe(1)
    expect(locate(windows, 1).index).toBe(2)
  })
  it('is safe with no windows', () => {
    expect(locate([], 0.5)).toEqual({ index: 0, dwell: 0, travel: 0 })
  })
})

describe('sceneProgress', () => {
  it('equals framer useScene progress: (scrollY − top) / (height − viewport)', () => {
    const scrollY = 1200 + 400 // 400px into scene b, whose pinned span is 800px
    expect(sceneProgress(windows, scrollY / MAX, 'b')).toBeCloseTo(0.5)
  })
  it('is unclamped outside the scene and −1 for an unknown id', () => {
    expect(sceneProgress(windows, 0, 'b')).toBeLessThan(0)
    expect(sceneProgress(windows, 0.5, 'nope')).toBe(-1)
  })
})

describe('offsetWithin', () => {
  it('sums offsets up the offsetParent chain to the ancestor', () => {
    const stage = { offsetParent: null }
    const mid = { offsetLeft: 10, offsetTop: 20, offsetParent: stage }
    const el = { offsetLeft: 5, offsetTop: 7, offsetParent: mid }
    expect(offsetWithin(el, stage)).toEqual({ x: 15, y: 27 })
  })
  it('returns null when the ancestor is not on the chain', () => {
    const el = { offsetLeft: 0, offsetTop: 0, offsetParent: null }
    expect(offsetWithin(el, {})).toBeNull()
  })
})

describe('measureSlots', () => {
  // A width-capped stage (.world-stage) that's pinned but not flush with the
  // viewport's left edge (e.g. margin-inline: auto centering it) — its rect
  // top is scroll-dependent (-1234, mid-scroll) but its rect left is stable.
  const stage = {
    getBoundingClientRect: () => ({ left: 250, top: -1234 }),
  }

  function makeSlotEl(name, { offsetLeft, offsetTop, offsetWidth = 120, offsetHeight = 120 }) {
    return {
      dataset: { slot: name },
      offsetLeft,
      offsetTop,
      offsetWidth,
      offsetHeight,
      offsetParent: stage,
      closest: () => stage,
    }
  }

  it('positions x from the stage rect (viewport-relative) and y from the stage-top-relative offset', () => {
    const visible = makeSlotEl('mercury', { offsetLeft: 586, offsetTop: 40 })
    const doc = { querySelectorAll: () => [visible] }
    const slots = measureSlots(doc)
    // x must include the stage's own viewport offset (250), not just the
    // slot's position within the stage.
    expect(slots.mercury.x).toBe(250 + 586)
    // y stays stage-top-relative: the stage's current rect.top (-1234) is
    // scroll-dependent and must NOT be folded in.
    expect(slots.mercury.y).toBe(40)
    expect(slots.mercury.w).toBe(120)
    expect(slots.mercury.h).toBe(120)
  })

  it('omits a hidden slot (zero size)', () => {
    const hidden = makeSlotEl('venus', { offsetLeft: 0, offsetTop: 0, offsetWidth: 0, offsetHeight: 0 })
    const doc = { querySelectorAll: () => [hidden] }
    const slots = measureSlots(doc)
    expect(slots.venus).toBeUndefined()
  })
})
