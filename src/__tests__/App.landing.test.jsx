import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup, fireEvent, act } from '@testing-library/react'

vi.mock('../lib/voyagePreload', async (original) => ({ ...(await original()), warmVoyage: vi.fn() }))

import App from '../App'
import { warmVoyage } from '../lib/voyagePreload'

function fakeCanvasContext() {
  return new Proxy({}, { get: (t, p) => (p in t ? t[p] : () => {}), set: (t, p, v) => ((t[p] = v), true) })
}

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', class { observe() {} unobserve() {} disconnect() {} })
  vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(fakeCanvasContext())
  window.scrollTo = vi.fn()
  window.localStorage.clear()
  window.history.replaceState(null, '', '/')
  warmVoyage.mockClear()
})

afterEach(() => {
  cleanup()
  vi.restoreAllMocks()
  window.history.replaceState(null, '', '/')
})

const voyageCta = (container) => container.querySelector('.hero-cta .btn-voyage')

describe('finding the voyage', () => {
  it('offers it as a real button beside the résumé download, not a footnote', () => {
    const { container } = render(<App />)
    const btn = voyageCta(container)
    expect(btn).not.toBeNull()
    expect(btn.textContent).toMatch(/3D voyage/i)
    expect(container.querySelector('.hero-voyage')).toBeNull()
  })
})

describe('getting the voyage on screen', () => {
  it('starts downloading it when the visitor reaches for the button', () => {
    const { container } = render(<App />)
    fireEvent.pointerEnter(voyageCta(container))
    expect(warmVoyage).toHaveBeenCalledWith(expect.objectContaining({ textures: true }))
  })

  it('downloads everything at once on entry, and says so instead of showing a blank screen', () => {
    const { container, getByRole } = render(<App />)
    fireEvent.click(voyageCta(container))
    expect(warmVoyage).toHaveBeenCalledWith(expect.objectContaining({ textures: true }))
    expect(getByRole('status').textContent).toMatch(/Preparing the voyage/i)
  })

  it('warms the code when the résumé view is idle, unless the visitor is saving data', async () => {
    vi.useFakeTimers()
    render(<App />)
    await act(async () => vi.advanceTimersByTime(6000))
    expect(warmVoyage).toHaveBeenCalledTimes(1)
    expect(warmVoyage.mock.calls[0][0]?.textures).toBeFalsy()
    cleanup()
    warmVoyage.mockClear()
    vi.stubGlobal('navigator', { ...navigator, connection: { saveData: true } })
    render(<App />)
    await act(async () => vi.advanceTimersByTime(6000))
    expect(warmVoyage).not.toHaveBeenCalled()
    vi.unstubAllGlobals()
    vi.useRealTimers()
  })
})

describe('the browser Back button', () => {
  it('returns from the voyage to the résumé view instead of leaving the site', async () => {
    const push = vi.spyOn(window.history, 'pushState')
    const { container, findByText, queryByRole } = render(<App />)
    fireEvent.click(voyageCta(container))
    expect(push).toHaveBeenCalledWith(null, '', '#voyage')
    expect(window.location.hash).toBe('#voyage')
    await findByText(/the voyage/i, { selector: '.scroll-cue span' })

    // Back: the browser restores the previous URL and fires popstate
    window.history.replaceState(null, '', '/')
    await act(async () => window.dispatchEvent(new PopStateEvent('popstate')))
    expect(voyageCta(container)).not.toBeNull()
    expect(queryByRole('status')).toBeNull()
  })

  it('goes forward into the voyage again', async () => {
    const { container, findByText } = render(<App />)
    expect(voyageCta(container)).not.toBeNull()
    window.history.replaceState(null, '', '#voyage')
    await act(async () => window.dispatchEvent(new PopStateEvent('popstate')))
    await findByText(/the voyage/i, { selector: '.scroll-cue span' })
    expect(voyageCta(container)).toBeNull()
  })

  it('labels a remembered voyage in the address bar, so leaving it and pressing Back returns to it', () => {
    window.localStorage.setItem('rs.viewMode', 'voyage')
    render(<App />)
    expect(window.location.hash).toBe('#voyage')
  })
})
