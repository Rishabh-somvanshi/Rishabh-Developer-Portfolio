import { describe, it, expect } from 'vitest'
import { midiToHz, createNoiseBuffer, createImpulse, pad } from '../synth'
import { FakeAudioContext } from './fakeAudioContext'

describe('synth', () => {
  it('converts MIDI notes to Hz', () => {
    expect(midiToHz(69)).toBe(440)
    expect(midiToHz(60)).toBeCloseTo(261.63, 1)
  })
  it('fills noise buffers of the requested length, within [−1, 1]', () => {
    const ctx = new FakeAudioContext()
    for (const color of ['white', 'brown']) {
      const b = createNoiseBuffer(ctx, 1, color)
      const d = b.getChannelData(0)
      expect(d.length).toBe(ctx.sampleRate)
      expect(Math.max(...d.map(Math.abs))).toBeLessThanOrEqual(1)
    }
  })
  it('builds a stereo reverb impulse that decays to silence', () => {
    const ctx = new FakeAudioContext()
    const b = createImpulse(ctx, 1, 2.5)
    expect(b.numberOfChannels).toBe(2)
    const d = b.getChannelData(0)
    expect(Math.abs(d[d.length - 1])).toBeLessThan(0.01)
  })
  it('pads start one oscillator per note and stop them all', () => {
    const ctx = new FakeAudioContext()
    const p = pad(ctx, ctx.destination, { notes: [48, 52, 55] })
    expect(p.oscillators).toHaveLength(3)
    p.oscillators.forEach((o) => expect(o.start).toHaveBeenCalled())
    p.stop()
    p.oscillators.forEach((o) => expect(o.stop).toHaveBeenCalled())
  })
})
