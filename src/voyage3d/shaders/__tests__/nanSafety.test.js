import { describe, it, expect } from 'vitest'

/**
 * GLSL pow(x, y) is undefined for x < 0 — most GPUs return NaN. One NaN pixel
 * in a float render target is smeared across the whole frame by the bloom's
 * mip blur, which is how the pulsar beam's pow(vY, 1.5) blacked out the entire
 * twin-lights scene on MEDIUM/HIGH. Every pow() base must be provably ≥ 0.
 */
const SAFE_BASE = /^(max|clamp|smoothstep|abs)\s*\(/

const modules = import.meta.glob('../*.glsl.js', { eager: true })

function powBases(src) {
  const bases = []
  const re = /\bpow\s*\(/g
  let m
  while ((m = re.exec(src))) {
    let depth = 0
    let i = m.index + m[0].length
    const start = i
    for (; i < src.length; i++) {
      const c = src[i]
      if (c === '(') depth++
      else if (c === ')') depth--
      else if (c === ',' && depth === 0) break
    }
    bases.push(src.slice(start, i).trim())
  }
  return bases
}

describe('shader NaN safety', () => {
  const sources = Object.entries(modules).flatMap(([file, mod]) =>
    Object.entries(mod)
      .filter(([, v]) => typeof v === 'string')
      .map(([name, src]) => [`${file}#${name}`, src]),
  )

  it('finds the shader sources', () => {
    expect(sources.length).toBeGreaterThan(10)
  })

  it('never calls pow() on a base that can go negative', () => {
    const unsafe = sources.flatMap(([id, src]) =>
      powBases(src)
        .filter((b) => !SAFE_BASE.test(b))
        .map((b) => `${id}: pow(${b}, …)`),
    )
    expect(unsafe).toEqual([])
  })
})
