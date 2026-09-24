import { describe, it, expect } from 'vitest'
import {
  SCENE_IDS,
  WORLDS,
  PALETTES,
  MOON_AWARDS,
  MOON_RISE,
  ORIGIN_METEORS,
  METEOR_PASSES,
  PULSAR_PERIOD_S,
  TRACK,
} from '../voyage'
import { experience } from '../content'
import { SCENES } from '../../journey/Hud'

describe('voyage data', () => {
  it('lists the scenes in voyage order, matching the HUD rail', () => {
    expect(SCENE_IDS).toEqual(SCENES.map((s) => s.id))
  })

  it('keeps the four worlds newest-first, each tied to its real résumé entry', () => {
    expect(WORLDS.map((w) => w.id)).toEqual(['curo', 'mercantile', 'vault', 'porcelain'])
    WORLDS.forEach((w, i) => {
      expect(w.exp).toBe(experience[i])
      expect(PALETTES[w.id]).toBeDefined()
    })
  })

  it('gives Mercantile its three award moons, one rise time each', () => {
    const merc = WORLDS.find((w) => w.id === 'mercantile')
    expect(merc.moons).toEqual(MOON_AWARDS)
    expect(MOON_RISE).toHaveLength(MOON_AWARDS.length)
  })

  it('has one amber origin meteor and pans within stereo range', () => {
    expect(ORIGIN_METEORS.filter((m) => m.amber)).toHaveLength(1)
    METEOR_PASSES.forEach((m) => expect(Math.abs(m.pan)).toBeLessThanOrEqual(1))
    expect(PULSAR_PERIOD_S).toBeGreaterThan(0)
  })

  it('points the track at the public audio file, timings unset until the controller analyses it', () => {
    expect(TRACK.src).toBe('/audio/voyage.mp3')
    expect(TRACK.introEnd).toBeNull()
    expect(TRACK.dropAt).toBeNull()
  })
})
