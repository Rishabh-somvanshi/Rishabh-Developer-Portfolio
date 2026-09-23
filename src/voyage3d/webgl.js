/**
 * three r169 renders with WebGL2 only. The instanceof check matters: jsdom
 * (and a stubbed getContext) can hand back an object that merely looks like a
 * context.
 */
export function hasWebGL2() {
  if (typeof window === 'undefined' || typeof window.WebGL2RenderingContext === 'undefined') return false
  try {
    const gl = document.createElement('canvas').getContext('webgl2')
    return gl instanceof window.WebGL2RenderingContext
  } catch {
    return false
  }
}
