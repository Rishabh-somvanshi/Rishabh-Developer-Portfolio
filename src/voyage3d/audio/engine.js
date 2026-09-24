import { createVoice, VOICE_IDS } from './voices'
import { createNoiseBuffer, createImpulse } from './synth'
import { mixFor, rateForBend } from './score'
import { getAudioContextClass, createTrackElement } from './context'
import { WORLDS, TRACK } from '../../data/voyage'

/*
 * The soundscape's runtime. Signal graph:
 *
 *   scene voices ──┐
 *   track element ─┤→ bus → lowpass → duck ─┬→ master → limiter → analyser → speakers
 *   motion noise ──┘                        └→ reverb send → convolver ┘
 *
 * The track (Rick's music, an HTMLAudioElement routed in via
 * createMediaElementSource) is the bed now; the old tonal pads and drone bed
 * are gone — only non-tonal SFX voices remain (origins, stars, reentry).
 *
 * The engine owns lifecycle (gesture, mute, visibility, dispose) and turns
 * mixFor() into AudioParam ramps once per frame via update().
 */
export const SOUND_KEY = 'rs.sound'
const MASTER_LEVEL = 0.6
const SCHEDULER_MS = 25
const STOP_DELAY_MS = 200 // Delay before stopping a far voice; the 0.08s gain ramp has settled by then
const TRACK_FADE_MS = 150 // the drop's fade-out/seek/fade-in
const TRACK_FADE_S = TRACK_FADE_MS / 1000
const TRACK_LOOP_EPSILON_S = 0.05 // seek back to dropAt slightly before the real end, not after it

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
  voiceIds = VOICE_IDS,
  track = TRACK,
  elementFactory = createTrackElement,
} = {}) {
  const primedCtx = primed?.ctx ?? null
  const primedElement = primed?.element ?? null
  const pref = readSoundPref(storage)
  let muted = pref ? pref === 'off' : reducedMotion
  let state = AudioContextImpl || primedCtx ? 'idle' : 'unsupported'
  let ctx = null
  let graph = null
  let scheduler = null
  let tabHidden = false
  let trackEl = null
  let trackSource = null
  let dropped = false
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

    const trackGain = context.createGain()
    trackGain.gain.value = 1
    trackGain.connect(bus)

    const shared = { white: createNoiseBuffer(context, 2), brown: createNoiseBuffer(context, 2, 'brown') }
    // Scenes with no SFX simply have no voice (the tonal pads/bed are gone).
    const voices = sceneIds.map((id) => {
      if (!voiceIds.includes(id)) return null
      const panner = context.createStereoPanner()
      panner.pan.value = PAN[id] ?? 0
      panner.connect(bus)
      return voiceFactory(id, context, panner, shared)
    })

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

    return { master, analyser, duck, filter, voices, trackGain, motionGain, motionSrc }
  }

  function fadeTo(level, seconds) {
    if (!graph) return
    const g = graph.master.gain
    const t = ctx.currentTime
    g.cancelScheduledValues(t)
    g.setValueAtTime(g.value, t)
    g.linearRampToValueAtTime(level * MASTER_LEVEL, t + seconds)
  }

  function fadeTrackTo(level, seconds) {
    if (!graph) return
    const g = graph.trackGain.gain
    const t = ctx.currentTime
    g.cancelScheduledValues(t)
    g.setValueAtTime(g.value, t)
    g.linearRampToValueAtTime(level, t + seconds)
  }

  function onTrackError() {
    trackEl?.removeEventListener?.('error', onTrackError)
    trackEl = null
    trackSource = null
  }

  /** Routes the element into the graph. Degrades silently on any failure. */
  function wireElement(el) {
    if (!el) return
    el.preservesPitch = false
    el.webkitPreservesPitch = false
    // Plain full loop when no cues are set; otherwise we own the looping
    // (intro loop, then [dropAt, duration)) by watching currentTime ourselves.
    el.loop = track.introEnd == null || track.dropAt == null
    el.addEventListener?.('error', onTrackError)
    try {
      const source = ctx.createMediaElementSource(el)
      source.connect(graph.trackGain)
      trackEl = el
      trackSource = source
    } catch {
      // createMediaElementSource threw before trackEl was assigned, so
      // onTrackError()'s `trackEl?.removeEventListener(...)` would be a
      // no-op on whatever trackEl already held (usually null) — release the
      // element that actually got the listener, captured here as `el`.
      el.removeEventListener?.('error', onTrackError)
      trackEl = null
      trackSource = null
    }
  }

  function adopt(context, element = null) {
    ctx = context
    graph = build(ctx)
    wireElement(element)
    // The browser can change the context's state on its own (system media
    // controls, another tab claiming exclusive audio, etc). Re-sync our
    // state from it rather than trusting only our own transitions.
    ctx.onstatechange = () => {
      if (muted || state === 'closed') return
      if (ctx.state === 'running' && !tabHidden) {
        state = 'running'
      } else if (ctx.state === 'suspended' && !document.hidden) {
        state = 'idle'
      }
      emit()
    }
    scheduler = setInterval(() => {
      if (state !== 'running') return
      const now = ctx.currentTime
      for (const v of graph.voices) v?.schedule(now)
    }, SCHEDULER_MS)
  }

  function ensureContext() {
    if (ctx) return true
    if (!AudioContextImpl) return false
    try {
      const context = new AudioContextImpl()
      let element = null
      try {
        element = elementFactory(track.src)
      } catch {
        element = null // the track failing to load must never take the engine down
      }
      adopt(context, element)
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
    if (state === 'running') {
      fadeTo(1, fadeSeconds)
      // Restore the track's own gain too — setMuted(true)/onVisibility(true)
      // ramp trackGain to 0 independently of master, and the drop's one-shot
      // fadeTrackTo(1, …) doesn't run outside the cued-track case, so master
      // alone coming back doesn't undo a mute/hide. If a drop fade is
      // in-flight, its own later setTimeout still lands last and still
      // targets 1, so this doesn't fight the end state, only anticipates it.
      if (trackEl) fadeTrackTo(1, fadeSeconds)
      trackEl?.play()?.catch(() => {})
    }
    resumed
      ?.then(() => {
        if (ctx.state === 'running' && !muted && state !== 'closed' && !tabHidden) {
          state = 'running'
          fadeTo(1, fadeSeconds)
          if (trackEl) fadeTrackTo(1, fadeSeconds)
          trackEl?.play()?.catch(() => {})
        }
        emit()
      })
      .catch(() => {})
  }

  if (primedCtx) {
    adopt(primedCtx, primedElement)
    if (muted) {
      ctx.suspend?.()?.catch(() => {})
      trackEl?.pause()
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
        fadeTrackTo(0, 0.3)
        state = 'suspended'
        setTimeout(() => {
          if (muted) {
            ctx.suspend?.()?.catch(() => {})
            trackEl?.pause()
          }
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
      tabHidden = hidden
      if (!ctx || muted || state === 'closed') return
      if (hidden) {
        fadeTo(0, 0.2)
        fadeTrackTo(0, 0.2)
        state = 'suspended'
        setTimeout(() => {
          if (state === 'suspended') {
            ctx.suspend?.()?.catch(() => {})
            trackEl?.pause()
          }
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
        if (!v) return
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
      updateTrack(store, mix.params.singularity?.bend ?? 0)
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
      trackEl?.pause()
      if (!ctx) return
      const closing = ctx
      const g = graph
      const el = trackEl
      fadeTo(0, 0.5)
      fadeTrackTo(0, 0.5)
      setTimeout(() => {
        try {
          g.motionSrc.stop()
        } catch {
          /* already stopped */
        }
        g.voices.forEach((v) => v?.dispose())
        if (el) {
          el.removeEventListener?.('error', onTrackError)
          el.src = ''
          el.load()
        }
        closing.close?.()?.catch(() => {})
      }, 520)
    },
  }

  /**
   * Intro-loop → drop-on-first-flight, then loop [dropAt, duration). Null
   * introEnd/dropAt means the track just plays from the start and loops
   * whole (native element.loop, set once in wireElement).
   */
  function updateTrack(store, bend) {
    if (!trackEl) return
    trackEl.playbackRate = rateForBend(bend)
    const { introEnd, dropAt } = track
    if (introEnd == null || dropAt == null) return
    if (!dropped) {
      if (trackEl.currentTime >= introEnd) trackEl.currentTime = 0
      const flewPastLaunch = store.index === 0 ? store.travel > 0.5 : store.index >= 1
      if (flewPastLaunch) {
        dropped = true
        fadeTrackTo(0, TRACK_FADE_S)
        setTimeout(() => {
          if (state === 'closed' || !trackEl) return
          trackEl.currentTime = dropAt
          fadeTrackTo(1, TRACK_FADE_S)
        }, TRACK_FADE_MS)
      }
    } else if (trackEl.duration && trackEl.currentTime >= trackEl.duration - TRACK_LOOP_EPSILON_S) {
      trackEl.currentTime = dropAt
    }
  }
}
