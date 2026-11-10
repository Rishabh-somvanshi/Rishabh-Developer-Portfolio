import { describe, it, expect, vi, beforeEach } from 'vitest'
import { warmVoyage, canPrefetch, _resetWarm } from '../voyagePreload'

const setup = () => {
  const images = []
  return {
    images,
    webgl: true, // jsdom has no WebGL; the real default is detected
    loaders: { journey: vi.fn(() => Promise.resolve()), world: vi.fn(() => Promise.resolve()) },
    makeImage: () => {
      const img = {}
      images.push(img)
      return img
    },
  }
}

beforeEach(_resetWarm)

describe('warmVoyage', () => {
  it('starts both code chunks at once, and only once however often it is called', () => {
    const s = setup()
    warmVoyage(s)
    warmVoyage(s)
    expect(s.loaders.journey).toHaveBeenCalledTimes(1)
    expect(s.loaders.world).toHaveBeenCalledTimes(1)
    expect(s.images).toHaveLength(0) // textures only on request
  })

  it('skips the 3D chunk on a browser that cannot run it', () => {
    const s = setup()
    warmVoyage({ ...s, webgl: false, textures: true })
    expect(s.loaders.journey).toHaveBeenCalledTimes(1)
    expect(s.loaders.world).not.toHaveBeenCalled()
    expect(s.images).toHaveLength(0)
  })

  it('fetches the textures when asked — the desktop set, first planet first, once', () => {
    const s = setup()
    warmVoyage({ ...s, textures: true, coarse: false })
    warmVoyage({ ...s, textures: true, coarse: false })
    expect(s.images).toHaveLength(9)
    expect(s.images[0].src).toBe('/textures/neptune.webp')
    expect(s.images.every((i) => i.crossOrigin === 'anonymous')).toBe(true)
    expect(s.loaders.journey).toHaveBeenCalledTimes(1)
  })

  it('fetches the lighter phone set on a phone', () => {
    const s = setup()
    warmVoyage({ ...s, textures: true, coarse: true })
    expect(s.images.map((i) => i.src)).toContain('/textures/jupiter_1k.webp')
    expect(s.images.map((i) => i.src)).not.toContain('/textures/earth_clouds.webp')
  })

  it('can add textures after an earlier code-only warm-up', () => {
    const s = setup()
    warmVoyage(s)
    warmVoyage({ ...s, textures: true, coarse: true })
    expect(s.images).toHaveLength(8)
    expect(s.loaders.world).toHaveBeenCalledTimes(1)
  })

  it('tries again later if a chunk failed to download', async () => {
    const s = setup()
    s.loaders.world = vi.fn(() => Promise.reject(new Error('offline')))
    warmVoyage(s)
    await Promise.resolve()
    await Promise.resolve()
    s.loaders.world = vi.fn(() => Promise.resolve())
    warmVoyage(s)
    expect(s.loaders.world).toHaveBeenCalledTimes(1)
  })
})

describe('canPrefetch', () => {
  it('prefetches by default, including when the browser reports nothing', () => {
    expect(canPrefetch(undefined)).toBe(true)
    expect(canPrefetch({ effectiveType: '4g' })).toBe(true)
  })

  it('never spends data the visitor asked to save, or on a very slow link', () => {
    expect(canPrefetch({ saveData: true, effectiveType: '4g' })).toBe(false)
    expect(canPrefetch({ effectiveType: '2g' })).toBe(false)
    expect(canPrefetch({ effectiveType: 'slow-2g' })).toBe(false)
    expect(canPrefetch({ effectiveType: '3g' })).toBe(false)
  })
})
