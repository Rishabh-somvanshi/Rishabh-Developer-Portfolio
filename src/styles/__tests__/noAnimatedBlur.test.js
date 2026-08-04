import { describe, it, expect } from 'vitest'
import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { dirname, join } from 'node:path'

// Deliberately not `new URL('../journey.css', import.meta.url)`: under Vite,
// that exact literal pattern is statically rewritten into a dev-server asset
// URL (e.g. http://localhost:3000/...) instead of a file path, which breaks
// readFileSync in the jsdom test environment. Resolving via node:path avoids
// the special-cased syntax.
const cssPath = join(dirname(fileURLToPath(import.meta.url)), '../journey.css')
const css = readFileSync(cssPath, 'utf8')

/** Split a stylesheet into { selector, body } pairs, ignoring at-rule preludes. */
function rules(source) {
  const out = []
  const re = /([^{}]+)\{([^{}]*)\}/g
  let match
  while ((match = re.exec(source))) {
    const selector = match[1].trim()
    if (selector.startsWith('@')) continue
    out.push({ selector, body: match[2] })
  }
  return out
}

describe('journey.css paint cost', () => {
  it('never animates a blurred element', () => {
    const offenders = rules(css)
      .filter((r) => /filter:\s*[^;]*blur\(/.test(r.body) && /animation:/.test(r.body))
      .map((r) => r.selector)
    expect(offenders).toEqual([])
  })

  it('does not use backdrop-filter', () => {
    const offenders = rules(css)
      .filter((r) => /backdrop-filter:/.test(r.body))
      .map((r) => r.selector)
    expect(offenders).toEqual([])
  })
})
