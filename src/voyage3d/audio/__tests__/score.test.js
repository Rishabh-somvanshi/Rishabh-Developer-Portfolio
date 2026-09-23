import { describe, it, expect } from 'vitest'
import {
  voiceGains,
  singularityShape,
  motionLayer,
  novaEnvelope,
  mixFor,
  eventsBetween,
  NEUTRAL_CUTOFF,
  REST_CUTOFF,
} from '../score'
import { createProgressStore } from '../../store'
import { SCENE_IDS } from '../../../data/voyage'

const sumSquares = (a) => a.reduce((s, g) => s + g * g, 0)

describe('voiceGains', () => {
  it('plays only the current scene while dwelling', () => {
    expect(voiceGains({ index: 2, travel: 0 }, 5)).toEqual([0, 0, 1, 0, 0])
  })
  it('crossfades equal-power into the next scene while flying', () => {
    for (const travel of [0.1, 0.5, 0.9]) {
      const g = voiceGains({ index: 2, travel }, 5)
      expect(sumSquares(g)).toBeCloseTo(1)
      expect(g[2]).toBeGreaterThan(0)
      expect(g[3]).toBeGreaterThan(0)
    }
    expect(voiceGains({ index: 2, travel: 0.5 }, 5)[2]).toBeCloseTo(Math.SQRT1_2)
  })
  it('keeps the last scene at full level (nowhere to fly to)', () => {
    expect(voiceGains({ index: 4, travel: 0.7 }, 5)).toEqual([0, 0, 0, 0, 1])
  })
})

describe('singularityShape', () => {
  it('is neutral outside the scene', () => {
    expect(singularityShape(-1)).toEqual({ bend: 0, cutoff: NEUTRAL_CUTOFF, duck: 1 })
    expect(singularityShape(1.2)).toEqual({ bend: 0, cutoff: NEUTRAL_CUTOFF, duck: 1 })
  })
  it('bends a full octave down and closes the filter on the approach', () => {
    const s = singularityShape(0.42)
    expect(s.bend).toBe(-1200)
    expect(s.cutoff).toBe(300)
  })
  it('falls completely silent at the event horizon, then returns', () => {
    expect(singularityShape(0.45).duck).toBe(0)
    expect(singularityShape(0.6).duck).toBe(1)
    expect(singularityShape(0.6).cutoff).toBe(NEUTRAL_CUTOFF)
  })
})

describe('motionLayer', () => {
  it('is quiet and darker at rest, open and whooshing when fast', () => {
    expect(motionLayer(0)).toEqual({ whoosh: 0, cutoff: REST_CUTOFF })
    expect(motionLayer(10)).toEqual({ whoosh: 0.35, cutoff: NEUTRAL_CUTOFF })
  })
})

describe('novaEnvelope', () => {
  it('detonates at 0.26 and is gone by 0.48', () => {
    expect(novaEnvelope(0.1)).toBe(0)
    expect(novaEnvelope(0.26)).toBe(1)
    expect(novaEnvelope(0.5)).toBe(0)
  })
})

describe('mixFor', () => {
  it('is neutral before any windows are measured', () => {
    const mix = mixFor(createProgressStore(), SCENE_IDS)
    expect(mix.duck).toBe(1)
    expect(mix.gains[0]).toBe(1)
    expect(mix.params.stars.nova).toBe(0)
    expect(mix.params.reentry.heat).toBe(0)
  })
})

describe('eventsBetween', () => {
  // mercantile occupies p 0.2..0.4 with its dwell ending at 0.3
  const windows = [{ id: 'mercantile', start: 0.2, dwellEnd: 0.3, end: 0.4 }]
  const pAt = (v) => 0.2 + v * 0.1 // scene progress → p

  it('fires a moon ping when its rise time is crossed forwards', () => {
    expect(eventsBetween(pAt(0.29), pAt(0.31), windows)).toEqual([
      { scene: 'mercantile', at: 0.3, name: 'moon', arg: 0 },
    ])
  })
  it('never fires scrolling backwards', () => {
    expect(eventsBetween(pAt(0.31), pAt(0.29), windows)).toEqual([])
  })
  it('stays silent on a HUD jump (too far in one frame)', () => {
    expect(eventsBetween(0, 0.3, windows)).toEqual([])
  })
})
