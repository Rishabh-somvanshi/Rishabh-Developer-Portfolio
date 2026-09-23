import { describe, it, expect, vi, afterEach } from 'vitest'
import { hasWebGL2 } from '../webgl'

afterEach(() => vi.unstubAllGlobals())

describe('hasWebGL2', () => {
  it('is false in jsdom (no WebGL2RenderingContext)', () => {
    expect(hasWebGL2()).toBe(false)
  })
  it('is false when getContext hands back something that is not a WebGL2 context', () => {
    class WebGL2RenderingContext {}
    vi.stubGlobal('WebGL2RenderingContext', WebGL2RenderingContext)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue({})
    expect(hasWebGL2()).toBe(false)
  })
  it('is true for a real WebGL2 context', () => {
    class WebGL2RenderingContext {}
    vi.stubGlobal('WebGL2RenderingContext', WebGL2RenderingContext)
    vi.spyOn(HTMLCanvasElement.prototype, 'getContext').mockReturnValue(new WebGL2RenderingContext())
    expect(hasWebGL2()).toBe(true)
  })
})
