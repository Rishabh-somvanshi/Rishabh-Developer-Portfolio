import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { createAudioEngine, SOUND_KEY } from '../engine'
import { primeAudio, takePrimedContext } from '../context'
import { FakeAudioContext } from './fakeAudioContext'
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

function make(opts = {}) {
  const log = []
  const engine = createAudioEngine({
    sceneIds: IDS,
    AudioContextImpl: FakeAudioContext,
    voiceFactory: fakeVoiceFactory(log),
    storage: window.localStorage,
    ...opts,
  })
  return { engine, log }
}

beforeEach(() => {
  FakeAudioContext.instances = []
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

  it('adopts the context primed by the entry click instead of making another', () => {
    const primed = new FakeAudioContext()
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
    const primed = new FakeAudioContext()
    const { engine } = make({ primed })
    const heard = vi.fn()
    engine.subscribe(heard)
    engine.setMuted(true)
    expect(window.localStorage.getItem(SOUND_KEY)).toBe('off')
    expect(heard).toHaveBeenCalledWith(expect.objectContaining({ muted: true }))
    expect(primed.suspend).not.toHaveBeenCalled()
    vi.advanceTimersByTime(400)
    expect(primed.suspend).toHaveBeenCalled()
  })

  it('unmutes by resuming and remembers "on"', () => {
    const primed = new FakeAudioContext()
    const { engine } = make({ primed })
    engine.setMuted(true)
    vi.advanceTimersByTime(400)
    engine.setMuted(false)
    expect(window.localStorage.getItem(SOUND_KEY)).toBe('on')
    expect(primed.resume).toHaveBeenCalled()
    expect(engine.getSnapshot().state).toBe('running')
  })

  it('keeps live voices to the current scene ±1', () => {
    const { engine, log } = make({ primed: new FakeAudioContext() })
    const store = createProgressStore()
    store.index = 2
    engine.update(store)
    const started = log.filter(([k, id]) => k === 'start' && id !== 'bed').map(([, id]) => id)
    expect(started.sort()).toEqual(['b', 'c', 'd'])
    store.index = 4
    engine.update(store)
    vi.advanceTimersByTime(250)
    expect(log).toContainEqual(['stop', 'b'])
    expect(log).toContainEqual(['stop', 'c'])
  })

  it('fades a voice out before stopping it on a jump', () => {
    const { engine, log } = make({ primed: new FakeAudioContext() })
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
    const { engine, log } = make({ primed: new FakeAudioContext() })
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
    const primed = new FakeAudioContext()
    const { engine } = make({ primed })
    engine.onVisibility(true)
    vi.advanceTimersByTime(300)
    expect(primed.suspend).toHaveBeenCalled()
    engine.onVisibility(false)
    expect(engine.getSnapshot().state).toBe('running')
  })

  it('fades out and closes the context on dispose', () => {
    const primed = new FakeAudioContext()
    const { engine } = make({ primed })
    engine.dispose()
    expect(engine.getSnapshot().state).toBe('closed')
    expect(primed.close).not.toHaveBeenCalled()
    vi.advanceTimersByTime(600)
    expect(primed.close).toHaveBeenCalled()
  })
})

describe('primeAudio', () => {
  it('creates a context once and hands it over exactly once', () => {
    vi.stubGlobal('AudioContext', FakeAudioContext)
    primeAudio()
    primeAudio()
    expect(FakeAudioContext.instances).toHaveLength(1)
    expect(takePrimedContext()).toBe(FakeAudioContext.instances[0])
    expect(takePrimedContext()).toBeNull()
    vi.unstubAllGlobals()
  })
})
