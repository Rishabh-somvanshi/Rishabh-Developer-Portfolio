import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createAudioEngine, SOUND_KEY } from '../engine'
import { primeAudio, takePrimedContext } from '../context'
import { rateForBend } from '../score'
import { FakeAudioContext, FakeAudio, createFakeAudioElement } from './fakeAudioContext'
import { createProgressStore } from '../../store'

const IDS = ['a', 'b', 'c', 'd', 'e']

function fakeVoiceFactory(log) {
  return (id) => {
    const v = {
      id,
      running: false,
      gain: { gain: { value: 0, setTargetAtTime: vi.fn() }, connect: vi.fn(), disconnect: vi.fn() },
      start: vi.fn(() => {
        if (!v.running) log.push(['start', id])
        v.running = true
      }),
      stop: vi.fn(() => {
        log.push(['stop', id])
        v.running = false
      }),
      schedule: vi.fn(),
      trigger: vi.fn(),
      setParam: vi.fn(),
      dispose: vi.fn(),
    }
    return v
  }
}

// The fake scene ids ('a'..'e') don't overlap real production voice ids, so
// every helper here declares them as the engine's SFX set too — otherwise
// the "scenes with no SFX have no voice" filter would drop all of them.
function make(opts = {}) {
  const log = []
  const engine = createAudioEngine({
    sceneIds: IDS,
    AudioContextImpl: FakeAudioContext,
    voiceFactory: fakeVoiceFactory(log),
    voiceIds: IDS,
    storage: window.localStorage,
    elementFactory: () => createFakeAudioElement('/audio/voyage.mp3'),
    ...opts,
  })
  return { engine, log }
}

function primedPair(element = createFakeAudioElement('/audio/voyage.mp3')) {
  return { ctx: new FakeAudioContext(), element }
}

beforeEach(() => {
  FakeAudioContext.instances = []
  FakeAudio.instances = []
  vi.useFakeTimers()
})
afterEach(() => vi.useRealTimers())

describe('audio engine', () => {
  it('degrades to a silent no-op without Web Audio', () => {
    const engine = createAudioEngine({ sceneIds: IDS, AudioContextImpl: null })
    expect(engine.getSnapshot().state).toBe('unsupported')
    expect(() => {
      engine.startFromGesture()
      engine.setMuted(false)
      engine.update(createProgressStore())
      engine.trigger('a', 'x')
      engine.dispose()
    }).not.toThrow()
  })

  it('waits for a gesture when opened by deep link, then starts one context', () => {
    const { engine } = make()
    expect(engine.getSnapshot().needsGesture).toBe(true)
    expect(FakeAudioContext.instances).toHaveLength(0)
    engine.startFromGesture()
    expect(FakeAudioContext.instances).toHaveLength(1)
    expect(engine.getSnapshot().state).toBe('running')
  })

  it('does not claim "running" when the browser refuses to resume (e.g. a touch scroll swipe: pointerdown → pointercancel is not a granted gesture)', async () => {
    class RefusingAudioContext extends FakeAudioContext {
      constructor() {
        super()
        this.state = 'suspended'
        this.resume = vi.fn(() => Promise.reject(new Error('resume refused')))
      }
    }
    const { engine } = make({ AudioContextImpl: RefusingAudioContext })
    engine.startFromGesture()
    // Flush the rejected resume() promise.
    await Promise.resolve()
    await Promise.resolve()
    expect(engine.getSnapshot().needsGesture).toBe(true)
    expect(engine.getSnapshot().state).not.toBe('running')
  })

  it('adopts the context primed by the entry click instead of making another', () => {
    const primed = primedPair()
    const { engine } = make({ primed })
    expect(FakeAudioContext.instances).toHaveLength(1)
    expect(engine.getSnapshot().state).toBe('running')
  })

  it('honours a stored "off" and stays silent on gestures', () => {
    window.localStorage.setItem(SOUND_KEY, 'off')
    const { engine } = make()
    expect(engine.getSnapshot()).toMatchObject({ muted: true, needsGesture: false })
    engine.startFromGesture()
    expect(FakeAudioContext.instances).toHaveLength(0)
  })

  it('defaults to muted under reduced motion when nothing is stored', () => {
    const { engine } = make({ reducedMotion: true })
    expect(engine.getSnapshot().muted).toBe(true)
  })

  it('mutes with a ramp, then suspends, and remembers the choice', () => {
    const primed = primedPair()
    const { engine } = make({ primed })
    const heard = vi.fn()
    engine.subscribe(heard)
    engine.setMuted(true)
    expect(window.localStorage.getItem(SOUND_KEY)).toBe('off')
    expect(heard).toHaveBeenCalledWith(expect.objectContaining({ muted: true }))
    expect(primed.ctx.suspend).not.toHaveBeenCalled()
    vi.advanceTimersByTime(400)
    expect(primed.ctx.suspend).toHaveBeenCalled()
  })

  it('unmutes by resuming and remembers "on"', () => {
    const primed = primedPair()
    const { engine } = make({ primed })
    engine.setMuted(true)
    vi.advanceTimersByTime(400)
    engine.setMuted(false)
    expect(window.localStorage.getItem(SOUND_KEY)).toBe('on')
    expect(primed.ctx.resume).toHaveBeenCalled()
    expect(engine.getSnapshot().state).toBe('running')
  })

  it('mutes and unmutes the track element alongside the context', () => {
    const primed = primedPair()
    const { engine } = make({ primed })
    engine.setMuted(true)
    vi.advanceTimersByTime(400)
    expect(primed.element.pause).toHaveBeenCalled()
    engine.setMuted(false)
    expect(primed.element.play).toHaveBeenCalled()
  })

  it('keeps live voices to the current scene ±1', () => {
    const { engine, log } = make({ primed: primedPair() })
    const store = createProgressStore()
    store.index = 2
    engine.update(store)
    const started = log.filter(([k]) => k === 'start').map(([, id]) => id)
    expect(started.sort()).toEqual(['b', 'c', 'd'])
    store.index = 4
    engine.update(store)
    vi.advanceTimersByTime(250)
    expect(log).toContainEqual(['stop', 'b'])
    expect(log).toContainEqual(['stop', 'c'])
  })

  it('fades a voice out before stopping it on a jump', () => {
    const { engine, log } = make({ primed: primedPair() })
    const store = createProgressStore()
    store.index = 1
    engine.update(store)
    store.index = 4
    engine.update(store)
    expect(log).not.toContainEqual(['stop', 'a'])
    vi.advanceTimersByTime(250)
    expect(log).toContainEqual(['stop', 'a'])
  })

  it('keeps a voice that returns before its stop fires', () => {
    const { engine, log } = make({ primed: primedPair() })
    const store = createProgressStore()
    store.index = 1
    engine.update(store)
    store.index = 4
    engine.update(store)
    vi.advanceTimersByTime(100)
    store.index = 1
    engine.update(store)
    vi.advanceTimersByTime(300)
    expect(log).not.toContainEqual(['stop', 'a'])
  })

  it('suspends while the tab is hidden and resumes when it returns', () => {
    const primed = primedPair()
    const { engine } = make({ primed })
    engine.onVisibility(true)
    vi.advanceTimersByTime(300)
    expect(primed.ctx.suspend).toHaveBeenCalled()
    engine.onVisibility(false)
    expect(engine.getSnapshot().state).toBe('running')
  })

  it('pauses the track element while the tab is hidden and resumes it when it returns', () => {
    const primed = primedPair()
    const { engine } = make({ primed })
    engine.onVisibility(true)
    vi.advanceTimersByTime(300)
    expect(primed.element.pause).toHaveBeenCalled()
    primed.element.play.mockClear()
    engine.onVisibility(false)
    expect(primed.element.play).toHaveBeenCalled()
  })

  it('fades out and closes the context on dispose', () => {
    const primed = primedPair()
    const { engine } = make({ primed })
    engine.dispose()
    expect(engine.getSnapshot().state).toBe('closed')
    expect(primed.ctx.close).not.toHaveBeenCalled()
    vi.advanceTimersByTime(600)
    expect(primed.ctx.close).toHaveBeenCalled()
  })

  it('pauses and releases the track element on dispose', () => {
    const primed = primedPair()
    const { engine } = make({ primed })
    engine.dispose()
    expect(primed.element.pause).toHaveBeenCalled()
    expect(primed.element.src).not.toBe('')
    vi.advanceTimersByTime(600)
    expect(primed.element.src).toBe('')
    expect(primed.element.load).toHaveBeenCalled()
  })

  it('a late resume does not revive a hidden engine', async () => {
    let resolveResume
    class SlowResumeAudioContext extends FakeAudioContext {
      constructor() {
        super()
        this.state = 'suspended'
        this.resume = vi.fn(
          () =>
            new Promise((resolve) => {
              resolveResume = () => {
                this.state = 'running'
                resolve()
              }
            })
        )
      }
    }
    const { engine } = make({ AudioContextImpl: SlowResumeAudioContext })
    engine.startFromGesture()
    engine.onVisibility(true)

    resolveResume()
    await Promise.resolve()
    await Promise.resolve()

    expect(engine.getSnapshot().state).not.toBe('running')

    const ctx = FakeAudioContext.instances[FakeAudioContext.instances.length - 1]
    vi.advanceTimersByTime(300)
    expect(ctx.suspend).toHaveBeenCalled()
  })

  it('onstatechange cannot revive a hidden engine', () => {
    const primed = primedPair()
    const { engine } = make({ primed })
    engine.onVisibility(true)

    primed.ctx.state = 'running'
    primed.ctx.onstatechange()

    expect(engine.getSnapshot().state).not.toBe('running')
  })

  it('onstatechange promotes a visible, unmuted engine once the context is really running', () => {
    class StaysSuspendedAudioContext extends FakeAudioContext {
      constructor() {
        super()
        this.state = 'suspended'
        this.resume = vi.fn(() => Promise.resolve())
      }
    }
    const { engine } = make({ AudioContextImpl: StaysSuspendedAudioContext })
    engine.startFromGesture()
    expect(engine.getSnapshot().needsGesture).toBe(true)

    const ctx = FakeAudioContext.instances[FakeAudioContext.instances.length - 1]
    ctx.state = 'running'
    ctx.onstatechange()

    expect(engine.getSnapshot().state).toBe('running')
  })
})

describe('primeAudio', () => {
  it('creates a context and the track element once each, hands both over exactly once', () => {
    vi.stubGlobal('AudioContext', FakeAudioContext)
    vi.stubGlobal('Audio', FakeAudio)
    primeAudio()
    primeAudio()
    expect(FakeAudioContext.instances).toHaveLength(1)
    expect(FakeAudio.instances).toHaveLength(1)
    const primed = takePrimedContext()
    expect(primed.ctx).toBe(FakeAudioContext.instances[0])
    expect(primed.element).toBe(FakeAudio.instances[0])
    expect(primed.element.play).toHaveBeenCalled()
    expect(takePrimedContext()).toEqual({ ctx: null, element: null })
    vi.unstubAllGlobals()
  })
})

describe('track playback', () => {
  // The engine's own SFX voice ids ('a'..'e') double as voiceIds here too —
  // these tests are only exercising the track, not the voice crossfade.
  function makeTrackEngine({ track, element = createFakeAudioElement('/audio/voyage.mp3') } = {}) {
    const ctx = new FakeAudioContext()
    const { engine, log } = make({ primed: { ctx, element }, track })
    return { engine, ctx, element, log }
  }

  it('plays a plain full loop when introEnd/dropAt are null, and never touches currentTime', () => {
    const { engine, element } = makeTrackEngine({ track: { src: '/audio/voyage.mp3', introEnd: null, dropAt: null } })
    expect(element.loop).toBe(true)
    const store = createProgressStore()
    store.index = 1
    element.currentTime = 123
    engine.update(store)
    expect(element.currentTime).toBe(123)
  })

  it('wraps the intro loop at introEnd until the first flight', () => {
    const { engine, element } = makeTrackEngine({ track: { src: '/audio/voyage.mp3', introEnd: 10, dropAt: 40 } })
    expect(element.loop).toBe(false)
    const store = createProgressStore() // index 0, travel 0 — still dwelling on launch
    element.currentTime = 9.9
    engine.update(store)
    expect(element.currentTime).toBeCloseTo(9.9)
    element.currentTime = 10
    engine.update(store)
    expect(element.currentTime).toBe(0)
  })

  it('fades out, seeks to dropAt, and fades back in on the first flight into Curo', () => {
    const { engine, element } = makeTrackEngine({ track: { src: '/audio/voyage.mp3', introEnd: 10, dropAt: 40 } })
    const store = createProgressStore()
    store.index = 0
    store.travel = 0.6 // first flight: index 0 && travel > 0.5
    element.currentTime = 5
    engine.update(store)
    // The seek hasn't happened yet — it waits for the fade-out to finish.
    expect(element.currentTime).toBe(5)
    vi.advanceTimersByTime(150)
    expect(element.currentTime).toBe(40)
  })

  it('also drops on flying past the first scene (index >= 1), without needing travel', () => {
    const { engine, element } = makeTrackEngine({ track: { src: '/audio/voyage.mp3', introEnd: 10, dropAt: 40 } })
    const store = createProgressStore()
    store.index = 1
    engine.update(store)
    vi.advanceTimersByTime(150)
    expect(element.currentTime).toBe(40)
  })

  it('loops [dropAt, duration) once dropped', () => {
    const { engine, element } = makeTrackEngine({ track: { src: '/audio/voyage.mp3', introEnd: 10, dropAt: 40 } })
    const store = createProgressStore()
    store.index = 1
    element.duration = 200
    engine.update(store)
    vi.advanceTimersByTime(150)
    expect(element.currentTime).toBe(40)
    element.currentTime = 199.99
    engine.update(store)
    expect(element.currentTime).toBe(40)
  })

  it('bends playbackRate down through the singularity, matching rateForBend', () => {
    const { engine, element } = makeTrackEngine({ track: { src: '/audio/voyage.mp3', introEnd: null, dropAt: null } })
    const store = createProgressStore()
    store.windows = [{ id: 'singularity', start: 0, dwellEnd: 1, end: 1 }]
    store.p = 0.42 // singularityShape(0.42).bend === -1200 (see score.test.js)
    engine.update(store)
    expect(element.playbackRate).toBeCloseTo(rateForBend(-1200))
    expect(element.playbackRate).toBeCloseTo(0.8)
  })

  it('leaves playbackRate at 1 outside the singularity', () => {
    const { engine, element } = makeTrackEngine({ track: { src: '/audio/voyage.mp3', introEnd: null, dropAt: null } })
    const store = createProgressStore() // no windows measured yet
    engine.update(store)
    expect(element.playbackRate).toBe(1)
  })

  it('sets preservesPitch (and webkitPreservesPitch) false so pitch sinks with rate', () => {
    const { element } = makeTrackEngine({ track: { src: '/audio/voyage.mp3', introEnd: null, dropAt: null } })
    expect(element.preservesPitch).toBe(false)
    expect(element.webkitPreservesPitch).toBe(false)
  })

  it('creates and plays the track element inside the gesture on a deep link (no prior priming)', () => {
    const created = []
    const elementFactory = vi.fn((src) => {
      const el = createFakeAudioElement(src)
      created.push(el)
      return el
    })
    const { engine } = make({ elementFactory, track: { src: '/audio/voyage.mp3', introEnd: null, dropAt: null } })
    expect(created).toHaveLength(0)
    engine.startFromGesture()
    expect(elementFactory).toHaveBeenCalledWith('/audio/voyage.mp3')
    expect(created).toHaveLength(1)
    expect(created[0].play).toHaveBeenCalled()
  })

  it('degrades silently on a track element error — SFX and the mute toggle keep working', () => {
    const { engine, element } = makeTrackEngine({ track: { src: '/audio/voyage.mp3', introEnd: 10, dropAt: 40 } })
    expect(() => element._emit('error')).not.toThrow()
    const store = createProgressStore()
    store.index = 1
    expect(() => engine.update(store)).not.toThrow()
    expect(() => engine.trigger('a', 'x')).not.toThrow()
    expect(() => engine.setMuted(true)).not.toThrow()
    vi.advanceTimersByTime(400)
    expect(() => engine.setMuted(false)).not.toThrow()
    expect(engine.getSnapshot().state).toBe('running')
  })

  it('never requests the file until priming or gesture start (not eagerly on construction)', () => {
    const elementFactory = vi.fn((src) => createFakeAudioElement(src))
    make({ elementFactory, AudioContextImpl: null }) // unsupported: never even tries
    expect(elementFactory).not.toHaveBeenCalled()
  })
})
