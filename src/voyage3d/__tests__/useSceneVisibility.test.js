import { describe, it, expect } from 'vitest'
import { isVisibleIn } from '../useSceneVisibility'

describe('isVisibleIn', () => {
  it('is visible while dwelling in its own scene', () => {
    expect(isVisibleIn([2], { index: 2, travel: 0 })).toBe(true)
  })

  it('is not visible while dwelling in the previous scene', () => {
    expect(isVisibleIn([2], { index: 1, travel: 0 })).toBe(false)
  })

  it('is visible while flying in from the previous scene', () => {
    expect(isVisibleIn([2], { index: 1, travel: 0.3 })).toBe(true)
  })

  it('is not visible for the next scene', () => {
    expect(isVisibleIn([2], { index: 3, travel: 0.3 })).toBe(false)
  })

  it('two-scene lists are visible if either scene matches', () => {
    expect(isVisibleIn([5, 6], { index: 6, travel: 0 })).toBe(true)
    expect(isVisibleIn([5, 6], { index: 5, travel: 0 })).toBe(true)
    expect(isVisibleIn([5, 6], { index: 4, travel: 0.5 })).toBe(true)
    expect(isVisibleIn([5, 6], { index: 7, travel: 0.5 })).toBe(false)
  })
})
