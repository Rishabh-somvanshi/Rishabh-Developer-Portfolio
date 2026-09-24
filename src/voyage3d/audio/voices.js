import { midiToHz, pluck, whoosh, loopNoise } from './synth'
import { PULSAR_PERIOD_S } from '../../data/voyage'

/**
 * Hard cap per voice. Only the non-tonal SFX scenes have a voice at all
 * (origins, stars, reentry) — the tonal pads and the drone bed were removed
 * in R4 once Rick's track took over as the score's bed.
 */
export const MAX_CONTINUOUS_OSCILLATORS = 6

const LOOKAHEAD = 0.1 // seconds of rhythmic notes scheduled ahead of currentTime

/*
 * One definition per scene with non-tonal SFX. build() creates the
 * continuous sound and returns { stop(), params? }. schedule() places
 * upcoming rhythmic notes; trigger() plays one-shot cues. All share the
 * scene's gain node (`out`), which the engine crossfades.
 */
const DEFS = {
  // A-minor debris field, minus the pad: each meteor whooshes past on cue,
  // panned where it flies. No continuous sound while dwelling.
  origins: {
    build: () => ({ stop() {} }),
    trigger(ctx, out, name, arg, now, shared) {
      if (name === 'meteor') whoosh(ctx, out, now, { noise: shared.white, pan: arg ?? 0 })
    },
  },

  // The supernova's sub-drop + noise burst is scrubbed by scroll; the
  // pulsar ticks every half rotation (one tick per beam sweep). The open-
  // fifths pad that used to sit under both is gone.
  stars: {
    build(ctx, out, shared) {
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
