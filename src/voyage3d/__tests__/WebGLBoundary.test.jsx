import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import WebGLBoundary from '../WebGLBoundary'

afterEach(cleanup)

function Boom() {
  throw new Error('context creation failed')
}

describe('WebGLBoundary', () => {
  it('renders children when nothing throws', () => {
    const { getByText } = render(
      <WebGLBoundary onFail={() => {}}>
        <p>world</p>
      </WebGLBoundary>,
    )
    expect(getByText('world')).toBeTruthy()
  })
  it('renders nothing and reports once when a child throws', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const onFail = vi.fn()
    const { container } = render(
      <WebGLBoundary onFail={onFail}>
        <Boom />
      </WebGLBoundary>,
    )
    expect(container.innerHTML).toBe('')
    expect(onFail).toHaveBeenCalledTimes(1)
  })
})
