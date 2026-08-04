import { describe, it, expect, vi, beforeEach } from 'vitest'
import { observeInView } from '../observeInView'

let trigger
let observed
let disconnected

beforeEach(() => {
  trigger = null
  observed = []
  disconnected = 0
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      constructor(cb) {
        trigger = cb
      }
      observe(el) {
        observed.push(el)
      }
      disconnect() {
        disconnected++
      }
    },
  )
})

describe('observeInView', () => {
  it('observes the element it is given', () => {
    const el = document.createElement('div')
    observeInView(el, () => {})
    expect(observed).toEqual([el])
  })

  it('reports entering and leaving', () => {
    const seen = []
    observeInView(document.createElement('div'), (v) => seen.push(v))
    trigger([{ isIntersecting: true }])
    trigger([{ isIntersecting: false }])
    expect(seen).toEqual([true, false])
  })

  it('uses the last entry when several arrive at once', () => {
    const seen = []
    observeInView(document.createElement('div'), (v) => seen.push(v))
    trigger([{ isIntersecting: true }, { isIntersecting: false }])
    expect(seen).toEqual([false])
  })

  it('passes rootMargin through and disconnects on cleanup', () => {
    const stop = observeInView(document.createElement('div'), () => {}, {
      rootMargin: '50px',
    })
    stop()
    expect(disconnected).toBe(1)
  })

  it('reports visible and no-ops when IntersectionObserver is missing', () => {
    vi.stubGlobal('IntersectionObserver', undefined)
    const seen = []
    const stop = observeInView(document.createElement('div'), (v) => seen.push(v))
    expect(seen).toEqual([true])
    expect(() => stop()).not.toThrow()
  })

  it('reports visible and no-ops when there is no element', () => {
    const seen = []
    const stop = observeInView(null, (v) => seen.push(v))
    expect(seen).toEqual([true])
    expect(() => stop()).not.toThrow()
  })
})
