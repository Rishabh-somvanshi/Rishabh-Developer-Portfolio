/**
 * Small Web Audio building blocks. Continuous sounds (pad, loopNoise) return
 * a handle to stop; one-shots (pluck, bell, whoosh) schedule their own end
 * and disconnect themselves when finished.
 */
export const midiToHz = (m) => 440 * Math.pow(2, (m - 69) / 12)

export function createNoiseBuffer(ctx, seconds = 2, color = 'white') {
  const length = Math.floor(ctx.sampleRate * seconds)
  const buffer = ctx.createBuffer(1, length, ctx.sampleRate)
  const data = buffer.getChannelData(0)
  let last = 0
  for (let i = 0; i < length; i++) {
    const white = Math.random() * 2 - 1
    if (color === 'brown') {
      last = (last + 0.02 * white) / 1.02
      data[i] = Math.max(-1, Math.min(1, last * 3.5))
    } else {
      data[i] = white
    }
  }
  return buffer
}

/** Generated reverb tail: stereo noise under a power-law decay. Zero bytes downloaded. */
export function createImpulse(ctx, seconds = 3.5, decay = 2.5) {
  const length = Math.floor(ctx.sampleRate * seconds)
  const buffer = ctx.createBuffer(2, length, ctx.sampleRate)
  for (let c = 0; c < 2; c++) {
    const d = buffer.getChannelData(c)
    for (let i = 0; i < length; i++) d[i] = (Math.random() * 2 - 1) * Math.pow(1 - i / length, decay)
  }
  return buffer
}

/** Sustained chord: one oscillator per note, alternately detuned for width, through one lowpass. */
export function pad(ctx, dest, { notes, type = 'triangle', detune = 6, cutoff = 1800, level = 0.1 }) {
  const output = ctx.createGain()
  output.gain.value = level
  const filter = ctx.createBiquadFilter()
  filter.type = 'lowpass'
  filter.frequency.value = cutoff
  filter.connect(output)
  output.connect(dest)
  const oscillators = notes.map((m, i) => {
    const o = ctx.createOscillator()
    o.type = type
    o.frequency.value = midiToHz(m)
    o.detune.value = i % 2 ? detune : -detune
    o.connect(filter)
    o.start()
    return o
  })
  return {
    oscillators,
    output,
    filter,
    stop() {
      for (const o of oscillators) {
        o.stop()
        o.disconnect()
      }
      filter.disconnect()
      output.disconnect()
    },
  }
}

export function pluck(ctx, dest, t, { hz, type = 'triangle', level = 0.06, decay = 0.35 }) {
  const o = ctx.createOscillator()
  const g = ctx.createGain()
  o.type = type
  o.frequency.value = hz
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(level, t + 0.008)
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay)
  o.connect(g)
  g.connect(dest)
  o.start(t)
  o.stop(t + decay + 0.05)
  o.onended = () => {
    o.disconnect()
    g.disconnect()
  }
}

/** Two-operator FM bell: glassy at ratio 3.5, metallic near 1.41. */
export function bell(ctx, dest, t, { hz, ratio = 3.5, index = 2, level = 0.05, decay = 2.2 }) {
  const car = ctx.createOscillator()
  const mod = ctx.createOscillator()
  const modGain = ctx.createGain()
  const g = ctx.createGain()
  car.frequency.value = hz
  mod.frequency.value = hz * ratio
  modGain.gain.setValueAtTime(hz * index, t)
  modGain.gain.exponentialRampToValueAtTime(1, t + decay)
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(level, t + 0.005)
  g.gain.exponentialRampToValueAtTime(0.0001, t + decay)
  mod.connect(modGain)
  modGain.connect(car.frequency)
  car.connect(g)
  g.connect(dest)
  car.start(t)
  mod.start(t)
  car.stop(t + decay + 0.05)
  mod.stop(t + decay + 0.05)
  car.onended = () => {
    for (const n of [car, mod, modGain, g]) n.disconnect()
  }
}

/** A meteor passing: bandpassed noise sweeping up and away, placed in the stereo field. */
export function whoosh(ctx, dest, t, { noise, pan = 0, duration = 1.2, level = 0.16 }) {
  const src = ctx.createBufferSource()
  src.buffer = noise
  src.loop = true
  const bp = ctx.createBiquadFilter()
  bp.type = 'bandpass'
  bp.Q.value = 1.2
  bp.frequency.setValueAtTime(300, t)
  bp.frequency.exponentialRampToValueAtTime(3000, t + duration * 0.45)
  bp.frequency.exponentialRampToValueAtTime(500, t + duration)
  const g = ctx.createGain()
  g.gain.setValueAtTime(0.0001, t)
  g.gain.linearRampToValueAtTime(level, t + duration * 0.4)
  g.gain.exponentialRampToValueAtTime(0.0001, t + duration)
  const p = ctx.createStereoPanner()
  p.pan.value = pan
  src.connect(bp)
  bp.connect(g)
  g.connect(p)
  p.connect(dest)
  src.start(t)
  src.stop(t + duration + 0.05)
  src.onended = () => {
    for (const n of [src, bp, g, p]) n.disconnect()
  }
}

export function loopNoise(ctx, dest, buffer) {
  const src = ctx.createBufferSource()
  src.buffer = buffer
  src.loop = true
  src.connect(dest)
  src.start()
  return src
}
