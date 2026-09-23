import { describe, it, expect } from 'vitest'
import { createVoice, VOICE_IDS, MAX_CONTINUOUS_OSCILLATORS } from '../voices'
import { createNoiseBuffer } from '../synth'
import { FakeAudioContext } from './fakeAudioContext'
import { SCENE_IDS } from '../../../data/voyage'

function setup(id) {
  const ctx = new FakeAudioContext()
  const shared = { white: createNoiseBuffer(ctx, 0.1), brown: createNoiseBuffer(ctx, 0.1, 'brown') }
  return { ctx, voice: createVoice(id, ctx, ctx.destination, shared) }
}

describe('voices', () => {
  it('has a voice for every scene plus the bed', () => {
    expect([...VOICE_IDS].sort()).toEqual([...SCENE_IDS, 'bed'].sort())
  })

  it.each(VOICE_IDS)('%s stays within the continuous-oscillator budget', (id) => {
    const { ctx, voice } = setup(id)
    voice.start()
    expect(ctx.created.oscillator).toBeLessThanOrEqual(MAX_CONTINUOUS_OSCILLATORS)
  })

  it('starts idempotently and rebuilds after a stop', () => {
    const { ctx, voice } = setup('home')
    voice.start()
    const once = ctx.created.oscillator
    voice.start()
    expect(ctx.created.oscillator).toBe(once)
    voice.stop()
    expect(voice.running).toBe(false)
    voice.start()
    expect(ctx.created.oscillator).toBe(once * 2)
  })

  it('ignores triggers, schedules and params while stopped', () => {
    const { ctx, voice } = setup('mercantile')
    voice.trigger('moon', 0, 0)
    voice.schedule(0)
    voice.setParam('nova', 1, 0)
    expect(ctx.created.oscillator).toBe(0)
  })

  it('schedules the Mercantile arpeggio inside the lookahead only', () => {
    const { ctx, voice } = setup('mercantile')
    voice.start()
    const before = ctx.created.oscillator
    voice.schedule(0) // 0.1 s lookahead, 0.25 s steps → exactly one note
    expect(ctx.created.oscillator - before).toBe(1)
  })

  it('rings a bell (2 oscillators) for each award moon', () => {
    const { ctx, voice } = setup('mercantile')
    voice.start()
    const before = ctx.created.oscillator
    voice.trigger('moon', 2, 0)
    expect(ctx.created.oscillator - before).toBe(2)
  })

  it('accepts its declared params and ignores unknown ones', () => {
    const { voice } = setup('stars')
    voice.start()
    expect(() => voice.setParam('nova', 0.5, 0)).not.toThrow()
    expect(() => voice.setParam('nope', 1, 0)).not.toThrow()
  })
})
