import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import App from '../App'
import { readFileSync } from 'node:fs'
import { join, dirname } from 'node:path'
import { fileURLToPath } from 'node:url'

/**
 * App.jsx's first-render effect (App.jsx:60-72) scrolls a deep-linked
 * dossier anchor into view via requestAnimationFrame. Links of the form
 * /#experience already exist in submitted job applications, so this
 * behaviour must keep working.
 */

// Reveal/Skills use framer-motion's whileInView, which constructs a real
// IntersectionObserver. jsdom doesn't provide one, so stub a minimal class —
// same shape used across the rest of this suite (observeInView.test.js,
// useScene.test.jsx).
//
// Rendering the voyage (mode === 'voyage') also mounts Starfield, which
// draws to a <canvas> via getContext('2d'). jsdom has no canvas backend
// (getContext returns null), so stub it with a catch-all no-op 2d context —
// unrelated to what this test verifies, but needed for the voyage to mount
// without throwing.
function makeFakeCanvasContext() {
  return new Proxy(
    {},
    {
      get: (target, prop) => (prop in target ? target[prop] : () => {}),
      set: (target, prop, value) => {
        target[prop] = value
        return true
      },
    },
  )
}

beforeEach(() => {
  vi.stubGlobal(
    'IntersectionObserver',
    class {
      observe() {}
      unobserve() {}
      disconnect() {}
    },
  )
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(makeFakeCanvasContext())
})

afterEach(() => {
  cleanup()
  window.location.hash = ''
})

function setHash(hash) {
  window.location.hash = hash
}

function flushRaf() {
  return new Promise((resolve) => requestAnimationFrame(resolve))
}

describe('App deep-link scroll on first render', () => {
  it('scrolls the hash target into view when a dossier anchor is deep-linked', async () => {
    const scrollIntoView = vi.fn()
    const originalScrollIntoView = Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = scrollIntoView

    setHash('#experience')

    render(<App />)
    await flushRaf()

    expect(scrollIntoView).toHaveBeenCalledTimes(1)
    const experienceSection = document.getElementById('experience')
    expect(scrollIntoView.mock.contexts[0]).toBe(experienceSection)

    Element.prototype.scrollIntoView = originalScrollIntoView
  })

  it('does not scroll and renders the voyage when the hash is #voyage', async () => {
    const scrollIntoView = vi.fn()
    const originalScrollIntoView = Element.prototype.scrollIntoView
    Element.prototype.scrollIntoView = scrollIntoView

    setHash('#voyage')

    const { container } = render(<App />)
    await flushRaf()

    expect(scrollIntoView).not.toHaveBeenCalled()
    // The dossier's #overview main is absent; the voyage renders instead.
    expect(document.getElementById('overview')).toBeNull()
    expect(container.querySelector('.skip-link')).not.toBeNull()

    Element.prototype.scrollIntoView = originalScrollIntoView
  })

  it('does not throw on a malformed hash that is not a valid selector', async () => {
    // The rAF callback runs on jsdom's internal timer loop, not inside this
    // test's call stack, so a thrown SyntaxError wouldn't be caught by a
    // try/expect around render() — it surfaces as a window 'error' event
    // instead. Listen for that directly.
    const onError = vi.fn()
    window.addEventListener('error', onError)

    setHash('#utm_source=x')
    render(<App />)
    await flushRaf()
    // Let jsdom's error-reporting microtask/macrotask settle.
    await new Promise((resolve) => setTimeout(resolve, 0))

    expect(onError).not.toHaveBeenCalled()

    window.removeEventListener('error', onError)
  })
})

describe('voyage code splitting', () => {
  it('does not statically import the voyage into the résumé bundle', () => {
    const src = readFileSync(join(dirname(fileURLToPath(import.meta.url)), '../App.jsx'), 'utf8')
    expect(src).not.toMatch(/^import\s+Journey\b/m)
    expect(src).toMatch(/lazy\(\(\) => import\('\.\/journey\/Journey'\)\)/)
  })

  it('renders the voyage once its lazy chunk resolves', async () => {
    setHash('#voyage')
    const { findByText } = render(<App />)
    expect(await findByText(/Scroll to begin the voyage/i)).toBeTruthy()
  })
})
