import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { LazyMotion, domAnimation } from 'framer-motion'
import Launch from '../Launch'

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} })
})
afterEach(cleanup)

const show = (props) =>
  render(
    <LazyMotion features={domAnimation}>
      <Launch onSkip={() => {}} {...props} />
    </LazyMotion>,
  )

describe('Launch scroll cue', () => {
  it('says the 3D world is still loading until it is on screen', () => {
    const { container } = show({ worldReady: false })
    expect(container.querySelector('.scroll-cue').textContent).toMatch(/Loading the 3D world/i)
    expect(container.querySelector('.scroll-cue').className).toMatch(/is-loading/)
  })

  it('invites the scroll once the world has arrived', () => {
    const { container } = show({ worldReady: true })
    expect(container.querySelector('.scroll-cue').textContent).toMatch(/Scroll to begin the voyage/i)
    expect(container.querySelector('.scroll-cue').className).not.toMatch(/is-loading/)
  })
})
