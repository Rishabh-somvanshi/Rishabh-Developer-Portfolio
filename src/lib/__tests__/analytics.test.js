import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { LIVE_HOST, COUNTER, refFromSearch, eventForLink, track, initAnalytics } from '../analytics'

const scripts = () => [...document.querySelectorAll('script[data-goatcounter]')]

beforeEach(() => {
  delete window.goatcounter
})
afterEach(() => {
  scripts().forEach((s) => s.remove())
  delete window.goatcounter
})

describe('refFromSearch', () => {
  it('reads the ?ref= tag from a shared link', () => {
    expect(refFromSearch('?ref=linkedin')).toBe('linkedin')
    expect(refFromSearch('?x=1&ref=Naukri-Profile')).toBe('naukri-profile')
  })

  it('is null without a tag, and never passes through anything but a short safe code', () => {
    expect(refFromSearch('')).toBeNull()
    expect(refFromSearch('?ref=')).toBeNull()
    expect(refFromSearch('?ref=<script>alert(1)</script>')).toBe('scriptalert1script')
    expect(refFromSearch('?ref=' + 'a'.repeat(200))).toHaveLength(40)
  })
})

describe('eventForLink', () => {
  it('names the clicks worth knowing about', () => {
    expect(eventForLink({ href: 'https://x.netlify.app/Rishabh_Somvanshi_Resume.pdf', download: true })).toBe('resume-download')
    expect(eventForLink({ href: 'https://wedding-command-centre-demo.netlify.app/' })).toBe('open-wedding-demo')
    expect(eventForLink({ href: 'https://expense-tracker-monumental.netlify.app/' })).toBe('open-expense-tracker')
    expect(eventForLink({ href: 'mailto:someone@example.com' })).toBe('contact-email')
    expect(eventForLink({ href: 'https://www.linkedin.com/in/someone' })).toBe('contact-linkedin')
    expect(eventForLink({ href: 'https://github.com/someone' })).toBe('contact-github')
  })

  it('ignores every other link', () => {
    expect(eventForLink({ href: 'https://www.solarsystemscope.com/textures/' })).toBeNull()
    expect(eventForLink({ href: '#work' })).toBeNull()
    expect(eventForLink({ href: '' })).toBeNull()
  })
})

describe('track', () => {
  it('sends a named event once the counter has loaded', () => {
    window.goatcounter = { count: vi.fn() }
    track('voyage-opened')
    expect(window.goatcounter.count).toHaveBeenCalledWith({ path: 'voyage-opened', title: 'voyage-opened', event: true })
  })

  it('does nothing, quietly, when the counter is absent or blocked', () => {
    expect(() => track('voyage-opened')).not.toThrow()
    window.goatcounter = {}
    expect(() => track('voyage-opened')).not.toThrow()
  })
})

describe('initAnalytics', () => {
  it('never loads the counter off the live site (localhost, draft deploys)', () => {
    expect(initAnalytics({ hostname: 'localhost', search: '' })).toBe(false)
    expect(initAnalytics({ hostname: '6ab5114f--rishabh-somvanshi-developer.netlify.app', search: '' })).toBe(false)
    expect(scripts()).toHaveLength(0)
    expect(window.goatcounter).toBeUndefined()
  })

  it('loads it on the live site, counting one clean path whatever the query says', () => {
    expect(initAnalytics({ hostname: LIVE_HOST, search: '' })).toBe(true)
    const [s] = scripts()
    expect(s.dataset.goatcounter).toBe(COUNTER)
    expect(COUNTER).toBe('https://rishabh6969.goatcounter.com/count')
    expect(s.async).toBe(true)
    expect(s.src).toMatch(/^https:\/\/gc\.zgo\.at\/count\.js$/)
    expect(window.goatcounter.path('/?ref=linkedin')).toBe('/')
    expect(window.goatcounter.referrer).toBeUndefined()
  })

  it('reports a ?ref= tag as where the visitor came from', () => {
    initAnalytics({ hostname: LIVE_HOST, search: '?ref=linkedin' })
    expect(window.goatcounter.referrer).toBe('linkedin')
  })

  it('holds events fired before the counter script has loaded, then sends them', () => {
    initAnalytics({ hostname: LIVE_HOST, search: '' })
    track('voyage-opened') // count.js is still downloading
    window.goatcounter.count = vi.fn() // …it arrives and defines count()
    scripts()[0].dispatchEvent(new Event('load'))
    expect(window.goatcounter.count).toHaveBeenCalledTimes(1)
    expect(window.goatcounter.count).toHaveBeenCalledWith({ path: 'voyage-opened', title: 'voyage-opened', event: true })
  })

  it('counts tracked link clicks', () => {
    initAnalytics({ hostname: LIVE_HOST, search: '' })
    window.goatcounter.count = vi.fn()
    const a = document.createElement('a')
    a.href = 'https://wedding-command-centre-demo.netlify.app/'
    a.innerHTML = '<span>demo</span>'
    document.body.appendChild(a)
    a.addEventListener('click', (e) => e.preventDefault())
    a.querySelector('span').click()
    expect(window.goatcounter.count).toHaveBeenCalledWith({ path: 'open-wedding-demo', title: 'open-wedding-demo', event: true })
    a.remove()
  })
})
