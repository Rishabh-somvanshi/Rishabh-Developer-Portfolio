import { midiToHz, pad, pluck, bell, whoosh, loopNoise } from './synth'
import { PULSAR_PERIOD_S } from '../../data/voyage'

/** Hard cap per voice; the engine runs at most 3 scene voices + the bed (≤ 24 total). */
export const MAX_CONTINUOUS_OSCILLATORS = 6

const pick = (arr) => arr[Math.floor(Math.random() * arr.length)]
const LOOKAHEAD = 0.1 // seconds of rhythmic notes scheduled ahead of currentTime

/*
 * One definition per scene. build() creates the continuous sound and returns
 * { stop(), params? }. schedule() places upcoming rhythmic notes; trigger()
 * plays one-shot cues. All share the scene's gain node (`out`), which the
 * engine crossfades.
 */
const DEFS = {
  bed: {
    build: (ctx, out) => pad(ctx, out, { notes: [36, 43], type: 'sine', cutoff: 600, level: 0.05 }),
  },

  // Near silence: sparse high star-glints.
  launch: {
    build: () => ({ stop() {} }),
    schedule(ctx, out, state, now) {
      if (now < (state.next ?? now)) return
      pluck(ctx, out, now + 0.05, { hz: midiToHz(pick([84, 88, 91, 95])), type: 'sine', level: 0.03, decay: 1.2 })
      state.next = now + 1.5 + Math.random() * 2.5
    },
  },

  // Warm Cmaj7; a 1 Hz swell (60 bpm), the same heartbeat as Curo's aura.
  curo: {
    build(ctx, out) {
      const p = pad(ctx, out, { notes: [48, 52, 55, 59], cutoff: 1400, level: 0.1 })
      const lfo = ctx.createOscillator()
      lfo.frequency.value = 1
      const depth = ctx.createGain()
      depth.gain.value = 0.04
      lfo.connect(depth)
      depth.connect(p.output.gain)
      lfo.start()
      return {
        stop() {
          lfo.stop()
          lfo.disconnect()
          depth.disconnect()
          p.stop()
        },
      }
    },
  },

  // Brighter Fmaj7 bed + a faint 8th-note market pulse; one bell per award moon.
  mercantile: {
    build: (ctx, out) => pad(ctx, out, { notes: [53, 57, 60, 64], type: 'sawtooth', cutoff: 1100, level: 0.06 }),
    schedule(ctx, out, state, now) {
      const ARP = [72, 76, 79, 81]
      state.step ??= 0
      state.next = Math.max(state.next ?? now, now)
      while (state.next < now + LOOKAHEAD) {
        pluck(ctx, out, state.next, { hz: midiToHz(ARP[state.step % ARP.length]), level: 0.035, decay: 0.22 })
        state.step++
        state.next += 0.25
      }
    },
    trigger(ctx, out, name, arg, now) {
      if (name === 'moon') bell(ctx, out, now, { hz: midiToHz([84, 88, 91][arg] ?? 84), level: 0.07 })
    },
  },

  // Low, tense cluster (A1 · B♭1 · E2); a metallic ping as the shield sweeps.
  vault: {
    build: (ctx, out) => pad(ctx, out, { notes: [33, 34, 40], type: 'sawtooth', detune: 3, cutoff: 380, level: 0.09 }),
    trigger(ctx, out, name, _arg, now) {
      if (name === 'shield') bell(ctx, out, now, { hz: midiToHz(81), ratio: 1.41, index: 4, level: 0.06, decay: 1.6 })
    },
  },

  // The still world: sparse glassy bells, no rhythm at all.
  porcelain: {
    build: (ctx, out) => pad(ctx, out, { notes: [52], type: 'sine', cutoff: 900, level: 0.03 }),
    schedule(ctx, out, state, now) {
      if (now < (state.next ?? now)) return
      bell(ctx, out, now + 0.05, { hz: midiToHz(pick([76, 79, 83, 86])), ratio: 3.5, level: 0.05, decay: 2.5 })
      state.next = now + 2 + Math.random() * 3
    },
  },

  // A-minor debris field; each meteor whooshes past, panned where it flies.
  origins: {
    build: (ctx, out) => pad(ctx, out, { notes: [45, 48, 52], cutoff: 900, level: 0.07 }),
    trigger(ctx, out, name, arg, now, shared) {
      if (name === 'meteor') whoosh(ctx, out, now, { noise: shared.white, pan: arg ?? 0 })
    },
  },

  // Open fifths; the supernova's sub-drop + noise burst is scrubbed by scroll,
  // the pulsar ticks every half rotation (one tick per beam sweep).
  stars: {
    build(ctx, out, shared) {
      const p = pad(ctx, out, { notes: [48, 55, 62], cutoff: 1600, level: 0.07 })
      const sub = ctx.createOscillator()
      sub.type = 'sine'
      sub.frequency.value = 55
      const subGain = ctx.createGain()
      subGain.gain.value = 0
      sub.connect(subGain)
      subGain.connect(out)
      sub.start()
      const bp = ctx.createBiquadFilter()
      bp.type = 'bandpass'
      bp.frequency.value = 800
      const noiseGain = ctx.createGain()
      noiseGain.gain.value = 0
      const noise = loopNoise(ctx, bp, shared.white)
      bp.connect(noiseGain)
      noiseGain.connect(out)
      return {
        params: {
          nova(v, now) {
            subGain.gain.setTargetAtTime(v * 0.35, now, 0.05)
            sub.frequency.setTargetAtTime(55 - 25 * v, now, 0.1)
            noiseGain.gain.setTargetAtTime(v * 0.12, now, 0.05)
          },
        },
        stop() {
          sub.stop()
          noise.stop()
          for (const n of [sub, subGain, noise, bp, noiseGain]) n.disconnect()
          p.stop()
        },
      }
    },
    schedule(ctx, out, state, now) {
      state.next = Math.max(state.next ?? now, now)
      while (state.next < now + LOOKAHEAD) {
        pluck(ctx, out, state.next, { hz: midiToHz(96), type: 'sine', level: 0.02, decay: 0.06 })
        state.next += PULSAR_PERIOD_S / 2
      }
    },
  },

  // D-minor pad whose pitch the engine bends down an octave on the approach.
  singularity: {
    build(ctx, out) {
      const p = pad(ctx, out, { notes: [50, 53, 57, 60], cutoff: 1200, level: 0.09 })
      const base = p.oscillators.map((o) => o.detune.value)
      return {
        params: {
          bend(cents, now) {
            p.oscillators.forEach((o, i) => o.detune.setTargetAtTime(base[i] + cents, now, 0.1))
          },
        },
        stop: p.stop,
      }
    },
  },

  // Rumble that rises with the warp.
  reentry: {
    build(ctx, out, shared) {
      const heat = ctx.createGain()
      heat.gain.value = 0
      heat.connect(out)
      const lp = ctx.createBiquadFilter()
      lp.type = 'lowpass'
      lp.frequency.value = 220
      lp.connect(heat)
      const rumble = loopNoise(ctx, lp, shared.brown)
      const sub = ctx.createOscillator()
      sub.frequency.value = 41
      sub.connect(heat)
      sub.start()
      return {
        params: {
          heat(v, now) {
            heat.gain.setTargetAtTime(v * 0.3, now, 0.08)
          },
        },
        stop() {
          rumble.stop()
          sub.stop()
          for (const n of [rumble, sub, lp, heat]) n.disconnect()
        },
      }
    },
  },

  // Resolution: the full, warm Cmaj9 the whole score was pointing toward.
  home: {
    build: (ctx, out) => pad(ctx, out, { notes: [48, 55, 59, 62, 64], cutoff: 2200, level: 0.09 }),
  },
}

export const VOICE_IDS = Object.keys(DEFS)

export function createVoice(id, ctx, dest, shared) {
  const def = DEFS[id]
  if (!def) throw new Error(`unknown voice: ${id}`)
  const gain = ctx.createGain()
  gain.gain.value = 0
  gain.connect(dest)
  let nodes = null
  let state = {}

  return {
    id,
    gain,
    get running() {
      return nodes !== null
    },
    start() {
      if (nodes) return
      state = {}
      nodes = def.build(ctx, gain, shared)
    },
    stop() {
      if (!nodes) return
      nodes.stop()
      nodes = null
    },
    schedule(now) {
      if (nodes && def.schedule) def.schedule(ctx, gain, state, now)
    },
    trigger(name, arg, now) {
      if (nodes && def.trigger) def.trigger(ctx, gain, name, arg, now, shared)
    },
    setParam(name, value, now) {
      nodes?.params?.[name]?.(value, now)
    },
    dispose() {
      this.stop()
      gain.disconnect()
    },
  }
}
