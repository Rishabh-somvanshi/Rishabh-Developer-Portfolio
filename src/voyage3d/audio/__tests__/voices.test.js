import { describe, it, expect } from 'vitest'
import { createVoice, VOICE_IDS, MAX_CONTINUOUS_OSCILLATORS } from '../voices'
import { createNoiseBuffer } from '../synth'
import { FakeAudioContext } from './fakeAudioContext'

function setup(id) {
  const ctx = new FakeAudioContext()
  const shared = { white: createNoiseBuffer(ctx, 0.1), brown: createNoiseBuffer(ctx, 0.1, 'brown') }
  return { ctx, voice: createVoice(id, ctx, ctx.destination, shared) }
}

describe('voices', () => {
  it('keeps only the non-tonal SFX voices — the tonal pads and the bed are gone', () => {
    expect([...VOICE_IDS].sort()).toEqual(['origins', 'reentry', 'stars'])
  })

  it.each(VOICE_IDS)('%s stays within the continuous-oscillator budget', (id) => {
    const { ctx, voice } = setup(id)
    voice.start()
    expect(ctx.created.oscillator).toBeLessThanOrEqual(MAX_CONTINUOUS_OSCILLATORS)
  })

  it('starts idempotently and rebuilds after a stop', () => {
    const { ctx, voice } = setup('stars')
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
    const { ctx, voice } = setup('origins')
    voice.trigger('meteor', 0, 0)
    voice.schedule(0)
    voice.setParam('nova', 1, 0)
    expect(ctx.created.oscillator).toBe(0)
    expect(ctx.created.bufferSource).toBe(0)
  })

  it('schedules the pulsar tick inside the lookahead only', () => {
    const { ctx, voice } = setup('stars')
    voice.start()
    const before = ctx.created.oscillator
    voice.schedule(0) // 0.1 s lookahead, PULSAR_PERIOD_S/2 s steps → exactly one tick
    expect(ctx.created.oscillator - before).toBe(1)
  })

  it('whooshes a meteor past on trigger, panned where it flies', () => {
    const { ctx, voice } = setup('origins')
    voice.start()
    const before = ctx.created.bufferSource
    voice.trigger('meteor', -0.6, 0)
    expect(ctx.created.bufferSource - before).toBe(1)
  })

  it('accepts its declared params and ignores unknown ones', () => {
    const { voice } = setup('stars')
    voice.start()
    expect(() => voice.setParam('nova', 0.5, 0)).not.toThrow()
    expect(() => voice.setParam('nope', 1, 0)).not.toThrow()
  })

  it('rumbles reentry heat via its declared param', () => {
    const { voice } = setup('reentry')
    voice.start()
    expect(() => voice.setParam('heat', 0.5, 0)).not.toThrow()
  })
})
