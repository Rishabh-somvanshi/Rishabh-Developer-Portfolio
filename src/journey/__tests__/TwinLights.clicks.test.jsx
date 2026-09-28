import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import { LazyMotion, domAnimation } from 'framer-motion'
import { hitWhenShown } from '../hooks'
import TwinLights from '../TwinLights'

beforeEach(() => {
  vi.stubGlobal('IntersectionObserver', class { observe() {} disconnect() {} })
})
afterEach(cleanup)

describe('hitWhenShown', () => {
  it('lets a layer take clicks only once it is mostly visible', () => {
    expect(hitWhenShown(0)).toBe('none')
    expect(hitWhenShown(0.4)).toBe('none')
    expect(hitWhenShown(0.6)).toBe('auto')
    expect(hitWhenShown(1)).toBe('auto')
  })
})

describe('TwinLights', () => {
  it('never lets an invisible beat sit on top of the visible one and swallow its link clicks', () => {
    const { container } = render(
      <LazyMotion features={domAnimation}>
        <TwinLights />
      </LazyMotion>,
    )
    const beats = container.querySelectorAll('.beat')
    expect(beats).toHaveLength(2)
    // at the scene's start both beats are hidden (opacity 0), so neither may take clicks
    beats.forEach((b) => expect(b.style.pointerEvents).toBe('none'))
  })
})
