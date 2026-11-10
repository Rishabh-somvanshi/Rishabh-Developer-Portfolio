import { describe, it, expect } from 'vitest'
import { existsSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'
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

  it('points the track at the public audio file, with a whole-bar intro loop before the drop', () => {
    expect(TRACK.src).toBe('/audio/voyage.mp3')
    const BAR_S = 3.2
    expect(TRACK.introEnd / BAR_S).toBeCloseTo(Math.round(TRACK.introEnd / BAR_S), 5)
    expect(TRACK.dropAt).toBeGreaterThan(TRACK.introEnd)
  })
})

describe('voyageTextures', () => {
  const onDisk = (url) => existsSync(join(dirname(fileURLToPath(import.meta.url)), '../../../public', url))

  it('gives a desktop the full set, clouds included, every file present', async () => {
    const { voyageTextures } = await import('../voyage')
    const t = voyageTextures({ coarse: false })
    expect(Object.keys(t).sort()).toEqual(['clouds', 'curo', 'earthDay', 'earthNight', 'mercantile', 'moon', 'porcelain', 'ring', 'vault'])
    Object.values(t).forEach((url) => expect(onDisk(url), url).toBe(true))
  })

  it('gives a phone lighter files and no cloud map (its tier never draws clouds)', async () => {
    const { voyageTextures } = await import('../voyage')
    const t = voyageTextures({ coarse: true })
    expect(t.clouds).toBeNull()
    expect(t.mercantile).toBe('/textures/jupiter_1k.webp')
    expect(t.moon).toBe('/textures/moon_sm.webp')
    Object.values(t).filter(Boolean).forEach((url) => expect(onDisk(url), url).toBe(true))
  })

  it('lists what to fetch first-planet-first, skipping the missing ones', async () => {
    const { voyageTextures, textureUrls } = await import('../voyage')
    const urls = textureUrls(voyageTextures({ coarse: true }))
    expect(urls[0]).toBe('/textures/neptune.webp')
    expect(urls).not.toContain(null)
    expect(urls).toHaveLength(8)
    expect(textureUrls(voyageTextures({ coarse: false }))).toHaveLength(9)
  })
})
