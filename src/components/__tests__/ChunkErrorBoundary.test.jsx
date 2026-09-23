import { describe, it, expect, vi, afterEach } from 'vitest'
import { render, cleanup } from '@testing-library/react'
import ChunkErrorBoundary from '../ChunkErrorBoundary'

afterEach(cleanup)

function Boom() {
  throw new Error('chunk load failed')
}

describe('ChunkErrorBoundary', () => {
  it('renders nothing and calls onError once when a child throws', () => {
    // React logs the caught error to console.error; this test asserts on
    // behaviour, not console noise, so silence it.
    vi.spyOn(console, 'error').mockImplementation(() => {})
    const onError = vi.fn()

    const { container } = render(
      <ChunkErrorBoundary onError={onError}>
        <Boom />
      </ChunkErrorBoundary>,
    )

    expect(container.innerHTML).toBe('')
    expect(onError).toHaveBeenCalledTimes(1)
  })

  it('renders children normally when nothing throws', () => {
    const { getByText } = render(
      <ChunkErrorBoundary onError={() => {}}>
        <div>all good</div>
      </ChunkErrorBoundary>,
    )
    getByText('all good')
  })
})
