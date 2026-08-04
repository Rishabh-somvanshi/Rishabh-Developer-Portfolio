import { describe, it, expect, beforeEach } from 'vitest'
import {
  DOSSIER_HASHES,
  VOYAGE_HASH,
  STORAGE_KEY,
  resolveInitialMode,
  readStoredMode,
  writeStoredMode,
} from '../viewMode'

describe('resolveInitialMode', () => {
  const base = { hash: '', stored: null, prefersReducedMotion: false }

  it('defaults to the dossier when nothing else applies', () => {
    expect(resolveInitialMode(base)).toBe('work')
  })

  it('honours an explicit #voyage hash', () => {
    expect(resolveInitialMode({ ...base, hash: '#voyage' })).toBe('voyage')
  })

  it('lets an explicit hash beat a conflicting stored preference', () => {
    expect(resolveInitialMode({ ...base, hash: '#voyage', stored: 'work' })).toBe('voyage')
    expect(resolveInitialMode({ ...base, hash: '#overview', stored: 'voyage' })).toBe('work')
  })

  it('routes every dossier anchor to the dossier', () => {
    for (const hash of DOSSIER_HASHES) {
      expect(resolveInitialMode({ ...base, hash })).toBe('work')
    }
  })

  it('forces the dossier for reduced-motion users even with a stored voyage preference', () => {
    expect(
      resolveInitialMode({ ...base, stored: 'voyage', prefersReducedMotion: true }),
    ).toBe('work')
  })

  it('still honours an explicit #voyage hash over reduced-motion', () => {
    expect(
      resolveInitialMode({ ...base, hash: VOYAGE_HASH, prefersReducedMotion: true }),
    ).toBe('voyage')
  })

  it('falls back to a stored preference when no hash is present', () => {
    expect(resolveInitialMode({ ...base, stored: 'voyage' })).toBe('voyage')
    expect(resolveInitialMode({ ...base, stored: 'work' })).toBe('work')
  })

  it('ignores an unrecognised stored value', () => {
    expect(resolveInitialMode({ ...base, stored: 'nonsense' })).toBe('work')
  })

  it('ignores an unrecognised hash', () => {
    expect(resolveInitialMode({ ...base, hash: '#nope' })).toBe('work')
  })
})

describe('stored mode', () => {
  beforeEach(() => window.localStorage.clear())

  it('round-trips a value', () => {
    writeStoredMode('voyage')
    expect(window.localStorage.getItem(STORAGE_KEY)).toBe('voyage')
    expect(readStoredMode()).toBe('voyage')
  })

  it('returns null when nothing is stored', () => {
    expect(readStoredMode()).toBeNull()
  })

  it('returns null for a corrupt stored value', () => {
    window.localStorage.setItem(STORAGE_KEY, 'garbage')
    expect(readStoredMode()).toBeNull()
  })

  it('does not throw when storage is unavailable', () => {
    const original = Object.getOwnPropertyDescriptor(window, 'localStorage')
    Object.defineProperty(window, 'localStorage', {
      configurable: true,
      get() {
        throw new Error('blocked')
      },
    })
    expect(() => writeStoredMode('work')).not.toThrow()
    expect(readStoredMode()).toBeNull()
    Object.defineProperty(window, 'localStorage', original)
  })
})
