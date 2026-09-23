import { vi } from 'vitest'

/**
 * Just enough Web Audio for unit tests. jsdom has none. Every node accepts
 * connect/disconnect; every AudioParam records its automation calls.
 */
function param(value = 0) {
  const p = { value }
  for (const m of [
    'setValueAtTime',
    'linearRampToValueAtTime',
    'exponentialRampToValueAtTime',
    'setTargetAtTime',
    'cancelScheduledValues',
  ]) {
    p[m] = vi.fn(() => p)
  }
  return p
}

const node = (extra = {}) => ({ connect: vi.fn(), disconnect: vi.fn(), ...extra })

export class FakeAudioContext {
  constructor() {
    this.state = 'running'
    this.currentTime = 0
    this.sampleRate = 8000 // small buffers keep tests fast
    this.destination = node()
    this.created = { oscillator: 0, bufferSource: 0 }
    this.resume = vi.fn(() => {
      this.state = 'running'
      return Promise.resolve()
    })
    this.suspend = vi.fn(() => {
      this.state = 'suspended'
      return Promise.resolve()
    })
    this.close = vi.fn(() => {
      this.state = 'closed'
      return Promise.resolve()
    })
    FakeAudioContext.instances.push(this)
  }
  createGain() {
    return node({ gain: param(1) })
  }
  createOscillator() {
    this.created.oscillator++
    return node({ type: 'sine', frequency: param(440), detune: param(0), start: vi.fn(), stop: vi.fn() })
  }
  createBiquadFilter() {
    return node({ type: 'lowpass', frequency: param(350), Q: param(1) })
  }
  createBufferSource() {
    this.created.bufferSource++
    return node({ buffer: null, loop: false, start: vi.fn(), stop: vi.fn() })
  }
  createBuffer(channels, length, sampleRate) {
    const data = Array.from({ length: channels }, () => new Float32Array(length))
    return { numberOfChannels: channels, length, sampleRate, getChannelData: (c) => data[c] }
  }
  createStereoPanner() {
    return node({ pan: param(0) })
  }
  createConvolver() {
    return node({ buffer: null })
  }
  createDynamicsCompressor() {
    return node({ threshold: param(), knee: param(), ratio: param(), attack: param(), release: param() })
  }
  createAnalyser() {
    return node({ fftSize: 2048, frequencyBinCount: 1024, getByteFrequencyData: vi.fn() })
  }
}
FakeAudioContext.instances = []
