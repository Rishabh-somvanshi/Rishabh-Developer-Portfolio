import { createVoice } from './voices'
import { createNoiseBuffer, createImpulse } from './synth'
import { mixFor } from './score'
import { getAudioContextClass } from './context'
import { WORLDS } from '../../data/voyage'

/*
 * The soundscape's runtime. Signal graph:
 *
 *   scene voices ─┐
 *   bed drone ────┤→ bus → lowpass → duck ─┬→ master → limiter → analyser → speakers
 *   motion noise ─┘                        └→ reverb send → convolver ┘
 *
 * The engine owns lifecycle (gesture, mute, visibility, dispose) and turns
 * mixFor() into AudioParam ramps once per frame via update().
 */
export const SOUND_KEY = 'rs.sound'
const MASTER_LEVEL = 0.6
const SCHEDULER_MS = 25
const STOP_DELAY_MS = 200 // Delay before stopping a far voice; the 0.08s gain ramp has settled by then

/** Each world's voice sits on its planet's side of the screen (unflipped worlds are drawn on the left). */
const PAN = Object.fromEntries(WORLDS.map((w) => [w.id, w.flip ? 0.3 : -0.3]))

function defaultStorage() {
  try {
    return window.localStorage
  } catch {
    return null
  }
}

export function readSoundPref(storage) {
  try {
    const v = storage?.getItem(SOUND_KEY)
    return v === 'on' || v === 'off' ? v : null
  } catch {
    return null
  }
}

function writeSoundPref(storage, value) {
  try {
    storage?.setItem(SOUND_KEY, value)
  } catch {
    /* ignore — persistence is a nicety, not a requirement */
  }
}

export function createAudioEngine({
  sceneIds,
  AudioContextImpl = getAudioContextClass(),
  primed = null,
  storage = defaultStorage(),
  reducedMotion = false,
  voiceFactory = createVoice,
} = {}) {
  const pref = readSoundPref(storage)
  let muted = pref ? pref === 'off' : reducedMotion
  let state = AudioContextImpl || primed ? 'idle' : 'unsupported'
  let ctx = null
  let graph = null
  let scheduler = null
  const listeners = new Set()
  const pendingStops = new Map() // voice → setTimeout id

  const snapshot = () => ({ muted, state, needsGesture: state === 'idle' && !muted })
  const emit = () => {
    const s = snapshot()
    listeners.forEach((fn) => fn(s))
  }

  function build(context) {
    const master = context.createGain()
    master.gain.value = 0
    const limiter = context.createDynamicsCompressor()
    limiter.threshold.value = -6
    limiter.knee.value = 0
    limiter.ratio.value = 20
    limiter.attack.value = 0.003
    limiter.release.value = 0.25
    const analyser = context.createAnalyser()
    analyser.fftSize = 64
    master.connect(limiter)
    limiter.connect(analyser)
    analyser.connect(context.destination)

    const duck = context.createGain()
    duck.connect(master)
    const send = context.createGain()
    send.gain.value = 0.35
    const reverb = context.createConvolver()
    reverb.buffer = createImpulse(context)
    duck.connect(send)
    send.connect(reverb)
    reverb.connect(master)

    const filter = context.createBiquadFilter()
    filter.type = 'lowpass'
    filter.frequency.value = 12000
    filter.connect(duck)
    const bus = context.createGain()
    bus.connect(filter)

    const shared = { white: createNoiseBuffer(context, 2), brown: createNoiseBuffer(context, 2, 'brown') }
    const voices = sceneIds.map((id) => {
      const panner = context.createStereoPanner()
      panner.pan.value = PAN[id] ?? 0
      panner.connect(bus)
      return voiceFactory(id, context, panner, shared)
    })
    const bed = voiceFactory('bed', context, bus, shared)
    bed.start()
    bed.gain.gain.value = 1

    const motionSrc = context.createBufferSource()
    motionSrc.buffer = shared.white
    motionSrc.loop = true
    const motionFilter = context.createBiquadFilter()
    motionFilter.type = 'bandpass'
    motionFilter.frequency.value = 900
    motionFilter.Q.value = 0.7
    const motionGain = context.createGain()
    motionGain.gain.value = 0
    motionSrc.connect(motionFilter)
    motionFilter.connect(motionGain)
    motionGain.connect(bus)
    motionSrc.start()

    return { master, analyser, duck, filter, voices, bed, motionGain, motionSrc }
  }

  function fadeTo(level, seconds) {
    if (!graph) return
    const g = graph.master.gain
    const t = ctx.currentTime
    g.cancelScheduledValues(t)
    g.setValueAtTime(g.value, t)
    g.linearRampToValueAtTime(level * MASTER_LEVEL, t + seconds)
  }

  function adopt(context) {
    ctx = context
    graph = build(ctx)
    // The browser can change the context's state on its own (system media
    // controls, another tab claiming exclusive audio, etc). Re-sync our
    // state from it rather than trusting only our own transitions.
    ctx.onstatechange = () => {
      if (muted || state === 'closed') return
      if (ctx.state === 'running') {
        state = 'running'
      } else if (ctx.state === 'suspended' && !document.hidden) {
        state = 'idle'
      }
      emit()
    }
    scheduler = setInterval(() => {
      if (state !== 'running') return
      const now = ctx.currentTime
      for (const v of graph.voices) v.schedule(now)
    }, SCHEDULER_MS)
  }

  function ensureContext() {
    if (ctx) return true
    if (!AudioContextImpl) return false
    try {
      adopt(new AudioContextImpl())
      return true
    } catch {
      state = 'unsupported'
      return false
    }
  }

  function play(fadeSeconds) {
    // Browsers grant audio activation only on certain gesture events
    // (pointerup/click/keydown — not pointerdown, and not every event on
    // touch). resume() can be refused; when it is, ctx.state stays whatever
    // it already was, and we must not claim 'running' anyway.
    const resumed = ctx.resume?.()
    state = ctx.state === 'running' ? 'running' : 'idle'
    if (state === 'running') fadeTo(1, fadeSeconds)
    resumed
      ?.then(() => {
        if (ctx.state === 'running' && !muted && state !== 'closed') {
          state = 'running'
          fadeTo(1, fadeSeconds)
        }
        emit()
      })
      .catch(() => {})
  }

  if (primed) {
    adopt(primed)
    if (muted) {
      ctx.suspend?.()?.catch(() => {})
      state = 'suspended'
    } else {
      play(3)
    }
  }

  function setMuted(next) {
    if (state === 'closed' || state === 'unsupported') return
    muted = next
    writeSoundPref(storage, next ? 'off' : 'on')
    if (next) {
      if (ctx && state === 'running') {
        fadeTo(0, 0.3)
        state = 'suspended'
        setTimeout(() => {
          if (muted) ctx.suspend?.()?.catch(() => {})
        }, 320)
      }
    } else if (ensureContext()) {
      play(0.3)
    }
    emit()
  }

  return {
    getSnapshot: snapshot,
    subscribe(fn) {
      listeners.add(fn)
      return () => listeners.delete(fn)
    },
    getAnalyser: () => graph?.analyser ?? null,

    startFromGesture() {
      if (muted || state === 'running' || state === 'closed' || state === 'unsupported') return
      if (ensureContext()) play(3)
      emit()
    },

    setMuted,

    toggleMuted() {
      setMuted(!muted)
    },

    onVisibility(hidden) {
      if (!ctx || muted || state === 'closed') return
      if (hidden) {
        fadeTo(0, 0.2)
        state = 'suspended'
        setTimeout(() => {
          if (state === 'suspended') ctx.suspend?.()?.catch(() => {})
        }, 220)
      } else {
        play(0.5)
      }
      emit()
    },

    update(store) {
      if (!graph || state !== 'running') return
      const now = ctx.currentTime
      const mix = mixFor(store, sceneIds)
      graph.voices.forEach((v, i) => {
        const near = Math.abs(i - store.index) <= 1
        if (near) {
          v.start()
          // If there was a pending stop, cancel it and restart the voice
          if (pendingStops.has(v)) {
            clearTimeout(pendingStops.get(v))
            pendingStops.delete(v)
          }
        } else if (v.running && !pendingStops.has(v)) {
          // Schedule a delayed stop for this voice
          const timeoutId = setTimeout(() => {
            // Only stop if voice is still far and engine is still running
            if (!pendingStops.has(v)) return
            const stillFar = Math.abs(graph.voices.indexOf(v) - store.index) > 1
            if (stillFar && state !== 'closed' && v.running) {
              v.stop()
            }
            pendingStops.delete(v)
          }, STOP_DELAY_MS)
          pendingStops.set(v, timeoutId)
        }
        v.gain.gain.setTargetAtTime(near ? mix.gains[i] : 0, now, 0.08)
      })
      graph.filter.frequency.setTargetAtTime(mix.cutoff, now, 0.1)
      graph.duck.gain.setTargetAtTime(mix.duck, now, 0.05)
      graph.motionGain.gain.setTargetAtTime(mix.whoosh, now, 0.1)
      for (const [id, params] of Object.entries(mix.params)) {
        const v = graph.voices[sceneIds.indexOf(id)]
        if (!v) continue
        for (const [name, value] of Object.entries(params)) v.setParam(name, value, now)
      }
    },

    trigger(sceneId, name, arg) {
      if (!graph || state !== 'running') return
      graph.voices[sceneIds.indexOf(sceneId)]?.trigger(name, arg, ctx.currentTime)
    },

    dispose() {
      if (state === 'closed') return
      clearInterval(scheduler)
      // Clear all pending stop timers
      pendingStops.forEach((timeoutId) => clearTimeout(timeoutId))
      pendingStops.clear()
      state = 'closed'
      emit()
      if (!ctx) return
      const closing = ctx
      const g = graph
      fadeTo(0, 0.5)
      setTimeout(() => {
        try {
          g.motionSrc.stop()
        } catch {
          /* already stopped */
        }
        g.voices.forEach((v) => v.dispose())
        g.bed.dispose()
        closing.close?.()?.catch(() => {})
      }, 520)
    },
  }
}
